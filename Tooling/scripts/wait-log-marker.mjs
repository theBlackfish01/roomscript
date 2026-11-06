// Read-only: wait until a print marker (e.g. RUN8_DIRECTOR_READY) appears in the newest Lens Studio log at or
// after a local time. Usage: node Tooling/scripts/wait-log-marker.mjs <MARKER> <sinceHH:MM:SS> [maxSeconds] [contains]
import {readdirSync,statSync,openSync,readSync,closeSync} from 'node:fs';
import {join} from 'node:path';
const [marker,since,maxText,contains]=process.argv.slice(2);if(!marker||!since)throw Error('marker and since required');
const dir='C:/Users/wadoo/AppData/Local/Snap/Lens Studio/logs';
const newest=()=>readdirSync(dir).filter(f=>f.startsWith('LensStudioLog-')).map(f=>join(dir,f)).sort((a,b)=>statSync(b).mtimeMs-statSync(a).mtimeMs)[0];
const tail=(file,bytes=2000000)=>{const size=statSync(file).size,start=Math.max(0,size-bytes),fd=openSync(file,'r'),buf=Buffer.alloc(size-start);readSync(fd,buf,0,buf.length,start);closeSync(fd);return buf.toString('utf8');};
const deadline=Date.now()+1000*Number(maxText||300);
while(Date.now()<deadline){
  const hits=tail(newest()).split('\n').filter(l=>l.includes(marker)&&(!contains||l.includes(contains))).map(l=>({t:(l.match(/^\w (\d\d:\d\d:\d\d)/)||[])[1],l})).filter(h=>h.t&&h.t>=since);
  const fail=tail(newest(),400000).split('\n').find(l=>/FAILED: roomscript-/.test(l)&&((l.match(/^\w (\d\d:\d\d:\d\d)/)||[])[1]||'')>=since);
  if(hits.length){console.log(hits.at(-1).l.replace(/^.*?\] \[(Assets|Packages)[^\]]*\] /,'').slice(0,500));process.exit(0);}
  if(fail){console.log(fail.replace(/^.*?\] \[(Assets|Packages)[^\]]*\] /,'').slice(0,500));process.exit(1);}
  await new Promise(r=>setTimeout(r,3000));
}
console.log('timeout');process.exit(2);
