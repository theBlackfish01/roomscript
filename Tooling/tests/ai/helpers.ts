import {ClockPort} from "../../../Assets/Scripts/Engine/ai/LlmPort";

export class FakeClock implements ClockPort {
  time = 0;
  private serial = 0;
  private timers = new Map<number, {at: number; callback: () => void}>();
  nowMs(): number {return this.time;}
  after(ms: number, callback: () => void): () => void {
    const id = this.serial++;
    this.timers.set(id, {at: this.time + ms, callback});
    return () => {this.timers.delete(id);};
  }
  get pending(): number {return this.timers.size;}
  advance(ms: number): void {
    const end = this.time + ms;
    for (;;) {
      const next = [...this.timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!next) break;
      this.time = next[1].at; this.timers.delete(next[0]); next[1].callback();
    }
    this.time = end;
  }
}
export function deferred<T>() {
  let resolve!: (value: T) => void; let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {resolve = yes; reject = no;});
  return {promise, resolve, reject};
}
export async function flush(): Promise<void> {for (let i = 0; i < 8; i++) await Promise.resolve();}
