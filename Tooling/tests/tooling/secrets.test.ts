import { describe, expect, it, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { inspectFile, checkStaged } from "../../scripts/check-secrets.mjs";
import { stripSceneTokens } from "../../scripts/scene-tokens.mjs";

const temporaryDirectories: string[] = [];
afterEach(() => {
  for (const path of temporaryDirectories.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe("secret guard", () => {
  it("rejects live Preview bridge capabilities and permits an empty session",()=>{expect(inspectFile("LocalBridgeSession.ts","rsb_"+"a".repeat(64))).toEqual(["live Preview bridge session"]);expect(inspectFile("LocalBridgeSession.ts",'export const SESSION={token:""};')).toEqual([]);});
  it.each(["sk-", "sk-ant-", "sk-proj-", "AIza"])("rejects %s API keys in any file without exposing values", prefix => {
    const credential = prefix + "x".repeat(40);
    for (const path of ["fixture.txt", "asset.meta", "asset.prefab"]) {
      expect(inspectFile(path, credential)).toEqual(["API key"]);
    }
    expect(inspectFile("notes.md", prefix + " pattern")).toEqual([]);
  });
  it.each(["key.pem", ".mcp.json", "nested/.mcp.json", "ls-live-instance.json", ".claude/settings.local.json", ".codex/config.toml", ".env.local"])("rejects forbidden path %s", path => {
    expect(inspectFile(path, "")).toContain("forbidden secret/local filename");
  });
  it("rejects authorization credentials without printing them", () => {
    const header = "Bear" + "er " + "synthetic-credential";
    const issues = inspectFile("example.txt", header);
    expect(issues).toEqual(["authorization credential"]);
    expect(issues.join()).not.toContain("synthetic");
  });
  it("rejects PEM blocks", () => {
    expect(inspectFile("example.txt", "-----BE" + "GIN PRIVATE KEY-----")).toEqual(["PEM block"]);
  });
  it("rejects an empty authorization prefix too", () => {
    expect(inspectFile("example.txt", "Bear" + "er ")).toEqual(["authorization credential"]);
  });
  it.each(["snapToken", "openAIToken", "googleToken"])("rejects populated JSON field %s", key => {
    expect(inspectFile("Assets/Scene.scene", JSON.stringify({ [key]: "synthetic" }))).toEqual(["non-empty gateway token"]);
  });
  it("accepts empty credentials and boolean Lens input metadata", () => {
    const source = 'ScriptInputsDefault:\n  snapToken: true\nScriptInputs:\n  "":\n    snapToken: ""\n    openAIToken: null\n    googleToken:\n';
    expect(inspectFile("Assets/Scene.scene", source)).toEqual([]);
  });
  it("fails closed for malformed scenes", () => {
    expect(inspectFile("bad.scene", '{"snapToken": [')).toEqual(["unparseable scene (cannot verify gateway tokens)"]);
  });
  it("checks staged content even after the working file is cleaned", () => {
    const directory = mkdtempSync(join(tmpdir(), "roomscript-secret-test-"));
    temporaryDirectories.push(directory);
    const git = (args: string[]) => execFileSync("git", args, { cwd: directory, stdio: "pipe" });
    git(["init"]);
    writeFileSync(join(directory, "scene.scene"), JSON.stringify({ snapToken: "synthetic" }));
    git(["add", "scene.scene"]);
    writeFileSync(join(directory, "scene.scene"), '{"snapToken":""}');
    expect(checkStaged(directory)).toEqual([{ name: "scene.scene", issues: ["non-empty gateway token"] }]);
    git(["add", "scene.scene"]);
    expect(checkStaged(directory)).toEqual([]);
  });
});

describe("scene credential stripping", () => {
  it("preserves Lens tags, CRLF, comments and unrelated scalar values", () => {
    const source = '- !<ScriptComponent/test>\r\n  Name: Credentials\r\n  ScriptInputsDefault:\r\n    snapToken: true\r\n  ScriptInputs:\r\n    "":\r\n      snapToken: "synthetic" # keep comment\r\n      googleToken: plain-synthetic\r\n      openAIToken: \'single-synthetic\'\r\n      label: unchanged\r\n';
    const result = stripSceneTokens(source);
    expect(result.count).toBe(3);
    expect(result.source).toBe(source.replace('"synthetic"', '""').replace("plain-synthetic", '""').replace("'single-synthetic'", '""'));
    expect(inspectFile("scene.scene", result.source)).toEqual([]);
  });
  it("removes multiline block credentials", () => {
    const result = stripSceneTokens("snapToken: |\n  synthetic\n  continuation\nname: keep\n");
    expect(result.source).not.toContain("synthetic");
    expect(result.source).toContain("name: keep");
    expect(inspectFile("scene.scene", result.source)).toEqual([]);
  });
  it("strips compact JSON with escaped quotes and preserves formatting", () => {
    const source = '{"snapToken":"syn\\\"thetic","label":"keep","googleToken":""}';
    expect(stripSceneTokens(source)).toEqual({ source: '{"snapToken":"","label":"keep","googleToken":""}', count: 1 });
  });
  it("refuses nested credential shapes", () => {
    expect(() => stripSceneTokens("snapToken: {value: synthetic}\n")).toThrow("Unsupported");
  });
  it("is idempotent on the actual template scene", () => {
    const source = readFileSync(new URL("../../../Assets/Scene.scene", import.meta.url), "utf8");
    // This test never prints scene text, even when the editor has live credentials.
    const clean = stripSceneTokens(source);
    expect(stripSceneTokens(clean.source).count).toBe(0);
    expect(inspectFile("Assets/Scene.scene", clean.source)).toEqual([]);
  });
});
