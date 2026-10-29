import {pathToFileURL} from "node:url";
import {resolve} from "node:path";
import {createHeroCase} from "../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {Prng} from "../../Assets/Scripts/Engine/core/Prng";
import {ActionPayload,CaseGraph,GameState} from "../../Assets/Scripts/Engine/core/Types";
import {factsContradict,solvePlayerKnowledge,verifyCase} from "../../Assets/Scripts/Engine/case/Solver";
import {getCurrentStatements,knownRefs,statementFacts} from "../../Assets/Scripts/Engine/game/Actions";
import {createGameState} from "../../Assets/Scripts/Engine/game/GameState";
import {reduceGame,replayGame} from "../../Assets/Scripts/Engine/game/Reducer";

export interface FuzzReport {players:number;seed:number;actions:number;maxActions:number;terminations:Record<string,number>;actionTypes:Record<string,number>;events:Record<string,number>;highestLayer:number;minRouteMinutes:number;clockMinutes:number;fairness:string;}
function requireInvariant(ok:boolean,message:string):asserts ok {if(!ok)throw new Error(message);}

/** Check current topic selections, including inherited topics and accepted replacements. */
export function assertCurrentAccounts(graph:CaseGraph,state:GameState):void {
  for(const suspect of graph.cast.suspects) {
    const ss=state.suspects[suspect.id];
    const claims=getCurrentStatements(graph,suspect.id,ss.layer,ss.topicOverrides);
    const facts=claims.flatMap(statementFacts).map(id=>graph.facts.find(f=>f.id===id)!);
    requireInvariant(facts.every(Boolean),`Missing assertion in ${suspect.id}`);
    for(let i=0;i<facts.length;i++)for(let j=i+1;j<facts.length;j++)
      requireInvariant(!factsContradict(facts[i],facts[j],graph),`Contradictory current account ${suspect.id}: ${facts[i].id}/${facts[j].id}, seq ${state.lastSeq}`);
  }
}

/**
 * Fairness is a player-policy assumption, not a game-rule mutation: after at most seven
 * arbitrary/free actions the player asks a legitimate unknown topic (5 minutes).
 * If everyone is lawyered, a legal suggestion (15 minutes) advances time instead.
 * An adversary repeating free Dismiss forever is intentionally outside this guarantee.
 */
function* fuzzPlayerSteps(graph:CaseGraph,players:number,seed:number):Generator<void,FuzzReport> {
  requireInvariant(Number.isSafeInteger(players)&&players>0,"players must be a positive integer");
  const original=JSON.stringify(graph);
  const proof=verifyCase(graph);
  requireInvariant(proof.ok,`Fixture is invalid: ${JSON.stringify(proof.issues)}`);
  requireInvariant(proof.minRouteMinutes<=graph.clockMinutes*0.6,"Minimum route exceeds clock margin");
  const report:FuzzReport={players,seed,actions:0,maxActions:0,terminations:{},actionTypes:{},events:{},highestLayer:0,minRouteMinutes:proof.minRouteMinutes,clockMinutes:graph.clockMinutes,fairness:"At most seven free/arbitrary actions before a charged unknown-topic Ask; legal Suggest if all suspects are lawyered."};
  const root=new Prng(seed,"fuzz-players");
  const bound=8*(Math.ceil(graph.clockMinutes/5)+1);
  for(let player=0;player<players;player++) {
    const rng=root.fork(`player:${player}`);
    let state=createGameState(graph);
    const inspected=new Set<string>();
    const brokenCovers=new Set<string>();
    for(let step=0;step<bound&&state.verdict===null;step++) {
      const suspect=rng.pick(graph.cast.suspects).id;
      const ss=state.suspects[suspect];
      const current=getCurrentStatements(graph,suspect,ss.layer,ss.topicOverrides);
      const statement=rng.pick(current);
      const tuple=()=>({who:rng.pick(graph.cast.suspects).id,where:rng.pick(graph.room.zones).id,what:rng.pick(graph.weapons)});
      const solutions=solvePlayerKnowledge(graph,state.knowledge).hypotheses;
      let payload:ActionPayload;
      if(step%8===7) {
        const available=graph.cast.suspects.filter(s=>state.elapsedMinutes>=state.suspects[s.id].lawyeredUntil);
        payload=available.length ? {type:"Ask",suspect:rng.pick(available).id,topic:"__fuzz_unknown_topic__"} : {type:"Suggest",...tuple()};
      } else if(player%4===0 && solutions.length===1) payload={type:"Accuse",...solutions[0]};
      else if(player%4<=1 && graph.room.objects.some(o=>!inspected.has(o.id))) {
        const object=rng.pick(graph.room.objects.filter(o=>!inspected.has(o.id))).id;
        inspected.add(object);payload={type:"PinchObject",object};
      } else {
        const refs=knownRefs(state);
        const allCurrent=graph.cast.suspects.flatMap(s=>getCurrentStatements(graph,s.id,state.suspects[s.id].layer,state.suspects[s.id].topicOverrides));
        const obtainableCovers=allCurrent.filter(s=>s.stance==="cover"&&s.breakers.some(route=>route.every(ref=>refs.has(ref)||allCurrent.some(c=>c.id===ref&&c.stance==="truth"))));
        if(player%4===1 && obtainableCovers.length) {
          const cover=rng.pick(obtainableCovers);
          const route=rng.pick(cover.breakers.filter(path=>path.every(ref=>refs.has(ref)||allCurrent.some(c=>c.id===ref&&c.stance==="truth"))));
          const missing=route.find(ref=>!refs.has(ref));
          if(!refs.has(cover.id))payload={type:"Ask",suspect:cover.speaker,topic:cover.topic};
          else if(missing){const claim=allCurrent.find(c=>c.id===missing)!;payload={type:"Ask",suspect:claim.speaker,topic:claim.topic};}
          else payload={type:"Object",suspect:cover.speaker,statement:cover.id,evidence:route};
        } else {
        const roll=rng.int(0,14);
        if(roll<=2)payload={type:"Ask",suspect,topic:statement.topic};
        else if(roll===3)payload={type:"Press",suspect,statement:statement.id};
        else if(roll===4)payload={type:"Believe",suspect,statement:statement.id};
        else if(roll===5)payload={type:"PinchObject",object:rng.pick(graph.room.objects).id};
        else if(roll===6)payload={type:"Suggest",...tuple()};
        else if(roll===7)payload={type:"Dismiss",suspect};
        else if(roll===8)payload={type:"UseHunch"};
        else if(roll===9)payload={type:"RevealEvidence",suspect,evidence:state.knowledge.evidenceIds.length?rng.pick(state.knowledge.evidenceIds):"unobserved"};
        else if(roll===10)payload={type:"BeatChosen",beat:rng.pick(graph.beats).id};
        else if(roll===11) {
          const refs=knownRefs(state);
          const breakable=graph.statements.filter(s=>s.speaker===suspect&&s.stance==="cover"&&refs.has(s.id)&&current.some(c=>c.id===s.id)&&s.breakers.some(b=>b.every(id=>refs.has(id))));
          if(breakable.length){const cover=rng.pick(breakable);payload={type:"Object",suspect,statement:cover.id,evidence:rng.pick(cover.breakers.filter(b=>b.every(id=>refs.has(id))))};}
          else payload={type:"Ask",suspect,topic:statement.topic};
        } else if(roll===12)payload={type:"CallLiar",suspect,statement:statement.id,evidence:state.knowledge.evidenceIds.slice(0,1)};
        else payload={type:"LineSpoken",suspect,key:`fuzz:${player}:${step}`,answer:{topic:statement.topic,cites:[statement.id],line:statement.canonical,emotion:"calm"}};
        }
      }
      const before=state.events.length;
      state=reduceGame(graph,state,{...payload,seq:state.lastSeq+1,by:`fuzz:${player}`});
      assertCurrentAccounts(graph,state);
      const admittedFacts=graph.facts.concat(graph.beats.filter(b=>state.beatsFired.includes(b.id)).flatMap(b=>b.addsFacts||[]));
      requireInvariant(state.knowledge.factIds.every(id=>admittedFacts.some(f=>f.id===id&&f.truth)),`False fact learned by player ${player}`);
      const remaining=solvePlayerKnowledge(graph,state.knowledge).hypotheses;
      requireInvariant(remaining.some(h=>h.who===graph.envelope.who&&h.where===graph.envelope.where&&h.what===graph.envelope.what),`Truth excluded envelope for player ${player}`);
      report.actionTypes[payload.type]=(report.actionTypes[payload.type]||0)+1;
      for(const event of state.events.slice(before)) {
        report.events[event.type]=(report.events[event.type]||0)+1;
        if(event.type==="objectionCorrect") {
          const source=event.refs![0];
          requireInvariant(!brokenCovers.has(source),`Cover ${source} was successfully broken twice by player ${player}`);
          brokenCovers.add(source);
        }
      }
      report.highestLayer=Math.max(report.highestLayer,...Object.values(state.suspects).map(s=>s.layer));
    }
    requireInvariant(state.verdict!==null,`Fair player ${player} failed to terminate in ${bound} actions`);
    requireInvariant(state.elapsedMinutes>=0&&state.pips>=0,"Negative resources");
    if(player<10)requireInvariant(JSON.stringify(replayGame(graph,state.log))===JSON.stringify(state),`Replay diverged for player ${player}`);
    report.terminations[state.verdict]=(report.terminations[state.verdict]||0)+1;
    report.actions+=state.log.length;report.maxActions=Math.max(report.maxActions,state.log.length);
    yield;
  }
  requireInvariant(JSON.stringify(graph)===original,"Fuzz mutated case graph");
  return report;
}

export function fuzzPlayers(graph:CaseGraph=createHeroCase(),players=1000,seed=1041):FuzzReport {
  const steps=fuzzPlayerSteps(graph,players,seed);let step=steps.next();while(!step.done)step=steps.next();return step.value;
}

/** Same named random streams and assertions; yields to worker IPC every 25 players. */
export async function fuzzPlayersAsync(graph:CaseGraph=createHeroCase(),players=1000,seed=1041):Promise<FuzzReport> {
  const steps=fuzzPlayerSteps(graph,players,seed);let step=steps.next(),count=0;
  while(!step.done){if(++count%25===0)await new Promise<void>(resolve=>setImmediate(resolve));step=steps.next();}return step.value;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const players=process.argv[2]===undefined?1000:Number(process.argv[2]);
  fuzzPlayersAsync(createHeroCase(),players).then(report=>console.log(JSON.stringify(report,null,2))).catch(error=>{console.error(error);process.exitCode=1;});
}
