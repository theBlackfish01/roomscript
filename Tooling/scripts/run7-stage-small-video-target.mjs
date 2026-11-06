import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),assets=path.join(root,'Assets/Scripts'),stage=path.join(root,'Tooling/staging'),hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const name='RoomscriptContinuousCaptureLeafScenario.ts',source=fs.readFileSync(path.join(assets,name),'utf8');let out=source;
const replace=(before,after)=>{if(!out.includes(before))throw Error('Capture source changed: '+before.slice(0,90));out=out.replace(before,after);};
replace('private restoreBackdrop:(()=>void)|null=null;','private restoreBackdrop:(()=>void)|null=null;private restoreRenderTarget:(()=>void)|null=null;');
replace('this.restoreBackdrop=null;}});','this.restoreBackdrop=null;try{this.restoreRenderTarget?.();}catch{console.log("CAPTURE_TARGET_RESTORE_FAILED|destroy");}this.restoreRenderTarget=null;}});');
replace('backdrop=config?.get("backdrop")==="true";','backdrop=config?.get("backdrop")==="true",targetWidth=Number(config?.get("targetWidth")||"0");\n    expect([0,320,640].includes(targetWidth)).toBe(true);expect(targetWidth===0||(!full&&global.deviceInfoSystem.isEditor())).toBe(true);');
replace('const options=new VideoRecorder.Options(source);options.saveThumbnail=false;options.textureScale=1;\n    this.recorder=VideoRecorder.create(options);this.recordedTexture=null;','this.recordedTexture=null;');
replace('backdropRestored=!backdrop;','backdropRestored=!backdrop,targetRestored=targetWidth===0;');
replace('    try{\n      if(backdrop){',`    try{
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
      if(backdrop){`);
replace('      this.recorder.startRecording();','      const options=new VideoRecorder.Options(source);options.saveThumbnail=false;options.textureScale=1;this.recorder=VideoRecorder.create(options);\n      this.recorder.startRecording();');
replace('seconds,input,quiet,backdrop,requestedSource,','seconds,input,quiet,backdrop,targetWidth,requestedSource,');
replace('this.restoreBackdrop=null;flow.cancel();flow.client.forceOffline=offline;','this.restoreBackdrop=null;try{this.restoreRenderTarget?.();}finally{this.restoreRenderTarget=null;flow.cancel();flow.client.forceOffline=offline;}');
replace('expect(backdropRestored).toBe(true);expect(acceptance.ok)','expect(backdropRestored).toBe(true);expect(targetRestored).toBe(true);expect(acceptance.ok)');
const indexName='RoomscriptLeafIndex.ts',index=fs.readFileSync(path.join(assets,indexName),'utf8'),before='quiet:"true",backdrop:"false"}},',after='quiet:"true",backdrop:"false",targetWidth:"0"}},';
if(!index.includes(before))throw Error('Capture registry changed');
fs.writeFileSync(path.join(stage,name),out);fs.writeFileSync(path.join(stage,indexName),index.replace(before,after));
fs.writeFileSync(path.join(stage,'run7-small-video-target-sources.json'),JSON.stringify([{name,sha256:hash(source)},{name:indexName,sha256:hash(index)}],null,2)+'\n');
console.log('Staged temporary small native target and guarded restoration; no Assets writes.');
