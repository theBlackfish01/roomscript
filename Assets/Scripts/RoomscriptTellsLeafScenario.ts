import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptRun10LeafDriver} from "./RoomscriptRun10LeafDriver";
import {RoomscriptTellVisual} from "./RoomscriptTellVisual";
/** A real alibi lie tells; a truthful account and unsupported free question do not. */
@component export class RoomscriptTellsLeafScenario extends Scenario {
 async run():Promise<void>{await sleep(700);const d=new RoomscriptRun10LeafDriver(),tells=findSceneObjectByName("RoomscriptTells").getComponent(RoomscriptTellVisual.getTypeName()) as RoomscriptTellVisual,old=d.flow.client.forceOffline,muted=d.audio.speechMuted();d.flow.client.forceOffline=true;d.audio.silence(true);
  try{await d.open();await d.tap("Question S2");const before=tells.diagnostics().count;let sawProp=false,sawTarget=false;
   const answer=d.flow.askChip("where@22:30");await sleep(50);
   while(d.flow.diagnostics().busy||d.audio.speechBusy()){d.checkDeadline();const tell=tells.diagnostics();sawProp=sawProp||tell.prop;sawTarget=sawTarget||(tell.line&&tell.target==="O11");await sleep(30);}await answer;
   expect(tells.diagnostics().count).toBe(before+1);expect(sawProp).toBe(true);expect(sawTarget).toBe(true);expect(tells.diagnostics().delayMs>=290).toBe(true);
   const lies=tells.diagnostics().count;await d.flow.askFree("Could a dragon juggle the moon?");await d.speechIdle();expect(tells.diagnostics().count).toBe(lies);
   await d.ask("S3","about:V");expect(tells.diagnostics().count).toBe(lies);
   console.log("TELLS_CHECK|"+JSON.stringify({realAlibiLie:true,truthQuiet:true,deflectionQuiet:true,sawProp,sawTarget,delayMs:tells.diagnostics().delayMs}));
  }finally{d.flow.client.forceOffline=old;d.audio.silence(muted);}
 }
}
