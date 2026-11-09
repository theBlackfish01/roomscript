import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../..'),receipt=JSON.parse(readFileSync(resolve(import.meta.dirname,'preview-voice-format.json'),'utf8'));
const voices=[...receipt.files,...receipt.pcmFiles].filter(r=>r.tailSeconds===.6),began=Date.now();let maximumRms=0;
for(const voice of voices){
  if(Date.now()-began>540000)throw Error('Nine-minute verification limit');
  const pcm=execFileSync(resolve(import.meta.dirname,'out/bin/ffmpeg.exe'),['-v','error','-sseof','-0.35','-i',resolve(root,voice.path),'-f','s16le','-ar','8000','-ac','1','pipe:1'],{timeout:15000,windowsHide:true,maxBuffer:100000});
  if(pcm.length<4000)throw Error('Missing audio tail: '+voice.path);
  let energy=0;for(let i=0;i<pcm.length;i+=2)energy+=(pcm.readInt16LE(i)/32768)**2;
  const rms=Math.sqrt(energy/(pcm.length/2));maximumRms=Math.max(maximumRms,rms);
  if(rms>.0032)throw Error('Speech reaches EOF safety window: '+voice.path);
}
const result={voices:voices.length,tailSeconds:.6,verifiedFinalSeconds:.35,maximumTailRms:maximumRms,passed:true};
writeFileSync(resolve(root,'Tooling/results/preview-tail-verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
