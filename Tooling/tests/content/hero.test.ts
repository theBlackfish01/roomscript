import {describe,expect,it} from "vitest";
import {createHeroCase,heroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createHeroLineBank,heroFinalConfession,heroLineBank,selectHeroLine} from "../../../Assets/Scripts/Content/HeroLineBank";
import {verifyCase} from "../../../Assets/Scripts/Engine/case/Solver";

describe("HARLOW-1041 authored content",()=>{
  it("passes all eight solver acceptance checks",()=>{
    const report=verifyCase(createHeroCase());
    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.hypotheses).toEqual([heroCase.envelope]);
    expect(Object.values(report.routesPerElimination).every(count=>count>=2)).toBe(true);
    expect(report.minRouteMinutes).toBeLessThanOrEqual(heroCase.clockMinutes*0.6);
  });
  it("has the required closed-world cast, time window and physical anchors",()=>{
    expect(heroCase.cast.victim.name).toBe("Edmund Harlow");
    expect(heroCase.envelope).toEqual({who:"S2",where:"Z1",what:"O1"});
    expect(heroCase.room.zones).toHaveLength(5);
    expect(heroCase.weapons).toHaveLength(5);
    expect(heroCase.cast.suspects).toHaveLength(4);
    expect(heroCase.slots).toHaveLength(12);
    expect(heroCase.slots[heroCase.murderSlot]).toBe("22:30");
    expect(heroCase.bodyFound).toBe("22:41");
    expect(heroCase.room.objects.every(o=>o.pos.length===3&&o.pos.every(Number.isFinite))).toBe(true);
    expect(heroCase.room.objects.filter(o=>o.virtual).every(o=>o.origin==="substitution")).toBe(true);
  });
  it("has no dangling truth, evidence, statement, deduction or break references",()=>{
    const facts=new Set(heroCase.facts.map(f=>f.id));
    const refs=new Set([...heroCase.evidence,...heroCase.statements].map(r=>r.id));
    expect(facts.size).toBe(heroCase.facts.length);
    expect(refs.size).toBe(heroCase.evidence.length+heroCase.statements.length);
    for(const e of heroCase.evidence) for(const fact of e.proves) expect(facts.has(fact),e.id+" -> "+fact).toBe(true);
    for(const s of heroCase.statements) {
      for(const fact of Array.isArray(s.asserts)?s.asserts:[s.asserts]) expect(facts.has(fact)).toBe(true);
      for(const route of s.breakers) for(const ref of route) expect(refs.has(ref),s.id+" -> "+ref).toBe(true);
      if(s.onBreak) expect(heroCase.statements.some(t=>t.id===s.onBreak&&t.speaker===s.speaker&&t.topic===s.topic)).toBe(true);
    }
    for(const d of heroCase.requiredDeductions) for(const route of d.supports) for(const ref of route) expect(refs.has(ref)).toBe(true);
  });
  it("makes all object memories truthful and all cover accounts genuinely false",()=>{
    const truth=new Map(heroCase.facts.map(f=>[f.id,f.truth]));
    for(const e of heroCase.evidence) expect(e.proves.every(f=>truth.get(f)===true),e.id).toBe(true);
    for(const s of heroCase.statements) {
      const values=(Array.isArray(s.asserts)?s.asserts:[s.asserts]).map(f=>truth.get(f));
      expect(values.includes(false),s.id).toBe(s.stance==="cover");
    }
  });
  it("keeps harmless baseline corrections separate from murder-layer progression",()=>{
    for(const suspect of heroCase.cast.suspects) {
      const lie=heroCase.statements.find(s=>s.speaker===suspect.id&&s.topic===suspect.baseline.lieTopic&&!s.replacementFor)!;
      const corrected=heroCase.statements.find(s=>s.id===lie.onBreak)!;
      expect(lie.stance).toBe("cover");
      expect(corrected.replacementFor).toBe(lie.id);
      expect(corrected.layer).toBe(lie.layer);
      expect(corrected.stance).toBe("truth");
      expect(heroCase.statements.find(s=>s.speaker===suspect.id&&s.topic===suspect.baseline.truthTopic)!.stance).toBe("truth");
    }
    const cover0=heroCase.statements.find(s=>s.id==="C_VALE_ALIBI_0")!;
    const cover1=heroCase.statements.find(s=>s.id===cover0.onBreak)!;
    const truth=heroCase.statements.find(s=>s.id===cover1.onBreak)!;
    expect([cover0.layer,cover1.layer,truth.layer]).toEqual([0,1,2]);
    expect(truth.canonical.toLowerCase()).not.toContain("killed");
  });
  it("provides independent physical and witness sources for each innocent and wrong weapon",()=>{
    for(const id of ["S1","S3","S4"]) {
      const object=heroCase.evidence.find(e=>e.id==="E_"+id+"_ALIBI")!;
      const witness=heroCase.statements.find(s=>s.id==="C_SEES_"+id)!;
      expect(object.holder).not.toBe(witness.speaker);
      expect(witness.speaker).not.toBe(id);
    }
    for(const id of ["O2","O3","O4","O5"]) {
      expect(heroCase.evidence.find(e=>e.id==="E_"+id+"_LOCATION")!.holder).toBe(id);
      expect(heroCase.statements.find(s=>s.id==="C_SEES_"+id)!.stance).toBe("truth");
    }
    expect(heroCase.evidence.find(e=>e.id==="E_VICTIM_LAMP")!.holder).not.toBe(heroCase.evidence.find(e=>e.id==="E_VICTIM_MUG")!.holder);
  });
  it("keeps late beats monotonic and all early clues immediately inspectable",()=>{
    const reveals=heroCase.beats.flatMap(b=>b.reveals);
    for(const e of heroCase.evidence) {
      if(e.latent) expect(reveals).toContain(e.id);
      else expect(e.costMinutes).toBe(10);
    }
    expect(heroCase.beats.map(b=>b.minute)).toEqual([45,75,105,120]);
    expect(heroCase.beats.every(b=>b.guaranteed&&b.validated)).toBe(true);
  });
  it("returns isolated mutable cases and line banks",()=>{
    const one=createHeroCase(); const two=createHeroCase();
    one.facts[0].truth=false;one.room.objects[0].pos[0]=999;
    expect(two.facts[0].truth).toBe(true);
    expect(two.room.objects[0].pos[0]).not.toBe(999);
    const bank=createHeroLineBank();bank[0].answer.line="changed";
    expect(heroLineBank[0].answer.line).not.toBe("changed");
  });
});

describe("bounded authored fallback performances",()=>{
  it("covers every account and pressure ref without blank or oversized output",()=>{
    for(const s of heroCase.statements) {
      for(const mode of ["answer","press","broken"] as const) {
        const line=selectHeroLine(s.speaker,s.topic,s.layer,mode,s.id);
        expect(line,s.id+" "+mode).toBeDefined();
        expect(line!.answer.cites).toEqual([(mode==="press"?"p:":"a:")+s.id]);
      }
    }
    for(const entry of heroLineBank) {
      expect(entry.answer.line.length).toBeGreaterThan(0);
      expect(entry.answer.line.length).toBeLessThanOrEqual(220);
      expect(entry.answer.cites).toHaveLength(1);
    }
  });
  it("cannot leak a replacement baseline or final confession through ordinary selection",()=>{
    expect(selectHeroLine("S2","baseline:brooch",0,"answer")).toBeUndefined();
    expect(selectHeroLine("S2","baseline:brooch",0,"answer","C_S2_BASELINE_LIE")!.answer.line).toBe("My brooch is fastened.");
    expect(selectHeroLine("S2","baseline:brooch",0,"answer","C_S2_BASELINE_TRUE")!.answer.line).toBe("My brooch clasp is open.");
    expect(selectHeroLine("S2","where@22:30",0,"answer","C_VALE_ALIBI_2")).toBeUndefined();
    expect(selectHeroLine("S2","where@22:30",2,"confession")).toBeUndefined();
    expect(heroFinalConfession.answer.line).toContain("I killed Edmund Harlow in the Study with the cable");
  });
  it("keeps neutral modes free of case entities and replaces superseded main covers",()=>{
    for(const e of heroLineBank.filter(e=>["deflect","filler","lawyered"].includes(e.mode))) {
      expect(e.answer.cites).toEqual(["none"]);
      expect(e.answer.topic).toBe("unclear");
    }
    expect(selectHeroLine("S2","where@22:30",1,"answer","C_VALE_ALIBI_0")).toBeUndefined();
    expect(selectHeroLine("S2","baseline:name",2,"answer","C_S2_NAME")).toBeDefined();
  });
});
