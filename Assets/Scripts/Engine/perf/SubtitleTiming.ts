import {VoiceRecord} from "./VoiceSelection";
export interface SubtitleCue {at:number;text:string;}
/** Timing supplies reveal positions only; displayed words always come from admitted text. */
export function subtitleCues(text:string,alignment:VoiceRecord["alignment"]):SubtitleCue[] {
  if(!alignment||alignment.characters.join("")!==text||alignment.starts.length!==text.length||alignment.ends.length!==text.length)return [];
  const cues:SubtitleCue[]=[];let previous=-1;
  for(let i=0;i<text.length;i++){
    const time=alignment.starts[i];
    if(!Number.isFinite(time)||time<0||time<previous)return [];
    previous=time;
    if(!/\s/.test(text[i])&&(i===0||/\s/.test(text[i-1]))){let end=i+1;while(end<text.length&&!/\s/.test(text[end]))end++;cues.push({at:time,text:text.slice(0,end)});}
  }
  return cues;
}
