import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {createHeroCase} from "./Content/HeroCaseHarlow1041";
import {applyPresetEveningRoom} from "./Content/PresetEveningRoom";
import {verifyCase} from "./Engine/case/Solver";
import {ActionPayload,CaseGraph,GameState,LineBankEntry,RoomObject} from "./Engine/core/Types";
import {createGameState} from "./Engine/game/GameState";
import {reduceGame} from "./Engine/game/Reducer";
import {RoomInput} from "./Engine/room/RoomModel";
import {DynamicCaseResult,prepareDynamicCase} from "./Content/DynamicCase";
import {heroLineBank} from "./Content/HeroLineBank";
import {phrasePlan,PhrasePlan} from "./Engine/perf/GeneratedPerformance";
import {HERO_VARIANTS} from "./Content/HeroVariantBank";
import {HERO_REGISTER} from "./Content/HeroRegisterBank";
export type RoomscriptCaseMode="preset"|"dynamic";
export interface RoomscriptCaseChange {mode:RoomscriptCaseMode;graph:CaseGraph;scenery:readonly RoomObject[];activeZoneIds:readonly string[];}

/** Single Lens-side owner of engine graph/state. Adapters submit actions; models never mutate state. */
@component export class RoomscriptEngineBridge extends BaseScriptComponent {
  @input @hint("Player setup reference") player:SceneObject;
  @input @hint("Shared room coordinate frame") roomRoot:SceneObject;
  readonly onState=new Event<GameState>();
  readonly onCaseChanged=new Event<RoomscriptCaseChange>();
  investigationEnabled=true;
  private graph:CaseGraph;private state:GameState;private cachedState:GameState;private cachedSeq=-1;
  private caseMode:RoomscriptCaseMode="preset";private bank:readonly LineBankEntry[]=heroLineBank;
  private phrases=new Map<string,PhrasePlan>();
  private freeze<T>(value:T):T {if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.keys(value).forEach(key=>this.freeze(value[key]));Object.freeze(value);}return value;}
  initialize():void {
    if(this.state)return;
    this.installPreset(false);
  }
  private installPreset(notify:boolean):void {
    const graph=applyPresetEveningRoom(createHeroCase());const report=verifyCase(graph);
    if(!report.ok)throw new Error("Roomscript solver rejected hero: "+report.issues.map(i=>i.code).join(","));
    graph.solver=report;graph.performances={variants:HERO_VARIANTS,register:HERO_REGISTER};
    this.install(graph,"preset",heroLineBank,[],graph.room.zones.map(z=>z.id),notify);
    console.log("Roomscript solver: unique ✓; checks=8; hypotheses="+report.hypotheses.length+"; minRoute="+report.minRouteMinutes);
  }
  private install(graph:CaseGraph,mode:RoomscriptCaseMode,bank:readonly LineBankEntry[],scenery:RoomObject[],activeZoneIds:string[],notify:boolean):void {
    this.graph=this.freeze(graph);this.caseMode=mode;this.bank=this.freeze(bank);this.state=createGameState(graph);
    this.cachedSeq=-1;this.phrases.clear();this.investigationEnabled=true;
    // Subscribers see the new graph and seq=0 before any setup or presentation reset.
    if(notify)this.onCaseChanged.invoke({mode,graph:this.graph,scenery:this.freeze(scenery),activeZoneIds:this.freeze(activeZoneIds)});
    this.onState.invoke(this.snapshot());
  }
  configurePreset():void {this.installPreset(true);}
  configureDynamic(seed:number,room:RoomInput):DynamicCaseResult {
    const result=prepareDynamicCase(seed,room);
    if(result.ok&&result.graph)this.install(result.graph,"dynamic",result.lineBank,result.scenery||[],result.activeZoneIds||[],true);
    return result;
  }
  mode():RoomscriptCaseMode {return this.caseMode;}
  lineBank():readonly LineBankEntry[] {this.initialize();return this.bank;}
  phrasePlan(speaker:string,text:string):PhrasePlan {
    this.initialize();const key=speaker+"|"+text;let plan=this.phrases.get(key);
    if(!plan){plan=this.freeze(phrasePlan(this.graph,speaker,text));this.phrases.set(key,plan);}return plan;
  }
  configurePose():void {this.initialize();if(this.state.lastSeq!==0)return;const inverse=this.roomRoot.getTransform().getInvertedWorldTransform(),origin=inverse.multiplyPoint(this.player.getTransform().getWorldPosition()),forward=inverse.multiplyDirection(this.player.getTransform().getWorldRotation().multiplyVec3(vec3.back()));this.dispatch({type:"SetupCase",origin:[origin.x,0,origin.z],forward:[forward.x,0,forward.z]});}
  caseGraph():CaseGraph {return JSON.parse(JSON.stringify(this.graph)) as CaseGraph;}
  /** Immutable shared graph for presentation; caseGraph remains an explicit editable copy. */
  graphRef():CaseGraph {return this.graph;}
  /** One immutable snapshot per action, shared safely across all listeners. */
  snapshot():GameState {if(this.cachedSeq!==this.state.lastSeq){this.cachedState=this.freeze(JSON.parse(JSON.stringify(this.state)) as GameState);this.cachedSeq=this.state.lastSeq;}return this.cachedState;}
  dispatch(payload:ActionPayload,player="P1"):GameState {
    if(!this.investigationEnabled)return this.snapshot();
    this.state=reduceGame(this.graph,this.state,{...payload,seq:this.state.lastSeq+1,by:player});
    const snapshot=this.snapshot();this.onState.invoke(snapshot);return snapshot;
  }
}
