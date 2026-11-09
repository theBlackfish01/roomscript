import {RoomscriptCastController} from "./RoomscriptCastController";
import {RoomscriptRoomScanner} from "./RoomscriptRoomScanner";
import {RoomscriptRoomCastUI} from "./RoomscriptRoomCastUI";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {HARLOW_ZONE_SLOTS,HARLOW_ITEM_SLOTS} from "./Engine/room/HarlowRoomCast";
import {pendingRoomCast,ROOM_CAST_PENDING_KEY} from "./RoomscriptRoomCastSession";
import {harlowGuestOffsets} from "./Content/ActorPresentationMarks";

/** Preview's local log/file bridge delivers proposals through an editor message. Placement only. */
export class RoomscriptRoomMap {
 static current:RoomscriptRoomMap|null=null;
 private scanner:RoomscriptRoomScanner;private ui:RoomscriptRoomCastUI;private busy=false;
 private reply:any=null;
 private result:{phase:string;mapped:boolean;reason:string}={phase:"idle",mapped:false,reason:""};
 constructor(private owner:BaseScriptComponent,private cast:RoomscriptCastController){RoomscriptRoomMap.current=this;
  if(!global.deviceInfoSystem.isEditor())return;
  // MessageEvent is the editor-only transport used by the bundled LEAF bridge too.
  // @ts-ignore
  owner.createEvent("MessageEvent").bind((event:any)=>{if(event.data?.type==="RoomscriptRoomCastReply")this.reply=event.data.payload;});
  this.ui=owner.getSceneObject().createComponent(RoomscriptRoomCastUI.getTypeName()) as RoomscriptRoomCastUI;
  this.scanner=owner.getSceneObject().createComponent(RoomscriptRoomScanner.getTypeName()) as RoomscriptRoomScanner;
  this.scanner.camera=cast.flow.actor.camera.getComponent("Component.Camera") as Camera;
  const id=pendingRoomCast();if(id){this.busy=true;void this.resume(id).catch(e=>this.fallback("reply_read_failed: "+String(e)));}
 }
 private sleep(seconds:number):Promise<void>{return new Promise(resolve=>{const t=this.owner.createEvent("DelayedCallbackEvent");t.bind(()=>{this.owner.removeEvent(t);resolve();});t.reset(seconds);});}
 private status(text:string,phase:string):void{this.result.phase=phase;this.cast.flow.controlsBlocked=true;this.cast.flow.engine.investigationEnabled=false;this.cast.flow.row.show(false);this.ui.show(this.cast.flow.actor.camera,text);}
 async start():Promise<void>{
  if(!global.deviceInfoSystem.isEditor()||this.busy)return;this.busy=true;
  const id="roomcast-"+Date.now();global.persistentStorageSystem.store.putString(ROOM_CAST_PENDING_KEY,id);
  console.log("ROOM_CAST_START|"+id);
  this.status("Look across the room, including the floor…","scan");
  try{await RoomscriptAudio.active.speech.idle();await this.sleep(2);await this.scanner.capture(false,id);this.status("Finding places for Harlow in this room…","waiting");await this.awaitReply(id,"");}
  catch(e){console.log("ROOM_CAST_ERROR|"+String(e.stack||e));if(this.result.phase!=="fallback")await this.fallback("room_cast_failed: "+String(e));}
 }
 private async resume(id:string):Promise<void>{
  await this.sleep(.7);const reply=this.reply;console.log("ROOM_CAST_RESUME|"+JSON.stringify({id,stage:reply?.stage,replyId:reply?.requestId}));
  if(!reply||reply.requestId!==id){this.status("Finding places for Harlow in this room…","waiting");await this.awaitReply(id,"");return;}
  if(reply.stage==="failed"){await this.fallback(reply.error||"bridge_unavailable");return;}
  if(reply.stage==="detected"){
   this.status("Checking the room's surfaces…","locate");
   try{const located=await this.scanner.scanAndLocate(reply.detection),scan=await this.scanner.placementHits(located,harlowGuestOffsets());
    if(scan.hits.filter(h=>h.kind==="floor").length<4||scan.hits.filter(h=>h.kind==="surface").length<6)throw Error("insufficient_measured_surfaces");
    const offsets=harlowGuestOffsets(),zones=HARLOW_ZONE_SLOTS.map(z=>({...z,guestOffsets:offsets[z.id]}));
    console.log("ROOM_CAST_REQUEST|"+JSON.stringify({id,scan,located:located.located,slots:{zones,items:HARLOW_ITEM_SLOTS}}));
    this.status("Casting Harlow's rooms…","cast");await this.awaitReply(id,"detected");
   }catch(e){await this.fallback(String(e));}return;
  }
  if(reply.stage==="cast"){
   this.status("Placing the case…","check");
   const result=this.cast.flow.engine.configureRoomMapped(reply.scan,reply.response.reply,reply.response.model,reply.detection);
   this.result={phase:"toasts",mapped:result.mapped,reason:result.reason||""};
   global.persistentStorageSystem.store.putString(ROOM_CAST_PENDING_KEY,"");
   const lines=this.cast.flow.engine.graphRef().roomMapping?.castingLines||[{text:"Using Harlow's original layout for this room.",zone:""}];
   for(const line of lines){this.status(line.text,"toasts");console.log("ROOM_CAST_TOAST|"+JSON.stringify(line));await this.sleep(2.8);}
   this.ui.hide();this.cast.flow.controlsBlocked=false;RoomscriptOpeningController.current.startMappedCase();this.busy=false;this.result.phase="ready";
   console.log("ROOM_CAST_COMPLETE|"+JSON.stringify({...this.result,scanId:reply.scan.id,bindings:this.cast.room.audit(),envelope:this.cast.flow.engine.graphRef().envelope}));
  }
 }
 private async awaitReply(id:string,previous:string):Promise<void>{
  const end=Date.now()+100000;
  while(Date.now()<end&&global.persistentStorageSystem.store.getString(ROOM_CAST_PENDING_KEY)===id){
   const reply=this.reply;
   if(reply?.requestId===id&&reply.stage!==previous){console.log("ROOM_CAST_RECEIVED|"+reply.stage);await this.resume(id);return;}
   await this.sleep(.5);
  }
  if(global.persistentStorageSystem.store.getString(ROOM_CAST_PENDING_KEY)===id)await this.fallback("bridge_timeout");
 }
 private async fallback(reason:string):Promise<void>{
  this.result.phase="fallback";console.log("ROOM_CAST_FALLBACK|"+reason);this.cast.flow.engine.configurePreset();global.persistentStorageSystem.store.putString(ROOM_CAST_PENDING_KEY,"");
  this.status("Room mapping unavailable. Replaying the original Harlow case.","fallback");await this.sleep(3);this.ui.hide();this.cast.flow.controlsBlocked=false;RoomscriptOpeningController.current.startMappedCase();this.result={phase:"ready",mapped:false,reason};this.busy=false;
 }
 diagnostics(){return {...this.result,busy:this.busy};}
}
