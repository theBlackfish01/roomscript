import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Only protocol identifiers and explicitly safe diagnostics enter the report.
// Add new model identifiers here when adding a measured probe to ProbeLab.
const models = new Set([
  "gpt-4.1-nano", "gpt-4o-mini", "gpt-4o-mini-tts", "tts-1",
  "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite",
  "imagen-3.0-generate-002",
]);
const detailCodes = new Set([
  "schema_valid", "schema_invalid", "schema_mismatch", "Unauthenticated",
  "rate_limit", "not_found", "model_not_found", "configuration_not_supported", "permission_denied", "deadline", "timeout",
  "no_camera_frames", "request_failed", "no_image_or_refusal", "image_decode",
  "unsupported_api", "ok", "parallel_ok", "4_schema_valid;gpt-4o-mini",
]);

function safeName(name) {
  const match = /^P-[a-h](?::([a-z0-9.-]+))?$/.exec(name);
  return !!match && (!match[1] || models.has(match[1]));
}

function safeDetail(detail) {
  if (detailCodes.has(detail)) return detail;
  if (/^unsupported_api(?:;|$)/.test(detail)) return "unsupported_api";
  if (/^audio_loaded;playing=(true|false)$/.test(detail)) return detail;
  if (/^texture_displayed;\d{1,5}x\d{1,5}$/.test(detail)) return detail;
  if (/^frames=\d{1,6};\d{1,5}x\d{1,5}$/.test(detail)) return detail;
  return "redacted_detail";
}

/** Nearest-rank percentile: sorted[ceil(p * N) - 1], for 0 < p <= 1. */
export function nearestRank(values, percentile) {
  if (!(percentile > 0 && percentile <= 1)) throw new Error("Percentile must be in (0, 1].");
  if (values.some(value => !Number.isFinite(value) || value < 0)) throw new Error("Invalid latency sample.");
  if (!values.length) return null;
  return [...values].sort((a, b) => a - b)[Math.ceil(percentile * values.length) - 1];
}

/** A byte offset within a line discards that partial line; complete next lines remain. */
export function logFromByte(bytes, fromByte = 0) {
  if (!Number.isSafeInteger(fromByte) || fromByte < 0 || fromByte > bytes.length) {
    throw new Error("Byte offset must be an integer within the input file.");
  }
  let start = fromByte;
  if (start > 0 && bytes[start - 1] !== 10) {
    const newline = bytes.indexOf(10, start);
    start = newline === -1 ? bytes.length : newline + 1;
  }
  return bytes.subarray(start).toString("utf8");
}

export function summarizeProbes(input, { startMarker } = {}) {
  let lines = input.split(/\r?\n/);
  let filteredToMarker = false;
  if (startMarker !== undefined) {
    if (!startMarker || /[\r\n]/.test(startMarker)) throw new Error("Start marker must be a non-empty single-line string.");
    let last = -1;
    for (let i = 0; i < lines.length; i++) if (lines[i].includes(startMarker)) last = i;
    if (last === -1) throw new Error("Start marker was not found in the selected input.");
    lines = lines.slice(last + 1);
    filteredToMarker = true;
  }
  const groups = new Map();
  const completions = new Map();
  let malformed = 0;
  let ignored = 0;
  for (const line of lines) {
    const start = /\b(?:PROBE|PROBE_DONE)\|/.exec(line);
    if (!start) { if (line.trim()) ignored++; continue; }
    const payload = line.slice(start.index).trim();
    const done = /^PROBE_DONE\|([^|]+)$/.exec(payload);
    if (done) {
      if (!safeName(done[1])) { malformed++; continue; }
      completions.set(done[1], (completions.get(done[1]) ?? 0) + 1);
      continue;
    }
    const sample = /^PROBE\|([^|]+)\|(\d+(?:\.\d+)?)\|(true|false)\|([^|]*)$/.exec(payload);
    if (!sample || !safeName(sample[1])) { malformed++; continue; }
    const ms = Number(sample[2]);
    if (!Number.isFinite(ms) || ms > Number.MAX_SAFE_INTEGER) { malformed++; continue; }
    const name = sample[1];
    const success = sample[3] === "true";
    const detail = safeDetail(sample[4]);
    if (!groups.has(name)) groups.set(name, { name, count: 0, successes: 0, failures: 0, latencies: [], successDetails: new Map(), failureDetails: new Map() });
    const group = groups.get(name);
    group.count++;
    if (success) { group.successes++; group.latencies.push(ms); }
    else group.failures++;
    const details = success ? group.successDetails : group.failureDetails;
    details.set(detail, (details.get(detail) ?? 0) + 1);
  }
  const rows = [...groups.values()].sort((a, b) => a.name.localeCompare(b.name)).map(group => ({
    name: group.name,
    count: group.count,
    successes: group.successes,
    failures: group.failures,
    p50: nearestRank(group.latencies, 0.5),
    p95: nearestRank(group.latencies, 0.95),
    doneMarkers: (completions.get(group.name) ?? 0) + (group.name.includes(":") ? completions.get(group.name.split(":")[0]) ?? 0 : 0),
    successDetails: Object.fromEntries([...group.successDetails].sort()),
    failureDetails: Object.fromEntries([...group.failureDetails].sort()),
  }));
  return { rows, completions: Object.fromEntries([...completions].sort()), malformed, ignored, filteredToMarker };
}

export function renderProbeMarkdown(summary, { fromByte = 0 } = {}) {
  const details = counts => Object.entries(counts).map(([code, count]) => `${code}: ${count}`).join("; ") || "—";
  const number = value => value === null ? "—" : String(value);
  const lines = [
    "# Probe measurements", "",
    "Latencies are milliseconds from successful samples only. Percentiles use nearest rank: sorted[ceil(p × N) − 1]. A dash means no successful samples.", "",
    `Selection: ${summary.filteredToMarker ? "after the last requested start marker" : "all selected lines"}; input byte offset ${fromByte}. Repeated samples and repeated completed batches are counted, never deduplicated.`, "",
    "Done markers count observed protocol markers; they do not prove that every expected sample completed, especially after resets.", "",
    "| Probe / model | Samples | Success | Failure | p50 ms | p95 ms | Done markers | Success details | Failure details |",
    "|---|---:|---:|---:|---:|---:|---:|---|---|",
    ...summary.rows.map(row => `| ${row.name} | ${row.count} | ${row.successes} | ${row.failures} | ${number(row.p50)} | ${number(row.p95)} | ${row.doneMarkers} | ${details(row.successDetails)} | ${details(row.failureDetails)} |`),
    "", `Malformed protocol lines skipped: ${summary.malformed}. Other non-empty log lines ignored: ${summary.ignored}.`, "",
    "Only allowlisted probe/model identifiers and diagnostic codes are retained. Unrecognized detail text is counted as redacted_detail; raw log text, exception messages and credentials are never copied.", "",
  ];
  if (!summary.rows.length) lines.splice(lines.length - 3, 0, "No valid probe samples were found.", "");
  return lines.join("\n");
}

export function parseArguments(args) {
  const positional = [];
  let fromByte = 0;
  let startMarker;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--from-byte") {
      const value = args[++i];
      if (!/^\d+$/.test(value ?? "")) throw new Error("--from-byte requires a non-negative integer.");
      fromByte = Number(value);
      if (!Number.isSafeInteger(fromByte)) throw new Error("--from-byte is too large.");
    } else if (arg === "--start-marker") {
      startMarker = args[++i];
      if (!startMarker || startMarker.startsWith("--")) throw new Error("--start-marker requires a value.");
    } else if (arg.startsWith("--")) throw new Error("Unknown option.");
    else positional.push(arg);
  }
  if (positional.length < 1 || positional.length > 2) throw new Error("Usage: node probe-results.mjs INPUT [OUTPUT.md] [--from-byte N] [--start-marker TEXT]");
  if (positional[1] && !/\.md$/i.test(positional[1])) throw new Error("Output must be a Markdown (.md) file.");
  if (positional[1] && resolve(positional[0]) === resolve(positional[1])) throw new Error("Input and output must differ.");
  return { input: positional[0], output: positional[1], fromByte, startMarker };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = parseArguments(process.argv.slice(2));
    const selected = logFromByte(readFileSync(args.input), args.fromByte);
    const report = renderProbeMarkdown(summarizeProbes(selected, { startMarker: args.startMarker }), { fromByte: args.fromByte });
    if (args.output) writeFileSync(args.output, report, "utf8");
    else process.stdout.write(report);
  } catch {
    // Even filenames and CLI values may contain secrets; do not echo errors.
    console.error("Probe report failed. Check input/output paths, options and marker. Usage: node probe-results.mjs INPUT [OUTPUT.md] [--from-byte N] [--start-marker TEXT]");
    process.exitCode = 1;
  }
}
