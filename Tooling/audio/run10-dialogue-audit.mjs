/** Audit retained dialogue against shipped individual voices and Run 10 supplements. */
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {AUDIO,ROOT,read,save,parseManifestExport} from './lib.mjs';
const content=resolve(ROOT,'Assets/Scripts/Content');
const dialogues=parseManifestExport(readFileSync(resolve(content,'DialogueManifest.ts'),'utf8'),'DIALOGUE_MANIFEST');
const shipped=[...parseManifestExport(readFileSync(resolve(content,'VoiceManifest.ts'),'utf8'),'VOICE_MANIFEST'),...parseManifestExport(readFileSync(resolve(content,'Run7VoiceManifest.ts'),'utf8'),'RUN7_VOICE_MANIFEST')];
const supplements=read(resolve(AUDIO,'run10-voice-manifest.json')).clips,cast=read(resolve(AUDIO,'cast.json'));
const audited=[],failures=[];
for(const dialogue of dialogues.filter(d=>d.name!=='OpeningExchange')){
  const lines=dialogue.lines.map((line,index)=>{
    const text=line.text.replace(/\[[^\]]*\]\s*/g,'').trim(),take=dialogue.name==='ValeConfession'?'broken':'steady';
    const clip=shipped.find(c=>c.speaker===line.speaker&&c.text===text&&c.take===take)||supplements.find(c=>c.speaker===line.speaker&&c.text===text);
    const staged=clip&&supplements.includes(clip),path=clip&&resolve(staged?resolve(AUDIO,'out/run10'):ROOT,clip.path);
    if(!clip||!existsSync(path))failures.push(dialogue.name+':missing:'+index);
    if(clip?.voiceId&&clip.voiceId!==cast.voices.find(v=>v.id===line.speaker)?.voiceId)failures.push(dialogue.name+':cast:'+index);
    if(!clip?.alignment?.characters?.length)failures.push(dialogue.name+':alignment:'+index);
    return {speaker:line.speaker,originalText:line.text,text,take,path:clip?.path,source:staged?'run10_supplement':'existing_voice',supplementId:staged?clip.id:undefined};
  });
  audited.push({name:dialogue.name,factIds:dialogue.factIds,verdictOnly:dialogue.verdictOnly||false,phone:dialogue.phone||false,lines});
}
const result={at:new Date().toISOString(),status:failures.length?'failed':'passed',excluded:['OpeningExchange'],failures,dialogues:audited};
save(resolve(AUDIO,'run10-dialogue-audit.json'),result);console.log(JSON.stringify(result));if(failures.length)process.exitCode=1;
