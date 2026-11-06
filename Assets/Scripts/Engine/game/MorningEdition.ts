import {CaseGraph,GameState,Id} from "../core/Types";

export interface Newspaper {masthead:string;date:string;headline:string;subhead:string;columns:string[];photoCaption:string}
export const HEADLINE_MAX=48,SUBHEAD_MAX=70;

/** Fit to a limit at a word boundary; a single over-long word is cut. */
export function fitText(text:string,max:number):string {
  const clean=text.replace(/\s+/g," ").trim();if(clean.length<=max)return clean;
  const words=clean.split(" ");let out="";
  for(const word of words){const next=out?out+" "+word:word;if(next.length>max)break;out=next;}
  return (out||clean.slice(0,max)).replace(/[\s,;:—-]+$/,"");
}
function surname(graph:CaseGraph,id:Id):string {
  const person=graph.cast.suspects.find(s=>s.id===id)||(graph.cast.victim.id===id?graph.cast.victim:undefined);
  return person?person.name.split(" ").slice(-1)[0]:id;
}
const zoneName=(graph:CaseGraph,id:Id)=>graph.room.zones.find(z=>z.id===id)?.clueName||id;
const objectName=(graph:CaseGraph,id:Id)=>graph.room.objects.find(o=>o.id===id)?.label||id;
const plural=(n:number,one:string,many:string)=>n+" "+(n===1?one:many);
function firstFitting(options:string[],max:number):string {return options.find(o=>o.length<=max)||fitText(options[options.length-1],max);}

/** The morning paper, written only from the verdict, the accusation and counts from the case log.
 * A wrong verdict names only the accused; the true culprit is left to the reconstruction. */
export function morningEdition(graph:CaseGraph,state:GameState):Newspaper|null {
  if(state.caseId!==graph.caseId||state.verdict===null)return null;
  const victim=surname(graph,graph.cast.victim.id).toUpperCase();
  const won=state.events.filter(e=>e.type==="objectionCorrect").length,lost=state.events.filter(e=>e.type==="objectionWrong").length;
  const broken=state.notebook.filter(c=>c.broken).length,heard=state.notebook.length;
  const proved=state.arguments.length,required=graph.requiredDeductions.length,clues=state.knowledge.evidenceIds.length;
  const columns=[
    "Objections won: "+won+(lost?", lost: "+lost:"")+".",
    plural(broken,"statement","statements")+" broken of "+heard+" heard.",
    plural(clues,"clue","clues")+" lifted from the room.",
    "Deductions proved: "+proved+" of "+required+".",
    "Minutes used: "+state.elapsedMinutes+" of "+state.clockMinutes+"."
  ];
  const masthead="THE MORNING EDITION",date=fitText("The morning after · alarm raised "+graph.bodyFound,SUBHEAD_MAX);
  const accused=state.accusation;
  if(state.verdict==="correct"&&accused){
    const who=surname(graph,accused.who).toUpperCase(),what=objectName(graph,accused.what).toUpperCase(),where=zoneName(graph,accused.where).toUpperCase();
    const headline=firstFitting([who+" HELD IN "+victim+" DEATH — "+what+", "+where,who+" HELD IN "+victim+" DEATH",who+" HELD"],HEADLINE_MAX);
    const subhead=fitText("Detective ties the "+objectName(graph,accused.what)+" in the "+zoneName(graph,accused.where)+" to "+surname(graph,accused.who),SUBHEAD_MAX);
    return {masthead,date,headline,subhead,columns:["Charged: "+surname(graph,accused.who)+", the "+zoneName(graph,accused.where)+", the "+objectName(graph,accused.what)+".",...columns],
      photoCaption:fitText(surname(graph,accused.who)+" leaves the "+zoneName(graph,accused.where)+" under escort.",SUBHEAD_MAX)};
  }
  if(state.verdict==="wrong"&&accused){
    const who=surname(graph,accused.who).toUpperCase();
    const headline=firstFitting(["WRONG CALL? "+who+" CHARGED IN "+victim+" DEATH","WRONG CALL? "+who+" CHARGED"],HEADLINE_MAX);
    const subhead=fitText("The record disagrees with the charge: "+objectName(graph,accused.what)+", "+zoneName(graph,accused.where),SUBHEAD_MAX);
    return {masthead,date,headline,subhead,columns:["The culprit escaped.",...columns],photoCaption:fitText(surname(graph,accused.who)+" is led from the house, protesting.",SUBHEAD_MAX)};
  }
  const headline=firstFitting([victim+" CASE GOES COLD","CASE GOES COLD"],HEADLINE_MAX);
  return {masthead,date,headline,subhead:fitText("The clock ran out before anyone was charged",SUBHEAD_MAX),columns:["No one was charged.",...columns],
    photoCaption:fitText("The "+victim.charAt(0)+victim.slice(1).toLowerCase()+" house, still unsolved.",SUBHEAD_MAX)};
}
