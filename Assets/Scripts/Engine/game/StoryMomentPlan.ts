import {CaseGraph,GameState,Vec3} from "../core/Types";
import {isHarlowPreset} from "./NarrativeAudio";
export interface StoryMomentPlan {id:string;kind:"letter"|"voicemail"|"flight"|"blackout";caption:string;position:Vec3;evidence?:string;suspect?:string;}
/** Projection of fired engine beats and admitted evidence only. No hidden envelope lookup. */
export function storyMomentPlans(graph:CaseGraph,state:GameState):StoryMomentPlan[] {
  if(state.caseId!==graph.caseId||state.verdict)return [];
  const out:StoryMomentPlan[]=[];
  for(const beat of graph.beats){
    if(!beat.validated||!state.beatsFired.includes(beat.id)||!state.events.some(e=>e.type==="beat"&&e.refs?.includes(beat.id)))continue;
    if(beat.type==="suspect_wants_to_leave"){
      if(isHarlowPreset(graph)&&graph.cast.suspects.some(s=>s.id==="S4"))out.push({id:beat.id,kind:"flight",caption:beat.canonical,position:[0,0,0],suspect:"S4"});
      continue;
    }
    const evidence=graph.evidence.find(e=>beat.reveals.includes(e.id)&&state.knowledge.evidenceIds.includes(e.id)&&e.proves.every(id=>state.knowledge.factIds.includes(id)));
    if(!evidence)continue;
    const object=graph.room.objects.find(o=>o.id===evidence.holder),zone=graph.room.zones.find(z=>z.id===(object?.zone||evidence.holder));
    const support=object||graph.room.objects.find(o=>o.zone===zone?.id&&o.type==="soft")||graph.room.objects.find(o=>o.zone===zone?.id);
    const position=(support?.pos||zone?.anchor)?.slice() as Vec3|undefined;if(!position)continue;
    const kind=beat.type==="latent_letter"?"letter":beat.type==="voicemail"?"voicemail":beat.type==="blackout"?"blackout":null;
    if(kind)out.push({id:beat.id,kind,caption:beat.canonical,position,evidence:evidence.id});
  }
  return out;
}
/** Fixed presentation phases; time never mutates the game clock or creates facts. */
export function blackoutPhase(seconds:number):{dim:number;uv:boolean;done:boolean} {
  const t=Math.max(0,seconds);return {dim:t<.4?t/.4:t<2.4?1:t<4?1-(t-2.4)/1.6:0,uv:t>=.6,done:t>=4};
}
export function flightFraction(seconds:number):number {const t=Math.max(0,seconds);return t<2?t/2:t<3?1:t<5?1-(t-3)/2:0;}
