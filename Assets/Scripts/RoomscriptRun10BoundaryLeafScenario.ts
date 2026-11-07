import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {RoomscriptRun10LeafDriver} from "./RoomscriptRun10LeafDriver";
import {RUN10_VOICE_MANIFEST} from "./Content/Run10VoiceManifest";

/** Boundary fixture, not a player route: seed the clock, then use real final/replay controls. */
@component export class RoomscriptRun10BoundaryLeafScenario extends Scenario {
 async run():Promise<void>{await sleep(700);const d=new RoomscriptRun10LeafDriver(),muted=d.audio.speechMuted(),offline=d.flow.client.forceOffline;d.audio.silence(true);d.flow.client.forceOffline=true;
  const introIds=["V10_OPEN","N10_OPEN_1","N10_OPEN_2"];
  const introCounts=()=>introIds.map(id=>{const line=RUN10_VOICE_MANIFEST.find(l=>l.id===id)!;return d.audio.speechDiagnostics().events.filter(e=>e.type==="end"&&e.reason==="completed"&&e.speaker===line.speaker&&e.text===line.text).length;});
  const verifyIntro=async(before:number[])=>{await d.waitUntil(()=>d.opening.diagnostics().trace.includes("N10_OPEN_2"),"all opening lines scheduled");await d.speechIdle();expect(JSON.stringify(d.opening.diagnostics().trace.filter(id=>id!=="open"))).toBe(JSON.stringify(introIds));introCounts().forEach((count,i)=>expect(count>before[i]).toBe(true));};
  try{
   await d.open();let fixtureAsks=0;
   while(!d.engine.snapshot().verdict&&fixtureAsks<80){d.checkDeadline();d.engine.dispatch({type:"Ask",suspect:"S2",topic:"where@22:30"});fixtureAsks++;await sleep(10);}
   expect(d.engine.snapshot().verdict).toBe("timeout");expect(d.engine.snapshot().accusation).toBe(null);await d.speechIdle();await sleep(200);
   expect(d.engine.investigationEnabled).toBe(true);expect(!!findSceneObjectByName("RoomscriptFrozenTableau")).toBe(false);expect(!!findSceneObjectByName("RoomscriptNewspaper")).toBe(false);
   // The sealed answer is used only to make this ending fixture deterministic.
   // Naive-player derives its answer from collected knowledge instead.
   const answer=d.engine.graphRef().envelope;await d.tap("Question "+answer.who);await d.tap("Accuse");await d.tap("Where "+answer.where);await d.tap("Weapon "+answer.what);await d.tap("Break seal",false);
   expect(d.engine.snapshot().verdict).toBe("correct");expect(d.engine.snapshot().log.filter(a=>a.type==="Accuse").length).toBe(1);
   await d.waitUntil(()=>{const p=findSceneObjectByName("RoomscriptNewspaper");return !!p&&p.enabled;},"final accusation newspaper");await d.speechIdle();
   await d.tap("Another case");const replayBefore=introCounts();await d.tap("Replay Harlow",false);
   expect(d.opening.diagnostics().phase).toBe("file");expect(d.engine.investigationEnabled).toBe(false);expect(d.engine.snapshot().verdict).toBe(null);expect(d.engine.snapshot().log.length).toBe(0);
   expect(findInteractablesByName("Open case file",undefined,true).length).toBe(1);await verifyIntro(replayBefore);expect(d.opening.diagnostics().phase).toBe("file");
   // Invoke the physical-pinch callback synchronously before its delayed intro starts.
   // This deterministically reproduces the early-open race without relying on LEAF trigger latency.
   const earlyBefore=introCounts();d.engine.configurePreset();d.opening.finish();expect(d.opening.diagnostics().phase).toBe("ready");await verifyIntro(earlyBefore);
   console.log("RUN10_BOUNDARIES_CHECK|"+JSON.stringify({fixtureAsks,timeoutFinalAccusation:true,replayRequiresFilePinch:true,replayIntroduction:true,earlyOpenIntroduction:true,actions:d.actions}));
  }finally{d.audio.silence(muted);d.flow.client.forceOffline=offline;}
 }
}
