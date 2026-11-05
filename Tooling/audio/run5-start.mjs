/** Explicit owner-approved new allowance and exact single-role casting swap. Idempotent. */
import {read,save,request,AUDIO,ledgerPath,CAP,total} from './lib.mjs';
import {resolve} from 'node:path';
const ledger=read(ledgerPath,null),segment='run5-2026-11-04';
ledger.segments??=[];
if(!ledger.segments.some(s=>s.id===segment)){
 ledger.segments.push({id:segment,startedAt:new Date().toISOString(),allowanceCredits:30000,baselineAccountedCredits:total(ledger),baselineEntryCount:ledger.entries.length,previousProviderBlock:ledger.providerBlock,authorization:'Wadood Run 5: 30,000 new credits; Vale take 1 first, then missing hero/moods/tells; stop at provider quota error.'});
 delete ledger.providerBlock;
 ledger.activeSegment=segment;ledger.capCredits=CAP;save(ledgerPath,ledger);
}
const file=resolve(AUDIO,'cast.json'),cast=read(file,null),vale=cast.voices.find(v=>v.id==='S2'),generatedVoiceId='Ajczv1caVKcFEG1TdJH0';
if(vale.selected!==0||vale.previews[vale.selected]?.generatedVoiceId!==generatedVoiceId||!vale.ownerSelectedAt){
 const r=await request('/v1/text-to-voice',{voice_name:'Roomscript Vale Take 1',voice_description:vale.description,generated_voice_id:generatedVoiceId},{label:'run5:save-cast:S2:take1',estimate:0,json:true});
 vale.previousSelection={selected:vale.selected,voiceId:vale.voiceId};vale.selected=0;vale.voiceId=r.data.voice_id;vale.voiceSource='designed';vale.ownerSelectedAt=new Date().toISOString();delete vale.pendingSelection;save(file,cast);
}
console.log('Run5 ledger segment ready; Vale take 1 saved; other six roles unchanged.');
