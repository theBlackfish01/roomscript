import {CaseGraph, FactSheet, GameState, Id, SheetRef} from "../core/Types";
import {getCurrentStatements} from "../game/Actions";
import {performanceRef} from "./ReferenceIds";

export function buildFactSheet(graph: CaseGraph, state: GameState, suspect: Id): FactSheet {
  const person = graph.cast.suspects.find(item => item.id === suspect);
  const current = state.suspects[suspect];
  if (!person || !current || state.caseId !== graph.caseId) throw new Error("Cannot build a sheet for an unknown suspect or case");
  const statements = getCurrentStatements(graph, suspect, current.layer, current.topicOverrides);
  const account: SheetRef[] = statements.map(statement => ({ref: performanceRef("a",statement.id), topic: statement.topic,
    text: statement.canonical, entities: statement.entities.slice()}));
  const pressed: SheetRef[] = statements.filter(statement => !!statement.pressed).map(statement => ({ref: performanceRef("p",statement.id),
    topic: statement.topic, of: performanceRef("a",statement.id), text: statement.pressed!.canonical, entities: statement.pressed!.entities.slice()}));
  const heard: SheetRef[] = current.heard.map(ref => ({ref: performanceRef("h",ref.id), text: ref.text, entities: ref.entities.slice(), source: ref.source}));
  const memory: SheetRef[] = current.memory.map(ref => ({ref: performanceRef("m",ref.id), text: ref.text, entities: ref.entities.slice(), source: ref.source}));
  const refs = new Set(account.concat(pressed, heard, memory).map(ref => ref.ref));
  if(refs.size!==account.length+pressed.length+heard.length+memory.length) throw new Error("Duplicate performer reference");
  const topicToRef: Record<string, string> = {};
  for (const ref of account) Object.defineProperty(topicToRef, ref.topic!, {value: ref.ref, enumerable: true, writable: true, configurable: true});
  const recentLines = state.events.filter(event => event.type === "lineSpoken" && event.actor === suspect
    && typeof event.text === "string" && event.refs && !event.refs.includes("none") && event.refs.every(ref => refs.has(ref) || ref === "none"))
    .slice(-3).map(event => event.text!);
  return {
    suspect, name: person.name, persona: person.persona, era: graph.era,
    mood: {composure: current.composure, composureMax: current.composureMax, rapport: current.rapport,
      respect: current.respect, emotion: current.composure <= 1 ? "rattled" : current.rapport < 0 ? "irritated" : "guarded"},
    account, pressed,
    // Current account statements are the approved knowledge. Never send raw witnessed
    // facts: a witnessed secret can contradict the cover account the model must perform.
    knows: [], heard, memory,
    guarded: current.lawyeredUntil > state.elapsedMinutes ? account.map(ref => ref.topic!) : [],
    saidSoFar: current.saidSoFar.map(id => refs.has(id) ? id : performanceRef("a",id)).filter(id => refs.has(id)),
    recentLines, safeEntities: [suspect, "detective"], topicToRef,
  };
}

export function allSheetRefs(sheet: FactSheet): SheetRef[] {
  return sheet.account.concat(sheet.pressed, sheet.knows, sheet.heard, sheet.memory);
}
