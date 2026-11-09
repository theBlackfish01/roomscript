import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {enterCase} from "./RoomscriptLeafSetup";
import {RoomscriptRun10LeafDriver} from "./RoomscriptRun10LeafDriver";
import {RoomscriptMain} from "./RoomscriptMain";
import {RoomscriptVoiceLibrary} from "./RoomscriptVoiceLibrary";
import {VOICE_MANIFEST} from "./Content/VoiceManifest";
import {HARLOW_DIALOGUE} from "./Content/HarlowDialogue";
import {HARLOW_ITEM_OBSERVATIONS} from "./Content/HarlowItemObservations";

/** Real menus and native audio: alibi selection, reuse, physical knife and all new takes. */
@component export class RoomscriptStoryPolishLeafScenario extends Scenario {
 async run(config?:ScenarioConfig):Promise<void>{await enterCase();const d=new RoomscriptRun10LeafDriver();d.flow.client.forceOffline=true;
  if(config?.get("mode")==="voices"){await this.voices();return;}
  const main=findSceneObjectByName("Roomscript").getComponent(RoomscriptMain.getTypeName()) as RoomscriptMain;
  const pike=d.flow.actorFor("S4"),pikeAt=pike.getTransform().getWorldPosition(),hand=new DefaultLeafInteractor();
  for(const id of ["S1","S4","S3","S2","S1"]){
   await d.tap("Question "+id);const before=d.engine.snapshot().log.filter(a=>a.type==="Ask").length;
   await hand.trigger(findInteractablesByName("Ask",undefined,true)[0]);await sleep(400);
   expect(d.flow.row.diagnostics().mode).toBe("ask");expect(d.engine.snapshot().log.filter(a=>a.type==="Ask").length).toBe(before);
   const alibi=findInteractablesByName("Ask where@22:30",undefined,true)[0];expect(!!alibi).toBe(true);
   await d.tap("Ask where@22:30");const state=d.engine.snapshot(),statement=state.activeStatement!;
   expect(state.activeSuspect).toBe(id);expect(d.engine.graphRef().statements.find(s=>s.id===statement)!.topic).toBe("where@22:30");
   expect(HARLOW_DIALOGUE.some(r=>r.speaker===id&&(r.text===d.flow.diagnostics().last?.answer.line||r.alternate===d.flow.diagnostics().last?.answer.line))).toBe(true);
   console.log("STORY_ALIBI_CHECK|"+JSON.stringify({suspect:id,statement,line:d.flow.diagnostics().last?.answer.line}));
  }
  await d.tap("Ask");await d.tap("Ask background");expect(d.flow.diagnostics().last!.answer.line.includes("father's shop")).toBe(true);
  const knife=findSceneObjectByName("RoomscriptObject_O3"),box=knife.getComponent("Physics.ColliderComponent").shape as BoxShape;
  expect(box.size.x>=30).toBe(true);
  // Native physical ray at the visible handle edge, outside the old 18 cm target.
  const edge=knife.getTransform().getWorldPosition().add(new vec3(-10,1,0));
  const hits=await new Promise<RayCastHit[]>(resolve=>Physics.createGlobalProbe().rayCastAll(edge.add(new vec3(0,40,25)),edge.sub(new vec3(0,5,3)),resolve));
  expect(hits.some(h=>h.collider.getSceneObject().isSame(knife))).toBe(true);
  await d.find("O3");expect(d.audio.narrationEvidence("NARRATOR",HARLOW_ITEM_OBSERVATIONS.O3).completed).toBeGreaterThan(0);
  const minutes=d.engine.snapshot().elapsedMinutes;await d.tap("RoomscriptObject_O3");expect(d.engine.snapshot().elapsedMinutes).toBe(minutes);
  expect(d.audio.narrationEvidence("NARRATOR",HARLOW_ITEM_OBSERVATIONS.O3).completed).toBe(2);
  expect(pike.getTransform().getWorldPosition().distance(pikeAt)<.1).toBe(true);expect(main.storyMoments.diagnostics().flight).toBe(false);
  expect(d.flow.tts.diagnostics().fallback).toBe(0);console.log("STORY_POLISH_CHECK|menus,alibi,background,knife-edge,repeat-inspection,no-flight");
 }
 private async voices():Promise<void>{const rows=VOICE_MANIFEST.filter(r=>r.id.startsWith("HN_")),root=global.scene.createSceneObject("NaturalVoiceProbe"),player=root.createComponent("Component.AudioComponent") as AudioComponent;player.playbackMode=Audio.PlaybackMode.LowLatency;let finishes=0;player.setOnFinish(()=>finishes++);
  try{for(const row of rows){const clip=RoomscriptVoiceLibrary.clips(row.speaker,row.text)![0];player.audioTrack=clip.track;const before=finishes,started=Date.now();player.play(1);
    while(finishes===before&&Date.now()-started<20000)await sleep(25);const seconds=(Date.now()-started)/1000;
    expect(finishes>before).toBe(true);expect(seconds>=player.duration-.45).toBe(true);expect(seconds<player.duration+3).toBe(true);
    console.log("NATURAL_PLAYBACK_CHECK|"+JSON.stringify({id:row.id,seconds,duration:player.duration}));await sleep(300);
  }expect(rows.length).toBe(32);}finally{player.stop(false);root.destroy();}
 }
}
