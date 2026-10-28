import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {createHeroCase} from "./Content/HeroCaseHarlow1041";
import {verifyCase} from "./Engine/case/Solver";
import {ActionPayload,CaseGraph,GameState} from "./Engine/core/Types";
import {createGameState} from "./Engine/game/GameState";
import {reduceGame} from "./Engine/game/Reducer";

/** Single Lens-side owner of engine graph/state. Adapters submit actions; models never mutate state. */
@component export class RoomscriptEngineBridge extends BaseScriptComponent {
  readonly onState=new Event<GameState>();
  private graph:CaseGraph;private state:GameState;
  initialize():void {
    if(this.state)return;
    this.graph=createHeroCase();const report=verifyCase(this.graph);
    if(!report.ok)throw new Error("Roomscript solver rejected hero: "+report.issues.map(i=>i.code).join(","));
    this.graph.solver=report;this.state=createGameState(this.graph);
    print("Roomscript solver: unique ✓; checks=8; hypotheses="+report.hypotheses.length+"; minRoute="+report.minRouteMinutes);
    this.onState.invoke(this.snapshot());
  }
  caseGraph():CaseGraph {return JSON.parse(JSON.stringify(this.graph)) as CaseGraph;}
  snapshot():GameState {return JSON.parse(JSON.stringify(this.state)) as GameState;}
  dispatch(payload:ActionPayload,player="P1"):GameState {
    this.state=reduceGame(this.graph,this.state,{...payload,seq:this.state.lastSeq+1,by:player});
    const snapshot=this.snapshot();this.onState.invoke(snapshot);return snapshot;
  }
}
