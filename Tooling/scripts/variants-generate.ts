/** Offline only. Generated dialogue never defines facts. */
import Anthropic from '@anthropic-ai/sdk';
import {loadEnvFile} from 'node:process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createHeroCase} from '../../Assets/Scripts/Content/HeroCaseHarlow1041';
import {createGameState} from '../../Assets/Scripts/Engine/game/GameState';
import {buildFactSheet} from '../../Assets/Scripts/Engine/perf/FactSheetBuilder';
import {validateLine} from '../../Assets/Scripts/Engine/perf/LineValidator';
import {performanceRef} from '../../Assets/Scripts/Engine/perf/ReferenceIds';
import {AnswerMode,Emotion} from '../../Assets/Scripts/Engine/core/Types';
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'audio/out/variants'),ledgerFile=resolve(root,'results/anthropic-variants-ledger.json');
mkdirSync(out,{recursive:true});loadEnvFile(resolve(root,'.env'));
const client=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY,baseURL:'https://api.anthropic.com',maxRetries:0,timeout:180000});
const model='claude-opus-5-5';const read=(p:string,f:any)=>existsSync(p)?JSON.parse(readFileSync(p,'utf8')):f;
const ledger=read(ledgerFile,{model,pricing:{source:'https://platform.claude.com/docs/en/about-claude/pricing',checked:'2026-11-03',input:4,output:20,cacheWrite:5,cacheRead:.2},usage:[]});
const safe=(s:string)=>{if(/\bsk-[\w-]{20,}|\bAIza[\w-]{35}/.test(s))throw Error('SECRET_OUTPUT_BLOCKED');return s;};
const save=(p:string,x:any)=>writeFileSync(p,safe(JSON.stringify(x,null,2)));
async function ask(label:string,system:string,input:unknown,schema:any){
 const id=createHash('sha256').update(JSON.stringify({model,system,input,schema})).digest('hex'),file=resolve(out,id+'.json');if(existsSync(file))return read(file,null);
 const spent=ledger.usage.reduce((n:number,x:any)=>n+x.costUSD,0);if(spent>10)throw Error('ANTHROPIC_10_USD_BUDGET');
 const r=await client.messages.create({model,max_tokens:8000,system,messages:[{role:'user',content:JSON.stringify(input)}],output_config:{effort:'medium',format:{type:'json_schema',schema}}});
 const u=r.usage;ledger.usage.push({label,input:u.input_tokens,output:u.output_tokens,cacheWrite:u.cache_creation_input_tokens||0,cacheRead:u.cache_read_input_tokens||0,costUSD:(u.input_tokens*4+u.output_tokens*20+(u.cache_creation_input_tokens||0)*5+(u.cache_read_input_tokens||0)*.2)/1e6});ledger.totalCostUSD=ledger.usage.reduce((n:number,x:any)=>n+x.costUSD,0);save(ledgerFile,ledger);
 const text=r.content.filter(x=>x.type==='text').map(x=>(x as any).text).join('');const value=JSON.parse(safe(text));save(file,value);return value;
}
const g=createHeroCase(),results:any[]=[],variants:any[]=[];
const schema={type:'object',additionalProperties:false,required:['candidates'],properties:{candidates:{type:'array',items:{type:'object',additionalProperties:false,required:['text','emotion'],properties:{text:{type:'string'},emotion:{type:'string',enum:['calm','guarded','irritated','rattled','smug','grieving']}}}}}};
const judgeSchema={type:'object',additionalProperties:false,required:['judgments'],properties:{judgments:{type:'array',items:{type:'object',additionalProperties:false,required:['index','allowed','reason'],properties:{index:{type:'integer'},allowed:{type:'boolean'},reason:{type:'string'}}}}}};
for(const s of g.statements){
 const suspect=g.cast.suspects.find(p=>p.id===s.speaker)!;const state=createGameState(g);state.suspects[s.speaker].layer=s.layer;if(s.replacementFor)state.suspects[s.speaker].topicOverrides[s.topic]=s.id;
 const sheet=buildFactSheet(g,state,s.speaker);
 for(const mode of ['answer','press'] as AnswerMode[]){
  const canonical=mode==='press'?s.pressed!.canonical:s.canonical,ref=performanceRef(mode==='press'?'p':'a',s.id);
  const generated=await ask('write:'+s.id+':'+mode,'Write 10 distinct concise in-character performances of exactly this fictional suspect account. Preserve every claim, name, time, participant role, possessive and negator next to its verb. No new habit, action, money, date, backstory or confession. Use restrained conversational rhythm and assertion-free brief openers. Keep most words from the canonical. Do not describe acting in brackets. 220 characters maximum. No claims beyond canonical even if persona implies them.',{canonical,persona:suspect.persona,actingNotes:suspect.actingNotes,mode},schema);
  const judged=await ask('judge:'+s.id+':'+mode,'Independently judge each candidate against the supplied canonical account, never against hidden truth. Accept only the same factual assertion, roles and polarity; reject invented details, new interactions, confessions, or new personal history. This may be a cover story and must remain a cover story. Return every zero-based index.',{canonical,candidates:generated.candidates},judgeSchema);
  const candidates=generated.candidates.map((c:any,index:number)=>{const check=validateLine({topic:s.topic,cites:[ref],line:c.text,emotion:c.emotion},sheet,g,mode);const judge=judged.judgments.find((j:any)=>j.index===index);return {...c,index,valid:check.ok,errors:check.errors,judge};});
  const kept=candidates.filter((c:any)=>c.valid&&c.judge?.allowed).filter((c:any,i:number,a:any[])=>a.findIndex(x=>x.text===c.text)===i).slice(0,6);
  for(const [i,c] of kept.entries())for(const m of mode==='answer'?['answer','broken']:[mode])variants.push({id:s.id+':'+m+':v'+i,suspect:s.speaker,ref,mode:m,text:c.text,emotion:c.emotion});
  results.push({statement:s.id,mode,canonical,candidates,kept:kept.length});save(resolve(root,'results/variants-run4.json'),{model,generatedAt:new Date().toISOString(),results});console.log(s.id+' '+mode+' retained '+kept.length+'/10');
 }
}
mkdirSync(resolve(root,'audio/out/staged/Assets/Scripts/Content'),{recursive:true});
writeFileSync(resolve(root,'audio/out/staged/Assets/Scripts/Content/HeroVariantBank.ts'),'/** Claude Opus 5.5 generated and independently judged offline; deterministic validator filtered. Human hero-path skim pending. */\nexport const HERO_VARIANTS = '+JSON.stringify(variants,null,2)+' as const;\n');
console.log('Variants '+variants.length+'; costUSD '+ledger.totalCostUSD);
