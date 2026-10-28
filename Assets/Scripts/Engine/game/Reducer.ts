import {Action, Beat, CaseGraph, Evidence, GameEvent, GameState, Id, Statement} from "../core/Types";
import {solvePlayerKnowledge} from "../case/Solver";
import {currentStatement, getCurrentStatements, knownRefs, statementFacts} from "./Actions";
import {advanceClock} from "./Clock";
import {emptyPress, isLawyered, newEvidence} from "./Composure";
import {judgeObjection} from "./ObjectionJudge";
import {firstRefuter} from "./RefutationRound";
import {judgeAccusation, validHypothesis} from "./Accusation";
import {chooseHunch} from "./Hunches";
import {createGameState} from "./GameState";
import {buildFactSheet} from "../perf/FactSheetBuilder";
import {validateLine} from "../perf/LineValidator";

function uniquePush(list: Id[], id: Id): void {if (!list.includes(id)) list.push(id);}
function ids(value: unknown): value is string[] {return Array.isArray(value) && value.every(x => typeof x === "string");}
function clone<T>(value: T): T {return JSON.parse(JSON.stringify(value)) as T;}

/** Sequential host actions are the only state input; graph remains immutable. */
export function reduceGame(graph: CaseGraph, previous: GameState, action: Action): GameState {
  if (previous.caseId !== graph.caseId) throw new Error("CASE_MISMATCH");
  if (!Number.isSafeInteger(action.seq) || action.seq !== previous.lastSeq + 1 || typeof action.by !== "string" || !action.by.trim()) throw new Error("ACTION_SEQUENCE");
  const state = clone(previous);
  state.lastSeq = action.seq;
  state.log.push(clone(action));
  const emit = (type: string, fields: Omit<GameEvent,"seq"|"type"> = {}) => {state.events.push({seq:action.seq,type,...fields});};
  const reject = (reason: string) => {emit("rejected",{text:reason});};
  const suspectExists = (id: Id) => graph.cast.suspects.some(s => s.id === id);
  const learnFact = (id: Id) => {
    const facts=graph.facts.concat(...graph.beats.filter(b=>state.beatsFired.includes(b.id)).map(b=>b.addsFacts || []));
    if (facts.some(f=>f.id===id && f.truth)) uniquePush(state.knowledge.factIds,id);
  };
  const observe = (statement: Statement, mode: string) => {
    uniquePush(state.knowledge.statementIds,statement.id);
    if (statement.stance === "truth") statementFacts(statement).forEach(learnFact);
    if (!state.notebook.some(c => c.statement === statement.id)) state.notebook.push({statement:statement.id,speaker:statement.speaker,topic:statement.topic,layer:statement.layer,
      canonical:statement.canonical,asserts:statementFacts(statement),broken:false});
    state.activeSuspect = statement.speaker; state.activeStatement = statement.id;
    emit("claim",{actor:statement.speaker,refs:[statement.id],text:statement.canonical,data:{mode}});
    if (statement.stance === "cover") emit("tell",{actor:statement.speaker,refs:[statement.id],data:{about:statement.about || statement.speaker}});
  };
  const collect = (evidence: Evidence) => {
    if (state.knowledge.evidenceIds.includes(evidence.id)) return;
    uniquePush(state.knowledge.evidenceIds,evidence.id); evidence.proves.forEach(learnFact);
    emit("evidence",{actor:evidence.holder,refs:[evidence.id],text:evidence.canonical});
  };
  const eligible = (beat: Beat) => beat.validated && !state.beatsFired.includes(beat.id) && state.elapsedMinutes >= beat.minute &&
    (beat.requires || []).every(ref => knownRefs(state).has(ref));
  const fireBeat = (beat: Beat) => {
    uniquePush(state.beatsFired,beat.id);
    // Graph facts are compiled in advance; a model never supplies replacement facts.
    for (const ref of beat.reveals) {const e=graph.evidence.find(e=>e.id===ref); if(e) collect(e);}
    if (beat.pressureMinutes) advanceClock(state,beat.pressureMinutes);
    emit("beat",{refs:[beat.id],text:beat.canonical});
  };
  const current = (suspect: Id, statement?: Id) => {
    const id = statement || (state.activeSuspect === suspect ? state.activeStatement : null);
    const s=graph.statements.find(s=>s.id===id && s.speaker===suspect);
    return s && currentStatement(graph,state,suspect,s.topic)?.id === s.id ? s : undefined;
  };
  const postVerdict = ["LineSpoken","GossipSpoken","ArgumentClaim","ArgumentExtracted","PitchReceived"].includes(action.type);
  if (state.verdict !== null && !postVerdict) {reject("case_closed"); return state;}

  switch (action.type) {
    case "Ask": {
      if (!suspectExists(action.suspect) || typeof action.topic !== "string") {reject("unknown_suspect_or_topic"); break;}
      const ss=state.suspects[action.suspect];
      if (isLawyered(ss,state.elapsedMinutes)) {reject("lawyered"); break;}
      const statement=currentStatement(graph,state,action.suspect,action.topic);
      state.activeSuspect=action.suspect;
      if (!statement) {advanceClock(state,5); state.activeStatement=null; emit("deflection",{actor:action.suspect,text:"That is outside my account."}); break;}
      advanceClock(state,statement.costMinutes ?? 15);
      observe(statement,"answer"); break;
    }
    case "Press": {
      if (!suspectExists(action.suspect)) {reject("unknown_suspect"); break;}
      const ss=state.suspects[action.suspect], s=current(action.suspect,action.statement);
      if (!s || !state.knowledge.statementIds.includes(s.id)) {reject("no_current_claim"); break;}
      if (isLawyered(ss,state.elapsedMinutes)) {reject("lawyered"); break;}
      advanceClock(state,15);
      const lawyered=emptyPress(ss,state.elapsedMinutes);
      emit(lawyered ? "lawyered" : "pressed",{actor:action.suspect,refs:[s.id],text:s.pressed?.canonical || s.canonical});
      if (s.stance === "cover") emit("tell",{actor:action.suspect,refs:[s.id],data:{about:s.about || s.speaker}});
      ss.memory.push({id:String(action.seq),text:"The detective pressed your account.",entities:[],source:"treatment"});
      if (lawyered) {state.activeSuspect=null; state.activeStatement=null;} break;
    }
    case "Believe": {
      if (!suspectExists(action.suspect)) {reject("unknown_suspect"); break;}
      const s=current(action.suspect,action.statement);
      if (!s || !state.knowledge.statementIds.includes(s.id)) {reject("no_current_claim"); break;}
      // Filing a cover does not promote false assertions into known facts.
      state.suspects[action.suspect].rapport=Math.min(3,state.suspects[action.suspect].rapport+1);
      emit("believed",{actor:action.suspect,refs:[s.id]}); break;
    }
    case "Object": case "CallLiar": {
      if (!suspectExists(action.suspect) || !ids(action.evidence)) {reject("invalid_objection"); break;}
      const judged=judgeObjection(graph,state,action.suspect,action.statement,action.evidence);
      const ss=state.suspects[action.suspect];
      ss.memory.push({id:String(action.seq),text:judged.correct ? "The detective proved your account false." : "The detective wrongly accused you.",entities:[],source:"objection"});
      if (!judged.correct || !judged.target) {
        state.pips=Math.max(0,state.pips-1); emit("objectionWrong",{actor:action.suspect,refs:[action.statement],text:judged.reason});
        if (!state.pips) {state.verdict="wrong"; emit("credibilityExhausted");} break;
      }
      const target=judged.target;
      const source=state.notebook.find(claim=>claim.statement===action.statement); if(source) source.broken=true;
      const sourceStatement=graph.statements.find(s=>s.id===action.statement)!;
      if (target.replacementFor===sourceStatement.id || target.layer===sourceStatement.layer) ss.topicOverrides[target.topic]=target.id;
      else ss.layer=Math.max(ss.layer,target.layer);
      ss.composure=Math.max(0,ss.composure-1); ss.respect++; newEvidence(ss); state.hunches++;
      emit("objectionCorrect",{actor:action.suspect,refs:[action.statement,target.id,...action.evidence]});
      observe(target,"broken"); break;
    }
    case "PinchObject": {
      if (!graph.room.objects.some(o=>o.id===action.object)) {reject("unknown_object"); break;}
      const evidence=graph.evidence.filter(e=>e.holder===action.object && (!e.latent || !!e.beat && state.beatsFired.includes(e.beat)) && !state.knowledge.evidenceIds.includes(e.id));
      advanceClock(state,Math.max(0,...evidence.map(e=>e.costMinutes ?? 0)));
      evidence.forEach(collect); break;
    }
    case "RevealEvidence": {
      if (!suspectExists(action.suspect) || !state.knowledge.evidenceIds.includes(action.evidence)) {reject("evidence_not_observed"); break;}
      const ss=state.suspects[action.suspect];
      if (!ss.shownEvidence.includes(action.evidence)) {uniquePush(ss.shownEvidence,action.evidence); newEvidence(ss);}
      emit("revealed",{actor:action.suspect,refs:[action.evidence]}); break;
    }
    case "Suggest": {
      if (!validHypothesis(graph,action)) {reject("unknown_card"); break;}
      advanceClock(state,15);
      const refuter=firstRefuter(graph,action,state);
      if (refuter) {learnFact(refuter.fact.id); emit("refuted",{actor:refuter.holder,refs:[refuter.card.eliminates,refuter.fact.id],data:{privateTo:action.by}});}
      else emit("breathesIn"); break;
    }
    case "Dismiss": {
      if (!suspectExists(action.suspect)) {reject("unknown_suspect"); break;}
      if (state.activeSuspect===action.suspect) {state.activeSuspect=null; state.activeStatement=null;}
      emit("dismissed",{actor:action.suspect}); break;
    }
    case "UseHunch": {
      if (state.hunches<=0) {reject("no_hunches"); break;}
      const ref=chooseHunch(graph,state);
      if (!ref) {reject("no_observed_cover"); break;}
      state.hunches--; emit("hunch",{refs:[ref]}); break;
    }
    case "Accuse": {
      if (!validHypothesis(graph,action)) {reject("unknown_card"); break;}
      state.accusation={who:action.who,where:action.where,what:action.what};
      state.verdict=judgeAccusation(graph,action) ? "correct" : "wrong";
      emit("verdict",{text:state.verdict,refs:[action.who,action.where,action.what]}); break;
    }
    case "ArgumentClaim": case "ArgumentExtracted": {
      const claims=action.type==="ArgumentClaim" ? [{deduction:action.deduction,refs:action.refs}] : action.claims;
      if (!Array.isArray(claims)) {reject("invalid_argument"); break;}
      const known=knownRefs(state);
      for (const claim of claims) {
        if (!claim || typeof claim !== "object") {reject("invalid_argument"); continue;}
        const deduction=graph.requiredDeductions.find(d=>d.id===claim.deduction);
        if (!deduction || !ids(claim.refs) || !claim.refs.every(ref=>known.has(ref)) || !deduction.supports.some(route=>route.every(ref=>claim.refs.includes(ref)))) {reject("unsupported_argument"); continue;}
        if (!state.arguments.some(a=>a.deduction===claim.deduction)) state.arguments.push({deduction:claim.deduction,refs:claim.refs.slice()});
        emit("argumentSupported",{refs:[claim.deduction,...claim.refs]});
      }
      break;
    }
    case "BeatChosen": {
      const beat=graph.beats.find(b=>b.id===action.beat);
      if (!beat || !eligible(beat)) {reject("ineligible_beat"); break;}
      fireBeat(beat); break;
    }
    case "LineSpoken": {
      if (!suspectExists(action.suspect)) {reject("unknown_suspect"); break;}
      const mode=action.mode || "answer";
      if (mode==="confession" && (state.verdict!=="correct" || action.suspect!==graph.envelope.who)) {reject("confession_before_verdict"); break;}
      // A correct verdict can release the final account without silently changing the played ladder.
      const presentation=mode==="confession" ? clone(state) : state;
      if (mode==="confession") presentation.suspects[action.suspect].layer=Math.max(...graph.statements.filter(s=>s.speaker===action.suspect).map(s=>s.layer));
      const validation=validateLine(action.answer,buildFactSheet(graph,presentation,action.suspect),graph,mode);
      if (!validation.ok || !validation.answer) {reject("unvalidated_performance"); break;}
      const answer=validation.answer;
      const ss=state.suspects[action.suspect];
      answer.cites.filter(ref=>ref!=="none").forEach(ref=>uniquePush(ss.saidSoFar,ref)); ss.recentLines=[...ss.recentLines,answer.line].slice(-2);
      emit("lineSpoken",{actor:action.suspect,refs:answer.cites.slice(),text:answer.line}); break;
    }
    case "GossipSpoken": reject("gossip_packet_not_yet_admitted"); break;
    case "PitchReceived": emit("pitchRecorded"); break;
    default: reject("unknown_action");
  }
  if (state.verdict===null) for (const beat of graph.beats) if (beat.guaranteed && eligible(beat)) fireBeat(beat);
  state.grid=solvePlayerKnowledge(graph,state.knowledge).eliminated;
  if (state.verdict==="timeout" && previous.verdict===null) emit("timeout");
  return state;
}
export function replayGame(graph: CaseGraph, actions: readonly Action[]): GameState {
  return actions.reduce((state,action)=>reduceGame(graph,state,action),createGameState(graph));
}
