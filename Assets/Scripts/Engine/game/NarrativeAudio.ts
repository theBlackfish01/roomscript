import {BeatType,CaseGraph,GameState} from "../core/Types";
import {partnerLine,PartnerTrigger} from "./Partner";
import {endingSummary} from "./CaseClarity";

/** Presentation instructions only. No action, fact, verdict or clock is changed here. */
export type NarrativeCue =
  | {kind:"voice";key:string;speaker:string;text:string;factIds:string[]}
  | {kind:"dialogue";key:string;name:string}
  | {kind:"sfx";key:string;name:string;anchor?:string}
  | {kind:"score";key:string;name:string}
  | {kind:"ambience";key:string;name:string;enabled:boolean};
export interface DialogueGate {name:string;factIds:readonly string[];verdictOnly?:boolean;}
/** Authored IDs include their bound room suffix; an exact HARLOW-1041 comparison rejects Preset. */
export function isHarlowPreset(graph:Pick<CaseGraph,"caseId">):boolean {return graph.caseId.startsWith("HARLOW-1041@");}
const dialogues:Record<string,DialogueGate>={
  OpeningExchange:{name:"OpeningExchange",factIds:["F_BODY_FOUND"]},
  ArrivalDialogue:{name:"ArrivalDialogue",factIds:[]},
  HarlowVoicemail:{name:"HarlowVoicemail",factIds:["F_REPLY_AFTER_ARRIVAL","F_VALE_MOTIVE"]},
  ValeConfession:{name:"ValeConfession",factIds:["F_MURDER_SPINE","F_VALE_MOTIVE"],verdictOnly:true},
  WrongEscape:{name:"WrongEscape",factIds:[],verdictOnly:true}
};

/** Sealing a wrong case must never authorize the correct confession or unlock voicemail. */
export function dialogueAllowed(graph:CaseGraph,state:GameState,spec:DialogueGate):boolean {
  if(spec.name==="ValeConfession"&&state.verdict!=="correct")return false;
  if(spec.name==="WrongEscape"&&state.verdict!=="wrong")return false;
  if(spec.verdictOnly&&state.verdict!=="correct"&&state.verdict!=="wrong")return false;
  return spec.factIds.every(id=>{
    if(!graph.facts.some(f=>f.id===id&&f.truth))return false;
    if(spec.name==="OpeningExchange"&&id==="F_BODY_FOUND")return true; // public authored case brief
    if(spec.name==="ValeConfession"&&state.verdict==="correct")return true;
    return state.knowledge.factIds.includes(id);
  });
}

/** Normalized tension, derived solely from the active engine composure. */
export function composureTension(state:GameState):number {
  const person=state.activeSuspect?state.suspects[state.activeSuspect]:undefined;
  if(!person||state.verdict||!Number.isFinite(person.composure)||person.composureMax<=0)return 0;
  return Math.max(0,Math.min(1,1-person.composure/person.composureMax));
}

const beatTrigger:Partial<Record<BeatType,PartnerTrigger>>={latent_letter:"letter",voicemail:"voicemail",suspect_wants_to_leave:"flight",blackout:"blackout"};
/** One instance per playback session. Caller supplies engine snapshots only on state events.
 * Idle is an explicit presentation timer signal, not a gameplay action or wall clock read.
 * Returned speech must be queued behind suspect speech and gates rechecked at playback.
 */
export class NarrativeAudio {
  private seen=new Set<string>();private eventCursor=0;private caseId="";private lastSeq=-1;private pendingVoicemail=false;
  reset():void {this.seen.clear();this.eventCursor=0;this.caseId="";this.lastSeq=-1;this.pendingVoicemail=false;}
  private sync(state:GameState):void {
    if(this.caseId!==state.caseId||state.lastSeq<this.lastSeq||state.events.length<this.eventCursor)this.reset();
    this.caseId=state.caseId;this.lastSeq=state.lastSeq;
  }
  private once(cue:NarrativeCue,out:NarrativeCue[]):void {if(!this.seen.has(cue.key)){this.seen.add(cue.key);out.push(cue);}}
  private partner(graph:CaseGraph,state:GameState,trigger:PartnerTrigger,out:NarrativeCue[]):void {
    const line=partnerLine(graph,state.knowledge,trigger);
    this.once({kind:"voice",key:line.id,speaker:"WREN",text:line.text,factIds:line.factIds},out);
  }
  private dialogue(graph:CaseGraph,state:GameState,name:string,out:NarrativeCue[]):void {
    if(dialogueAllowed(graph,state,dialogues[name]))this.once({kind:"dialogue",key:"dialogue:"+name,name},out);
  }
  /** Opening controller forwards its existing authored beat names. */
  opening(graph:CaseGraph,state:GameState,stage:string):NarrativeCue[] {
    this.sync(state);const out:NarrativeCue[]=[],key="opening:"+stage;
    if(stage==="placed"){
      this.once({kind:"voice",key,speaker:"NARRATOR",text:"Listen at the door.",factIds:[]},out);
      for(const name of ["Rain","RoomTone"])this.once({kind:"ambience",key:key+name,name,enabled:true},out);
      this.once({kind:"score",key:key+":score",name:"MainTheme"},out);
    }
    if(stage==="tape")this.once({kind:"voice",key,speaker:"NARRATOR",text:"Nobody leaves.",factIds:[]},out);
    if(stage==="crate")this.dialogue(graph,state,"OpeningExchange",out);
    if(stage==="arrival:S2")this.dialogue(graph,state,"ArrivalDialogue",out);
    if(stage==="ready"){
      // Test/skip routes still receive the partner opening exactly once.
      if(!this.seen.has("dialogue:OpeningExchange"))this.partner(graph,state,"opening",out);
      this.once({kind:"score",key:key+":score",name:"Interrogation"},out);
    }
    return out;
  }
  consume(graph:CaseGraph,state:GameState):NarrativeCue[] {
    this.sync(state);const out:NarrativeCue[]=[];
    for(let index=this.eventCursor;index<state.events.length;index++){
      const event=state.events[index],key="event:"+index+":"+event.type;
      if(event.type==="tell")this.partner(graph,state,"first-tell",out);
      if(event.type==="objectionCorrect")this.partner(graph,state,"first-objection",out);
      if(event.type==="evidence"){
        const evidence=graph.evidence.find(e=>e.id===event.refs?.[0]);
        const name=evidence?.kind==="photo"?"Polaroid":evidence?.kind==="receipt"?"PaperSlip":evidence?.holder==="O11"?"Kettle":null;
        if(name)this.once({kind:"sfx",key,name,anchor:event.actor},out);
      }
      if(event.type==="argumentSupported")this.once({kind:"sfx",key,name:"Typewriter"},out);
      if(event.type==="beat"){
        const beat=graph.beats.find(b=>b.id===event.refs?.[0]);if(!beat||!state.beatsFired.includes(beat.id))continue;
        const trigger=beatTrigger[beat.type];if(trigger)this.partner(graph,state,trigger,out);
        if(beat.type==="latent_letter")this.once({kind:"sfx",key,name:"Letter"},out);
        if(beat.type==="voicemail"){this.pendingVoicemail=true;this.once({kind:"sfx",key,name:"PhoneStatic"},out);}
        if(beat.type==="suspect_wants_to_leave")this.once({kind:"sfx",key,name:"TapeZip",anchor:"O8"},out);
        if(beat.type==="blackout"){
          this.once({kind:"sfx",key,name:"Blackout"},out);
          this.once({kind:"score",key:key+":score",name:"BlackoutDrone"},out);
          this.once({kind:"ambience",key:key+":uv",name:"UvHum",enabled:true},out);
        }
      }
      if(event.type==="timeout"&&state.verdict==="timeout")this.once({kind:"voice",key:"timeout",speaker:"NARRATOR",text:"Time has run out. Make your final accusation.",factIds:[]},out);
    }
    this.eventCursor=state.events.length;
    // A reordered case may admit motive after the voicemail beat. Do not lose that cue.
    if(this.pendingVoicemail&&dialogueAllowed(graph,state,dialogues.HarlowVoicemail)){
      this.dialogue(graph,state,"HarlowVoicemail",out);this.pendingVoicemail=false;
    }
    return out;
  }
  idle(graph:CaseGraph,state:GameState):NarrativeCue[] {this.sync(state);const out:NarrativeCue[]=[];if(!state.verdict)this.partner(graph,state,"idle",out);return out;}
  beforeSeal(graph:CaseGraph,state:GameState):NarrativeCue[] {this.sync(state);const out:NarrativeCue[]=[];if(!state.verdict||state.verdict==="timeout")this.partner(graph,state,"seal",out);return out;}
  reconstruction(graph:CaseGraph,state:GameState,kind:string):NarrativeCue[] {
    this.sync(state);const out:NarrativeCue[]=[];if(state.verdict!=="correct"&&state.verdict!=="wrong")return out;
    const sound:Record<string,string>={blackout:"Blackout",claims:"GhostDust",correction:"GlassShatter",freeze:"Freeze",resume:"Release",ledger:"Typewriter",stamp:"Stamp"};
    if(sound[kind])this.once({kind:"sfx",key:"reconstruction:"+kind,name:sound[kind]},out);
    if(kind==="blackout")this.once({kind:"score",key:"reconstruction:score",name:"Reconstruction"},out);
    if(kind==="resume")for(const [index,line] of endingSummary(graph,state).filter(l=>!l.speaker).entries())this.once({kind:"voice",key:"summary:"+index,speaker:"NARRATOR",text:line.text,factIds:line.factIds},out);
    return out;
  }
  ending(graph:CaseGraph,state:GameState):NarrativeCue[] {
    this.sync(state);const out:NarrativeCue[]=[];if(state.verdict!=="correct"&&state.verdict!=="wrong")return out;
    const correct=state.verdict==="correct";
    this.once({kind:"score",key:"ending:score",name:correct?"CaseClosed":"WrongEnding"},out);
    this.dialogue(graph,state,correct?"ValeConfession":"WrongEscape",out);
    this.once({kind:"voice",key:"ending:voice",speaker:"NARRATOR",text:correct?"Case closed.":"An accusation is not proof. The case remains unresolved.",factIds:[]},out);
    for(const name of ["Rain","RoomTone","UvHum"])this.once({kind:"ambience",key:"ending:"+name,name,enabled:false},out);
    return out;
  }
}
