import {CaseGraph, GameState, Id} from "../core/Types";
import {solvePlayerKnowledge} from "../case/Solver";
/** Rank obtainable observations by information gained; never name the hidden solution. */
export function chooseHunch(graph: CaseGraph, state: GameState): Id | null {
  const before=solvePlayerKnowledge(graph,state.knowledge).hypotheses.length;
  const candidates=graph.room.objects.map(object=>{
    const evidence=graph.evidence.filter(e=>e.holder===object.id&&!state.knowledge.evidenceIds.includes(e.id)&&(!e.latent||!!e.beat&&state.beatsFired.includes(e.beat)));
    const facts=evidence.flatMap(e=>e.proves).filter(id=>!state.knowledge.factIds.includes(id));
    const after=solvePlayerKnowledge(graph,{...state.knowledge,factIds:state.knowledge.factIds.concat(facts)}).hypotheses.length;
    return {id:object.id,available:evidence.length,gain:before-after,newFacts:facts.length};
  }).filter(c=>c.available>0).sort((a,b)=>b.gain-a.gain||b.newFacts-a.newFacts||(a.id<b.id?-1:1));
  return candidates[0]?.id||null;
}
