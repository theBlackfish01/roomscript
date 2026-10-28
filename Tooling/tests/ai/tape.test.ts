import {createHash} from "node:crypto";
import {describe, it, expect, vi} from "vitest";
import {CancellationSource, LlmOutputEvent, LlmRequest, LlmResponse} from "../../../Assets/Scripts/Engine/ai/LlmPort";
import {TapeClient, tapeKey, sha1, encodeTapeEntry, decodeTapeLine, TapeEntry, TapeMode} from "../../../Assets/Scripts/Engine/ai/Tape";
import {canonicalJson} from "../../../Assets/Scripts/Engine/core/CanonicalJson";
import {FakeClock, deferred, flush} from "./helpers";

function request(): LlmRequest {
  return {provider: "gemini", model: "test-model", promptVersion: "answer-v1", messages: [{role: "system", content: "Perform the current account."}, {role: "user", content: "Where were you?"}], schema: {type: "object", properties: {line: {type: "string"}}}, temperature: 0};
}
function entry(input = request(), occurrence = 0): TapeEntry {
  return {version: 1, key: tapeKey(input), occurrence, model: input.model, promptVersion: input.promptVersion,
    response: {content: '{"line":"I was in the Kitchen."}'}, latencyMs: 1500, at: 2000};
}

describe("content-addressed offline tapes", () => {
  it.each(["", "abc", "a".repeat(1000), "Wren’s clue 🕵️ اردو", "\ud800"])("hashes UTF-8 consistently with standard SHA-1: %s", value => {
    expect(sha1(value)).toBe(createHash("sha1").update(value, "utf8").digest("hex"));
  });
  it("keys canonical input, model, prompt version, schema, and provider; object insertion order is irrelevant", () => {
    const input = request();
    // Reconstruct nested keys in another order without removing them.
    const equivalent = {...input, schema: {properties: {line: {type: "string"}}, type: "object"}};
    expect(tapeKey(input)).toBe(tapeKey(equivalent));
    const expected = createHash("sha1").update(canonicalJson({promptVersion: input.promptVersion, model: input.model, input})).digest("hex");
    expect(tapeKey(input)).toBe(expected);
    for (const patch of [{model: "other"}, {promptVersion: "answer-v2"}, {provider: "openai"}, {schema: {type: "array"}}, {temperature: 0.1}]) {
      expect(tapeKey({...input, ...patch} as LlmRequest)).not.toBe(expected);
    }
  });
  it("records response events without prompts and replays the exact response offline", async () => {
    const clock = new FakeClock(); const pending = deferred<LlmResponse>(); const events: LlmOutputEvent[] = []; const logs: string[] = [];
    const live = {complete: vi.fn(() => pending.promise)};
    const recorder = new TapeClient({mode: "RECORD", clock, live, emit: event => events.push(event), log: line => logs.push(line)});
    const input = request(); const call = recorder.complete(input); clock.advance(1743);
    pending.resolve({content: '{"line":"I was making tea."}', model: "served-model"});
    const response = await call; expect(events).toHaveLength(1); expect(events[0]).toMatchObject({type: "LlmOutput", source: "live", latencyMs: 1743});
    expect(logs).toHaveLength(1); const stored = decodeTapeLine("[Info] " + logs[0])!;
    expect(stored).toEqual(recorder.snapshot()[0]); expect(JSON.stringify(stored)).not.toContain("Where were you?");
    expect(stored).not.toHaveProperty("messages");
    const replay = new TapeClient({mode: "REPLAY", clock, live, entries: recorder.snapshot(), emit: event => events.push(event)});
    let finished = false; const replayed = replay.complete(request()).then(value => {finished = true; return value;});
    clock.advance(1742); await flush(); expect(finished).toBe(false);
    clock.advance(1); expect(await replayed).toEqual(response); expect(live.complete).toHaveBeenCalledOnce();
    expect(events[1]).toMatchObject({source: "replay", latencyMs: 1743, response});
  });
  it("preserves duplicate prompts by start occurrence even when live completions arrive in reverse order", async () => {
    const clock = new FakeClock(); const a = deferred<LlmResponse>(); const b = deferred<LlmResponse>();
    const live = {complete: vi.fn().mockImplementationOnce(() => a.promise).mockImplementationOnce(() => b.promise)};
    const recorder = new TapeClient({mode: "RECORD", clock, live, emit: () => {}});
    const first = recorder.complete(request()); const second = recorder.complete(request());
    clock.advance(100); b.resolve({content: "second"}); await second;
    clock.advance(100); a.resolve({content: "first"}); await first;
    expect(recorder.snapshot().map(item => [item.occurrence, item.response.content])).toEqual([[0, "first"], [1, "second"]]);
    const replay = new TapeClient({mode: "REPLAY", clock, entries: recorder.snapshot(), replayLatency: 0, emit: () => {}});
    expect((await replay.complete(request())).content).toBe("first"); expect((await replay.complete(request())).content).toBe("second");
    await expect(replay.complete(request())).rejects.toMatchObject({code: "tape_miss"});
  });
  it.each(["REPLAY", "HERO"] as TapeMode[])("%s never invokes live transport on hit or miss", async mode => {
    const clock = new FakeClock(); const live = {complete: vi.fn(async () => ({content: "network"}))}; const events: LlmOutputEvent[] = [];
    const client = new TapeClient({mode, clock, live, entries: [entry()], replayLatency: 0, emit: event => events.push(event)});
    expect(await client.complete(request())).toEqual(entry().response);
    await expect(client.complete(request())).rejects.toMatchObject({code: "tape_miss"});
    await expect(client.complete({...request(), model: "miss"})).rejects.toMatchObject({code: "tape_miss"});
    expect(live.complete).not.toHaveBeenCalled(); expect(events[0].source).toBe(mode === "HERO" ? "hero" : "replay");
  });
  it("LIVE emits without retaining or logging tapes", async () => {
    const log = vi.fn(); const emit = vi.fn(); const client = new TapeClient({mode: "LIVE", clock: new FakeClock(), live: {complete: async () => ({content: "response"})}, log, emit});
    await client.complete(request()); expect(emit).toHaveBeenCalledOnce(); expect(client.snapshot()).toEqual([]); expect(log).not.toHaveBeenCalled();
  });
  it("isolates caller, transport, snapshot and event mutations", async () => {
    const clock = new FakeClock(); const input = request(); const originalKey = tapeKey(input); const pending = deferred<LlmResponse>();
    const client = new TapeClient({mode: "RECORD", clock, live: {complete: supplied => {supplied.model = "transport-mutation"; return pending.promise;}}, emit: event => {event.response.content = "event-mutation";}});
    const call = client.complete(input); input.model = "caller-mutation"; pending.resolve({content: "original"});
    expect((await call).content).toBe("original"); const first = client.snapshot()[0];
    expect(first.key).toBe(originalKey); expect(first.model).toBe("test-model"); first.response.content = "snapshot-mutation";
    expect(client.snapshot()[0].response.content).toBe("original");
  });
  it("drops late live responses and cancels replay timers without output events", async () => {
    const clock = new FakeClock(); const source = new CancellationSource(); const pending = deferred<LlmResponse>(); const emit = vi.fn(); const log = vi.fn();
    const client = new TapeClient({mode: "RECORD", clock, live: {complete: () => pending.promise}, emit, log});
    const call = client.complete(request(), source.token); source.cancel(); pending.resolve({content: "late"});
    await expect(call).rejects.toMatchObject({code: "cancelled"}); expect(emit).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled(); expect(client.snapshot()).toEqual([]);
    const next = new CancellationSource(); const replay = new TapeClient({mode: "REPLAY", clock, entries: [entry()], emit});
    const waiting = replay.complete(request(), next.token); const rejected = expect(waiting).rejects.toMatchObject({code: "cancelled"});
    next.cancel(); await rejected; expect(clock.pending).toBe(0); expect(emit).not.toHaveBeenCalled();
  });
  it("round-trips Unicode and rejects malformed or mismatched encoded entries", () => {
    const sample = entry(); sample.response.content = "The clock’s gone. 🕵️ اردو";
    const encoded = encodeTapeEntry(sample); expect(decodeTapeLine(encoded)).toEqual(sample);
    const encodedPayload = encoded.split("|")[2]; expect(Buffer.from(encodedPayload, "base64").toString("utf8")).toBe(canonicalJson(sample));
    expect(decodeTapeLine("unrelated arbitrary log")).toBeUndefined();
    expect(() => decodeTapeLine(encoded.replace(sample.key, "0".repeat(40)))).toThrow();
    expect(() => decodeTapeLine("TAPE|" + sample.key + "|%%%" )).toThrow();
    expect(() => decodeTapeLine("TAPE|" + sample.key + "|/w==")).toThrow();
    expect(() => decodeTapeLine(encoded + " injected trailing text")).toThrow();
  });
  it("rejects secrets before live dispatch or tape storage and permits fictional narrative secrets", async () => {
    const emit = vi.fn(); const log = vi.fn(); const complete = vi.fn(async () => ({content: "fine"}));
    const client = new TapeClient({mode: "RECORD", clock: new FakeClock(), live: {complete}, emit, log});
    const input = request(); (input as unknown as Record<string, unknown>).apiKey = "opaque-credential";
    await expect(client.complete(input)).rejects.toMatchObject({code: "unsafe_tape"}); expect(complete).not.toHaveBeenCalled();
    for (const content of ["Bear" + "er " + "example", JSON.stringify({snapToken: "opaque"}), "sk-" + "x".repeat(24), "-----BEGIN " + "PRIVATE KEY-----", JSON.stringify({nested: {access_token: "opaque"}})]) {
      complete.mockResolvedValueOnce({content}); await expect(client.complete(request())).rejects.toMatchObject({code: "unsafe_tape"});
    }
    expect(log).not.toHaveBeenCalled(); expect(emit).not.toHaveBeenCalled();
    complete.mockResolvedValueOnce({content: '{"secret":"She stole a brooch."}'});
    expect((await client.complete(request())).content).toContain("brooch");
  });
  it("fails closed on malformed payloads, duplicate entries, and incompatible tape metadata", async () => {
    const clock = new FakeClock();
    expect(() => new TapeClient({mode: "LIVE", clock, emit: () => {}})).toThrow();
    expect(() => new TapeClient({mode: "REPLAY", clock, entries: [entry(), entry()], emit: () => {}})).toThrow();
    expect(() => new TapeClient({mode: "REPLAY", clock, entries: [{...entry(), latencyMs: -1}], emit: () => {}})).toThrow();
    const corrupt = {...entry(), model: "wrong-model"};
    const replay = new TapeClient({mode: "REPLAY", clock, entries: [corrupt], emit: () => {}});
    await expect(replay.complete(request())).rejects.toMatchObject({code: "tape_miss"});
    const client = new TapeClient({mode: "LIVE", clock, live: {complete: async () => ({content: "fine", truth: true} as LlmResponse)}, emit: () => {}});
    await expect(client.complete(request())).rejects.toMatchObject({code: "invalid_response"});
    expect(() => tapeKey({...request(), messages: []})).toThrow();
  });
  it("rejects credentials hidden by JSON Unicode escapes before event emission or base64 encoding", async () => {
    const emit = vi.fn(); const log = vi.fn();
    const escaped = '{"line":"Bea' + '\\u0072' + 'er opaque-value"}';
    const client = new TapeClient({mode: "RECORD", clock: new FakeClock(), live: {complete: async () => ({content: escaped})}, emit, log});
    await expect(client.complete(request())).rejects.toMatchObject({code: "unsafe_tape"});
    expect(emit).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled();
    expect(() => encodeTapeEntry({...entry(), response: {content: escaped}})).toThrow();
    const nested = JSON.stringify({response: JSON.stringify({api_key: "opaque-value"})});
    expect(() => encodeTapeEntry({...entry(), response: {content: nested}})).toThrow();
  });
  it("continues occurrence numbers when RECORD appends to an existing tape", async () => {
    const client = new TapeClient({mode: "RECORD", clock: new FakeClock(), entries: [entry()], live: {complete: async () => ({content: "new"})}, emit: () => {}});
    await client.complete(request()); expect(client.snapshot().map(item => item.occurrence)).toEqual([0, 1]);
  });
});
