import {fnv1a} from "./Hash";

/** sfc32 with deterministic named substreams. fork() never consumes the parent's state. */
export class Prng {
  private a: number; private b: number; private c: number; private d: number;
  private readonly identity: string;
  constructor(seed: number | string, stream: string = "root") {
    this.identity = JSON.stringify([seed, stream]);
    this.a = fnv1a(this.identity + ":a"); this.b = fnv1a(this.identity + ":b");
    this.c = fnv1a(this.identity + ":c"); this.d = fnv1a(this.identity + ":d");
    for (let i = 0; i < 12; i++) this.uint32();
  }
  fork(name: string): Prng {
    if (!name.length) throw new Error("A substream needs a name");
    return new Prng(this.identity, name);
  }
  uint32(): number {
    let t = (this.a + this.b) | 0;
    this.a = this.b ^ this.b >>> 9;
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = this.c << 21 | this.c >>> 11;
    this.d = (this.d + 1) | 0;
    t = (t + this.d) | 0;
    this.c = (this.c + t) | 0;
    return t >>> 0;
  }
  next(): number {return this.uint32() / 4294967296;}
  int(min: number, maxExclusive: number): number {
    const width = maxExclusive - min;
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(maxExclusive) || width < 1 || width > 4294967296) throw new Error("Invalid random integer range");
    const limit = 4294967296 - 4294967296 % width;
    let value: number; do {value = this.uint32();} while (value >= limit);
    return min + value % width;
  }
  pick<T>(items: readonly T[]): T {if (!items.length) throw new Error("Cannot pick from empty list"); return items[this.int(0, items.length)];}
  shuffle<T>(items: readonly T[]): T[] {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {const j = this.int(0, i + 1); const v = result[i]; result[i] = result[j]; result[j] = v;}
    return result;
  }
}
