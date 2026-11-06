// node recut.mjs <Name> [frame...]  re-run cutout.py for frames from config.json (raw -> cut) with per-character/frame cut_args
import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
const [name, ...only] = process.argv.slice(2);
const c = JSON.parse(fs.readFileSync('config.json'))[name];
for (const [fr, fc] of Object.entries(c.frames)) {
  if (only.length && !only.includes(fr)) continue;
  const args = [...(fc.cut_args || c.cut_args || []), fc.raw, fc.cut];
  console.log(execFileSync('.venv/Scripts/python', ['scripts/cutout.py', ...args]).toString().trim());
}
