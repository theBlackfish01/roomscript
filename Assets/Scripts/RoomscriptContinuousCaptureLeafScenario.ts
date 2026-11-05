import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep,nextFrame} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {createIKInteractor} from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
/** Native render-texture recording. No desktop/window capture, filesystem or upload API. */
@component export class RoomscriptContinuousCaptureLeafScenario extends Scenario {
  static retainedTexture:Texture|null=null;
  // Retain the provider after scenario completion while main recovers the native temporary file.
  recordedTexture:Texture|null=null;
  private recorder:VideoRecorder|null=null;
  private recording=false;
  onAwake():void {this.createEvent("OnDestroyEvent").bind(()=>{if(this.recording)this.recorder?.cancelRecording();});}
  async run(config?:ScenarioConfig):Promise<void>{
    const seconds=Number(config?.get("seconds")||"5"),full=seconds>=60;
    expect(Number.isFinite(seconds)&&(seconds===5||(seconds>=60&&seconds<=90))).toBe(true);
    const input=config?.get("input")||"default",requestedSource=config?.get("source")||"capture";
    expect(["default","ik"].includes(input)).toBe(true);
    const bounded=<T>(promise:Promise<T>,ms:number,label:string)=>new Promise<T>((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error(label+" timed out")),ms);promise.then(value=>{clearTimeout(timeout);resolve(value);},error=>{clearTimeout(timeout);reject(error);});});
    await sleep(300);const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const flow=opening.cast.flow,camera=findSceneObjectByName("Camera Object").getComponent("Component.Camera") as Camera;
    const recorderAvailable=typeof VideoRecorder!=="undefined"&&typeof VideoRecorder.create==="function"&&typeof VideoRecorder.Options==="function";
    console.log("CONTINUOUS_CAPTURE_API|"+JSON.stringify({recorderAvailable}));expect(recorderAvailable).toBe(true);
    let source:Texture|null=null;
    if(requestedSource==="capture")try{source=global.scene.captureTarget;}catch{console.log("CONTINUOUS_CAPTURE_SOURCE_UNAVAILABLE|captureTarget");}
    if(!source&&requestedSource!=="camera")try{source=global.scene.liveTarget;}catch{console.log("CONTINUOUS_CAPTURE_SOURCE_UNAVAILABLE|liveTarget");}
    if(!source)source=camera.renderTarget;
    expect(!!source).toBe(true);expect(source.getWidth()>0&&source.getHeight()>0).toBe(true);
    // Windows Preview's packed stereo target rejects the scaled writer dimensions.
    // Record its native size; derive a single-eye crop only after recovering the file.
    // Thumbnail extraction also rejects this target's >2048px packed height.
    const options=new VideoRecorder.Options(source);options.saveThumbnail=false;options.textureScale=1;
    this.recorder=VideoRecorder.create(options);this.recordedTexture=null;
    const hand=input==="ik"?null:new DefaultLeafInteractor();
    // Disable the factory's scripted fallback: a failed IK reach is evidence, not filmable hand success.
    const ik=input==="ik"?createIKInteractor({avatar:{debugOverlay:false},body:{fallback:undefined,sikHandVisuals:{hide:false}}}):null;
    if(ik)await bounded(ik.ready,15000,"IK avatar ready");
    const offline=flow.client.forceOffline;flow.client.forceOffline=true;
    const timeline:{seconds:number;action:string}[]=[];let started=0,firstAnswer=-1,stopAt=0,flowFailure="",recordingDuration=0;
    const mark=(action:string)=>{const event={seconds:getTime()-started,action};timeline.push(event);console.log("CONTINUOUS_CAPTURE_BEAT|"+JSON.stringify(event));};
    const control=async(name:string)=>{let found=findInteractablesByName(name,undefined,true);for(let i=0;i<30&&found.length===0;i++){await sleep(50);found=findInteractablesByName(name,undefined,true);}expect(found.length).toBe(1);return found[0];};
    const tap=async(name:string)=>{const target=await control(name);if(getTime()>=stopAt)throw Error("Capture deadline before "+name);mark(name);await bounded(ik?ik.trigger(target):hand!.trigger(target),10000,name);await sleep(180);};
    try{
      if(full){expect(flow.engine.mode()).toBe("preset");expect(["placement","knocks","tab"].includes(opening.diagnostics().phase)).toBe(true);}
      this.recorder.startRecording();this.recording=true;started=getTime();stopAt=started+seconds;
      console.log("CONTINUOUS_CAPTURE_STARTED|"+JSON.stringify({utc:new Date().toISOString(),seconds,input,requestedSource,source:source.name,width:source.getWidth(),height:source.getHeight(),scale:options.textureScale,audio:"unverified; no recorder audio option"}));
      await nextFrame();
      if(full){
        if(opening.diagnostics().phase==="placement")await tap("Place case");
        for(let i=0;i<100&&opening.diagnostics().phase!=="tab"&&getTime()<stopAt;i++)await sleep(100);
        expect(opening.diagnostics().phase).toBe("tab");const tab=await control("RoomscriptPullTab");mark("Pull crate tab");
        await bounded(ik?ik.drag(tab,new vec3(12,0,0)):hand!.drag(tab,new vec3(12,0,0),500),10000,"Pull crate tab");
        for(let i=0;i<250&&opening.diagnostics().phase!=="ready"&&getTime()<stopAt;i++)await sleep(100);
        expect(opening.diagnostics().phase).toBe("ready");mark("Room ready");await tap("Question S2");
        for(let i=0;i<6&&!flow.chips.topics().includes("where@22:30");i++)await tap("More questions");
        const index=flow.chips.topics().indexOf("where@22:30");expect(index>=0).toBe(true);
        const before=flow.tts.diagnostics().played;await tap("Question "+(index+1));
        for(let i=0;i<300&&flow.diagnostics().busy&&getTime()<stopAt;i++)await sleep(100);
        expect(flow.diagnostics().busy).toBe(false);expect(flow.tts.diagnostics().played>before).toBe(true);
        firstAnswer=getTime()-started;mark("First voiced answer complete");
        // Continue the same recording with a readable memory rather than padding a frozen frame.
        if(getTime()<stopAt-12){await tap("RoomscriptObject_O11");await tap("Expand memory");await sleep(3500);await tap("Close memory");mark("Kettle memory filed");}
      }
      while(getTime()<stopAt)await sleep(Math.min(250,(stopAt-getTime())*1000));
    }catch(error){flowFailure=String(error);console.log("CONTINUOUS_CAPTURE_FLOW_FAILED|"+flowFailure);}
    finally{
      try{if(this.recording){const measuredSeconds=getTime()-started;this.recordedTexture=await bounded(this.recorder.stopRecording(),45000,"VideoRecorder stop");this.recording=false;
        expect(!!this.recordedTexture).toBe(true);const provider=this.recordedTexture!.control as VideoTextureProvider;
        expect(!!provider&&typeof provider.load==="function"&&typeof provider.seek==="function").toBe(true);RoomscriptContinuousCaptureLeafScenario.retainedTexture=this.recordedTexture;if(!provider.isPlaybackReady)provider.load(false);
        for(let i=0;i<50&&!provider.isPlaybackReady;i++)await sleep(100);
        recordingDuration=provider.totalDuration;console.log("CONTINUOUS_CAPTURE_READY|"+JSON.stringify({utc:new Date().toISOString(),requestedSeconds:seconds,measuredSeconds,providerSeconds:recordingDuration,ready:provider.isPlaybackReady,texture:this.recordedTexture!.name,width:this.recordedTexture!.getWidth(),height:this.recordedTexture!.getHeight(),input,firstAnswerSeconds:firstAnswer,timeline,flowFailure,audio:"inspect recovered file streams; assume silent until verified",nativePathExposed:false}));
      }}finally{if(this.recording){this.recorder?.cancelRecording();this.recording=false;}flow.cancel();flow.client.forceOffline=offline;}
    }
    expect(flowFailure).toBe("");expect(recordingDuration>0).toBe(true);if(full){expect(firstAnswer>=0&&firstAnswer<=seconds).toBe(true);expect(recordingDuration>=60&&recordingDuration<=90).toBe(true);}
  }
}
