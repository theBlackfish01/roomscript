import {it,expect} from "vitest";
import {tellWindow} from "../../../Assets/Scripts/Engine/game/TellWindow";
it("preserves the 300ms teaching delay and a full 900ms display",()=>{
  expect(tellWindow(.299,.3,null,.9)).toEqual({started:false,active:false,until:null});
  const first=tellWindow(.3,.3,null,.9);expect(first).toEqual({started:true,active:true,until:1.2});
  expect(tellWindow(.6,.3,first.until,.9).started).toBe(false);expect(tellWindow(1.2,.3,first.until,.9).active).toBe(false);
});
it("does not silently discard a tell when the first render frame is several seconds late",()=>{
  const late=tellWindow(8,.3,null,.9);expect(late).toEqual({started:true,active:true,until:8.9});
  expect(tellWindow(8.5,.3,late.until,.9)).toEqual({started:false,active:true,until:8.9});
  expect(tellWindow(9,.3,late.until,.9).active).toBe(false);
});
