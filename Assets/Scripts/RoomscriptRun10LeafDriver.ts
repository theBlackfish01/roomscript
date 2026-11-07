import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptClosingController} from "./RoomscriptClosingController";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {solvePlayerKnowledge} from "./Engine/case/Solver";

/** Shared real-control fixture. Never invokes UI callbacks or dispatches actions. */
export class RoomscriptRun10LeafDriver {
 readonly opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
 readonly closing=findSceneObjectByName("RoomscriptClosing").getComponent(RoomscriptClosingController.getTypeName()) as RoomscriptClosingController;
 readonly flow=this.opening.cast.flow;readonly engine=this.flow.engine;readonly audio=RoomscriptAudio.active;
 readonly actions:string[]=[];readonly deadline=Date.now()+540000;private hand=new DefaultLeafInteractor();
 checkDeadline():void{if(Date.now()>this.deadline)throw new Error("Run 10 fixture exceeded nine minutes");}
 async waitUntil(test:()=>boolean,label:string,limitMs=90000):Promise<void>{const end=Math.min(this.deadline,Date.now()+limitMs);while(!test()&&Date.now()<end)await sleep(50);this.checkDeadline();if(!test())throw new Error("Run 10 timed out: "+label);}
 async speechIdle():Promise<void>{await this.waitUntil(()=>!this.flow.diagnostics().busy&&!this.audio.speechBusy()&&this.audio.speech.diagnostics().queued===0,"speech idle");await sleep(100);}
 async tap(name:string,settle=true):Promise<void>{this.checkDeadline();
  if(/^(Show |Weapon )/.test(name))for(let page=0;page<12&&findInteractablesByName(name,undefined,true).length===0;page++){await sleep(100);const more=findInteractablesByName("More items",undefined,true);if(more.length!==1)break;this.actions.push("More items");console.log("RUN10_PINCH|"+JSON.stringify({number:this.actions.length,name:"More items"}));await this.hand.trigger(more[0]);await sleep(180);}
  await this.waitUntil(()=>findInteractablesByName(name,undefined,true).length>0,"control "+name,10000);const targets=findInteractablesByName(name,undefined,true);expect(targets.length).toBe(1);this.actions.push(name);console.log("RUN10_PINCH|"+JSON.stringify({number:this.actions.length,name}));await this.hand.trigger(targets[0]);await sleep(180);if(settle)await this.speechIdle();}
 async open():Promise<void>{expect(this.opening.diagnostics().phase).toBe("file");await this.tap("Open case file");expect(this.opening.diagnostics().phase).toBe("ready");}
 async ask(suspect="S2",topic="where@22:30"):Promise<void>{await this.tap("Question "+suspect);await this.tap("Ask");await this.tap("Ask "+topic);}
 async find(object:string):Promise<void>{await this.tap("RoomscriptObject_"+object);expect(this.engine.graphRef().evidence.some(e=>e.holder===object&&this.engine.snapshot().knowledge.evidenceIds.includes(e.id))).toBe(true);}
 async show(object:string):Promise<void>{await this.tap("Question S2");await this.tap("Show");await this.tap("Show "+object);}
 async prove():Promise<void>{await this.ask();await this.find("O11");await this.show("O11");expect(this.engine.snapshot().suspects.S2.layer).toBe(1);await this.find("O12");await this.show("O12");expect(this.engine.snapshot().suspects.S2.layer).toBe(2);for(const id of ["O1","O2","O3","O4","O5","O13","O14","O15"])await this.find(id);}
 knownAnswer(){const answers=solvePlayerKnowledge(this.engine.graphRef(),this.engine.snapshot().knowledge).hypotheses;expect(answers.length).toBe(1);return answers[0];}
 async prepareAccusation():Promise<void>{const answer=this.knownAnswer();await this.tap("Question "+answer.who);await this.tap("Accuse");expect(this.closing.diagnostics().picked.who).toBe(answer.who);await this.tap("Where "+answer.where);await this.tap("Weapon "+answer.what);}
}
