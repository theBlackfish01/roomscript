import {execFileSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
for(const file of ['run.mjs','scripts/motion.mjs','scripts/test.mjs'])execFileSync(process.execPath,[resolve(root,file)],{timeout:540000,stdio:'inherit'});
