import {describe, it, expect, vi} from "vitest";
import {canRetry, DEADLINES, delay, remainingMs, withDeadline} from "../../../Assets/Scripts/Engine/ai/Deadlines";
import {CancellationSource} from "../../../Assets/Scripts/Engine/ai/LlmPort";
import {FakeClock, deferred, flush} from "./helpers";

describe("answer budgets", () => {
  it("uses hard product budgets and permits only one retry with at least 2500ms left", () => {
    expect(DEADLINES).toMatchObject({generationMs: 5000, ttsMs: 4000, answerMs: 6500, firstFillerMs: 600, secondFillerMs: 2500});
    expect(canRetry(100, 4100, 1)).toBe(true); expect(canRetry(100, 4101, 1)).toBe(false);
    expect(canRetry(100, 100, 2)).toBe(false); expect(canRetry(100, 100, 0)).toBe(false);
    expect(remainingMs(0, 6500, 9000)).toBe(0); expect(remainingMs(100, 1000, 50)).toBe(1000);
    expect(() => remainingMs(0, -1, 0)).toThrow(); expect(() => remainingMs(NaN, 1, 0)).toThrow();
  });
  it("cancels timed out operations and ignores their late response", async () => {
    const clock = new FakeClock(); const pending = deferred<string>(); let cancelled = false;
    const promise = withDeadline(token => {token.onCancel(() => {cancelled = true;}); return pending.promise;}, 5000, clock);
    const rejected = expect(promise).rejects.toMatchObject({code: "timeout"});
    clock.advance(5000); await rejected; expect(cancelled).toBe(true); expect(clock.pending).toBe(0);
    pending.resolve("late"); await flush(); await expect(promise).rejects.toMatchObject({code: "timeout"});
  });
  it("cleans up successful, failed, synchronously failing and undefined rejection operations", async () => {
    const clock = new FakeClock(); expect(await withDeadline(async () => 5, 50, clock)).toBe(5); expect(clock.pending).toBe(0);
    await expect(withDeadline(() => {throw new Error("sync");}, 50, clock)).rejects.toThrow("sync");
    await expect(withDeadline(() => Promise.reject(undefined), 50, clock)).rejects.toBeUndefined(); expect(clock.pending).toBe(0);
  });
  it("does not start already cancelled or zero-budget requests and propagates parent cancellation", async () => {
    const clock = new FakeClock(); const parent = new CancellationSource(); const run = vi.fn(async () => 1);
    parent.cancel(); await expect(withDeadline(run, 100, clock, parent.token)).rejects.toMatchObject({code: "cancelled"});
    await expect(withDeadline(run, 0, clock)).rejects.toMatchObject({code: "timeout"}); expect(run).not.toHaveBeenCalled();
    const next = new CancellationSource(); const pending = deferred<void>();
    const promise = withDeadline(() => pending.promise, 50, clock, next.token); const rejected = expect(promise).rejects.toMatchObject({code: "cancelled"});
    next.cancel(); await rejected; pending.resolve(); await flush(); expect(clock.pending).toBe(0);
  });
  it("replay delays use injected time and cancel without orphan timers", async () => {
    const clock = new FakeClock(); let done = false; const pause = delay(200, clock).then(() => {done = true;});
    clock.advance(199); await flush(); expect(done).toBe(false); clock.advance(1); await pause;
    const source = new CancellationSource(); const cancelled = delay(100, clock, source.token);
    const rejected = expect(cancelled).rejects.toMatchObject({code: "cancelled"}); source.cancel(); await rejected; expect(clock.pending).toBe(0);
    await expect(delay(-1, clock)).rejects.toThrow();
  });
});
