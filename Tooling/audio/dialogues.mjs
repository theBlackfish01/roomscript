import {request,read,save,AUDIO,ROOT,hash} from './lib.mjs';import {resolve,dirname} from 'node:path';import {mkdirSync,writeFileSync,existsSync} from 'node:fs';import {execFileSync} from 'node:child_process';
const cast=read(resolve(AUDIO,'cast.json'),null),spec=read(resolve(AUDIO,'voice-spec.json'),null),ff=resolve(AUDIO,'out/bin/ffmpeg.exe');
const line=id=>{const x=spec.lines.find(x=>x.id===id);if(!x)throw Error('MISSING_SCRIPT_LINE_'+id);return {speaker:x.speaker,text:x.text};};
const dialogues=[
 {name:'ArrivalDialogue',lines:['arrival-vale','arrival-qadir','arrival-okafor','arrival-pike'].map(line),factIds:[]},
 {name:'HarlowVoicemail',lines:[{speaker:'S2',text:'[quietly] Edmund?'},{speaker:'V',text:'[firmly] Vale. I intend to expose your forged trust accounts.'}],factIds:['F_REPLY_AFTER_ARRIVAL','F_VALE_MOTIVE'],phone:true},
 {name:'ValeConfession',lines:[{speaker:'S2',text:'[sad] I killed Edmund Harlow in the Study with the cable. He was going to expose my forged trust accounts.'}],factIds:['F_MURDER_SPINE','F_VALE_MOTIVE'],verdictOnly:true},
 {name:'WrongEscape',lines:[{speaker:'S2',text:'[coolly] Good night, Detective.'}],factIds:[],verdictOnly:true},
 {name:'OpeningExchange',lines:[line('opening-case-exact'),line('wren:opening')],factIds:['F_BODY_FOUND']}
];
const file=resolve(AUDIO,'dialogue-manifest.json'),manifest=read(file,{version:1,clips:[]});
for(const d of dialogues){const inputs=d.lines.map(l=>({text:l.text,voice_id:cast.voices.find(v=>v.id===l.speaker).voiceId})),body={inputs,model_id:'eleven_v3'},identity=hash(body),path='Assets/Audio/Dialogue/'+d.name+'.mp3',dest=resolve(AUDIO,'out/staged',path);if(manifest.clips.some(c=>c.identity===identity)&&existsSync(dest))continue;
 const r=await request('/v1/text-to-dialogue?output_format=mp3_44100_128',body,{label:'dialogue:'+d.name,estimate:inputs.reduce((n,l)=>n+l.text.length*2,0)}),raw=resolve(AUDIO,'out/'+identity+'.mp3');writeFileSync(raw,r.data);mkdirSync(dirname(dest),{recursive:true});
 const filter=(d.phone?'highpass=f=300,lowpass=f=3200,':'')+'loudnorm=I=-16:TP=-1.5:LRA=11';execFileSync(ff,['-v','error','-y','-i',raw,'-af',filter,'-ac','1','-ar','24000','-b:a','40k',dest]);manifest.clips=manifest.clips.filter(c=>c.name!==d.name);manifest.clips.push({...d,identity,path});save(file,manifest);console.log('dialogue '+d.name);}
writeFileSync(resolve(AUDIO,'out/staged/Assets/Scripts/Content/DialogueManifest.ts'),'/** Scripted set pieces: engine alone controls when each may play. */\nexport const DIALOGUE_MANIFEST = '+JSON.stringify(manifest.clips,null,2)+';\n');
