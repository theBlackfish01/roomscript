import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {crateSurfaceLayout,recordedCrateSurfaceLayout} from "../../../Assets/Scripts/Content/CrateSurfaceLayout";
describe("crate on the recorded real tabletop",()=>{
  it("matches independent authored base bounds and puts its actual bottom on the measured plane",()=>{
    const scene=JSON.parse(readFileSync(new URL("../../../.virtual-scene.json",import.meta.url),"utf8"));
    const base=scene.sceneObjects.find((o:any)=>o.name==="CrateBase"),mesh=base.components.find((c:any)=>c.name==="RoomscriptPropMesh");
    const actualBottom=base.transform.position[1]-mesh.properties.height.value/2;
    const crate=scene.sceneObjects.find((o:any)=>o.name==="RoomscriptCrate"),parent=scene.sceneObjects.find((o:any)=>o.id===crate.parentId);
    expect(parent.name).toBe("Roomscript");expect(parent.transform.position).toEqual([0,0,0]);expect(parent.transform.rotation).toEqual([0,0,0]);expect(parent.transform.scale).toEqual([1,1,1]);
    const layout=recordedCrateSurfaceLayout();expect(actualBottom).toBe(-6);expect(crate.transform.scale).toEqual([.75,.75,.75]);
    expect(layout.rootWorld[1]+actualBottom*crate.transform.scale[1]).toBeCloseTo(-144.68350219726562,5);
    expect(layout.rootWorld[0]).toBeCloseTo(10.701000213623047);expect(layout.rootWorld[2]).toBeCloseTo(-314.01275634765625+34); // Run 9: front edge of the table
  });
  it("keeps entire opening rectangles above support, with a large physical pull target",()=>{
    const l=recordedCrateSurfaceLayout(),card=l.rootWorld[1]+(l.openingCard.position[1]-l.openingCard.height/2)*l.scale,tab=l.rootWorld[1]+(l.pullTab.position[1]-l.pullTab.height/2)*l.scale;
    expect(card-l.surfaceWorld[1]).toBeCloseTo(16.5);expect(tab-l.surfaceWorld[1]).toBeCloseTo(6.75);
    const angularHeight=2*Math.atan((l.pullTab.buttonHeight*l.scale/2)/150)*180/Math.PI;expect(angularHeight).toBeGreaterThan(2.5);
    // Old tab center -17 with height8 would intersect the tabletop after the crate itself is grounded.
    expect(l.rootWorld[1]+(-17-4)*l.scale).toBeLessThan(l.surfaceWorld[1]);
  });
  it("preserves support contact under a legitimate size change and rejects invalid geometry",()=>{
    for(const scale of [.5,1,1.25]){const l=crateSurfaceLayout([12,40,-20],scale);expect(l.rootWorld[1]-6*scale).toBe(40);}
    expect(()=>crateSurfaceLayout([0,NaN,0])).toThrow();expect(()=>crateSurfaceLayout([1,2,3],0)).toThrow();
  });
});
