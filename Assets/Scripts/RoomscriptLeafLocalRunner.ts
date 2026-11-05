import {DefaultScenarioManager} from "Leaf.lspkg/Scenarios/scenario/manager/DefaultLeafScenarioManager";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {LeafLifecycle} from "Leaf.lspkg/Utils/common/LeafLifecycle";
import {findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils";
import {localLeafConfig} from "./Engine/perf/LocalLeafConfig";
type LocalLeafStatus="idle"|"scheduled"|"running"|"passed"|"failed"|"cancelled";
/** Preview-only, opt-in transport fallback. Runs the real registered LEAF scenario and diagnostic machinery. */
@component export class RoomscriptLeafLocalRunner extends BaseScriptComponent {
  @input @hint("Registered LEAF scenario; empty keeps this debug harness idle") scenarioId:string="";
  @input @hint("String-valued JSON parameter overrides; strict fail-fast, maximum240 seconds") parametersJson:string="{}";
  private static active:RoomscriptLeafLocalRunner|null=null;
  private static sequence=0;
  private pending:DelayedCallbackEvent|null=null;private alive=true;private revision=0;
  private status:LocalLeafStatus="idle";private requestId="";private config:Record<string,string>={};
  private began=0;private finished=0;private error="";private requestedScenario="";
  onAwake():void {
    this.createEvent("OnStartEvent").bind(()=>{
      if(!global.deviceInfoSystem.isEditor()||!this.scenarioId.trim())return;
      this.requestedScenario=this.scenarioId.trim();this.requestId=this.requestedScenario+":"+Date.now()+":"+(++RoomscriptLeafLocalRunner.sequence);
      this.status="scheduled";this.pending=this.createEvent("DelayedCallbackEvent");
      this.pending.bind(()=>{const event=this.pending;this.pending=null;if(event)this.removeEvent(event);if(this.alive)void this.run();});this.pending.reset(.5);
    });
    this.createEvent("OnDestroyEvent").bind(()=>{
      this.alive=false;this.revision++;
      if(this.pending){this.pending.enabled=false;this.removeEvent(this.pending);this.pending=null;}
      if(this.status==="scheduled"||this.status==="running"){this.status="cancelled";this.finished=Date.now();this.error="Runner destroyed; Preview reset cancels scene-owned work";this.log();}
      if(RoomscriptLeafLocalRunner.active===this){RoomscriptLeafLocalRunner.active=null;try{LeafLifecycle.getInstance().invokeCleanup();}catch{/* Scene teardown may already have removed interactors. */}}
    });
  }
  private async run():Promise<void>{
    const revision=++this.revision;
    try{
      const manager=DefaultScenarioManager.getInstance();
      this.config=localLeafConfig(this.requestedScenario,this.parametersJson,manager.listScenarioIds(),manager.listScenarioParameters(this.requestedScenario));
      const owner=findSceneObjectByName("LeafScenarioManager");
      if(RoomscriptLeafLocalRunner.active||(owner&&!isNull(owner)&&owner.getChildrenCount()>0))throw Error("A LEAF scenario is already active; reset Preview before another run");
      RoomscriptLeafLocalRunner.active=this;this.status="running";this.began=Date.now();this.log();
      // Exact public package contract: the manager applies strict diagnostics and owns timeout, scenario creation and cleanup.
      await manager.startScenario(this.requestedScenario,new ScenarioConfig(new Map<string,string>(Object.entries(this.config))));
      if(!this.alive||revision!==this.revision)return;
      const elapsed=Date.now()-this.began;
      if(elapsed>Number(this.config.__leaf__timeout_secs)*1000)throw Error("Local LEAF wall-time limit exceeded after framework returned: "+elapsed+"ms");
      this.status="passed";this.finished=Date.now();this.log();
    }catch(error){if(!this.alive||revision!==this.revision)return;this.status="failed";this.error=String(error);this.finished=Date.now();this.log();}
    finally{if(RoomscriptLeafLocalRunner.active===this)RoomscriptLeafLocalRunner.active=null;}
  }
  diagnostics():{status:LocalLeafStatus;scenarioId:string;requestId:string;config:Record<string,string>;startedAt:number;finishedAt:number;elapsedMs:number;error:string;transport:string;strict:boolean}{
    return {status:this.status,scenarioId:this.requestedScenario,requestId:this.requestId,config:{...this.config},startedAt:this.began,finishedAt:this.finished,elapsedMs:this.began?Math.max(0,(this.finished||Date.now())-this.began):0,error:this.error,transport:"local-manager",strict:true};
  }
  private log():void {console.log("ROOMSCRIPT_LOCAL_LEAF|"+JSON.stringify(this.diagnostics()));}
}
