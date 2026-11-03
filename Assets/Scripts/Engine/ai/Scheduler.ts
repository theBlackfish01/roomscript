import {CancellationSource, CancellationToken, ClockPort, LlmError} from "./LlmPort";

export type RequestPriority = "speech" | "live" | "case-load" | "speculative";
export interface ScheduledTask<T> {id: number; promise: Promise<T>; cancel(): void;}
interface WorkItem {
  id: number; scope:string; priority: RequestPriority; source: CancellationSource; run: (token: CancellationToken) => Promise<unknown>;
  resolve: (value: unknown) => void; reject: (error: unknown) => void; settled: boolean; started: boolean;
  unsubscribe: () => void;
}
const priority = {speech:0, live: 1, "case-load": 2, speculative: 3};

/** Cap counts real pending transports, including cancelled transports that cannot abort immediately. */
export class Scheduler {
  private nextId = 1;
  private queue: WorkItem[] = [];
  private running = new Map<number, WorkItem>();
  private stopped = false;
  private cooldowns:Record<string,number> = {};
  private rateFailures:Record<string,number> = {};
  private cancelWake: (() => void) | undefined;
  constructor(private readonly clock: ClockPort, private readonly capacity: number = 4) {
    if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 4) throw new Error("Scheduler capacity must be between one and four");
  }
  get activeCount(): number {return this.running.size;}
  get queuedCount(): number {return this.queue.length;}
  get rateLimitUntil(): number {return Math.max(0,...Object.values(this.cooldowns));}

  submit<T>(level: RequestPriority, run: (token: CancellationToken) => Promise<T>, parent?: CancellationToken, scope="default"): ScheduledTask<T> {
    if (!Object.prototype.hasOwnProperty.call(priority, level)) throw new Error("Unknown request priority");
    let resolve!: (value: T) => void; let reject!: (error: unknown) => void;
    const promise = new Promise<T>((yes, no) => {resolve = yes; reject = no;});
    const item: WorkItem = {id: this.nextId++, scope, priority: level, source: new CancellationSource(), run,
      resolve: value => resolve(value as T), reject, settled: false, started: false, unsubscribe: () => {}};
    const handle: ScheduledTask<T> = {id: item.id, promise, cancel: () => this.cancel(item)};
    if (this.stopped || parent?.cancelled) {this.cancel(item); return handle;}
    if (parent) item.unsubscribe = parent.onCancel(() => this.cancel(item));
    this.queue.push(item);
    if ((level === "live" || level === "speech") && this.running.size >= this.capacity) {
      const speculative = [...this.running.values()].find(work => work.priority === "speculative" && !work.source.token.cancelled);
      if (speculative) this.cancel(speculative);
    }
    this.pump(); return handle;
  }

  /** Keep retry delays within the interactive budget; long outages fall through to authored answers. */
  reportRateLimit(retryAfterMs?: number, scope="default"): void {
    if (retryAfterMs !== undefined && (!Number.isFinite(retryAfterMs) || retryAfterMs < 0)) throw new Error("Invalid rate-limit cooldown");
    this.rateFailures[scope]=(this.rateFailures[scope]||0)+1;
    const wait = Math.min(2500,retryAfterMs ?? 1000 * Math.pow(2, Math.min(5, this.rateFailures[scope] - 1)));
    this.cooldowns[scope] = Math.max(this.cooldowns[scope]||0, this.clock.nowMs() + wait);
    for (const item of this.queue.slice()) if (item.scope===scope && item.priority === "speculative") this.cancel(item);
    for (const item of this.running.values()) if (item.scope===scope && item.priority === "speculative") this.cancel(item);
    this.pump();
  }
  recordSuccess(scope="default"): void {this.rateFailures[scope] = 0;}
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
    const waits=this.queue.map(item=>(this.cooldowns[item.scope]||0)-this.clock.nowMs()).filter(wait=>wait>0);
    if(waits.length)this.cancelWake=this.clock.after(Math.min(...waits),()=>{this.cancelWake=undefined;this.pump();});
    this.queue.sort((a, b) => priority[a.priority] - priority[b.priority] || a.id - b.id);
    while (this.running.size < this.capacity && this.queue.length) {
      // With multiple slots, leave one genuinely idle for live work. Cancelling
      // an unabortable background request cannot create physical capacity.
      const next=this.queue.findIndex(item=>(this.cooldowns[item.scope]||0)<=this.clock.nowMs()&&(this.capacity===1||item.priority==="live"||item.priority==="speech"||this.running.size<this.capacity-1));
      if(next<0)break;
      const item = this.queue.splice(next,1)[0];
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
    if (!succeeded && result instanceof LlmError && result.code === "rate_limit") this.reportRateLimit(result.retryAfterMs,item.scope);
    if (!item.settled) {
      item.settled = true;
      if (!succeeded) {
        item.reject(result);
      } else {this.recordSuccess(item.scope); item.resolve(result);}
    }
    this.pump();
  }
}
