import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptClosingController} from "./RoomscriptClosingController";
import {solvePlayerKnowledge} from "./Engine/case/Solver";
import {replayGame} from "./Engine/game/Reducer";
/** Scripted discoverability gate, not a claim of a human usability study.
 * Follows visible object markers; chooses its final cards only from collected knowledge.
 * Every pinch, page change, drag and hold counts; never invokes UI events or dispatches actions.
 * Run 8: case file, glyph tokens, a memory photo held up as proof, then the accusation rig and wax seal.
 */
@component export class RoomscriptNaivePlayerLeafScenario extends Scenario {
  async run():Promise<void>{
    const started=getTime();await sleep(1200);
    const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const closing=findSceneObjectByName("RoomscriptClosing").getComponent(RoomscriptClosingController.getTypeName()) as RoomscriptClosingController;
    const flow=opening.cast.flow,engine=flow.engine,hand=new DefaultLeafInteractor(),actions:string[]=[];
    const offline=flow.client.forceOffline;flow.client.forceOffline=true;const calls=flow.client.requestCount();
    const count=(label:string)=>{expect(actions.length<40).toBe(true);actions.push(label);console.log("NAIVE_ACTION|"+JSON.stringify({number:actions.length,label}));};
    const control=async(name:string)=>{let targets=findInteractablesByName(name,undefined,true);for(let i=0;i<30&&targets.length===0;i++){await sleep(50);targets=findInteractablesByName(name,undefined,true);}expect(targets.length).toBe(1);return targets[0];};
    const tap=async(name:string)=>{const target=await control(name);count(name);await hand.trigger(target);await sleep(180);};
    const done=async()=>{for(let i=0;i<300&&flow.diagnostics().busy;i++)await sleep(100);expect(flow.diagnostics().busy).toBe(false);};
    const inspect=async(id:string)=>{await tap("RoomscriptObject_"+id);await tap("Close memory");};
    let firstAnswerSeconds=0;
    try{
      expect(engine.mode()).toBe("preset");expect(engine.snapshot().verdict).toBe(null);
      if(opening.diagnostics().phase==="placement")await tap("Place case");
      for(let i=0;i<100&&opening.diagnostics().phase!=="tab";i++)await sleep(100);
      expect(opening.diagnostics().phase).toBe("tab");
      const tab=await control("RoomscriptPullTab");count("Open the Harlow Trust file");await hand.drag(tab,new vec3(12,0,0),500);
      for(let i=0;i<200&&opening.diagnostics().phase!=="ready";i++)await sleep(100);
      expect(opening.diagnostics().phase).toBe("ready");
      // Preview's large actor target substitutes for walking to Vale. The question remains public UI.
      await tap("Question S2");
      for(let i=0;i<6&&!flow.chips.topics().includes("where@22:30");i++)await tap("More questions");
      const index=flow.chips.topics().indexOf("where@22:30");expect(index>=0).toBe(true);
      const played=flow.tts.diagnostics().played;await tap("Question "+(index+1));await done();
      expect(flow.tts.diagnostics().played>played).toBe(true);firstAnswerSeconds=getTime()-started;
      // Run 8 object flow: tap the Object glyph, pull the kettle's memory photo and hold it up to Vale's face.
      await tap("Object");
      // The photo shows which memory it is; hold it up only when it reads as the no-heat memory, else put it back.
      const photoText=():string=>opening.clue.objection.photoCaption();
      for(let attempt=0;attempt<4&&!opening.clue.objection.diagnostics().correct&&engine.snapshot().pips>0;attempt++){
        const kettle=await control("RoomscriptObject_O11"),origin=kettle.getTransform().getWorldPosition(),face=flow.actorFor("S2")!.getTransform().getWorldPosition().add(new vec3(0,140,0)),vector=new vec3(0,1,0);
        const remove=kettle.onDragUpdate.add(()=>{const photo=findSceneObjectByName("RoomscriptPulledMemory");if(!photo||!photo.enabled)return;const goal=photoText().includes("NO HEAT")?face:origin.add(new vec3(0,14,0));const d=goal.sub(photo.getTransform().getWorldPosition()).uniformScale(.5);vector.x=d.x;vector.y=d.y;vector.z=d.z;});
        count("Pull a kettle memory");try{await hand.drag(kettle,vector,5000);}finally{remove();}
        await sleep(400);
      }
      for(let i=0;i<80&&opening.clue.objection.diagnostics().phase!=="idle";i++)await sleep(100);await done();
      expect(opening.clue.objection.diagnostics().correct).toBe(true);
      // Fixed authored tour of visible marked furniture; no minimumCostRoute or hidden envelope lookup.
      for(const object of ["O6","O12","O1","O8","O10","O2","O3","O4","O5"])await inspect(object);
      const graph=engine.graphRef(),solutions=solvePlayerKnowledge(graph,engine.snapshot().knowledge).hypotheses;
      expect(solutions.length).toBe(1);const answer=solutions[0];await tap("Accuse");
      const selectors:["who"|"where"|"what",string,number][]=[["who","Accused suspect",graph.cast.suspects.length],["where","Accused room",graph.room.zones.length],["what","Accused weapon",graph.weapons.length]];
      for(const [key,name,length] of selectors){for(let i=0;i<length&&closing.diagnostics().picked[key]!==answer[key];i++)await tap(name);expect(closing.diagnostics().picked[key]).toBe(answer[key]);}
      await tap("File deductions");expect(engine.snapshot().arguments.length).toBe(graph.requiredDeductions.length);
      const seal=await control("Break seal");count("Hold verdict seal");await hand.drag(seal,new vec3(.001,0,0),1200);
      expect(engine.snapshot().verdict).toBe("correct");
      for(let i=0;i<350&&closing.diagnostics().phase!=="ending";i++)await sleep(100);
      expect(closing.diagnostics().phase).toBe("ending");expect(actions.length<=40).toBe(true);expect(flow.client.requestCount()).toBe(calls);
      expect(JSON.stringify(replayGame(graph,engine.snapshot().log))).toBe(JSON.stringify(engine.snapshot()));
      console.log("NAIVE_PLAYER_CHECK|"+JSON.stringify({actions:actions.length,limit:40,firstAnswerSeconds,verdict:engine.snapshot().verdict,proof:engine.snapshot().arguments.length,minutes:engine.snapshot().elapsedMinutes,route:actions}));
      console.log("NAIVE_PLAYER_ACTION_TAPE|"+JSON.stringify(engine.snapshot().log));
    }finally{flow.cancel();flow.client.forceOffline=offline;}
  }
}
