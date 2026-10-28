import { describe, it, expect } from "vitest";
import { nearestRank, summarizeProbes, renderProbeMarkdown, logFromByte, parseArguments } from "../../scripts/probe-results.mjs";

describe("probe log aggregation", () => {
  it("accepts timestamp and Lens logger prefixes and separates models", () => {
    const summary = summarizeProbes([
      "[20:12:35] [RoomscriptProbeLab.ts:127] PROBE|P-a:gpt-4.1-nano|120|true|schema_valid",
      "[info] PROBE|P-a:gpt-4o-mini|220|true|schema_valid",
      "[20:12:37] PROBE_DONE|P-a",
    ].join("\r\n"));
    expect(summary.rows.map(row => [row.name, row.count, row.p50, row.doneMarkers])).toEqual([
      ["P-a:gpt-4.1-nano", 1, 120, 1], ["P-a:gpt-4o-mini", 1, 220, 1],
    ]);
  });
  it("calculates nearest-rank percentiles and leaves inputs unsorted", () => {
    const values = [4, 1, 3, 2];
    expect(nearestRank(values, 0.5)).toBe(2);
    expect(nearestRank(values, 0.95)).toBe(4);
    expect(values).toEqual([4, 1, 3, 2]);
    expect(nearestRank(Array.from({ length: 20 }, (_, i) => i + 1), 0.95)).toBe(19);
    expect(nearestRank([], 0.95)).toBeNull();
    expect(() => nearestRank([1], 0)).toThrow();
  });
  it("excludes failures from latency percentiles but counts failure detail categories", () => {
    const summary = summarizeProbes("PROBE|P-c|10|true|audio_loaded;playing=true\nPROBE|P-c|9000|false|deadline\nPROBE|P-c|8000|false|deadline\nPROBE|P-c|7000|false|Unauthenticated");
    expect(summary.rows[0]).toMatchObject({ count: 4, successes: 1, failures: 3, p50: 10, p95: 10, failureDetails: { deadline: 2, Unauthenticated: 1 } });
    expect(summarizeProbes("PROBE|P-f|300|true|4_schema_valid;gpt-4o-mini").rows[0].successDetails).toEqual({ "4_schema_valid;gpt-4o-mini": 1 });
  });
  it("reports failure-only and empty selections without invented latency", () => {
    const summary = summarizeProbes("PROBE|P-d|0|false|unsupported_api;implementation details\nPROBE_DONE|P-d");
    expect(summary.rows[0]).toMatchObject({ p50: null, p95: null, successes: 0, failures: 1, failureDetails: { unsupported_api: 1 } });
    expect(renderProbeMarkdown(summary)).toContain("| P-d | 1 | 0 | 1 | — | — | 1 |");
    expect(renderProbeMarkdown(summarizeProbes("unrelated log"))).toContain("No valid probe samples");
  });
  it("skips malformed protocol records and does not expose raw rejected text", () => {
    const lines = ["PROBE|P-a|NaN|true|ok", "PROBE|P-a|-1|true|ok", "PROBE|P-a|1|yes|ok", "PROBE|P-a|1|true|extra|field", "PROBE|unknown-secret|2|true|ok", "PROBE_DONE|P-a|extra", "ordinary log"];
    const summary = summarizeProbes(lines.join("\n"));
    expect(summary).toMatchObject({ malformed: 6, ignored: 1, rows: [] });
    expect(renderProbeMarkdown(summary)).not.toContain("unknown-secret");
  });
  it("redacts arbitrary failure text, secrets, model names and log prefixes", () => {
    const secret = "synthetic-private-token";
    const source = `[${secret}] PROBE|P-e|1|false|${secret}\nPROBE|P-a:${secret}|2|true|ok\n${secret}`;
    const result = summarizeProbes(source);
    expect(result.rows[0].failureDetails).toEqual({ redacted_detail: 1 });
    expect(JSON.stringify(result)).not.toContain(secret);
    expect(renderProbeMarkdown(result)).not.toContain(secret);
  });
  it("retains neutral not_found without inferring the missing resource", () => {
    const summary = summarizeProbes("PROBE|P-b:gemini-2.5-flash|300|false|not_found");
    expect(summary.rows[0].failureDetails).toEqual({ not_found: 1 });
    const report = renderProbeMarkdown(summary);
    expect(report).toContain("not_found: 1");
    expect(report).not.toContain("model_not_found");
  });
  it("counts duplicate reset batches by default and can select the last marker", () => {
    const batch = "PROBE_READY|new\nPROBE|P-g|5|true|frames=4;640x480\nPROBE_DONE|P-g\n";
    const all = summarizeProbes(batch + batch);
    expect(all.rows[0]).toMatchObject({ count: 2, doneMarkers: 2 });
    const latest = summarizeProbes(batch + batch, { startMarker: "PROBE_READY" });
    expect(latest.rows[0]).toMatchObject({ count: 1, doneMarkers: 1 });
    expect(latest.filteredToMarker).toBe(true);
    expect(() => summarizeProbes(batch, { startMarker: "missing" })).toThrow();
  });
  it("filters by UTF-8 byte offsets and discards only a partial first line", () => {
    const first = "é-prefix PROBE|P-g|4|true|frames=2;640x480\r\n";
    const second = "PROBE|P-g|6|true|frames=3;640x480\n";
    const bytes = Buffer.from(first + second);
    expect(logFromByte(bytes, Buffer.byteLength(first))).toBe(second);
    expect(logFromByte(bytes, 1)).toBe(second);
    expect(logFromByte(bytes, bytes.length)).toBe("");
    expect(() => logFromByte(bytes, bytes.length + 1)).toThrow();
    expect(() => logFromByte(bytes, -1)).toThrow();
  });
  it("supports completion-only logs without fabricating samples", () => {
    const summary = summarizeProbes("PROBE_DONE|P-h");
    expect(summary.rows).toEqual([]);
    expect(summary.completions).toEqual({ "P-h": 1 });
  });
  it("parses CLI selection and rejects invalid or destructive output arguments", () => {
    expect(parseArguments(["probe.log", "report.md", "--from-byte", "10", "--start-marker", "PROBE_READY"])).toEqual({ input: "probe.log", output: "report.md", fromByte: 10, startMarker: "PROBE_READY" });
    expect(() => parseArguments(["report.md", "report.md"])).toThrow();
    expect(() => parseArguments(["probe.log", "--from-byte", "-1"])).toThrow();
    expect(() => parseArguments(["probe.log", "out.log"])).toThrow();
    expect(() => parseArguments(["probe.log", "--start-marker"])).toThrow();
  });
});
