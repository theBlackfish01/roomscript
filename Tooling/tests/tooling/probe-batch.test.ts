import {describe, it, expect} from "vitest";
import {settleProbeBatch} from "../../../Assets/Scripts/RoomscriptProbeBatch";

describe("probe concurrency measurement", () => {
  it("waits for every sibling after an early rejection", async () => {
    let release!: () => void;
    let finished = false;
    const failure = new Error("rate limit");
    const result = settleProbeBatch([
      () => Promise.reject(failure),
      () => new Promise<void>(resolve => {release = resolve;}),
      () => Promise.resolve(),
      () => Promise.resolve()
    ]).then(() => {finished = true;}, error => {finished = true; return error;});
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(finished).toBe(false);
    release();
    expect(await result).toBe(failure);
    expect(finished).toBe(true);
  });
  it("settles synchronous failures without skipping other tasks", async () => {
    let calls = 0;
    await expect(settleProbeBatch([
      () => {throw new Error("sync");},
      async () => {calls++;}
    ])).rejects.toThrow("sync");
    expect(calls).toBe(1);
  });
});
