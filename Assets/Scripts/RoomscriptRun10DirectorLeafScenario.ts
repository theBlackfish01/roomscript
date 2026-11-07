import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptRun10LeafDriver} from "./RoomscriptRun10LeafDriver";
import {RoomscriptMain} from "./RoomscriptMain";
/** Muted real-control staging for Run 10 captures. No hidden-answer fixture. */
@component export class RoomscriptRun10DirectorLeafScenario extends Scenario {
 async run(config?:ScenarioConfig):Promise<void>{await sleep(700);const d=new RoomscriptRun10LeafDriver(),beat=config?.get("beat")||"row",hold=Math.max(0,Math.min(45,Number(config?.get("hold")||"15"))),suspect=config?.get("suspect")||"S2";
   expect(["opening","row","ask","answer","find","show","where","weapon","catch","freeze","newspaper"].includes(beat)).toBe(true);
   d.opening.setFilmMode(true);d.flow.client.forceOffline=true;d.audio.silence(true);
   const previous=findSceneObjectByName("Run10DirectorEye");if(previous)previous.destroy();const eye=global.scene.createSceneObject("Run10DirectorEye");
   if(["row","ask","answer","show","where","weapon","catch"].includes(beat)){const at=new vec3(-200,-20,-210),target=new vec3(-140,-40,-340);eye.getTransform().setWorldPosition(at);eye.getTransform().setWorldRotation(quat.lookAt(at.sub(target).normalize(),vec3.up()));}
   else{eye.getTransform().setWorldPosition(vec3.zero());eye.getTransform().setWorldRotation(quat.quatIdentity());}
   d.opening.cast.actors().forEach(actor=>actor.camera=eye);
   if(beat!=="opening")await d.open();
   if(["row","ask","answer"].includes(beat)){await d.tap("Question "+suspect);if(beat!=="row")await d.tap("Ask");if(beat==="answer"){await d.tap("Ask where@22:30");d.flow.subtitles.holdForCapture(hold+1);}}
   if(beat==="find")await d.find(config?.get("object")||"O14");
   if(beat==="show"){await d.ask();await d.find("O11");await d.find("O12");await d.tap("Question S2");await d.tap("Show");}
   if(beat==="catch"){const main=findSceneObjectByName("Roomscript").getComponent(RoomscriptMain.getTypeName()) as RoomscriptMain;await d.ask();await d.find("O11");await d.show("O11");await d.waitUntil(()=>!!main.replays.diagnostics().active,"caught truth ghost",10000);main.replays.holdFor(hold+2);}
   if(["where","weapon","freeze","newspaper"].includes(beat)){
     await d.prove();const answer=d.knownAnswer();await d.tap("Question "+answer.who);await d.tap("Accuse");
     if(beat!=="where")await d.tap("Where "+answer.where);
     if(beat==="freeze"||beat==="newspaper"){
       await d.tap("Weapon "+answer.what);if(beat==="freeze")d.closing.holdAtBeat("freeze",hold+5);await d.tap("Break seal",false);
       const node=beat==="freeze"?"RoomscriptFrozenTableau":"RoomscriptNewspaper";
       await d.waitUntil(()=>{const object=findSceneObjectByName(node);return !!object&&object.enabled;},node);
     }
   }
   console.log("RUN10_DIRECTOR_READY|"+JSON.stringify({beat,suspect,hold,actions:d.actions.length,row:d.flow.row.diagnostics(),subtitle:d.flow.subtitles.visibleLine()}));
   if(hold>0)await sleep(hold*1000);console.log("RUN10_DIRECTOR_COMPLETE|"+beat);
 }
}
