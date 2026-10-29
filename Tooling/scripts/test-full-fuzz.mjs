import {spawnSync} from "node:child_process";
const result=spawnSync(process.execPath,["node_modules/vitest/vitest.mjs","run","tests/case-generation/FuzzCases.test.ts","tests/fuzz/Players.test.ts","--maxWorkers=1"],{stdio:"inherit",env:{...process.env,ROOMSCRIPT_FULL_FUZZ:"1"}});
if(result.error)throw result.error;
process.exitCode=result.status??1;
