import {describe, expect, it} from "vitest";
import {Prng} from "../../../Assets/Scripts/Engine/core/Prng";
import {fnv1a, hashHex} from "../../../Assets/Scripts/Engine/core/Hash";
import {canonicalJson} from "../../../Assets/Scripts/Engine/core/CanonicalJson";

describe("deterministic core", () => {
  it("reproduces sequences and separates named streams from consumption order", () => {
    const a = new Prng(1041), b = new Prng(1041);
    expect(Array.from({length: 100}, () => a.uint32())).toEqual(Array.from({length: 100}, () => b.uint32()));
    const root = new Prng(1041);
    const room = root.fork("room"); const expected = new Prng(1041).fork("room");
    for (let i = 0; i < 100; i++) root.fork("performance").next();
    root.next();
    expect(Array.from({length: 20}, () => room.next())).toEqual(Array.from({length: 20}, () => expected.next()));
    expect(root.fork("room").next()).not.toBe(root.fork("case").next());
    expect(root.fork("x/y").next()).not.toBe(root.fork("x").fork("y").next());
  });
  it("bounds samples, does not mutate shuffles, rejects empty choices", () => {
    const rng = new Prng(15), source = [1,2,3,4,5];
    expect(rng.shuffle(source).sort()).toEqual(source);
    expect(source).toEqual([1,2,3,4,5]);
    for (let i=0;i<1000;i++) {const n=rng.int(-2,3); expect(n>=-2 && n<3 && Number.isInteger(n)).toBe(true);}
    expect(() => rng.pick([])).toThrow(); expect(() => rng.int(1,1)).toThrow();
  });
  it("matches independent published FNV-1a vectors", () => {
    expect(hashHex("")).toBe("811c9dc5"); expect(hashHex("hello")).toBe("4f9f2cab");
    expect(hashHex("foobar")).toBe("bf9cf968");
    const bytes = new TextEncoder().encode("é 🕵");
    let reference=0x811c9dc5; for (const byte of bytes) reference=Math.imul(reference^byte,0x01000193)>>>0;
    expect(fnv1a("é 🕵")).toBe(reference);
  });
  it("canonicalizes nested object insertion order but preserves array order", () => {
    expect(canonicalJson({z:[3,{b:2,a:1}],a:true})).toBe('{"a":true,"z":[3,{"a":1,"b":2}]}');
    expect(canonicalJson({b:2,a:1})).toBe(canonicalJson({a:1,b:2}));
    expect(canonicalJson([1,2])).not.toBe(canonicalJson([2,1]));
    const shared={a:1}; expect(canonicalJson([shared,shared])).toBe('[{"a":1},{"a":1}]');
  });
  it("rejects unsupported, cyclic and lossy canonical values", () => {
    const cycle: Record<string,unknown>={}; cycle.self=cycle;
    for (const value of [undefined, NaN, Infinity, {a:undefined}, new Date(), cycle, Array(2)]) expect(() => canonicalJson(value)).toThrow();
  });
});
