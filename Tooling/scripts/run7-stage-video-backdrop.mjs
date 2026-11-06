import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),assets=path.join(root,'Assets/Scripts'),stage=path.join(root,'Tooling/staging'),hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const name='RoomscriptContinuousCaptureLeafScenario.ts',source=fs.readFileSync(path.join(assets,name),'utf8');let out=source;
const replace=(before,after)=>{if(!out.includes(before))throw Error('Capture source changed: '+before.slice(0,90));out=out.replace(before,after);};
replace('private recording=false;','private recording=false;private restoreBackdrop:(()=>void)|null=null;');
replace('if(this.recording)this.recorder?.cancelRecording();','try{if(this.recording)this.recorder?.cancelRecording();}finally{try{this.restoreBackdrop?.();}catch{console.log("CAPTURE_BACKDROP_RESTORE_FAILED|destroy");}this.restoreBackdrop=null;}');
replace('quiet=!full&&config?.get("quiet")!=="false";','quiet=!full&&config?.get("quiet")!=="false",backdrop=config?.get("backdrop")==="true";\n    expect(!backdrop||(!full&&global.deviceInfoSystem.isEditor())).toBe(true);');
replace('if(requestedSource==="capture")','if(!backdrop&&requestedSource==="capture")');
replace('if(!source&&requestedSource!=="camera")','if(!backdrop&&!source&&requestedSource!=="camera")');
replace('if(!source)source=camera.renderTarget;','if(!source)source=camera.renderTarget;if(backdrop)actualSource="camera.renderTarget + CameraModule backdrop";');
replace('recordingWallDeadline=0;','recordingWallDeadline=0,backdropRestored=!backdrop;');
replace('    try{\n      if(full){',`    try{
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
      if(full){`);
replace('seconds,input,quiet,requestedSource,','seconds,input,quiet,backdrop,requestedSource,');
replace('requestedSeconds:seconds,measuredSeconds,observedFrames,','requestedSeconds:seconds,measuredSeconds,backdrop,observedFrames,');
replace('}}finally{this.removeEvent(frameEvent);if(this.recording){this.recorder?.cancelRecording();this.recording=false;}flow.cancel();flow.client.forceOffline=offline;}',`}}finally{try{this.removeEvent(frameEvent);if(this.recording){this.recorder?.cancelRecording();this.recording=false;}}finally{try{this.restoreBackdrop?.();}finally{this.restoreBackdrop=null;flow.cancel();flow.client.forceOffline=offline;}}}`);
replace('expect(flowFailure).toBe("");expect(acceptance.ok).toBe(true);','expect(flowFailure).toBe("");expect(backdropRestored).toBe(true);expect(acceptance.ok).toBe(true);');
const indexName='RoomscriptLeafIndex.ts',index=fs.readFileSync(path.join(assets,indexName),'utf8'),before='source:"capture",quiet:"true"}},',after='source:"capture",quiet:"true",backdrop:"false"}},';
if(!index.includes(before))throw Error('Capture registry changed');
fs.writeFileSync(path.join(stage,name),out);fs.writeFileSync(path.join(stage,indexName),index.replace(before,after));
fs.writeFileSync(path.join(stage,'run7-video-backdrop-sources.json'),JSON.stringify([{name,sha256:hash(source)},{name:indexName,sha256:hash(index)}],null,2)+'\n');
console.log('Staged optional five-second backdrop and exact restoration; no Assets writes.');
