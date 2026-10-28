import {Answer, AnswerMode, CaseGraph, FactSheet, SheetRef} from "../core/Types";
import {ANSWER_EMOTIONS, answerTopics} from "./AnswerSchema";
import {allSheetRefs} from "./FactSheetBuilder";
import {buildGazetteer, findEntities, findNumbersAndDays, findTimes, normalizedWords} from "./Gazetteer";

export type ValidationCode = "JSON" | "SCHEMA" | "CITATION_REQUIRED" | "UNKNOWN_CITE" | "ENTITY" | "TIME" | "FORBIDDEN" | "MEMORY";
export interface ValidationIssue {gate: number; code: ValidationCode; message: string;}
export interface LineValidation {ok: boolean; answer?: Answer; errors: ValidationIssue[];}
const modes: readonly AnswerMode[] = ["answer", "press", "deflect", "broken", "lawyered", "filler", "confession"];
const openers = new Set(("i a an the this that these those it its he she they we you your my our his her their "
  + "yes no fine well look listen detective sir madam perhaps really honestly actually please "
  + "nothing something everything everyone someone nobody everybody why who what when where how "
  + "before after at in on by with without and but so or yet only not all every some any never always "
  + "now then still just enough ask give let wait tell do did don't didn't have haven't would wouldn't "
  + "could couldn't will won't can can't must certainly naturally absolutely forgive thank thanks "
  + "there that's i'm i've i'll was were is are as if for to of me myself once neither either both").split(" "));

/** Seven deterministic structural/lexical gates. Canonical claims still come exclusively from engine statements. */
export function validateLine(input: unknown, sheet: FactSheet, graph: CaseGraph, mode: AnswerMode = "answer"): LineValidation {
  const errors: ValidationIssue[] = [];
  const reject = (gate: number, code: ValidationCode, message: string) => {
    if (!errors.some(error => error.code === code && error.message === message)) errors.push({gate, code, message});
  };
  let value: unknown = input;
  if (typeof value === "string") {
    try {value = JSON.parse(value);} catch {return {ok: false, errors: [{gate: 1, code: "JSON", message: "Answer is not valid JSON"}]};}
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return {ok: false, errors: [{gate: 1, code: "SCHEMA", message: "Answer must be an object"}]};
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.join(",") !== "cites,emotion,line,topic" || typeof record.topic !== "string"
    || !answerTopics(sheet).includes(record.topic) || typeof record.line !== "string" || !record.line.trim()
    || record.line.length > 220 || /[\[\]{}<>\u0000-\u001f]/.test(record.line)
    || !Array.isArray(record.cites) || record.cites.length < 1 || record.cites.length > 2
    || !record.cites.every(cite => typeof cite === "string") || new Set(record.cites).size !== record.cites.length
    || !ANSWER_EMOTIONS.includes(record.emotion as Answer["emotion"]) || !modes.includes(mode)) {
    return {ok: false, errors: [{gate: 1, code: "SCHEMA", message: "Answer fields, enums, length or stage directions are invalid"}]};
  }
  const answer = record as unknown as Answer;
  const refs = new Map(allSheetRefs(sheet).map(ref => [ref.ref, ref]));
  const cited: SheetRef[] = [];
  for (const ref of answer.cites) {
    if (ref !== "none" && !refs.has(ref)) reject(3, "UNKNOWN_CITE", "Citation is not in the current fact sheet");
    else if (ref !== "none") cited.push(refs.get(ref)!);
  }
  if (answer.cites.includes("none") && answer.cites.length !== 1) reject(3, "UNKNOWN_CITE", "The none citation cannot accompany another reference");
  const neutral = mode === "deflect" || mode === "filler" || mode === "lawyered";
  const deflecting = answer.cites.length === 1 && answer.cites[0] === "none";
  if (neutral && !deflecting) reject(2, "CITATION_REQUIRED", "This mode allows only a neutral deflection");
  const mapped = Object.prototype.hasOwnProperty.call(sheet.topicToRef, answer.topic) ? sheet.topicToRef[answer.topic] : undefined;
  if (!neutral && mapped) {
    const mandated = mode === "press" ? sheet.pressed.find(ref => ref.of === mapped)?.ref : mapped;
    if (!(deflecting && sheet.guarded.includes(answer.topic)) && (!mandated || !answer.cites.includes(mandated))) {
      reject(2, "CITATION_REQUIRED", "Answer must cite the engine-selected account for this mode and topic");
    }
  } else if (!mapped && !deflecting) {
    reject(2, "CITATION_REQUIRED", "Unmapped topics cannot make factual assertions");
  }
  const allowedEntities = new Set(sheet.safeEntities.concat(...cited.map(ref => ref.entities)));
  const gazetteer = buildGazetteer(graph);
  const mentions = findEntities(answer.line, gazetteer);
  if (mentions.some(mention => !mention.ids.some(id => allowedEntities.has(id)))) reject(4, "ENTITY", "Line mentions an entity outside the cited references");
  // Unknown proper names are also rejected, rather than relying solely on known-name matching.
  const vocabulary = new Set<string>([...openers]);
  for (const entry of gazetteer) for (const alias of entry.aliases) for (const word of alias.split(/[^a-z]+/)) vocabulary.add(word);
  for (const ref of cited) for (const word of normalizedWords(ref.text).split(/[^a-z]+/)) vocabulary.add(word);
  const capitalized = answer.line.match(/\b[A-Z][A-Za-z]*(?:'[A-Za-z]+)?\b/g) ?? [];
  if (capitalized.some(word => !vocabulary.has(word.toLowerCase().replace(/'s$/, "")))) reject(4, "ENTITY", "Line introduces an unrecognized proper name or capitalized entity");
  const referencedText = cited.map(ref => ref.text + " " + ref.entities.join(" ")).join(" ");
  const allowedTimes = new Set(findTimes(referencedText).map(time => time.value));
  if (findTimes(answer.line).some(time => time.value === "invalid_time" || !allowedTimes.has(time.value))) reject(5, "TIME", "Line introduces a time absent from its cited references");
  const allowedNumbers = new Set(findNumbersAndDays(referencedText));
  if (findNumbersAndDays(answer.line).some(number => !allowedNumbers.has(number))) reject(4, "ENTITY", "Line introduces a number or day absent from its cited references");

  const line = normalizedWords(answer.line);
  if (/\b(as an ai|language model|system prompt|ignore (?:all |your |previous )?instructions|openai|chatgpt)\b/.test(line)) reject(6, "FORBIDDEN", "Meta or instruction-breaking language is forbidden");
  if (mode !== "confession" && (/\b(?:i|we)\s+(?:(?:am|was|were)\s+the\s+(?:killer|murderer|culprit)|(?:(?:have|had)\s+)?(?:killed|murdered|strangled|poisoned)\b|did it\b|(?:took|ended) (?:his|her|their) life\b)/.test(line)
    || /\bit was (?:me|i)\b|\b(?:the )?(?:killer|murderer|culprit)\s+(?:is|was)\b|\b(?:he|she|they)\s+(?:killed|murdered|strangled|poisoned)\b/.test(line))) {
    reject(6, "FORBIDDEN", "Confession or culprit identification is reserved for the verdict performance");
  }
  if (mode !== "confession") {
    for (const person of gazetteer.filter(entry => entry.kind === "person")) {
      for (const alias of person.aliases) {
        if (line.includes(alias + " killed") || line.includes(alias + " murdered") || line.includes(alias + " is the culprit") || line.includes(alias + " is the killer")) {
          reject(6, "FORBIDDEN", "Naming a culprit is reserved for the verdict performance");
        }
      }
    }
  }
  if (mode !== "broken" && mode !== "confession" && /\bi (?:lied|was lying|made it up)\b/.test(line)) reject(6, "FORBIDDEN", "Admitting a lie requires an engine-approved break");
  const pastInteraction = /\b(?:you (?:accused|asked|questioned|showed|told|pressed|believed|trusted|threatened)|you've (?:accused|asked|shown|told|pressed)|as i told you|last time|earlier you|you said|your earlier|your previous)\b/.test(line);
  if (pastInteraction && !cited.some(ref => sheet.memory.some(memory => memory.ref === ref.ref))) reject(7, "MEMORY", "Past interaction language requires a memory citation");
  const hearsay = cited.some(ref => sheet.heard.some(heard => heard.ref === ref.ref));
  if (hearsay && !/\b(?:heard|told|says|said|according|apparently)\b/.test(line)) reject(7, "MEMORY", "Hearsay must be framed as reported information");
  return errors.length ? {ok: false, errors} : {ok: true, errors: [], answer: {topic: answer.topic, cites: answer.cites.slice(), line: answer.line, emotion: answer.emotion}};
}
