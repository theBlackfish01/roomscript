import {Answer,AnswerMode,CaseGraph,FactSheet,VariantEntry,RegisterEntry} from "../core/Types";
import {buildGazetteer,findEntities,findTimes,findNumbersAndDays,normalizedWords,GazetteerEntry} from "./Gazetteer";
import {Prng} from "../core/Prng";
export type {VariantEntry,RegisterEntry} from "../core/Types";
export interface DirectorChoice {variant:string;opener:string;tail:string;emotion:Answer["emotion"];}
/** Conservative discourse vocabulary. Registers carry no case predicates. */
const discourse=new Set("ah hm hmm well really quite detective please thank thanks you your me my i am was would could may might shall should can will do be is it that this the a an and but or so for to of with as if then now just only very rather more much yes perhaps certainly honestly frankly listen listening enough again slowly write down put understand pardon forgive excuse suppose see say saying said answer question asking ask matter concern concerns specific collect myself moment space need have answered let think fine indeed dear good heavens gracious goodness how observant trust suffice".split(" "));
const grammar=new Set("i am was would could may might shall should can will do be is are were been it that this these those the a an and but or so for to of with as if then now just only very rather more much you your me my our its at in on by from before after all both has have had did there s".split(" "));
interface RegisterContext {gazetteer:GazetteerEntry[];caseWords:Set<string>;}
function registerContext(graph:CaseGraph):RegisterContext {
  return {gazetteer:buildGazetteer(graph),caseWords:new Set(graph.statements.flatMap(s=>(normalizedWords(s.canonical).match(/[a-z]+/g)||[]).filter(w=>!grammar.has(w))))};
}
function assertionFreeWithContext(text:string,context:RegisterContext):boolean {
  const words=normalizedWords(text);
  if(!text.trim()||text.length>90||findEntities(text,context.gazetteer).some(e=>e.ids.some(id=>id!=="detective"))||findTimes(text).length||findNumbersAndDays(text).length)return false;
  if(/\b(?:not|no|never|nothing|nobody|without|dead|alive|kill|killed|murder|lie|lied|guilty|he|she|him|her|they|them|his|their)\b/.test(words))return false;
  if((words.match(/[a-z]+/g)||[]).some(w=>context.caseWords.has(w)))return false;
  return (words.match(/[a-z]+/g)||[]).every(w=>discourse.has(w));
}
export function assertionFree(text:string,graph:CaseGraph):boolean {return assertionFreeWithContext(text,registerContext(graph));}
function variantOptions(graph:CaseGraph,sheet:FactSheet,topic:string,mode:AnswerMode):VariantEntry[] {
  const account=sheet.topicToRef[topic],ref=mode==="press"?sheet.pressed.find(r=>r.of===account)?.ref:account;
  return (graph.performances?.variants||[]).filter(v=>v.suspect===sheet.suspect&&v.ref===ref&&(v.mode===mode||mode==="broken"&&v.mode==="answer"));
}
export function performanceOptions(graph:CaseGraph,sheet:FactSheet,topic:string,mode:AnswerMode):{variants:VariantEntry[];openers:RegisterEntry[];tails:RegisterEntry[]} {
  const variants=variantOptions(graph,sheet,topic,mode);
  const candidates=(graph.performances?.register||[]).filter(r=>r.suspect===sheet.suspect);
  const context=candidates.length?registerContext(graph):undefined;
  const registers=candidates.filter(r=>assertionFreeWithContext(r.text,context!));
  return {variants,openers:registers.filter(r=>r.kind==="opener"),tails:registers.filter(r=>r.kind==="tail")};
}
export function composePerformance(graph:CaseGraph,sheet:FactSheet,topic:string,mode:AnswerMode,choice:DirectorChoice):Answer|undefined {
  const options=performanceOptions(graph,sheet,topic,mode),variant=options.variants.find(v=>v.id===choice.variant);
  if(!variant)return undefined;
  const opener=choice.opener==="none"?"":options.openers.find(r=>r.id===choice.opener)?.text;
  const tail=choice.tail==="none"?"":options.tails.find(r=>r.id===choice.tail)?.text;
  if(opener===undefined||tail===undefined)return undefined;
  const line=[opener,variant.text,tail].filter(Boolean).join(" ");if(line.length>220)return undefined;
  return {topic,cites:[variant.ref],line,emotion:choice.emotion};
}
export function selectPerformance(graph:CaseGraph,sheet:FactSheet,topic:string,mode:AnswerMode,seq:number):Answer|undefined {
  const variants=variantOptions(graph,sheet,topic,mode);if(!variants.length)return undefined;
  const fresh=variants.filter(v=>!sheet.recentLines.some(line=>line.includes(v.text)));
  const candidates=fresh.length?fresh:variants;
  const mood=candidates.filter(v=>v.emotion===sheet.mood.emotion);
  const v=new Prng(graph.caseId,"performance:"+seq+":"+sheet.suspect+":"+topic).pick(mood.length?mood:candidates);
  return v.text.length<=220?{topic,cites:[v.ref],line:v.text,emotion:v.emotion}:undefined;
}
export function bankMembership(answer:Answer,sheet:FactSheet,graph:CaseGraph,mode:AnswerMode):boolean {
  if(answer.cites.length!==1||answer.line.length>220)return false;
  const variants=variantOptions(graph,sheet,answer.topic,mode);
  if(variants.some(v=>v.ref===answer.cites[0]&&v.text===answer.line))return true;
  if(!variants.some(v=>v.ref===answer.cites[0]))return false;
  const options=performanceOptions(graph,sheet,answer.topic,mode);
  const openers=["",...options.openers.map(o=>o.text)],tails=["",...options.tails.map(t=>t.text)];
  // Validate registers once per lookup. Calling composePerformance in this loop
  // rebuilt the complete case vocabulary for every possible combination.
  return options.variants.some(v=>answer.cites[0]===v.ref&&openers.some(opener=>tails.some(tail=>[opener,v.text,tail].filter(Boolean).join(" ")===answer.line)));
}
