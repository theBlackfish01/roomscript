import {RoomscriptCastController} from "./RoomscriptCastController";
import {RoomscriptClueController} from "./RoomscriptClueController";
import {RoomscriptCaseCrate} from "./RoomscriptCaseCrate";
import {RoomscriptDragInteraction} from "./RoomscriptDragInteraction";
import {PanelUI,uiObject,wrapText} from "./RoomscriptPanelUI";
import {worldLines} from "./RoomscriptWorldLines";
import {openingCaseCard} from "./Engine/game/CaseClarity";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {caseExitPosition} from "./Engine/game/RoomPresentation";
import {recordedCrateSurfaceLayout} from "./Content/CrateSurfaceLayout";
import {hideLeafOverlays} from "./RoomscriptFilm";

/** Authored pre-show. No evidence, time or truth actions; the player opens the case. */
@component export class RoomscriptOpeningController extends BaseScriptComponent {
  @input @hint("Persistent actors and room") cast:RoomscriptCastController;
  @input @hint("Envelope and shared presentation") clue:RoomscriptClueController;
  @input @hint("Hinged case") crate:RoomscriptCaseCrate;
  @input @hint("Clean film presentation: auto-place and hide Preview/debug geometry") filmMode:boolean=false;
  private objectBrackets=new Map<string,SceneObject>();private objectLabels:SceneObject[]=[];private zoneLabels:SceneObject[]=[];private nextDetail=0;
  readonly onMode=new Event<string>();readonly onBeat=new Event<string>();private subscribed=false;private fixtures:SceneObject[]=[];
  private verdict=false;private riffle:string[]=[];private nextBeat=0;private phase="boot";private began=0;private step=-1;private panel:SceneObject;private caption:Text;private tab:SceneObject;
  private chalk:SceneObject[]=[];private tape:SceneObject;private motes:SceneObject[]=[];private beam:SceneObject;
  private envelopeHome:vec3;private crateHome:vec3;private lastTick=0;private trace:string[]=[];
  private placement:SceneObject;private placementText:Text;private floorMarker:SceneObject;private floorOffset=0;private yaw=0;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.build());this.createEvent("UpdateEvent").bind(()=>this.update());}
  private build():void {
    this.cast.flow.initialize();this.cast.room.initialize();const graph=this.cast.flow.engine.graphRef();this.riffle=[...graph.room.zones.map(z=>z.clueName),...graph.room.objects.map(o=>o.label)];
    if(!this.subscribed){this.subscribed=true;this.cast.flow.engine.onState.add(state=>{this.verdict=!!state.verdict;this.syncClock();});this.cast.flow.engine.onCaseChanged.add(()=>this.resetForCase());}const room=this.cast.room,ink=this.clue.objection.tells.lightMaterial.clone();ink.mainPass.baseColor=new vec4(.91,.69,.29,1);
    const crateLayout=recordedCrateSurfaceLayout(),card=crateLayout.openingCard,pull=crateLayout.pullTab;
    this.panel=uiObject(this.crate.getSceneObject(),"RoomscriptOpeningCard");this.panel.getTransform().setLocalPosition(new vec3(card.position[0],card.position[1],card.position[2]));const ui=new PanelUI(this.panel,card.width,card.height,1.7,new vec4(1,.94,.84,1));ui.text("Case label",this.cast.flow.engine.mode()==="preset"?"THE HARLOW TRUST":"SAME ROOM. NEW MURDER.",5,"title");this.caption=ui.text("Opening cue","Listen at the door.",10,"small");ui.buttons([{id:"Preset case",label:"Preset"},{id:"Cast my room",label:"Cast my room"}],id=>this.onMode.invoke(id==="Preset case"?"preset":"dynamic"),9);
    this.tab=uiObject(this.crate.getSceneObject(),"RoomscriptPullTab");this.tab.getTransform().setLocalPosition(new vec3(pull.position[0],pull.position[1],pull.position[2]));new PanelUI(this.tab,pull.width,pull.height,2,new vec4(.91,.69,.29,1),true).buttons([{id:"Pull tab",label:"PULL TO OPEN"}],()=>this.pull(),pull.buttonHeight);
    const drag=this.tab.createComponent(RoomscriptDragInteraction.getTypeName()) as RoomscriptDragInteraction;const home=this.tab.getTransform().getLocalPosition();drag.onDragEnd.add(()=>{const distance=this.tab.getTransform().getLocalPosition().distance(home);this.tab.getTransform().setLocalPosition(home);if(this.phase==="tab"&&distance>3)this.pull();});this.tab.enabled=false;
    const doorObject=graph.room.objects.find(o=>o.type==="door"),door=doorObject?room.objectAnchor(doorObject.id):room.zoneAnchor(graph.room.zones[0].id);this.tape=worldLines(door,"RoomscriptDoorTape",[[new vec3(-45,-25,3),new vec3(45,15,3)],[new vec3(-45,15,3),new vec3(45,-25,3)]],ink,5).getSceneObject();this.tape.enabled=false;
    const body=room.zoneAnchor("Z1"),path=[[-35,-20],[-20,-10],[-15,15],[-25,25],[-23,40],[-10,45],[0,40],[2,25],[15,15],[20,-10],[35,-20],[25,-28],[8,-15],[8,-55],[20,-78],[12,-84],[-2,-62],[-8,-40],[-16,-62],[-28,-80],[-35,-74],[-20,-52],[-20,-15],[-35,-20]];
    path.slice(1).forEach((p,i)=>{const a=path[i],line=worldLines(body,"Opening chalk "+i,[[new vec3(a[0],2,a[1]),new vec3(p[0],2,p[1])]],ink,1.2,vec3.up()).getSceneObject();line.enabled=false;this.chalk.push(line);});
    this.beam=worldLines(this.crate.getSceneObject(),"RoomscriptLidLight",Array.from({length:9},(_,i)=>[new vec3((i-4)*4,5,0),new vec3((i-4)*7,48,-8)] as [vec3,vec3]),ink,1.4).getSceneObject();this.beam.enabled=false;
    for(let i=0;i<12;i++){const mote=worldLines(this.crate.getSceneObject(),"Opening mote "+i,[[new vec3(-.3,0,0),new vec3(.3,0,0)]],ink,1).getSceneObject();mote.getTransform().setLocalPosition(new vec3(Math.sin(i*2.4)*35,20+i*3,Math.cos(i*2.4)*20));this.motes.push(mote);}
    this.envelopeHome=this.clue.envelope.getTransform().getLocalPosition();if(!this.crateHome)this.crateHome=this.crate.getTransform().getLocalPosition();this.crate.close();this.clue.envelope.enabled=false;this.showPlay(false);this.cast.flow.engine.graphRef().cast.suspects.forEach(s=>this.cast.flow.actorFor(s.id)!.getSceneObject().enabled=false);
    this.cast.flow.engine.investigationEnabled=false;this.phase="placement";this.panel.enabled=false;this.clue.objection.tells.audio.silence(true);
    this.placement=uiObject(this.cast.flow.actor.camera,"RoomscriptPlacement");this.placement.getTransform().setLocalPosition(new vec3(0,0,-130));const placeUI=new PanelUI(this.placement,52,42,1.9,new vec4(1,.94,.84,1));placeUI.text("Placement title","PLACE THE CASE",7,"title");this.placementText=placeUI.text("Placement guide","Align the floor cross with your floor.\nLeave space around the markers.",15,"small");
    placeUI.buttons([{id:"Floor lower",label:"Floor down"},{id:"Floor higher",label:"Floor up"}],id=>{this.floorOffset+=id==="Floor higher"?5:-5;this.applyPlacement();},6);
    placeUI.buttons([{id:"Turn case left",label:"Turn left"},{id:"Turn case right",label:"Turn right"}],id=>{this.yaw+=(id==="Turn case left"?1:-1)*Math.PI/12;this.applyPlacement();},6);
    placeUI.buttons([{id:"Place case",label:"Place case here"}],()=>this.placeCase(),6);
    this.floorMarker=worldLines(room.getSceneObject(),"RoomscriptFloorCross",[[new vec3(-35,2,-100),new vec3(35,2,-100)],[new vec3(0,2,-65),new vec3(0,2,-135)]],ink,2,vec3.up()).getSceneObject();
    for(const object of graph.room.objects){const anchor=room.objectAnchor(object.id);const bracket=worldLines(anchor,"Fixture bracket "+object.id,[[new vec3(-9,0,5),new vec3(-9,8,5)],[new vec3(-9,8,5),new vec3(-3,8,5)],[new vec3(3,8,5),new vec3(9,8,5)],[new vec3(9,8,5),new vec3(9,0,5)]],ink,.9).getSceneObject();bracket.enabled=false;this.objectBrackets.set(object.id,bracket);this.fixtures.push(bracket);}
    for(const object of graph.room.objects){const node=uiObject(room.objectAnchor(object.id),"RoomscriptNearObject_"+object.id);node.getTransform().setLocalPosition(new vec3(0,19,3));const label=new PanelUI(node,38,12,1.4,new vec4(1,.94,.84,1),true,true);label.text("Object role",object.label.split(/\s+/).slice(0,3).join(" ").toUpperCase(),5,"title");label.text("Pull invitation","PINCH + PULL",4,"small");node.enabled=false;this.objectLabels.push(node);this.fixtures.push(node);}
    for(const zone of graph.room.zones){const node=uiObject(room.zoneAnchor(zone.id),"RoomscriptFarZone_"+zone.id);node.getTransform().setLocalPosition(new vec3(0,16,0));new PanelUI(node,54,8,1.7,new vec4(.247,.89,1,.75),true,true).text("Zone name",zone.clueName.toUpperCase(),6,"title");node.enabled=false;this.zoneLabels.push(node);this.fixtures.push(node);}
    if(this.filmMode||global.deviceInfoSystem.isEditor()){const delay=this.createEvent("DelayedCallbackEvent");delay.bind(()=>{this.setFilmMode(true);this.placeCase();this.removeEvent(delay);});delay.reset(.25);}
  }
  private syncClock():void {const enabled=this.phase==="ready"&&!this.verdict,clock=enabled?this.cast.flow.engine.graphRef().room.objects.find(o=>o.type==="clock"):undefined;this.clue.objection.tells.audio.clock(enabled,enabled?(clock?this.cast.room.objectAnchor(clock.id).getTransform().getWorldPosition():this.crate.getTransform().getWorldPosition()):undefined);}
  private resetForCase():void {this.clue.objection.tells.audio.clock(false);for(const object of [this.panel,this.tab,this.tape,this.beam,this.placement,this.floorMarker,...this.chalk,...this.motes,...this.fixtures])if(object&&!isNull(object))object.destroy();this.chalk=[];this.motes=[];this.fixtures=[];this.objectLabels=[];this.zoneLabels=[];this.objectBrackets.clear();this.trace=[];this.verdict=false;this.phase="boot";this.build();}
  scanStatus(text:string):void {this.clue.objection.tells.audio.clock(false);this.caption.text=text;this.panel.enabled=true;this.tab.enabled=false;this.phase="scan";}
  scanReady(text?:string):void {this.phase="tab";this.caption.text=text||(this.cast.flow.engine.mode()==="preset"?"Recorded scan.\nPull to begin.":"Your room is cast.\nPull to begin.");this.tab.enabled=true;}
  setFilmMode(active:boolean):void {this.filmMode=active;const hidden=["RoomscriptProbeLab","PreviewRoom","InterrogationMark"];
    const visit=(object:SceneObject)=>{if(hidden.includes(object.name)||object.name.startsWith("Standin")||["Study plaque","Lounge plaque","Hall plaque","Kitchen plaque","Conservatory plaque"].includes(object.name))object.enabled=!active;for(let i=0;i<object.getChildrenCount();i++)visit(object.getChild(i));};for(let i=0;i<global.scene.getRootObjectsCount();i++)visit(global.scene.getRootObject(i));}
  private applyPlacement():void {this.floorOffset=Math.max(-80,Math.min(80,this.floorOffset));const root=this.getSceneObject().getParent(),head=this.cast.flow.actor.camera.getTransform().getWorldPosition();root.getTransform().setWorldPosition(new vec3(head.x,this.floorOffset,head.z));root.getTransform().setWorldRotation(quat.fromEulerAngles(0,this.yaw,0));this.placementText.text="Floor height adjusted "+this.floorOffset+" cm.\nAlign the cross with your floor.\nThen place the case.";}
  placeCase():void {if(this.phase!=="placement")return;this.placement.enabled=false;this.floorMarker.enabled=false;this.panel.enabled=true;this.phase="knocks";this.began=getTime();this.step=-1;this.nextBeat=0;this.clue.objection.tells.audio.silence(false);this.beat("placed");}
  private showPlay(value:boolean):void {const flow=this.cast.flow;if(value)flow.restoreControls();else{flow.chips.show(false);flow.verbs.show(false);}flow.subtitles.getSceneObject().enabled=value;this.clue.objection.caseLid.show(value);this.cast.getSceneObject().enabled=value;for(let i=0;i<this.clue.tray.getChildrenCount();i++){const child=this.clue.tray.getChild(i);if(child.name.startsWith("RoomscriptPawn_"))child.enabled=value;}}
  private beat(name:string):void {this.trace.push(name);this.clue.objection.tells.audio.openingBeat(name);this.onBeat.invoke(name);}
  pull():void {if(this.phase!=="tab")return;this.phase="reveal";this.began=getTime();this.step=-1;this.tab.enabled=false;this.crate.restart();this.beam.enabled=true;this.clue.objection.tells.audio.play("TapeZip");this.beat("pull");}
  /** Test setup may skip the pre-show; the opening scenario exercises the real pull. */
  finish():void {if(this.phase==="boot")return;this.cast.flow.engine.investigationEnabled=true;this.cast.flow.engine.configurePose();this.clue.syncSetupPose();this.phase="ready";this.placement.enabled=false;this.floorMarker.enabled=false;this.panel.enabled=false;this.tab.enabled=false;this.tape.enabled=!this.filmMode;this.beam.enabled=false;this.chalk.forEach(o=>o.enabled=true);this.clue.envelope.enabled=true;this.clue.envelope.getTransform().setLocalPosition(this.envelopeHome);this.crate.getTransform().setLocalPosition(this.crateHome);this.crate.restart();this.cast.flow.engine.graphRef().cast.suspects.forEach(s=>this.cast.flow.actorFor(s.id)!.getSceneObject().enabled=true);this.showPlay(true);this.clue.objection.tells.audio.silence(false);this.beat("ready");this.syncClock();}
  private update():void {
    if(getTime()>=this.nextDetail){
      this.nextDetail=getTime()+.2;if(this.filmMode)hideLeafOverlays();const flow=this.cast.flow,camera=flow.actor.camera.getTransform(),eye=camera.getWorldPosition(),rotation=camera.getWorldRotation(),forward=rotation.multiplyVec3(vec3.back());
      const face=flow.actor.getTransform().getWorldPosition().add(new vec3(0,130,0)).sub(eye),facing=face.length>.1&&face.normalize().dot(forward)>.5;
      const conversation=flow.diagnostics().busy||(facing&&(face.length<180||flow.chips.getSceneObject().enabled||flow.verbs.getSceneObject().enabled));
      const explore=this.phase==="ready"&&!this.verdict&&!flow.controlsBlocked&&!conversation;let nearest:SceneObject=null,best=180;
      if(explore)for(const node of this.objectLabels){const delta=node.getTransform().getWorldPosition().sub(eye),distance=delta.length;if(distance<best&&distance>.1&&delta.normalize().dot(forward)>.75){nearest=node;best=distance;}}
      for(const node of this.objectLabels){node.enabled=node===nearest;if(node.enabled)node.getTransform().setWorldRotation(rotation);}
      this.objectBrackets.forEach((bracket,id)=>bracket.enabled=!!nearest&&nearest.name==="RoomscriptNearObject_"+id);
      let far:SceneObject=null,alignment=.85;
      if(explore&&!nearest)for(const node of this.zoneLabels){const delta=node.getTransform().getWorldPosition().sub(eye),dot=delta.length>.1?delta.normalize().dot(forward):-1;if(delta.length>180&&dot>alignment){far=node;alignment=dot;}}
      for(const node of this.zoneLabels){node.enabled=node===far;if(node.enabled)node.getTransform().setWorldRotation(rotation);}
      if(this.phase==="ready"){this.chalk.forEach(object=>object.enabled=!conversation&&!flow.controlsBlocked);this.tape.enabled=!this.filmMode&&!conversation&&!flow.controlsBlocked;}
    }
    if(this.phase==="boot")return;const t=getTime()-this.began,audio=this.clue.objection.tells.audio,room=this.cast.room;
    if(this.phase==="knocks"){
      if(t>=this.nextBeat){const step=++this.step;this.nextBeat=t+.65;const exit=room.toWorld(caseExitPosition(this.cast.flow.engine.graphRef()));if(step<3){audio.playAt("Knock",exit);this.beat("knock");}if(step===3){this.tape.enabled=true;audio.playAt("TapeZip",exit);this.caption.text="Nobody leaves.";this.beat("tape");}if(step>=5){audio.playAt("CrateThud",this.crate.getTransform().getWorldPosition());this.phase="tab";this.tab.enabled=true;this.caption.text="One room. Four suspects.\nPull to open.";this.beat("crate");}}
    }else if(this.phase==="reveal"){
      const step=Math.floor(t);if(step!==this.step){this.step=step;
        if(step===1){audio.playAt("ChalkScratch",room.zoneAnchor("Z1").getTransform().getWorldPosition());this.beat("chalk");}
        if(step===4){this.clue.envelope.enabled=true;audio.play("Shing");this.beat("envelope");}
        if(step===6){audio.play("Ratchet");this.beat("riffle");}
        if(step===8){audio.play("Objection");this.caption.text="SEALED\nTruth waits inside.";this.beat("seal");}
        if(step>=9&&step<=12){const ids=["S2","S1","S3","S4"],id=ids[step-9];this.cast.flow.actorFor(id)!.getSceneObject().enabled=true;audio.play("Chime");this.caption.text=wrapText(this.cast.flow.engine.graphRef().cast.suspects.find(s=>s.id===id)!.name+" arrives.",28);this.beat("arrival:"+id);}
        if(step>=13)this.finish();
      }
      this.chalk.forEach((o,i)=>o.enabled=t>=1+i/this.chalk.length*2.5);
      if(t>=4&&t<6)this.clue.envelope.getTransform().setLocalPosition(this.envelopeHome.add(new vec3(0,0,-20*(1-Math.min(1,(t-4)/2)))));
      if(t>=6&&t<8){const items=this.riffle;this.caption.text="YOUR ROOM IS THE BOARD\n"+items[Math.floor((t-6)*9)%items.length];}
    }

  }
  diagnostics():{phase:string;trace:string[];chalk:number} {return {phase:this.phase,trace:this.trace.slice(),chalk:this.chalk.filter(o=>o.enabled).length};}
}
