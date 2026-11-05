import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {Vec3} from "./Engine/core/Types";

/** Case coordinates are floor-local centimeters. Authored anchors are the shared world mapping. */
@component export class RoomscriptRoomBinding extends BaseScriptComponent {
  @input @hint("Deterministic case owner") engine:RoomscriptEngineBridge;
  private objects=new Map<string,SceneObject>();private zones=new Map<string,SceneObject>();
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.initialize());}
  initialize():void {
    if(this.objects.size)return;this.engine.initialize();const root=this.getSceneObject();
    for(let i=0;i<root.getChildrenCount();i++) {
      const child=root.getChild(i);
      if(child.name.startsWith("RoomscriptObject_"))this.objects.set(child.name.slice(17),child);
      if(child.name.startsWith("RoomscriptZone_"))this.zones.set(child.name.slice(15),child);
    }
    const failures=this.audit();if(failures.length)throw new Error("Room binding: "+failures.join(", "));
  }
  objectAnchor(id:string):SceneObject {const anchor=this.objects.get(id);if(!anchor)throw new Error("Unbound object "+id);return anchor;}
  zoneAnchor(id:string):SceneObject {const anchor=this.zones.get(id);if(!anchor)throw new Error("Unbound zone "+id);return anchor;}
  toWorld(position:Vec3):vec3 {return this.getTransform().getWorldTransform().multiplyPoint(new vec3(position[0],position[1],position[2]));}
  audit():string[] {
    const graph=this.engine.graphRef(),failures:string[]=[];
    for(const item of [...graph.room.objects.map(o=>({id:o.id,pos:o.pos,anchor:this.objects.get(o.id)})),...graph.room.zones.map(z=>({id:z.id,pos:z.anchor,anchor:this.zones.get(z.id)}))]) {
      if(!item.anchor)failures.push("missing "+item.id);
      else if(item.anchor.getTransform().getWorldPosition().distance(this.toWorld(item.pos))>.1)failures.push("position "+item.id);
    }
    return failures;
  }
}
