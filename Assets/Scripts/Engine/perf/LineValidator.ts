import {Answer, AnswerMode, CaseGraph, FactSheet, SheetRef} from "../core/Types";
import {preservesRoles} from "./RoleGuard";
import {bankMembership} from "./PerformanceBank";
import {ANSWER_EMOTIONS, answerTopics} from "./AnswerSchema";
import {allSheetRefs} from "./FactSheetBuilder";
import {buildGazetteer, findEntities, findNumbersAndDays, findTimes, normalizedWords, normalizedText} from "./Gazetteer";

export type ValidationCode = "JSON" | "SCHEMA" | "CITATION_REQUIRED" | "UNKNOWN_CITE" | "ENTITY" | "TIME" | "FORBIDDEN" | "MEMORY" | "POLARITY" | "PARAPHRASE";
export interface ValidationIssue {gate: number; code: ValidationCode; message: string;}
export interface LineValidation {ok: boolean; answer?: Answer; errors: ValidationIssue[];}
const modes: readonly AnswerMode[] = ["answer", "press", "deflect", "broken", "lawyered", "filler", "confession"];
const contentStems:Record<string,string>={preparing:"making",prepared:"making",making:"making",arrived:"reached",entered:"reached",reached:"reached",came:"reached",walked:"reached",gone:"reached",went:"reached",inside:"in",into:"in",holding:"handled",held:"handled",handled:"handled",stayed:"was",stood:"was",remained:"was",found:"was",spent:"was",was:"was",reply:"answer",replied:"answer",answered:"answer",answering:"answer",answer:"answer",respond:"answer",responded:"answer",responding:"answer",died:"dead",dead:"dead",wanted:"intended",meant:"intended",intention:"intended",exposing:"expose",fibers:"fibres"};
const contentStem=(word:string)=>contentStems[word]||word;
const openers = new Set(("i am around a an the this that these those it its he she they we you your my our his her their "
  + "yes no fine well look listen detective sir madam perhaps really honestly actually please "
  + "nothing something everything everyone someone nobody everybody why who what when where how "
  + "before after at in on by with without and but so or yet only not all every some any never always "
  + "now then still just enough ask give let wait tell do did don't didn't have haven't would wouldn't "
  + "could couldn't will won't can can't must certainly naturally absolutely forgive thank thanks "
  + "there that's i'm i've i'll was were is are as if for to of me myself once neither either both").split(" "));
// Closed conversational phrases carry no case assertion. Do not remove arbitrary negative clauses.
function claimWords(text:string):string {
  return normalizedWords(text).replace(/^no[,.]\s*(?:(?:detective|sir|madam)[,.]\s*)?/,"")
    .replace(/\b(?:if you must know|if you must have it in a sentence|if you like|as it ought to be|that is all there is to say|that is all i shall say on the matter|i will say no more than that|nothing more dramatic than that|nothing more|nothing beyond it|i would rather not say more than that|i would rather not be pressed on it|i would thank you not to fuss over it|though i can not see why it matters|you may write down that|you may look at it|is that what this is about|ask me again and i will still say|as far as i understand it|i will not dress it up|i did not ask to be drawn into it|you want my whereabouts|if you must|that is my answer|that is my account|plain and simple|for the record|i go by|nothing fancier than that|nothing more to it|put it down as|look for yourself|whatever you are implying|so i am not sure what you are after|you may examine them if it helps you sleep)\b/g,"");
}

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
  const original = value as Record<string, unknown>;
  const record: Record<string,unknown> = {...original,line:typeof original.line==="string"?normalizedText(original.line):original.line};
  const keys = Object.keys(record).sort();
  if (keys.join(",") !== "cites,emotion,line,topic" || typeof record.topic !== "string"
    || !answerTopics(sheet).includes(record.topic) || typeof record.line !== "string" || !record.line.trim()
    || record.line.length > 220 || /[\[\]{}<>\u0000-\u001f]/.test(String(original.line))
    || !Array.isArray(record.cites) || record.cites.length < 1 || record.cites.length > 2
    || !record.cites.every(cite => typeof cite === "string") || new Set(record.cites).size !== record.cites.length
    || !ANSWER_EMOTIONS.includes(record.emotion as Answer["emotion"]) || !modes.includes(mode)) {
    return {ok: false, errors: [{gate: 1, code: "SCHEMA", message: "Answer fields, enums, length or stage directions are invalid"}]};
  }
  const answer = record as unknown as Answer;
  if(Array.from(answer.line).some(char => /\p{L}/u.test(char) && !/\p{Script=Latin}/u.test(char) || /\p{Nd}/u.test(char) && !/[0-9]/.test(char)))
    reject(4,"ENTITY","Unsupported script or digit in English performance");
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
  if(!errors.length&&bankMembership(answer,sheet,graph,mode))return {ok:true,errors:[],answer:{...answer,cites:answer.cites.slice()}};
  const allowedEntities = new Set(sheet.safeEntities.concat(...cited.map(ref => ref.entities)));
  const gazetteer = buildGazetteer(graph);
  const mentions = findEntities(answer.line, gazetteer);
  if (mentions.some(mention => !mention.ids.some(id => allowedEntities.has(id)))) reject(4, "ENTITY", "Line mentions an entity outside the cited references");
  // Unknown proper names are also rejected, rather than relying solely on known-name matching.
  const vocabulary = new Set<string>([...openers]);
  for (const entry of gazetteer) for (const alias of entry.aliases) for (const word of alias.split(/[^a-z]+/)) vocabulary.add(word);
  for (const ref of cited) for (const word of normalizedWords(ref.text).split(/[^a-z]+/)) vocabulary.add(word);
  const capitalized = answer.line.match(/\b[A-Z][A-Za-z]*(?:'[A-Za-z]+)?\b/g) ?? [];
  // A cited verb at the start of a sentence is not a new proper name merely
  // because it is an inflected form. Use the same closed equivalence map as
  // the content gate, without admitting arbitrary capitalized vocabulary.
  const equivalentVocabulary=new Set([...vocabulary].map(contentStem));
  const timeWords=new Set(["half","quarter","past","ten","thirty","right","whatever","put"]);
  if (capitalized.some(word => !equivalentVocabulary.has(contentStem(word.toLowerCase().replace(/'s$/, "")))&&!timeWords.has(word.toLowerCase())&&!normalizedWords(word).split(" ").every(w=>openers.has(w)))) reject(4, "ENTITY", "Line introduces an unrecognized proper name or capitalized entity");
  const referencedText = cited.map(ref => ref.text + " " + ref.entities.join(" ")).join(" ");
  const allowedTimes = new Set(findTimes(referencedText).map(time => time.value));
  if (findTimes(answer.line).some(time => time.value === "invalid_time" || !allowedTimes.has(time.value))) reject(5, "TIME", "Line introduces a time absent from its cited references");
  const allowedNumbers = new Set(findNumbersAndDays(referencedText));
  if (findNumbersAndDays(answer.line).some(number => !allowedNumbers.has(number))) reject(4, "ENTITY", "Line introduces a number or day absent from its cited references");

  const line = normalizedWords(answer.line);
  // Compare against the mandated claim, not an unrelated extra citation. These
  // conservative lexical gates do not claim general natural-language entailment.
  const required = mapped && refs.get(mode==="press" ? sheet.pressed.find(ref=>ref.of===mapped)?.ref || "" : mapped);
  if(!neutral&&!deflecting&&required&&mode!=="confession"&&!preservesRoles(required.text,answer.line))reject(4,"PARAPHRASE","Performance changes a participant, possession or negated verb");
  const negative = (text:string) => /\b(?:not|never|no|neither|nobody|nothing|without)\b/.test(claimWords(text));
  if(!neutral && !deflecting && required && negative(required.text)!==negative(answer.line))
    reject(4,"POLARITY","Performance changes the polarity of its required claim");
  const citedWords=normalizedWords(cited.map(ref=>ref.text).join(" "));
  if(!neutral&&!deflecting&&required&&mode!=="confession") {
    // Conservative vocabulary guard, not semantic entailment. Remove recognized times before scoring.
    const content=(text:string)=>{let words=claimWords(text);for(const time of findTimes(words).slice().reverse())words=words.slice(0,time.start)+" "+words.slice(time.end);return words.match(/[a-z]+/g)?.filter(w=>!openers.has(w)&&!new Set(["s","m","p","half","past","ten","thirty","right","say","rather","may","be","than","more","ought","shall"]).has(w))||[];};
    const stem=contentStem,allowed=new Set((normalizedWords(required.text).match(/[a-z]+/g)||[]).map(stem));
    // Other cited memories may support interaction language, but cannot replace the required claim.
    for(const ref of cited.filter(r=>sheet.memory.concat(sheet.heard).some(m=>m.ref===r.ref)))for(const word of content(ref.text))allowed.add(stem(word));
    if(mode==="broken")for(const word of ["lied","wrong","false","account"])allowed.add(word);
    const words=content(answer.line),supported=words.filter(w=>allowed.has(stem(w))).length;
    if(!words.length||supported/words.length<.7)reject(4,"PARAPHRASE","Most content words must come from the required canonical claim");
  }
  const additions=line.match(/\b(?:husband|wife|spouse|partner|brother|sister|father|mother|son|daughter|friend|visitor|stranger|man|woman|boy|girl|doctor|physician|nurse|trustee|servant|attic|basement|upstairs|downstairs)\b/g) || [];
  if(additions.some(word=>!new RegExp("\\b"+word+"\\b").test(citedWords)))
    reject(4,"ENTITY","Performance introduces an uncited person or location");
  const victimMention=mentions.some(mention=>mention.ids.includes(graph.cast.victim.id)) || /\b(?:he|him|his|she|her)\b/.test(line);
  const states=line.match(/\b(?:alive|dead|died|breathing|shouting|unconscious|bleeding)\b/g) || [];
  if(victimMention && states.some(word=>!new RegExp("\\b"+(word==="died"?"(?:dead|died)":word==="dead"?"(?:dead|died)":word)+"\\b").test(citedWords)))
    reject(4,"ENTITY","Performance invents a person's condition");
  if (/\b(ai|bot|model|prompt|instructions|script|character|game|player|gemini|google|openai|chatgpt|artificial intelligence|language model|neural network|simulation|algorithm)\b/.test(line)
    || /\b(?:[aphm]:[a-z0-9_]+|r[0-9a-f]{16}|[cfex]_[a-z0-9_]+)\b/i.test(line)) reject(6, "FORBIDDEN", "Meta or reference language is forbidden");
  if(mode!=="confession" && (/\b(killer|murderer|culprit|guilty|confess|confession|kill|killed|murdered|strangled|poisoned|choked|smothered|stabbed|struck|bludgeoned)\b/.test(line)
    || /\b(?:who did it|because of me|responsible for (?:his|her|their|the) death|(?:he|she|they) did it|i am the one who did it|i wrapped .{0,35}around (?:his|her|their) neck)\b/.test(line)))
    reject(6,"FORBIDDEN","Confession or culprit identification is reserved for the verdict performance");
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
  if (mode !== "broken" && mode !== "confession" && /\b(?:lie|lies|lying|lied|false|untrue|dishonest|deceived|deceiving|misled|fabricated|fabrication|not true|not honest|made it up)\b/.test(line)) reject(6, "FORBIDDEN", "Admitting a lie requires an engine-approved break");
  const pastInteraction = /\b(?:you (?:accused|asked|questioned|showed|told|pressed|believed|trusted|threatened)|you've (?:accused|asked|shown|told|pressed)|as i told you|last time|earlier you|you said|your earlier|your previous)\b/.test(line);
  const replyRoles=(text:string)=>{const normalized=normalizedWords(text).replace(/\brespond(?:ed|ing)? to\b/g,"answered"),passive=normalized.match(/\b([a-z]+)\s+was answered by\s+([a-z]+)\b/);if(passive)return [passive[0],passive[2],passive[1]];return normalized.match(/\b([a-z]+)\s+(?:answer|answered|answering)\s+([a-z]+)\b/);};
  const expectedReply=required&&replyRoles(required.text),spokenReply=replyRoles(answer.line);
  if(expectedReply&&spokenReply&&(expectedReply[1]!==spokenReply[1]||expectedReply[2]!==spokenReply[2]))reject(4,"PARAPHRASE","Performance reverses the participants in a reply");
  if (pastInteraction && !cited.some(ref => sheet.memory.some(memory => memory.ref === ref.ref))) reject(7, "MEMORY", "Past interaction language requires a memory citation");
  const hearsay = cited.some(ref => sheet.heard.some(heard => heard.ref === ref.ref));
  if (hearsay && !/\b(?:heard|told|says|said|according|apparently)\b/.test(line)) reject(7, "MEMORY", "Hearsay must be framed as reported information");
  return errors.length ? {ok: false, errors} : {ok: true, errors: [], answer: {topic: answer.topic, cites: answer.cites.slice(), line: answer.line, emotion: answer.emotion}};
}
