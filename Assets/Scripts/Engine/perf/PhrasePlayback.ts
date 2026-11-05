import {PhrasePlan} from "./GeneratedPerformance";
import {VoiceRecord} from "./VoiceSelection";
import {subtitleCues,SubtitleCue} from "./SubtitleTiming";

export interface ResolvedPhrase<T extends VoiceRecord> {record:T;raw:string;prefix:string;}
export function phraseVoiceKey(speaker:string,text:string):string {return speaker+"|steady|"+text.trim().replace(/\s+/g," ");}
/** Resolve the entire admitted utterance before playing any fragment. */
export function resolvePhrasePlayback<T extends VoiceRecord>(plan:PhrasePlan,lookup:(speaker:string,text:string)=>T|undefined):ResolvedPhrase<T>[]|null {
  if(plan.segments.map(s=>s.text).join("")!==plan.text)return null;
  const result:ResolvedPhrase<T>[]=[];let prefix="";
  for(const segment of plan.segments){
    if(segment.speaker!==plan.speaker)return null;
    if(/[A-Za-z0-9]/.test(segment.text)){
      const record=lookup(plan.speaker,segment.text);
      if(!record||record.speaker!==plan.speaker||record.take==="tell"||phraseVoiceKey(record.speaker,record.text)!==phraseVoiceKey(plan.speaker,segment.text))return null;
      result.push({record,raw:segment.text,prefix});
    }
    prefix+=segment.text;
  }
  return result.length?result:null;
}

/** Real character timings reveal exact original prose, retaining previous fragments. */
export function accumulatedPhraseCues(raw:string,prefix:string,record:VoiceRecord):SubtitleCue[] {
  const positions:number[]=[];let normalized="";const start=raw.search(/\S/);
  if(start<0)return [];
  for(let i=start;i<raw.length;i++){
    if(/\s/.test(raw[i])){
      const next=raw.slice(i).search(/\S/);if(next<0)break;
      normalized+=" ";positions.push(i+next-1);i+=next-1;
    }else {normalized+=raw[i];positions.push(i);}
  }
  if(normalized!==record.text)return [];
  return subtitleCues(record.text,record.alignment).map(cue=>({at:cue.at,text:prefix+raw.slice(0,positions[cue.text.length-1]+1)}));
}
