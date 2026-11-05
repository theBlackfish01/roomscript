import {VoiceRecord} from "./VoiceSelection";
import {subtitleCues,SubtitleCue} from "./SubtitleTiming";
import {ESTIMATED_WORD_SECONDS,SUBTITLE_READ_SECONDS} from "./SubtitlePresentation";
export interface NarrationCaptionClip {prefix:string;end:string;cues:SubtitleCue[];}
/** A narration uses alignment only when every clip exactly covers the admitted utterance. */
export function narrationCaptionPlan(full:string,records:readonly VoiceRecord[]):NarrationCaptionClip[]|null {
  if(!records.length)return null;let cursor=0;const result:NarrationCaptionClip[]=[];
  for(const record of records){
    const at=full.indexOf(record.text,cursor),cues=subtitleCues(record.text,record.alignment);
    if(at<0||full.slice(cursor,at).trim()||!cues.length)return null;
    const prefix=full.slice(0,at);cursor=at+record.text.length;
    result.push({prefix,end:full.slice(0,cursor),cues:cues.map(cue=>({at:cue.at,text:prefix+cue.text}))});
  }
  return full.slice(cursor).trim()?null:result;
}
/** Missing audio must leave enough estimated reading time before the queue replaces the caption. */
export function estimatedNarrationSeconds(text:string):number {
  const words=text.trim()?text.trim().split(/\s+/).length:0;
  return Math.max(SUBTITLE_READ_SECONDS,Math.max(0,words-1)*ESTIMATED_WORD_SECONDS+SUBTITLE_READ_SECONDS);
}
