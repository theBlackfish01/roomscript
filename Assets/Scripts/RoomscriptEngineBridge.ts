import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {createHeroCase} from "./Content/HeroCaseHarlow1041";
import {verifyCase} from "./Engine/case/Solver";
import {ActionPayload,CaseGraph,GameState} from "./Engine/core/Types";
import {createGameState} from "./Engine/game/GameState";
import {reduceGame} from "./Engine/game/Reducer";
import {clockwiseRefuters} from "./Engine/game/CluePresentation";
import {HERO_VARIANTS} from "./Content/HeroVariantBank";
import {HERO_REGISTER} from "./Content/HeroRegisterBank";

/** Single Lens-side owner of engine graph/state. Adapters submit actions; models never mutate state. */
@component export class RoomscriptEngineBridge extends BaseScriptComponent {
  @input @hint("Player setup reference") player:SceneObject;
  @input @hint("Shared room coordinate frame") roomRoot:SceneObject;
  readonly onState=new Event<GameState>();
  investigationEnabled=true;
  private graph:CaseGraph;private state:GameState;private cachedState:GameState;private cachedSeq=-1;
  private freeze<T>(value:T):T {if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.keys(value).forEach(key=>this.freeze(value[key]));Object.freeze(value);}return value;}
  initialize():void {
    if(this.state)return;
    this.graph=createHeroCase();const report=verifyCase(this.graph);
    if(!report.ok)throw new Error("Roomscript solver rejected hero: "+report.issues.map(i=>i.code).join(","));
    this.graph.solver=report;this.graph.performances={variants:HERO_VARIANTS,register:HERO_REGISTER};this.freeze(this.graph);this.state=createGameState(this.graph);
    console.log("Roomscript solver: unique ✓; checks=8; hypotheses="+report.hypotheses.length+"; minRoute="+report.minRouteMinutes);
    this.onState.invoke(this.snapshot());
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
