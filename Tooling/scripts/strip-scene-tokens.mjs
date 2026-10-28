import { readFileSync, writeFileSync } from "node:fs";
import { resolve, relative, extname, dirname, isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stripSceneTokens } from "./scene-tokens.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export function stripSceneFile(filename) {
  const path = resolve(projectRoot, filename);
  const withinAssets = relative(resolve(projectRoot, "Assets"), path);
  if (withinAssets.startsWith("..") || isAbsolute(withinAssets) || extname(path).toLowerCase() !== ".scene") {
    throw new Error("Only .scene files inside this project's Assets directory can be stripped.");
  }
  const original = readFileSync(path, "utf8");
  const clean = stripSceneTokens(original);
  if (clean.count) writeFileSync(path, clean.source, "utf8");
  return clean.count;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const paths = process.argv.slice(2);
    for (const filename of paths.length ? paths : ["Assets/Scene.scene"]) {
      const count = stripSceneFile(filename);
      console.log(`${filename}: blanked ${count} credential field(s). Stage the cleaned scene again before committing.`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
