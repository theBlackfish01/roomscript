import {RelationType,Tell} from "../core/Types";

export const SUSPECT_SLOTS=["S1","S2","S3","S4"] as const;
export type SuspectSlot=typeof SUSPECT_SLOTS[number];
export const ERAS=["1940s_noir","1970s_disco","modern_startup","victorian"] as const;
export const VOICES=["alloy","ash","ballad","coral","echo","sage","shimmer","verse"] as const;
export const TELLS:Tell[]=["gaze_snap","flicker","hesitation","ring_spike"];
export const MOTIVES=["inheritance","revenge","jealousy","blackmail","debt","coverup","ambition"] as const;
export const SECRETS=["affair","theft","debt","forgery","trespass","eavesdrop","addiction","none"] as const;
export const RELATIONS:RelationType[]=["ally","rival","lover","sibling","debtor","employer","stranger"];
export const ROLE_SLOTS=["WEAPON_CORD","WEAPON_BLUNT","WEAPON_SHARP","WEAPON_POISON","WEAPON_HEAVY","WITNESS_LIGHT","WITNESS_CLOCK","WITNESS_DOOR","WITNESS_SCREEN","WITNESS_MIRROR","WITNESS_PLANT","WITNESS_KETTLE","WITNESS_CUP","CONTAINER_BOX","CONTAINER_CLOTH","ZONE_DESK","ZONE_LOUNGE","ZONE_DOOR"] as const;
export interface PitchSuspect {
  slot:SuspectSlot;name:string;role:string;persona:string;voice:typeof VOICES[number];actingNotes:string;tell:Tell;
  motive:{type:typeof MOTIVES[number];strength:1|2|3;story:string};
  secret:{type:typeof SECRETS[number];roleSlot:string;story:string};
  relations:{to:SuspectSlot;type:RelationType;story:string}[];
  baseline:{truthQ:string;trivialLieQ:string;trivialLieRoleSlot:string};
}
export interface CasePitch {
  theme:string;era:typeof ERAS[number];victim:{name:string;role:string;bio:string};suspects:PitchSuspect[];
  roleNarratives:{roleSlot:string;story:string}[];
  latentEvidence:{type:"letter"|"voicemail"|"receipt"|"photo"|"moved_object";about:SuspectSlot|"V";supports:"motive"|"opportunity"|"alibi"|"secret";gist:string}[];
  signatureObject:{name:string;snap3dPrompt:string;story:string};
}
const str=(maxLength:number)=>({type:"string",minLength:1,maxLength});
const enumeration=(values:readonly string[])=>({type:"string",enum:values.slice()});
const obj=(properties:Record<string,unknown>)=>({type:"object",additionalProperties:false,required:Object.keys(properties),properties});
const list=(items:unknown,minItems:number,maxItems:number)=>({type:"array",items,minItems,maxItems});
/** Closed JSON schema for P1. No timeline, envelope, facts or truth flags are model writable. */
export const CASE_PITCH_SCHEMA=obj({
  theme:str(60),era:enumeration(ERAS),victim:obj({name:str(60),role:str(80),bio:str(240)}),
  suspects:list(obj({slot:enumeration(SUSPECT_SLOTS),name:str(60),role:str(80),persona:str(200),voice:enumeration(VOICES),actingNotes:str(120),tell:enumeration(TELLS),
    motive:obj({type:enumeration(MOTIVES),strength:{type:"integer",enum:[1,2,3]},story:str(200)}),
    secret:obj({type:enumeration(SECRETS),roleSlot:enumeration(ROLE_SLOTS),story:str(200)}),
    relations:list(obj({to:enumeration(SUSPECT_SLOTS),type:enumeration(RELATIONS),story:str(120)}),0,3),
    baseline:obj({truthQ:str(120),trivialLieQ:str(120),trivialLieRoleSlot:enumeration(ROLE_SLOTS)})}),4,4),
  roleNarratives:list(obj({roleSlot:enumeration(ROLE_SLOTS),story:str(120)}),0,20),
  latentEvidence:list(obj({type:enumeration(["letter","voicemail","receipt","photo","moved_object"]),about:enumeration([...SUSPECT_SLOTS,"V"]),supports:enumeration(["motive","opportunity","alibi","secret"]),gist:str(160)}),1,6),
  signatureObject:obj({name:str(60),snap3dPrompt:str(120),story:str(160)})
});
