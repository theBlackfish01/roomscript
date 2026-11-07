import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {RoomscriptRun10LeafDriver} from "./RoomscriptRun10LeafDriver";
/** Engine-driven ending fixture; the naive player separately derives its answer from knowledge. */
@component export class RoomscriptClosingLeafScenario extends Scenario {
 async run(config?:ScenarioConfig):Promise<void>{await sleep(700);const d=new RoomscriptRun10LeafDriver(),mode=config?.get("mode")||"correct",muted=d.audio.speechMuted();d.audio.silence(true);
  try{expect(["correct","wrong"].includes(mode)).toBe(true);await d.open();const graph=d.engine.graphRef(),who=mode==="wrong"?graph.cast.suspects.find(s=>s.id!==graph.envelope.who)!.id:graph.envelope.who;
   await d.tap("Question "+who);await d.tap("Accuse");expect(d.closing.diagnostics().picked.who).toBe(who);expect(d.closing.diagnostics().picked.where).toBe("");expect(d.closing.diagnostics().picked.what).toBe("");expect(findInteractablesByName("Break seal",undefined,true).length).toBe(0);
   await d.tap("Where "+graph.envelope.where);await d.tap("Weapon "+graph.envelope.what);await d.tap("Break seal",false);expect(d.engine.snapshot().verdict).toBe(mode);
   await d.waitUntil(()=>{const p=findSceneObjectByName("RoomscriptNewspaper");return !!p&&p.enabled;},"newspaper");await d.speechIdle();
   expect(findInteractablesByName("Another case",undefined,true).length).toBe(1);expect(findInteractablesByName("Break seal",undefined,true).length).toBe(0);
   console.log("CLOSING_CHECK|"+JSON.stringify({mode,verdict:d.engine.snapshot().verdict,diagnostics:d.closing.diagnostics(),pinchSeal:true}));
  }finally{d.audio.silence(muted);}
 }
}
