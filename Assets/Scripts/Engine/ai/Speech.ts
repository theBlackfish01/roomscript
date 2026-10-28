import {DEADLINES,remainingMs} from "./Deadlines";

/** Preserve titles, initials, decimal times and a.m./p.m. inside sentences. */
export function splitSentences(line:string):string[] {
  const result:string[]=[];let start=0;
  for(let i=0;i<line.length;i++) {
    const char=line[i];if(!/[.!?]/.test(char))continue;
    if(i+1<line.length && !/\s/.test(line[i+1]))continue;
    if(char===".") {
      const prefix=line.slice(start,i+1),next=line.slice(i+1).trimStart();
      if(/\b(?:Dr|Mrs|Mr|Ms|Prof|St|Sr|Jr)\.$/i.test(prefix))continue;
      if(/\b[A-Z]\.$/.test(prefix) && next)continue;
      if(/\b(?:[ap]\.m|e\.g|i\.e)\.$/i.test(prefix) && next)continue;
    }
    const sentence=line.slice(start,i+1).trim();if(sentence)result.push(sentence);start=i+1;
  }
  const tail=line.slice(start).trim();if(tail)result.push(tail);return result;
}
export type PreparedClip<T>={ok:true;track:T}|{ok:false;error:unknown};
/** Handle rejection immediately, even if a later clip fails before the first finishes. */
export function prepareSpeech<T>(line:string,synthesize:(sentence:string)=>Promise<T>):Array<{sentence:string;ready:Promise<PreparedClip<T>>}> {
  return splitSentences(line).map(sentence=>({sentence,ready:Promise.resolve().then(()=>synthesize(sentence))
    .then(track=>({ok:true as const,track}),error=>({ok:false as const,error}))}));
}
export function audioBudgetMs(questionStartedAt:number,now:number):number {return Math.min(DEADLINES.ttsMs,remainingMs(questionStartedAt,DEADLINES.answerMs,now));}
