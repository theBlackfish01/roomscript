import {GameState} from "../core/Types";
export interface AdmittedSpeech {caseId:string;seq:number;speaker:string;text:string;scope:"free"|"wren";}
/** Speech tickets come from reducer output, never raw model text or the hidden graph. */
export function admittedWrenSpeech(state:GameState,key:string):AdmittedSpeech|undefined {
  const action=state.log.slice().reverse().find(a=>a.type==="WrenSpoken"&&a.key===key);
  const event=action&&state.events.find(e=>e.seq===action.seq&&e.type==="wrenSpoken"&&e.actor==="WREN"&&e.data?.key===key);
  return event?.text?{caseId:state.caseId,seq:event.seq,speaker:"WREN",text:event.text,scope:"wren"}:undefined;
}
export function admittedFreeSpeech(state:GameState,speaker:string,text:string,kind:"chip"|"free"):AdmittedSpeech|undefined {
  if(kind!=="free")return undefined;
  const action=state.log.slice().reverse().find(a=>a.type==="LineSpoken"&&a.suspect===speaker);
  const event=action&&state.events.find(e=>e.seq===action.seq&&e.type==="lineSpoken"&&e.actor===speaker&&e.text===text);
  return event?.text?{caseId:state.caseId,seq:event.seq,speaker,text:event.text,scope:"free"}:undefined;
}
export function speechStillAdmitted(state:GameState,ticket:AdmittedSpeech):boolean {
  return state.caseId===ticket.caseId&&state.events.some(e=>e.seq===ticket.seq&&e.actor===ticket.speaker&&e.text===ticket.text&&e.type===(ticket.scope==="wren"?"wrenSpoken":"lineSpoken"));
}
