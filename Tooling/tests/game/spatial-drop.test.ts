import {describe,it,expect} from "vitest";
import {spatialDrop} from "../../../Assets/Scripts/Engine/game/SpatialDrop";
describe("distance-independent drops",()=>{
  const target={id:"lamp",position:[0,0,-240] as [number,number,number],radius:24};
  it("accepts a near-hand card aligned with an object 2.4m away",()=>expect(spatialDrop([0,0,0],[0,0,-60],[target])).toBe("lamp"));
  it("does not require alignment for a direct placement",()=>expect(spatialDrop([100,0,0],[20,0,-240],[target])).toBe("lamp"));
  it("rejects behind-camera, off-angle and degenerate releases",()=>{expect(spatialDrop([0,0,0],[0,0,60],[target])).toBeNull();expect(spatialDrop([0,0,0],[10,0,-60],[target])).toBeNull();expect(spatialDrop([0,0,0],[0,0,0],[target])).toBeNull();});
  it("requires an unambiguous target rather than picking through another marker",()=>expect(spatialDrop([0,0,0],[0,0,-60],[target,{...target,id:"cup",position:[1,0,-250]}])).toBeNull());
});
