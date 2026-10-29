import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptTellVisual} from "./RoomscriptTellVisual";
import {enterCase} from "./RoomscriptLeafSetup";
/** Every authored hero cover, including Vale's second layer, reaches the visible tell adapter. */
@component export class RoomscriptAllTellsLeafScenario extends Scenario {
  async run():Promise<void>{await enterCase();const tells=findSceneObjectByName("RoomscriptTells").getComponent(RoomscriptTellVisual.getTypeName()) as RoomscriptTellVisual,flow=tells.flow,engine=flow.engine;flow.client.forceOffline=true;let covered=0;
    try{for(const person of engine.caseGraph().cast.suspects){flow.selectSuspect(person.id);let before=tells.diagnostics().count;await flow.askChip(person.baseline.truthTopic);await sleep(450);expect(tells.diagnostics().count).toBe(before);
      for(const topic of [person.baseline.lieTopic,"where@22:30"]){before=tells.diagnostics().count;await flow.askChip(topic);await sleep(450);expect(tells.diagnostics().count).toBe(before+1);covered++;}}
      flow.selectSuspect("S2");await flow.askChip("where@22:30");engine.dispatch({type:"PinchObject",object:"O11"});engine.dispatch({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_KETTLE_COLD"]});const before=tells.diagnostics().count;await flow.askChip("where@22:30");await sleep(450);expect(tells.diagnostics().count).toBe(before+1);covered++;
      expect(covered).toBe(engine.caseGraph().statements.filter(s=>s.stance==="cover").length);console.log("ALL_TELLS_CHECK|"+covered+" covers; four truthful baselines quiet");
    }finally{flow.cancel();flow.client.forceOffline=false;}
  }
}
