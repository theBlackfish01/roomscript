import {read,AUDIO,ROOT,save} from './lib.mjs';
import {resolve} from 'node:path';
import {existsSync,mkdirSync,copyFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const m=read(resolve(AUDIO,'voice-manifest.json'),null),spec=read(resolve(AUDIO,'voice-spec.json'),null),targets=[11,25,34,52,60,87,98,112,131,147],clips=[];
const safePrefixes={8:"When you're sure, accuse.",9:'Under the hood, truth is compiled, not generated. A solver proves one unique answer',10:"And it was built by coding agents: Codex and Claude Code, using Snap's CLAD skills and the Lens Studio MCP"};
let previousEnd=0;
for(let i=1;i<=10;i++){
 const wanted=spec.lines.find(x=>x.id==='video-vo-'+i);let c=m.clips.find(x=>!x.derivedFrom&&x.id==='video-vo-'+i&&x.text===wanted.text),fallback=false;
 if(!c){c=m.clips.find(x=>!x.derivedFrom&&x.id==='video-vo-'+i);fallback=true;}if(!c)throw Error('MISSING_VIDEO_VO_'+i);
 const text=safePrefixes[i]||c.text,a=c.alignment,offset=a.characters.join('').indexOf(text);if(offset<0)throw Error('MISSING_SAFE_PREFIX_'+i);
 const from=Math.max(0,a.starts[offset]-.025),until=a.ends[offset+text.length-1]+.06,start=Math.max(targets[i-1],previousEnd+.3),duration=until-from;previousEnd=start+duration;
 clips.push({...c,text,from,until,start,duration,fallback:fallback||text!==c.text});
}
if(previousEnd>170)throw Error('VO_EXCEEDS_170_SECONDS');
const find=p=>existsSync(resolve(AUDIO,'out/staged',p))?resolve(AUDIO,'out/staged',p):resolve(ROOT,p),args=clips.flatMap(c=>['-i',find(c.path)]),filters=clips.map((c,i)=>'['+i+':a]atrim=start='+c.from+':end='+c.until+',asetpts=PTS-STARTPTS,adelay='+Math.round(c.start*1000)+':all=1[v'+i+']');
filters.push(clips.map((_,i)=>'[v'+i+']').join('')+'amix=inputs=10:normalize=0,apad=whole_dur=170,atrim=end=170,loudnorm=I=-16:TP=-1.5:LRA=11[out]');mkdirSync(resolve(AUDIO,'video'),{recursive:true});const ff=resolve(AUDIO,'out/bin/ffmpeg.exe');
execFileSync(ff,['-v','error','-y',...args,'-filter_complex',filters.join(';'),'-map','[out]','-ac','1','-ar','24000','-b:a','96k',resolve(AUDIO,'video/ScratchVO.mp3')]);copyFileSync(find('Assets/Audio/Music/VideoSoundtrack.mp3'),resolve(AUDIO,'video/VideoSoundtrack.mp3'));
execFileSync(ff,['-v','error','-y','-i',resolve(AUDIO,'video/ScratchVO.mp3'),'-i',resolve(AUDIO,'video/VideoSoundtrack.mp3'),'-filter_complex','[1:a]volume=0.25[m];[0:a][m]amix=inputs=2:normalize=0:duration=first[out]','-map','[out]','-ac','1','-ar','24000','-b:a','96k',resolve(AUDIO,'video/ScratchMix.mp3')]);
save(resolve(AUDIO,'video/cue-sheet.json'),{durationSeconds:170,source:'devpost/drafts/video-plan.md',note:'Scratch timing only, no listening claim. Provider quota prevented revised VO8/9: older paid clips are trimmed to accurate clauses. VO10 omits the unverified all-steps-tested claim. Clauses are extracted with real alignment, not resynthesized. Live-AI demonstration claim in VO4 must match the final recorded capture. Picture-locked timing and editorial listening remain pending.',clips:clips.map(c=>({id:c.id,startSeconds:c.start,endSeconds:c.start+c.duration,text:c.text,source:c.path,trimmedFallback:c.fallback}))});console.log('170-second scratch VO, score and mix exported to Tooling/audio/video');
