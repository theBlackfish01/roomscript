import {describe,it,expect} from "vitest";
import {SubtitlePresentation,SUBTITLE_READ_SECONDS} from "../../../Assets/Scripts/Engine/perf/SubtitlePresentation";
describe("subtitle presentation fallback",()=>{
  const sentence="Every admitted word must reach the caption even when no voice clip or alignment exists.";
  it("starts at the first word, reveals every word and retains the exact transcript",()=>{
    const p=new SubtitlePresentation();p.set(sentence,0);expect(p.text()).toBe("Every");
    const words=sentence.split(" ");
    for(let i=1;i<words.length;i++){p.advance(i*.31);expect(p.text().split(" ").at(-1)).toBe(words[i]);}
    expect(p.fullText()).toBe(sentence);expect(p.diagnostics().revealedWords).toBe(words.length);
  });
  it("does not skip words after a stalled frame or a repeated full-text TTS notification",()=>{
    const p=new SubtitlePresentation();p.set(sentence,0);p.untimed(sentence,.1);expect(p.text()).toBe("Every");
    p.advance(150);expect(p.text()).toBe("Every admitted");p.untimed(sentence,151);expect(p.text()).toBe("Every admitted");
  });
  it("holds the final caption for a readable window then clears only the display",()=>{
    const p=new SubtitlePresentation();p.set("Two words.",0);p.advance(.3);
    expect(p.advance(.3+SUBTITLE_READ_SECONDS-.001)).toBe("Two words.");
    expect(p.advance(.3+SUBTITLE_READ_SECONDS)).toBe("");expect(p.fullText()).toBe("Two words.");
  });
  it("external alignment takes precedence without a premature clear during a long pause",()=>{
    const p=new SubtitlePresentation();p.set("One two three.",0);p.reveal("",.1);expect(p.advance(100)).toBe("");
    p.reveal("One",101);expect(p.advance(200)).toBe("One");expect(p.diagnostics().timing).toBe("aligned");
    p.reveal("One two three.",201);expect(p.advance(202.99)).toBe("One two three.");expect(p.advance(203)).toBe("");
  });
  it("resumes estimated remaining words on audio failure and ignores stale aligned text",()=>{
    const p=new SubtitlePresentation();p.set("One two three.",0);p.reveal("One two",1);p.untimed("One two three.",2);
    expect(p.text()).toBe("One two");expect(p.advance(2.31)).toBe("One two three.");
    p.set("New answer.",3);p.reveal("Old answer.",4);expect(p.text()).toBe("New");
  });
  it("clears empty text and never initially renders the tail of a long line",()=>{
    const p=new SubtitlePresentation();p.set(sentence,0);expect(p.text()).not.toContain("alignment exists");p.set("",1);
    expect(p.advance(200)).toBe("");expect(p.fullText()).toBe("");
  });
  it("accepts exact phrase prefixes followed by silent punctuation without inventing words",()=>{
    const p=new SubtitlePresentation();p.set("Well, detective.",0);p.reveal("Well",.1);
    expect(p.diagnostics().timing).toBe("aligned");expect(p.text()).toBe("Well");
    p.reveal("Well, detective.",1);expect(p.advance(3)).toBe("");
  });
});
