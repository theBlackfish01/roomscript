import {CaseGraph,GameState} from "../core/Types";

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
  HarlowVoicemail:{name:"HarlowVoicemail",factIds:["F_REPLY_AFTER_ARRIVAL","F_VALE_MOTIVE"]},
  ValeConfession:{name:"ValeConfession",factIds:["F_MURDER_SPINE","F_VALE_MOTIVE"],verdictOnly:true},
  WrongEscape:{name:"WrongEscape",factIds:[],verdictOnly:true}
};

/** Sealing a wrong case must never authorize the correct confession or unlock voicemail. */
export function dialogueAllowed(graph:CaseGraph,state:GameState,spec:DialogueGate):boolean {
  if(spec.name==="OpeningExchange")return false; // Retired instructions, even if an old caller remains.
  if(spec.name==="ValeConfession"&&state.verdict!=="correct")return false;
  if(spec.name==="WrongEscape"&&state.verdict!=="wrong")return false;
  if(spec.verdictOnly&&state.verdict!=="correct"&&state.verdict!=="wrong")return false;
  return spec.factIds.every(id=>{
    if(!graph.facts.some(f=>f.id===id&&f.truth))return false;
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

/** One instance per playback session. Caller supplies engine snapshots only on state events.
 * Wren's stalled-step questions belong to the shared speech arbiter's hint owner.
 * Returned speech is queued without interrupting an active line; gates recheck at playback.
 */
export class NarrativeAudio {
  private seen=new Set<string>();private eventCursor=0;private caseId="";private lastSeq=-1;private pendingVoicemail=false;
  reset():void {this.seen.clear();this.eventCursor=0;this.caseId="";this.lastSeq=-1;this.pendingVoicemail=false;}
  private sync(state:GameState):void {
    if(this.caseId!==state.caseId||state.lastSeq<this.lastSeq||state.events.length<this.eventCursor)this.reset();
    this.caseId=state.caseId;this.lastSeq=state.lastSeq;
  }
  private once(cue:NarrativeCue,out:NarrativeCue[]):void {if(!this.seen.has(cue.key)){this.seen.add(cue.key);out.push(cue);}}
  private dialogue(graph:CaseGraph,state:GameState,name:string,out:NarrativeCue[]):void {
    if(isHarlowPreset(graph)&&dialogueAllowed(graph,state,dialogues[name]))this.once({kind:"dialogue",key:"dialogue:"+name,name},out);
  }
  /** Speech order belongs to the opening controller; old ceremony stages remain silent. */
  opening(graph:CaseGraph,state:GameState,stage:string):NarrativeCue[] {
    this.sync(state);const out:NarrativeCue[]=[],key="opening:"+stage;
    if(stage==="placed"){
      for(const name of ["Rain","RoomTone"])this.once({kind:"ambience",key:key+name,name,enabled:true},out);
      this.once({kind:"score",key:key+":score",name:"MainTheme"},out);
    }
    if(stage==="ready"){
      this.once({kind:"score",key:key+":score",name:"Interrogation"},out);
    }
    return out;
  }
  consume(graph:CaseGraph,state:GameState):NarrativeCue[] {
    this.sync(state);const out:NarrativeCue[]=[];
    for(let index=this.eventCursor;index<state.events.length;index++){
      const event=state.events[index],key="event:"+index+":"+event.type;
      if(event.type==="evidence"){
        const evidence=graph.evidence.find(e=>e.id===event.refs?.[0]);
        const name=evidence?.kind==="photo"?"Polaroid":evidence?.kind==="letter"?"Letter":evidence?.kind==="receipt"?"PaperSlip":evidence?.holder==="O11"?"Kettle":null;
        if(name)this.once({kind:"sfx",key:"evidence:"+event.seq+":"+name+":"+(event.actor||""),name,anchor:event.actor},out);
      }
      if(event.type==="argumentSupported")this.once({kind:"sfx",key,name:"Typewriter"},out);
      if(event.type==="beat"){
        const beat=graph.beats.find(b=>b.id===event.refs?.[0]);if(!beat||!state.beatsFired.includes(beat.id))continue;
        if(beat.type==="voicemail"){this.pendingVoicemail=true;this.once({kind:"sfx",key,name:"PhoneStatic"},out);}
        if(beat.type==="suspect_wants_to_leave")this.once({kind:"sfx",key,name:"TapeZip",anchor:"O8"},out);
      }
      if(event.type==="timeout"&&state.verdict==="timeout")this.once({kind:"voice",key:"timeout",speaker:"NARRATOR",text:"The night ran out before my questions did.",factIds:[]},out);
    }
    this.eventCursor=state.events.length;
    // A reordered case may admit motive after the voicemail beat. Do not lose that cue.
    if(this.pendingVoicemail&&dialogueAllowed(graph,state,dialogues.HarlowVoicemail)){
      this.dialogue(graph,state,"HarlowVoicemail",out);this.pendingVoicemail=false;
    }
    return out;
  }
  idle(graph:CaseGraph,state:GameState):NarrativeCue[] {this.sync(state);return [];}
  beforeSeal(graph:CaseGraph,state:GameState):NarrativeCue[] {this.sync(state);return [];}
  reconstruction(graph:CaseGraph,state:GameState,kind:string):NarrativeCue[] {
    this.sync(state);const out:NarrativeCue[]=[];if(state.verdict!=="correct"&&state.verdict!=="wrong")return out;
    const sound:Record<string,string>={claims:"GhostDust",correction:"GlassShatter",freeze:"Freeze",resume:"Release",ledger:"Typewriter",stamp:"Stamp"};
    if(sound[kind])this.once({kind:"sfx",key:"reconstruction:"+kind,name:sound[kind]},out);
    if(kind==="blackout")this.once({kind:"score",key:"reconstruction:score",name:"Reconstruction"},out);
    return out;
  }
  ending(graph:CaseGraph,state:GameState):NarrativeCue[] {
    this.sync(state);const out:NarrativeCue[]=[];if(state.verdict!=="correct"&&state.verdict!=="wrong")return out;
    const correct=state.verdict==="correct";
    this.once({kind:"score",key:"ending:score",name:correct?"CaseClosed":"WrongEnding"},out);
    this.dialogue(graph,state,correct?"ValeConfession":"WrongEscape",out);
    if(!correct||isHarlowPreset(graph))this.once({kind:"voice",key:"ending:voice",speaker:"NARRATOR",text:correct?"I came for the truth. Harlow finally has it.":"I named the wrong person. The room kept its secret.",factIds:[]},out);
    for(const name of ["Rain","RoomTone"])this.once({kind:"ambience",key:"ending:"+name,name,enabled:false},out);
    return out;
  }
}
