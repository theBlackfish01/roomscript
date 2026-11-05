import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,nextFrame} from "Leaf.lspkg/Utils/common/Utils";
import {enterCase} from "./RoomscriptLeafSetup";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
/** S2/S3: immutable views plus observed simultaneous native tick/refutation playback. */
@component export class RoomscriptPolishLeafScenario extends Scenario {
  async run():Promise<void>{
    await enterCase();const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const engine=opening.cast.flow.engine,audio=opening.clue.objection.tells.audio,first=engine.snapshot();
    console.log("POLISH_CACHE|"+JSON.stringify({same:engine.snapshot()===first,frozen:Object.isFrozen(first.knowledge.factIds)}));expect(engine.snapshot()===first).toBe(true);expect(Object.isFrozen(first.knowledge.factIds)).toBe(true);
    engine.dispatch({type:"Ask",suspect:"S2",topic:"baseline:name"});expect(engine.snapshot()===first).toBe(false);
    // Regression: muting reaches actual native zero and identical assignments do not cross the native boundary twice.
    audio.silence(true);const mutedWrites=audio.loopDiagnostics().volumeWrites;
    for(const name of ["RoomscriptScore","RoomscriptTension","RoomscriptLoopingClock"]){const component=findSceneObjectByName(name).getComponent("Component.AudioComponent") as AudioComponent;expect(component.volume).toBe(0);}
    audio.silence(true);expect(audio.loopDiagnostics().volumeWrites).toBe(mutedWrites);audio.silence(false);
    const point=opening.cast.room.objectAnchor("O7").getTransform().getWorldPosition();
    // Production ready-clock must survive repeated state syncs without native restarts.
    audio.clock(false);const loopBefore=audio.loopDiagnostics();audio.clock(true,point);
    const loopStart=audio.loopDiagnostics();console.log("POLISH_CLOCK_START|"+JSON.stringify({before:loopBefore,start:loopStart}));expect(loopStart.clockStarts).toBe(loopBefore.clockStarts+1);
    // Native play can become active on the next engine frame. A start counter is not playback proof.
    const nativeStart=getTime(),nativeDeadline=nativeStart+2,nativeWallDeadline=Date.now()+15000;let nativeFrames=0;
    const startSamples:{frame:number;seconds:number;playing:boolean;position:number;starts:number}[]=[];
    while(!audio.loopDiagnostics().clockPlaying&&getTime()<nativeDeadline&&Date.now()<nativeWallDeadline&&nativeFrames<120){await nextFrame();nativeFrames++;const state=audio.loopDiagnostics();if(startSamples.length<12)startSamples.push({frame:nativeFrames,seconds:getTime()-nativeStart,playing:state.clockPlaying,position:state.clockPosition,starts:state.clockStarts});}
    const nativeReady=audio.loopDiagnostics();console.log("POLISH_CLOCK_NATIVE_READY|"+JSON.stringify({frames:nativeFrames,seconds:getTime()-nativeStart,samples:startSamples,state:nativeReady}));
    expect(nativeReady.clockStarts).toBe(loopStart.clockStarts);expect(nativeReady.clockPlaying).toBe(true);
    for(let i=0;i<12;i++){audio.clock(true,point);audio.score(loopStart.scoreName);}
    const loopRepeated=audio.loopDiagnostics();console.log("POLISH_CLOCK_REPEATED|"+JSON.stringify({start:loopStart,repeated:loopRepeated}));expect(loopRepeated.clockStarts).toBe(loopStart.clockStarts);expect(loopRepeated.scoreStarts).toBe(loopStart.scoreStarts);expect(loopRepeated.clockPlaying).toBe(true);
    const loopUntil=getTime()+1.15;for(let i=0;i<120&&getTime()<loopUntil;i++)await nextFrame();
    const loopAfter=audio.loopDiagnostics();console.log("POLISH_CLOCK_AFTER_PERIOD|"+JSON.stringify({deadline:loopUntil,now:getTime(),state:loopAfter}));expect(getTime()>=loopUntil).toBe(true);expect(loopAfter.clockStarts).toBe(loopStart.clockStarts);expect(loopAfter.clockPlaying).toBe(true);
    console.log("POLISH_CLOCK_LOOP|"+JSON.stringify({before:loopBefore,start:loopStart,after:loopAfter}));
    const before=audio.narrativeDiagnostics();
    audio.playAt("Chime",point);audio.playAt("ClockTick",point);
    const start=audio.narrativeDiagnostics(),generation=start.tickStarts;
    expect(generation).toBe(before.tickStarts+1);expect(start.cueStarts).toBe(before.cueStarts+2);expect(start.tickDuration>0).toBe(true);
    // Sample synchronously first: nextFrame can arrive after the .98-second tick has ended.
    // A start counter alone is insufficient. Require native isPlaying or advancing playhead
    // from THIS generation while the independent spatial chime is still playing.
    let overlap=false,clockObserved=false,spatialObserved=false,lastPosition=start.tickPosition;
    const observations:{age:number;position:number;tick:boolean;spatial:number;generation:number}[]=[];
    const observe=()=>{const native=audio.diagnostics(),n=audio.narrativeDiagnostics();observations.push({age:n.tickAge,position:n.tickPosition,tick:native.tick,spatial:native.spatial,generation:n.tickStarts});
      if(n.tickStarts!==generation)return false;
      const advanced=n.tickPosition>lastPosition+.001;lastPosition=n.tickPosition;
      const played=native.tick||advanced;clockObserved=clockObserved||played;spatialObserved=spatialObserved||native.spatial>0;overlap=overlap||(played&&native.spatial>0);return true;};
    observe();const deadline=getTime()+2;
    for(let i=0;i<60&&!overlap&&getTime()<deadline;i++){await nextFrame();if(!observe())break;}
    console.log("POLISH_AUDIO|"+JSON.stringify({generation,duration:start.tickDuration,clockObserved,spatialObserved,overlap,observations}));
    expect(clockObserved).toBe(true);expect(spatialObserved).toBe(true);expect(overlap).toBe(true);
    const explicitLoop=audio.loopDiagnostics();expect(explicitLoop.clockStarts).toBe(loopStart.clockStarts);expect(explicitLoop.clockPlaying).toBe(true);
    audio.clock(false);audio.clock(false);const stopped=audio.loopDiagnostics();expect(stopped.clockStops).toBe(loopStart.clockStops+1);expect(stopped.clockPlaying).toBe(false);audio.clock(true,point);
    // Report a late stopped component explicitly; never turn it into an early-playback failure.
    await nextFrame();console.log("POLISH_AUDIO_AFTER_FRAME|"+JSON.stringify({native:audio.diagnostics(),narrative:audio.narrativeDiagnostics()}));
    let sum=0,max=0,frames=0;const sampleStart=getTime();
    for(;frames<600&&getTime()-sampleStart<90;frames++){await nextFrame();const ms=getDeltaTime()*1000;sum+=ms;max=Math.max(max,ms);}
    expect(frames>=60).toBe(true);
    console.log("POLISH_FRAME_PROBE|"+JSON.stringify({frames,requestedFrames:600,seconds:getTime()-sampleStart,bounded:frames<600,meanMs:sum/frames,maxMs:max,targetMs:8}));
  }
}
