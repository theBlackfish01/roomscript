import {CaseGraph,GameState} from "../Engine/core/Types";
import {presentedQuestions,PresentedQuestion} from "../Engine/perf/QuestionPresentation";

/** Natural prompts for existing engine topics; no extra answer, assertion or model authority. */
export function run10Questions(graph:CaseGraph,state:GameState,suspect:string):PresentedQuestion[]{
  const questions=presentedQuestions(graph,state,suspect).filter(q=>!q.topic.startsWith("baseline:")&&q.topic!=="unclear");
  return questions.slice(0,4).map(q=>{
    if(q.topic.startsWith("where@"))return {...q,label:graph.slots[graph.murderSlot]+" alibi",question:"Where were you at "+graph.slots[graph.murderSlot]+"?"};
    if(q.topic==="about:V")return {...q,label:"Harlow alive?",question:"Did you hear Harlow that night?"};
    if(q.topic==="motive:S2")return {...q,label:"Harlow and Vale",question:"What was between Harlow and Vale?"};
    if(q.topic.startsWith("about:S")){const person=graph.cast.suspects.find(s=>s.id===q.topic.slice(6));return {...q,label:person?.name||q.label,question:"Did you notice "+(person?.name||"the other guest")+" that night?"};}
    if(q.topic.startsWith("about:O")){const object=graph.room.objects.find(o=>o.id===q.topic.slice(6));return {...q,label:object?.label||q.label,question:"Did you see the "+(object?.label||"object")+" that night?"};}
    return q;
  });
}
