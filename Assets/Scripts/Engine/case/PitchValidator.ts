import {CASE_PITCH_SCHEMA,CasePitch,SuspectSlot,SUSPECT_SLOTS,TELLS,VOICES} from "./CasePitchSchema";
export interface PitchIssue {path:string;code:string;why:string;allowed?:unknown[];}
export interface PitchValidation {ok:boolean;pitch?:CasePitch;errors:PitchIssue[];}
type Schema={type?:string;properties?:Record<string,Schema>;required?:string[];additionalProperties?:boolean;items?:Schema;minItems?:number;maxItems?:number;minLength?:number;maxLength?:number;enum?:unknown[]};
const pointer=(s:string)=>s.replace(/~/g,"~0").replace(/\//g,"~1");
/** Strict structural validation precedes domain checks; arbitrary objects never enter generation. */
export function validatePitch(input:unknown,culpritSlot:SuspectSlot):PitchValidation {
  const errors:PitchIssue[]=[];
  const add=(path:string,code:string,why:string,allowed?:unknown[])=>errors.push({...{path,code,why},...(allowed?{allowed}: {})});
  const walk=(value:unknown,schema:Schema,path:string):void=>{
    if(schema.enum&&!schema.enum.includes(value)){add(path,"ENUM","Value is not in the allowed enum.",schema.enum);return;}
    if(schema.type==="object") {
      if(!value||typeof value!=="object"||Array.isArray(value)){add(path,"SCHEMA","Expected an object.");return;}
      const record=value as Record<string,unknown>;
      for(const key of schema.required||[])if(!Object.prototype.hasOwnProperty.call(record,key))add(path+"/"+pointer(key),"REQUIRED","Required field is missing.");
      for(const key of Object.keys(record)) {
        if(!Object.prototype.hasOwnProperty.call(schema.properties||{},key)){add(path+"/"+pointer(key),"UNKNOWN_FIELD","Field is outside the pitch contract.");continue;}
        walk(record[key],schema.properties![key],path+"/"+pointer(key));
      }
    } else if(schema.type==="array") {
      if(!Array.isArray(value)){add(path,"SCHEMA","Expected an array.");return;}
      if(value.length<(schema.minItems||0)||value.length>(schema.maxItems??Infinity))add(path,"LENGTH","Array length is outside its bounds.");
      value.slice(0,100).forEach((entry,i)=>walk(entry,schema.items!,path+"/"+i));
    } else if(schema.type==="string") {
      if(typeof value!=="string"||!value.trim()||value.length>(schema.maxLength??Infinity))add(path,"SCHEMA","Expected bounded, nonempty text.");
      else if(/\b(fuck|shit|nazi|porn|dismember|decapitat\w*|google|apple|microsoft|tesla|coca-cola|netflix|openai)\b/i.test(value))add(path,"CONTENT","Text contains a restricted profanity, graphic term, or modern brand.");
    } else if(schema.type==="integer"&&!Number.isSafeInteger(value))add(path,"SCHEMA","Expected an integer.");
  };
  walk(input,CASE_PITCH_SCHEMA as Schema,"");
  if(errors.length)return {ok:false,errors};
  const pitch=input as CasePitch;
  if(!SUSPECT_SLOTS.includes(culpritSlot))return {ok:false,errors:[{path:"/suspects",code:"CULPRIT_SLOT",why:"Engine supplied an invalid culprit slot."}]};
  const names=new Set([pitch.victim.name.trim().toLowerCase()]);const voices=new Set<string>();const tells=new Set<string>();
  pitch.suspects.forEach((s,i)=>{
    const path="/suspects/"+i;
    if(s.slot!==SUSPECT_SLOTS[i])add(path+"/slot","SLOT_ORDER","Suspects must match engine slot order.",[SUSPECT_SLOTS[i]]);
    const name=s.name.trim().toLowerCase();if(names.has(name))add(path+"/name","DUPLICATE_NAME","All cast names must be unique.");names.add(name);
    if(voices.has(s.voice))add(path+"/voice","DUPLICATE_VOICE","Suspects need distinct voices.",VOICES.filter(v=>!pitch.suspects.some(p=>p.voice===v)));voices.add(s.voice);
    if(tells.has(s.tell))add(path+"/tell","DUPLICATE_TELL","Suspects need distinct tells.",TELLS.filter(v=>!pitch.suspects.some(p=>p.tell===v)));tells.add(s.tell);
    if(s.slot===culpritSlot?s.motive.strength!==3:s.motive.strength>2)add(path+"/motive/strength","MOTIVE_STRENGTH","Only the preassigned culprit has strength three.",s.slot===culpritSlot?[3]:[1,2]);
    if(s.slot!==culpritSlot&&s.secret.type==="none")add(path+"/secret/type","SECRET_REQUIRED","Every innocent needs a concrete secret.",["theft","debt","forgery","trespass","eavesdrop"]);
    const seen=new Set<string>();
    s.relations.forEach((r,j)=>{
      const target=pitch.suspects.find(p=>p.slot===r.to);const back=target?.relations.find(q=>q.to===s.slot);
      if(r.to===s.slot||seen.has(r.to))add(path+"/relations/"+j+"/to","RELATION_TARGET","Relation must target another suspect exactly once.",SUSPECT_SLOTS.filter(id=>id!==s.slot));
      seen.add(r.to);
      const reciprocal=r.type==="debtor"?"employer":r.type==="employer"?"debtor":r.type;
      if(!back||back.type!==reciprocal)add(path+"/relations/"+j+"/type","RELATION_ASYMMETRIC","Relation needs a compatible reciprocal entry.",back?[back.type==="debtor"?"employer":back.type==="employer"?"debtor":back.type]:undefined);
    });
  });
  return errors.length?{ok:false,errors}:{ok:true,pitch:JSON.parse(JSON.stringify(pitch)) as CasePitch,errors};
}
