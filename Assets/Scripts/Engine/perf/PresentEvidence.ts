import {CaseGraph,GameState} from "../core/Types";
import {presentedQuestions} from "./QuestionPresentation";
/** Run 8 physical asking (WEARER_UX object UI 3). Holding an object's memory photo up to a suspect, or
 * pointing at another guest, becomes an ordinary Ask on a topic the question presenter already offers.
 * It never invents a topic or reads hidden truth: when nothing fits, it is a free question the keyword
 * intent resolves, and the engine/line bank answer as for any free question.
 */
export interface PresentedAsk {topic:string;question:string;kind:"chip"|"free";}
export function presentObject(graph:CaseGraph,state:GameState,suspect:string,objectId:string):PresentedAsk|null {
  const object=graph.room.objects.find(o=>o.id===objectId);if(!object||!graph.cast.suspects.some(s=>s.id===suspect))return null;
  const questions=presentedQuestions(graph,state,suspect),label=object.label;
  const direct=questions.find(q=>q.topic==="weapon_"+objectId);if(direct)return {topic:direct.topic,question:direct.question,kind:"chip"};
  // Run 9 (review bug 4): only statements in the suspect's revealed layer count. A deeper, still-hidden statement
  // about the object would otherwise route the photo to a topic that hints at what they haven't said yet.
  const layer=state.suspects[suspect]?.layer??0;
  const about=revealedStatements(graph,suspect,layer).find(s=>s.about===objectId&&questions.some(q=>q.topic===s.topic));
  if(about){const q=questions.find(q=>q.topic===about.topic)!;return {topic:q.topic,question:q.question,kind:"chip"};}
  const touched=questions.find(q=>q.topic==="borrowed_item");if(touched)return {topic:touched.topic,question:"Did you touch the "+label+"?",kind:"chip"};
  return {topic:"free",question:"What about the "+label+"?",kind:"free"};
}
/** Statements a suspect can already be asked about: their current layer or shallower, excluding inactive replacements. */
export function revealedStatements(graph:CaseGraph,suspect:string,layer:number):CaseGraph["statements"] {
  return graph.statements.filter(s=>s.speaker===suspect&&s.layer<=layer&&!s.replacementFor);
}
export function presentGuest(graph:CaseGraph,state:GameState,suspect:string,guest:string):PresentedAsk|null {
  if(suspect===guest)return null;const other=graph.cast.suspects.find(s=>s.id===guest);if(!other||!graph.cast.suspects.some(s=>s.id===suspect))return null;
  const questions=presentedQuestions(graph,state,suspect),direct=questions.find(q=>q.topic==="about_"+guest);
  if(direct)return {topic:direct.topic,question:direct.question,kind:"chip"};
  return {topic:"free",question:"What can you tell me about "+other.name+"?",kind:"free"};
}
