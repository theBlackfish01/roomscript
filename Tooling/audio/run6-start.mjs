/** Run 6: reconcile the interrupted zero-credit save before selecting the owner-approved voice. */
import {read,save,request,AUDIO,ROOT,ledgerPath,CAP,total,hash} from './lib.mjs';
import {resolve} from 'node:path';
import {loadEnvFile} from 'node:process';
const file=resolve(AUDIO,'cast.json'),cast=read(file,null),vale=cast.voices.find(v=>v.id==='S2');
const generatedVoiceId='Ajczv1caVKcFEG1TdJH0',segment='run6-2026-11-05';
const body={voice_name:'Roomscript Vale Take 1',voice_description:vale.description,generated_voice_id:generatedVoiceId};
const ledger=read(ledgerPath,null);
ledger.segments??=[];
if(!ledger.segments.some(s=>s.id===segment)){
 ledger.segments.push({id:segment,startedAt:new Date().toISOString(),allowanceCredits:30000,baselineAccountedCredits:total(ledger),baselineEntryCount:ledger.entries.length,previousProviderBlock:ledger.providerBlock,authorization:'Wadood Run 6: use the 30,000-credit Nov 4 top-up; Vale take 1 first, then hero/mood/tell gaps. Stop on provider quota error. This is the same top-up, not another 30,000 credits.'});
 delete ledger.providerBlock;ledger.activeSegment=segment;ledger.capCredits=CAP;save(ledgerPath,ledger);
}
if(vale.selected===0&&vale.ownerSelectedAt){console.log('Run6: selected Vale take 1 already saved.');process.exit(0);}
loadEnvFile(resolve(ROOT,'Tooling/.env'));
const key=process.env.ELEVENLABS_API_KEY;if(!key)throw Error('MISSING_ELEVENLABS_KEY');
const response=await fetch('https://api.elevenlabs.io/v2/voices?search=Roomscript%20Vale%20Take%201&page_size=100',{headers:{'xi-api-key':key},signal:AbortSignal.timeout(60000)}).catch(()=>{throw Error('VOICE_RECONCILIATION_NETWORK_FAILED');});
if(!response.ok)throw Error('VOICE_RECONCILIATION_HTTP_'+response.status);
const data=await response.json();if(data.has_more)throw Error('VOICE_RECONCILIATION_INCOMPLETE');
const matches=data.voices.filter(v=>v.voice_id===generatedVoiceId||v.name===body.voice_name);
if(matches.length>1)throw Error('AMBIGUOUS_SAVED_VOICE');
const prior=ledger.entries.findLast(e=>e.id===hash({endpoint:'/v1/text-to-voice',body})&&e.status==='reserved');
if(prior){if(prior.credits!==0)throw Error('NONZERO_RESERVATION_REQUIRES_RECONCILIATION');prior.status=matches.length?'complete':'failed';prior.estimate=false;prior.reconciledAt=new Date().toISOString();prior.reconciliation=matches.length?'Exact saved voice found by authenticated GET /v2/voices.':'No matching saved voice exists in complete authenticated GET /v2/voices search.';save(ledgerPath,ledger);}
const saved=matches[0]||((await request('/v1/text-to-voice',body,{label:'run6:save-cast:S2:take1',estimate:0,json:true})).data);
if(!saved.voice_id)throw Error('SAVE_VOICE_MISSING_ID');
vale.previousSelection={selected:vale.selected,voiceId:vale.voiceId};vale.selected=0;vale.voiceId=saved.voice_id;vale.voiceSource='designed';vale.ownerSelectedAt=new Date().toISOString();delete vale.pendingSelection;save(file,cast);
console.log('Run6: Vale S2-1 saved and selected; six other cast roles unchanged.');
