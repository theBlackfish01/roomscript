import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptNextGlow} from "./RoomscriptNextGlow";
import {RoomscriptRun10LeafDriver} from "./RoomscriptRun10LeafDriver";
import {RUN10_FIND_OBJECTS} from "./Content/Run10HeroCase";
/** Idle guidance highlights one useful guest/item, never retired furniture. */
@component export class RoomscriptNextGlowLeafScenario extends Scenario {
 async run(config?:ScenarioConfig):Promise<void>{await sleep(700);const d=new RoomscriptRun10LeafDriver(),hold=Math.min(20,Number(config?.get("hold")||"0"))*1000,old=d.flow.client.forceOffline,muted=d.audio.speechMuted();d.flow.client.forceOffline=true;d.audio.silence(true);
  try{await d.open();const glow=RoomscriptNextGlow.current!;expect(!!glow).toBe(true);await d.waitUntil(()=>glow.diagnostics().visible,"first next glow",45000);const first=glow.diagnostics();expect(first.kind).toBe("suspect");if(hold)await sleep(hold);
   await d.ask(first.id!);expect(glow.diagnostics().visible).toBe(false);await d.waitUntil(()=>glow.diagnostics().visible,"second next glow",35000);const second=glow.diagnostics();expect(second.kind==="object"||second.kind==="suspect").toBe(true);if(second.kind==="object")expect(RUN10_FIND_OBJECTS.includes(second.id!)).toBe(true);if(hold)await sleep(hold);
   console.log("NEXT_GLOW_CHECK|"+JSON.stringify({first,second}));
  }finally{d.flow.client.forceOffline=old;d.audio.silence(muted);}
 }
}
