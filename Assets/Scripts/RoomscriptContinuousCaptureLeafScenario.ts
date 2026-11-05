import {captureAcceptance} from "./Engine/perf/CaptureAcceptance";
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
  private recording=false;private restoreBackdrop:(()=>void)|null=null;private restoreRenderTarget:(()=>void)|null=null;
  onAwake():void {this.createEvent("OnDestroyEvent").bind(()=>{try{if(this.recording)this.recorder?.cancelRecording();}finally{try{this.restoreBackdrop?.();}catch{console.log("CAPTURE_BACKDROP_RESTORE_FAILED|destroy");}this.restoreBackdrop=null;try{this.restoreRenderTarget?.();}catch{console.log("CAPTURE_TARGET_RESTORE_FAILED|destroy");}this.restoreRenderTarget=null;}});}
  async run(config?:ScenarioConfig):Promise<void>{
    const seconds=Number(config?.get("seconds")||"5"),full=seconds>=60;
    expect(Number.isFinite(seconds)&&(seconds===5||(seconds>=60&&seconds<=90))).toBe(true);
    const input=config?.get("input")||"default",requestedSource=config?.get("source")||"capture",quiet=!full&&config?.get("quiet")!=="false",backdrop=config?.get("backdrop")==="true",targetWidth=Number(config?.get("targetWidth")||"0");
    expect([0,320,640].includes(targetWidth)).toBe(true);expect(targetWidth===0||(!full&&global.deviceInfoSystem.isEditor())).toBe(true);
    expect(!backdrop||(!full&&global.deviceInfoSystem.isEditor())).toBe(true);
    expect(["default","ik"].includes(input)).toBe(true);expect(["capture","live","camera"].includes(requestedSource)).toBe(true);
    const bounded=<T>(promise:Promise<T>,ms:number,label:string)=>new Promise<T>((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error(label+" timed out")),ms);promise.then(value=>{clearTimeout(timeout);resolve(value);},error=>{clearTimeout(timeout);reject(error);});});
    await sleep(300);const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const flow=opening.cast.flow,camera=findSceneObjectByName("Camera Object").getComponent("Component.Camera") as Camera;
    const recorderAvailable=typeof VideoRecorder!=="undefined"&&typeof VideoRecorder.create==="function"&&typeof VideoRecorder.Options==="function";
    console.log("CONTINUOUS_CAPTURE_API|"+JSON.stringify({recorderAvailable}));expect(recorderAvailable).toBe(true);
    let source:Texture|null=null,actualSource="camera.renderTarget";
    if(!backdrop&&requestedSource==="capture")try{source=global.scene.captureTarget;if(source)actualSource="scene.captureTarget";}catch{console.log("CONTINUOUS_CAPTURE_SOURCE_UNAVAILABLE|captureTarget");}
    if(!backdrop&&!source&&requestedSource!=="camera")try{source=global.scene.liveTarget;if(source)actualSource="scene.liveTarget";}catch{console.log("CONTINUOUS_CAPTURE_SOURCE_UNAVAILABLE|liveTarget");}
    if(!source)source=camera.renderTarget;if(backdrop)actualSource="camera.renderTarget + CameraModule backdrop";
    expect(!!source).toBe(true);expect(source.getWidth()>0&&source.getHeight()>0).toBe(true);
    // Windows Preview's packed stereo target rejects the scaled writer dimensions.
    // Record its native size; derive a single-eye crop only after recovering the file.
    // Thumbnail extraction also rejects this target's >2048px packed height.
    this.recordedTexture=null;
    const hand=input==="ik"?null:new DefaultLeafInteractor();
    // Disable the factory's scripted fallback: a failed IK reach is evidence, not filmable hand success.
    const ik=input==="ik"?createIKInteractor({avatar:{debugOverlay:false},body:{fallback:undefined,sikHandVisuals:{hide:false}}}):null;
    if(ik)await bounded(ik.ready,15000,"IK avatar ready");
    if(quiet){const until=Date.now()+45000,audio=opening.clue.objection.tells.audio;let stableSince=-1,lastCalls=-1,quietReady=false;
      for(let i=0;i<2000&&Date.now()<until;i++){const n=audio.narrativeDiagnostics(),calls=audio.loopDiagnostics().nativeCalls,phase=opening.diagnostics().phase,eligible=["tab","ready"].includes(phase)&&!n.playing&&n.queued===0&&!flow.diagnostics().busy;
        if(!eligible||calls!==lastCalls)stableSince=-1;else if(stableSince<0)stableSince=getTime();
        lastCalls=calls;if(stableSince>=0&&getTime()-stableSince>=1){quietReady=true;break;}await nextFrame();}
      console.log("CONTINUOUS_CAPTURE_QUIET|"+JSON.stringify({ready:quietReady,phase:opening.diagnostics().phase,narration:audio.narrativeDiagnostics()}));expect(quietReady).toBe(true);
    }
    const offline=flow.client.forceOffline;flow.client.forceOffline=true;
    const timeline:{seconds:number;action:string}[]=[];let started=0,firstAnswer=-1,stopAt=0,flowFailure="",recordingDuration=0,recordedWidth=0,recordedHeight=0,providerReady=false,observedFrames=0,recordingWallDeadline=0,backdropRestored=!backdrop,targetRestored=targetWidth===0;
    const frameEvent=this.createEvent("LateUpdateEvent");frameEvent.bind(()=>{if(this.recording)observedFrames++;});
    const mark=(action:string)=>{const event={seconds:getTime()-started,action};timeline.push(event);console.log("CONTINUOUS_CAPTURE_BEAT|"+JSON.stringify(event));};
    const control=async(name:string)=>{let found=findInteractablesByName(name,undefined,true);for(let i=0;i<30&&found.length===0;i++){await sleep(50);found=findInteractablesByName(name,undefined,true);}expect(found.length).toBe(1);return found[0];};
    const tap=async(name:string)=>{const target=await control(name);if(getTime()>=stopAt)throw Error("Capture deadline before "+name);mark(name);await bounded(ik?ik.trigger(target):hand!.trigger(target),10000,name);await sleep(180);};
    try{
      if(targetWidth){
        const previousTargets=camera.colorRenderTargets,previousTarget=camera.renderTarget,originalWidth=source.getWidth(),originalHeight=source.getHeight();
        expect(previousTargets.length>0).toBe(true);let restored=false;
        this.restoreRenderTarget=()=>{if(restored)return;restored=true;if(!isNull(camera)){camera.colorRenderTargets=previousTargets;const current=camera.renderTarget;targetRestored=!!current&&current.isSame(previousTarget)&&camera.colorRenderTargets.length===previousTargets.length;console.log("CAPTURE_TARGET_RESTORED|"+JSON.stringify({restored:targetRestored,width:current?.getWidth(),height:current?.getHeight()}));}};
        const texture=global.scene.createRenderTargetTexture(),provider=texture.control as RenderTargetProvider;
        // Current source is a vertically packed stereo target. Request a proportionally smaller per-eye target.
        // Log actual allocated dimensions: Preview may pack the requested texture again.
        const targetHeight=Math.max(2,Math.round((originalHeight/2)/originalWidth*targetWidth/2)*2);
        provider.useScreenResolution=false;provider.outputResolution=RenderTargetProvider.OutputResolution.Custom;provider.resolution=new vec2(targetWidth,targetHeight);provider.antialiasingMode=RenderTargetProvider.AntialiasingMode.Disabled;
        const original=previousTargets[0],replacement=Camera.createColorRenderTarget();replacement.targetTexture=texture;replacement.inputTexture=original.inputTexture;replacement.maskTexture=original.maskTexture;replacement.clearColorOption=original.clearColorOption;replacement.clearColor=original.clearColor;
        camera.colorRenderTargets=[replacement,...previousTargets.slice(1)];source=texture;actualSource="temporary camera target"+(backdrop?" + CameraModule backdrop":"");
        await nextFrame();await nextFrame();expect(source.getWidth()>0&&source.getHeight()>0).toBe(true);expect(source.getWidth()*source.getHeight()<originalWidth*originalHeight).toBe(true);
        console.log("CAPTURE_SMALL_TARGET|"+JSON.stringify({originalWidth,originalHeight,requestedWidth:targetWidth,requestedHeight:targetHeight,actualWidth:source.getWidth(),actualHeight:source.getHeight(),stereoPackingVerified:false,writerScale:1}));
      }
      if(backdrop){
        // Temporary diagnostic backdrop only. Same tested camera request as RoomscriptRoomScanner.
        const previousInput=camera.inputTexture,previousClear=camera.enableClearColor;
        let provider:CameraTextureProvider|null=null,registration:EventRegistration|null=null,restored=false,frames=0;
        this.restoreBackdrop=()=>{if(restored)return;restored=true;
          try{if(provider&&registration)provider.onNewFrame.remove(registration);}finally{
            if(!isNull(camera)){try{camera.inputTexture=previousInput;}finally{camera.enableClearColor=previousClear;}
              const current=camera.inputTexture,sameInput=previousInput?!!current&&current.isSame(previousInput):!current;
              backdropRestored=sameInput&&camera.enableClearColor===previousClear;
              console.log("CAPTURE_BACKDROP_RESTORED|"+JSON.stringify({input:sameInput,clear:camera.enableClearColor===previousClear,restored:backdropRestored}));
            }
          }
        };
        const module:CameraModule=require("LensStudio:CameraModule"),request=CameraModule.createCameraRequest();request.cameraId=CameraModule.CameraId.Default_Color;request.imageSmallerDimension=512;
        const texture=module.requestCamera(request);provider=texture.control as CameraTextureProvider;registration=provider.onNewFrame.add(()=>{frames++;});
        const cameraDeadline=Date.now()+5000;for(let i=0;i<240&&frames===0&&Date.now()<cameraDeadline;i++)await nextFrame();
        expect(frames>0&&texture.getWidth()>0&&texture.getHeight()>0).toBe(true);
        camera.inputTexture=texture;camera.enableClearColor=true;await nextFrame();await nextFrame();
        console.log("CAPTURE_BACKDROP_READY|"+JSON.stringify({frames,width:texture.getWidth(),height:texture.getHeight(),targetWidth:source.getWidth(),targetHeight:source.getHeight(),clear:camera.enableClearColor,source:"Preview CameraModule Default_Color",stereoAlignmentVerified:false,colorOrderVerified:false}));
      }
      if(full){expect(flow.engine.mode()).toBe("preset");expect(["placement","knocks","tab"].includes(opening.diagnostics().phase)).toBe(true);}
      const options=new VideoRecorder.Options(source);options.saveThumbnail=false;options.textureScale=1;this.recorder=VideoRecorder.create(options);
      this.recorder.startRecording();this.recording=true;started=getTime();stopAt=started+seconds;recordingWallDeadline=Date.now()+(full?150000:30000);
      console.log("CONTINUOUS_CAPTURE_STARTED|"+JSON.stringify({utc:new Date().toISOString(),seconds,input,quiet,backdrop,targetWidth,requestedSource,actualSource,source:source.name,width:source.getWidth(),height:source.getHeight(),scale:options.textureScale,audio:"unverified; no recorder audio option"}));
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
      // Wall/simulation time can advance while a native call blocks rendering. Wait for frame delivery too.
      const minimumFrames=Math.ceil(seconds*30);
      while((getTime()<stopAt||observedFrames<minimumFrames)&&Date.now()<recordingWallDeadline)await nextFrame();
      if(observedFrames<minimumFrames)throw Error("Insufficient frame delivery before recording deadline");
    }catch(error){flowFailure=String(error);console.log("CONTINUOUS_CAPTURE_FLOW_FAILED|"+flowFailure);}
    finally{
      try{if(this.recording){const measuredSeconds=getTime()-started;frameEvent.enabled=false;this.recordedTexture=await bounded(this.recorder.stopRecording(),45000,"VideoRecorder stop");this.recording=false;
        expect(!!this.recordedTexture).toBe(true);const provider=this.recordedTexture!.control as VideoTextureProvider;
        expect(!!provider&&typeof provider.load==="function"&&typeof provider.seek==="function").toBe(true);RoomscriptContinuousCaptureLeafScenario.retainedTexture=this.recordedTexture;if(!provider.isPlaybackReady)provider.load(false);
        for(let i=0;i<50&&!provider.isPlaybackReady;i++)await sleep(100);
        recordingDuration=provider.totalDuration;recordedWidth=this.recordedTexture!.getWidth();recordedHeight=this.recordedTexture!.getHeight();providerReady=provider.isPlaybackReady;console.log("CONTINUOUS_CAPTURE_READY|"+JSON.stringify({utc:new Date().toISOString(),requestedSeconds:seconds,measuredSeconds,backdrop,observedFrames,actualSource,technicalProbeOnly:!full,roomComposite:"unverified",providerSeconds:recordingDuration,ready:provider.isPlaybackReady,texture:this.recordedTexture!.name,width:this.recordedTexture!.getWidth(),height:this.recordedTexture!.getHeight(),input,firstAnswerSeconds:firstAnswer,timeline,flowFailure,audio:"inspect recovered file streams; assume silent until verified",nativePathExposed:false}));
      }}finally{try{this.removeEvent(frameEvent);if(this.recording){this.recorder?.cancelRecording();this.recording=false;}}finally{try{this.restoreBackdrop?.();}finally{this.restoreBackdrop=null;try{this.restoreRenderTarget?.();}finally{this.restoreRenderTarget=null;flow.cancel();flow.client.forceOffline=offline;}}}}
    }
    const acceptance=captureAcceptance({requestedSeconds:seconds,providerSeconds:recordingDuration,width:recordedWidth,height:recordedHeight,ready:providerReady,observedFrames,firstAnswerSeconds:firstAnswer});
    console.log("CONTINUOUS_CAPTURE_ACCEPTANCE|"+JSON.stringify({...acceptance,flowFailure,audioVerified:false,roomCompositeVerified:false,observedFramesAreEncodedFrames:false}));
    expect(flowFailure).toBe("");expect(backdropRestored).toBe(true);expect(targetRestored).toBe(true);expect(acceptance.ok).toBe(true);
  }
}
