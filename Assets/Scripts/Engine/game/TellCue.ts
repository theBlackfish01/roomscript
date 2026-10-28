import {AnswerMode,CaseGraph,GameState,Tell} from "../core/Types";

export interface TellCue {suspect:string;statement:string;prop:string;kind:Tell;targetObject:string|null;delayMs:300;durationMs:900;}
/** A performed line can reveal only the tell already emitted by its engine action. */
export function tellCue(graph:CaseGraph,state:GameState,seq:number,suspect:string,mode:AnswerMode):TellCue|null {
  if(!["answer","press","broken"].includes(mode)||state.activeSuspect!==suspect)return null;
  const latest=state.log.slice().reverse().find(action=>!["LlmOutput","LineSpoken","GossipSpoken","PitchReceived","ArgumentClaim","ArgumentExtracted"].includes(action.type));
  if(latest?.seq!==seq)return null;
  const event=state.events.find(e=>e.seq===seq&&e.type==="tell"&&e.actor===suspect);
  const statement=graph.statements.find(s=>s.id===event?.refs?.[0]);
  const person=graph.cast.suspects.find(s=>s.id===suspect);
  if(!statement||!person||statement.stance!=="cover"||state.activeStatement!==statement.id)return null;
  const target=graph.room.objects.find(object=>object.id===statement.about);
  return {suspect,statement:statement.id,prop:person.tellProp,kind:person.tell,targetObject:target?.id??null,delayMs:300,durationMs:900};
}
