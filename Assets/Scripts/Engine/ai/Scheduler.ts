import {CancellationSource, CancellationToken, ClockPort, LlmError} from "./LlmPort";

export type RequestPriority = "live" | "case-load" | "speculative";
export interface ScheduledTask<T> {id: number; promise: Promise<T>; cancel(): void;}
interface WorkItem {
  id: number; priority: RequestPriority; source: CancellationSource; run: (token: CancellationToken) => Promise<unknown>;
  resolve: (value: unknown) => void; reject: (error: unknown) => void; settled: boolean; started: boolean;
  unsubscribe: () => void;
}
const priority = {live: 0, "case-load": 1, speculative: 2};

/** Cap counts real pending transports, including cancelled transports that cannot abort immediately. */
export class Scheduler {
  private nextId = 1;
  private queue: WorkItem[] = [];
  private running = new Map<number, WorkItem>();
  private stopped = false;
  private cooldownUntil = 0;
  private rateFailures = 0;
  private cancelWake: (() => void) | undefined;
  constructor(private readonly clock: ClockPort, private readonly capacity: number = 4) {
    if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 4) throw new Error("Scheduler capacity must be between one and four");
  }
  get activeCount(): number {return this.running.size;}
  get queuedCount(): number {return this.queue.length;}
  get rateLimitUntil(): number {return this.cooldownUntil;}

  submit<T>(level: RequestPriority, run: (token: CancellationToken) => Promise<T>, parent?: CancellationToken): ScheduledTask<T> {
    if (!Object.prototype.hasOwnProperty.call(priority, level)) throw new Error("Unknown request priority");
    let resolve!: (value: T) => void; let reject!: (error: unknown) => void;
    const promise = new Promise<T>((yes, no) => {resolve = yes; reject = no;});
    const item: WorkItem = {id: this.nextId++, priority: level, source: new CancellationSource(), run,
      resolve: value => resolve(value as T), reject, settled: false, started: false, unsubscribe: () => {}};
    const handle: ScheduledTask<T> = {id: item.id, promise, cancel: () => this.cancel(item)};
    if (this.stopped || parent?.cancelled) {this.cancel(item); return handle;}
    if (parent) item.unsubscribe = parent.onCancel(() => this.cancel(item));
    this.queue.push(item);
    if (level === "live" && this.running.size >= this.capacity) {
      const speculative = [...this.running.values()].find(work => work.priority === "speculative" && !work.source.token.cancelled);
      if (speculative) this.cancel(speculative);
    }
    this.pump(); return handle;
  }

  /** Drop speculative work first and honor provider Retry-After, otherwise use bounded exponential cooldown. */
  reportRateLimit(retryAfterMs?: number): void {
    if (retryAfterMs !== undefined && (!Number.isFinite(retryAfterMs) || retryAfterMs < 0)) throw new Error("Invalid rate-limit cooldown");
    this.rateFailures++;
    const wait = retryAfterMs ?? Math.min(30000, 1000 * Math.pow(2, Math.min(5, this.rateFailures - 1)));
    this.cooldownUntil = Math.max(this.cooldownUntil, this.clock.nowMs() + wait);
    for (const item of this.queue.slice()) if (item.priority === "speculative") this.cancel(item);
    for (const item of this.running.values()) if (item.priority === "speculative") this.cancel(item);
    this.pump();
  }
  recordSuccess(): void {this.rateFailures = 0;}
  dispose(): void {
    this.stopped = true; this.cancelWake?.(); this.cancelWake = undefined;
    for (const item of this.queue.slice()) this.cancel(item);
    for (const item of this.running.values()) this.cancel(item);
  }
  private cancel(item: WorkItem): void {
    this.queue = this.queue.filter(work => work !== item);
    if (!item.settled) {item.settled = true; item.unsubscribe(); item.reject(new LlmError("cancelled"));}
    item.source.cancel();
    // An active slot is released only by the transport's settlement handler.
  }
  private pump(): void {
    if (this.stopped) return;
    this.cancelWake?.(); this.cancelWake = undefined;
    const cooldown = this.cooldownUntil - this.clock.nowMs();
    if (cooldown > 0) {
      if (this.queue.length) this.cancelWake = this.clock.after(cooldown, () => {this.cancelWake = undefined; this.pump();});
      return;
    }
    this.queue.sort((a, b) => priority[a.priority] - priority[b.priority] || a.id - b.id);
    while (this.running.size < this.capacity && this.queue.length) {
      const item = this.queue.shift()!;
      if (item.settled) continue;
      item.started = true; this.running.set(item.id, item);
      let promise: Promise<unknown>;
      try {promise = Promise.resolve(item.run(item.source.token));} catch (error) {promise = Promise.reject(error);}
      promise.then(value => this.finish(item, true, value), error => this.finish(item, false, error));
    }
  }
  private finish(item: WorkItem, succeeded: boolean, result: unknown): void {
    this.running.delete(item.id);
    item.unsubscribe();
    if (!succeeded && result instanceof LlmError && result.code === "rate_limit") this.reportRateLimit(result.retryAfterMs);
    if (!item.settled) {
      item.settled = true;
      if (!succeeded) {
        item.reject(result);
      } else {this.recordSuccess(); item.resolve(result);}
    }
    this.pump();
  }
}
