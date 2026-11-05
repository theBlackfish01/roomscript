import {CaseGraph,Fact,Id,ObjectType,RoomScan,Suspect} from "../core/Types";
import {Prng} from "../core/Prng";
import {canonicalJson} from "../core/CanonicalJson";
import {hashHex} from "../core/Hash";
import {bindRoles,isWeapon,isWitness,RoleRequest} from "../room/Affordances";
import {buildRoom,normalizeRoom} from "../room/RoomModel";
import {CasePitch,ROLE_SLOTS,SuspectSlot,SUSPECT_SLOTS} from "./CasePitchSchema";

export interface TimelineEntry {slot:number;actor:Id;zone:Id;action:"wait"|"move"|"inspect"|"hide_secret"|"murder";touched:Id[];}
export interface Simulation {graph:CaseGraph;bindings:Record<string,Id>;timeline:TimelineEntry[];observedFacts:Id[];witnesses:Record<Id,Id[]>;murderSlot:number;secretFacts:Record<Id,Id>;baselineFacts:Record<Id,Id>;}
export function culpritForSeed(seed:number):SuspectSlot {return new Prng(seed,"culprit").pick(SUSPECT_SLOTS);}
const roleTypes:Record<string,ObjectType>={WEAPON_CORD:"cord",WEAPON_BLUNT:"blunt",WEAPON_SHARP:"sharp",WEAPON_POISON:"poison",WEAPON_HEAVY:"heavy",WITNESS_LIGHT:"light",WITNESS_CLOCK:"clock",WITNESS_DOOR:"door",WITNESS_SCREEN:"screen",WITNESS_MIRROR:"mirror",WITNESS_PLANT:"plant",WITNESS_KETTLE:"kettle",WITNESS_CUP:"cup",CONTAINER_BOX:"container",CONTAINER_CLOTH:"soft"};

/** Preserve observed furniture. Missing witnesses are explicit, positioned virtual case recorders. */
export function bindCaseRoom(input:RoomScan,pitch:CasePitch,memoryWitnesses=false):{room:RoomScan;bindings:Record<string,Id>;witnesses:Record<Id,Id[]>} {
  const requested=Array.from(new Set(pitch.roleNarratives.map(r=>r.roleSlot).concat(pitch.suspects.flatMap(s=>[s.secret.roleSlot,s.baseline.trivialLieRoleSlot])))).sort();
  const requests:RoleRequest[]=requested.filter(role=>!!roleTypes[role]).map(role=>({role,type:roleTypes[role]}));
  let room=buildRoom(input,{roles:requests,minWeapons:3,minWitnesses:2,fictionalMemories:memoryWitnesses});
  const binding=bindRoles(room,requests);if(binding.missing.length)throw new Error("Unbound roles: "+binding.missing.join(","));
  const bindings=binding.bindings;
  const zones=room.zones;
  for(const role of ROLE_SLOTS.filter(r=>r.startsWith("ZONE_"))) {
    const word=role==="ZONE_DESK"?"study":role==="ZONE_LOUNGE"?"lounge":"hall";
    bindings[role]=(zones.find(z=>z.clueName.toLowerCase()===word)||zones[role==="ZONE_DESK"?0:role==="ZONE_LOUNGE"?1:2]).id;
  }
  const witnesses:Record<Id,Id[]>={};
  for(const zone of room.zones) {
    // A clock/state-only witness cannot independently prove who occupied a zone.
    // Dynamic's disclosed fictional memories are authored into real furniture;
    // this is not a claim that a sofa is a real sensor or that vision proved a crime.
    const existing=room.objects.filter(o=>o.zone===zone.id&&(memoryWitnesses?!o.virtual:isWitness(o)&&o.affordances.some(a=>["witness:sight","witness:presence","witness:record","witness:reflection","witness:passage"].includes(a))));
    while(existing.length<2) {
      let id="REC_"+zone.id+"_"+(existing.length+1);while(room.objects.some(o=>o.id===id))id+="x";
      const occupied=room.objects.filter(o=>o.zone===zone.id);
      const x=Math.max(zone.anchor[0],...occupied.map(o=>o.pos[0]))+35;
      const object={id,label:zone.clueName+" case recorder "+(existing.length+1),type:"screen" as const,zone:zone.id,pos:[x,zone.anchor[1]+110,zone.anchor[2]] as [number,number,number],origin:"substitution" as const,virtual:true,confidence:1,affordances:["witness:record"]};
      room.objects.push(object);existing.push(object);
    }
    witnesses[zone.id]=existing.map(o=>o.id);
  }
  room=normalizeRoom(room);
  if(memoryWitnesses)for(const object of room.objects)if(!object.virtual)object.affordances.push("case:fictional-memory");
  return {room,bindings,witnesses};
}

/** Samples a complete actor/object history; prose supplies character, never event truth. */
export function simulateCase(seed:number,input:RoomScan,pitch:CasePitch,attempt=0,memoryWitnesses=false):Simulation {
  const bound=bindCaseRoom(input,pitch,memoryWitnesses);const room=bound.room;
  const rng=new Prng(seed,"compile").fork("attempt:"+attempt);const paths=rng.fork("paths"),weaponStream=rng.fork("weapons");
  const culprit=culpritForSeed(seed);const weapons=weaponStream.shuffle(room.objects.filter(isWeapon).map(o=>o.id)).slice(0,5).sort();
  const weapon=weaponStream.pick(weapons);const murderZone=room.objects.find(o=>o.id===weapon)!.zone;
  const otherZones=room.zones.filter(z=>z.id!==murderZone).map(z=>z.id);
  const murderSlot=rng.fork("time").int(5,9);const secretSlot=murderSlot-2;
  const slots=Array.from({length:12},(_,i)=>String(21+Math.floor(i/4)).padStart(2,"0")+":"+String(i%4*15).padStart(2,"0"));
  const cast:Suspect[]=pitch.suspects.map(s=>({id:s.slot,name:s.name,nicknames:[],persona:s.role+". "+s.persona,voice:s.voice,actingNotes:s.actingNotes,tell:s.tell,tellProp:s.tell==="gaze_snap"?"brooch":s.tell==="flicker"?"lighter":s.tell==="hesitation"?"glasses":"glove",composureMax:s.slot===culprit?3:2,secret:s.secret.story,relations:s.relations.map(r=>({to:r.to,type:r.type})),baseline:{truthTopic:"background",lieTopic:"borrowed_item"}}));
  const facts:Fact[]=[];const observedFacts:Id[]=[];const timeline:TimelineEntry[]=[];const actorZones:Record<Id,Id[]>={};
  const names:Record<string,string>={V:pitch.victim.name};for(const s of cast)names[s.id]=s.name;
  const add=(fact:Fact,observe=false)=>{facts.push(fact);if(observe)observedFacts.push(fact.id);return fact.id;};
  for(const actor of ["V",...SUSPECT_SLOTS]) {
    const actorRng=paths.fork(actor);const zones=Array.from({length:12},()=>actorRng.pick(room.zones).id);
    zones[murderSlot]=actor==="V"||actor===culprit?murderZone:actorRng.pick(otherZones);
    if(actor!=="V")zones[murderSlot-1]=zones[murderSlot];
    if(actor==="V")for(let slot=murderSlot;slot<12;slot++)zones[slot]=murderZone;
    const pitched=pitch.suspects.find(s=>s.slot===actor);
    if(pitched){const role=bound.bindings[pitched.secret.roleSlot];const object=room.objects.find(o=>o.id===role);zones[secretSlot]=object?.zone||room.zones.find(z=>z.id===role)?.id||zones[secretSlot];}
    actorZones[actor]=zones;
    for(let slot=0;slot<12;slot++) {
      const action=actor===culprit&&slot===murderSlot?"murder":pitched&&slot===secretSlot?"hide_secret":slot>0&&zones[slot]!==zones[slot-1]?"move":"wait";
      const touches:Id[]=actor===culprit&&slot===murderSlot?[weapon]:[];
      timeline.push({slot,actor,zone:zones[slot],action,touched:touches});
      add({id:`F_AT_${actor}_${slot}`,pred:"at",args:{who:actor,zone:zones[slot]},slot,truth:true,canonical:`${names[actor]} was in ${room.zones.find(z=>z.id===zones[slot])!.clueName} at ${slots[slot]}.`,entities:[actor,zones[slot]]},slot===murderSlot);
    }
  }
  for(const candidate of weapons) {
    const object=room.objects.find(o=>o.id===candidate)!;
    const carrier=candidate===weapon?culprit:weaponStream.pick(SUSPECT_SLOTS.filter(id=>id!==culprit));
    const destination=actorZones[carrier][murderSlot-1];
    const carrying=timeline.find(e=>e.actor===carrier&&e.slot===murderSlot-1)!;
    carrying.action="move";carrying.touched.push(candidate);
    let previousZone=object.zone;
    for(let slot=0;slot<12;slot++) {
      // The culprit handles the murder tool; innocent earlier handling supplies means without opportunity.
      const earlierHandler=SUSPECT_SLOTS.filter(id=>id!==culprit)[slot];
      const zone=candidate===weapon&&earlierHandler?actorZones[earlierHandler][slot]:slot<murderSlot-1?previousZone:destination;
      add({id:`F_IN_${candidate}_${slot}`,pred:"in",args:{obj:candidate,zone},slot,truth:true,canonical:`The ${object.label} was in ${room.zones.find(z=>z.id===zone)!.clueName} at ${slots[slot]}.`,entities:[candidate,zone]},slot===murderSlot);
      previousZone=zone;
    }
  }
  const secretFacts:Record<Id,Id>={},baselineFacts:Record<Id,Id>={};
  for(const s of pitch.suspects) {
    const role=bound.bindings[s.secret.roleSlot];const zone=actorZones[s.slot][secretSlot];
    const roleName=room.objects.find(o=>o.id===role)?.label||room.zones.find(z=>z.id===role)?.clueName||"case item";
    secretFacts[s.slot]=add({id:`F_SECRET_${s.slot}`,pred:"state",args:{obj:s.slot,key:"secret",value:s.secret.type},slot:secretSlot,truth:true,suspicious:s.slot!==culprit,canonical:`${s.name} concealed ${s.secret.type} involving the ${roleName} at ${slots[secretSlot]}.`,entities:[s.slot,...(role?[role]:[])]},true);
    const baseRole=bound.bindings[s.baseline.trivialLieRoleSlot];
    baselineFacts[s.slot]=add({id:`F_BASE_${s.slot}`,pred:"state",args:{obj:s.slot,key:memoryWitnesses?"touched_fixture":"borrowed",value:baseRole},slot:secretSlot,truth:true,canonical:`${s.name} ${memoryWitnesses?"touched":"borrowed"} the ${room.objects.find(o=>o.id===baseRole)?.label||room.zones.find(z=>z.id===baseRole)?.clueName}.`,entities:[s.slot,baseRole]},true);
    add({id:`F_MOTIVE_${s.slot}`,pred:"motive",args:{who:s.slot,type:s.motive.type,strength:s.motive.strength},truth:true,canonical:`${s.name} had a dispute with ${pitch.victim.name} over ${s.motive.type}.`,entities:[s.slot,"V"]},true);
    const touchSlot=SUSPECT_SLOTS.filter(id=>id!==culprit).indexOf(s.slot);
    const entry=timeline.find(e=>e.actor===s.slot&&e.slot===touchSlot);
    if(s.slot!==culprit) {
      // Innocents handle the eventual weapon earlier, in their own zone, then leave before murder.
      entry!.action="inspect";entry!.touched.push(weapon);
      add({id:`F_HANDLED_${s.slot}`,pred:"touched",args:{who:s.slot,obj:weapon},slot:touchSlot,truth:true,canonical:`${s.name} handled the ${room.objects.find(o=>o.id===weapon)!.label} before the final interval.`,entities:[s.slot,weapon]});
    }
    // A separate recordable state in the secret's physical zone gives every innocent a breakable secret.
    bound.witnesses[s.slot]=bound.witnesses[zone];
  }
  add({id:"F_MURDER_TOUCH",pred:"touched",args:{who:culprit,obj:weapon},slot:murderSlot,truth:true,canonical:`${names[culprit]} handled the ${room.objects.find(o=>o.id===weapon)!.label} at ${slots[murderSlot]}.`,entities:[culprit,weapon]},true);
  const compilerVersion=memoryWitnesses?"roomscript-compiler-3-memory":"roomscript-compiler-2";
  const identity={seed,attempt,room:room.roomId,pitch,...(memoryWitnesses?{compilerVersion}: {})};
  const graph:CaseGraph={schema:1,caseId:"RS-"+hashHex(canonicalJson(identity)),seed,pitchHash:hashHex(canonicalJson(pitch)),compilerVersion,era:pitch.era,room,slots,murderSlot,bodyFound:slots[murderSlot].slice(0,3)+String(Number(slots[murderSlot].slice(3))+11).padStart(2,"0"),envelope:{who:culprit,where:murderZone,what:weapon},cast:{victim:{id:"V",name:pitch.victim.name},suspects:cast},weapons,facts,witnessing:[],evidence:[],statements:[],refutation:{order:[],cards:{}},beats:[],requiredDeductions:[],clockMinutes:180};
  return {graph,bindings:bound.bindings,timeline,observedFacts,witnesses:bound.witnesses,murderSlot,secretFacts,baselineFacts};
}
