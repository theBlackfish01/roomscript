/** Run 8 object-UI audio: ElevenLabs effects + Wren/Narrator cue lines -> Assets/Audio/Run8. Ledger via lib.request (character-cost header). */
import {request,read,save,AUDIO,ROOT,ledgerPath} from './lib.mjs';
import {resolve,dirname} from 'node:path';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';

const ff=resolve(AUDIO,'out/bin/ffmpeg.exe'),OUT='Assets/Audio/Run8',SEGMENT='run8-2026-11-06',ALLOWANCE=5000;
const NO=' No music, no voice.';
// [id, seconds, loop, prompt, intended use (WEARER_UX)]
const effects=[
 ['FolderLift',1,false,'A paper manila case file lifted off a wooden desk, soft paper slide and light lift, close and dry.'+NO,'Opening: pinch + lift a case file off the crate'],
 ['FolderOpen',1.5,false,'A sealed paper folder pulled open, small brittle wax seal cracking, then paper flap opening, close and crisp.'+NO,'Opening: pull the folder open to start Preset/Dynamic'],
 ['Magnifier',1.2,false,'A glass magnifying lens picked up from a wooden desk with a light wooden tap, then a clear sparkling magical glint chime that rings softly for a moment.'+NO,'Opening: CAST THIS ROOM folder (Dynamic) magnifier'],
 ['CrateHum',3,true,'Soft warm glowing hologram hum, gentle airy shimmer, steady seamless loop, no clicks.'+NO,'Crate placement: glowing outline carried in hand (loop)'],
 ['CrateLand',1.5,false,'A heavy wooden crate set down on a table, one deep solid thud with a soft puff of dust settling.'+NO,'Crate placement: crate locks onto a surface'],
 ['LandingRing',1.5,false,'A soft rising magical shimmer, gentle airy glass tones swelling upward, subtle.'+NO,'Crate placement: landing ring appears on detected table/floor'],
 ['ThunderNear',3.5,false,'One close thunder clap, sharp crack then a heavy rolling rumble, heard from indoors through a window.'+NO,'Wow 2: storm at the real window (spatial, at window)'],
 ['LightningCrack',1,false,'A sharp electric lightning crack, bright snapping discharge with a quick sizzle, short.'+NO,'Wow 2: lightning flash reveals the ghost silhouette'],
 ['TapeStretch',1.5,false,'Plastic crime scene barrier tape pulled and stretched taut across a doorway, a creaky plastic stretch then a crisp snap.'+NO,'Wow 2: tape across the real doorway ("Nobody leaves")'],
 ['ChalkCircle',1.5,false,'A piece of chalk drawn in one continuous circle on a wooden floor, dry gritty scrape, close.'+NO,'Zone names drawn as chalk circles on the floor; chalk outline'],
 ['PinPhoto',.8,false,'A photograph pinned to a cork board with a pushpin, a soft paper tap and a small push into cork.'+NO,'Wall board: memory photo pins itself'],
 ['RedString',1.2,false,'A thin string pulled taut and wound around a metal pin, quick taut twang and a small wrap.'+NO,'Wow 4: red string connects evidence'],
 ['WaxSealPress',1.5,false,'A thumb pressing slowly into warm soft wax, a low satisfying squish, then one small firm seal click.'+NO,'Accuse: hold pinch on the wax seal to commit'],
 ['SpotlightOn',2,false,'A heavy theatrical spotlight switching on, one metal clunk followed by a low electrical hum.'+NO,'Accuse: spotlight beam from finger to suspect'],
 ['GhostWhoosh',1.5,false,'A soft breathy airy whoosh, ghostly and gentle, a faint shimmer as something appears.'+NO,'Wow 3: ghost vignette appears at an object'],
 ['ReplayRewind',1.5,false,'A short magnetic tape rewind warble, pitch sweeping down into a dreamy wobble.'+NO,'Wow 3: pulled memory blooms into a replay'],
 ['DustBrush',1.5,false,'A soft fingerprint brush dusting fine powder onto glass and ceramic, light bristly swishes, close.'+NO,'Wow 9: wave hand over a surface to dust for prints'],
 ['PrintReveal',1,false,'A tiny glittering bright chime, delicate sparkle as something glows into view.'+NO,'Wow 9: fingerprint glows'],
 ['NewspaperUnfold',1.5,false,'A newspaper unfolded in two hands, crisp large paper rustle and a snap open.'+NO,'Ending (wow 8): Morning Edition appears in your hands'],
 ['LensCrack',.7,false,'A small single glass crack, a tight brittle splinter, short.'+NO,'Credibility -1: crack in the lens icon on the palm notebook'],
 ['PalmOpen',.8,false,'An airy soft gentle chime, light breathy bell, opening and welcoming.'+NO,'Palm notebook appears when the left palm turns up'],
 ['DoorKnock3',2,false,'Three slow evenly spaced firm knuckle knocks on a solid wooden door, knock, knock, knock, heard from across a room, natural room reverb.'+NO,'Wow 7: knock from the real door (spatial, at doorway)',
  // Take has five knocks 170 ms apart: keep knocks 1-2 and the last knock with its natural room tail.
  'asplit=2[a][b];[a]atrim=0:0.355,afade=t=out:st=0.347:d=0.008[x];[b]atrim=start=0.715,asetpts=PTS-STARTPTS,afade=t=in:d=0.005[y];[x][y]concat=n=2:v=0:a=1,'],
];
// Existing assets that already fit (no generation).
const reused=[
 ['StampThump','Assets/Audio/Sfx/Stamp.mp3',false,'Deduction filed / CASE CLOSED stamp lands on the wall board','Existing prompt: heavy rubber stamp on paper with a wooden thump.'],
 ['RainGlass','Assets/Audio/Sfx/Rain.mp3',true,'Wow 2: rain on the real window (spatial loop)','Existing 12 s loop: rain tapping an old window, interior.'],
 ['UVHum','Assets/Audio/Sfx/UvHum.mp3',true,'Wow 6: UV flashlight cone in the palm (loop)','Existing 6 s UV lamp hum loop; no switch-on click inside the loop (a click would repeat).'],
 ['ThunderFar','Assets/Audio/Sfx/Thunder.mp3',false,'Wow 2: distant thunder at the window (spatial)','Existing 4 s distant rolling peal.'],
 ['N1','Assets/Audio/Voice/NARRATOR/6f365e05e85d15d5fc83.mp3',false,'Tape across the doorway: "Nobody leaves."','Existing NARRATOR steady take.','narrator','Nobody leaves.'],
 ['N4','Assets/Audio/Run7/NARRATOR/427d5abd057174156e45.mp3',false,'Replay / new seed: "Same room. New murder."','Existing Run 7 NARRATOR take.','narrator','Same room. New murder.'],
];
// [id, speaker, file stem, text, whisper, use]
const lines=[
 ['W1','WREN','Wren_W1_OverHere','Over here.',true,'Wow 7: whisper from behind the player (spatial)'],
 ['W2','WREN','Wren_W2_BehindYou','Behind you.',true,'Wow 7: whisper from behind (spatial)',1042,
  // Take ends with 1 s of silence and a stray breath blip: crop after the words.
  'atrim=0:1.3,afade=t=out:st=1.22:d=0.08,'],
 ['W3','WREN','Wren_W3_HoldPhoto','Hold the photo up to her.',false,'Hint: present a memory photo to a suspect'],
 ['W4','WREN','Wren_W4_PointGuest','Point at another guest to ask about them.',false,'Hint: point at a suspect to ask about them'],
 ['W5','WREN','Wren_W5_PalmNotebook','Turn your left palm up. Your notebook.',false,'Hint: first palm-notebook prompt'],
 ['W6','WREN','Wren_W6_CarryWords','Carry her words to the thing that proves her wrong.',false,'Hint: objection by carrying a statement to evidence'],
 ['W7','WREN','Wren_W7_SetCase','Set the case down on a table.',false,'Crate placement prompt'],
 ['W8','WREN','Wren_W8_PickFile','Pick a file. Pull it open.',false,'Opening: two case files prompt'],
 ['W9','WREN','Wren_W9_PointAccuse','Point at the one you accuse.',false,'Accuse: point at a suspect'],
 ['W10','WREN','Wren_W10_PressSeal','Press the seal. Hold it.',false,'Accuse: wax seal commit'],
 ['W11','WREN','Wren_W11_SweepLight','Sweep the floor with the light.',false,'Wow 6: UV flashlight dark beat'],
 ['W12','WREN','Wren_W12_DustPrints','Wave your hand over it. Dust for prints.',false,'Wow 9: dusting prompt'],
 ['W13','WREN','Wren_W13_ReadBoard','The board\'s on the wall. Walk over and read it.',false,'Wall board introduction'],
 ['W14','WREN','Wren_W14_WatchKettle','Watch the kettle. It remembers.',false,'Wow 3: kettle replay at 22:30'],
 ['N2','NARRATOR','Narrator_N2_TenThirty','Ten thirty. The moment it happened.',false,'Wow 3: replay title card at 22:30'],
 ['N3','NARRATOR','Narrator_N3_MorningEdition','Morning edition.',false,'Ending (wow 8): newspaper appears'],
];

// Open a Run 8 ledger segment once (5,000-credit allowance for this job).
{const l=read(ledgerPath,null);if(!l)throw Error('MISSING_LEDGER');if(!l.segments.some(s=>s.id===SEGMENT)){l.segments.push({id:SEGMENT,startedAt:new Date().toISOString(),allowanceCredits:ALLOWANCE,baselineAccountedCredits:l.totalCredits,baselineEntryCount:l.entries.length,authorization:'Run 8 audio worker: object-UI effects + Wren/Narrator cue lines, keep under ~5,000 of ~21,000 remaining. Stop on provider quota error.'});}l.activeSegment=SEGMENT;save(ledgerPath,l);}

const cast=read(resolve(AUDIO,'cast.json'),null),voiceOf=id=>{const v=cast.voices.find(v=>v.id===id);if(!v?.voiceId)throw Error('MISSING_CAST_'+id);return v.voiceId;};
const run=(args,opts={})=>execFileSync(ff,args,{stdio:'pipe',timeout:60000,windowsHide:true,maxBuffer:50000000,...opts});
const trim='silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.01,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.04,areverse,';
function twoPass(raw,dest,{I,TP,loop,edit=''}){
  const pre=edit+(loop?'':trim),target='I='+I+':TP='+TP+':LRA=11';
  // ffmpeg prints the loudnorm measurement JSON on stderr.
  const stderr=spawnStderr(['-hide_banner','-nostats','-i',raw,'-af',pre+'loudnorm='+target+':print_format=json','-f','null','-']);
  const m=JSON.parse(stderr.slice(stderr.lastIndexOf('{'),stderr.lastIndexOf('}')+1));
  // Integrated loudness is undefined for sub-400 ms sounds: fall back to a peak gain to TP-3 dBFS.
  if(!Number.isFinite(Number(m.input_i))){mkdirSync(dirname(dest),{recursive:true});run(['-v','error','-y','-i',raw,'-af',pre+'volume='+(TP-3-Number(m.input_tp)).toFixed(2)+'dB','-ac','1','-ar','24000','-b:a','32k',dest]);return;}
  const second=pre+'loudnorm='+target+':linear=true:measured_I='+m.input_i+':measured_TP='+m.input_tp+':measured_LRA='+m.input_lra+':measured_thresh='+m.input_thresh+':offset='+m.target_offset;
  mkdirSync(dirname(dest),{recursive:true});
  run(['-v','error','-y','-i',raw,'-af',second,'-ac','1','-ar','24000','-b:a','32k',dest]);
  // Transient-heavy takes stay quiet when the true-peak cap blocks linear gain: apply the full gain, then a fast peak limiter.
  if(loudness(dest)<I-3){const lim=Math.pow(10,TP/20).toFixed(4);run(['-v','error','-y','-i',raw,'-af',pre+'volume='+(I-Number(m.input_i)).toFixed(2)+'dB,alimiter=limit='+lim+':attack=1:release=40:level=false','-ac','1','-ar','24000','-b:a','32k',dest]);}
}
function loudness(file){const s=spawnStderr(['-hide_banner','-nostats','-i',file,'-af','loudnorm=print_format=json','-f','null','-']);return Number(JSON.parse(s.slice(s.lastIndexOf('{'),s.lastIndexOf('}')+1)).input_i);}
function spawnStderr(args){const r=spawnSync(ff,args,{encoding:'utf8',timeout:60000,windowsHide:true,maxBuffer:50000000});if(r.status!==0)throw Error('FFMPEG_FAILED');return r.stderr;}
function probe(file){
  const pcm=run(['-v','error','-i',file,'-f','s16le','-ac','1','-ar','24000','pipe:1']);const n=pcm.length/2;let sum=0,peak=0;
  for(let i=0;i<n;i++){const v=pcm.readInt16LE(i*2)/32768;sum+=v*v;if(Math.abs(v)>peak)peak=Math.abs(v);}
  const rms=Math.sqrt(sum/Math.max(1,n)),lufs=loudness(file);
  return {durationSec:+(n/24000).toFixed(3),rmsDb:+(20*Math.log10(rms||1e-9)).toFixed(1),peakDb:+(20*Math.log10(peak||1e-9)).toFixed(1),lufs};
}
const creditsFor=id=>{const l=read(ledgerPath,{entries:[]});const e=l.entries.findLast(e=>e.id===id&&e.status==='complete');if(e)return {credits:e.credits,estimate:e.estimate};const meta=read(resolve(AUDIO,'out/cache',id+'.json'),null);return {credits:meta?.credits??0,estimate:false};};

const results=[],missing=[];let stopped=null;
const statePath=resolve(AUDIO,'run8-audio-state.json');
for(const [id,seconds,loop,prompt,use,edit=''] of effects){
  if(stopped){missing.push(id);continue;}
  const body={text:prompt,duration_seconds:seconds,loop,model_id:'eleven_text_to_sound_v2',prompt_influence:.5},path=OUT+'/'+id+'.mp3',dest=resolve(ROOT,path);
  try{
    const r=await request('/v1/sound-generation?output_format=mp3_44100_128',body,{label:'run8:sfx:'+id,estimate:Math.ceil(seconds*24)});
    const raw=resolve(AUDIO,'out/'+r.id+'.mp3');writeFileSync(raw,r.data);twoPass(raw,dest,{I:-23,TP:-3,loop,edit});
    results.push({id,file:path,kind:'effect',loop,use,params:body,...(edit?{edit}:{}),requestId:r.id,...creditsFor(r.id),...probe(dest)});console.log('run8 sfx '+id);
  }catch(e){console.log('run8 FAIL '+id+' '+e.message);missing.push(id);if(/quota|PROVIDER_BLOCKED|401|CREDIT_CAP|SEGMENT_CREDIT_CAP/.test(e.message))stopped=e.message;}
}
for(const [id,speaker,stem,text,whisper,use,seed0=1041,edit=''] of lines){
  if(stopped){missing.push(id);continue;}
  const voiceId=voiceOf(speaker),path=OUT+'/'+stem+'.mp3',dest=resolve(ROOT,path);let done=false;
  for(let attempt=0;attempt<3&&!done;attempt++){
    // Same model/settings as Run 7 Wren/Narrator lines; whispers use stability 0.5 so the v3 [whispers] tag is honoured.
    const body={text:(whisper?'[whispers] ':'[calm] ')+text,model_id:'eleven_v3',voice_settings:{stability:whisper?.5:1,similarity_boost:.75,use_speaker_boost:true},seed:seed0+attempt};
    try{
      const r=await request('/v1/text-to-speech/'+voiceId+'/with-timestamps?output_format=mp3_44100_128',body,{label:'run8:'+speaker+':'+id+(attempt?':retry'+attempt:''),estimate:Math.max(100,body.text.length*2),json:true});
      const bytes=Buffer.from(r.data.audio_base64||'','base64');if(bytes.length<128)throw Error('provider_empty_audio');
      const raw=resolve(AUDIO,'out/'+r.id+'.mp3');writeFileSync(raw,bytes);twoPass(raw,dest,{I:-16,TP:-1.5,loop:false,edit});
      const p=probe(dest);if(p.rmsDb<-45||p.durationSec<.25)throw Error('silent_or_short');
      results.push({id,file:path,kind:speaker==='WREN'?'wren':'narrator',text,loop:false,use,voiceId,params:{...body,voiceId},...(edit?{edit}:{}),requestId:r.id,...creditsFor(r.id),...p});done=true;console.log('run8 '+speaker+' '+id);
    }catch(e){console.log('run8 retry '+id+' '+e.message);if(/quota|PROVIDER_BLOCKED|401|CREDIT_CAP|SEGMENT_CREDIT_CAP|ALREADY_RUNNING|UNRESOLVED/.test(e.message)){stopped=e.message;break;}}
  }
  if(!done)missing.push(id);
}
for(const [id,path,loop,use,note,kind='effect',text] of reused){
  if(!existsSync(resolve(ROOT,path))){missing.push(id);continue;}
  results.push({id,file:path,kind,...(text?{text}:{}),loop,use,reused:true,note,credits:0,estimate:false,...probe(resolve(ROOT,path))});
}
save(statePath,{generatedAt:new Date().toISOString(),stopped,missing,results});
const manifest=results.map(r=>({id:r.id,file:r.file,kind:r.kind,...(r.text?{text:r.text}:{}),durationSec:r.durationSec,loop:r.loop,...(r.reused?{reusedExisting:true}:{})}));
writeFileSync(resolve(AUDIO,'run8-audio-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({count:results.length,missing,stopped,credits:results.reduce((n,r)=>n+(r.credits||0),0)}));
