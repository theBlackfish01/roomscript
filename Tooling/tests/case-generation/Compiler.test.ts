import {describe,expect,it,vi} from "vitest";
import {compileCase} from "../../../Assets/Scripts/Engine/case/CaseCompiler";
import {culpritForSeed,simulateCase} from "../../../Assets/Scripts/Engine/case/Simulator";
import {getAuthoredPitch,getPitch,PITCH_LIBRARY} from "../../../Assets/Scripts/Content/PitchLibrary";
import {allRoomFixtures,getRoomFixture} from "../../../Assets/Scripts/Engine/room/RoomFixtures";
import {validatePitch} from "../../../Assets/Scripts/Engine/case/PitchValidator";
import {applyPitchRepair,planRepairs} from "../../../Assets/Scripts/Engine/case/RepairPlanner";
import {verifyCase} from "../../../Assets/Scripts/Engine/case/Solver";
import * as Dealer from "../../../Assets/Scripts/Engine/case/Dealer";

describe("deterministic case generation",()=>{
  it("compiles all six authored pitches on all five physical fixtures",()=>{
    expect(PITCH_LIBRARY).toHaveLength(6);
    for(let index=0;index<6;index++)for(const room of allRoomFixtures()) {
      const result=compileCase(index,room,getAuthoredPitch(index,culpritForSeed(index)));
      expect(result.ok,JSON.stringify(result)).toBe(true);
      expect(result.graph!.solver!.issues).toEqual([]);
      expect(result.timeline).toHaveLength(60);
    }
  },60000);
  it("repeats a seed exactly without mutating room or pitch",()=>{
    const room=getRoomFixture("office"),pitch=getPitch(1041),before=JSON.stringify({room,pitch});
    expect(compileCase(1041,room,pitch)).toEqual(compileCase(1041,room,pitch));
    expect(JSON.stringify({room,pitch})).toBe(before);
  });
  it("varies physical timelines, culprit, murder time and weapon across seeds",()=>{
    const results=Array.from({length:24},(_,seed)=>compileCase(seed,getRoomFixture("wadood-room"),getPitch(seed)));
    expect(results.every(r=>r.ok)).toBe(true);
    expect(new Set(results.map(r=>r.graph!.envelope.who)).size).toBe(4);
    expect(new Set(results.map(r=>r.graph!.envelope.what)).size).toBeGreaterThan(1);
    expect(new Set(results.map(r=>r.graph!.murderSlot)).size).toBeGreaterThan(1);
    expect(new Set(results.map(r=>JSON.stringify(r.timeline))).size).toBe(24);
  },60000);
  it("physically binds every evidence witness to the zone of its observation",()=>{
    const result=compileCase(17,getRoomFixture("minimal"),getPitch(17));expect(result.ok).toBe(true);
    const graph=result.graph!;
    for(const evidence of graph.evidence.filter(e=>!e.latent)) {
      expect(evidence.costMinutes).toBe(10);
      const fact=graph.facts.find(f=>f.id===evidence.proves[0])!;
      const holder=graph.room.objects.find(o=>o.id===evidence.holder)!;expect(holder).toBeDefined();
      if(fact.pred==="at"||fact.pred==="in")expect(holder.zone).toBe(fact.args.zone);
    }
    expect(graph.room.objects.some(o=>o.id.startsWith("REC_")&&o.virtual&&o.origin==="substitution")).toBe(true);
    expect(verifyCase(graph).ok).toBe(true);
  });
  it("places touched weapons with the touching actor at the same simulated time",()=>{
    const sim=simulateCase(41,getRoomFixture("dorm"),getPitch(41));
    for(const entry of sim.timeline)for(const obj of entry.touched) {
      const position=sim.graph.facts.find(f=>f.pred==="in"&&f.args.obj===obj&&f.slot===entry.slot)!;
      expect(position.args.zone).toBe(entry.zone);
    }
  });
  it("records a carrier whenever a weapon changes historical zones",()=>{
    for(let seed=0;seed<30;seed++) {
      const sim=simulateCase(seed,getRoomFixture("office"),getPitch(seed));
      for(const object of sim.graph.weapons)for(let slot=1;slot<12;slot++) {
        const previous=sim.graph.facts.find(f=>f.id===`F_IN_${object}_${slot-1}`)!;
        const next=sim.graph.facts.find(f=>f.id===`F_IN_${object}_${slot}`)!;
        if(previous.args.zone!==next.args.zone)expect(sim.timeline.some(e=>e.slot===slot&&e.zone===next.args.zone&&e.touched.includes(object))).toBe(true);
      }
    }
  });
  it("refuses model truth fields before simulation",()=>{
    const result=compileCase(2,getRoomFixture("office"),{...getPitch(2),envelope:{who:"S1",where:"Z1",what:"O1"}});
    expect(result.ok).toBe(false);expect(result.attempts).toBe(0);expect(result.errors[0].code).toBe("UNKNOWN_FIELD");
  });
  it("caps genuine solver failures at fifty samples",()=>{
    const original=Dealer.dealEvidence;
    const spy=vi.spyOn(Dealer,"dealEvidence").mockImplementation(sim=>{original(sim);for(const evidence of sim.graph.evidence){evidence.latent=true;evidence.beat="unavailable";}});
    try {const result=compileCase(8,getRoomFixture("dorm"),getPitch(8));expect(result.ok).toBe(false);expect(result.attempts).toBe(50);expect(result.trace.filter(t=>t.stage==="solver")).toHaveLength(50);}
    finally{spy.mockRestore();}
  },60000);
  it("rejects invalid attempt caps and malformed rooms without a retry storm",()=>{
    expect(compileCase(1,getRoomFixture("office"),getPitch(1),{maxAttempts:51}).errors[0].code).toBe("ATTEMPT_LIMIT");
    const room=getRoomFixture("office");room.objects[0].zone="unknown";
    const result=compileCase(1,room,getPitch(1));expect(result.ok).toBe(false);expect(result.attempts).toBe(1);
  });
});

describe("pitch admission and restricted repair",()=>{
  it("rejects duplicate tells, voices, names, invalid motives and missing secrets",()=>{
    const pitch=getPitch(1),culprit=culpritForSeed(1);pitch.suspects[1].tell=pitch.suspects[0].tell;pitch.suspects[1].voice=pitch.suspects[0].voice;pitch.suspects[1].name=pitch.victim.name;
    const innocent=pitch.suspects.find(s=>s.slot!==culprit)!;innocent.motive.strength=3;innocent.secret.type="none";
    expect(validatePitch(pitch,culprit).errors.map(e=>e.code)).toEqual(expect.arrayContaining(["DUPLICATE_TELL","DUPLICATE_VOICE","DUPLICATE_NAME","MOTIVE_STRENGTH","SECRET_REQUIRED"]));
  });
  it("rejects unknown role slots, brands and asymmetric relationships",()=>{
    const pitch=getPitch(1);pitch.theme="The Google affair";expect(validatePitch(pitch,culpritForSeed(1)).errors.some(e=>e.code==="CONTENT")).toBe(true);
    pitch.theme="The Letter";pitch.suspects[0].secret.roleSlot="WEAPON_LASER";expect(validatePitch(pitch,culpritForSeed(1)).errors.some(e=>e.code==="ENUM")).toBe(true);
    pitch.suspects[0].secret.roleSlot="CONTAINER_BOX";pitch.suspects[1].relations=[];expect(validatePitch(pitch,culpritForSeed(1)).errors.some(e=>e.code==="RELATION_ASYMMETRIC")).toBe(true);
  });
  it("allows only listed repair paths and values for at most two rounds",()=>{
    const pitch=getPitch(7),culprit=culpritForSeed(7);pitch.suspects[1].tell=pitch.suspects[0].tell;
    const errors=validatePitch(pitch,culprit).errors,plan=planRepairs(errors);const error=errors.find(e=>e.code==="DUPLICATE_TELL")!;
    const patch=[{op:"replace",path:error.path,value:error.allowed![0]}];
    expect(applyPitchRepair(pitch,patch,plan,culprit,1).ok).toBe(true);
    expect(applyPitchRepair(pitch,patch,plan,culprit,3).ok).toBe(false);
    expect(applyPitchRepair(pitch,[{op:"replace",path:"/theme",value:"Changed"}],plan,culprit,1).ok).toBe(false);
    expect(applyPitchRepair(pitch,[{op:"replace",path:error.path,value:"invalid"}],plan,culprit,1).ok).toBe(false);
    expect(applyPitchRepair(pitch,[{op:"replace",path:"/__proto__/polluted",value:true}],plan,culprit,1).ok).toBe(false);
  });
  it("can add a missing schema field and remove an untrusted extra field only at error paths",()=>{
    const pitch=getPitch(6) as unknown as Record<string,unknown>;delete pitch.theme;pitch.truth="model-owned";
    const culprit=culpritForSeed(6),plan=planRepairs(validatePitch(pitch,culprit).errors);
    const repaired=applyPitchRepair(pitch,[{op:"add",path:"/theme",value:"The Revised Letter"},{op:"remove",path:"/truth"}],plan,culprit,1);
    expect(repaired.ok).toBe(true);expect(repaired.pitch).not.toHaveProperty("truth");
  });
});
