import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { sceneTokenFields } from "./scene-tokens.mjs";

export function inspectFile(filename, content) {
  const path = filename.replaceAll("\\", "/").toLowerCase();
  const issues = [];
  if (/(^|\/)(\.mcp\.json|ls-live-instance\.json(?:\.tmp)?|[^/]*\.pem)$/.test(path)
      || /(^|\/)(\.claude\/settings\.local\.json|\.codex\/config\.toml)$/.test(path)
      || /(^|\/)\.env(?:\.[^/]*)?$/.test(path)) {
    issues.push("forbidden secret/local filename");
  }
  if (/\bBearer[\t ]+/i.test(content)) issues.push("authorization credential");
  if (/-----BEGIN [A-Z0-9 ][A-Z0-9 -]*-----/.test(content)) issues.push("PEM block");
  if (path.endsWith(".scene")) {
    try {
      if (sceneTokenFields(content).some(field => !field.empty)) issues.push("non-empty gateway token");
    } catch {
      issues.push("unparseable scene (cannot verify gateway tokens)");
    }
  }
  return issues;
}

export function checkStaged(cwd = process.cwd()) {
  const git = args => execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const names = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"]).split("\0").filter(Boolean);
  const failures = [];
  for (const name of names) {
    // Read the index, never the working copy. Paths are arguments, never shell code.
    const content = git(["show", `:${name}`]);
    const issues = inspectFile(name, content);
    if (issues.length) failures.push({ name, issues });
  }
  return failures;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const failures = checkStaged();
    if (failures.length) {
      for (const item of failures) console.error(`${item.name}: ${item.issues.join(", ")}`);
      console.error("Commit blocked. Remove secrets, then stage the cleaned files again. Values are never printed.");
      process.exitCode = 1;
    } else console.log("Secret check passed (staged content).");
  } catch {
    console.error("Secret check could not read the index. Commit blocked.");
    process.exitCode = 1;
  }
}
