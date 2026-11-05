import {execFileSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
execFileSync(process.execPath,[resolve(root,'../node_modules/tsx/dist/cli.mjs'),resolve(root,'scripts/cards-from-case.ts')],{timeout:60000,stdio:'inherit'});
execFileSync(process.execPath,['--test',resolve(root,'tests/contracts.test.mjs')],{timeout:60000,stdio:'inherit'});
