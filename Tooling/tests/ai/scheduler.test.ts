import {describe, it, expect, vi} from "vitest";
import {Scheduler, RequestPriority} from "../../../Assets/Scripts/Engine/ai/Scheduler";
import {CancellationSource, LlmError} from "../../../Assets/Scripts/Engine/ai/LlmPort";
import {FakeClock, deferred, flush} from "./helpers";

describe("bounded provider scheduler", () => {
  it("never starts more than four real transports and preserves queue priority then FIFO", async () => {
    const scheduler = new Scheduler(new FakeClock());
    const pending = Array.from({length: 8}, () => deferred<number>()); const started: number[] = [];
    const levels: RequestPriority[] = ["case-load", "case-load", "case-load", "case-load", "speculative", "live", "case-load", "live"];
    const tasks = levels.map((level, i) => scheduler.submit(level, () => {started.push(i); return pending[i].promise;}));
    expect(started).toEqual([0, 1, 2, 3]); expect(scheduler.activeCount).toBe(4);
    pending[0].resolve(0); await flush(); expect(started).toEqual([0, 1, 2, 3, 5]);
    pending[1].resolve(1); await flush(); expect(started.at(-1)).toBe(7);
    pending[2].resolve(2); await flush(); expect(started.at(-1)).toBe(6);
    pending[3].resolve(3); await flush(); expect(started.at(-1)).toBe(4);
    for (let i = 4; i < 8; i++) pending[i].resolve(i);
    expect(await Promise.all(tasks.map(task => task.promise))).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(scheduler.activeCount).toBe(0);
  });
  it("cancels speculative work for live requests without pretending an unabortable transport has stopped", async () => {
    const scheduler = new Scheduler(new FakeClock(), 1); const old = deferred<number>();
    let cancelled = false;
    const spec = scheduler.submit("speculative", token => {token.onCancel(() => {cancelled = true;}); return old.promise;});
    const rejected = expect(spec.promise).rejects.toMatchObject({code: "cancelled"});
    const liveRun = vi.fn(async () => 2); const live = scheduler.submit("live", liveRun);
    await rejected; expect(cancelled).toBe(true); expect(liveRun).not.toHaveBeenCalled(); expect(scheduler.activeCount).toBe(1);
    old.resolve(1); await flush(); expect(await live.promise).toBe(2); expect(liveRun).toHaveBeenCalledOnce();
  });
  it("removes cancelled queued work and propagates parent cancellation", async () => {
    const scheduler = new Scheduler(new FakeClock(), 1); const first = deferred<number>();
    const active = scheduler.submit("live", () => first.promise);
    const parent = new CancellationSource(); const run = vi.fn(async () => 1);
    const queued = scheduler.submit("case-load", run, parent.token); const rejected = expect(queued.promise).rejects.toMatchObject({code: "cancelled"});
    parent.cancel(); await rejected; expect(scheduler.queuedCount).toBe(0);
    first.resolve(0); await active.promise; expect(run).not.toHaveBeenCalled();
  });
  it("holds all queued calls during cooldown, cancels speculation, and applies bounded exponential backoff", async () => {
    const clock = new FakeClock(); const scheduler = new Scheduler(clock);
    scheduler.reportRateLimit(); expect(scheduler.rateLimitUntil).toBe(1000);
    const run = vi.fn(async () => 3); const live = scheduler.submit("live", run);
    const spec = scheduler.submit("speculative", run); const rejected = expect(spec.promise).rejects.toMatchObject({code: "cancelled"});
    scheduler.reportRateLimit(); await rejected; expect(scheduler.rateLimitUntil).toBe(2000);
    clock.advance(1999); await flush(); expect(run).not.toHaveBeenCalled();
    clock.advance(1); await flush(); expect(await live.promise).toBe(3);
    scheduler.reportRateLimit(); expect(scheduler.rateLimitUntil).toBe(3000); // Success reset the backoff.
    for (let i = 0; i < 10; i++) scheduler.reportRateLimit();
    expect(scheduler.rateLimitUntil).toBe(32000);
    scheduler.reportRateLimit(45000); expect(scheduler.rateLimitUntil).toBe(47000);
    scheduler.dispose(); expect(clock.pending).toBe(0);
  });
  it("honors a rate limit even from a cancelled speculative transport", async () => {
    const clock = new FakeClock(); const scheduler = new Scheduler(clock, 1); const pending = deferred<void>();
    const spec = scheduler.submit("speculative", () => pending.promise); const rejected = expect(spec.promise).rejects.toMatchObject({code: "cancelled"});
    const run = vi.fn(async () => true); const live = scheduler.submit("live", run);
    await rejected; pending.reject(new LlmError("rate_limit", 1200)); await flush();
    expect(run).not.toHaveBeenCalled(); clock.advance(1200); await flush(); expect(await live.promise).toBe(true);
  });
  it("releases slots on sync throws and preserves rejection with undefined", async () => {
    const scheduler = new Scheduler(new FakeClock(), 1);
    const first = scheduler.submit("live", () => {throw new Error("expected");});
    const second = scheduler.submit("live", () => Promise.reject(undefined));
    const third = scheduler.submit("live", async () => "done");
    await expect(first.promise).rejects.toThrow("expected");
    await expect(second.promise).rejects.toBeUndefined(); expect(await third.promise).toBe("done");
  });
  it("dispose rejects active and future work, cancels timers, and keeps cap validation strict", async () => {
    const clock = new FakeClock(); const scheduler = new Scheduler(clock, 1); const pending = deferred<void>();
    const active = scheduler.submit("live", () => pending.promise); const rejected = expect(active.promise).rejects.toMatchObject({code: "cancelled"});
    scheduler.reportRateLimit(100); const queued = scheduler.submit("case-load", async () => true);
    const rejectedQueued = expect(queued.promise).rejects.toMatchObject({code: "cancelled"});
    scheduler.dispose(); await rejected; await rejectedQueued; expect(clock.pending).toBe(0);
    await expect(scheduler.submit("live", async () => 0).promise).rejects.toMatchObject({code: "cancelled"});
    pending.resolve(); await flush(); expect(scheduler.activeCount).toBe(0);
    expect(() => new Scheduler(clock, 5)).toThrow(); expect(() => new Scheduler(clock, 0)).toThrow();
    expect(() => scheduler.submit("toString" as RequestPriority, async () => 0)).toThrow();
  });
});
