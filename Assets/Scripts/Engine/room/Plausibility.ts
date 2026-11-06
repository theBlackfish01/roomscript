import {ObjectType} from "../core/Types";
import {WEAPON_TYPES} from "./Affordances";
import {RoomInput} from "./RoomModel";

/** Judges' rule (Nov 5): "a speaker is not a believable weapon". Detected furniture may only take
 * a fictional weapon role when its label names a plausible weapon of that kind. Labels are matched
 * on whole words, lower case. This decides casting plausibility only, never case truth. */
export const PLAUSIBLE_WEAPON_WORDS:Record<"cord"|"blunt"|"sharp"|"poison"|"heavy",readonly string[]>={
  cord:["cable","cord","charger","wire","rope","lead","string","belt","scarf","tie","lanyard","cable tie"],
  blunt:["candlestick","lamp","statue","statuette","vase","bookend","award","trophy","paperweight","figurine","ornament","ashtray","bust","hammer","bat","pan","poker","club","cane"],
  sharp:["knife","letter opener","opener","scissors","blade","razor","dagger","cleaver","shears","letter knife"],
  poison:["bottle","vial","pills","medicine","flask","decanter","poison","tincture","pill"],
  heavy:["bookend","statue","statuette","vase","paperweight","doorstop","bust","dumbbell","iron","brick","anvil","weight","trophy","candlestick","award","lamp"]
};
/** Non-weapon roles for demoted furniture, by label. */
const WITNESS_WORDS:readonly string[]=["speaker","speakers","record player","turntable","radio","stereo","tv","television","monitor","screen","recorder","laptop","phone","tablet","console screen"];
const SOFT_WORDS:readonly string[]=["sofa","couch","chair","armchair","bed","cushion","pillow","ottoman","pouf","beanbag","blanket","rug","curtain","curtains"];

function words(label:string):string {return " "+label.toLowerCase().replace(/[^a-z0-9]+/g," ").trim()+" ";}
const has=(label:string,list:readonly string[])=>{const w=words(label);return list.some(item=>w.includes(" "+item+" "));};

export function isPlausibleWeapon(label:string,type:ObjectType):boolean {
  if(!WEAPON_TYPES.includes(type))return false;
  return has(label,PLAUSIBLE_WEAPON_WORDS[type as keyof typeof PLAUSIBLE_WEAPON_WORDS]);
}
/** The fictional role type for a detected object. Weapon types survive only with a plausible label;
 * otherwise a speaker/record player becomes a recording witness, seating becomes a soft hiding place,
 * and any other furniture (tables, consoles, cabinets) becomes a container hiding place. */
export function plausibleType(label:string,type:ObjectType):ObjectType {
  if(!WEAPON_TYPES.includes(type)||isPlausibleWeapon(label,type))return type;
  if(has(label,WITNESS_WORDS))return "screen";
  if(has(label,SOFT_WORDS))return "soft";
  return "container";
}
/** Fresh room input with implausible weapon roles demoted. Positions, ids, labels and zones are unchanged. */
export function plausibleRoom(input:RoomInput):RoomInput {
  return {...input,zones:input.zones.map(z=>({...z,anchor:[z.anchor[0],z.anchor[1],z.anchor[2]]})),
    objects:input.objects.map(o=>{const type=plausibleType(o.label,o.type);
      const copy={...o,pos:[o.pos[0],o.pos[1],o.pos[2]] as [number,number,number],type};
      if(type!==o.type)delete (copy as {affordances?:string[]}).affordances;
      return copy;})};
}
