import {performanceRef} from "../../../Assets/Scripts/Engine/perf/ReferenceIds";
import {describe, it, expect, vi} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {heroLineBank} from "../../../Assets/Scripts/Content/HeroLineBank";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {Answer, LineBankEntry} from "../../../Assets/Scripts/Engine/core/Types";
import {AnswerPipeline, AnswerInput, ChosenAnswer} from "../../../Assets/Scripts/Engine/ai/AnswerPipeline";
import {LlmError, LlmPort, LlmResponse} from "../../../Assets/Scripts/Engine/ai/LlmPort";
import {Scheduler} from "../../../Assets/Scripts/Engine/ai/Scheduler";
import {TapeClient} from "../../../Assets/Scripts/Engine/ai/Tape";
import {validateLine} from "../../../Assets/Scripts/Engine/perf/LineValidator";
import {buildFactSheet} from "../../../Assets/Scripts/Engine/perf/FactSheetBuilder";
import {FakeClock, deferred, flush} from "./helpers";

const answer: Answer = {topic: "where@22:30", cites: [performanceRef("a","C_VALE_ALIBI_0")], line: "I was in the Kitchen making tea at 22:30.", emotion: "guarded"};
const response = (value = answer): LlmResponse => ({content: JSON.stringify(value)});
function context(llm: LlmPort, bank: readonly LineBankEntry[] = heroLineBank) {
  const graph = createHeroCase(); const state = createGameState(graph); const clock = new FakeClock(); const scheduler = new Scheduler(clock);
  const pipeline = new AnswerPipeline({clock, scheduler, llm, lineBank: bank, model: {provider: "gemini", model: "test-model"}});
  const input: AnswerInput = {graph, state, suspect: "S2", question: "Where were you at 22:30?", kind: "free"};
  return {graph, state, clock, scheduler, pipeline, input};
}

describe("validated live answer pipeline", () => {
  it("performs chips from a validated authored cache immediately without model calls or fillers", async () => {
    const complete = vi.fn(async () => response()); const {pipeline, input, clock} = context({complete});
    const order: string[] = []; const filler = vi.fn();
    const task = pipeline.start({...input, kind: "chip", topic: answer.topic}, {detective: () => order.push("detective"), chosen: () => order.push("chosen"), filler});
    expect(order).toEqual(["detective", "chosen"]); const selected = await task.promise;
    expect(selected).toMatchObject({origin: "cache", mode: "answer", attempts: 0, latencyMs: 0, rejectionCount: 0});
    expect(selected.answer.cites).toContain(performanceRef("a","C_VALE_ALIBI_0")); expect(complete).not.toHaveBeenCalled();
    clock.advance(7000); expect(filler).not.toHaveBeenCalled(); expect(clock.pending).toBe(0);
  });
  it("sends free text through model despite a cache hit, validates it, and never mutates game state", async () => {
    const pending = deferred<LlmResponse>(); const complete = vi.fn(() => pending.promise);
    const {pipeline, input, state, graph, clock} = context({complete}); const before = JSON.stringify({state, graph});
    const detective = vi.fn(); const filler = vi.fn(); const task = pipeline.start(input, {detective, filler});
    expect(detective).toHaveBeenCalledOnce(); expect(complete).toHaveBeenCalledOnce();
    expect(complete.mock.calls[0][0].messages[1].content).toContain(input.question);
    clock.advance(400); pending.resolve(response()); const result = await task.promise;
    expect(result).toMatchObject({origin: "model", mode: "answer", latencyMs: 400, attempts: 1, rejectionCount: 0});
    expect(result.answer).toEqual(answer); expect(filler).not.toHaveBeenCalled(); expect(clock.pending).toBe(0);
    expect(JSON.stringify({state, graph})).toBe(before);
  });
  it("emits validated neutral fillers at 600 and 2500ms only while waiting", async () => {
    const pending = deferred<LlmResponse>(); const {pipeline, input, clock, graph, state} = context({complete: () => pending.promise});
    const filler = vi.fn(); const task = pipeline.start(input, {filler});
    clock.advance(599); expect(filler).not.toHaveBeenCalled(); clock.advance(1); expect(filler).toHaveBeenCalledTimes(1);
    clock.advance(1900); expect(filler).toHaveBeenCalledTimes(2);
    for (const [event] of filler.mock.calls) expect(validateLine(event.answer, buildFactSheet(graph, state, "S2"), graph, "filler").ok).toBe(true);
    expect(filler.mock.calls.map(([event]) => event.latencyMs)).toEqual([600, 2500]);
    pending.resolve(response()); await task.promise; clock.advance(10000); expect(filler).toHaveBeenCalledTimes(2);
  });
  it("retries one invalid reply, counts rejections, and never displays rejected prose", async () => {
    const complete = vi.fn().mockResolvedValueOnce({content: JSON.stringify({...answer, line: "As an AI, I killed Harlow."})}).mockResolvedValueOnce(response());
    const {pipeline, input} = context({complete}); const chosen = vi.fn(); const rejected = vi.fn();
    const result = await pipeline.start(input, {chosen, rejected}).promise;
    expect(complete).toHaveBeenCalledTimes(2); expect(result).toMatchObject({attempts: 2, rejectionCount: 1, origin: "model"});
    expect(chosen).toHaveBeenCalledOnce(); expect(chosen.mock.calls[0][0].answer).toEqual(answer); expect(rejected).toHaveBeenCalledOnce();
    expect(JSON.stringify(rejected.mock.calls)).not.toContain("I killed");
  });
  it("allows the retry at exactly 2500ms remaining, then hard-falls back by 6500ms", async () => {
    const first = deferred<LlmResponse>(); const second = deferred<LlmResponse>();
    const complete = vi.fn().mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise);
    const {pipeline, input, clock, scheduler} = context({complete}); const chosen = vi.fn();
    const task = pipeline.start(input, {chosen}); clock.advance(4000); first.resolve({content: "bad json"}); await flush();
    expect(complete).toHaveBeenCalledTimes(2); clock.advance(2499); await flush(); expect(chosen).not.toHaveBeenCalled();
    clock.advance(1); const result = await task.promise;
    expect(result).toMatchObject({origin: "line-bank", latencyMs: 6500, attempts: 2, rejectionCount: 1});
    expect(scheduler.activeCount).toBe(1); second.resolve(response()); await flush(); expect(chosen).toHaveBeenCalledOnce(); expect(scheduler.activeCount).toBe(0);
  });
  it("does not retry below 2500ms remaining and uses the authored fallback", async () => {
    const pending = deferred<LlmResponse>(); const complete = vi.fn(() => pending.promise);
    const {pipeline, input, clock} = context({complete}); const task = pipeline.start(input);
    clock.advance(4001); pending.resolve({content: "invalid"}); const result = await task.promise;
    expect(complete).toHaveBeenCalledOnce(); expect(result).toMatchObject({origin: "line-bank", attempts: 1, latencyMs: 4001, rejectionCount: 1});
  });
  it("times out generation at 5000ms while retaining an unabortable physical slot", async () => {
    const pending = deferred<LlmResponse>(); const {pipeline, input, clock, scheduler} = context({complete: () => pending.promise});
    const task = pipeline.start(input); clock.advance(5000); const result = await task.promise;
    expect(result).toMatchObject({origin: "line-bank", latencyMs: 5000, attempts: 1, rejectionCount: 0});
    expect(scheduler.activeCount).toBe(1); expect(clock.pending).toBe(0);
    pending.resolve(response()); await flush(); expect(scheduler.activeCount).toBe(0);
  });
  it("rejects two bad replies then falls through to canonical text without a bank", async () => {
    const complete = vi.fn(async () => ({content: "not JSON"})); const {pipeline, input, graph, state} = context({complete}, []);
    const result = await pipeline.start(input).promise;
    expect(result).toMatchObject({origin: "canonical", attempts: 2, rejectionCount: 2}); expect(complete).toHaveBeenCalledTimes(2);
    expect(validateLine(result.answer, buildFactSheet(graph, state, "S2"), graph, result.mode).ok).toBe(true);
    expect(result.answer.cites).toEqual(answer.cites);
  });
  it("uses a validated neutral floor for weird questions and labels no-cite answers as deflections", async () => {
    const complete = vi.fn(async () => {throw new LlmError("unauthenticated");}); const {pipeline, input} = context({complete}, []);
    const result = await pipeline.start({...input, question: "Could a dragon juggle the moon?"}).promise;
    expect(result).toMatchObject({origin: "deflection", mode: "deflect", attempts: 1}); expect(result.answer.cites).toEqual(["none"]);
    expect(complete).toHaveBeenCalledOnce();
    const neutral = context({complete: async () => response({topic: "unclear", cites: ["none"], line: "Ask me something more specific.", emotion: "guarded"})});
    expect(await neutral.pipeline.start(neutral.input).promise).toMatchObject({origin: "model", mode: "deflect"});
  });
  it("ignores invalid cached entries and respects a locked chip topic", async () => {
    const wrong: LineBankEntry = {suspect: "S2", layer: 0, topic: answer.topic, mode: "answer", answer: {...answer, cites: [performanceRef("a","C_VALE_ALIBI_2")]}};
    const complete = vi.fn(async () => response({topic: "baseline:name", cites: [performanceRef("a","C_S2_NAME")], line: "My name is Marguerite Vale.", emotion: "guarded"}));
    const {pipeline, input} = context({complete}, [wrong]);
    const rejected = vi.fn();
    const result = await pipeline.start({...input, kind: "chip", topic: answer.topic}, {rejected}).promise;
    expect(result.origin).toBe("canonical"); expect(result.answer.topic).toBe(answer.topic); expect(complete).toHaveBeenCalledTimes(2);
    expect(rejected.mock.calls.map(([event]) => event.codes)).toEqual([["TOPIC"], ["TOPIC"]]);
  });
  it("press uses pressed citations and cancels old TTS tokens when the next question starts", async () => {
    const {pipeline, input} = context({complete: async () => response()});
    const first = pipeline.start({...input, kind: "chip", topic: answer.topic, mode: "press"}); const result = await first.promise;
    expect(result.mode).toBe("press"); expect(result.answer.cites).toEqual([performanceRef("p","C_VALE_ALIBI_0")]); expect(first.token.cancelled).toBe(false);
    const stopAudio = vi.fn(); first.token.onCancel(stopAudio);
    await pipeline.start({...input, kind: "chip", topic: answer.topic}).promise;
    expect(first.token.cancelled).toBe(true); expect(stopAudio).toHaveBeenCalledOnce();
  });
  it("cancels stale questions, suppresses late callbacks, and leaves active transport accounting intact", async () => {
    const old = deferred<LlmResponse>(); const fresh = deferred<LlmResponse>();
    const complete = vi.fn().mockImplementationOnce(() => old.promise).mockImplementationOnce(() => fresh.promise);
    const {pipeline, input, clock, scheduler} = context({complete}); const oldChosen = vi.fn(); const oldFiller = vi.fn();
    const first = pipeline.start(input, {chosen: oldChosen, filler: oldFiller}); const rejected = expect(first.promise).rejects.toMatchObject({code: "cancelled"});
    const second = pipeline.start(input); await rejected; expect(scheduler.activeCount).toBe(2);
    old.resolve(response()); await flush(); expect(oldChosen).not.toHaveBeenCalled();
    clock.advance(700); expect(oldFiller).not.toHaveBeenCalled(); fresh.resolve(response()); await second.promise;
    expect(scheduler.activeCount).toBe(0); expect(clock.pending).toBe(0);
  });
  it("never exceeds four physical calls across rapid question replacement", async () => {
    const pending = Array.from({length: 4}, () => deferred<LlmResponse>()); let calls = 0;
    const complete = vi.fn(() => pending[calls++].promise); const {pipeline, input, clock, scheduler} = context({complete});
    const tasks: Promise<unknown>[] = [];
    for (let i = 0; i < 5; i++) tasks.push(pipeline.start(input).promise.catch(error => error.code));
    await flush(); expect(complete).toHaveBeenCalledTimes(4); expect(scheduler.activeCount).toBe(4); expect(scheduler.queuedCount).toBe(1);
    clock.advance(5000); await flush(); expect(scheduler.queuedCount).toBe(0); expect(complete).toHaveBeenCalledTimes(4);
    const results = await Promise.all(tasks); expect(results.slice(0, 4)).toEqual(["cancelled", "cancelled", "cancelled", "cancelled"]);
    expect((results[4] as ChosenAnswer).origin).toBe("line-bank");
    pending.forEach(item => item.resolve(response())); await flush(); expect(scheduler.activeCount).toBe(0);
  });
  it("record then replay follows the same validation path without network", async () => {
    const raw = {complete: vi.fn(async () => response())}; const clock = new FakeClock(); const outputEvents: unknown[] = [];
    const record = new TapeClient({mode: "RECORD", clock, live: raw, emit: event => outputEvents.push(event)});
    const setup = context(record); const first = await setup.pipeline.start(setup.input).promise;
    const replay = new TapeClient({mode: "REPLAY", clock, live: raw, entries: record.snapshot(), replayLatency: 0, emit: event => outputEvents.push(event)});
    const offline = context(replay); const second = await offline.pipeline.start(offline.input).promise;
    expect(second.answer).toEqual(first.answer); expect(raw.complete).toHaveBeenCalledOnce(); expect(outputEvents).toHaveLength(2);
  });
  it("does not authorize confession or expose rejection prose, and callback errors cannot strand a response", async () => {
    const {pipeline, input} = context({complete: async () => response()});
    expect(() => pipeline.start({...input, mode: "confession" as never})).toThrow();
    expect(() => pipeline.start({...input, topic: "unknown"})).toThrow();
    const result = await pipeline.start(input, {detective: () => {throw new Error("UI");}, chosen: event => {event.answer.line = "mutated"; throw new Error("UI");}}).promise;
    expect(result.answer).toEqual(answer);
  });
});
