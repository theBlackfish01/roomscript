import {CaseGraph,GameState,Vec3} from "../core/Types";
import {reconstructionBeats,ReconstructionBeat} from "./Closing";
export interface ReconstructionDetails {
  kind:ReconstructionBeat["kind"];time:string|null;hourRadians:number;minuteRadians:number;
  slips:{suspect:string;label:string;factId:string;position:Vec3}[];
  ledger:{deduction:string;label:string;filed:boolean;refs:string[]}[];
}
/** Every datum is derived from the engine's verdict-gated reconstruction. */
export function reconstructionDetails(graph:CaseGraph,state:GameState,kind:ReconstructionBeat["kind"]):ReconstructionDetails|undefined {
  if(state.caseId!==graph.caseId)return undefined;
  const beats=reconstructionBeats(graph,state),beat=beats.find(b=>b.kind===kind);if(!beat)return undefined;
  const time=beat.time||(["claims","correction"].includes(kind)?graph.slots[graph.murderSlot]:null);
  const match=time&&/^(\d{2}):(\d{2})$/.exec(time),hour=match?Number(match[1]):0,minute=match?Number(match[2]):0;
  const slips=(beats.find(b=>b.kind==="claims")?.claims||[]).map(claim=>{const zone=graph.room.zones.find(z=>z.id===claim.zone)!;
    return {suspect:claim.suspect,label:"SAID: "+zone.clueName,factId:claim.fact,position:[zone.anchor[0]+45,85,zone.anchor[2]+75] as Vec3};});
  const names:Record<string,string>={opportunity:"Opportunity",means:"Means",alibi_broken:"Alibi checked",motive:"Motive",timeline:"Timeline"};
  const ledger=kind==="ledger"?graph.requiredDeductions.map(d=>{const filed=state.arguments.find(a=>a.deduction===d.id);return {deduction:d.id,label:names[d.type]||d.type,filed:!!filed,refs:filed?.refs.slice()||[]};}):[];
  return {kind,time:match?time:null,hourRadians:Math.PI*2*((hour%12)+minute/60)/12,minuteRadians:Math.PI*2*minute/60,slips,ledger};
}
