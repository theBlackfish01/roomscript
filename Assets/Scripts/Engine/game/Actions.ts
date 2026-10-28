import {CaseGraph, GameState, Id, Statement} from "../core/Types";

export function statementFacts(statement: Statement): Id[] {return typeof statement.asserts === "string" ? [statement.asserts] : statement.asserts.slice();}
export function getCurrentStatements(graph: CaseGraph, suspect: Id, layer: number, overrides: Record<string, Id> = {}): Statement[] {
  const topics = new Map<string, Statement>();
  for (const s of graph.statements) {
    if (s.speaker !== suspect || s.layer > layer || s.replacementFor) continue;
    const previous = topics.get(s.topic);
    if (!previous || s.layer > previous.layer) topics.set(s.topic, s);
  }
  for (const topic of Object.keys(overrides)) {
    const s = graph.statements.find(item => item.id === overrides[topic] && item.speaker === suspect && item.topic === topic && item.layer <= layer);
    if (s) topics.set(topic, s);
  }
  return Array.from(topics.values()).sort((a,b) => a.topic < b.topic ? -1 : a.topic > b.topic ? 1 : 0);
}
export function currentStatement(graph: CaseGraph, state: GameState, suspect: Id, topic: string): Statement | undefined {
  const ss = state.suspects[suspect];
  return ss && getCurrentStatements(graph,suspect,ss.layer,ss.topicOverrides).find(s => s.topic === topic);
}
export function knownRefs(state: GameState): Set<Id> {return new Set([...state.knowledge.evidenceIds, ...state.knowledge.statementIds]);}
