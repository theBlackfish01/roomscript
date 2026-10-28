import {Fact,Id,Statement} from "../core/Types";
import {CasePitch} from "./CasePitchSchema";
import {Simulation} from "./Simulator";
import {evidenceForFact} from "./Dealer";
export function buildStatements(sim:Simulation,pitch:CasePitch):void {
  const g=sim.graph;const culprit=g.envelope.who;const murder=g.murderSlot;
  const statements=g.statements;
  const fact=(id:Id)=>g.facts.find(f=>f.id===id)!;
  const proofs=(id:Id)=>[[evidenceForFact(id,0)],[evidenceForFact(id,1)]];
  const truth=(speaker:Id,topic:string,id:Id,layer=0):Statement=>({id:`C_${speaker}_${topic}_${layer}`,speaker,topic,asserts:id,stance:"truth",layer,canonical:fact(id).canonical||id,entities:fact(id).entities||[],breakers:[],costMinutes:15});
  const falseFact=(source:Fact,id:string,args:Fact["args"],canonical:string):Fact=>{const f={...source,id,args,truth:false,canonical};g.facts.push(f);return f;};
  for(const s of pitch.suspects) {
    const whereabouts=truth(s.slot,"whereabouts",`F_AT_${s.slot}_${murder}`);
    if(s.slot===culprit) {
      const away=g.room.zones.find(z=>z.id!==g.envelope.where)!;
      const lie=falseFact(fact(`F_AT_${s.slot}_${murder}`),`F_COVER_${s.slot}`,{who:s.slot,zone:away.id},`${s.name} was in ${away.clueName} at ${g.slots[murder]}.`);
      const denial:Fact={id:"F_DENIED_TOUCH",pred:"not_touched",args:{who:s.slot,obj:g.envelope.what},slot:murder,truth:false,canonical:`${s.name} did not handle the ${g.room.objects.find(o=>o.id===g.envelope.what)!.label} at ${g.slots[murder]}.`,entities:[s.slot,g.envelope.what]};g.facts.push(denial);
      const c0={...whereabouts,asserts:lie.id,stance:"cover" as const,canonical:lie.canonical!,entities:[s.slot,away.id],breakers:proofs(whereabouts.asserts as string),onBreak:`C_${s.slot}_whereabouts_1`};
      const c1={...whereabouts,id:`C_${s.slot}_whereabouts_1`,layer:1,asserts:[whereabouts.asserts as string,denial.id],stance:"cover" as const,canonical:whereabouts.canonical+" "+denial.canonical,entities:[s.slot,g.envelope.where,g.envelope.what],breakers:proofs("F_MURDER_TOUCH"),onBreak:`C_${s.slot}_whereabouts_2`};
      const c2={...whereabouts,id:`C_${s.slot}_whereabouts_2`,layer:2,asserts:[whereabouts.asserts as string,"F_MURDER_TOUCH"],canonical:whereabouts.canonical+" "+fact("F_MURDER_TOUCH").canonical,entities:[s.slot,g.envelope.where,g.envelope.what]};
      statements.push(c0,c1,c2);
    } else statements.push(whereabouts);
    statements.push(truth(s.slot,"baseline_truth",`F_MOTIVE_${s.slot}`));
    for(const other of g.cast.suspects.filter(p=>p.id!==culprit&&p.id!==s.slot))statements.push(truth(s.slot,"about_"+other.id,`F_AT_${other.id}_${murder}`));
    // These are recorded observations relayed by a suspect; object roots remain the independent primary routes.
    statements.push(truth(s.slot,"victim",`F_AT_V_${murder}`));
    for(const weapon of g.weapons.filter(id=>id!==g.envelope.what))statements.push(truth(s.slot,"weapon_"+weapon,`F_IN_${weapon}_${murder}`));
    statements.push(truth(s.slot,"motive",`F_MOTIVE_${s.slot}`));
    for(const [topic,source] of [["secret",sim.secretFacts[s.slot]],["baseline_lie",sim.baselineFacts[s.slot]]] as [string,string][]) {
      const actual=fact(source);const denial=falseFact(actual,source+"_DENIAL",{...actual.args,value:"denied"},`${s.name} denies ${topic==="secret"?"the concealed "+s.secret.type:"borrowing the item"}.`);
      const original=truth(s.slot,topic,source);
      const replacement={...original,id:original.id+"_REPLY",replacementFor:original.id};
      statements.push({...original,asserts:denial.id,canonical:denial.canonical!,stance:"cover",breakers:proofs(source),onBreak:replacement.id},replacement);
    }
  }
  g.requiredDeductions=[{id:"D_OPPORTUNITY",type:"opportunity",subject:culprit,supports:proofs(`F_AT_${culprit}_${murder}`),canonical:"The suspect occupied the murder zone."},{id:"D_MEANS",type:"means",subject:culprit,supports:proofs("F_MURDER_TOUCH"),canonical:"The suspect handled the murder weapon."},{id:"D_ALIBI",type:"alibi_broken",subject:culprit,supports:proofs(`F_AT_${culprit}_${murder}`),canonical:"The initial whereabouts account was contradicted."},{id:"D_MOTIVE",type:"motive",subject:culprit,supports:proofs(`F_MOTIVE_${culprit}`),canonical:fact(`F_MOTIVE_${culprit}`).canonical!}];
}
