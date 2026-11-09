import {localBridgePost,localBridgeAvailable} from "./RoomscriptLocalBridge";
/** Preview-only camera transport. Observations are proposals; this class never changes game truth. */
@component
export class RoomscriptRoomScanner extends BaseScriptComponent {
  @input @allowUndefined @hint("Tracked view used for ray projection; assigned by the Preview room mapper") camera:Camera;
  @input @hint("Enable local Tooling bridge only in Lens Studio Preview") previewBridge:boolean=true;
  private texture:Texture;
  private provider:CameraTextureProvider;
  private frameRegistration:EventRegistration;
  private frames=0;
  private hitSession:HitTestSession;
  private internet:InternetModule;
  onAwake():void {
    this.createEvent("OnStartEvent").bind(()=>{this.internet=require("LensStudio:InternetModule");});
    this.createEvent("OnDestroyEvent").bind(()=>{if(this.provider&&this.frameRegistration)this.provider.onNewFrame.remove(this.frameRegistration);this.hitSession?.stop();});
  }
  private wait(seconds:number):Promise<void>{return new Promise(resolve=>{const timer=this.createEvent("DelayedCallbackEvent");timer.bind(()=>{this.removeEvent(timer);resolve();});timer.reset(seconds);});}
  private async post(route:string,data:unknown):Promise<any>{
    if(!this.previewBridge||!global.deviceInfoSystem.isEditor())throw new Error("preview_bridge_disabled");
    return localBridgePost(route as "scan"|"locate",data);
  }
  async capture(detect=false,bridgeRequest?:string):Promise<any>{
    if(!this.previewBridge||!global.deviceInfoSystem.isEditor())throw new Error("preview_bridge_disabled");
    if(!this.camera)throw new Error("scan_camera_missing");
    if(!this.texture){const module:CameraModule=require("LensStudio:CameraModule"),request=CameraModule.createCameraRequest();request.cameraId=CameraModule.CameraId.Default_Color;request.imageSmallerDimension=512;this.texture=module.requestCamera(request);this.provider=this.texture.control as CameraTextureProvider;this.frameRegistration=this.provider.onNewFrame.add(()=>{this.frames++;});}
    const before=this.frames;for(let i=0;i<40&&this.frames===before;i++)await this.wait(.05);if(this.frames===before)throw new Error("no_camera_frame");
    const jpeg=await new Promise<string>((resolve,reject)=>Base64.encodeTextureAsync(this.texture,resolve,()=>reject(new Error("camera_encode_failed")),CompressionQuality.HighQuality,EncodingType.Jpg));
    const transform=this.camera.getTransform(),p=transform.getWorldPosition(),q=transform.getWorldRotation();
    const ray=(x:number,y:number)=>{const point=this.camera.screenSpaceToWorldSpace(new vec2(x,y),1500).sub(p);return [point.x,point.y,point.z];};
    const frame={jpeg,width:this.texture.getWidth(),height:this.texture.getHeight(),position:[p.x,p.y,p.z],rotation:[q.x,q.y,q.z,q.w],rays:[ray(0,0),ray(1,0),ray(0,1)],at:Date.now(),source:"Preview CameraModule Default_Color",bridgeRequest};
    let result:any;
    if(!detect){
      // Explicit offline spike transport through MCP-accessible runtime logs.
      const id="scan-"+frame.at;const {jpeg:ignored,...meta}=frame;
      console.log("ROOM_SCAN_META|"+JSON.stringify({id,...meta}));
      for(let offset=0;offset<jpeg.length;offset+=5000)console.log("ROOM_SCAN_CHUNK|"+id+"|"+offset+"|"+jpeg.slice(offset,offset+5000));
      console.log("ROOM_SCAN_END|"+id+"|"+jpeg.length);result={id,logged:true};
    }else result=await this.post("scan",frame);
    console.log("ROOM_SCAN_CAPTURE|"+JSON.stringify({id:result.id,width:this.texture.getWidth(),height:this.texture.getHeight(),frames:this.frames,detected:result.objects?.length??0}));
    const {jpeg:ignored,...meta}=frame;return {...result,frame:meta};
  }
  async locate(uv:vec2):Promise<{position:number[];normal:number[]}|null>{
    return this.hitRay(this.camera.getTransform().getWorldPosition(),this.camera.screenSpaceToWorldSpace(uv,1500));
  }
  async hitRay(start:vec3,end:vec3):Promise<{position:number[];normal:number[]}|null>{
    if(!this.hitSession){const module:WorldQueryModule=require("LensStudio:WorldQueryModule");this.hitSession=module.createHitTestSession();this.hitSession.start();await this.wait(.4);}
    return new Promise(resolve=>{let done=false;const timer=this.createEvent("DelayedCallbackEvent");timer.bind(()=>{if(!done){done=true;resolve(null);}this.removeEvent(timer);});timer.reset(2);this.hitSession.hitTest(start,end,hit=>{if(done)return;done=true;this.removeEvent(timer);resolve(hit?{position:[hit.position.x,hit.position.y,hit.position.z],normal:[hit.normal.x,hit.normal.y,hit.normal.z]}:null);});});
  }
  async scanAndLocate(detected?:any):Promise<any>{
    return this.locateResponse(detected||await this.capture(true),!detected);
  }
  /** More than a centre hit: measured horizontal tops and floor points for placement choices. */
  async placementHits(result:any):Promise<{id:string;floorY:number;hits:import("./Engine/room/HarlowRoomCast").RoomCastHit[]}>{
    const f=result.frame,v=(p:number[])=>new vec3(p[0],p[1],p[2]),start=v(f.position),base=v(f.rays[0]),dx=v(f.rays[1]).sub(base),dy=v(f.rays[2]).sub(base);
    const probes:{start:vec3;end:vec3;label:string}[]=[];
    for(const o of result.objects){const b=o.box;for(const u of [.2,.5,.8])for(const v of [.2,.5,.8])probes.push({start,end:start.add(base).add(dx.uniformScale(b[0]+(b[2]-b[0])*u)).add(dy.uniformScale(b[1]+(b[3]-b[1])*v)),label:o.label});}
    const forward=base.add(dx.uniformScale(.5)).add(dy.uniformScale(.5));forward.y=0;const fw=forward.normalize(),right=new vec3(-fw.z,0,fw.x);
    for(let z=100;z<=500;z+=50)for(let x=-200;x<=200;x+=50){const p=start.add(fw.uniformScale(z)).add(right.uniformScale(x));probes.push({start:p.add(new vec3(0,50,0)),end:p.add(new vec3(0,-600,0)),label:"measured horizontal surface"});}
    const measured:{position:number[];normal:number[];label:string}[]=[];
    for(const p of probes){const hit=await this.hitRay(p.start,p.end);if(hit&&hit.normal[1]>=.8)measured.push({...hit,label:p.label});}
    if(!measured.length)throw Error("no_room_surfaces");const floorY=Math.min(...measured.map(h=>h.position[1]));
    const hits:import("./Engine/room/HarlowRoomCast").RoomCastHit[]=[];
    for(const h of measured){if(hits.some(p=>Math.hypot(...p.position.map((n,i)=>n-h.position[i]))<12))continue;const floor=Math.abs(h.position[1]-floorY)<8;
      if(!floor&&(h.position[1]<floorY+10||h.position[1]>floorY+180))continue;
      hits.push({id:"H"+hits.length,position:h.position as [number,number,number],normal:h.normal as [number,number,number],kind:floor?"floor":"surface",label:floor?"floor":h.label});
    }
    console.log("ROOM_CAST_HITS|"+JSON.stringify({floorY,floor:hits.filter(h=>h.kind==="floor").length,surfaces:hits.filter(h=>h.kind==="surface").length}));return {id:result.id,floorY,hits};
  }
  async locateResponse(result:any,save=false):Promise<any>{
    const located=[];
    const f=result.frame,v=(a:number[])=>new vec3(a[0],a[1],a[2]),start=v(f.position),base=v(f.rays[0]),dx=v(f.rays[1]).sub(base),dy=v(f.rays[2]).sub(base);
    for(const object of result.objects){const b=object.box,x=(b[0]+b[2])/2,y=(b[1]+b[3])/2;let hit=null;
      for(const offset of [[0,0],[0,-.035],[.035,0],[-.035,0],[0,.035]]){const u=Math.max(b[0],Math.min(b[2],x+offset[0])),w=Math.max(b[1],Math.min(b[3],y+offset[1]));hit=await this.hitRay(start,start.add(base).add(dx.uniformScale(u)).add(dy.uniformScale(w)));if(hit)break;}
      located.push({...object,hit});}
    if(save)await this.post("locate",{id:result.id,located});return {...result,located};
  }
  available():boolean{return this.previewBridge&&localBridgeAvailable();}
}
