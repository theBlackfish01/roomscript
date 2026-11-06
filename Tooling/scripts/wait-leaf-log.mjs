// Read-only: waits for a LEAF scenario result in the newest Lens Studio log (MCP calls can time out while the
// plugin keeps running the scenario). Usage: node Tooling/scripts/wait-leaf-log.mjs <scenario> [maxSeconds] [sinceHH:MM:SS]
// Prints the PASSED/FAILED line, the scenario's own marker lines (ALL_CAPS|json) and any assertion text.
import {readdirSync,statSync,openSync,readSync,closeSync} from 'node:fs';
import {join} from 'node:path';
const [scenario,maxText]=process.argv.slice(2);if(!scenario)throw Error('scenario id required');
const dir='C:/Users/wadoo/AppData/Local/Snap/Lens Studio/logs';
const newest=()=>readdirSync(dir).filter(f=>f.startsWith('LensStudioLog-')).map(f=>join(dir,f)).sort((a,b)=>statSync(b).mtimeMs-statSync(a).mtimeMs)[0];
const tail=(file,bytes=1500000)=>{const size=statSync(file).size,start=Math.max(0,size-bytes),fd=openSync(file,'r'),buf=Buffer.alloc(size-start);readSync(fd,buf,0,buf.length,start);closeSync(fd);return buf.toString('utf8');};
const deadline=Date.now()+1000*Number(maxText||480),started=new Date(Date.now()-5000),hms=d=>d.toTimeString().slice(0,8);
const since=process.argv[4]||hms(started); // only runs whose RUNS line is at or after this local time (HH:MM:SS)
while(Date.now()<deadline){
  const text=tail(newest()),runAt=text.lastIndexOf('RUNS: '+scenario),stamp=runAt>=0?(text.slice(text.lastIndexOf('\n',runAt)+1).match(/^\w (\d\d:\d\d:\d\d)/)||[])[1]:null;
  if(runAt>=0&&stamp&&stamp>=since){const after=text.slice(runAt),done=after.match(new RegExp('\\[\\s*([\\d.]+)s\\](PASSED|FAILED): '+scenario));
    if(done){const lines=after.split('\n').filter(l=>/\] [A-Z0-9_]+\|/.test(l)||/Expect|expected|Error|FAILED|PASSED/.test(l)).map(l=>l.replace(/^.*?\] \[(Assets|Packages)[^\]]*\] /,'').slice(0,600));
      console.log(JSON.stringify({scenario,status:done[2],seconds:Number(done[1])}));for(const l of lines.slice(0,40))console.log(l);process.exit(done[2]==='PASSED'?0:1);}}
  await new Promise(r=>setTimeout(r,3000));
}
console.log(JSON.stringify({scenario,status:'timeout'}));process.exit(2);
