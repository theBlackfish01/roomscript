import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep,nextFrame} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptCaseModes} from "./RoomscriptCaseModes";
import {EVENING_ROOM_SCAN,EVENING_ROOM_FLOOR_Y} from "./Content/EveningRoomScan";
import {ROOM_SCAN_PROBE} from "./Content/RoomScanProbe";
import {RUN7_VOICE_MANIFEST} from "./Content/Run7VoiceManifest";
import {ROOMScriptRun7VoiceAssets} from "./RoomscriptRun7VoiceAssets";
/** Gate uses the actual crate pull. audit=false is explicitly Director-only staging. */
@component export class RoomscriptCastingSweepLeafScenario extends Scenario {
  async run(config?:ScenarioConfig):Promise<void>{
    await sleep(300);const modes=findSceneObjectByName("RoomscriptCaseModes").getComponent(RoomscriptCaseModes.getTypeName()) as RoomscriptCaseModes;
    const opening=modes.opening,casting=modes.casting,engine=opening.cast.flow.engine,objects=EVENING_ROOM_SCAN.objects.filter(o=>!o.virtual),captureIndex=Number(config?.get("captureIndex")||"-1"),audit=config?.get("audit")!=="false";
    expect(Number.isInteger(captureIndex)&&captureIndex>=-1&&captureIndex<objects.length).toBe(true);expect(objects.length).toBe(7);
    const fingerprint=()=>{const state=engine.snapshot(),graph=engine.graphRef();return JSON.stringify({caseId:graph.caseId,envelope:graph.envelope,facts:graph.facts,statements:graph.statements,knowledge:state.knowledge,suspects:state.suspects,elapsed:state.elapsedMinutes,verdict:state.verdict});};
    const assertPositions=()=>{const state=casting.diagnostics();expect(state.objects).toBe(7);expect(new Set(state.visible.map(mark=>mark.id)).size).toBe(7);
      for(let i=0;i<objects.length;i++){const mark=state.visible[i],object=objects[i];expect(mark.id).toBe(object.id);expect(mark.position.distance(new vec3(object.pos[0],object.pos[1]+EVENING_ROOM_FLOOR_Y+12,object.pos[2]))<.1).toBe(true);for(let j=0;j<i;j++)expect(mark.position.distance(state.visible[j].position)>1).toBe(true);}return state;};
    if(!audit){expect(captureIndex>=0).toBe(true);const before=fingerprint();expect(casting.captureMark(captureIndex,120)).toBe(true);await nextFrame();const held=assertPositions();expect(held.visible.filter(mark=>mark.enabled).length).toBe(1);expect(held.visible[captureIndex].enabled).toBe(true);expect(fingerprint()).toBe(before);console.log("CASTING_DIRECTOR_CAPTURE|"+JSON.stringify({captureIndex,id:objects[captureIndex].id,holdSeconds:120,presentationOnly:true,sweepVerified:false}));return;}
    const hand=new DefaultLeafInteractor(),tap=async(name:string)=>{const targets=findInteractablesByName(name,undefined,true);expect(targets.length).toBe(1);await hand.trigger(targets[0]);};
    expect(engine.mode()).toBe("preset");expect(modes.diagnostics().scanKind).toBe("recorded scan");
    if(opening.diagnostics().phase==="placement")await tap("Place case");
    const prepareDeadline=Date.now()+45000;for(let i=0;i<300&&opening.diagnostics().phase!=="tab"&&Date.now()<prepareDeadline;i++)await sleep(100);
    expect(opening.diagnostics().phase).toBe("tab");expect(casting.diagnostics().began).toBe(-1);expect(casting.diagnostics().complete).toBe(false);
    expect(engine.snapshot().log.some(action=>action.type==="LlmOutput"&&action.key.startsWith("room-scan:"))).toBe(false);
    const baseline=fingerprint();
    const lines=objects.map(object=>"Your "+object.label+": "+(object.type==="container"||object.type==="soft"?"a hiding place":object.type==="blunt"?"a possible weapon":"a witness")+".").concat("Tonight, this room is Harlow's study.");
    for(const text of lines){const clip=RUN7_VOICE_MANIFEST.find(record=>record.speaker==="NARRATOR"&&record.text===text);expect(!!clip).toBe(true);expect(!!ROOMScriptRun7VoiceAssets[clip!.index]).toBe(true);}
    const tabs=findInteractablesByName("RoomscriptPullTab",undefined,true);expect(tabs.length).toBe(1);const pullAt=getTime();await hand.drag(tabs[0],new vec3(12,0,0),500);
    expect(opening.diagnostics().trace.includes("pull")).toBe(true);expect(casting.diagnostics().began>=pullAt).toBe(true);
    const deadline=Date.now()+200000,simDeadline=getTime()+115;let frames=0,lastIndex=-1;const seen=new Set<number>();
    while(!casting.diagnostics().complete&&Date.now()<deadline&&getTime()<simDeadline&&frames<7000){const state=assertPositions(),visible=state.visible.filter(mark=>mark.enabled);expect(visible.length<=1).toBe(true);
      if(state.active>=0){expect(state.active>=lastIndex).toBe(true);expect(visible.length).toBe(1);expect(visible[0].id).toBe(objects[state.active].id);lastIndex=state.active;seen.add(state.active);}await nextFrame();frames++;}
    const end=assertPositions();expect(end.complete).toBe(true);expect(end.visible.filter(mark=>mark.enabled).length).toBe(0);expect(end.fallback).toBe(0);expect(end.trace.length).toBe(8);expect(seen.size).toBe(7);
    end.trace.forEach((beat,index)=>{expect(beat.index).toBe(index);expect(beat.text).toBe(lines[index]);expect(beat.id).toBe(index<7?objects[index].id:"finish");expect(beat.spoken).toBe(true);expect(beat.nativeObserved).toBe(true);expect(beat.ended>=beat.started).toBe(true);if(index)expect(beat.started>=end.trace[index-1].ended).toBe(true);});
    const replay=engine.snapshot().log.filter(action=>action.type==="LlmOutput"&&action.key.startsWith("room-scan:"));expect(replay.length).toBe(ROOM_SCAN_PROBE.length);
    for(const view of ROOM_SCAN_PROBE){const action=replay.find(item=>item.type==="LlmOutput"&&item.key==="room-scan:"+view.response.id);if(!action||action.type!=="LlmOutput")throw Error("Missing recorded scan output");expect(action.source).toBe("replay");expect(action.occurrence).toBe(1);expect(action.response.content).toBe(view.response.raw);expect(action.response.model).toBe(view.response.model);}
    expect(fingerprint()).toBe(baseline);
    console.log("CASTING_SWEEP_CHECK|"+JSON.stringify({recordedScan:true,rawReplies:replay.length,marks:7,voicedBeats:8,nativeObserved:8,oneAtATime:true,frames,seconds:end.finished-end.began,truthUnchanged:true,trace:end.trace}));
    if(captureIndex>=0){expect(casting.captureMark(captureIndex,120)).toBe(true);await nextFrame();expect(fingerprint()).toBe(baseline);console.log("CASTING_DIRECTOR_CAPTURE|"+JSON.stringify({captureIndex,id:objects[captureIndex].id,holdSeconds:120,presentationOnly:true,sweepVerified:true}));}
  }
}
