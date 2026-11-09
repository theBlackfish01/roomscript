/** Native playback owns completion. Caption bounds and decoder positions can lead audible output. */
export class SpeechPlayback {
  private observed=false;
  observe(playing:boolean,finished:boolean,elapsedMs:number,durationMs=0,positionMs=0):"waiting"|"completed"|"timeout" {
    this.observed=this.observed||playing;
    if(finished&&!playing)return "completed";
    // Preview can leave isPlaying latched at EOF without a finish signal. Only
    // release after BOTH the full native file and its real-time playback window,
    // plus output-buffer allowance. An early decoder position alone is not enough.
    if(playing&&Number.isFinite(durationMs)&&durationMs>0&&positionMs>=durationMs-25&&elapsedMs>=durationMs+SPEECH_OUTPUT_DRAIN_MS)return "completed";
    if(elapsedMs>(this.observed?60000:3000))return "timeout";
    return "waiting";
  }
}
/** Let the native output buffer drain before reusing a player or handing speech to another voice. */
export const SPEECH_OUTPUT_DRAIN_MS=250;
