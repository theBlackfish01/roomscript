/** Bound local commands without shell interpolation (AGENTS rule 15). */
import {spawnSync} from 'node:child_process';
const [seconds,command,...args]=process.argv.slice(2);
const timeout=Number(seconds)*1000;
if(!command||!Number.isFinite(timeout)||timeout<=0||timeout>600000)throw new Error('Usage: run-bounded.mjs <1..600 seconds> <command> [...args]');
const result=spawnSync(command==='node'?process.execPath:command,args,{stdio:'inherit',timeout,windowsHide:true});
if(result.error)console.error(result.error.message);
process.exitCode=result.status??1;
