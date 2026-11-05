/** A hard process deadline for unattended audio batches; no command may run over ten minutes. */
import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,process.argv.slice(2),{stdio:'inherit',timeout:570000,windowsHide:true});
if(result.error)console.error(result.error.code==='ETIMEDOUT'?'AUDIO_BATCH_TIMEOUT_570_SECONDS':result.error.code);
process.exit(result.status??1);
