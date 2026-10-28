import {CaseGraph, GameState, SuspectState} from "../core/Types";
export function createGameState(graph: CaseGraph): GameState {
  const suspects: Record<string,SuspectState> = {};
  for (const suspect of graph.cast.suspects) suspects[suspect.id] = {
    layer:0, topicOverrides:{}, composure:suspect.composureMax, composureMax:suspect.composureMax,
    rapport:0,respect:0,emptyPresses:0,lawyeredUntil:0,shownEvidence:[],heard:[],memory:[],saidSoFar:[],recentLines:[]
  };
  return {caseId:graph.caseId,lastSeq:0,elapsedMinutes:0,clockMinutes:graph.clockMinutes,pips:5,hunches:0,
    activeSuspect:null,activeStatement:null,suspects,knowledge:{factIds:[],evidenceIds:[],statementIds:[]},
    notebook:[],grid:{suspects:[],zones:[],weapons:[]},beatsFired:[],arguments:[],verdict:null,accusation:null,events:[],log:[]};
}
