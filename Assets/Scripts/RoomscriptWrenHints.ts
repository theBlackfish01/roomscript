import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {GameState} from "./Engine/core/Types";
export const WREN_HINT_IDS=["W10_CASE","W10_GUESTS","W10_KETTLE","W10_RECORDER","W10_CABLE","W10_READY"];
const LINES:Record<string,string>={W10_CASE:"What did Harlow leave us?",W10_GUESTS:"Why are they all so certain where they were?",W10_KETTLE:"What was she doing in a kitchen with a cold kettle?",W10_RECORDER:"How could he answer her if he was already dead?",W10_CABLE:"What caught those fibres?",W10_READY:"Who can we place in that room, with that cable?"};
/** Authored partner questions only, after a real stall. Furniture never speaks. */
export class RoomscriptWrenHints {
 static current:RoomscriptWrenHints|null=null;
 private said=new Set<string>();private state:GameState;private progressAt=0;private lastAt=-100;private seq=-1;
 constructor(owner:BaseScriptComponent,private engine:RoomscriptEngineBridge,private play:(text:string,at:vec3)=>boolean){
  RoomscriptWrenHints.current=this;this.progressAt=getTime();this.state=engine.snapshot();
  engine.onCaseChanged.add(()=>{this.said.clear();this.progressAt=getTime();this.lastAt=-100;this.seq=-1;});
  engine.onState.add(state=>{this.state=state;if(state.lastSeq!==this.seq){this.seq=state.lastSeq;const action=state.log[state.log.length-1];if(action&&action.type!=="PlayerMoved"&&action.type!=="WrenSpoken")this.progressAt=getTime();}});
  owner.createEvent("UpdateEvent").bind(()=>this.tick());
 }
 say(id:string,_at?:vec3):boolean {
  const now=getTime();if(!LINES[id]||this.said.has(id)||now-this.progressAt<25||now-this.lastAt<45||!this.engine.investigationEnabled||this.state?.verdict)return false;
  const camera=this.engine.player.getTransform(),behind=camera.getWorldPosition().add(camera.getWorldRotation().multiplyVec3(new vec3(0,0,70)));
  if(!this.play(LINES[id],behind))return false;this.said.add(id);this.lastAt=now;console.log("WREN_HINT|"+id);return true;
 }
 // Legacy presentation hooks are inert until their callers are removed in phase 2.
 later(_id:string,_seconds:number,_needed:()=>boolean,_where?:()=>vec3|undefined):void {}
 cancel(_id:string):void {}
 saidIds():string[]{return [...this.said];}
 private tick():void {
  if(!this.state||!this.engine.investigationEnabled||this.state.verdict||getTime()-this.progressAt<25)return;
  const s=this.state,k=s.knowledge,graph=this.engine.graphRef();if(!graph.caseId.startsWith("HARLOW-1041"))return;
  const known=(id:string)=>k.evidenceIds.includes(id),heard=(id:string)=>k.statementIds.includes(id);
  const id=known("E_CABLE")&&s.suspects.S2?.layer>=2?"W10_READY":known("E_RECORDING")&&s.suspects.S2?.layer===1?"W10_RECORDER":known("E_KETTLE_COLD")&&s.activeSuspect==="S2"&&s.suspects.S2?.layer===0?"W10_KETTLE":known("E_CABLE")?"W10_CABLE":k.statementIds.length?"W10_GUESTS":"W10_CASE";
  this.say(id);
 }
}
