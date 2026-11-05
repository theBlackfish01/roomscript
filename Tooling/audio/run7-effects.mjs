import {request,read,save,AUDIO,ROOT,hash} from './lib.mjs';
import {resolve,dirname} from 'node:path';
import {mkdirSync,writeFileSync,existsSync,copyFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const effects=[
  ['CastingChime',1,'One delicate brass and glass chime as a forensic label settles onto furniture. Brief warm attack, clear tiny decay, no music or voice.'],
  ['ToastTick',.5,'One very soft dry wooden tick for a peripheral notification. Tiny precise click, no ringing, no music.'],
  ['PullMemory',1.5,'A paper photograph pulled out of an airy glowing memory: soft papery sliding whoosh, delicate shimmering tail, no impact or voice.'],
  ['LiftInspect',1,'A small ceramic object gently lifted off a wooden surface, subtle fingertip scrape and short airy rise, no speech or music.']
];
const file=resolve(AUDIO,'run7-cue-manifest.json'),manifest=read(file,{version:1,cues:[]}),stage=resolve(AUDIO,'out/run7'),ff=resolve(AUDIO,'out/bin/ffmpeg.exe');
for(const [name,seconds,prompt] of effects){
  const body={text:prompt,duration_seconds:seconds,loop:false,model_id:'eleven_text_to_sound_v2',prompt_influence:.5},identity=hash(body),path='Assets/Audio/Run7/Sfx/'+name+'.mp3',dest=resolve(stage,path);
  if(manifest.cues.some(c=>c.identity===identity)&&existsSync(dest))continue;
  if(manifest.cues.some(c=>c.identity===identity)&&existsSync(resolve(ROOT,path))){mkdirSync(dirname(dest),{recursive:true});copyFileSync(resolve(ROOT,path),dest);continue;}
  const result=await request('/v1/sound-generation?output_format=mp3_44100_128',body,{label:'run7:sfx:'+name,estimate:Math.ceil(seconds*24)});
  const raw=resolve(AUDIO,'out/'+identity+'.mp3');writeFileSync(raw,result.data);mkdirSync(dirname(dest),{recursive:true});
  execFileSync(ff,['-v','error','-y','-i',raw,'-af','loudnorm=I=-23:TP=-3:LRA=11','-t',String(seconds),'-ac','1','-ar','24000','-b:a','32k',dest],{timeout:60000,windowsHide:true});
  manifest.cues=manifest.cues.filter(c=>c.name!==name);manifest.cues.push({name,group:'sfx',path,identity,seconds,loop:false,prompt});save(file,manifest);console.log('run7 sfx '+name);
}
mkdirSync(resolve(stage,'Assets/Scripts/Content'),{recursive:true});
writeFileSync(resolve(stage,'Assets/Scripts/Content/Run7AudioManifest.ts'),'/** ElevenLabs offline effects. */\nexport const RUN7_AUDIO_MANIFEST = '+JSON.stringify(manifest.cues,null,2)+';\n');
writeFileSync(resolve(stage,'Assets/Scripts/RoomscriptRun7CueAssets.ts'),'/** Generated supplemental effect imports. */\nexport const ROOMScriptRun7CueAssets:{[name:string]:AudioTrackAsset} = {\n'+manifest.cues.map(c=>'  '+JSON.stringify(c.name)+': requireAsset("../'+c.path.replace('Assets/','')+'") as AudioTrackAsset').join(',\n')+'\n};\n');
