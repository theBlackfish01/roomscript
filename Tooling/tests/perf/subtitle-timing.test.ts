import {describe,it,expect} from "vitest";
import {subtitleCues} from "../../../Assets/Scripts/Engine/perf/SubtitleTiming";
const align=(text:string)=>({characters:[...text],starts:[...text].map((_,i)=>i*.1),ends:[...text].map((_,i)=>(i+1)*.1)});
describe("admitted subtitle timing",()=>{
  it("reveals whole words at their first aligned character, retaining punctuation",()=>{
    expect(subtitleCues("I saw Vale.",align("I saw Vale."))).toEqual([{at:0,text:"I"},{at:.2,text:"I saw"},{at:.6000000000000001,text:"I saw Vale."}]);
  });
  it("never displays mismatched provider text",()=>{expect(subtitleCues("I saw Vale.",align("I saw Pike."))).toEqual([]);});
  it("rejects malformed or reversed times",()=>{const a=align("Yes indeed.");a.starts[2]=-1;expect(subtitleCues("Yes indeed.",a)).toEqual([]);a.starts[2]=NaN;expect(subtitleCues("Yes indeed.",a)).toEqual([]);});
  it("supports missing alignment without inventing timing",()=>{expect(subtitleCues("Yes.",undefined)).toEqual([]);});
});
