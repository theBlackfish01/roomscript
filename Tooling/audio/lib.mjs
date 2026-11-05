import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, openSync, closeSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadEnvFile} from 'node:process';
export const AUDIO=dirname(fileURLToPath(import.meta.url)), ROOT=resolve(AUDIO,'../..');
export const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export const read=(p,fallback)=>existsSync(p)?JSON.parse(readFileSync(p,'utf8')):fallback;
export function save(p,x){mkdirSync(dirname(p),{recursive:true});writeFileSync(p+'.tmp',JSON.stringify(x,null,2));renameSync(p+'.tmp',p);}
export const ledgerPath=resolve(ROOT,'Tooling/results/elevenlabs-ledger.json');
export const CAP=180000;
export function audioFile(path){for(const p of [resolve(AUDIO,'out/staged',path),resolve(AUDIO,'library',path.replace(/^Assets\/Audio\//,'')),resolve(ROOT,path)])if(existsSync(p))return p;throw Error('MISSING_AUDIO_FILE '+path);}
export function parseManifestExport(source,name){const prefix='export const '+name+' = ',at=source.indexOf(prefix);if(at<0)throw Error('MISSING_MANIFEST_EXPORT '+name);return JSON.parse(source.slice(at+prefix.length).trim().replace(/;$/,''));}
export function cleanAlignment(a){if(!a)return undefined;const text=a.characters.join(''),skip=new Set();for(const m of text.matchAll(/\[[^\]]*\]/g))for(let i=m.index;i<m.index+m[0].length;i++)skip.add(i);const starts=a.starts||a.character_start_times_seconds,ends=a.ends||a.character_end_times_seconds;const result={characters:[],starts:[],ends:[]};for(let i=0;i<a.characters.length;i++)if(!skip.has(i)){result.characters.push(a.characters[i]);result.starts.push(starts[i]);result.ends.push(ends[i]);}while(result.characters.length&&/^\s$/.test(result.characters[0])){result.characters.shift();result.starts.shift();result.ends.shift();}return result;}
export const total=l=>l.entries.reduce((n,e)=>n+(e.credits||0),0);
export function reserve(l,id,estimate,label){if(l.entries.some(e=>e.id===id&&e.status==='reserved'))throw Error('UNRESOLVED_RESERVATION: inspect ledger before retry');if(l.entries.some(e=>e.id===id&&e.status==='complete'))throw Error('UNCACHED_COMPLETED_REQUEST: restore cache before retry');if(total(l)+estimate>CAP)throw Error('CREDIT_CAP');const segment=l.segments?.find(s=>s.id===l.activeSegment);if(segment&&l.entries.filter(e=>e.segment===segment.id).reduce((n,e)=>n+(e.credits||0),0)+estimate>segment.allowanceCredits)throw Error('SEGMENT_CREDIT_CAP');l.entries.push({id,label,status:'reserved',credits:estimate,estimate:true,at:new Date().toISOString(),segment:l.activeSegment});}
export function settle(l,id,header,success){const e=l.entries.findLast(e=>e.id===id&&e.status==='reserved');if(!e)throw Error('MISSING_RESERVATION');const n=header===null?NaN:Number(header);e.status=success?'complete':'failed';if(Number.isFinite(n)&&n>=0){e.credits=n;e.estimate=false;}else if(!success){e.credits=0;e.estimate=false;}l.totalCredits=total(l);}
// No API key is persisted, echoed, or included in cache keys or exceptions.
export async function request(endpoint,body,{label,estimate=0,json=false,formData}={}){
 const id=hash({endpoint,body}),dir=resolve(AUDIO,'out/cache'),meta=resolve(dir,id+'.json'),bin=resolve(dir,id+'.bin');mkdirSync(dir,{recursive:true});
 const cached=read(meta,null);if(cached?.complete&&existsSync(bin))return {id,data:json?JSON.parse(readFileSync(bin,'utf8')):readFileSync(bin),cached:true};
 const lock=resolve(AUDIO,'out/request.lock');let fd;try{fd=openSync(lock,'wx');}catch{throw Error('AUDIO_GENERATOR_ALREADY_RUNNING');}
 try{
  const ledger=read(ledgerPath,{version:1,capCredits:CAP,notes:['Historical key test predates ledger: 30 TTS + 36 SFX + 39 dialogue known; reserve 3000 for voice-design/music unknown costs.'],entries:[{id:'historical-key-test',label:'pre-Run4 key capability test',status:'complete',credits:3105,estimate:true}]});
  if(ledger.providerBlock)throw Error('PROVIDER_BLOCKED_'+ledger.providerBlock.reason);
  reserve(ledger,id,estimate,label);save(ledgerPath,ledger);
  loadEnvFile(resolve(ROOT,'Tooling/.env'));const key=process.env.ELEVENLABS_API_KEY;if(!key)throw Error('MISSING_ELEVENLABS_KEY');
  let response;try{response=await fetch('https://api.elevenlabs.io'+endpoint,{method:'POST',headers:formData?{'xi-api-key':key}:{'xi-api-key':key,'content-type':'application/json'},body:formData||JSON.stringify(body),signal:AbortSignal.timeout(240000)});}catch{throw Error('NETWORK_UNCERTAIN_RESERVATION_RETAINED');}
  const data=Buffer.from(await response.arrayBuffer());settle(ledger,id,response.headers.get('character-cost'),response.ok);save(ledgerPath,ledger);
  if(!response.ok){let reason='';try{const e=JSON.parse(data.toString());reason=String(e.detail?.status||e.error?.type||'').replace(/[^a-zA-Z0-9_. -]/g,'').slice(0,160);}catch{}if(reason==='quota_exceeded'){ledger.providerBlock={reason,at:new Date().toISOString(),note:'No further paid requests until Wadood confirms provider quota is available.'};save(ledgerPath,ledger);}throw Error('ELEVENLABS_HTTP_'+response.status+' '+reason);}
  writeFileSync(bin,data);save(meta,{complete:true,id,endpoint,label,at:new Date().toISOString(),credits:ledger.entries.findLast(e=>e.id===id).credits});
  return {id,data:json?JSON.parse(data.toString()):data,cached:false};
 }finally{if(fd!==undefined){closeSync(fd);unlinkSync(lock);}}
}
