import {AnswerMode, Emotion, FactSheet,CaseGraph,Answer} from "../core/Types";
import {allSheetRefs} from "./FactSheetBuilder";
import {performanceOptions,composePerformance,DirectorChoice} from "./PerformanceBank";

export const ANSWER_EMOTIONS: readonly Emotion[] = ["calm", "guarded", "irritated", "rattled", "smug", "grieving"];
export function answerTopics(sheet: FactSheet): string[] {
  return [...new Set(Object.keys(sheet.topicToRef).concat(["smalltalk", "unclear"]))].sort();
}
export function buildDirectorSchema(graph:CaseGraph,sheet:FactSheet,topic:string,mode:AnswerMode="answer"):Record<string,unknown> {
  const options=performanceOptions(graph,sheet,topic,mode);
  return {type:"object",additionalProperties:false,required:["variant","opener","tail","emotion"],properties:{variant:{type:"string",enum:options.variants.map(v=>v.id)},opener:{type:"string",enum:["none",...options.openers.map(r=>r.id)]},tail:{type:"string",enum:["none",...options.tails.map(r=>r.id)]},emotion:{type:"string",enum:ANSWER_EMOTIONS.slice()}}};
}
export function parseDirector(input:unknown,graph:CaseGraph,sheet:FactSheet,topic:string,mode:AnswerMode="answer"):Answer|undefined {
  try{const value=typeof input==="string"?JSON.parse(input):input;if(!value||typeof value!=="object"||Array.isArray(value)||Object.keys(value).sort().join(",")!=="emotion,opener,tail,variant")return undefined;
    if(![value.variant,value.opener,value.tail].every(x=>typeof x==="string")||!ANSWER_EMOTIONS.includes(value.emotion))return undefined;
    return composePerformance(graph,sheet,topic,mode,value as DirectorChoice);
  }catch{return undefined;}
}
export function buildAnswerSchema(sheet: FactSheet, mode: AnswerMode = "answer", lockedTopic?:string): Record<string, unknown> {
  const neutral = mode === "filler" || mode === "deflect" || mode === "lawyered";
  const refs = neutral ? ["none"] : [...new Set(allSheetRefs(sheet).map(ref => ref.ref).concat(["none"]))].sort();
  return {type: "object", additionalProperties: false, required: ["topic", "cites", "line", "emotion"],
    properties: {
      topic: {type: "string", enum: lockedTopic?[lockedTopic]:answerTopics(sheet)},
      cites: {type: "array", minItems: 1, maxItems: 2, uniqueItems: true, items: {type: "string", enum: refs}},
      line: {type: "string", minLength: 1, maxLength: 220},
      emotion: {type: "string", enum: ANSWER_EMOTIONS.slice()},
    }};
}
