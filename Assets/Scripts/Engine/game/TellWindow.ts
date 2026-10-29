/** A stalled renderer must not skip an authorized cue before its first visible frame. */
export function tellWindow(now:number,due:number,until:number|null,duration:number):{started:boolean;active:boolean;until:number|null}{
  if(until===null){if(now<due)return {started:false,active:false,until:null};return {started:true,active:true,until:now+duration};}
  return {started:false,active:now<until,until};
}
