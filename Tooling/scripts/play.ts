import {createInterface} from "node:readline/promises";
import {stdin,stdout} from "node:process";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {Action,ActionPayload,CaseGraph,GameEvent,GameState} from "../../Assets/Scripts/Engine/core/Types";
import {createHeroCase} from "../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {heroFinalConfession} from "../../Assets/Scripts/Content/HeroLineBank";
import {createGameState} from "../../Assets/Scripts/Engine/game/GameState";
import {reduceGame} from "../../Assets/Scripts/Engine/game/Reducer";
import {solvePlayerKnowledge} from "../../Assets/Scripts/Engine/case/Solver";
import {buildFactSheet} from "../../Assets/Scripts/Engine/perf/FactSheetBuilder";
import {keywordIntent,questionChips} from "../../Assets/Scripts/Engine/perf/KeywordIntent";

export interface CommandResult {lines:string[];quit:boolean;}
const HELP=[
  "Roomscript terminal — canonical engine dialogue, no live model.",
  "cast | objects | zones | chips [suspect] | status | notebook | grid | arguments",
  "ask <suspect> <typed question or topic> | chip <suspect> <topic>",
  "press <suspect> [claim] | believe <suspect> [claim]",
  "object <suspect> <claim> <evidence/claim IDs, separated by spaces or commas>",
  "pinch <object> | show <suspect> <evidence> | dismiss <suspect> | hunch",
  "suggest <suspect> <zone> <weapon> | accuse <suspect> <zone> <weapon>",
  "arg <deduction> <evidence/claim IDs> | help | quit",
  "Use IDs printed on cards. Baseline and first alibi questions cost 5 minutes; other questions, pressure and suggestions cost 15. First inspection costs 10; repeat viewing is free."
];

/** A thin command adapter: all truth, tells, time, objections and verdicts come from reduceGame. */
export class TerminalPlayer {
  readonly graph:CaseGraph;
  state:GameState;
  constructor(graph:CaseGraph=createHeroCase()) {this.graph=graph;this.state=createGameState(graph);}
  private name(id:string):string {
    return this.graph.cast.suspects.find(s=>s.id===id)?.name
      ?? this.graph.room.objects.find(o=>o.id===id)?.label
      ?? this.graph.room.zones.find(z=>z.id===id)?.clueName ?? id;
  }
  status():string {return "Clock "+this.state.elapsedMinutes+"/"+this.state.clockMinutes+" case minutes | credibility "+this.state.pips+" | Hunches "+this.state.hunches+" | "+(this.state.verdict??"open");}
  private event(event:GameEvent):string[] {
    const refs=event.refs??[];
    const who=event.actor?this.name(event.actor):"";
    switch(event.type) {
      case "claim":return ["["+refs[0]+"] "+who+": "+event.text];
      case "tell": {
        const person=this.graph.cast.suspects.find(s=>s.id===event.actor)!;
        return ["TELL "+who+": "+person.tellProp+"; gaze -> "+this.name(String(event.data?.about??event.actor))];
      }
      case "evidence":return ["["+refs[0]+"] "+event.text];
      case "objectionCorrect":return ["OBJECTION SUSTAINED: "+refs[0]+" -> "+refs[1]];
      case "objectionWrong":return ["OBJECTION OVERRULED: "+event.text];
      case "refuted":return ["REFUTED by "+who+": "+this.name(refs[0])+" — "+(this.graph.facts.find(f=>f.id===refs[1])?.canonical??refs[1])];
      case "breathesIn":return ["No one can refute that suggestion. The room breathes in."];
      case "verdict":return ["VERDICT: "+event.text,...(event.text==="correct"?["Vale: "+heroFinalConfession.answer.line]:[])];
      case "beat":return ["BEAT: "+event.text];
      case "hunch":return ["HUNCH: investigate "+refs.join(", ")];
      case "argumentSupported":return ["ARGUMENT SUPPORTED: "+refs[0]];
      case "rejected":return ["REJECTED: "+event.text];
      case "pressed":return [who+": "+event.text];
      case "lawyered":return [who+" has lawyered up. Give them time or show new evidence."];
      case "deflection":return [who+": "+event.text];
      case "believed":return ["Filed "+refs[0]+". Filing does not certify a claim as true."];
      case "revealed":return ["Showed "+refs[0]+" to "+who+"."];
      case "dismissed":return ["Dismissed "+who+"."];
      case "timeout":return ["TIMEOUT: the case clock has expired."];
      case "credibilityExhausted":return ["CASE CLOSED: credibility exhausted."];
      default:return event.text?[event.text]:[];
    }
  }
  private dispatch(payload:ActionPayload):string[] {
    const start=this.state.events.length;
    const action={...payload,seq:this.state.lastSeq+1,by:"terminal"} as Action;
    this.state=reduceGame(this.graph,this.state,action);
    return this.state.events.slice(start).flatMap(event=>this.event(event)).concat(this.status());
  }
  execute(input:string):CommandResult {
    const parts=input.trim().split(/\s+/);const command=(parts.shift()??"").toLowerCase();
    const result=(lines:string[]):CommandResult=>({lines,quit:false});
    if(!command) return result([]);
    if(command==="quit"||command==="exit") return {lines:["Case session ended."],quit:true};
    if(command==="help") return result(HELP.slice());
    if(command==="status") return result([this.status()]);
    if(command==="cast") return result(this.graph.cast.suspects.map(s=>s.id+" — "+s.name+"; "+s.persona));
    if(command==="objects") return result(this.graph.room.objects.map(o=>o.id+" — "+o.label+" ["+o.zone+(o.virtual?", virtual stand-in":"")+"]"));
    if(command==="zones") return result(this.graph.room.zones.map(z=>z.id+" — "+z.clueName+" ("+z.label+")"));
    if(command==="notebook") return result([
      ...this.state.notebook.map(c=>"["+c.statement+"] "+this.name(c.speaker)+": "+c.canonical+(c.broken?" [BROKEN]":"")),
      ...this.state.knowledge.evidenceIds.map(id=>"["+id+"] "+this.graph.evidence.find(e=>e.id===id)!.canonical)
    ].concat(this.state.notebook.length+this.state.knowledge.evidenceIds.length?[]:["Your notebook is empty."]));
    if(command==="grid") {
      const solution=solvePlayerKnowledge(this.graph,this.state.knowledge);
      return result(["Remaining hypotheses: "+solution.hypotheses.length,
        ...(["suspects","zones","weapons"] as const).map(kind=>kind+" crossed out: "+(solution.eliminated[kind].map(id=>id+" "+this.name(id)).join(", ")||"none"))]);
    }
    if(command==="arguments") return result(this.graph.requiredDeductions.map(d=>d.id+" — "+d.type+(this.state.arguments.some(a=>a.deduction===d.id)?" [SUPPORTED]":" [needs observed refs]")));
    const id=(index:number)=>parts[index]?.toUpperCase();
    const refs=(start:number)=>parts.slice(start).flatMap(part=>part.split(",")).filter(Boolean).map(value=>value.toUpperCase());
    const suspect=(value:string|undefined)=>!!value&&this.graph.cast.suspects.some(s=>s.id===value);
    if(command==="chips") {
      const speaker=id(0)??this.state.activeSuspect??this.graph.cast.suspects[0].id;
      if(!suspect(speaker)) return result(["Unknown suspect. Use cast for IDs."]);
      return result(questionChips(buildFactSheet(this.graph,this.state,speaker)).map(chip=>chip.topic+" — "+chip.question));
    }
    if(command==="ask"||command==="chip") {
      if(!suspect(id(0))||parts.length<2) return result(["Usage: "+command+" <suspect> <question or topic>"]);
      const question=parts.slice(1).join(" ");
      const topic=keywordIntent(question,buildFactSheet(this.graph,this.state,id(0)!),this.graph).topic;
      return result(this.dispatch({type:"Ask",suspect:id(0)!,topic,question}));
    }
    if(command==="press"||command==="believe") {
      if(!suspect(id(0))||parts.length>2) return result(["Usage: "+command+" <suspect> [claim]"]);
      return result(this.dispatch({type:command==="press"?"Press":"Believe",suspect:id(0)!,...(id(1)?{statement:id(1)!}:{})}));
    }
    if(command==="object") {
      if(!suspect(id(0))||parts.length<3) return result(["Usage: object <suspect> <claim> <evidence/claim IDs>"]);
      return result(this.dispatch({type:"Object",suspect:id(0)!,statement:id(1)!,evidence:refs(2)}));
    }
    if(command==="pinch") return result(parts.length===1?this.dispatch({type:"PinchObject",object:id(0)!}):["Usage: pinch <object>"]);
    if(command==="show") return result(parts.length===2?this.dispatch({type:"RevealEvidence",suspect:id(0)!,evidence:id(1)!}):["Usage: show <suspect> <evidence>"]);
    if(command==="dismiss") return result(parts.length===1?this.dispatch({type:"Dismiss",suspect:id(0)!}):["Usage: dismiss <suspect>"]);
    if(command==="hunch") return result(this.dispatch({type:"UseHunch"}));
    if(command==="suggest"||command==="accuse") return result(parts.length===3?this.dispatch({type:command==="suggest"?"Suggest":"Accuse",who:id(0)!,where:id(1)!,what:id(2)!}):["Usage: "+command+" <suspect> <zone> <weapon>"]);
    if(command==="arg") return result(parts.length>=2?this.dispatch({type:"ArgumentClaim",deduction:id(0)!,refs:refs(1)}):["Usage: arg <deduction> <observed refs>"]);
    return result(["Unknown command. Type help."]);
  }
}

export const HERO_DEMO_COMMANDS=[
  "ask S2 what is your name?","ask S2 tell me about your brooch","pinch O6",
  "object S2 C_S2_BASELINE_LIE E_S2_BASELINE","ask S2 where were you at 22:30?",
  "press S2 C_VALE_ALIBI_0","pinch O11","object S2 C_VALE_ALIBI_0 E_KETTLE_COLD",
  "pinch O12","object S2 C_VALE_ALIBI_1 E_RECORDING","pinch O1","pinch O8","pinch O10",
  "pinch O2","pinch O3","pinch O4","pinch O5","suggest S1 Z1 O1","grid",
  "arg D_OPPORTUNITY E_VALE_LAMP","arg D_MEANS E_CABLE","arg D_ALIBI C_VALE_ALIBI_0 E_KETTLE_COLD","arg D_MOTIVE E_LETTER",
  "arguments","accuse S2 Z1 O1"
];

export function runDemo():{player:TerminalPlayer;lines:string[]} {
  const player=new TerminalPlayer();
  const lines=["Scripted engine demo — case-clock minutes are not measured wall time."];
  for(const command of HERO_DEMO_COMMANDS) lines.push("> "+command,...player.execute(command).lines);
  return {player,lines};
}

async function main():Promise<void> {
  if(process.argv.includes("--demo")) {
    const demo=runDemo();console.log(demo.lines.join("\n"));
    if(demo.player.state.verdict!=="correct"||demo.player.state.arguments.length!==4) process.exitCode=1;
    return;
  }
  const player=new TerminalPlayer();console.log(HELP.join("\n"));console.log(player.execute("cast").lines.join("\n"));
  const terminal=createInterface({input:stdin,output:stdout});
  try {
    while(true) {
      const command=await terminal.question("roomscript> ");
      const result=player.execute(command);if(result.lines.length) console.log(result.lines.join("\n"));
      if(result.quit) break;
    }
  } catch(error) {
    if((error as {code?:string}).code!=="ERR_USE_AFTER_CLOSE") throw error;
  } finally {terminal.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(error=>{console.error(error);process.exitCode=1;});
