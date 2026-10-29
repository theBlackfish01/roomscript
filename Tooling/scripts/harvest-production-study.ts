/** Harvest only explicitly marked, credential-free diagnostic rows from a Lens log. */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
const path=process.argv[2];if(!path)throw new Error("Pass the Lens log path");
const rows=new Map<number,any>();const completed:number[]=[];
for(const line of readFileSync(path,"utf8").split(/\r?\n/)) {
  const marker="PRODUCTION_STUDY|",at=line.indexOf(marker);
  if(at>=0){try{const row=JSON.parse(line.slice(at+marker.length));if(Number.isInteger(row.sample))rows.set(row.sample,row);}catch{}}
  const done=line.match(/PRODUCTION_STUDY_COMPLETE\|(\d+)\|10/);if(done)completed.push(Number(done[1]));
}
const samples=[...rows.values()].sort((a,b)=>a.sample-b.sample),quantile=(values:number[],p:number)=>{const sorted=values.slice().sort((a,b)=>a-b);return sorted[Math.ceil(sorted.length*p)-1]??null;};
const audio=samples.filter(s=>s.audioMs!==null).map(s=>s.audioMs),live=samples.filter(s=>s.condition!=="forced-offline");
const summary={samples:samples.length,completedBatches:[...new Set(completed)],textP50:quantile(live.map(s=>s.textMs),.5),textP95:quantile(live.map(s=>s.textMs),.95),audioP50:quantile(audio,.5),audioP95:quantile(audio,.95),audible:audio.length,subtitleOnly:samples.length-audio.length,audioOver6500:audio.filter(n=>n>6500).length,questionsWithRejection:live.filter(s=>s.rejections>0).length,totalRejections:live.reduce((n,s)=>n+s.rejections,0),attempts:live.reduce((n,s)=>n+s.attempts,0),model:live.filter(s=>s.origin==="model").length,audioCacheHits:samples.reduce((n,s)=>n+s.audioCacheHits,0),note:"Latest sample per ID from three ten-call Preview batches. Performer calls share four canonical contexts, not thirty sequential charged game actions. During-precache hits are reported, not counted as uncached latency evidence."};
const output=JSON.stringify({summary,samples},null,2);if(/\bsk-[A-Za-z0-9_-]{20,}|\bAIza[0-9A-Za-z_-]{35}/.test(output))throw new Error("SECRET_OUTPUT_BLOCKED");
mkdirSync("results",{recursive:true});writeFileSync("results/production-study-2026-10-30.json",output);console.log(summary);
