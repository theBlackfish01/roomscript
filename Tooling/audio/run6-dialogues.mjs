/** Replace only Vale, preserving the other recorded performances and fact/verdict gates. */
import {read,save,request,AUDIO,ROOT,hash,audioFile,cleanAlignment} from './lib.mjs';
import {resolve,dirname} from 'node:path';
import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
const ff=resolve(AUDIO,'out/bin/ffmpeg.exe'),cast=read(resolve(AUDIO,'cast.json'),null),vale=cast.voices.find(v=>v.id==='S2');
const manifestPath=resolve(AUDIO,'dialogue-manifest.json'),manifest=read(manifestPath,null),voices=read(resolve(AUDIO,'voice-manifest.json'),null);
const work=resolve(AUDIO,'out/run6-dialogues');mkdirSync(work,{recursive:true});
const run=args=>execFileSync(ff,['-v','error','-y',...args],{timeout:60000,windowsHide:true});
const voice=(speaker,text,take='steady')=>{const c=voices.clips.find(c=>c.speaker===speaker&&c.text===text&&c.take===take&&!c.derivedFrom);if(!c||speaker==='S2'&&c.voiceId!==vale.voiceId)throw Error('MISSING_CURRENT_VOICE '+speaker+' '+text);return c;};
async function extra(text,tag,name){
 const body={text:tag+' '+text,model_id:'eleven_v3',voice_settings:{stability:.5,similarity_boost:.75,use_speaker_boost:true},seed:1041};
 const r=await request('/v1/text-to-speech/'+vale.voiceId+'/with-timestamps?output_format=mp3_44100_128',body,{label:'run6:dialogue:S2:'+name,estimate:Math.max(100,body.text.length*2),json:true});
 const raw=resolve(work,name+'.raw.mp3'),dest=resolve(work,name+'.mp3');writeFileSync(raw,Buffer.from(r.data.audio_base64,'base64'));
 run(['-i',raw,'-af','loudnorm=I=-16:TP=-1.5:LRA=11','-ac','1','-ar','24000','-b:a','40k',dest]);
 return {file:dest,text,alignment:cleanAlignment(r.data.normalized_alignment||r.data.alignment),identity:hash({voiceId:vale.voiceId,...body})};
}
const dialogue=manifest.clips.find(d=>d.name==='HarlowVoicemail');
const original=resolve(work,'HarlowVoicemail.original.mp3');if(!existsSync(original))copyFileSync(audioFile(dialogue.path),original);
const transcript='Edmund? Vale. I intend to expose your forged trust accounts.';
let aligned,cut;
if(process.argv.includes('--forced-alignment')){
 const bytes=readFileSync(original),form=new FormData();form.append('file',new Blob([bytes],{type:'audio/mpeg'}),'HarlowVoicemail.mp3');form.append('text',transcript);
 aligned=(await request('/v1/forced-alignment',{audioHash:hash(bytes.toString('base64')),text:transcript},{label:'run6:align-existing-Harlow',estimate:100,json:true,formData:form})).data;
 const first=aligned.words.find(w=>/Edmund/i.test(w.text)),harlow=aligned.words.find(w=>/^Vale/i.test(w.text));
 if(!first||!harlow||!Number.isFinite(harlow.start)||harlow.start<=first.end)throw Error('UNSAFE_HARLOW_BOUNDARY');cut=(first.end+harlow.start)/2;
}else{
 // Provider key lacks forced-alignment permission. This known two-speaker source begins
 // with Vale's single word, then a long silent turn boundary. Never infer alignment for lip sync.
 const detected=spawnSync(ff,['-hide_banner','-i',original,'-af','silencedetect=noise=-35dB:d=0.15','-f','null','-'],{encoding:'utf8',timeout:60000,windowsHide:true});
 if(detected.status!==0)throw Error('SILENCE_DETECTION_FAILED');
 const gap=/silence_start: ([0-9.]+)[\s\S]*?silence_end: ([0-9.]+) \| silence_duration: ([0-9.]+)/.exec(detected.stderr);
 if(!gap||Number(gap[1])<.4||Number(gap[2])>1.6||Number(gap[3])<.4)throw Error('REVIEW_HARLOW_TURN_BOUNDARY');
 cut=(Number(gap[1])+Number(gap[2]))/2;aligned={loss:null,method:'offline silence midpoint after authored single-word Vale turn; listening review pending',gapStart:Number(gap[1]),gapEnd:Number(gap[2])};
}
save(resolve(work,'HarlowVoicemail.alignment.json'),aligned);
const reply=await extra('Edmund?','[quietly]','Edmund'),escape=await extra('Good night, Detective.','[coolly]','WrongEscape');
const harlowFile=resolve(work,'Harlow.preserved.mp3');run(['-ss',String(cut),'-i',original,'-ac','1','-ar','24000','-b:a','40k',harlowFile]);
const updated=[];
for(const d of manifest.clips){
 if(!d.lines.some(l=>l.speaker==='S2'))continue;
 const dest=resolve(AUDIO,'out/staged',d.path);mkdirSync(dirname(dest),{recursive:true});
 let parts,provenance;
 if(d.name==='ArrivalDialogue'){parts=d.lines.map(l=>audioFile(voice(l.speaker,l.text).path));provenance=d.lines.map(l=>({speaker:l.speaker,sourceIdentity:voice(l.speaker,l.text).identity}));}
 else if(d.name==='ValeConfession'){const c=voice('S2',d.lines[0].text.replace(/\[[^\]]*\]\s*/g,''),'broken');parts=[audioFile(c.path)];provenance=[{speaker:'S2',sourceIdentity:c.identity}];}
 else if(d.name==='WrongEscape'){parts=[escape.file];provenance=[{speaker:'S2',sourceIdentity:escape.identity}];}
 else if(d.name==='HarlowVoicemail'){parts=[reply.file,harlowFile];provenance=[{speaker:'S2',sourceIdentity:reply.identity},{speaker:'V',sourceIdentity:dialogue.previousIdentity||dialogue.identity,preservedOriginal:true,startSeconds:cut,alignmentLoss:aligned.loss}];}
 else throw Error('UNEXPECTED_DIALOGUE '+d.name);
 const args=parts.flatMap(p=>['-i',p]);
 const streams=parts.map((_,i)=>'['+i+':a]').join('');
 args.push('-filter_complex',streams+'concat=n='+parts.length+':v=0:a=1'+(d.phone?',highpass=f=300,lowpass=f=3200':'')+'[out]','-map','[out]','-ac','1','-ar','24000','-b:a','40k',dest);run(args);
 d.previousIdentity??=d.identity;d.identity=hash({name:d.name,provenance,version:1});d.performanceSources=provenance;d.valeVoiceId=vale.voiceId;d.assembly='Run6: Vale-only replacement; other speakers reuse recorded performances.';updated.push(d.name);
}
save(manifestPath,manifest);
writeFileSync(resolve(AUDIO,'out/staged/Assets/Scripts/Content/DialogueManifest.ts'),'/** Scripted set pieces; engine controls factual and verdict gates. */\nexport const DIALOGUE_MANIFEST = '+JSON.stringify(manifest.clips,null,2)+';\n');
console.log(JSON.stringify({updated,unchanged:'OpeningExchange (Narrator and Wren only)',harlowPreservedFromSeconds:cut,alignmentLoss:aligned.loss}));
