import {CaseGraph,LineBankEntry,ObjectType,RoomObject} from "../Engine/core/Types";
import {CompileResult,compileCase} from "../Engine/case/CaseCompiler";
import {RoomInput,normalizeRoom} from "../Engine/room/RoomModel";
import {generatedLineBank,generatedPerformances,generatedPhrasePlans,PhrasePlan} from "../Engine/perf/GeneratedPerformance";
import {getPitch} from "./PitchLibrary";

export interface DynamicCaseResult {ok:boolean;graph?:CaseGraph;lineBank:LineBankEntry[];phrasePlans:PhrasePlan[];compilation?:CompileResult;error?:string;scenery?:RoomObject[];activeZoneIds?:string[];}
const roleFor:Record<ObjectType,string>={cord:"WEAPON_CORD",blunt:"WEAPON_BLUNT",sharp:"WEAPON_SHARP",poison:"WEAPON_POISON",heavy:"WEAPON_HEAVY",light:"WITNESS_LIGHT",clock:"WITNESS_CLOCK",door:"WITNESS_DOOR",screen:"WITNESS_SCREEN",mirror:"WITNESS_MIRROR",plant:"WITNESS_PLANT",kettle:"WITNESS_KETTLE",cup:"WITNESS_CUP",container:"CONTAINER_BOX",soft:"CONTAINER_CLOTH"};
/** Camera observations propose furniture only; the deterministic compiler deals and proves the case. */
export function prepareDynamicCase(seed:number,input:RoomInput):DynamicCaseResult {
  try {
    const observed=normalizeRoom(input),physical=observed.objects.filter(o=>!o.virtual);
    // Three occupied play zones keep the room legible; other detected furniture
    // stays scenery. Do not invent a third sensed area when coverage is absent.
    const zones=observed.zones.filter(z=>physical.some(o=>o.zone===z.id)).sort((a,b)=>physical.filter(o=>o.zone===b.id).length-physical.filter(o=>o.zone===a.id).length||(a.id<b.id?-1:1)).slice(0,3);
    if(zones.length<3)return {ok:false,lineBank:[],phrasePlans:[],error:"Scan needs objects in three active room zones."};
    const activeZoneIds=zones.map(z=>z.id),objects=physical.filter(o=>activeZoneIds.includes(o.zone)),scenery=physical.filter(o=>!activeZoneIds.includes(o.zone));
    const room=normalizeRoom({source:observed.source,zones,objects}),pitch=getPitch(seed);
    // Assign narrative roles to observed object types; no extra recorder/box is
    // manufactured just because an authored pitch originally mentioned one.
    const available=Array.from(new Set(objects.map(o=>roleFor[o.type]))).sort();
    const remap=(role:string)=>{
      if(role.startsWith("ZONE_")||available.includes(role))return role;
      const family=role.split("_")[0];
      const preferred=available.find(candidate=>candidate.startsWith(family+"_"));
      return preferred||available[0];
    };
    for(const suspect of pitch.suspects){suspect.secret.roleSlot=remap(suspect.secret.roleSlot);suspect.baseline.trivialLieRoleSlot=remap(suspect.baseline.trivialLieRoleSlot);}
    pitch.roleNarratives=Array.from(new Set(pitch.roleNarratives.map(r=>remap(r.roleSlot)))).map(roleSlot=>({roleSlot,story:"An observed room object holds a fictional memory of the guests' private business."}));
    const compilation=compileCase(seed,room,pitch,{fictionalMemories:true});
    if(!compilation.ok)return {ok:false,lineBank:[],phrasePlans:[],compilation};
    const graph=compilation.graph!;
    if(graph.room.objects.filter(o=>o.id.startsWith("REC_")).length>3)return {ok:false,lineBank:[],phrasePlans:[],error:"More than three fallback memory witnesses would be needed.",compilation};
    graph.story={spine:[`F_AT_V_${graph.murderSlot}`,`F_AT_${graph.envelope.who}_${graph.murderSlot}`,"F_MURDER_TOUCH",`F_MOTIVE_${graph.envelope.who}`],
      secrets:Object.fromEntries(graph.cast.suspects.filter(s=>s.id!==graph.envelope.who).map(s=>[s.id,[`F_SECRET_${s.id}`]]))};
    graph.performances=generatedPerformances(graph);
    return {ok:true,graph,lineBank:generatedLineBank(graph),phrasePlans:generatedPhrasePlans(graph),compilation,scenery,activeZoneIds};
  }catch(error){return {ok:false,lineBank:[],phrasePlans:[],error:error instanceof Error?error.message:String(error)};}
}
