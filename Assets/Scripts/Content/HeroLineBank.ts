import {AnswerMode, CaseGraph, LineBankEntry} from "../Engine/core/Types";
import {heroCase} from "./HeroCaseHarlow1041";

/** Authored fallback performances. Select only against an engine-approved current account. */
export function createHeroLineBank(graph:CaseGraph=heroCase):LineBankEntry[] {
  const bank:LineBankEntry[]=[];
  for(const suspect of graph.cast.suspects) {
    const own=graph.statements.filter(s=>s.speaker===suspect.id);
    const maxLayer=Math.max(...own.map(s=>s.layer));
    for(let layer=0;layer<=maxLayer;layer++) {
      const active=own.filter(s=>s.layer<=layer&&!own.some(next=>!next.replacementFor&&next.topic===s.topic&&next.layer>s.layer&&next.layer<=layer));
      for(const statement of active) {
        for(const mode of ["answer","press","broken"] as AnswerMode[]) {
          const pressing=mode==="press";
          bank.push({suspect:suspect.id,topic:statement.topic,layer,mode,answer:{
            topic:statement.topic,cites:[(pressing?"p:":"a:")+statement.id],
            line:pressing?statement.pressed!.canonical:statement.canonical,
            emotion:mode==="broken"?"rattled":pressing?"irritated":"guarded"
          }});
        }
      }
      const neutral:Record<string,string>={
        deflect:"Ask me something more specific.",
        filler:"Give me a moment to collect myself.",
        lawyered:"I have answered enough. Give me some space."
      };
      for(const mode of ["deflect","filler","lawyered"] as AnswerMode[]) bank.push({suspect:suspect.id,topic:"unclear",layer,mode,answer:{topic:"unclear",cites:["none"],line:neutral[mode],emotion:mode==="lawyered"?"irritated":"guarded"}});
    }
  }
  bank.push({suspect:"S2",topic:"where@22:30",layer:2,mode:"confession",answer:{topic:"where@22:30",cites:["a:C_VALE_ALIBI_2"],line:"I killed Edmund Harlow in the Study with the cable. He was going to expose my forged trust.",emotion:"grieving"}});
  return bank;
}

export const heroLineBank:LineBankEntry[]=createHeroLineBank();

/** activeStatementId distinguishes a harmless same-layer baseline correction. */
export function selectHeroLine(suspect:string,topic:string,layer:number,mode:AnswerMode,activeStatementId?:string):LineBankEntry|undefined {
  if(mode==="confession") return undefined; // Verdict presentation uses the separately exported entry.
  const choices=heroLineBank.filter(entry=>entry.suspect===suspect&&entry.topic===topic&&entry.layer===layer&&entry.mode===mode);
  const ref=(mode==="press"?"p:":"a:")+activeStatementId;
  const selected=activeStatementId?choices.find(entry=>entry.answer.cites.indexOf(ref)>=0):choices.length===1?choices[0]:undefined;
  return selected?JSON.parse(JSON.stringify(selected)) as LineBankEntry:undefined;
}

/** Only the deterministic verdict presenter may consume this performance. */
export const heroFinalConfession:LineBankEntry=heroLineBank.find(entry=>entry.mode==="confession")!;
