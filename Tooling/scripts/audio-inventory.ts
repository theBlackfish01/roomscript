import {writeFileSync,mkdirSync,existsSync,readFileSync} from 'node:fs';import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHeroLineBank} from '../../Assets/Scripts/Content/HeroLineBank';
import {createHeroCase} from '../../Assets/Scripts/Content/HeroCaseHarlow1041';
import {openingCaseCard,endingSummary} from '../../Assets/Scripts/Engine/game/CaseClarity';
import {partnerLine,PartnerTrigger} from '../../Assets/Scripts/Engine/game/Partner';
import {createGameState} from '../../Assets/Scripts/Engine/game/GameState';
const root=resolve(import.meta.dirname,'../..'),g=createHeroCase();const lines:any[]=[];
const add=(speaker:string,text:string,id:string,take='steady')=>{if(!lines.some(x=>x.speaker===speaker&&x.text===text&&x.take===take))lines.push({speaker,text,id,take});};
for(const e of createHeroLineBank())for(const take of ['steady','rattled','broken'])add(e.suspect,e.answer.line,e.answer.cites[0],take);
for(const s of g.statements.filter(s=>s.stance==='cover'))add(s.speaker,s.canonical,s.id,'tell');
const narration=[
 ['NARRATOR','Listen at the door.','opening-listen'],['NARRATOR','Nobody leaves.','opening-lock'],
 ['NARRATOR','Edmund Harlow was found at twenty-two forty-one. Four guests. One killer. Who did it, where, and with what?','opening-case'],
 ['WREN','Start with what you can prove.','wren-open'],['WREN','Watch the hesitation. A tell is a lead, not proof.','wren-tell'],
 ['WREN','That is a contradiction. Keep the statement beside the evidence.','wren-objection'],['WREN','What do we know for certain?','wren-idle'],
 ['WREN','Read the evidence once more before you seal it.','wren-seal'],['WREN','A letter. Read it carefully.','wren-letter'],
 ['WREN','Listen to the recording.','wren-voicemail'],['WREN','Stay here. We still have questions.','wren-flight'],
 ['WREN','Keep your eyes on the evidence.','wren-blackout'],['NARRATOR','Case closed.','case-closed'],
 ['S2','Good evening, Detective.','arrival-vale'],['S1','Quite an entrance, Detective.','arrival-qadir'],['S3','Please be precise.','arrival-okafor'],['S4','Easy, Detective.','arrival-pike'],
 ['NARRATOR','Time has run out. Make your final accusation.','timeout'],
 ['NARRATOR','An accusation is not proof. The case remains unresolved.','wrong-ending']
];
for(const [s,t,id] of narration)add(s,t,id);
add('NARRATOR',openingCaseCard(g).text,'opening-case-exact');
const ending=createGameState(g);ending.verdict='correct';
for(const [i,line] of endingSummary(g,ending).entries())add('NARRATOR',line.text,'ending-'+i);
for(const trigger of ['opening','first-tell','first-objection','letter','voicemail','flight','blackout','idle','seal'] as PartnerTrigger[]) {const line=partnerLine(g,ending.knowledge,trigger);add('WREN',line.text,line.id);}
ending.knowledge.factIds=g.facts.filter(f=>f.truth).map(f=>f.id);const proven=partnerLine(g,ending.knowledge,'seal');add('WREN',proven.text,proven.id);
// Fact citations stay on exported content; audio is only a performance of those strings.
for(const fact of g.facts.filter(f=>f.truth&&/MOTIVE|KILLED|MURDER|SECRET/.test(f.id)))add('NARRATOR',fact.canonical!,fact.id);
const preferred=(name:string)=>{const staged=resolve(root,'Tooling/audio/out/staged/Assets/Scripts/Content',name);return existsSync(staged)?staged:resolve(root,'Assets/Scripts/Content',name);};
const bank=preferred('HeroVariantBank.ts');if(existsSync(bank)){const {HERO_VARIANTS}=await import(pathToFileURL(bank).href);for(const v of HERO_VARIANTS)for(const take of process.argv.includes('--all-moods')?['steady','rattled','broken']:[v.emotion==='rattled'?'rattled':'steady'])add(v.suspect,v.text,v.id,take);}
const register=preferred('HeroRegisterBank.ts');if(existsSync(register)){const {HERO_REGISTER}=await import(pathToFileURL(register).href);for(const v of HERO_REGISTER)add(v.suspect,v.text,v.id);}
const video=readFileSync(resolve(root,'devpost/drafts/video-plan.md'),'utf8');for(const match of video.matchAll(/- \*\*VO (\d+) \([^\n]+?\*\* "([^\n]+?)"/g))add('NARRATOR',match[2].replace(/\*/g,''),'video-vo-'+match[1]);
mkdirSync(resolve(root,'Tooling/audio'),{recursive:true});writeFileSync(resolve(root,'Tooling/audio/voice-spec.json'),JSON.stringify({version:1,lines},null,2));console.log('Voice inventory '+lines.length);
