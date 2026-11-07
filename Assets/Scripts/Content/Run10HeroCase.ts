import {CaseGraph,RoomObject,Vec3} from "../Engine/core/Types";
import {hashHex} from "../Engine/core/Hash";
import {createHeroCase} from "./HeroCaseHarlow1041";
import {applyPresetEveningRoom,PRESET_CONSOLE_TOP} from "./PresetEveningRoom";

/** The retained historical graph is for tapes and engine regression fixtures. This is the wearer build. */
export const RUN10_FIND_OBJECTS:readonly string[]=["O1","O2","O3","O4","O5","O11","O12","O13","O14","O15"];
export const RUN10_PAPERS:Record<string,{title:string;body:string}>={
  O13:{title:"THE HARLOW TRUST",body:"Vale's trust accounts are forged.\nI am sending the originals to the police.\nEdmund Harlow"},
  O14:{title:"DEBT NOTE",body:"Payable to Edmund Harlow\nSigned: Imran Qadir\nTorn at the coat-pocket fold"},
  O15:{title:"CERTIFICATE OF PROVENANCE",body:"Authenticated by Jonah Pike\nReplacement copy\nRain-spotted paper"}
};

/** Positions derive from the authored support map, not new scan claims. Capture the new paper footprints. */
export const RUN10_PAPER_POSITIONS:Record<string,Vec3>={
  O14:[-135,PRESET_CONSOLE_TOP[1],-462], // Hall end of the console, clear of the left speaker and letter knife.
  O15:[95,PRESET_CONSOLE_TOP[1],-462] // Existing console ledge beside the window; this Preview room has no raised sill.
};

export function isRun10HeroCase(graph:Pick<CaseGraph,"caseId">):boolean{return graph.caseId.startsWith("HARLOW-1041@")&&graph.caseId.endsWith(":run10");}

/** Remap physical observations only: no fact, assertion, breaker, deduction or verdict rule is rewritten. */
export function applyRun10HeroCase(source:CaseGraph):CaseGraph {
  if(!source.caseId.startsWith("HARLOW-1041@"))throw new Error("Run 10 remap requires the authored Harlow case");
  const graph=JSON.parse(JSON.stringify(source)) as CaseGraph;
  if(isRun10HeroCase(graph))return graph;
  const letter=graph.room.objects.find(o=>o.id==="O13")!;
  Object.assign(letter,{label:"Harlow's letter",type:"soft",affordances:["evidence:paper"],origin:"substitution",virtual:true,synonyms:["letter","trust letter","Harlow's letter"]});
  const paper=(id:string,label:string,zone:string,synonyms:string[]):RoomObject=>({id,label,zone,type:"soft",pos:RUN10_PAPER_POSITIONS[id].slice() as Vec3,affordances:["evidence:paper"],origin:"substitution",virtual:true,synonyms});
  graph.room.objects.push(paper("O14","Imran's debt note","Z3",["note","debt note","signed note"]),paper("O15","Pike's forged certificate","Z5",["certificate","provenance","forged certificate"]));
  const remap:Record<string,{holder:string;canonical:string;entities?:string[]}>= {
    E_VICTIM_LAMP:{holder:"O12",canonical:"The recorder places Harlow at the Study desk at 22:30.",entities:["O12","V","Z1","22:30"]},
    E_VICTIM_MUG:{holder:"O12",canonical:"The recording catches Harlow knocking the mug from the Study desk at 22:30.",entities:["O12","O9","V","Z1","22:30"]},
    E_CLOCK_FOUND:{holder:"O12",canonical:"The recorder's timestamp marks the alarm raised at 22:41.",entities:["O12","22:41"]},
    E_KETTLE_COLD:{holder:"O11",canonical:"The kettle is stone cold. There was no boiling tea during the murder window."},
    E_CABLE:{holder:"O1",canonical:"Harlow's collar fibres are caught in the charger cable Vale handled."},
    E_TRUST_NOTE:{holder:"O13",canonical:"Harlow's letter names Vale's forged trust accounts and his intended report to the police."},
    E_LETTER:{holder:"O13",canonical:"Harlow's letter names Vale's forged trust accounts and his intended report to the police.",entities:["O13","V","S2"]},
    E_S1_ALIBI:{holder:"O14",canonical:"Imran's signed debt note was torn from Harlow's coat pocket in the Hall. It places Imran there at 22:30.",entities:["O14","S1","V","Z3","22:30"]},
    E_S3_ALIBI:{holder:"O4",canonical:"The unlogged medicine bottle bears Okafor's handwriting. It places her in the Kitchen at 22:30.",entities:["O4","S3","Z4","22:30"]},
    E_S4_ALIBI:{holder:"O15",canonical:"Pike's forged certificate lies rain-spotted on the Conservatory ledge by the window. It places Pike there at 22:30.",entities:["O15","S4","Z5","22:30"]},
    // Historical baseline proofs remain available to engine fixtures, but none is collected by a main-flow item.
    E_S3_BASELINE:{holder:"O6",canonical:"Okafor's glasses have a visible smudge.",entities:["S3","O6"]}
  };
  for(const evidence of graph.evidence){
    const change=remap[evidence.id];if(change)Object.assign(evidence,change);
    if(evidence.id==="E_LETTER"){evidence.latent=false;delete evidence.beat;evidence.costMinutes=10;}
    if(/^E_O[2-5]_LOCATION$/.test(evidence.id))evidence.canonical=evidence.canonical.replace(" remembers remaining"," remained");
  }
  // The letter is found physically; the blackout/UV reward is retired. Its truth fact remains in the graph.
  graph.beats=graph.beats.filter(b=>b.id!=="B_LETTER"&&b.id!=="B_BLACKOUT");
  graph.evidence=graph.evidence.filter(e=>e.id!=="E_UV_DRAG");
  graph.witnessing=graph.evidence.filter(e=>e.kind==="object_memory").flatMap(e=>e.proves.map(fact=>({witness:e.holder,fact,channel:"record" as const})));
  graph.room.roomId+=":run10";graph.caseId="HARLOW-1041@"+graph.room.roomId;
  graph.pitchHash=hashHex(source.pitchHash+":find-ask-catch-v1");
  delete graph.solver;
  return graph;
}

/** Production factory: place the historical case first, then add the two new paper supports. */
export function createRun10HeroCase():CaseGraph{return applyRun10HeroCase(applyPresetEveningRoom(createHeroCase()));}
