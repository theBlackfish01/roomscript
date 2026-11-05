import {CaseGraph,GameState} from "../core/Types";
import {buildFactSheet} from "./FactSheetBuilder";
import {keywordIntent,questionChips,KeywordResult} from "./KeywordIntent";

export interface PresentedQuestion {topic:string;label:string;question:string;}
/** UI wording follows the current admitted account; it exposes no hidden fact or flag. */
export function presentedQuestions(graph:CaseGraph,state:GameState,suspect:string):PresentedQuestion[] {
  const sheet=buildFactSheet(graph,state,suspect),person=graph.cast.suspects.find(s=>s.id===suspect)!;
  const all=questionChips(sheet),where=all.find(c=>c.topic.startsWith("where@")||c.topic==="whereabouts")?.topic;
  const first=[where,person.baseline.truthTopic,person.baseline.lieTopic];
  const ordered=first.map(topic=>all.find(c=>c.topic===topic)).filter(Boolean).concat(all.filter(c=>!first.includes(c.topic)&&c.topic!=="unclear"));
  return ordered.map(chip=>{
    const topic=chip!.topic;
    if(topic==="whereabouts")return {topic,label:"Whereabouts",question:"Where were you at "+graph.slots[graph.murderSlot]+"?"};
    if(topic==="background")return {topic,label:"Your connection",question:"What brought you here?"};
    if(topic==="borrowed_item")return {topic,label:"Object contact",question:"Did you touch anything in this room?"};
    if(topic==="visit")return {topic,label:"Earlier business",question:"What were you doing earlier?"};
    if(topic==="victim")return {topic,label:"The victim",question:"Where was "+graph.cast.victim.name+"?"};
    if(topic==="motive")return {topic,label:"Your dispute",question:"Why were you upset with "+graph.cast.victim.name+"?"};
    if(topic.startsWith("about_")){
      const other=graph.cast.suspects.find(s=>s.id===topic.slice(6));
      return {topic,label:other?.name.split(" ").slice(-1)[0]||"Another guest",question:"Where was "+(other?.name||"the other guest")+"?"};
    }
    if(topic.startsWith("weapon_")){
      const object=graph.room.objects.find(o=>o.id===topic.slice(7));
      return {topic,label:object?.label||"The object",question:"Where was the "+(object?.label||"object")+"?"};
    }
    const id=topic.split(":")[1],name=id==="V"?graph.cast.victim.name.split(" ").slice(-1)[0]:graph.cast.suspects.find(s=>s.id===id)?.name.split(" ").slice(-1)[0]||graph.room.objects.find(o=>o.id===id)?.label||"account";
    return {topic,question:chip!.question,label:topic.startsWith("where@")?"Whereabouts":topic==="baseline:name"?"Your name":topic.startsWith("baseline:")?topic.replace("baseline:","Your "):topic.startsWith("motive:")?name+"'s motive":"About "+name};
  });
}

/** Optional free-question topic proposal only; it never invents an answer or changes truth. */
export function presentedIntent(graph:CaseGraph,state:GameState,suspect:string,question:string):KeywordResult {
  const sheet=buildFactSheet(graph,state,suspect),original=keywordIntent(question,sheet,graph);
  if(original.matched)return original;
  const choices=presentedQuestions(graph,state,suspect),has=(topic:string)=>choices.some(c=>c.topic===topic),text=question.toLowerCase();
  let topic:string|undefined;
  if(/\b(where|alibi|whereabouts|location)\b/.test(text)&&has("whereabouts"))topic="whereabouts";
  if(/\b(touch|borrow|item|contact)\b/.test(text)&&has("borrowed_item"))topic="borrowed_item";
  if(/\b(earlier|visit|business)\b/.test(text)&&has("visit"))topic="visit";
  if(/\b(background|brought|connection|introduce)\b/.test(text)&&has("background"))topic="background";
  if(text.includes(graph.cast.victim.name.toLowerCase())&&has("victim"))topic="victim";
  for(const person of graph.cast.suspects)if(text.includes(person.name.toLowerCase())&&has("about_"+person.id))topic="about_"+person.id;
  for(const object of graph.room.objects)if(text.includes(object.label.toLowerCase())&&has("weapon_"+object.id))topic="weapon_"+object.id;
  return topic?{topic,matched:true,source:"keyword"}:original;
}
