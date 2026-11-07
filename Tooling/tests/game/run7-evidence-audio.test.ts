import {it,expect} from "vitest";
import {NarrativeAudio} from "../../../Assets/Scripts/Engine/game/NarrativeAudio";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame} from "../../../Assets/Scripts/Engine/game/Reducer";
it("plays one kettle effect for a pinch even when several evidence events share it",()=>{
 const graph=createHeroCase(),initial=createGameState(graph),state=reduceGame(graph,initial,{type:"PinchObject",object:"O11",seq:1,by:"test"});
 const events=state.events.filter(e=>e.type==="evidence"&&e.actor==="O11");expect(events.length).toBeGreaterThan(0);state.events.push({...events[0]});
 const audio=new NarrativeAudio(),before=JSON.stringify(state),cues=audio.consume(graph,state).filter(c=>c.kind==="sfx"&&c.name==="Kettle");
 expect(cues).toHaveLength(1);expect(cues[0]).toMatchObject({anchor:"O11"});expect(audio.consume(graph,state)).toEqual([]);expect(JSON.stringify(state)).toBe(before);
});
it("retains a later kettle action but does not revive the removed letter ceremony or blackout",()=>{
 const graph=createHeroCase(),state=reduceGame(graph,createGameState(graph),{type:"PinchObject",object:"O11",seq:1,by:"test"});
 const evidence=state.events.find(e=>e.type==="evidence"&&e.actor==="O11")!;state.events.push({...evidence,seq:2});state.lastSeq=2;
 for(const type of ["latent_letter","blackout"] as const){const id="retired-"+type;graph.beats.push({id,type,reveals:[],minute:45,guaranteed:true,validated:true,canonical:"Retired beat"});state.beatsFired.push(id);state.events.push({type:"beat",seq:2,refs:[id]});}
 const cues=new NarrativeAudio().consume(graph,state),names=cues.filter(c=>c.kind==="sfx").map(c=>c.name);expect(names.filter(name=>name==="Kettle")).toHaveLength(2);expect(names).not.toContain("Letter");expect(names).not.toContain("Blackout");expect(cues.some(c=>c.kind==="voice"||c.kind==="ambience"||c.kind==="score")).toBe(false);
});
