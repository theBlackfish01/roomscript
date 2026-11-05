import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptClosingController} from "./RoomscriptClosingController";
import {availableArguments} from "./Engine/game/Closing";
import {canonicalJson} from "./Engine/core/CanonicalJson";

/** Verdict-gated Director capture fixtures, not an uncut gameplay performance. */
@component export class RoomscriptReconstructionDetailsLeafScenario extends Scenario {
  async run(config?:ScenarioConfig):Promise<void>{
    await sleep(1000);const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const closing=findSceneObjectByName("RoomscriptClosing").getComponent(RoomscriptClosingController.getTypeName()) as RoomscriptClosingController;
    const flow=opening.cast.flow,engine=flow.engine,offline=flow.client.forceOffline,shot=config?.get("shot")||"both";
    const hold=Math.min(20,Math.max(1,Number(config?.get("hold")||"2")));
    if(!["both","correction","ledger"].includes(shot)||!Number.isFinite(hold))throw new Error("Use shot=both/correction/ledger and hold=1..20");
    try{
      flow.client.forceOffline=true;engine.configurePreset();opening.finish();
      expect(closing.captureReconstructionDetail("correction")).toBe(false);expect(closing.captureReconstructionDetail("ledger")).toBe(false);
      engine.dispatch({type:"Ask",suspect:"S2",topic:"where@22:30"});
      const graph=engine.graphRef();for(const object of graph.room.objects)engine.dispatch({type:"PinchObject",object:object.id});
      for(const claim of availableArguments(graph,engine.snapshot()))engine.dispatch({type:"ArgumentClaim",...claim});
      expect(engine.snapshot().arguments.length).toBe(graph.requiredDeductions.length);engine.dispatch({type:"Accuse",...graph.envelope});
      expect(engine.snapshot().verdict).toBe("correct");expect(closing.diagnostics().phase).toBe("reconstruction");
      for(const kind of ["correction","ledger"] as const){if(shot!=="both"&&shot!==kind)continue;
        const before=canonicalJson(engine.snapshot());expect(closing.captureReconstructionDetail(kind,hold)).toBe(true);expect(canonicalJson(engine.snapshot())).toBe(before);
        const detail=closing.reconstructionDetailDiagnostics();expect(detail.kind).toBe(kind);
        if(kind==="correction"){expect(detail.time).toBe(graph.slots[graph.murderSlot]);expect(detail.slips>0&&detail.burn>0&&detail.burn<1).toBe(true);}
        else{expect(detail.ledgerRows).toBe(graph.requiredDeductions.length);expect(detail.slips).toBe(0);}
        console.log("RECONSTRUCTION_T2_CAPTURE|"+JSON.stringify({hold,...detail}));await sleep(hold*1000);
      }
    }finally{flow.cancel();flow.client.forceOffline=offline;engine.configurePreset();opening.finish();}
  }
}
