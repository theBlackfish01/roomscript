import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptClosingController} from "./RoomscriptClosingController";
import {RoomscriptCaseModes} from "./RoomscriptCaseModes";
import {EVENING_ROOM_SCAN} from "./Content/EveningRoomScan";
import {minimumCostRoute,solvePlayerKnowledge} from "./Engine/case/Solver";
import {replayGame} from "./Engine/game/Reducer";

/** Runtime reset + actual interrogation/object/closing controls on one selected seed.
 * Fixture setup skips the independently tested opening; this is not a live scanning accuracy test.
 */
@component export class RoomscriptGeneratedCaseLeafScenario extends Scenario {
  async run(config?:ScenarioConfig):Promise<void>{
    await sleep(1200);
    const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const closing=findSceneObjectByName("RoomscriptClosing").getComponent(RoomscriptClosingController.getTypeName()) as RoomscriptClosingController;
    const flow=opening.cast.flow,engine=flow.engine,room=opening.cast.room,objection=opening.clue.objection,hand=new DefaultLeafInteractor();
    const offline=flow.client.forceOffline;flow.client.forceOffline=true;
    const tap=async(name:string)=>{
      let targets=findInteractablesByName(name,undefined,true);
      for(let i=0;i<30&&!targets.length;i++){await sleep(50);targets=findInteractablesByName(name,undefined,true);}
      expect(targets.length).toBe(1);await hand.trigger(targets[0]);await sleep(120);
    };
    const waitSpeech=async()=>{for(let i=0;i<400&&flow.diagnostics().busy;i++)await sleep(100);expect(flow.diagnostics().busy).toBe(false);};
    try{
      const seedText=config?.get("seed")||"7",source=config?.get("source")||"recorded";
      if(source!=="recorded"&&source!=="live"&&source!=="file")throw new Error("Source must be recorded, live or file");
      if(!/^(7|1041|2026)$/.test(seedText))throw new Error("Run one accepted seed: 7, 1041 or 2026");
      for(const seed of [Number(seedText)]){
        if(source!=="recorded"){
          const modes=findSceneObjectByName("RoomscriptCaseModes").getComponent(RoomscriptCaseModes.getTypeName()) as RoomscriptCaseModes;
          expect(await (source==="file"?modes.fromFileReply(seed):modes.dynamic(seed))).toBe(true);expect(modes.diagnostics().scanKind).toBe("live scan");
        }else{const configured=engine.configureDynamic(seed,EVENING_ROOM_SCAN);expect(configured.ok).toBe(true);}
        expect(flow.subtitles.text().includes("A new case.")).toBe(true);
        opening.finish();await sleep(400);expect(engine.mode()).toBe("dynamic");expect(engine.snapshot().log[0].type).toBe("SetupCase");
        expect(room.audit().length).toBe(0);expect(closing.diagnostics().phase).toBe("idle");expect(objection.diagnostics().phase).toBe("idle");
        const graph=engine.graphRef();expect(graph.room.objects.filter(o=>o.virtual).length<=(source!=="recorded"?3:0)).toBe(true);
        if(source!=="recorded"){expect(graph.room.objects.filter(o=>!o.virtual).length>=5).toBe(true);expect(engine.snapshot().log.some(a=>a.type==="LlmOutput"&&a.source==="live")).toBe(true);}
        for(const object of graph.room.objects)expect(findInteractablesByName("RoomscriptObject_"+object.id,undefined,true).length).toBe(1);
        // Run the real chip handler and validated/performed answer, with its complete caption fallback.
        flow.selectSuspect(graph.cast.suspects[0].id);const spokenBefore=engine.snapshot().events.filter(e=>e.type==="lineSpoken").length;
        const first=flow.chips.topics().indexOf("whereabouts");expect(first>=0).toBe(true);await tap("Question "+(first+1));await waitSpeech();
        expect(engine.snapshot().events.filter(e=>e.type==="lineSpoken").length>spokenBefore).toBe(true);
        const route=minimumCostRoute(graph);
        for(const ref of route.refs){
          const evidence=graph.evidence.find(e=>e.id===ref);
          if(evidence&&!engine.snapshot().knowledge.evidenceIds.includes(ref)){
            const before=engine.snapshot().lastSeq;await tap("RoomscriptObject_"+evidence.holder);expect(engine.snapshot().lastSeq>before).toBe(true);
            expect(engine.snapshot().knowledge.evidenceIds.includes(ref)).toBe(true);await tap("Close memory");
          }else if(!evidence){
            const statement=graph.statements.find(s=>s.id===ref)!;
            if(!engine.snapshot().knowledge.statementIds.includes(ref)){flow.selectSuspect(statement.speaker);await flow.askChip(statement.topic);await waitSpeech();}
          }
        }
        const hypotheses=solvePlayerKnowledge(graph,engine.snapshot().knowledge).hypotheses;expect(hypotheses.length).toBe(1);
        const solution=hypotheses[0];closing.open();await sleep(250);
        for(let i=0;i<graph.cast.suspects.length&&closing.diagnostics().picked.who!==solution.who;i++)await tap("Accused suspect");
        for(let i=0;i<graph.room.zones.length&&closing.diagnostics().picked.where!==solution.where;i++)await tap("Accused room");
        for(let i=0;i<graph.weapons.length&&closing.diagnostics().picked.what!==solution.what;i++)await tap("Accused weapon");
        expect(closing.diagnostics().picked.who).toBe(solution.who);expect(closing.diagnostics().picked.where).toBe(solution.where);expect(closing.diagnostics().picked.what).toBe(solution.what);
        await tap("File deductions");
        const seal=findInteractablesByName("Break seal",undefined,true);expect(seal.length).toBe(1);await hand.drag(seal[0],new vec3(.001,0,0),1200);
        expect(engine.snapshot().verdict).toBe("correct");expect(closing.diagnostics().phase).toBe("reconstruction");
        for(let i=0;i<400&&closing.diagnostics().phase!=="ending";i++)await sleep(100);
        expect(closing.diagnostics().phase).toBe("ending");expect(closing.diagnostics().result.includes(graph.caseId)).toBe(true);
        expect(JSON.stringify(replayGame(graph,engine.snapshot().log))).toBe(JSON.stringify(engine.snapshot()));
        console.log("GENERATED_CASE_CHECK|"+JSON.stringify({seed,source,graph,caseId:graph.caseId,bindings:room.audit().length,verdict:engine.snapshot().verdict,minutes:engine.snapshot().elapsedMinutes,log:engine.snapshot().log}));
      }
    }finally{
      flow.cancel();engine.configurePreset();opening.finish();flow.client.forceOffline=offline;
    }
    expect(room.audit().length).toBe(0);expect(engine.mode()).toBe("preset");
    console.log("GENERATED_CASE_RESET|preset_restored");
  }
}
