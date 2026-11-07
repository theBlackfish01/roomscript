import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {GameState} from "./Engine/core/Types";
/** Run 9 (phase 5, followability): Wren's recorded hints W3-W12 and W14, each said at most once per case, at the
 * moment it is needed. A delayed hint is dropped if the player has already done the thing. Presentation only:
 * it reads engine state from onState events and never dispatches. */
export const WREN_HINT_IDS=["W3","W4","W5","W6","W7","W8","W9","W10","W11","W12","W14"];
export class RoomscriptWrenHints {
  static current:RoomscriptWrenHints|null=null;
  private said=new Set<string>();private timers:{id:string;at:number;needed:()=>boolean;where?:()=>vec3|undefined}[]=[];private state:GameState|null=null;
  constructor(owner:BaseScriptComponent,private engine:RoomscriptEngineBridge,private play:(cue:string,at?:vec3)=>void){
    RoomscriptWrenHints.current=this;
    engine.onState.add(state=>this.onState(state));engine.onCaseChanged.add(()=>{this.said.clear();this.timers=[];this.state=null;});
    owner.createEvent("UpdateEvent").bind(()=>this.tick());
  }
  /** Say a hint now (once per case). */
  say(id:string,at?:vec3):boolean {if(this.said.has(id)||!WREN_HINT_IDS.includes(id))return false;this.said.add(id);this.timers=this.timers.filter(t=>t.id!==id);this.play(id,at);console.log("WREN_HINT|"+id);return true;}
  /** Say a hint after `seconds` if `needed()` is still true then (the player has not found it alone). */
  later(id:string,seconds:number,needed:()=>boolean,where?:()=>vec3|undefined):void {if(this.said.has(id)||this.timers.some(t=>t.id===id))return;this.timers.push({id,at:getTime()+seconds,needed,where});}
  cancel(id:string):void {this.timers=this.timers.filter(t=>t.id!==id);}
  saidIds():string[] {return [...this.said];}
  private tick():void {if(!this.timers.length)return;const now=getTime();for(const t of this.timers.slice()){if(now<t.at)continue;this.timers.splice(this.timers.indexOf(t),1);if(t.needed())this.say(t.id,t.where?.());}}
  private onState(state:GameState):void {
    this.state=state;if(state.verdict)return;
    if(this.engine.investigationEnabled)this.later("W5",25,()=>true); // the palm notebook, once the case is under way
    const speakers=new Set(state.notebook.map(c=>c.speaker));
    if(speakers.size===1)this.later("W4",20,()=>!!this.state&&new Set(this.state.notebook.map(c=>c.speaker)).size===1&&!this.state.verdict);
    const objected=(s:GameState)=>s.events.some(e=>e.type==="objectionCorrect"||e.type==="objectionWrong");
    if(state.notebook.length>=3&&!objected(state))this.later("W6",30,()=>!!this.state&&!objected(this.state)&&!this.state.verdict);
  }
}
