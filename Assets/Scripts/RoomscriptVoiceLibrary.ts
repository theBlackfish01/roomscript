import {VOICE_MANIFEST} from "./Content/VoiceManifest";
import {ROOMScriptVoiceAssets} from "./RoomscriptVoiceAssets";
import {VoiceIndex,VoiceRecord} from "./Engine/perf/VoiceSelection";
import {splitSentences} from "./Engine/ai/Speech";
export interface BundledVoice {track:AudioTrackAsset;record:VoiceRecord;}
/** Shared index, built once; literal assets are bundled by Lens Studio. */
export class RoomscriptVoiceLibrary {
  private static index:VoiceIndex<VoiceRecord>;
  static clips(speaker:string,text:string,mood="steady",allowTell=false):BundledVoice[]|null {
    if(!this.index)this.index=new VoiceIndex(VOICE_MANIFEST);
    const full=this.index.find(speaker,text,mood,allowTell);
    const records=full?[full]:splitSentences(text).map(s=>this.index.find(speaker,s,mood,allowTell));
    if(!records.length||records.some(r=>!r||!ROOMScriptVoiceAssets[r.index]))return null;
    return records.map(record=>({record:record!,track:ROOMScriptVoiceAssets[record!.index]}));
  }
}
