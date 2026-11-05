import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptClosingController} from "./RoomscriptClosingController";
import {minimumCostRoute,solvePlayerKnowledge} from "./Engine/case/Solver";
import {replayGame} from "./Engine/game/Reducer";
/** Actual UI tour with authored performances and no network. Captures the final action log. */
@component export class RoomscriptHeroDemoLeafScenario extends Scenario {
  async run():Promise<void>{await sleep(1200);const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController,closing=findSceneObjectByName("RoomscriptClosing").getComponent(RoomscriptClosingController.getTypeName()) as RoomscriptClosingController,flow=opening.cast.flow,engine=flow.engine,clue=opening.clue,objection=clue.objection,hand=new DefaultLeafInteractor();flow.client.forceOffline=true;const calls=flow.client.requestCount();
    const tap=async(name:string)=>{console.log("HERO_STEP|"+name);const targets=findInteractablesByName(name,undefined,true);expect(targets.length).toBe(1);await hand.trigger(targets[0]);await sleep(180);};
    const done=async()=>{for(let i=0;i<300&&flow.diagnostics().busy;i++)await sleep(100);expect(flow.diagnostics().busy).toBe(false);};
    const question=async(id:string,topic:string)=>{const beforeAudio=flow.tts.diagnostics();await tap("Select "+id);for(let i=0;i<10&&!flow.chips.topics().includes(topic);i++)await tap("More questions");const index=flow.chips.topics().indexOf(topic);expect(index>=0).toBe(true);await tap("Question "+(index+1));await done();expect(flow.tts.diagnostics().played>beforeAudio.played).toBe(true);expect(flow.tts.diagnostics().fallback).toBe(beforeAudio.fallback);await sleep(450);expect(engine.caseGraph().statements.find(s=>s.id===engine.snapshot().activeStatement)?.topic).toBe(topic);};
    const drop=async(target:SceneObject)=>{const slip=findInteractablesByName("RoomscriptStatementSlip",undefined,true)[0],vector=new vec3(1,0,0),remove=slip.onDragUpdate.add(()=>{const destination=vec3.lerp(flow.actor.camera.getTransform().getWorldPosition(),target.getTransform().getWorldPosition(),.25),delta=destination.sub(slip.getTransform().getWorldPosition()).uniformScale(.4);vector.x=delta.x;vector.y=delta.y;vector.z=delta.z;});try{await hand.drag(slip,vector,1400);}finally{remove();}await sleep(3300);await done();};
    try{
      await tap("Place case");for(let i=0;i<80&&opening.diagnostics().phase!=="tab";i++)await sleep(100);expect(opening.diagnostics().phase).toBe("tab");await hand.drag(findInteractablesByName("RoomscriptPullTab",undefined,true)[0],new vec3(12,0,0),500);for(let i=0;i<180&&opening.diagnostics().phase!=="ready";i++)await sleep(100);expect(opening.diagnostics().phase).toBe("ready");
      for(const person of engine.caseGraph().cast.suspects)await question(person.id,"baseline:name");
      await question("S2","baseline:brooch");await question("S2","where@22:30");await tap("RoomscriptObject_O11");await tap("Close memory");
      objection.open("E_KETTLE_COLD");await sleep(250);await drop(findSceneObjectByName("RoomscriptMemoryCard"));expect(engine.snapshot().suspects.S2.layer).toBe(1);
      await question("S3","about:V");await question("S2","where@22:30");objection.wallet.onSelect.invoke("C_OKAFOR_REPLY");await sleep(250);await drop(findSceneObjectByName("RoomscriptMemoryCard"));expect(engine.snapshot().suspects.S2.layer).toBe(2);
      // Inspector-independent object taps obtain the unique-solution route; both objections provide means.
      const graph=engine.caseGraph(),route=minimumCostRoute(graph);for(const ref of route.refs){const evidence=graph.evidence.find(e=>e.id===ref);if(evidence){await tap("RoomscriptObject_"+evidence.holder);await tap("Close memory");}else{const statement=graph.statements.find(s=>s.id===ref);expect(!!statement).toBe(true);if(!engine.snapshot().knowledge.statementIds.includes(ref))await question(statement!.speaker,statement!.topic);}}
      expect(solvePlayerKnowledge(graph,engine.snapshot().knowledge).hypotheses.length).toBe(1);
      // Real angular pawn drop followed by weapon selection and the visual refutation sweep.
      const pawn=findInteractablesByName("RoomscriptPawn_S1",undefined,true)[0],destination=vec3.lerp(flow.actor.camera.getTransform().getWorldPosition(),opening.cast.room.zoneAnchor("Z1").getTransform().getWorldPosition(),.3),vector=new vec3(1,0,0),remove=pawn.onDragUpdate.add(()=>{const d=destination.sub(pawn.getTransform().getWorldPosition()).uniformScale(.5);vector.x=d.x;vector.y=d.y;vector.z=d.z;});try{await hand.drag(pawn,vector,1400);}finally{remove();}await tap("RoomscriptObject_O1");for(let i=0;i<150&&clue.diagnostics().busy;i++)await sleep(100);expect(clue.diagnostics().refuter!==null).toBe(true);await sleep(200);await tap("Close refutation");
      await tap("Accuse");for(let i=0;i<4&&closing.diagnostics().picked.who!=="S2";i++)await tap("Accused suspect");await tap("File deductions");expect(engine.snapshot().arguments.length).toBe(4);
      await hand.drag(findInteractablesByName("Break seal",undefined,true)[0],new vec3(.001,0,0),1200);expect(engine.snapshot().verdict).toBe("correct");for(let i=0;i<500&&closing.diagnostics().phase!=="ending";i++)await sleep(100);expect(closing.diagnostics().phase).toBe("ending");expect(flow.client.requestCount()).toBe(calls);
      expect(JSON.stringify(replayGame(graph,engine.snapshot().log))).toBe(JSON.stringify(engine.snapshot()));console.log("HERO_DEMO_ACTION_TAPE|"+JSON.stringify(engine.snapshot().log));console.log("HERO_DEMO_CHECK|"+closing.diagnostics().result);
    }finally{flow.cancel();flow.client.forceOffline=false;}
  }
}
