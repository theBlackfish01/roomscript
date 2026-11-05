import {EVENING_ROOM_SCAN,EVENING_ROOM_FLOOR_Y} from "./Content/EveningRoomScan";
import {PanelUI,uiObject} from "./RoomscriptPanelUI";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {RoomInput} from "./Engine/room/RoomModel";
/** One furniture label at a time. Saved observations never determine case truth. */
@component export class RoomscriptCastingController extends BaseScriptComponent {
  @input @hint("Tracked camera for label orientation") camera:Camera;
  private marks:SceneObject[]=[];private active=-1;private started=-1;private complete=false;private revision=0;private room:RoomInput=EVENING_ROOM_SCAN;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.build());this.createEvent("UpdateEvent").bind(()=>this.update());}
  private build():void {
    for(const object of this.room.objects.filter(o=>!o.virtual)){const mark=uiObject(this.getSceneObject(),"RoomscriptScanMark_"+object.id);mark.getTransform().setWorldPosition(new vec3(object.pos[0],object.pos[1]+EVENING_ROOM_FLOOR_Y+12,object.pos[2]));
      const ui=new PanelUI(mark,44,14,1.6,new vec4(.91,.69,.29,1),true,true);ui.text("Furniture",object.label.toUpperCase(),5,"title");ui.text("Role",object.type==="container"||object.type==="soft"?"HIDING PLACE":object.type==="blunt"?"WEAPON CANDIDATE":"WITNESS",4,"small");ui.text("Surface pin","\u2304",3,"title");mark.enabled=false;this.marks.push(mark);}
  }
  async begin(mode:"preset"|"dynamic"="preset",room:RoomInput=EVENING_ROOM_SCAN):Promise<void> {const revision=++this.revision;this.marks.forEach(o=>{if(!isNull(o))o.destroy();});this.marks=[];this.room=room;this.build();this.started=-1;this.active=-1;this.complete=false;
    const objects=room.objects.filter(o=>!o.virtual),audio=RoomscriptAudio.active;
    for(let i=0;i<objects.length;i++){if(revision!==this.revision)return;this.active=i;this.marks.forEach((o,n)=>o.enabled=n===i);audio?.play("CastingChime");const object=objects[i],role=object.type==="container"||object.type==="soft"?"a hiding place":object.type==="blunt"?"a possible weapon":"a witness";await audio?.narrate("NARRATOR","Your "+object.label+": "+role+".");}
    if(revision!==this.revision)return;this.marks.forEach(o=>o.enabled=false);await audio?.narrate("NARRATOR",mode==="preset"?"Tonight, this room is Harlow's study.":"Same room. New murder.");this.complete=true;
  }
  showAll():void {this.started=-1;this.marks.forEach(o=>o.enabled=true);}
  hide():void {this.started=-1;this.marks.forEach(o=>o.enabled=false);}
  private update():void {if(!this.camera)return;const rotation=this.camera.getTransform().getWorldRotation();for(const mark of this.marks)if(mark.enabled)mark.getTransform().setWorldRotation(rotation);
    if(this.started<0)return;const step=Math.floor((getTime()-this.started)/2.3);if(step===this.active)return;this.active=step;this.marks.forEach((o,i)=>o.enabled=i===step);if(step<this.marks.length)RoomscriptAudio.active?.play("CastingChime");else{this.complete=true;this.started=-1;}}
  diagnostics():{objects:number;active:number;complete:boolean}{return {objects:this.marks.length,active:this.active,complete:this.complete};}
}
