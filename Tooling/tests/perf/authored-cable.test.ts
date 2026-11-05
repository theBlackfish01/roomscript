import {describe,it,expect} from "vitest";
import {authoredCableGeometry,presetCableObject} from "../../../Assets/Scripts/Content/AuthoredCableGeometry";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {applyPresetEveningRoom,PRESET_CONSOLE_TOP} from "../../../Assets/Scripts/Content/PresetEveningRoom";
import {EVENING_ROOM_FLOOR_Y} from "../../../Assets/Scripts/Content/EveningRoomScan";
describe("authored tabletop cable mesh",()=>{
  it("selects the actual hero cable by type and never mistakes poison for cord",()=>{
    const graph=applyPresetEveningRoom(createHeroCase()),before=JSON.stringify(graph),cable=presetCableObject(graph)!;
    expect(cable.id).toBe("O1");expect(cable.type).toBe("cord");expect(graph.room.objects.find(o=>o.id==="O4")!.type).toBe("poison");
    expect(cable.pos).toEqual([PRESET_CONSOLE_TOP[0]-12,PRESET_CONSOLE_TOP[1],PRESET_CONSOLE_TOP[2]]);
    expect(cable.pos[1]+EVENING_ROOM_FLOOR_Y).toBeCloseTo(-141.29925537109375,6);
    expect(JSON.stringify(graph)).toBe(before);
    const renamed=JSON.parse(before);renamed.room.objects.find((o:any)=>o.type==="cord").id="CORD_DIFFERENT_ID";
    expect(presetCableObject(renamed)!.id).toBe("CORD_DIFFERENT_ID");
    renamed.room.objects=renamed.room.objects.filter((o:any)=>o.type!=="cord");expect(presetCableObject(renamed)).toBeUndefined();
  });
  it("stays above the actual console support with a compact footprint between neighboring props",()=>{
    const geometry=authoredCableGeometry(),v=[...geometry.cord.vertices,...geometry.connectors.vertices],points=Array.from({length:v.length/12},(_,i)=>v.slice(i*12,i*12+3));
    expect(Math.min(...points.map(p=>p[1]))).toBeGreaterThanOrEqual(.0999);expect(Math.max(...points.map(p=>p[1]))).toBeLessThan(1.5);
    const graph=applyPresetEveningRoom(createHeroCase()),cable=presetCableObject(graph)!;
    const world=points.map(p=>p.map((n,i)=>n+cable.pos[i]+(i===1?EVENING_ROOM_FLOOR_Y:0)));
    expect(Math.min(...world.map(p=>p[1]))).toBeGreaterThan(PRESET_CONSOLE_TOP[1]+EVENING_ROOM_FLOOR_Y);
    // The compact coil remains between the clock centered at -30 and mug centered at 20.
    expect(Math.min(...world.map(p=>p[0]))).toBeGreaterThan(-12);
    expect(Math.max(...world.map(p=>p[0]))).toBeLessThan(7);
    expect(Math.max(...world.map(p=>Math.abs(p[2]-PRESET_CONSOLE_TOP[2])))).toBeLessThan(9);
    expect(Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0]))).toBeLessThan(21);
    expect(Math.max(...points.map(p=>p[2]))-Math.min(...points.map(p=>p[2]))).toBeLessThan(19);
  });
  it("builds finite unit normals, valid triangle indices and a bounded two-draw-call mesh",()=>{
    const g=authoredCableGeometry();let triangles=0;
    for(const mesh of [g.cord,g.connectors]){expect(mesh.vertices.every(Number.isFinite)).toBe(true);expect(mesh.vertices.length%12).toBe(0);expect(mesh.indices.every(i=>Number.isInteger(i)&&i>=0&&i<mesh.vertices.length/12)).toBe(true);
      for(let i=0;i<mesh.vertices.length;i+=12)expect(Math.hypot(...mesh.vertices.slice(i+3,i+6))).toBeCloseTo(1,6);triangles+=mesh.indices.length/3;}
    expect(triangles).toBeLessThan(1300);expect(g.label).toContain("Authored");
  });
  it("has outward-facing, nondegenerate side triangles along the smooth coil",()=>{
    const m=authoredCableGeometry().cord;
    // Interior smooth rings exclude intentional connector joins and end caps.
    for(let face=3*8*2;face<60*8*2;face++){
      const ids=m.indices.slice(face*3,face*3+3),p=ids.map(i=>m.vertices.slice(i*12,i*12+3)),a=p[1].map((x,i)=>x-p[0][i]),b=p[2].map((x,i)=>x-p[0][i]);
      const cross=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],normal=m.vertices.slice(ids[0]*12+3,ids[0]*12+6);
      expect(cross.reduce((sum,x,i)=>sum+x*normal[i],0)).toBeGreaterThan(0);
    }
  });
});
