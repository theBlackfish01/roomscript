/** Presentation timing only. Text must already have been admitted by the engine. */
export type SubtitleSource = "estimated" | "aligned" | "none";
export const ESTIMATED_WORD_SECONDS = 0.30;
export const SUBTITLE_READ_SECONDS = 2;
const normalize = (text:string):string => text.trim().replace(/\s+/g," ");
export function subtitleWindow(text:string, limit=32):string {
  const words=normalize(text).split(" ");let out="";
  for(let i=words.length-1;i>=0;i--){if((words[i]+" "+out).length>limit&&out)break;out=words[i]+(out?" "+out:"");}
  return out;
}

/** Explicit clock input keeps the fallback deterministic and testable without Lens. */
export class SubtitlePresentation {
  private transcript="";private words:string[]=[];private count=0;private visible="";
  private nextAt=Infinity;private clearAt=Infinity;private source:SubtitleSource="none";
  set(text:string,now:number):void {
    this.transcript=text;const clean=normalize(text);this.words=clean?clean.split(" "):[];
    this.count=this.words.length?1:0;this.source=this.count?"estimated":"none";
    this.visible=this.count?this.words[0]:"";this.nextAt=now+ESTIMATED_WORD_SECONDS;
    this.clearAt=this.count===this.words.length?now+SUBTITLE_READ_SECONDS:Infinity;
  }
  /** Untimed TTS start/failure notifications must not jump to the last words or reset a running fallback. */
  untimed(text:string,now:number):void {
    if(text!==this.transcript){this.set(text,now);return;}
    if(this.source!=="aligned")return;
    this.source="estimated";this.nextAt=now+ESTIMATED_WORD_SECONDS;
    this.clearAt=this.count===this.words.length?now+SUBTITLE_READ_SECONDS:Infinity;
  }
  /** Only explicitly audio-aligned prefixes take ownership from the estimated clock. */
  reveal(prefix:string,now:number):void {
    const clean=normalize(prefix),full=normalize(this.transcript);
    if(clean&&!full.startsWith(clean))return;
    this.source="aligned";this.count=clean?clean.split(" ").length:0;
    this.visible=subtitleWindow(clean);this.nextAt=Infinity;
    this.clearAt=clean===full?now+SUBTITLE_READ_SECONDS:Infinity;
  }
  advance(now:number):string {
    if(this.source==="estimated"&&this.count<this.words.length&&now>=this.nextAt){
      // A delayed Preview frame must not skip an entire sentence. Reveal at most one new word per rendered update.
      this.count++;this.visible=subtitleWindow(this.words.slice(0,this.count).join(" "));
      this.nextAt=now+ESTIMATED_WORD_SECONDS;
      if(this.count===this.words.length)this.clearAt=now+SUBTITLE_READ_SECONDS;
    }
    if(now>=this.clearAt){this.visible="";this.source="none";this.nextAt=Infinity;this.clearAt=Infinity;}
    return this.visible;
  }
  fullText():string{return this.transcript;}
  text():string{return this.visible;}
  diagnostics():{timing:SubtitleSource;estimatedWordSeconds:number;revealedWords:number;totalWords:number;visible:string}{
    return {timing:this.source,estimatedWordSeconds:ESTIMATED_WORD_SECONDS,revealedWords:this.count,totalWords:this.words.length,visible:this.visible};
  }
}
