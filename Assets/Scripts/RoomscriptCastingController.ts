import {EVENING_ROOM_SCAN,EVENING_ROOM_FLOOR_Y} from "./Content/EveningRoomScan";
import {PanelUI,uiObject} from "./RoomscriptPanelUI";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {RoomInput} from "./Engine/room/RoomModel";
type CastingBeat={index:number;id:string;text:string;position:number[];started:number;ended:number;spoken:boolean;nativeObserved:boolean};
/** One furniture label at a time. Saved observations never determine case truth. */
@component export class RoomscriptCastingController extends BaseScriptComponent {
  @input @hint("Tracked camera for label orientation") camera:Camera;
  static current:RoomscriptCastingController|null=null;
  private runRevision=-1;
  /** True while the furniture narration is still playing (presenters wait for it). */
  get running():boolean {return this.began>=0&&!this.complete&&this.runRevision===this.revision;}
  private marks:SceneObject[]=[];private badges:Text[]=[];private active=-1;private complete=false;private revision=0;private room:RoomInput=EVENING_ROOM_SCAN;
  private began=-1;private finished=-1;private trace:CastingBeat[]=[];private fallback=0;private captureIndex=-1;private captureUntil=0;
  onAwake():void {RoomscriptCastingController.current=this;this.createEvent("OnStartEvent").bind(()=>this.build());this.createEvent("UpdateEvent").bind(()=>this.update());this.createEvent("OnDestroyEvent").bind(()=>{this.revision++;});}
  private objects(){return this.room.objects.filter(o=>!o.virtual);}
  private build():void {
    for(const object of this.objects()){const mark=uiObject(this.getSceneObject(),"RoomscriptScanMark_"+object.id);mark.getTransform().setWorldPosition(new vec3(object.pos[0],object.pos[1]+EVENING_ROOM_FLOOR_Y+12,object.pos[2]));
      const ui=new PanelUI(mark,44,14,1.6,new vec4(.91,.69,.29,1),true,true);ui.text("Furniture",object.label.toUpperCase(),5,"title");ui.text("Role",object.type==="container"||object.type==="soft"?"HIDING PLACE":object.type==="blunt"?"WEAPON CANDIDATE":"WITNESS",4,"small");this.badges.push(ui.text("Surface pin","\u2304",3,"title"));mark.enabled=false;this.marks.push(mark);}
  }
  private visible(index:number):void {this.active=index;this.marks.forEach((mark,n)=>mark.enabled=n===index);}
  private delay(seconds:number):Promise<void>{return new Promise(resolve=>{const event=this.createEvent("DelayedCallbackEvent");event.bind(()=>{this.removeEvent(event);resolve();});event.reset(seconds);});}
  private async say(text:string,beat:CastingBeat,revision:number):Promise<void>{const audio=RoomscriptAudio.active,before=audio?.narrationEvidence("NARRATOR",text);let played=false;
    try{played=audio?await audio.narrate("NARRATOR",text):false;}catch{played=false;}
    if(revision!==this.revision)return;const after=audio?.narrationEvidence("NARRATOR",text);beat.spoken=played;beat.nativeObserved=!!before&&!!after&&after.observed>before.observed;
    if(!played){this.fallback++;console.log("CASTING_CAPTION_FALLBACK|"+JSON.stringify({index:beat.index,id:beat.id}));const remaining=Math.max(0,2.4-(getTime()-beat.started));if(remaining>0)await this.delay(remaining);}
    beat.ended=getTime();console.log("CASTING_BEAT|"+JSON.stringify(beat));
  }
  async begin(_mode:"preset"|"dynamic"="preset",_room:RoomInput=EVENING_ROOM_SCAN):Promise<void> {this.hide();this.complete=true;this.finished=getTime();}
  /** Explicit Preview/Director staging; not an engine action or a claim that the sweep played. */
  captureMark(index:number,seconds=120):boolean {if(!global.deviceInfoSystem.isEditor()||!Number.isInteger(index)||index<0||index>=this.marks.length)return false;this.revision++;this.captureIndex=index;this.captureUntil=getTime()+Math.min(120,Math.max(.1,seconds));this.badges.forEach((badge,i)=>badge.text=i===index?"DIRECTOR HOLD":"\u2304");this.visible(index);return true;}
  showAll():void {this.revision++;this.captureIndex=-1;this.badges.forEach(b=>b.text="\u2304");this.marks.forEach(o=>o.enabled=true);}
  hide():void {this.revision++;this.captureIndex=-1;this.badges.forEach(b=>b.text="\u2304");this.visible(-1);}
  private update():void {if(this.captureIndex>=0&&getTime()>=this.captureUntil)this.hide();if(!this.camera)return;const rotation=this.camera.getTransform().getWorldRotation();for(const mark of this.marks)if(mark.enabled)mark.getTransform().setWorldRotation(rotation);}
  diagnostics(){return {objects:this.marks.length,active:this.active,complete:this.complete,began:this.began,finished:this.finished,fallback:this.fallback,captureIndex:this.captureIndex,visible:this.marks.map((mark,index)=>({id:this.objects()[index].id,enabled:mark.enabled,position:mark.getTransform().getWorldPosition()})),trace:this.trace.map(beat=>({...beat,position:beat.position.slice()}))};}
}
