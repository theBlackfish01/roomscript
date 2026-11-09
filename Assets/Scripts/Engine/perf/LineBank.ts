import {Answer, AnswerMode, CaseGraph, FactSheet, LineBankEntry} from "../core/Types";
import {selectPerformance} from "./PerformanceBank";
import {validateLine} from "./LineValidator";

export interface LineQuery {suspect: string; topic: string; layer: number; mode: AnswerMode;seq?:number;}

/** Validation disambiguates same-layer replacements; stale or hidden refs never become fallback speech. */
export function lookupLine(entries: readonly LineBankEntry[], query: LineQuery, sheet: FactSheet, graph: CaseGraph): Answer | undefined {
  if (query.suspect !== sheet.suspect || query.mode === "confession") return undefined;
  const performance=selectPerformance(graph,sheet,query.topic,query.mode,query.seq??0);
  // Start a new subject with its direct authored answer. Repeated questions can
  // use a varied performance; all paths still pass the same truth validator.
  const alreadyAnswered=sheet.recentLines.some(line=>line.includes(sheet.account.find(r=>r.topic===query.topic)?.text||"\u0000"));
  if(alreadyAnswered&&performance&&validateLine(performance,sheet,graph,query.mode).ok)return performance;
  const neutral = query.mode === "deflect" || query.mode === "lawyered" || query.mode === "filler";
  const candidates = entries.filter(entry => entry.suspect === query.suspect && entry.mode === query.mode
    && entry.layer <= query.layer && (entry.topic === query.topic || (neutral && entry.topic === "unclear")))
    .slice().sort((a, b) => b.layer - a.layer || compare(a.answer.cites.join("|"), b.answer.cites.join("|")) || compare(a.answer.line, b.answer.line));
  for (const entry of candidates) {
    const result = validateLine(entry.answer, sheet, graph, query.mode);
    if (result.ok) return result.answer;
  }
  return performance&&validateLine(performance,sheet,graph,query.mode).ok?performance:undefined;
}

/** Last deterministic floor. Overlong canonical claims produce a neutral deflection, never a truncated claim. */
export function canonicalFallback(sheet: FactSheet, topic: string, mode: AnswerMode = "answer"): Answer {
  const neutral = mode === "deflect" || mode === "lawyered" || mode === "filler";
  const account = sheet.account.find(ref => ref.topic === topic);
  const ref = mode === "press" ? sheet.pressed.find(item => item.of === account?.ref) : account;
  if (!neutral && mode !== "confession" && ref && ref.text.length <= 220 && !sheet.guarded.includes(topic)) {
    return {topic, cites: [ref.ref], line: ref.text, emotion: mode === "broken" ? "rattled" : "guarded"};
  }
  // These exact neutral lines share the authored bank's bundled recordings.
  return {topic: "unclear", cites: ["none"], line: mode === "filler" ? "Give me a moment to collect myself." : mode === "lawyered" ? "I have answered enough. Give me some space." : "Ask me something more specific.", emotion: "guarded"};
}
function compare(a: string, b: string): number {return a < b ? -1 : a > b ? 1 : 0;}
