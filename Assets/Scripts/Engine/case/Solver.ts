import {CaseGraph, Fact, Hypothesis, Id, PlayerKnowledge, SolverCode, SolverIssue, SolverReport, Statement} from "../core/Types";

type Support = Id[];
type SupportMap = Record<Id, Support[]>;
export interface ReachableKnowledge {
  facts: Fact[]; factIds: Id[]; refIds: Id[];
  /** Primitive acquisition references needed for each observation. No cyclic self-support. */
  supports: SupportMap; factSupports: SupportMap;
}
export interface ReachabilityOptions {includeBeats?: boolean; beatIds?: Id[];}
export interface KnowledgeSolution {hypotheses: Hypothesis[]; eliminated: {suspects: Id[]; zones: Id[]; weapons: Id[]};}
interface Package {roots: Id[]; covers: number[]; sources: string[];}

const sorted = (items: readonly string[]): string[] => Array.from(new Set(items)).sort();
const subset = (a: readonly string[], b: readonly string[]): boolean => a.every(x => b.includes(x));
const merge = (...parts: readonly string[][]): string[] => sorted(parts.reduce<string[]>((all, part) => all.concat(part), []));
export function statementFacts(statement: Statement): Id[] {return Array.isArray(statement.asserts) ? statement.asserts : [statement.asserts];}
const hypothesisKey = (h: Hypothesis): string => JSON.stringify([h.who, h.where, h.what]);
const sameHypothesis = (a: Hypothesis, b: Hypothesis): boolean => hypothesisKey(a) === hypothesisKey(b);

export function enumerateHypotheses(graph: CaseGraph): Hypothesis[] {
  const hypotheses: Hypothesis[] = [];
  for (const who of graph.cast.suspects.map(s => s.id).slice().sort())
    for (const where of graph.room.zones.map(z => z.id).slice().sort())
      for (const what of graph.weapons.slice().sort()) hypotheses.push({who, where, what});
  return hypotheses;
}

function coversSlot(fact: Fact, slot: number): boolean {
  return fact.slot !== undefined ? fact.slot === slot : fact.slotRange ? fact.slotRange[0] <= slot && slot <= fact.slotRange[1] : true;
}

/** Open-world constraint checking: absence of a fact is never evidence. Cover facts are ignored. */
export function consistent(h: Hypothesis, knownFacts: readonly Fact[], graph: CaseGraph): boolean {
  if (!graph.cast.suspects.some(s => s.id === h.who) || !graph.room.zones.some(z => z.id === h.where) || !graph.weapons.includes(h.what)) return false;
  for (const fact of knownFacts) {
    if (!fact.truth || !coversSlot(fact, graph.murderSlot)) continue;
    const a = fact.args;
    const who = a.who; const zone = a.zone; const obj = a.obj;
    switch (fact.pred) {
      case "at":
        if ((who === h.who || who === graph.cast.victim.id) && zone !== h.where) return false;
        break;
      case "not_at":
        if ((who === h.who || who === graph.cast.victim.id) && zone === h.where) return false;
        break;
      case "in": if (obj === h.what && zone !== h.where) return false; break;
      case "not_in": if (obj === h.what && zone === h.where) return false; break;
      case "not_touched": if (who === h.who && obj === h.what) return false; break;
      case "eliminates": if ([h.who, h.where, h.what].includes(String(a.card))) return false; break;
      // A person may touch many objects; touching one does not establish murder exclusivity.
      // State/motive/witness facts affect narrative or unlock evidence, never imply guilt by themselves.
      default: break;
    }
  }
  return true;
}

function addSupport(map: SupportMap, id: Id, proposed: readonly Id[]): boolean {
  const support = sorted(proposed);
  const previous = map[id] || [];
  if (previous.some(value => subset(value, support))) return false;
  map[id] = previous.filter(value => !subset(support, value)).concat([support]);
  return true;
}
function combine(options: Support[][]): Support[] {
  let result: Support[] = [[]];
  for (const list of options) {
    if (!list.length) return [];
    const next: SupportMap = {};
    for (const prior of result) for (const choice of list) addSupport(next, "combined", merge(prior, choice));
    result = next.combined || [];
  }
  return result;
}
function activatedBeats(graph: CaseGraph, options: ReachabilityOptions): Id[] {
  if (options.beatIds) return sorted(options.beatIds);
  return options.includeBeats === false ? [] : graph.beats.filter(b => b.guaranteed).map(b => b.id);
}
function allFacts(graph: CaseGraph, beats: readonly Id[]): Fact[] {
  return graph.facts.concat(graph.beats.filter(b => beats.includes(b.id)).reduce<Fact[]>((facts, beat) => facts.concat(beat.addsFacts || []), []));
}

/** Fixed point over observations and breaker paths. Higher layers are not assumed available. */
export function reachableKnowledge(graph: CaseGraph, options: ReachabilityOptions = {}): ReachableKnowledge {
  const beats = activatedBeats(graph, options);
  const facts = allFacts(graph, beats);
  const factById = new Map(facts.map(f => [f.id, f]));
  const supports: SupportMap = {}; const layerSupports: SupportMap = {};
  for (const suspect of graph.cast.suspects) addSupport(layerSupports, suspect.id + ":0", []);
  let changed = true;
  while (changed) {
    changed = false;
    for (const evidence of graph.evidence) {
      const revealing = graph.beats.filter(b => beats.includes(b.id) && b.reveals.includes(evidence.id));
      if (!evidence.proves.every(id => factById.get(id)?.truth === true)) continue;
      if (!evidence.latent) changed = addSupport(supports, evidence.id, [evidence.id]) || changed;
      else for (const beat of revealing) for (const requirements of combine((beat.requires || []).map(ref => supports[ref] || [])))
        changed = addSupport(supports, evidence.id, merge(requirements, [evidence.id])) || changed;
    }
    for (const statement of graph.statements) {
      if (!statement.replacementFor) for (const unlock of layerSupports[statement.speaker + ":" + statement.layer] || [])
        changed = addSupport(supports, statement.id, merge(unlock, [statement.id])) || changed;
      if (statement.stance !== "cover" || !statement.onBreak || !supports[statement.id]) continue;
      const target = graph.statements.find(s => s.id === statement.onBreak);
      if (!target || target.speaker !== statement.speaker || target.layer < statement.layer) continue;
      for (const breaker of statement.breakers) {
        if (!breaker.length) continue;
        const paths = combine(breaker.map(ref => {
          const claim = graph.statements.find(s => s.id === ref);
          return claim && (claim.stance !== "truth" || !statementFacts(claim).every(id => factById.get(id)?.truth)) ? [] : supports[ref] || [];
        }));
        for (const source of supports[statement.id]) for (const path of paths) {
          const combined = merge(source, path);
          changed = addSupport(supports, target.id, combined) || changed;
          if (target.layer > statement.layer) changed = addSupport(layerSupports, target.speaker + ":" + target.layer, combined) || changed;
        }
      }
    }
  }
  const factSupports: SupportMap = {};
  for (const evidence of graph.evidence) for (const path of supports[evidence.id] || []) for (const fact of evidence.proves)
    if (factById.get(fact)?.truth) addSupport(factSupports, fact, path);
  for (const statement of graph.statements) if (statement.stance === "truth")
    for (const path of supports[statement.id] || []) for (const fact of statementFacts(statement))
      if (factById.get(fact)?.truth) addSupport(factSupports, fact, path);
  const factIds = Object.keys(factSupports).sort();
  return {facts: factIds.map(id => factById.get(id)!), factIds, refIds: Object.keys(supports).sort(), supports, factSupports};
}

/** Player mode only uses observations already acquired, never the envelope or reachable future clues. */
export function solvePlayerKnowledge(graph: CaseGraph, knowledge: PlayerKnowledge): KnowledgeSolution {
  const known = new Set(knowledge.factIds);
  for (const evidence of graph.evidence) if (knowledge.evidenceIds.includes(evidence.id)) for (const id of evidence.proves) known.add(id);
  for (const statement of graph.statements) if (statement.stance === "truth" && knowledge.statementIds.includes(statement.id))
    for (const id of statementFacts(statement)) known.add(id);
  const facts = allFacts(graph, graph.beats.map(b=>b.id)).filter(f => f.truth && known.has(f.id));
  const hypotheses = enumerateHypotheses(graph).filter(h => consistent(h, facts, graph));
  return {hypotheses, eliminated: {
    suspects: graph.cast.suspects.map(s => s.id).filter(id => !hypotheses.some(h => h.who === id)),
    zones: graph.room.zones.map(z => z.id).filter(id => !hypotheses.some(h => h.where === id)),
    weapons: graph.weapons.filter(id => !hypotheses.some(h => h.what === id))
  }};
}

function sourceFor(graph: CaseGraph, ref: Id): string {
  const evidence = graph.evidence.find(e => e.id === ref);
  if (evidence) return "witness:" + evidence.holder;
  const statement = graph.statements.find(s => s.id === ref);
  return statement ? "witness:" + statement.speaker : "unknown:" + ref;
}
function factsFromRoots(reachable: ReachableKnowledge, roots: readonly Id[]): Fact[] {
  return reachable.facts.filter(f => reachable.factSupports[f.id].some(path => subset(path, roots)));
}
function packagesFor(graph: CaseGraph, reachable: ReachableKnowledge, hypotheses: Hypothesis[]): Package[] {
  const result = new Map<string, Package>();
  for (const paths of Object.values(reachable.factSupports)) for (const roots of paths) {
    const facts = factsFromRoots(reachable, roots);
    const covers = hypotheses.map((h, i) => consistent(h, facts, graph) ? -1 : i).filter(i => i >= 0);
    if (!covers.length) continue;
    const sources = sorted(roots.map(ref => sourceFor(graph, ref)));
    // Different root bundles can share a witness but have different costs or shared prerequisites.
    const key = JSON.stringify(roots);
    const previous = result.get(key);
    if (!previous || roots.length < previous.roots.length) result.set(key, {roots, covers, sources});
  }
  return Array.from(result.values()).sort((a, b) => b.covers.length - a.covers.length || a.roots.join().localeCompare(b.roots.join()));
}

/** Prove up to two source-disjoint routes; shared holders/speakers never count twice. */
function independentRoutes(packages: Package[], target: number[]): number {
  if (!target.length) return 0;
  const targetSet = new Set(target);
  const candidates = packages.map(p => ({...p, covers: p.covers.filter(i => targetSet.has(i))})).filter(p => p.covers.length);
  const routes: string[][] = []; const visited = new Set<string>();
  let foundPair = false;
  const visit = (covered: Set<number>, sources: string[]): void => {
    if (foundPair) return;
    const key = sources.join("|");
    if (visited.has(key)) return;
    visited.add(key);
    if (routes.some(route => subset(route, sources))) return;
    const missing = target.filter(i => !covered.has(i));
    if (!missing.length) {
      if (routes.some(route => !route.some(source => sources.includes(source)))) {foundPair = true; return;}
      for (let i = routes.length - 1; i >= 0; i--) if (subset(sources, routes[i])) routes.splice(i, 1);
      routes.push(sources); return;
    }
    const next = missing.slice().sort((a, b) => candidates.filter(p => p.covers.includes(a)).length - candidates.filter(p => p.covers.includes(b)).length)[0];
    for (const candidate of candidates.filter(p => p.covers.includes(next))) {
      const nextSources = merge(sources, candidate.sources);
      const nextCovered = new Set(covered);
      // All observations from already selected source bundles may be used on this route.
      for (const available of candidates) if (subset(available.sources, nextSources)) for (const index of available.covers) nextCovered.add(index);
      visit(nextCovered, nextSources);
    }
  };
  visit(new Set(), []);
  return foundPair ? 2 : routes.length ? 1 : 0;
}

function acquisitionCost(graph: CaseGraph, roots: readonly Id[]): number {
  const holders: Record<string, number> = {}; let cost = 0;
  for (const ref of roots) {
    const evidence = graph.evidence.find(e => e.id === ref);
    if (evidence) holders[evidence.holder] = Math.max(holders[evidence.holder] || 0, evidence.costMinutes ?? 0);
    else cost += graph.statements.find(s => s.id === ref)?.costMinutes ?? 15;
  }
  return cost + Object.values(holders).reduce((sum, value) => sum + value, 0);
}

/** Exact branch-and-bound set cover over obtainable proof bundles, weighted by acquisition actions. */
export function minimumCostRoute(graph: CaseGraph, reachable: ReachableKnowledge = reachableKnowledge(graph, {includeBeats: false})): {minutes: number; refs: Id[]} {
  const hypotheses = enumerateHypotheses(graph);
  const solutions = hypotheses.filter(h => consistent(h, reachable.facts, graph));
  if (solutions.length !== 1) return {minutes: Infinity, refs: []};
  const target = hypotheses.map((h, i) => sameHypothesis(h, solutions[0]) ? -1 : i).filter(i => i >= 0);
  const packages = packagesFor(graph, reachable, hypotheses);
  let bestCost = Infinity; let bestRoots: Id[] = [];
  const visited = new Set<string>();
  const visit = (roots: Id[]): void => {
    const key = roots.join("|"); if (visited.has(key)) return; visited.add(key);
    const cost = acquisitionCost(graph, roots); if (cost >= bestCost) return;
    const facts = factsFromRoots(reachable, roots);
    const missing = target.filter(i => consistent(hypotheses[i], facts, graph));
    if (!missing.length) {bestCost = cost; bestRoots = roots; return;}
    const next = missing.slice().sort((a,b) => packages.filter(p => p.covers.includes(a)).length - packages.filter(p => p.covers.includes(b)).length)[0];
    const choices = packages.filter(p => p.covers.includes(next)).map(p => merge(roots, p.roots));
    choices.sort((a,b) => acquisitionCost(graph,a)-acquisitionCost(graph,b) || a.length-b.length || a.join().localeCompare(b.join()));
    for (const choice of choices) visit(choice);
  };
  visit([]);
  return {minutes: bestCost, refs: bestRoots};
}

function interval(f: Fact, graph: CaseGraph): [number, number] {return f.slot !== undefined ? [f.slot,f.slot] : f.slotRange || [0, graph.slots.length - 1];}
function overlap(a: Fact, b: Fact, graph: CaseGraph): boolean {const x=interval(a,graph),y=interval(b,graph); return x[0]<=y[1] && y[0]<=x[1];}
export function factsContradict(a: Fact, b: Fact, graph: CaseGraph): boolean {
  if (!overlap(a,b,graph)) return false;
  const normalized = (f: Fact): string => f.pred.startsWith("not_") ? f.pred.slice(4) : f.pred;
  if (normalized(a) !== normalized(b)) return false;
  const sameArgs = JSON.stringify(Object.keys(a.args).sort().map(k=>[k,a.args[k]])) === JSON.stringify(Object.keys(b.args).sort().map(k=>[k,b.args[k]]));
  if (sameArgs && a.pred !== b.pred) return true;
  if (a.pred !== b.pred) return false;
  if (a.pred === "at" && a.args.who === b.args.who && a.args.zone !== b.args.zone) return true;
  if (a.pred === "in" && a.args.obj === b.args.obj && a.args.zone !== b.args.zone) return true;
  if (a.pred === "state" && a.args.obj === b.args.obj && a.args.key && a.args.key === b.args.key && a.args.value !== b.args.value) return true;
  return false;
}
function contradictory(facts: Fact[], graph: CaseGraph): boolean {
  return facts.some((a,i) => facts.slice(i+1).some(b => factsContradict(a,b,graph)));
}

export function verifyCase(graph: CaseGraph): SolverReport {
  const issues: SolverIssue[] = [];
  const issue = (code: SolverCode, message: string, subject?: Id): void => {if (!issues.some(i=>i.code===code && i.subject===subject)) issues.push(subject ? {code,message,subject} : {code,message});};
  const hypotheses = enumerateHypotheses(graph);
  const reachable = reachableKnowledge(graph);
  const surviving = hypotheses.filter(h => consistent(h, reachable.facts, graph));
  const unique = surviving.length === 1 && sameHypothesis(surviving[0],graph.envelope);
  if (!unique) issue("NOT_UNIQUE", "Reachable observations must independently identify the sealed envelope.");
  const packages = packagesFor(graph,reachable,hypotheses);
  const routesPerElimination: Record<Id,number> = {};
  for (const card of graph.cast.suspects.map(s=>s.id).concat(graph.room.zones.map(z=>z.id),graph.weapons)) {
    if ([graph.envelope.who,graph.envelope.where,graph.envelope.what].includes(card)) continue;
    const target = hypotheses.map((h,i) => [h.who,h.where,h.what].includes(card) ? i : -1).filter(i=>i>=0);
    routesPerElimination[card] = independentRoutes(packages,target);
    if (routesPerElimination[card] < 2) issue("ROUTES_LT_2", "Card lacks two source-disjoint obtainable elimination routes.",card);
  }
  const lieBreakable: Record<Id,number> = {};
  for (const statement of graph.statements.filter(s=>s.stance === "cover")) {
    const valid = statement.breakers.filter((set,index,sets) => set.length > 0 && sets.findIndex(other=>JSON.stringify(sorted(other))===JSON.stringify(sorted(set)))===index && set.every(ref => {
      const claim=graph.statements.find(s=>s.id===ref);
      return !!reachable.supports[ref]?.length && (!claim || claim.stance === "truth");
    }));
    lieBreakable[statement.id] = valid.length;
    const target = graph.statements.find(s=>s.id === statement.onBreak);
    const required = statement.speaker === graph.envelope.who && statement.layer === 0 ? 2 : 1;
    if (!reachable.supports[statement.id]?.length || valid.length < required || !target || target.speaker !== statement.speaker || !reachable.supports[target.id]?.length)
      issue("LIE_UNBREAKABLE", "Cover lacks its required reachable breaker alternatives and replacement.",statement.id);
  }
  for (const evidence of graph.evidence) {
    const facts = reachable.facts.filter(f=>evidence.proves.includes(f.id));
    if (facts.length && hypotheses.filter(h=>consistent(h,facts,graph)).length === 1) issue("SHORTCUT","A single evidence item reveals the full solution.",evidence.id);
  }
  for (const fact of reachable.facts.filter(f=>f.suspicious)) {
    const remaining = hypotheses.filter(h=>consistent(h,reachable.facts.filter(f=>f.id!==fact.id),graph));
    const alone = hypotheses.filter(h=>h.who===graph.envelope.who && consistent(h,[fact],graph));
    if (!alone.length || remaining.length !== surviving.length || remaining.some(h=>!surviving.some(s=>sameHypothesis(h,s)))) issue("HERRING_HARMFUL","Suspicious fact is necessary to solve or independently excludes the culprit.",fact.id);
  }
  const base = reachableKnowledge(graph,{includeBeats:false});
  const route = minimumCostRoute(graph,base);
  if (route.minutes > graph.clockMinutes*0.6) issue("MIN_ROUTE_TOO_LONG","Minimum obtainable solution route exceeds 60% of the clock.");
  const baseSolutions = hypotheses.filter(h=>consistent(h,base.facts,graph));
  if (baseSolutions.length!==1 || !sameHypothesis(baseSolutions[0],graph.envelope)) issue("BEAT_BREAKS_SOLVABILITY","Base case must be solvable without any beat.","base");
  for (const beat of graph.beats) {
    const after = reachableKnowledge(graph,{beatIds:[beat.id]});
    const solutions = hypotheses.filter(h=>consistent(h,after.facts,graph));
    const added = beat.addsFacts || [];
    const otherAdditions = graph.beats.filter(other=>other.id!==beat.id).reduce<Fact[]>((all,other)=>all.concat(other.addsFacts || []),[]);
    if (!beat.validated || beat.reveals.some(id=>!graph.evidence.some(e=>e.id===id)) || added.some(f=>!f.truth || graph.facts.concat(otherAdditions).some(old=>old.id===f.id)) || contradictory(graph.facts.filter(f=>f.truth).concat(added,otherAdditions),graph) || solutions.length!==1 || !sameHypothesis(solutions[0],graph.envelope))
      issue("BEAT_BREAKS_SOLVABILITY","Beat must preserve a unique solution and monotonic, consistent truth.",beat.id);
  }
  const truthFacts = graph.facts.filter(f=>f.truth);
  if (contradictory(truthFacts,graph)) issue("INCONSISTENT_TRUTHS","True facts contradict each other.");
  const factMap = new Map(graph.facts.map(f=>[f.id,f]));
  for (const statement of graph.statements) {
    if (statementFacts(statement).some(id=>!factMap.has(id)) || (statement.stance==="truth" && statementFacts(statement).some(id=>!factMap.get(id)?.truth))) issue("INCONSISTENT_TRUTHS","Statement references missing or falsely labelled truth.",statement.id);
  }
  for (const suspect of graph.cast.suspects) for (const layer of sorted(graph.statements.filter(s=>s.speaker===suspect.id).map(s=>String(s.layer)))) {
    const byTopic = new Map<string,Statement>();
    for (const statement of graph.statements.filter(s=>s.speaker===suspect.id && s.layer<=Number(layer) && !s.replacementFor)) {
      const previous=byTopic.get(statement.topic);
      if (!previous || previous.layer<statement.layer) byTopic.set(statement.topic,statement);
    }
    const active = Array.from(byTopic.values());
    const facts = active.reduce<Fact[]>((all,s)=>all.concat(statementFacts(s).map(id=>factMap.get(id)).filter((f): f is Fact=>!!f)),[]);
    if (contradictory(facts,graph)) issue("INCONSISTENT_TRUTHS","A suspect contradicts its own current account.",suspect.id+":"+layer);
    let variants:Statement[][]=[active];
    for (const replacement of graph.statements.filter(s=>s.speaker===suspect.id && s.layer<=Number(layer) && !!s.replacementFor)) {
      const alternatives=variants.map(prior=>prior.filter(s=>s.topic!==replacement.topic).concat([replacement]));
      variants=variants.concat(alternatives);
      for(const variant of alternatives) {
      const alternative = variant.reduce<Fact[]>((all,s)=>all.concat(statementFacts(s).map(id=>factMap.get(id)).filter((f): f is Fact=>!!f)),[]);
      if (contradictory(alternative,graph)) issue("INCONSISTENT_TRUTHS","A replacement contradicts the remaining current account.",replacement.id);
      }
    }
  }
  return {ok:issues.length===0, unique, hypotheses:surviving, issues, routesPerElimination,lieBreakable,
    minRouteMinutes:route.minutes,minRoute:route.refs,clockMinutes:graph.clockMinutes,slack:1-route.minutes/graph.clockMinutes};
}
