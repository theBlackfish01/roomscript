
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptRoomBinding} from "./RoomscriptRoomBinding";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {RUN10_FIND_OBJECTS} from "./Content/Run10HeroCase";
import {RUN10_VOICE_MANIFEST} from "./Content/Run10VoiceManifest";
import {HARLOW_ITEM_OBSERVATIONS} from "./Content/HarlowItemObservations";
const OBSERVATIONS:Record<string,string>={O11:"N10_KETTLE",O12:"N10_RECORDER",O1:"N10_CABLE",O13:"N10_LETTER",O14:"N10_DEBT",O4:"N10_MEDICINE",O15:"N10_CERTIFICATE"};
/** Physical items submit one deterministic PinchObject. No pull or second evidence menu. */
export class RoomscriptFindItems {
 private targets:{collider:ColliderComponent;interaction:Interactable}[]=[];private observed=new Set<string>();
 constructor(private engine:RoomscriptEngineBridge,private flow:RoomscriptInterrogationController,private room:RoomscriptRoomBinding){
   this.build();engine.onCaseChanged.add(()=>{this.observed.clear();this.build();});
 }
 private build():void{
   for(const t of this.targets){if(!isNull(t.interaction))t.interaction.destroy();if(!isNull(t.collider))t.collider.destroy();}this.targets=[];this.room.initialize();
   const graph=this.engine.graphRef();
   for(const object of graph.room.objects.filter(o=>RUN10_FIND_OBJECTS.includes(o.id))){
     const anchor=this.room.objectAnchor(object.id),shape=Shape.createBoxShape();shape.size=object.affordances.includes("evidence:paper")?new vec3(22,8,28):object.type==="sharp"?new vec3(30,20,18):new vec3(18,20,18);
     const collider=anchor.createComponent("Physics.ColliderComponent");collider.shape=shape;
     const interaction=anchor.createComponent(Interactable.getTypeName()) as Interactable;interaction.targetingMode=3;
     interaction.onTriggerEnd.add(()=>this.find(object.id));this.targets.push({collider,interaction});
   }
 }
 find(id:string):boolean{
   if(!this.engine.investigationEnabled||this.flow.controlsBlocked||this.engine.snapshot().verdict||!RUN10_FIND_OBJECTS.includes(id))return false;
   const before=this.engine.snapshot().knowledge.evidenceIds.length,state=this.engine.dispatch({type:"PinchObject",object:id});
   if(state.verdict)return false;
   const line=RUN10_VOICE_MANIFEST.find(l=>l.id===OBSERVATIONS[id]),text=line?.text||HARLOW_ITEM_OBSERVATIONS[id];
   if(state.knowledge.evidenceIds.length===before){if(text&&!RoomscriptAudio.active.speechBusy())void RoomscriptAudio.active.narrate(line?.speaker||"NARRATOR",text);return false;}
   RoomscriptAudio.active.playAt("Chime",this.room.objectAnchor(id).getTransform().getWorldPosition());
   if(!this.observed.has(id)){this.observed.add(id);if(text)void RoomscriptAudio.active.narrate(line?.speaker||"NARRATOR",text);}
   console.log("FIND_ITEM|"+id);return true;
 }
}
