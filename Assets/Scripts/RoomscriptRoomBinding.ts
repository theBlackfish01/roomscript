import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {Vec3} from "./Engine/core/Types";
import {EVENING_ROOM_FLOOR_Y} from "./Content/EveningRoomScan";
import {RoomscriptPropMesh} from "./RoomscriptPropMesh";
import {createAuthoredCable} from "./RoomscriptCableProp";
import {presetCableObject} from "./Content/AuthoredCableGeometry";
import {propDrawing} from "./RoomscriptPropArt";

/** Case coordinates are floor-local centimeters. Authored anchors are the shared world mapping. */
@component export class RoomscriptRoomBinding extends BaseScriptComponent {
  @input @hint("Deterministic case owner") engine:RoomscriptEngineBridge;
  private objects=new Map<string,SceneObject>();private zones=new Map<string,SceneObject>();
  private replacedProps:string[]=[];private legacyProps=new Map<SceneObject,boolean>();
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
    this.legacyProps.forEach((enabled,object)=>{if(!isNull(object))object.enabled=enabled;});this.legacyProps.clear();this.replacedProps=[];
    this.generated.forEach(o=>{if(!isNull(o))o.destroy();});this.generated=[];this.objects.clear();this.zones.clear();
    const preset=this.engine.mode()==="preset";this.authoredObjects.forEach(o=>o.enabled=preset);this.authoredZones.forEach(o=>o.enabled=preset);
    if(preset){this.getTransform().setWorldPosition(new vec3(0,EVENING_ROOM_FLOOR_Y,0));this.getTransform().setWorldRotation(quat.quatIdentity());this.objects=new Map(this.authoredObjects);this.zones=new Map(this.authoredZones);
      graph.room.objects.forEach(o=>this.objects.get(o.id)?.getTransform().setLocalPosition(new vec3(o.pos[0],o.pos[1],o.pos[2])));
      graph.room.zones.forEach(z=>this.zones.get(z.id)?.getTransform().setLocalPosition(new vec3(z.anchor[0],z.anchor[1],z.anchor[2])));
    }
    else{this.getTransform().setWorldPosition(new vec3(0,EVENING_ROOM_FLOOR_Y,0));this.getTransform().setWorldRotation(quat.quatIdentity());
      const make=(name:string,pos:Vec3)=>{const o=global.scene.createSceneObject(name);o.setParent(root);o.getTransform().setLocalPosition(new vec3(pos[0],pos[1],pos[2]));this.generated.push(o);return o;};
      graph.room.objects.forEach(o=>this.objects.set(o.id,make("RoomscriptObject_"+o.id,o.pos)));graph.room.zones.forEach(z=>this.zones.set(z.id,make("RoomscriptZone_"+z.id,z.anchor)));
    }
    // Run 9: every Preset prop is a textured mesh (RoomscriptPropModels) where its kind has one, else an engraved line drawing.
    if(preset)for(const object of graph.room.objects){if(presetCableObject(graph)?.id===object.id)continue;const anchor=this.objectAnchor(object.id),drawing=propDrawing(anchor,object.id,object.type,graph.weapons.includes(object.id));if(!drawing)continue;this.hideReplacedLegacy(anchor,drawing);this.replacedProps.push(object.id);this.generated.push(drawing);}
    // Run 8: props with no model get engraved line drawings (Preset fictional items; Dynamic virtual substitutes).
    const cableId=preset?presetCableObject(graph)?.id:undefined;
    for(const object of graph.room.objects){if(object.id===cableId||this.replacedProps.includes(object.id)||(!preset&&!object.virtual))continue;const drawing=propDrawing(this.objectAnchor(object.id),object.id,object.type,graph.weapons.includes(object.id));if(drawing)this.generated.push(drawing);}
    const cableObject=preset?presetCableObject(graph):undefined;if(cableObject){const cable=createAuthoredCable(this.objectAnchor(cableObject.id),cableObject.id);if(cable)this.generated.push(cable);}
    this.boundCase=graph.caseId;if(!this.subscribed){this.subscribed=true;this.engine.onCaseChanged.add(()=>{this.boundCase="";this.initialize();});}
    const failures=this.audit();if(failures.length)throw new Error("Room binding: "+failures.join(", "));
  }
  objectAnchor(id:string):SceneObject {const anchor=this.objects.get(id);if(!anchor)throw new Error("Unbound object "+id);return anchor;}
  zoneAnchor(id:string):SceneObject {const anchor=this.zones.get(id);if(!anchor)throw new Error("Unbound zone "+id);return anchor;}
  propCount():number{return this.generated.filter(o=>!isNull(o)&&o.name.startsWith("RoomscriptPropVisual_")).length;}
  private hideReplacedLegacy(anchor:SceneObject,replacement:SceneObject):void {
    const visit=(object:SceneObject)=>{if(object.isSame(replacement))return;
      if(object.getComponent(RoomscriptPropMesh.getTypeName())){this.legacyProps.set(object,object.enabled);object.enabled=false;}
      for(let i=0;i<object.getChildrenCount();i++)visit(object.getChild(i));
    };
    for(let i=0;i<anchor.getChildrenCount();i++)visit(anchor.getChild(i));
  }
  legacyPropDiagnostics():{replaced:string[];hidden:number;visible:number;anchorsEnabled:boolean;names:string[]}{
    const nodes=[...this.legacyProps.keys()].filter(object=>!isNull(object));
    return {replaced:this.replacedProps.slice(),hidden:nodes.filter(object=>!object.enabled).length,visible:nodes.filter(object=>object.enabled).length,anchorsEnabled:this.replacedProps.every(id=>this.objectAnchor(id).enabled),names:nodes.map(object=>object.name)};
  }
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
