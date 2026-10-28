import {CasePitch} from "./CasePitchSchema";
import {Simulation} from "./Simulator";
export function planBeats(sim:Simulation,pitch:CasePitch):void {
  const g=sim.graph;
  pitch.latentEvidence.forEach((item,i)=>{
    const subject=item.about==="V"?g.envelope.who:item.about;
    const id=item.supports==="motive"?`F_MOTIVE_${subject}`:item.supports==="secret"?sim.secretFacts[subject]:`F_AT_${subject}_${g.murderSlot}`;
    const fact=g.facts.find(f=>f.id===id)!;const source=g.evidence.find(e=>e.proves.includes(id))!;
    const beat="B_LATENT_"+i;const evidence="E_LATENT_"+i;
    g.evidence.push({id:evidence,holder:source.holder,kind:item.type==="letter"?"letter":item.type,proves:[id],canonical:fact.canonical||id,entities:fact.entities||[],latent:true,beat,costMinutes:0});
    g.beats.push({id:beat,type:item.type==="voicemail"?"voicemail":"latent_letter",reveals:[evidence],minute:30+i*20,guaranteed:true,validated:true,canonical:"A new record confirms: "+fact.canonical});
  });
  g.beats.push({id:"B_FLIGHT",type:"suspect_wants_to_leave",reveals:[],minute:100,guaranteed:true,validated:true,pressureMinutes:5,canonical:"A suspect asks to leave. The clock advances five minutes."});
}
