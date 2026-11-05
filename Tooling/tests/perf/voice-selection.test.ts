import {describe,it,expect} from "vitest";
import {VoiceIndex} from "../../../Assets/Scripts/Engine/perf/VoiceSelection";
describe("bundle voice selection",()=>{
  const records=["steady","rattled","broken","tell"].map((take,index)=>({index,speaker:"S2",text:"Exact answer.",take}));
  const index=new VoiceIndex(records);
  it("selects the requested mood but never a tell without engine permission",()=>{
    expect(index.find("S2","Exact answer.","rattled")?.take).toBe("rattled");
    expect(index.find("S2","Exact answer.","tell")?.take).toBe("steady");
    expect(index.find("S2","Exact answer.","broken",true)?.take).toBe("tell");
    expect(new VoiceIndex([records[3]]).find("S2","Exact answer.","steady")).toBeUndefined();
  });
  it("never substitutes another speaker or different text",()=>{
    expect(index.find("S1","Exact answer.","steady")).toBeUndefined();
    expect(index.find("S2","Different answer.","steady")).toBeUndefined();
  });
});
