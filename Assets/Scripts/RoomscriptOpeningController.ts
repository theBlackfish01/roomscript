import {RoomscriptCastController} from "./RoomscriptCastController";
import {RoomscriptClueController} from "./RoomscriptClueController";
import {RoomscriptCaseCrate} from "./RoomscriptCaseCrate";
import {RoomscriptDragInteraction} from "./RoomscriptDragInteraction";
import {PanelUI,uiObject,wrapText} from "./RoomscriptPanelUI";
import {worldLines} from "./RoomscriptWorldLines";

/** Authored pre-show. No evidence, time or truth actions; the player opens the case. */
@component export class RoomscriptOpeningController extends BaseScriptComponent {
  @input @hint("Persistent actors and room") cast:RoomscriptCastController;
  @input @hint("Envelope and shared presentation") clue:RoomscriptClueController;
  @input @hint("Hinged case") crate:RoomscriptCaseCrate;
  private nextBeat=0;private phase="boot";private began=0;private step=-1;private panel:SceneObject;private caption:Text;private tab:SceneObject;
  private chalk:SceneObject[]=[];private tape:SceneObject;private motes:SceneObject[]=[];private beam:SceneObject;
  private envelopeHome:vec3;private crateHome:vec3;private lastTick=0;private trace:string[]=[];
  private placement:SceneObject;private placementText:Text;private floorMarker:SceneObject;private floorOffset=0;private yaw=0;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.build());this.createEvent("UpdateEvent").bind(()=>this.update());}
  private build():void {
    this.cast.flow.initialize();const room=this.cast.room,ink=this.clue.objection.tells.lightMaterial.clone();ink.mainPass.baseColor=new vec4(1,.84,.04,1);
    this.panel=uiObject(this.crate.getSceneObject(),"RoomscriptOpeningCard");this.panel.getTransform().setLocalPosition(new vec3(-10,7,70));const ui=new PanelUI(this.panel,58,32,2,new vec4(1,.94,.84,1));ui.text("Case label","HARLOW / 1041",7,"title");this.caption=ui.text("Opening cue","Listen at the door.",15,"small");
    this.tab=uiObject(this.crate.getSceneObject(),"RoomscriptPullTab");this.tab.getTransform().setLocalPosition(new vec3(-10,-17,72));new PanelUI(this.tab,38,8,2,new vec4(1,.84,.04,1),true).text("Pull label","PULL TO OPEN",6,"small");
    const drag=this.tab.createComponent(RoomscriptDragInteraction.getTypeName()) as RoomscriptDragInteraction;const home=this.tab.getTransform().getLocalPosition();drag.onDragEnd.add(()=>{const distance=this.tab.getTransform().getLocalPosition().distance(home);this.tab.getTransform().setLocalPosition(home);if(this.phase==="tab"&&distance>3)this.pull();});this.tab.enabled=false;
    const door=room.objectAnchor("O8");this.tape=worldLines(door,"RoomscriptDoorTape",[[new vec3(-45,-25,3),new vec3(45,15,3)],[new vec3(-45,15,3),new vec3(45,-25,3)]],ink,5).getSceneObject();this.tape.enabled=false;
    const body=room.zoneAnchor("Z1"),path=[[-35,-20],[-20,-10],[-15,15],[-25,25],[-23,40],[-10,45],[0,40],[2,25],[15,15],[20,-10],[35,-20],[25,-28],[8,-15],[8,-55],[20,-78],[12,-84],[-2,-62],[-8,-40],[-16,-62],[-28,-80],[-35,-74],[-20,-52],[-20,-15],[-35,-20]];
    path.slice(1).forEach((p,i)=>{const a=path[i],line=worldLines(body,"Opening chalk "+i,[[new vec3(a[0],2,a[1]),new vec3(p[0],2,p[1])]],ink,1.2,vec3.up()).getSceneObject();line.enabled=false;this.chalk.push(line);});
    this.beam=worldLines(this.crate.getSceneObject(),"RoomscriptLidLight",Array.from({length:9},(_,i)=>[new vec3((i-4)*4,5,0),new vec3((i-4)*7,48,-8)] as [vec3,vec3]),ink,1.4).getSceneObject();this.beam.enabled=false;
    for(let i=0;i<12;i++){const mote=worldLines(this.crate.getSceneObject(),"Opening mote "+i,[[new vec3(-.3,0,0),new vec3(.3,0,0)]],ink,1).getSceneObject();mote.getTransform().setLocalPosition(new vec3(Math.sin(i*2.4)*35,20+i*3,Math.cos(i*2.4)*20));this.motes.push(mote);}
    this.envelopeHome=this.clue.envelope.getTransform().getLocalPosition();this.crateHome=this.crate.getTransform().getLocalPosition();this.crate.close();this.clue.envelope.enabled=false;this.showPlay(false);this.cast.flow.engine.caseGraph().cast.suspects.forEach(s=>this.cast.flow.actorFor(s.id)!.getSceneObject().enabled=false);
    this.cast.flow.engine.investigationEnabled=false;this.phase="placement";this.panel.enabled=false;this.clue.objection.tells.audio.silence(true);
    this.placement=uiObject(this.cast.flow.actor.camera,"RoomscriptPlacement");this.placement.getTransform().setLocalPosition(new vec3(0,0,-130));const placeUI=new PanelUI(this.placement,52,42,1.9,new vec4(1,.94,.84,1));placeUI.text("Placement title","PLACE THE CASE",7,"title");this.placementText=placeUI.text("Placement guide","Align the floor cross with your floor.\nLeave space around the markers.",15,"small");
    placeUI.buttons([{id:"Floor lower",label:"Floor down"},{id:"Floor higher",label:"Floor up"}],id=>{this.floorOffset+=id==="Floor higher"?5:-5;this.applyPlacement();},6);
    placeUI.buttons([{id:"Turn case left",label:"Turn left"},{id:"Turn case right",label:"Turn right"}],id=>{this.yaw+=(id==="Turn case left"?1:-1)*Math.PI/12;this.applyPlacement();},6);
    placeUI.buttons([{id:"Place case",label:"Place case here"}],()=>this.placeCase(),6);
    this.floorMarker=worldLines(room.getSceneObject(),"RoomscriptFloorCross",[[new vec3(-35,2,-100),new vec3(35,2,-100)],[new vec3(0,2,-65),new vec3(0,2,-135)]],ink,2,vec3.up()).getSceneObject();
    for(const object of this.cast.flow.engine.caseGraph().room.objects){const anchor=room.objectAnchor(object.id);worldLines(anchor,"Fixture bracket "+object.id,[[new vec3(-9,0,5),new vec3(-9,8,5)],[new vec3(-9,8,5),new vec3(-3,8,5)],[new vec3(3,8,5),new vec3(9,8,5)],[new vec3(9,8,5),new vec3(9,0,5)]],ink,.9);const label=uiObject(anchor,"Fixture label "+object.id);label.getTransform().setLocalPosition(new vec3(0,15,6));new PanelUI(label,34,9,1.5,new vec4(1,.84,.04,1),true,true).text("Fixture name",wrapText(object.label,18),8,"small");}
  }
  private applyPlacement():void {this.floorOffset=Math.max(-80,Math.min(80,this.floorOffset));const root=this.getSceneObject().getParent(),head=this.cast.flow.actor.camera.getTransform().getWorldPosition();root.getTransform().setWorldPosition(new vec3(head.x,this.floorOffset,head.z));root.getTransform().setWorldRotation(quat.fromEulerAngles(0,this.yaw,0));this.placementText.text="Floor height adjusted "+this.floorOffset+" cm.\nAlign the cross with your floor.\nThen place the case.";}
  placeCase():void {if(this.phase!=="placement")return;this.placement.enabled=false;this.floorMarker.enabled=false;this.panel.enabled=true;this.phase="knocks";this.began=getTime();this.step=-1;this.nextBeat=0;this.beat("placed");}
  private showPlay(value:boolean):void {const flow=this.cast.flow;flow.chips.show(value);flow.verbs.show(value);flow.subtitles.getSceneObject().enabled=value;this.clue.objection.caseLid.show(value);this.cast.getSceneObject().enabled=value;for(let i=0;i<this.clue.tray.getChildrenCount();i++){const child=this.clue.tray.getChild(i);if(child.name.startsWith("RoomscriptPawn_"))child.enabled=value;}}
  private beat(name:string):void {this.trace.push(name);}
  pull():void {if(this.phase!=="tab")return;this.phase="reveal";this.began=getTime();this.step=-1;this.tab.enabled=false;this.crate.restart();this.beam.enabled=true;this.clue.objection.tells.audio.play("TapeZip");this.beat("pull");}
  /** Test setup may skip the pre-show; the opening scenario exercises the real pull. */
  finish():void {if(this.phase==="boot")return;this.cast.flow.engine.investigationEnabled=true;this.cast.flow.engine.configurePose();this.clue.syncSetupPose();this.phase="ready";this.placement.enabled=false;this.floorMarker.enabled=false;this.panel.enabled=false;this.tab.enabled=false;this.tape.enabled=true;this.beam.enabled=false;this.chalk.forEach(o=>o.enabled=true);this.clue.envelope.enabled=true;this.clue.envelope.getTransform().setLocalPosition(this.envelopeHome);this.crate.getTransform().setLocalPosition(this.crateHome);this.crate.restart();this.cast.flow.engine.caseGraph().cast.suspects.forEach(s=>this.cast.flow.actorFor(s.id)!.getSceneObject().enabled=true);this.showPlay(true);this.clue.objection.tells.audio.silence(false);this.beat("ready");}
  private update():void {
    if(this.phase==="boot")return;const t=getTime()-this.began,audio=this.clue.objection.tells.audio,room=this.cast.room;
    if(this.phase==="knocks"){
      if(t>=this.nextBeat){const step=++this.step;this.nextBeat=t+.65;if(step<3){audio.playAt("Knock",room.objectAnchor("O8").getTransform().getWorldPosition());this.beat("knock");}if(step===3){this.tape.enabled=true;audio.playAt("TapeZip",room.objectAnchor("O8").getTransform().getWorldPosition());this.caption.text="Nobody leaves.";this.beat("tape");}if(step>=5){audio.playAt("CrateThud",this.crate.getTransform().getWorldPosition());this.phase="tab";this.tab.enabled=true;this.caption.text="Edmund Harlow was found at 22:41.\nFour guests. One killer.\nPull the yellow tab.";this.beat("crate");}}
    }else if(this.phase==="reveal"){
      const step=Math.floor(t);if(step!==this.step){this.step=step;
        if(step===1){audio.playAt("ChalkScratch",room.zoneAnchor("Z1").getTransform().getWorldPosition());this.beat("chalk");}
        if(step===4){this.clue.envelope.enabled=true;audio.play("Shing");this.beat("envelope");}
        if(step===6){audio.play("Ratchet");this.beat("riffle");}
        if(step===8){audio.play("Objection");this.caption.text="SEALED\nTruth waits inside.";this.beat("seal");}
        if(step>=9&&step<=12){const ids=["S2","S1","S3","S4"],id=ids[step-9];this.cast.flow.actorFor(id)!.getSceneObject().enabled=true;audio.play("Chime");this.caption.text=wrapText(this.cast.flow.engine.caseGraph().cast.suspects.find(s=>s.id===id)!.name+" arrives.",28);this.beat("arrival:"+id);}
        if(step>=13)this.finish();
      }
      this.chalk.forEach((o,i)=>o.enabled=t>=1+i/this.chalk.length*2.5);
      if(t>=4&&t<6)this.clue.envelope.getTransform().setLocalPosition(this.envelopeHome.add(new vec3(0,0,-20*(1-Math.min(1,(t-4)/2)))));
      if(t>=6&&t<8){const graph=this.cast.flow.engine.caseGraph(),items=[...graph.room.zones.map(z=>z.clueName),...graph.room.objects.map(o=>o.label)];this.caption.text="YOUR ROOM IS THE BOARD\n"+items[Math.floor((t-6)*9)%items.length];}
    }
    if(this.phase==="ready"&&!this.cast.flow.engine.snapshot().verdict&&getTime()-this.lastTick>=1){this.lastTick=getTime();audio.playAt("ClockTick",room.objectAnchor("O7").getTransform().getWorldPosition());}
  }
  diagnostics():{phase:string;trace:string[];chalk:number} {return {phase:this.phase,trace:this.trace.slice(),chalk:this.chalk.filter(o=>o.enabled).length};}
}
