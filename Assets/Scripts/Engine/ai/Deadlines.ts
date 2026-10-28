import {CancellationSource, CancellationToken, ClockPort, LlmError} from "./LlmPort";

export const DEADLINES = {
  generationMs: 5000, ttsMs: 4000, answerMs: 6500, retryMinimumRemainingMs: 2500,
  firstFillerMs: 600, secondFillerMs: 2500, pitchMs: 20000, compileAndRepairMs: 25000, linePackMs: 20000,
} as const;

export function remainingMs(startedAt: number, budgetMs: number, now: number): number {
  if (![startedAt, budgetMs, now].every(Number.isFinite) || budgetMs < 0) throw new Error("Invalid deadline");
  return Math.max(0, budgetMs - Math.max(0, now - startedAt));
}
export function canRetry(startedAt: number, now: number, attemptsSoFar: number, budgetMs: number = DEADLINES.answerMs): boolean {
  return attemptsSoFar === 1 && remainingMs(startedAt, budgetMs, now) >= DEADLINES.retryMinimumRemainingMs;
}

/** Deadline cancellation is logical; late transport results are ignored and never emitted. */
export function withDeadline<T>(operation: (token: CancellationToken) => Promise<T>, timeoutMs: number,
  clock: ClockPort, parent?: CancellationToken): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) return Promise.reject(new Error("Invalid deadline"));
  if (parent?.cancelled) return Promise.reject(new LlmError("cancelled"));
  if (timeoutMs === 0) return Promise.reject(new LlmError("timeout"));
  return new Promise<T>((resolve, reject) => {
    const source = new CancellationSource();
    let settled = false;
    let stopTimer = () => {};
    let unsubscribe = () => {};
    const finish = (succeeded: boolean, result: unknown) => {
      if (settled) return;
      settled = true; stopTimer(); unsubscribe();
      if (succeeded) resolve(result as T); else reject(result);
    };
    stopTimer = clock.after(timeoutMs, () => {finish(false, new LlmError("timeout")); source.cancel();});
    if (parent) unsubscribe = parent.onCancel(() => {finish(false, new LlmError("cancelled")); source.cancel();});
    if (settled) {stopTimer(); unsubscribe(); return;}
    try {Promise.resolve(operation(source.token)).then(value => finish(true, value), error => finish(false, error));}
    catch (error) {finish(false, error);}
  });
}

export function delay(ms: number, clock: ClockPort, cancellation?: CancellationToken): Promise<void> {
  if (!Number.isFinite(ms) || ms < 0) return Promise.reject(new Error("Invalid delay"));
  if (cancellation?.cancelled) return Promise.reject(new LlmError("cancelled"));
  if (ms === 0) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let stopTimer = () => {};
    let unsubscribe = () => {};
    const finish = (cancelled: boolean) => {
      if (settled) return;
      settled = true; stopTimer(); unsubscribe();
      if (cancelled) reject(new LlmError("cancelled")); else resolve();
    };
    stopTimer = clock.after(ms, () => finish(false));
    if (cancellation) unsubscribe = cancellation.onCancel(() => finish(true));
    if (settled) {stopTimer(); unsubscribe();}
  });
}
