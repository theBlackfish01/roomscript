import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {basename, join, resolve, sep} from "node:path";
import {afterEach, describe, it, expect} from "vitest";
import {harvestTapeText, renderTapeModule, writeTapeModule, harvestTapeFile, readTapeFile, main} from "../../scripts/harvest-tape";
import {encodeTapeEntry, TapeEntry, tapeKey} from "../../../Assets/Scripts/Engine/ai/Tape";
import {canonicalJson} from "../../../Assets/Scripts/Engine/core/CanonicalJson";

const roots: string[] = [];
function sandbox() {
  const directory = mkdtempSync(join(tmpdir(), "roomscript-tape-test-")); roots.push(directory);
  const root = join(directory, "Tapes");
  return {directory, root, output: join(root, "Capture.ts")};
}
afterEach(() => {for (const directory of roots.splice(0)) {
  const target = resolve(directory);
  if (!target.startsWith(resolve(tmpdir()) + sep) || !basename(target).startsWith("roomscript-tape-test-")) throw new Error("Unsafe test cleanup target");
  rmSync(target, {recursive: true, force: true});
}});
function entry(occurrence = 0): TapeEntry {
  return {version: 1, key: tapeKey({provider: "gemini", model: "test-model", promptVersion: "v1", messages: [{role: "user", content: "Question"}]}),
    occurrence, model: "test-model", promptVersion: "v1", response: {content: '{"line":"The clock’s missing. 🕵️"}'}, latencyMs: 1000, at: 5000};
}

describe("safe tape harvesting", () => {
  it("extracts only protocol lines from timestamped raw logs", () => {
    const input = "unrelated environment diagnostics\n[2026-10-28 21:00] [Info] " + encodeTapeEntry(entry()) + "\r\nother output";
    expect(harvestTapeText(input)).toEqual([entry()]);
  });
  it("reads nested RunAndCollectLogsTool JSON and text envelopes without copying metadata", () => {
    const line = encodeTapeEntry(entry());
    const input = JSON.stringify({metadata: {debug: "sensitive-unrelated-value"}, content: [{type: "text", text: JSON.stringify({logs: ["[Info] " + line]})}], structuredContent: {logs: [line]}});
    const entries = harvestTapeText(input); expect(entries).toEqual([entry()]);
    expect(renderTapeModule(entries, "../../Engine/ai/Tape")).not.toContain("sensitive-unrelated-value");
  });
  it("preserves separate repeated requests and collapses only byte-equivalent envelope duplicates", () => {
    expect(harvestTapeText([encodeTapeEntry(entry(1)), encodeTapeEntry(entry()), encodeTapeEntry(entry())].join("\n"))).toEqual([entry(), entry(1)]);
    const conflict = {...entry(), response: {content: "different response"}};
    expect(() => harvestTapeText(encodeTapeEntry(entry()) + "\n" + encodeTapeEntry(conflict))).toThrow("Conflicting tape occurrence");
  });
  it("rejects malformed markers and mismatched keys without exposing the raw line", () => {
    const diagnostic = "sensitive-diagnostic-value";
    expect(() => harvestTapeText("TAPE|malformed|" + diagnostic)).toThrow("Invalid or unsafe tape record");
    try {harvestTapeText("TAPE|malformed|" + diagnostic);} catch (error) {expect(String(error)).not.toContain(diagnostic);}
    expect(() => harvestTapeText(encodeTapeEntry(entry()).replace(entry().key, "0".repeat(40)))).toThrow();
  });
  it("rejects encoded credentials using the shared decoder before producing source", () => {
    // Forge an encoded payload to exercise decoder validation independently of the safe encoder.
    const unsafe = {...entry(), response: {content: JSON.stringify({googleToken: "opaque-credential"})}};
    const line = "TAPE|" + unsafe.key + "|" + Buffer.from(canonicalJson(unsafe)).toString("base64");
    expect(() => harvestTapeText(line)).toThrow("Invalid or unsafe tape record");
    expect(() => renderTapeModule([unsafe], "../../Engine/ai/Tape")).toThrow();
  });
  it("writes an importable typed module and leaves identical existing output unchanged", () => {
    const {root, output} = sandbox(); const result = writeTapeModule([entry(), entry()], output, root);
    expect(result).toMatchObject({count: 1, written: true}); const source = readFileSync(output, "utf8");
    expect(source).toContain("import type {TapeEntry}"); expect(source).toContain("export const tapeEntries: TapeEntry[]");
    const payload = source.slice(source.indexOf(" = ") + 3, source.lastIndexOf(";"));
    expect(JSON.parse(payload)).toEqual([entry()]);
    expect(writeTapeModule([entry()], output, root).written).toBe(false);
  });
  it("never overwrites unrelated or changed generated files", () => {
    const {root, output} = sandbox(); mkdirSync(root); writeFileSync(output, "export const unrelated = true;\n");
    expect(() => writeTapeModule([entry()], output, root)).toThrow("already exists");
    expect(readFileSync(output, "utf8")).toBe("export const unrelated = true;\n");
    const next = join(root, "Next.ts"); writeTapeModule([entry()], next, root);
    expect(() => writeTapeModule([entry(1)], next, root)).toThrow("already exists");
  });
  it("refuses traversal, non-TypeScript outputs and redirected Tapes directories", () => {
    const {directory, root} = sandbox();
    for (const output of [join(root, "../escape.ts"), join(root, "nested/escape.ts"), join(root, "bad.json"), join(root, "../Reducer.ts")]) {
      expect(() => writeTapeModule([entry()], output, root)).toThrow("Output must");
    }
    const elsewhere = join(directory, "elsewhere"); mkdirSync(elsewhere);
    symlinkSync(elsewhere, root, "junction");
    expect(() => writeTapeModule([entry()], join(root, "Capture.ts"), root)).toThrow("redirected Tapes");
    expect(existsSync(join(elsewhere, "Capture.ts"))).toBe(false);
  });
  it("fails an empty harvest without creating any directory or file", () => {
    const {root, output} = sandbox(); expect(() => writeTapeModule([], output, root)).toThrow("No tape records");
    expect(existsSync(root)).toBe(false);
  });
  it("validates CLI shape and byte offset before reading a file", () => {
    expect(() => main([])).toThrow("Usage:");
    expect(() => main(["input", "output", "--wrong", "2"])).toThrow("Usage:");
    for (const value of [-1, 0.5, NaN]) expect(() => harvestTapeFile("not-found", "not-found", value)).toThrow("nonnegative integer");
  });
  it("uses byte offsets to isolate a new reset batch without merging conflicting occurrences", () => {
    const {directory} = sandbox(); const input = join(directory, "capture.log");
    const previous = {...entry(), response: {content: "previous batch"}};
    const prefix = "Unicode prefix 🕵️\n" + encodeTapeEntry(previous) + "\n";
    writeFileSync(input, prefix + encodeTapeEntry(entry()) + "\n");
    expect(() => readTapeFile(input)).toThrow("Conflicting tape occurrence");
    expect(readTapeFile(input, Buffer.byteLength(prefix, "utf8"))).toEqual([entry()]);
  });
  it("keeps source-injection characters inside serialized response strings", () => {
    const sample = {...entry(), response: {content: '"; throw new Error("injected"); //\n\u2028'}};
    const source = renderTapeModule([sample], "../../Engine/ai/Tape");
    const payload = source.slice(source.indexOf(" = ") + 3, source.lastIndexOf(";"));
    expect(JSON.parse(payload)).toEqual([sample]); expect(source).toContain("\\u2028");
  });
});
