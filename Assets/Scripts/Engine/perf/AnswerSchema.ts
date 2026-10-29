import {AnswerMode, Emotion, FactSheet} from "../core/Types";
import {allSheetRefs} from "./FactSheetBuilder";

export const ANSWER_EMOTIONS: readonly Emotion[] = ["calm", "guarded", "irritated", "rattled", "smug", "grieving"];
export function answerTopics(sheet: FactSheet): string[] {
  return [...new Set(Object.keys(sheet.topicToRef).concat(["smalltalk", "unclear"]))].sort();
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
