import {it,expect} from "vitest";
import {partnerLine,PartnerTrigger} from "../../../Assets/Scripts/Engine/game/Partner";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame} from "../../../Assets/Scripts/Engine/game/Reducer";
it("Wren stays truth-blind even if the sealed envelope is changed",()=>{const g=createHeroCase(),k=createGameState(g).knowledge;for(const trigger of ["opening","first-tell","first-objection","letter","voicemail","flight","blackout","idle","seal"] as PartnerTrigger[]){const before=partnerLine(g,k,trigger);g.envelope.who="S1";expect(partnerLine(g,k,trigger)).toEqual(before);expect(before.factIds).toEqual([]);expect(before.text).not.toContain("Vale")}});
it("names one supported hypothesis only when the notebook proves it",()=>{const g=createHeroCase();let s=createGameState(g);for(const object of g.room.objects)s=reduceGame(g,s,{type:"PinchObject",object:object.id,seq:s.lastSeq+1,by:"test"});expect(partnerLine(g,s.knowledge,"seal").text).toContain("Marguerite Vale");for(const id of partnerLine(g,s.knowledge,"seal").factIds)expect(s.knowledge.factIds).toContain(id);});
