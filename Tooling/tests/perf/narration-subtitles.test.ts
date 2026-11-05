import {describe,it,expect} from "vitest";
import {narrationCaptionPlan,estimatedNarrationSeconds} from "../../../Assets/Scripts/Engine/perf/NarrationSubtitles";
import {SubtitlePresentation} from "../../../Assets/Scripts/Engine/perf/SubtitlePresentation";
const record=(text:string)=>({index:0,speaker:"NARRATOR",text,take:"steady",alignment:{characters:[...text],starts:[...text].map((_,i)=>i*.1),ends:[...text].map((_,i)=>(i+1)*.1)}});
describe("narration subtitle routing",()=>{
  it("keeps the complete transcript while aligned multi-clip prefixes reveal every word",()=>{
    const full="First sentence.  Second sentence.",plan=narrationCaptionPlan(full,[record("First sentence."),record("Second sentence.")])!;
    const p=new SubtitlePresentation();p.set(full,0);let time=0;
    for(const clip of plan){p.reveal(clip.prefix,++time);for(const cue of clip.cues){p.reveal(cue.text,++time);expect(p.text().split(" ").at(-1)).toBe(cue.text.split(" ").at(-1));expect(p.fullText()).toBe(full);}p.reveal(clip.end,++time);}
    p.reveal(full,++time);expect(p.text()).toBe("First sentence. Second sentence.");expect(p.advance(time+2)).toBe("");expect(p.fullText()).toBe(full);
  });
  it("falls back for the entire utterance if any alignment is absent or mismatched",()=>{
    expect(narrationCaptionPlan("One. Two.",[record("One."),{...record("Two."),alignment:undefined}])).toBeNull();
    expect(narrationCaptionPlan("One. Two.",[record("One."),record("Hidden.")])).toBeNull();
    expect(narrationCaptionPlan("One. Omitted. Two.",[record("One."),record("Two.")])).toBeNull();
  });
  it("preserves repeated clip ordering and original whitespace",()=>{
    const plan=narrationCaptionPlan("Yes.\nYes.",[record("Yes."),record("Yes.")])!;
    expect(plan[1].prefix).toBe("Yes.\n");expect(plan[1].cues[0].text).toBe("Yes.\nYes.");
  });
  it("gives a long missing-audio sentence its full estimated reading window",()=>{
    const full=Array.from({length:30},(_,i)=>"word"+i).join(" ");
    expect(estimatedNarrationSeconds(full)).toBeCloseTo(10.7);expect(estimatedNarrationSeconds("")).toBe(2);
  });
});
