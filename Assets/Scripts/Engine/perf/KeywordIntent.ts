import {CaseGraph, FactSheet} from "../core/Types";
import {answerTopics} from "./AnswerSchema";
import {buildGazetteer, findEntities, normalizedWords} from "./Gazetteer";

export interface KeywordResult {topic: string; matched: boolean; source: "keyword" | "fallback";}
export interface QuestionChip {topic: string; question: string;}
export function questionChips(sheet: FactSheet): QuestionChip[] {
  return sheet.account.map(ref => {
    const topic = ref.topic!;
    const question = topic.indexOf("where@") === 0 ? "Where were you at " + topic.slice(6) + "?"
      : topic === "baseline:name" ? "What is your name?"
      : topic.indexOf("baseline:") === 0 ? "Tell me about your " + topic.slice(9).replace(/_/g, " ") + "."
      : topic.indexOf("motive") === 0 ? "What was the motive?" : "Tell me about " + topic.replace(/^about:/, "") + ".";
    return {topic, question};
  });
}

/** Topic selection only: no claims, truth flags, tell decisions, or verdicts are inferred from text. */
export function keywordIntent(question: string, sheet: FactSheet, graph: CaseGraph): KeywordResult {
  const text = normalizedWords(question);
  const topics = answerTopics(sheet);
  const exact = topics.find(topic => normalizedWords(topic) === text);
  if (exact) return {topic: exact, matched: true, source: "keyword"};
  const choose = (predicate: (topic: string) => boolean): string | undefined => topics.find(predicate);
  let topic: string | undefined;
  if (/\b(name|introduce|who are you)\b/.test(text)) topic = choose(value => value === "baseline:name");
  if (!topic) {
    const baseline = sheet.account.find(ref => ref.topic!.indexOf("baseline:") === 0 && ref.topic !== "baseline:name"
      && text.includes(ref.topic!.slice(9).replace(/_/g, " ")));
    topic = baseline?.topic;
  }
  if (!topic && /\b(where|alibi|whereabouts|location)\b/.test(text)) topic = choose(value => value.indexOf("where@") === 0);
  if (!topic && /\b(motive|why|reason|trust accounts|blackmail)\b/.test(text)) topic = choose(value => value.indexOf("motive") === 0);
  if (!topic) {
    const mentions = findEntities(question, buildGazetteer(graph));
    for (const mention of mentions) {
      topic = choose(value => mention.ids.some(id => value === "about:" + id || value === "motive:" + id));
      if (topic) break;
    }
  }
  if (!topic && /\b(hello|hi|good evening|how are you)\b/.test(text)) topic = "smalltalk";
  return topic ? {topic, matched: true, source: "keyword"} : {topic: "unclear", matched: false, source: "fallback"};
}
