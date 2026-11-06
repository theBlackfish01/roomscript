import {it,expect} from "vitest";
import {chooseBoardWall,WallHit,V3} from "../../../Assets/Scripts/Engine/perf/WallBoard";

/** Deterministic jitter for synthetic samples. */
function lcg(seed:number){let s=seed>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296-.5;};}
/** Hits along a vertical wall: points from a to b (x,z), outward normal n (x,z), eye height y. */
function wall(a:[number,number],b:[number,number],n:[number,number],seed:number,step=10,y=-40):WallHit[] {
  const r=lcg(seed),len=Math.hypot(b[0]-a[0],b[1]-a[1]),out:WallHit[]=[];
  for(let t=0;t<=len;t+=step){const f=t/len,off=r()*3,ang=r()*.08;
    out.push({position:[a[0]+(b[0]-a[0])*f+n[0]*off,y+r()*4,a[1]+(b[1]-a[1])*f+n[1]*off] as V3,normal:[n[0]*Math.cos(ang)-n[1]*Math.sin(ang),r()*.1,n[0]*Math.sin(ang)+n[1]*Math.cos(ang)] as V3});}
  return out;
}
function noise(seed:number,count:number):WallHit[] {
  const r=lcg(seed),out:WallHit[]=[];
  for(let i=0;i<count;i++)out.push({position:[r()*600,r()*200-100,r()*600-250] as V3,normal:i%3===0?[0,1,0]:[r(),r()*.3,r()] as V3});
  return out;
}
const player:V3=[0,-10,-100];
const back=wall([-150,-400],[150,-400],[0,1],1),windowWall=wall([205,-120],[205,-360],[-1,0],2);

it("picks the widest qualifying wall facing the player, centred at board height on the plane",()=>{
  const choice=chooseBoardWall([...windowWall,...noise(3,40),...back],player)!;
  expect(choice).not.toBeNull();expect(choice.normal[2]).toBeGreaterThan(.98);expect(choice.normal[1]).toBe(0);
  expect(choice.width).toBeGreaterThan(280);expect(Math.abs(choice.center[2]+400)).toBeLessThan(3);expect(Math.abs(choice.center[0])).toBeLessThan(10);
  expect(choice.center[1]).toBe(-176+140);
  expect(chooseBoardWall([...windowWall,...noise(3,40),...back],player)).toEqual(choice);
  expect(chooseBoardWall(back,player,-150)!.center[1]).toBe(-10);
});
it("falls back to the other wall when the widest is out of range, and returns null when none qualifies",()=>{
  const far=wall([-200,-600],[200,-600],[0,1],4);
  const choice=chooseBoardWall([...far,...windowWall],player)!;expect(choice.normal[0]).toBeLessThan(-.98);expect(Math.abs(choice.center[0]-205)).toBeLessThan(3);
  expect(chooseBoardWall(far,player)).toBeNull();
  expect(chooseBoardWall(noise(5,60),player)).toBeNull();expect(chooseBoardWall([],player)).toBeNull();
});
it("rejects a too-narrow wall and a too-close wall",()=>{
  const narrow=wall([-150,-200],[-150,-300],[1,0],6);
  expect(chooseBoardWall(narrow,player)).toBeNull();
  const close=wall([-200,-180],[200,-180],[0,1],7);
  expect(chooseBoardWall(close,player)).toBeNull();
  expect(chooseBoardWall([...close,...narrow,...back],player)!.center[2]).toBeCloseTo(-400,-1);
});
it("prefers a wall whose measured normal faces the player over a wider one facing away, and keeps the board inside the wall",()=>{
  const away=wall([-250,-350],[250,-350],[0,-1],8);
  const choice=chooseBoardWall([...away,...windowWall],player)!;expect(Math.abs(choice.center[0]-205)).toBeLessThan(3);
  const turned=chooseBoardWall(away,player)!;expect(turned.normal[2]).toBeGreaterThan(.98);
  const offCentre=chooseBoardWall([...wall([-150,-400],[150,-400],[0,1],9),...wall([140,-400],[150,-400],[0,1],10,1)],player)!;
  expect(offCentre.center[0]).toBeLessThanOrEqual(150-60+1);expect(offCentre.center[0]).toBeGreaterThanOrEqual(-150+60-1);
});
