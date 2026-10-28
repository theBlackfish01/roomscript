import {Answer, AnswerMode, CaseGraph, FactSheet, GameState, LineBankEntry} from "../core/Types";
import {buildFactSheet} from "../perf/FactSheetBuilder";
import {answerTopics} from "../perf/AnswerSchema";
import {keywordIntent} from "../perf/KeywordIntent";
import {canonicalFallback, lookupLine} from "../perf/LineBank";
import {validateLine} from "../perf/LineValidator";
import {CancellationSource, CancellationToken, ClockPort, LlmError, LlmPort} from "./LlmPort";
import {answerRequest, ModelConfig} from "./Prompts";
import {canRetry, DEADLINES, remainingMs, withDeadline} from "./Deadlines";
import {Scheduler} from "./Scheduler";

export type InterrogationMode = Exclude<AnswerMode, "confession">;
export type AnswerOrigin = "cache" | "model" | "line-bank" | "canonical" | "deflection";
export interface AnswerInput {
  graph: CaseGraph; state: GameState; suspect: string; question: string;
  kind: "chip" | "free"; topic?: string; mode?: InterrogationMode;
}
export interface ChosenAnswer {
  id: number; answer: Answer; mode: InterrogationMode; origin: AnswerOrigin;
  latencyMs: number; attempts: number;
  /** Invalid model replies only; network failures and cancellations are not validator rejections. */
  rejectionCount: number;
}
export interface AnswerCallbacks {
  detective?: (event: {id: number; question: string; topic: string}) => void;
  filler?: (event: {id: number; index: 1 | 2; answer: Answer; mode: "filler"; latencyMs: number}) => void;
  rejected?: (event: {id: number; attempt: number; codes: string[]}) => void;
  chosen?: (answer: ChosenAnswer) => void;
}
export interface AnswerTask {
  id: number; promise: Promise<ChosenAnswer>; cancel(): void;
  /** Pass this to TTS. The next question cancels it even after this answer has resolved. */
  token: CancellationToken;
}
export interface AnswerPipelineOptions {
  clock: ClockPort; scheduler: Scheduler; llm: LlmPort; model: ModelConfig;
  fallbackModel?: ModelConfig;
  lineBank: readonly LineBankEntry[];
}

/** Presentation orchestration only. This class never dispatches game actions or changes state. */
export class AnswerPipeline {
  private nextId = 1;
  private current: AnswerTask | undefined;
  constructor(private readonly options: AnswerPipelineOptions) {}
  cancel(): void {this.current?.cancel();}

  start(input: AnswerInput, callbacks: AnswerCallbacks = {}): AnswerTask {
    if (input.kind !== "chip" && input.kind !== "free") throw new Error("Invalid question kind");
    const mode = input.mode ?? "answer";
    if (!["answer", "press", "broken", "deflect", "lawyered", "filler"].includes(mode)) throw new Error("Interrogation cannot authorize a confession");
    const sheet = buildFactSheet(input.graph, input.state, input.suspect);
    const layer = input.state.suspects[input.suspect].layer;
    const topic = input.topic ?? keywordIntent(input.question, sheet, input.graph).topic;
    if (!answerTopics(sheet).includes(topic)) throw new Error("Question topic is not in the current account");
    // Build and validate all request inputs before replacing the active question.
    const request = answerRequest(sheet, input.question, this.options.model, mode);
    const graph = input.graph; const question = input.question; const kind = input.kind;
    const lockTopic = kind === "chip" || input.topic !== undefined;
    this.current?.cancel();
    const id = this.nextId++; const source = new CancellationSource(); const network = new CancellationSource();
    const started = this.options.clock.nowMs(); const timers: Array<() => void> = [];
    let settled = false; let attempts = 0; let rejectionCount = 0;
    let resolve!: (result: ChosenAnswer) => void; let reject!: (error: unknown) => void;
    const promise = new Promise<ChosenAnswer>((yes, no) => {resolve = yes; reject = no;});
    const clean = () => {for (const stop of timers.splice(0)) stop(); network.cancel();};
    const task: AnswerTask = {id, promise, token: source.token, cancel: () => {
      source.cancel(); clean();
      if (!settled) {settled = true; reject(new LlmError("cancelled"));}
    }};
    this.current = task;
    const active = () => !settled && !source.token.cancelled && this.current === task;
    const notify = (callback: (() => void) | undefined) => {
      // UI failures cannot alter deterministic selection or strand the deadline.
      try {callback?.();} catch { /* The presentation owner handles its own diagnostics. */ }
    };
    const finish = (answer: Answer, origin: AnswerOrigin) => {
      if (!active()) return;
      const chosenMode: InterrogationMode = answer.cites.length === 1 && answer.cites[0] === "none"
        ? (mode === "lawyered" || mode === "filler" ? mode : "deflect") : mode;
      const checked = validateLine(answer, sheet, graph, chosenMode);
      if (!checked.ok || !checked.answer) throw new Error("Invalid deterministic answer floor");
      settled = true; clean();
      const chosen: ChosenAnswer = {id, answer: checked.answer, mode: chosenMode, origin,
        latencyMs: Math.max(0, this.options.clock.nowMs() - started), attempts, rejectionCount};
      // Keep callback and promise consumers isolated from each other's mutations.
      const copy = {...chosen, answer: {...chosen.answer, cites: chosen.answer.cites.slice()}};
      resolve(chosen); notify(callbacks.chosen ? () => callbacks.chosen!(copy) : undefined);
    };
    const fallback = () => {
      if (!active()) return;
      const bank = lookupLine(this.options.lineBank, {suspect: sheet.suspect, topic, layer, mode}, sheet, graph);
      if (bank) {finish(bank, "line-bank"); return;}
      const canonical = canonicalFallback(sheet, topic, mode);
      if (validateLine(canonical, sheet, graph, mode).ok) {
        finish(canonical, canonical.cites[0] === "none" ? "deflection" : "canonical"); return;
      }
      finish(canonicalFallback(sheet, "unclear", "deflect"), "deflection");
    };
    notify(callbacks.detective ? () => callbacks.detective!({id, question, topic}) : undefined);
    if (!active()) return task; // A callback may start a newer question.
    if (kind === "chip") {
      const cached = lookupLine(this.options.lineBank, {suspect: sheet.suspect, topic, layer, mode}, sheet, graph);
      if (cached) {finish(cached, "cache"); return task;}
    }
    const filler = canonicalFallback(sheet, "unclear", "filler");
    if (!validateLine(filler, sheet, graph, "filler").ok) throw new Error("Invalid filler floor");
    for (const [index, at] of [[1, DEADLINES.firstFillerMs], [2, DEADLINES.secondFillerMs]] as const) {
      timers.push(this.options.clock.after(at, () => {
        if (active()) notify(callbacks.filler ? () => callbacks.filler!({id, index, mode: "filler",
          answer: {...filler, cites: filler.cites.slice()}, latencyMs: Math.max(0, this.options.clock.nowMs() - started)}) : undefined);
      }));
    }
    timers.push(this.options.clock.after(DEADLINES.answerMs, fallback));
    const run = async () => {
      while (active()) {
        attempts++;
        try {
          const remaining = remainingMs(started, DEADLINES.answerMs, this.options.clock.nowMs());
          // Deadline wraps the scheduler handle: the scheduler still holds any unabortable transport slot.
          const secondary=this.options.fallbackModel ?? (this.options.model.provider==="gemini" ? {provider:"openai" as const,model:"gpt-4o-mini"} : undefined);
          const attemptRequest=attempts>1 && secondary ? {...request,...secondary} : request;
          const response = await withDeadline(token => this.options.scheduler.submit("live",
            transportToken => this.options.llm.complete(attemptRequest, transportToken), token).promise,
          Math.min(DEADLINES.generationMs, remaining), this.options.clock, network.token);
          if (!active()) return;
          const validated = validateLine(response.content, sheet, graph, mode);
          const wrongTopic = validated.ok && validated.answer && lockTopic
            && validated.answer.topic !== topic && validated.answer.topic !== "unclear";
          if (validated.ok && validated.answer && !wrongTopic) {finish(validated.answer, "model"); return;}
          rejectionCount++;
          notify(callbacks.rejected ? () => callbacks.rejected!({id, attempt: attempts,
            codes: wrongTopic ? ["TOPIC"] : validated.errors.map(issue => issue.code)}) : undefined);
        } catch (error) {
          if (!active()) return;
          if (error instanceof LlmError && error.code === "invalid_response") rejectionCount++;
          notify(callbacks.rejected ? () => callbacks.rejected!({id, attempt: attempts,
            codes: [error instanceof LlmError ? error.code : "unavailable"]}) : undefined);
          // These cannot improve on a retry with the same request and credentials.
          if (error instanceof LlmError && ["cancelled", "unauthenticated", "unsafe_tape", "tape_miss"].includes(error.code)) {fallback(); return;}
        }
        if (!active()) return;
        if (!canRetry(started, this.options.clock.nowMs(), attempts)) {fallback(); return;}
      }
    };
    // All failures take the deterministic floor; never leave a player waiting on an unhandled promise.
    void run().catch(() => {if (active()) fallback();});
    return task;
  }
}
