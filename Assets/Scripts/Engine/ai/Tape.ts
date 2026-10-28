import {canonicalJson} from "../core/CanonicalJson";
import {delay} from "./Deadlines";
import {CancellationToken, ClockPort, LlmError, LlmOutputEvent, LlmPort, LlmRequest, LlmResponse} from "./LlmPort";

export type TapeMode = "LIVE" | "RECORD" | "REPLAY" | "HERO";
export interface TapeEntry {
  version: 1; key: string; occurrence: number; model: string; promptVersion: string;
  response: LlmResponse; latencyMs: number; at: number;
}
export interface TapeOptions {
  mode: TapeMode; clock: ClockPort; live?: LlmPort; entries?: readonly TapeEntry[];
  /** Required boundary: the caller records this output before validating or performing it. */
  emit: (event: LlmOutputEvent) => void;
  log?: (line: string) => void;
  replayLatency?: "recorded" | number;
}

const credentialKey = /^(?:api[_-]?key|snapToken|openAIToken|googleToken|authorization|password|private[_-]?key|access[_-]?token|refresh[_-]?token)$/i;
const credentialText = /(?:Bearer[ ]|-----BEGIN (?:[A-Z ]*PRIVATE KEY|CERTIFICATE)-----|\bsk-[A-Za-z0-9_-]{12,}|\bAIza[A-Za-z0-9_-]{20,}|\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,})/i;
const maxEntryLength = 1048576;

/** Defense in depth, not a general secret detector. Credentials must never enter LlmRequest. */
function assertSafe(value: unknown): void {
  const json = canonicalJson(value); // Reject cycles, exotic objects and non-JSON values first.
  if (json.length > maxEntryLength || credentialText.test(json)) throw new LlmError("unsafe_tape");
  const visit = (node: unknown, depth: number): void => {
    if (depth > 32) throw new LlmError("unsafe_tape");
    if (typeof node === "string") {
      if (credentialText.test(node)) throw new LlmError("unsafe_tape");
      const trimmed = node.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[") || trimmed.startsWith('"')) {
        let parsed: unknown;
        try {parsed = JSON.parse(trimmed);} catch {return;}
        visit(parsed, depth + 1);
      }
    } else if (node && typeof node === "object") {
      for (const key of Object.keys(node)) {
        if (credentialKey.test(key)) throw new LlmError("unsafe_tape");
        visit((node as Record<string, unknown>)[key], depth + 1);
      }
    }
  };
  visit(value, 0);
}
function keys(value: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(value).every(key => allowed.includes(key));
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function checkedRequest(request: LlmRequest): void {
  assertSafe(request);
  if (!record(request) || !keys(request as unknown as Record<string, unknown>, ["provider", "model", "promptVersion", "messages", "schema", "temperature"])
    || !["openai", "gemini"].includes(request.provider) || typeof request.model !== "string" || !request.model
    || typeof request.promptVersion !== "string" || !request.promptVersion || !Array.isArray(request.messages) || !request.messages.length
    || !request.messages.every(message => record(message) && keys(message as unknown as Record<string, unknown>, ["role", "content"])
      && ["system", "user", "assistant"].includes(message.role) && typeof message.content === "string")
    || (request.schema !== undefined && !record(request.schema))
    || (request.temperature !== undefined && (!Number.isFinite(request.temperature) || request.temperature < 0))) throw new LlmError("invalid_response");
}
function checkedResponse(value: unknown): LlmResponse {
  assertSafe(value);
  if (!record(value) || !keys(value, ["content", "model"]) || typeof value.content !== "string"
    || (value.model !== undefined && typeof value.model !== "string")) throw new LlmError("invalid_response");
  return value.model === undefined ? {content: value.content} : {content: value.content, model: value.model as string};
}
function checkedEntry(value: unknown): TapeEntry {
  assertSafe(value);
  if (!record(value) || !keys(value, ["version", "key", "occurrence", "model", "promptVersion", "response", "latencyMs", "at"])
    || value.version !== 1 || typeof value.key !== "string" || !/^[a-f0-9]{40}$/.test(value.key)
    || !Number.isSafeInteger(value.occurrence) || (value.occurrence as number) < 0
    || typeof value.model !== "string" || !value.model || typeof value.promptVersion !== "string" || !value.promptVersion
    || typeof value.latencyMs !== "number" || !Number.isFinite(value.latencyMs) || value.latencyMs < 0
    || typeof value.at !== "number" || !Number.isFinite(value.at)) throw new LlmError("unsafe_tape");
  return {version: 1, key: value.key, occurrence: value.occurrence as number, model: value.model,
    promptVersion: value.promptVersion, response: checkedResponse(value.response), latencyMs: value.latencyMs, at: value.at};
}

/** SHA-1 is a reproducible content address here, never a signature or security boundary. */
export function tapeKey(request: LlmRequest): string {
  checkedRequest(request);
  return sha1(canonicalJson({promptVersion: request.promptVersion, model: request.model, input: request}));
}

/** One occurrence per call, allocated on start, so parallel completions cannot reorder repeated prompts. */
export class TapeClient implements LlmPort {
  private readonly entries = new Map<string, TapeEntry>();
  private readonly occurrences = new Map<string, number>();
  constructor(private readonly options: TapeOptions) {
    if (!["LIVE", "RECORD", "REPLAY", "HERO"].includes(options.mode) || typeof options.emit !== "function") throw new Error("Invalid tape configuration");
    if ((options.mode === "LIVE" || options.mode === "RECORD") && !options.live) throw new Error("Live tape mode requires a transport");
    if (options.replayLatency !== undefined && options.replayLatency !== "recorded"
      && (!Number.isFinite(options.replayLatency) || options.replayLatency < 0)) throw new Error("Invalid replay latency");
    for (const candidate of options.entries ?? []) {
      const entry = checkedEntry(candidate); const id = entry.key + ":" + entry.occurrence;
      if (this.entries.has(id)) throw new Error("Duplicate tape occurrence");
      this.entries.set(id, entry);
      if (options.mode === "RECORD") this.occurrences.set(entry.key, Math.max(this.occurrences.get(entry.key) ?? 0, entry.occurrence + 1));
    }
  }
  snapshot(): TapeEntry[] {
    return [...this.entries.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0) || a.occurrence - b.occurrence).map(checkedEntry);
  }
  async complete(request: LlmRequest, cancellation?: CancellationToken): Promise<LlmResponse> {
    cancellation?.throwIfCancelled();
    const key = tapeKey(request); const occurrence = this.occurrences.get(key) ?? 0;
    const input = JSON.parse(canonicalJson(request)) as LlmRequest;
    this.occurrences.set(key, occurrence + 1);
    const started = this.options.clock.nowMs();
    let response: LlmResponse; let latencyMs: number; let source: LlmOutputEvent["source"];
    if (this.options.mode === "REPLAY" || this.options.mode === "HERO") {
      const entry = this.entries.get(key + ":" + occurrence);
      if (!entry || entry.model !== input.model || entry.promptVersion !== input.promptVersion) throw new LlmError("tape_miss");
      latencyMs = this.options.replayLatency === undefined || this.options.replayLatency === "recorded" ? entry.latencyMs : this.options.replayLatency;
      await delay(latencyMs, this.options.clock, cancellation);
      response = checkedResponse(entry.response); source = this.options.mode === "HERO" ? "hero" : "replay";
    } else {
      // Transport receives a clone: mutations cannot change the key or the caller's prompt.
      response = checkedResponse(await this.options.live!.complete(JSON.parse(canonicalJson(input)) as LlmRequest, cancellation));
      latencyMs = Math.max(0, this.options.clock.nowMs() - started); source = "live";
    }
    cancellation?.throwIfCancelled();
    const at = this.options.clock.nowMs();
    const entry = checkedEntry({version: 1, key, occurrence, model: input.model, promptVersion: input.promptVersion, response, latencyMs, at});
    // Every successful raw model response is an output event, never a truth-changing action.
    this.options.emit({type: "LlmOutput", key, occurrence, source, response: checkedResponse(response), latencyMs, at});
    if (this.options.mode === "RECORD") {
      this.entries.set(key + ":" + occurrence, entry);
      this.options.log?.(encodeTapeEntry(entry));
    }
    return checkedResponse(response);
  }
}

export function encodeTapeEntry(candidate: TapeEntry): string {
  const entry = checkedEntry(candidate);
  return "TAPE|" + entry.key + "|" + base64Encode(utf8(canonicalJson(entry)));
}
/** Accepts a single timestamp-prefixed Lens log line; never returns unrelated log contents. */
export function decodeTapeLine(line: string): TapeEntry | undefined {
  if (line.length > maxEntryLength * 2) throw new LlmError("unsafe_tape");
  const marker = line.indexOf("TAPE|");
  if (marker < 0) return undefined;
  const match = /^TAPE\|([a-f0-9]{40})\|([A-Za-z0-9+/]*={0,2})\s*$/.exec(line.slice(marker));
  if (!match) throw new LlmError("unsafe_tape");
  let decoded: unknown;
  try {decoded = JSON.parse(fromUtf8(base64Decode(match[2])));} catch {throw new LlmError("unsafe_tape");}
  const entry = checkedEntry(decoded);
  if (entry.key !== match[1]) throw new LlmError("unsafe_tape");
  return entry;
}

function utf8(text: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let c = text.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {c = 0x10000 + ((c - 0xd800) << 10) + next - 0xdc00; i++;}
    }
    if (c >= 0xd800 && c <= 0xdfff) c = 0xfffd;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | c >> 6, 0x80 | c & 63);
    else if (c < 0x10000) out.push(0xe0 | c >> 12, 0x80 | c >> 6 & 63, 0x80 | c & 63);
    else out.push(0xf0 | c >> 18, 0x80 | c >> 12 & 63, 0x80 | c >> 6 & 63, 0x80 | c & 63);
  }
  return out;
}
function fromUtf8(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length;) {
    const first = bytes[i++]; let c: number; let count: number; let min: number;
    if (first < 128) {c = first; count = 0; min = 0;}
    else if (first >= 0xc2 && first < 0xe0) {c = first & 31; count = 1; min = 0x80;}
    else if (first >= 0xe0 && first < 0xf0) {c = first & 15; count = 2; min = 0x800;}
    else if (first >= 0xf0 && first <= 0xf4) {c = first & 7; count = 3; min = 0x10000;}
    else throw new LlmError("unsafe_tape");
    for (let n = 0; n < count; n++) {const b = bytes[i++]; if (b === undefined || (b & 0xc0) !== 0x80) throw new LlmError("unsafe_tape"); c = (c << 6) | b & 63;}
    if (c < min || c > 0x10ffff || (c >= 0xd800 && c <= 0xdfff)) throw new LlmError("unsafe_tape");
    out += String.fromCodePoint(c);
  }
  return out;
}
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function base64Encode(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = bytes[i] << 16 | (bytes[i + 1] ?? 0) << 8 | (bytes[i + 2] ?? 0);
    out += alphabet[n >>> 18 & 63] + alphabet[n >>> 12 & 63] + (i + 1 < bytes.length ? alphabet[n >>> 6 & 63] : "=") + (i + 2 < bytes.length ? alphabet[n & 63] : "=");
  }
  return out;
}
function base64Decode(text: string): number[] {
  if (text.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text)) throw new LlmError("unsafe_tape");
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i += 4) {
    const n = alphabet.indexOf(text[i]) << 18 | alphabet.indexOf(text[i + 1]) << 12 | Math.max(0, alphabet.indexOf(text[i + 2])) << 6 | Math.max(0, alphabet.indexOf(text[i + 3]));
    bytes.push(n >>> 16 & 255);
    if (text[i + 2] !== "=") bytes.push(n >>> 8 & 255);
    if (text[i + 3] !== "=") bytes.push(n & 255);
  }
  if (base64Encode(bytes) !== text) throw new LlmError("unsafe_tape");
  return bytes;
}
export function sha1(text: string): string {
  const bytes = utf8(text); const bits = bytes.length * 8;
  bytes.push(0x80); while (bytes.length % 64 !== 56) bytes.push(0);
  const high = Math.floor(bits / 0x100000000); const low = bits >>> 0;
  for (let shift = 24; shift >= 0; shift -= 8) bytes.push(high >>> shift & 255);
  for (let shift = 24; shift >= 0; shift -= 8) bytes.push(low >>> shift & 255);
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const rotate = (n: number, count: number) => n << count | n >>> (32 - count);
  for (let offset = 0; offset < bytes.length; offset += 64) {
    const w: number[] = [];
    for (let i = 0; i < 16; i++) {const j = offset + i * 4; w[i] = bytes[j] << 24 | bytes[j + 1] << 16 | bytes[j + 2] << 8 | bytes[j + 3];}
    for (let i = 16; i < 80; i++) w[i] = rotate(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) {
      const f = i < 20 ? (b & c) | (~b & d) : i < 40 ? b ^ c ^ d : i < 60 ? (b & c) | (b & d) | (c & d) : b ^ c ^ d;
      const k = i < 20 ? 0x5a827999 : i < 40 ? 0x6ed9eba1 : i < 60 ? 0x8f1bbcdc : 0xca62c1d6;
      const temp = (rotate(a, 5) + f + e + k + w[i]) | 0;
      e = d; d = c; c = rotate(b, 30); b = a; a = temp;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
  }
  return [h0, h1, h2, h3, h4].map(value => (value >>> 0).toString(16).padStart(8, "0")).join("");
}
