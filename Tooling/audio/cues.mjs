import {request,read,save,AUDIO,ROOT,hash} from './lib.mjs';import {resolve,dirname} from 'node:path';import {mkdirSync,writeFileSync,existsSync} from 'node:fs';import {execFileSync} from 'node:child_process';
const effects=[
 ['Rain',12,true,'Soft rain tapping an old window, interior perspective, steady gentle rain, no thunder, no voices'],
 ['RoomTone',12,true,'Quiet old drawing room at night, gentle wind outside and faint wood creaks, no speech or music'],
 ['Thunder',4,false,'One distant rolling thunder peal, restrained noir interior perspective'],
 ['ClockTick',1,false,'One quiet dry antique clock tick, short precise wooden mechanical click'],
 ['Knock',1,false,'One firm knuckle knock on a heavy wooden door, warm interior resonance'],
 ['Kettle',3,false,'Porcelain lid placed on a cold old metal kettle, one gentle clink, no whistle'],
 ['CrateThud',2,false,'Heavy wooden evidence crate settles on a desk, one warm thud and wood creak'],
 ['TapeZip',2,false,'Adhesive paper crime scene tape peeled quickly, clean satisfying zip'],
 ['ChalkScratch',3,false,'Chalk drawing one curved line on stone, close dry texture'],
 ['Polaroid',3,false,'Vintage camera shutter click followed by a paper photograph sliding out'],
 ['Typewriter',2,false,'Three deliberate keys on a vintage typewriter with a small carriage bell'],
 ['PaperSlip',1,false,'One crisp paper slip flicked and landing flat on a desk'],
 ['GlassShatter',3,false,'Stylised thin glass pane shattering, bright short cascade with a clean decay'],
 ['Stamp',1,false,'Heavy rubber stamp pressing onto paper with a decisive wooden thump'],
 ['Heartbeat',4,true,'Quiet close heartbeat, slow double beat, no breathing, no music'],
 ['Blackout',2,false,'Electrical switch clunks and room power shuts down with a short falling hum'],
 ['PowerUp',3,false,'Old electrical transformer powers up, gentle rising hum and relay click'],
 ['UvHum',6,true,'Soft ultraviolet inspection lamp electrical hum, restrained high harmonic shimmer'],
 ['GhostDust',4,false,'Fine glassy dust shimmering and dissolving, delicate airy cinematic magic'],
 ['Freeze',2,false,'Time stops with a soft reverse swell and tiny glass beads suspended, no explosion'],
 ['Release',2,false,'Suspended glass beads release into a gentle airy forward sweep'],
 ['SweepTick',1,false,'Single short dry ratchet tooth clicking, precise and subtle'],
 ['Gavel',2,false,'One small wooden courtroom gavel tap, decisive warm room resonance'],
 ['PhoneStatic',5,true,'Quiet vintage telephone line hiss and mild crackle, no speech or ringing'],
 ['Tink',1,false,'One delicate bright brass lighter lid flick, crisp metallic tink'],
 ['Shing',2,false,'Short luminous crystalline reveal shimmer, restrained rising metallic chime'],
 ['Objection',3,false,'Strong cinematic paper slam with bright glass crack and short bass impact, no voice'],
 ['Ratchet',2,false,'Short sequence of precise mechanical dial ratchet clicks slowing to a stop'],
 ['Chime',2,false,'Warm clear two note evidence discovery chime, subtle felt piano and glass'],
 ['Letter',3,false,'Folded paper letter sliding from under a cloth cover and unfolding softly']
];
const music=[
 ['MainTheme',32,'Restrained 1940s noir jazz theme, muted trumpet, brushed drums, upright bass, sparse minor piano. Elegant melancholy with a small hopeful resolution. No vocals.'],
 ['Interrogation',24,'Very quiet seamless interrogation underscore, sparse minor piano and brushed upright bass, steady slow pulse, no lead melody, space for dialogue. 1940s noir.'],
 ['Tension',24,'Seamless tension layer for a quiet 1940s noir interrogation, pulsing low bowed bass and delicate brushed cymbals, harmonically static D minor, no melody, no vocals.'],
 ['ObjectionSting',5,'A dramatic original 1940s noir jazz sting: abrupt brass and piano strike, one beat of silence, decisive descending cadence. No voice.'],
 ['BlackoutDrone',12,'Dark quiet cinematic noir drone, bowed bass, soft electric hum and a few isolated piano harmonics. No drums or vocals.'],
 ['Reconstruction',24,'Slow motion 1940s noir reconstruction cue, glassy celesta and restrained strings over soft upright bass, suspense becoming clarity, no vocals.'],
 ['CaseClosed',10,'Warm restrained 1940s noir jazz resolution, muted trumpet and piano, bittersweet justice rather than celebration. No vocals.'],
 ['WrongEnding',10,'Unresolved noir ending, lonely muted trumpet and descending piano into silence, regret and unease, no vocals.'],
 ['VideoSoundtrack',170,'Original instrumental 1940s noir jazz soundtrack, exactly two minutes fifty seconds. 0:00-0:10 near-silence and distant brushed texture. 0:10-0:32 elegant muted trumpet theme enters softly. 0:32-0:58 sparse piano suspense under dialogue. 0:58-1:08 investigation pulse. 1:08-1:10 silence, then one decisive original brass objection sting. 1:10-1:26 energetic revelation with space. 1:26-1:50 quick investigation pulse. 1:50-2:10 slow glassy reconstruction then warm resolution. 2:10-2:42 gentle forward pulse under explanatory narration. 2:42-2:50 theme returns and ends cleanly. Upright bass, brushed drums, felt piano, muted trumpet. No vocals, no lyrics.']
];
const group=process.argv[2]||'sfx',items=group==='music'?music:effects,manifestFile=resolve(AUDIO,'cue-manifest.json'),manifest=read(manifestFile,{version:1,cues:[]}),ff=resolve(AUDIO,'out/bin/ffmpeg.exe');
for(const item of items){
 const [name,seconds]=item,loop=group==='sfx'?item[2]:['Interrogation','Tension'].includes(name),prompt=group==='sfx'?item[3]:item[2],body=group==='music'?{prompt,music_length_ms:seconds*1000,model_id:'music_v1',force_instrumental:true}:{text:prompt,duration_seconds:seconds,loop,model_id:'eleven_text_to_sound_v2',prompt_influence:.5};
 const id=hash({group,body}),path='Assets/Audio/'+(group==='music'?'Music':'Sfx')+'/'+name+'.mp3',staged=resolve(AUDIO,'out/staged',path);if(manifest.cues.some(c=>c.identity===id)&&(existsSync(resolve(ROOT,path))||existsSync(staged)))continue;
 const result=await request(group==='music'?'/v1/music?output_format=mp3_44100_128':'/v1/sound-generation?output_format=mp3_44100_128',body,{label:group+':'+name,estimate:group==='music'?seconds*100:seconds*24});
 const raw=resolve(AUDIO,'out/'+id+'.mp3');writeFileSync(raw,result.data);mkdirSync(dirname(staged),{recursive:true});
 const filters=['loudnorm=I='+(group==='music'?-23:-20)+':TP=-2:LRA=11'];if(loop)filters.push('afade=t=in:d=0.02','afade=t=out:st='+(seconds-.04)+':d=0.04');
 execFileSync(ff,['-v','error','-y','-i',raw,'-af',filters.join(','),'-t',String(seconds),'-ac','1','-ar','24000','-b:a',group==='music'?'64k':'48k',staged],{stdio:'pipe'});
 manifest.cues=manifest.cues.filter(c=>c.name!==name);manifest.cues.push({name,group,path,identity:id,seconds,loop,prompt});save(manifestFile,manifest);console.log(group+' '+name);
}
mkdirSync(resolve(AUDIO,'out/staged/Assets/Scripts/Content'),{recursive:true});writeFileSync(resolve(AUDIO,'out/staged/Assets/Scripts/Content/AudioManifest.ts'),'/** Generated offline with ElevenLabs; see Tooling/audio/README.md for terms and provenance. */\nexport const AUDIO_MANIFEST = '+JSON.stringify(manifest.cues,null,2)+';\n');
