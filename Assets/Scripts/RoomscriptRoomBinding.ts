import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {Vec3} from "./Engine/core/Types";
import {EVENING_ROOM_FLOOR_Y} from "./Content/EveningRoomScan";
import {presetProp} from "./RoomscriptArtLibrary";

/** Case coordinates are floor-local centimeters. Authored anchors are the shared world mapping. */
@component export class RoomscriptRoomBinding extends BaseScriptComponent {
  @input @hint("Deterministic case owner") engine:RoomscriptEngineBridge;
  private objects=new Map<string,SceneObject>();private zones=new Map<string,SceneObject>();
  private authoredObjects=new Map<string,SceneObject>();private authoredZones=new Map<string,SceneObject>();private generated:SceneObject[]=[];private boundCase="";private subscribed=false;private home:vec3;private rotation:quat;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.initialize());}
  initialize():void {
    this.engine.initialize();const graph=this.engine.graphRef();if(this.boundCase===graph.caseId)return;const root=this.getSceneObject();
    if(!this.home){this.home=this.getTransform().getWorldPosition();this.rotation=this.getTransform().getWorldRotation();
    for(let i=0;i<root.getChildrenCount();i++) {
      const child=root.getChild(i);
      if(child.name.startsWith("RoomscriptObject_"))this.authoredObjects.set(child.name.slice(17),child);
      if(child.name.startsWith("RoomscriptZone_"))this.authoredZones.set(child.name.slice(15),child);
    }
    }
    this.generated.forEach(o=>o.destroy());this.generated=[];this.objects.clear();this.zones.clear();
    const preset=this.engine.mode()==="preset";this.authoredObjects.forEach(o=>o.enabled=preset);this.authoredZones.forEach(o=>o.enabled=preset);
    if(preset){this.getTransform().setWorldPosition(new vec3(0,EVENING_ROOM_FLOOR_Y,0));this.getTransform().setWorldRotation(quat.quatIdentity());this.objects=new Map(this.authoredObjects);this.zones=new Map(this.authoredZones);
      graph.room.objects.forEach(o=>this.objects.get(o.id)?.getTransform().setLocalPosition(new vec3(o.pos[0],o.pos[1],o.pos[2])));
      graph.room.zones.forEach(z=>this.zones.get(z.id)?.getTransform().setLocalPosition(new vec3(z.anchor[0],z.anchor[1],z.anchor[2])));
    }
    else{this.getTransform().setWorldPosition(new vec3(0,EVENING_ROOM_FLOOR_Y,0));this.getTransform().setWorldRotation(quat.quatIdentity());
      const make=(name:string,pos:Vec3)=>{const o=global.scene.createSceneObject(name);o.setParent(root);o.getTransform().setLocalPosition(new vec3(pos[0],pos[1],pos[2]));this.generated.push(o);return o;};
      graph.room.objects.forEach(o=>this.objects.set(o.id,make("RoomscriptObject_"+o.id,o.pos)));graph.room.zones.forEach(z=>this.zones.set(z.id,make("RoomscriptZone_"+z.id,z.anchor)));
    }
    if(preset)for(const object of graph.room.objects){const prefab=presetProp(graph,object.id);if(!prefab)continue;const visual=prefab.instantiate(this.objectAnchor(object.id));visual.name="RoomscriptPropVisual_"+object.id;visual.getTransform().setLocalPosition(vec3.zero());visual.getTransform().setLocalScale(vec3.one());if(object.id==="O3"){visual.getTransform().setLocalRotation(quat.fromEulerAngles(0,0,Math.PI/2));visual.getTransform().setLocalPosition(new vec3(16,1.25,0));}this.generated.push(visual);}
    this.boundCase=graph.caseId;if(!this.subscribed){this.subscribed=true;this.engine.onCaseChanged.add(()=>{this.boundCase="";this.initialize();});}
    const failures=this.audit();if(failures.length)throw new Error("Room binding: "+failures.join(", "));
  }
  objectAnchor(id:string):SceneObject {const anchor=this.objects.get(id);if(!anchor)throw new Error("Unbound object "+id);return anchor;}
  zoneAnchor(id:string):SceneObject {const anchor=this.zones.get(id);if(!anchor)throw new Error("Unbound zone "+id);return anchor;}
  propCount():number{return this.generated.filter(o=>!isNull(o)&&o.name.startsWith("RoomscriptPropVisual_")).length;}
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
