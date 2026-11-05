/** Run 7 consumes the reported remainder, not a new top-up. */
import {read,save,ledgerPath,total,CAP} from './lib.mjs';
const ledger=read(ledgerPath,null),id='run7-2026-11-05';
if(!ledger)throw Error('MISSING_LEDGER');
ledger.segments??=[];
if(!ledger.segments.some(s=>s.id===id)){
  ledger.segments.push({id,startedAt:new Date().toISOString(),allowanceCredits:25000,baselineAccountedCredits:total(ledger),baselineEntryCount:ledger.entries.length,authorization:'Wadood Run 7: about 25,000 credits remain from existing allowance; phrase segments first, casting narration, new effects, then voice-agent spike. This is not an additional top-up. Stop generating audio on quota, continue development.'});
  ledger.activeSegment=id;ledger.capCredits=CAP;save(ledgerPath,ledger);
}
console.log(JSON.stringify({segment:id,providerBlocked:!!ledger.providerBlock,accountedCredits:total(ledger),run7Credits:ledger.entries.filter(e=>e.segment===id).reduce((n,e)=>n+(e.credits||0),0)}));
