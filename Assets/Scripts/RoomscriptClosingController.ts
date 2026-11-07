import {RoomscriptCaseBoard} from "./RoomscriptCaseBoard";
import {ghostArt,ghostRect,GHOST_TINT,hasFrame,GhostArt} from "./RoomscriptGhostArt";
import {chalkSpot} from "./Content/ChalkSpots";
import {ArtFrame} from "./Content/ActorArt";
import {reconstructionDetails,ReconstructionDetails} from "./Engine/game/ReconstructionDetails";
import {RoomscriptClueController} from "./RoomscriptClueController";
import {RoomscriptCastController} from "./RoomscriptCastController";
import {PanelUI,uiObject,wrapText} from "./RoomscriptPanelUI";
import {worldLines} from "./RoomscriptWorldLines";
import {lineTubes,circleEdges,flatText,tinted} from "./RoomscriptLineArt";
import {glyphButton,glyphTexture} from "./RoomscriptGlyphUI";
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import {HandInputData} from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandInputData";
import {Hypothesis,GameState,CaseGraph} from "./Engine/core/Types";
import {availableArguments,reconstructionBeats,ReconstructionBeat} from "./Engine/game/Closing";
import {endingSummary,CitedSentence} from "./Engine/game/CaseClarity";
import {scoreCase} from "./Engine/game/Scoring";
import {caseExitPosition} from "./Engine/game/RoomPresentation";
import {routeReplay,RouteReplay} from "./Engine/game/RouteReplay";
import {isHarlowPreset} from "./Engine/game/NarrativeAudio";
import {RoomscriptNewspaper} from "./RoomscriptNewspaper";
import {frozenTableau} from "./Engine/game/FrozenTableau";
import {propDrawing} from "./RoomscriptPropArt";

/** Room and weapon open unset ("?") so the rig never shows the answer (Run 8 review bug 1). */
const UNSET="";
const RIG_CONTROLS=["Accused suspect","Accused room","Accused weapon","File deductions","Cancel accusation","Break seal"];
/** Accusation UI submits the chosen cards; all reveal and rating data comes from the engine. */
@component export class RoomscriptClosingController extends BaseScriptComponent {
  @input @hint("Suggestion selection and shared presentation") clue:RoomscriptClueController;
  @input @hint("Persistent visible cast") cast:RoomscriptCastController;
  private panel:SceneObject;private title:Text;private body:Text;private labels:Text[];private controls:SceneObject;
  private picked:Hypothesis;private opened=false;private heldAt=-1;private phase="idle";private began=0;private frame=-1;
  private frames:ReconstructionBeat[]=[];private summary:CitedSentence[]=[];private ghostMaterials=new Map<string,Material>();private holdUntil=0;private escapeActor:SceneObject;private escapeDoor:vec3;private sealLabel:Text;private ghosts=new Map<string,SceneObject>();private ghostScreens=new Map<string,ScreenTransform>();private ghostFrames=new Map<string,ArtFrame>();private exits:{actor:SceneObject;from:vec3;to:vec3;start:number;duration:number}[]=[];private resultText="";
  private escapeStart:vec3|null=null;private beam:SceneObject;private spot:SceneObject;private sealRing:SceneObject;private newspaper:RoomscriptNewspaper;private heldTime=0;
  private result:SceneObject;
  private details:SceneObject;private routeRoot:SceneObject;private route:RouteReplay;private routeText="";private sealedState:GameState;private sealedGraph:CaseGraph;
  private detailRender:(()=>void)|null=null;
  private dial:SceneObject;private dialHour:SceneObject;private dialMinute:SceneObject;private dialLabel:Text;private dialTime="";private dialFrom=[0,0];private dialTo=[0,0];private dialStarted=0;
  private claimSlips:{root:SceneObject;home:vec3;material:Material;ashes:SceneObject[]}[]=[];private burnProgress=0;private correctionOffset=0;private ledgerRows=0;
  private imageTemplate=requireAsset("../RoomscriptProbeImage.mat") as Material;
  private stampTexture=requireAsset("../Art/Run7/VerdictStamp.png") as Texture;
  private victimStanding=requireAsset("../Art/Actors/Harlow/Harlow-standing.png") as Texture;
  private victimFalling=requireAsset("../Art/Actors/Harlow/Harlow-falling.png") as Texture;
  private art:Record<string,{claim:Texture;truth:Texture;neutral:Texture}>={
    S1:{claim:requireAsset("../Art/Actors/Qadir/Qadir-neutral.png") as Texture,truth:requireAsset("../Art/Actors/Qadir/Qadir-neutral.png") as Texture,neutral:requireAsset("../Art/Actors/Qadir/Qadir-neutral.png") as Texture},
    S2:{claim:requireAsset("../Art/Actors/Vale/Vale-neutral.png") as Texture,truth:requireAsset("../Art/Actors/Vale/Vale-neutral.png") as Texture,neutral:requireAsset("../Art/Actors/Vale/Vale-neutral.png") as Texture},
    S3:{claim:requireAsset("../Art/Actors/Okafor/Okafor-neutral.png") as Texture,truth:requireAsset("../Art/Actors/Okafor/Okafor-neutral.png") as Texture,neutral:requireAsset("../Art/Actors/Okafor/Okafor-neutral.png") as Texture},
    S4:{claim:requireAsset("../Art/Actors/Pike/Pike-neutral.png") as Texture,truth:requireAsset("../Art/Actors/Pike/Pike-neutral.png") as Texture,neutral:requireAsset("../Art/Actors/Pike/Pike-neutral.png") as Texture}
  };
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.build());this.createEvent("UpdateEvent").bind(()=>this.update());}
  private build():void {
    if(this.panel)return;const flow=this.cast.flow;flow.engine.initialize();this.cast.room.initialize();const graph=flow.engine.graphRef();this.picked={who:graph.cast.suspects[0].id,where:UNSET,what:UNSET};
    this.buildRig();
    this.clue.objection.tells.audio.onNarrationSubtitle.add(({speaker,text})=>{if(this.phase==="reconstruction"&&this.frames[this.frame]?.kind==="resume"&&speaker==="NARRATOR")this.body.text=wrapText(text,40);});
    flow.engine.onState.add(state=>this.onState(state));flow.engine.onCaseChanged.add(()=>this.resetForCase());this.clue.objection.caseLid.onAction.add(action=>{if(action==="Accuse")this.open();});this.panel.enabled=false;
  }
  /** Run 8 accusation rig (WEARER_UX object UI 6): point at a suspect (spotlight), set room and weapon, hold the wax seal.
   * Interactable names are unchanged for LEAF: Accused suspect/room/weapon, File deductions, Break seal, Cancel accusation. */
  private buildRig():void {
    const flow=this.cast.flow,line=this.clue.objection.tells.lightMaterial;
    this.panel=uiObject(this.getSceneObject(),"RoomscriptClosingPanel");this.panel.createComponent("Component.Canvas");
    this.title=flatText(this.panel,"Closing title","FINAL ACCUSATION",3.4,new vec4(1,.94,.84,1),"title",50,4.5);this.title.getSceneObject().getTransform().setLocalPosition(new vec3(0,15,0));
    this.body=flatText(this.panel,"Closing summary","",1.9,new vec4(1,.94,.84,.9),"body",56,3);this.body.getSceneObject().getTransform().setLocalPosition(new vec3(0,10.5,0));
    const cycle=(id:string)=>{if(this.phase!=="idle")return;const current=flow.engine.graphRef(),key=id==="Accused suspect"?"who":id==="Accused room"?"where":"what",list=key==="who"?current.cast.suspects.map(s=>s.id):key==="where"?current.room.zones.map(z=>z.id):current.weapons;this.picked[key]=list[(list.indexOf(this.picked[key])+1)%list.length];this.render();this.clue.objection.tells.audio.play("ToastTick");};
    const specs:[string,string,vec4][]=[["Accused suspect","name",new vec4(1,.94,.84,1)],["Accused room","where",new vec4(.247,.89,1,1)],["Accused weapon","lie",new vec4(1,.42,.35,1)]];
    this.labels=specs.map(([id,icon,ink],i)=>{const token=glyphButton(this.panel,id,15,5,()=>cycle(id),ink);token.set(glyphTexture(icon as any),"");token.root.getTransform().setLocalPosition(new vec3((i-1)*16.5,4,.6));return token.word;});
    const file=glyphButton(this.panel,"File deductions",15,4.4,()=>{if(this.phase!=="idle")return;for(const claim of availableArguments(flow.engine.graphRef(),flow.engine.snapshot()))flow.engine.dispatch({type:"ArgumentClaim",...claim});this.render();},new vec4(.91,.69,.29,1));
    file.set(glyphTexture("noted"),"File proof");file.root.getTransform().setLocalPosition(new vec3(-16.5,-4,.6));
    const cancel=glyphButton(this.panel,"Cancel accusation",15,4.4,()=>{if(this.phase==="idle"&&flow.engine.snapshot().verdict!=="timeout")this.close();});cancel.set(glyphTexture("ask"),"Not yet");cancel.root.getTransform().setLocalPosition(new vec3(16.5,-4,.6));
    // The wax seal: press your thumb in and hold.
    const seal=uiObject(this.panel,"Break seal");seal.getTransform().setLocalPosition(new vec3(0,-6,1));
    lineTubes(seal,"Seal rim",circleEdges(4.6,32,vec3.zero()).concat(circleEdges(3.2,28,vec3.zero())),tinted(line,new vec4(1,.42,.35,1)),.45);
    this.sealLabel=flatText(seal,"Seal word","HOLD",1.9,new vec4(1,.42,.35,1),"title",8,2.6);
    this.sealRing=lineTubes(seal,"Seal progress",circleEdges(5.6,40,new vec3(0,0,.3)),tinted(line,new vec4(1,.84,.04,1)),.55).getSceneObject();this.sealRing.enabled=false;
    const shape=Shape.createBoxShape();shape.size=new vec3(11,11,3);const collider=seal.createComponent("Physics.ColliderComponent") as ColliderComponent;collider.shape=shape;
    const press=seal.createComponent(Interactable.getTypeName()) as Interactable;press.targetingMode=3;
    press.onTriggerStart.add(()=>{if(this.phase==="idle"&&this.complete()){this.heldAt=getTime();this.heldTime=0;}});
    // Native audio can block a frame for ~1 s, so the seal sound plays only once the hold succeeds.
    press.onTriggerEnd.add(()=>{const held=this.heldAt>=0&&getTime()-this.heldAt>=1&&this.heldTime>=12;this.heldAt=-1;this.sealRing.enabled=false;this.sealLabel.text=this.sealPrompt();if(held&&this.complete()){this.clue.objection.tells.audio.play("WaxSealPress");this.accuse();}else if(held)this.clue.objection.tells.audio.play("ToastTick");});
    press.onTriggerCanceled.add(()=>{this.heldAt=-1;this.sealRing.enabled=false;this.sealLabel.text=this.sealPrompt();});
    // Spotlight beam from your hand to the suspect you point at.
    // Thin unit-length beam along +z (scaled to length each frame) and a spotlight ring at the accused feet.
    this.beam=lineTubes(this.getSceneObject(),"Accusation spotlight",[[new vec3(-.25,0,0),new vec3(-.25,0,1)],[new vec3(.25,0,0),new vec3(.25,0,1)]],tinted(line,new vec4(1,.84,.55,1)),.3).getSceneObject();this.beam.enabled=false;
    this.spot=lineTubes(this.getSceneObject(),"Accusation floor spot",[...circleEdges(42,40,new vec3(0,1.5,0),"xz"),...circleEdges(36,36,new vec3(0,1.5,0),"xz")],tinted(line,new vec4(1,.84,.55,1)),1).getSceneObject();this.spot.enabled=false;
    this.panel.enabled=false;
  }
  /** heldTime counts rendered frames while the seal is pressed: a hold is >=1 s and >=12 frames, so a tap that spans a native-audio stall never seals. */
  /** Place the rig at waist height in front of the player when the accusation opens (world-locked). */
  private placeRig():void {const camera=this.cast.flow.actor.camera.getTransform(),eye=camera.getWorldPosition();let forward=camera.getWorldRotation().multiplyVec3(vec3.back());forward.y=0;forward=forward.length>.01?forward.normalize():vec3.back();
    const at=eye.add(forward.uniformScale(78)).add(new vec3(0,-50,0)),toward=eye.sub(at).normalize();this.panel.getTransform().setWorldPosition(at);this.panel.getTransform().setWorldRotation(quat.lookAt(toward,vec3.up()));this.panel.getTransform().setWorldScale(vec3.one().uniformScale(.62));}
  /** Right index fingertip when hands are tracked (Specs); null in Preview, where the beam starts at the rig. */
  private pointingTip():vec3|null {try{const right=HandInputData.getInstance().getHand("right");if(right&&right.isTracked())return right.indexTip.position;}catch{}return null;}
  private updateSpotlight():void {
    const show=this.opened&&this.phase==="idle"&&this.panel.enabled;this.beam.enabled=show;this.spot.enabled=show;if(!show)return;
    const actor=this.cast.flow.actorFor(this.picked.who);if(!actor)return;const camera=this.cast.flow.actor.camera.getTransform();
    const hand=this.pointingTip(),from=hand||this.panel.getTransform().getWorldPosition().add(new vec3(0,8,0)),feet=actor.getTransform().getWorldPosition(),to=feet.add(new vec3(0,actor.heights().spotlight,0)),dir=to.sub(from);this.spot.getTransform().setWorldPosition(feet);
    const t=this.beam.getTransform();t.setWorldPosition(from);t.setWorldRotation(quat.lookAt(dir.normalize(),vec3.up()));t.setWorldScale(new vec3(1,1,Math.max(1,dir.length)));void camera;
    if(this.heldAt>=0){this.heldTime++;const k=Math.min(1,getTime()-this.heldAt);this.sealRing.enabled=true;this.sealRing.getTransform().setLocalScale(vec3.one().uniformScale(.6+.4*k));}
  }
  resetForCase():void {
    if(!this.panel)return;this.clearReconstructionDetails();this.cast.room.initialize();this.cast.flow.cancel();const graph=this.cast.flow.engine.graphRef();
    this.holdKind="";this.holdSeconds=0;this.opened=false;this.heldAt=-1;this.phase="idle";this.began=0;this.frame=-1;this.frames=[];this.summary=[];this.holdUntil=0;this.escapeStart=null;this.resultText="";this.routeText="";this.route=null;this.sealedState=null;this.sealedGraph=null;
    for(const ghost of this.ghosts.values())if(!isNull(ghost))ghost.destroy();this.ghosts.clear();this.ghostMaterials.clear();
    if(this.result&&!isNull(this.result))this.result.destroy();this.result=null;
    if(this.details&&!isNull(this.details))this.details.destroy();this.details=null;this.detailRender=null;if(this.routeRoot&&!isNull(this.routeRoot))this.routeRoot.destroy();this.routeRoot=null;
    this.picked={who:graph.cast.suspects[0].id,where:UNSET,what:UNSET};
    const restore=(root:SceneObject)=>{for(let i=0;i<root.getChildrenCount();i++){const child=root.getChild(i);if(RIG_CONTROLS.includes(child.name))child.enabled=true;else restore(child);}};restore(this.panel);
    this.sealLabel.text=this.sealPrompt();this.panel.enabled=false;this.clue.envelope.enabled=true;this.clue.objection.tells.audio.silence(false);this.showInvestigation(true);this.render();
  }
  open():void {const state=this.cast.flow.engine.snapshot();if(state.verdict&&state.verdict!=="timeout")return;this.cast.flow.cancel();this.clue.objection.close();this.picked=this.clue.selected()||{...this.picked,who:this.cast.flow.diagnostics().suspect||this.picked.who};this.opened=true;this.placeRig();this.panel.enabled=true;this.showInvestigation(false);this.render();this.clue.objection.tells.audio.beforeSeal();this.clue.objection.tells.audio.play("SpotlightOn");}
  private showInvestigation(value:boolean):void {this.cast.flow.controlsBlocked=!value;const flow=this.cast.flow,targeting=!value&&this.opened&&this.phase==="idle";
    flow.subtitles.getSceneObject().enabled=value;if(value)flow.restoreControls();else{flow.chips.show(false);flow.verbs.show(false);}
    this.clue.showPawns(value);this.clue.objection.caseLid.show(value);this.cast.getSceneObject().enabled=value||targeting;this.cast.setAccusationTargeting(targeting?id=>this.pointSuspect(id):null);this.clue.objection.wallet.show(false);this.clue.notebook.show(false);
  }
  private pointSuspect(id:string):void {if(!this.opened||this.phase!=="idle"||!this.cast.flow.engine.graphRef().cast.suspects.some(s=>s.id===id))return;this.picked.who=id;this.render();this.clue.objection.tells.audio.play("ToastTick");}
  private close():void {this.heldAt=-1;this.opened=false;this.panel.enabled=false;this.showInvestigation(true);}
  private render():void {
    const graph=this.cast.flow.engine.graphRef(),state=this.cast.flow.engine.snapshot();
    this.title.text=state.verdict==="timeout"?"TIME IS UP — ONE ACCUSATION":"FINAL ACCUSATION";
    this.labels[0].text=graph.cast.suspects.find(s=>s.id===this.picked.who)!.name.split(" ").slice(-1)[0];this.labels[1].text=graph.room.zones.find(z=>z.id===this.picked.where)?.clueName||"?";this.labels[2].text=graph.room.objects.find(o=>o.id===this.picked.what)?.label.split(/\s+/).slice(-1)[0]||"?";if(this.heldAt<0)this.sealLabel.text=this.sealPrompt();
    this.body.text=state.arguments.length+" / "+graph.requiredDeductions.length+" proof filed · point · hold the seal";
  }
  private onState(state:GameState):void {
    if(state.verdict==="timeout"&&!this.opened)this.open();
    if((state.verdict==="correct"||state.verdict==="wrong")&&this.phase==="idle")this.beginReveal(state);
  }
  /** All three chosen? The seal only commits a complete accusation. */
  private complete():boolean {return !!this.picked.who&&!!this.picked.where&&!!this.picked.what;}
  private sealPrompt():string {return !this.picked.where?"ROOM ?":!this.picked.what?"WEAPON ?":"HOLD";}
  private accuse():void {if(!this.opened||this.phase!=="idle"||!this.complete())return;this.cast.flow.cancel();this.cast.flow.engine.dispatch({type:"Accuse",...this.picked});}
  private beginReveal(state:GameState):void {
    if(state.verdict!=="correct"&&state.verdict!=="wrong")return;
    const graph=this.cast.flow.engine.graphRef();this.sealedState=state;this.sealedGraph=graph;this.opened=true;this.phase="reconstruction";this.showInvestigation(false);this.panel.enabled=true;this.began=getTime();this.frames=reconstructionBeats(graph,state);this.summary=endingSummary(graph,state);this.clue.envelope.enabled=false;this.clue.objection.tells.audio.silence(false);
    const score=scoreCase(graph,state);this.resultText=(state.verdict==="correct"?"CASE CLOSED":"THE CULPRIT ESCAPED")+"\nHolmes rating: "+score.rating+" / 3\n"+score.stars.map(star=>(star.earned?"★ ":"☆ ")+star.name).join("\n")+"\n"+score.deductions+" / "+score.required+" deductions\n"+"You: "+state.elapsedMinutes+" min · Par: "+score.minimumMinutes+"\n"+graph.caseId+"\nSeal "+graph.pitchHash;
    const hideRows=(root:SceneObject)=>{for(let i=0;i<root.getChildrenCount();i++){const child=root.getChild(i);if(RIG_CONTROLS.includes(child.name))child.enabled=false;else hideRows(child);}};hideRows(this.panel);
    if(state.verdict==="wrong"){this.escapeActor=this.cast.flow.actorFor(graph.envelope.who)!.getSceneObject();this.escapeStart=this.escapeActor.getTransform().getWorldPosition();this.escapeDoor=this.cast.room.toWorld(caseExitPosition(graph));this.escapeDoor.y=this.escapeStart.y;}
    for(const person of [...graph.cast.suspects,graph.cast.victim]){const ghost=uiObject(this.cast.room.getSceneObject(),"RoomscriptReconstruction_"+person.id);ghost.createComponent("Component.Canvas");const illustrated=!!ghostArt(person.id,"neutral");ghost.getTransform().setLocalScale(vec3.one().uniformScale(illustrated?1:.75));const texture=person.id===graph.cast.victim.id?this.victimStanding:this.art[person.id].neutral;this.ghostMaterials.set(person.id,this.image(ghost,"Memory engraving",texture,85,170,true));this.ghostScreens.set(person.id,ghost.getChild(0).getComponent("Component.ScreenTransform") as ScreenTransform);this.ghosts.set(person.id,ghost);ghost.enabled=false;}
    this.route=routeReplay(state);this.buildRoute(graph);this.buildReconstructionDetails();
  }
  private clearReconstructionDetails():void {this.showTableau(false);
    if(this.dial&&!isNull(this.dial))this.dial.destroy();this.dial=null;this.dialTime="";this.ledgerRows=0;this.burnProgress=0;
    for(const slip of this.claimSlips){if(!isNull(slip.root))slip.root.destroy();for(const ash of slip.ashes)if(!isNull(ash))ash.destroy();}this.claimSlips=[];
  }
  private buildReconstructionDetails():void {
    this.clearReconstructionDetails();const graph=this.sealedGraph,state=this.sealedState,detail=reconstructionDetails(graph,state,"claims");if(!detail)return;
    const material=this.clue.objection.tells.lightMaterial.clone();material.mainPass.baseColor=new vec4(1,.84,.04,1);
    this.dial=uiObject(this.panel,"RoomscriptReconstructionDial");this.dial.getTransform().setLocalPosition(new vec3(0,-14,3));
    const segments:[vec3,vec3][]=[];for(let i=0;i<48;i++){const a=i*Math.PI*2/48,b=(i+1)*Math.PI*2/48;segments.push([new vec3(7*Math.sin(a),7*Math.cos(a),0),new vec3(7*Math.sin(b),7*Math.cos(b),0)]);}
    for(let i=0;i<12;i++){const a=i*Math.PI/6,r=i%3?6.2:5.7;segments.push([new vec3(r*Math.sin(a),r*Math.cos(a),0),new vec3(7*Math.sin(a),7*Math.cos(a),0)]);}worldLines(this.dial,"Time rim",segments,material,.25);
    this.dialHour=uiObject(this.dial,"Hour hand");this.dialMinute=uiObject(this.dial,"Minute hand");worldLines(this.dialHour,"Hour",[[vec3.zero(),new vec3(0,3.7,0)]],material,.6);worldLines(this.dialMinute,"Minute",[[vec3.zero(),new vec3(0,5.5,0)]],material,.3);
    const label=uiObject(this.dial,"Dial time");label.getTransform().setLocalPosition(new vec3(0,-10,1));this.dialLabel=new PanelUI(label,28,5,.9,new vec4(1,.94,.84,1),false,true).text("Exact case time","",4,"small");this.dial.enabled=false;
    for(const entry of detail.slips){const root=uiObject(this.cast.room.getSceneObject(),"RoomscriptRejectedClaim_"+entry.suspect),home=new vec3(...entry.position);root.getTransform().setLocalPosition(home);root.getTransform().setWorldRotation(this.cast.flow.actor.camera.getTransform().getWorldRotation());
      const ink=this.clue.objection.tells.lightMaterial.clone();ink.mainPass.baseColor=new vec4(.247,.89,1,.9);worldLines(root,"Claim paper",[[new vec3(-12,-7,0),new vec3(12,-7,0)],[new vec3(12,-7,0),new vec3(12,7,0)],[new vec3(12,7,0),new vec3(-12,7,0)],[new vec3(-12,7,0),new vec3(-12,-7,0)],[new vec3(-9,-3,0),new vec3(9,-3,0)]],ink,.45);
      new PanelUI(root,23,12,.65,new vec4(.247,.89,1,1),false,true).text("Claim role",entry.label,10,"small");root.enabled=false;
      const ashes:SceneObject[]=[];for(let i=0;i<5;i++){const ash=uiObject(this.cast.room.getSceneObject(),"RoomscriptClaimAsh_"+entry.suspect+"_"+i);worldLines(ash,"Paper fragment",[[new vec3(-.6,0,0),new vec3(.6,0,0)]],ink,.6);ash.enabled=false;ashes.push(ash);}this.claimSlips.push({root,home,material:ink,ashes});
    }
    const index=this.frames.findIndex(b=>b.kind==="correction");this.correctionOffset=this.frames.slice(0,index).reduce((total,b)=>total+b.durationSeconds,0);
  }
  /** Run 8 wow 5: at the freeze beat, the frozenTableau() extras: suspended objects hang in the air and the
   * culprit's ghost holds the weapon. Revealed only by the engine's reconstruction (after a verdict). */
  private holdKind="";private holdSeconds=0;
  /** Director/film capture: pause the reconstruction when a beat of this kind begins (e.g. the 22:30 freeze for the orbit shot). */
  holdAtBeat(kind:string,seconds:number):void {this.holdKind=kind;this.holdSeconds=seconds;}
  private tableau:SceneObject|null=null;private tableauSpin:SceneObject[]=[];private tableauHidden:RenderMeshVisual[]=[];
  /** While the freeze is up, the resting copy of a suspended or held object is hidden so it is not drawn twice. */
  private hideResting(id:string):void {let anchor:SceneObject;try{anchor=this.cast.room.objectAnchor(id);}catch{return;}
    const visit=(o:SceneObject)=>{for(const v of o.getComponents("Component.RenderMeshVisual") as RenderMeshVisual[])if(v.enabled){v.enabled=false;this.tableauHidden.push(v);}for(let i=0;i<o.getChildrenCount();i++)visit(o.getChild(i));};visit(anchor);}
  private showTableau(active:boolean):void {
    if(this.tableau&&!isNull(this.tableau))this.tableau.destroy();this.tableau=null;this.tableauSpin=[];for(const v of this.tableauHidden)if(!isNull(v))v.enabled=true;this.tableauHidden=[];if(!active||!this.sealedGraph||!this.sealedState)return;
    const t=frozenTableau(this.sealedGraph,this.sealedState);if(!t)return;const room=this.cast.room,root=global.scene.createSceneObject("RoomscriptFrozenTableau");root.setParent(room.getSceneObject());this.tableau=root;
    for(const item of t.suspended){const holder=global.scene.createSceneObject("Suspended "+item.object);holder.setParent(root);holder.getTransform().setLocalPosition(new vec3(item.position[0],item.position[1],item.position[2]));this.hideResting(item.object);
      const object=this.sealedGraph.room.objects.find(o=>o.id===item.object);if(object)propDrawing(holder,item.object,object.type,false);
      lineTubes(holder,"Suspension rings",[...circleEdges(9,24,new vec3(0,-3,0),"xz"),...circleEdges(13,24,new vec3(0,-6,0),"xz")],tinted(this.clue.objection.tells.lightMaterial,new vec4(1,.84,.04,.7)),.25);this.tableauSpin.push(holder);}
    for(const figure of t.figures){if(!figure.holding)continue;const object=this.sealedGraph.room.objects.find(o=>o.id===figure.holding);if(!object)continue;
      this.hideResting(object.id);if(figure.suspect===this.sealedGraph.envelope.who&&this.ghostFrames.get(figure.suspect)==="tableau")continue; // the cable is drawn in her hands
      const ghost=this.ghosts.get(figure.suspect),at=ghost?ghost.getTransform().getLocalPosition():new vec3(figure.position[0],0,figure.position[2]),hand=ghostArt(figure.suspect,"tell")?.hand;
      const holder=global.scene.createSceneObject("Held weapon");holder.setParent(root);holder.getTransform().setLocalPosition(at.add(new vec3(hand?hand.x*.4:0,hand?hand.y:82,14)));propDrawing(holder,object.id,object.type,true);}
    this.clue.objection.tells.audio.playAt("GhostWhoosh",room.toWorld(t.suspended[0]?.position||[0,100,-300]));console.log("FROZEN_TABLEAU|"+JSON.stringify({slot:t.slot,zone:t.zone,suspended:t.suspended.map(x=>x.object),held:t.figures.filter(f=>f.holding).map(f=>f.holding)}));
  }
  /** Run 9 (ART_2D): which illustrated frame each ghost shows. The culprit's tableau frame (holding the cable)
   * appears only at the freeze, after a verdict; Harlow staggers at the freeze and lies fallen after it. */
  private ghostFrame(id:string,kind:ReconstructionBeat["kind"],graph:CaseGraph):GhostArt|null {
    if(id===graph.cast.victim.id)return ghostArt("V",kind==="freeze"?"staggering":kind==="resume"?"fallen":"standing");
    if(kind==="freeze"&&id===graph.envelope.who)return ghostArt(id,this.tableauFrame(graph)?"tableau":"tell");
    return ghostArt(id,kind==="resume"&&id===graph.envelope.who?"broken":"neutral");
  }
  /** The drawn cable in the tableau frame stands in for the weapon only when the weapon is a cord. */
  private tableauFrame(graph:CaseGraph):boolean {const weapon=graph.room.objects.find(o=>o.id===graph.envelope.what);return !!weapon&&weapon.type==="cord"&&hasFrame(graph.envelope.who,"tableau");}
  /** Presentation only: ghosts stand on the measured free floor of the zone they are in (never inside furniture),
   * spread so they don't overlap; at the freeze the culprit stands beside the victim. Engine positions pick the zone. */
  private presentationMarks(beat:ReconstructionBeat,graph:CaseGraph):Map<string,vec3> {
    const raw=new Map<string,[number,number,number]>();
    for(const id of this.ghosts.keys()){let mark=beat.positions?.[id] as [number,number,number]|undefined;
      if(beat.kind==="claims"){const claim=beat.claims?.find(c=>c.suspect===id),zone=graph.room.zones.find(z=>z.id===claim?.zone);mark=zone?[zone.anchor[0],0,zone.anchor[2]+55]:undefined;}
      if(mark)raw.set(id,mark);}
    const mode=this.cast.flow.engine.mode(),groups=new Map<string,string[]>();
    const nearest=(m:[number,number,number])=>{let best=graph.room.zones[0],d=1e9;for(const z of graph.room.zones){const e=Math.hypot(z.anchor[0]-m[0],z.anchor[2]-m[2]);if(e<d){d=e;best=z;}}return best.id;};
    for(const [id,m] of raw){const zone=nearest(m);if(!groups.has(zone))groups.set(zone,[]);groups.get(zone)!.push(id);}
    const out=new Map<string,vec3>(),spread:[number,number][]=[[0,0],[-70,-8],[70,-8],[-130,-20],[130,-20]]; // sideways and slightly back, never toward the viewer
    for(const [zone,ids] of groups){const chalk=chalkSpot(graph,zone,mode),ring=chalk.radius>40,spot=ring?[chalk.center[0]+chalk.radius+12,0,chalk.center[2]]:chalk.center, // a ring around furniture (the Kitchen table): stand on its side edge
      victim=graph.cast.victim.id,culprit=graph.envelope.who;
      ids.sort((a,b)=>(a===victim?-2:a===culprit?-1:0)-(b===victim?-2:b===culprit?-1:0)||a.localeCompare(b));
      const freeze=beat.kind==="freeze"&&ids.includes(victim);
      ids.forEach((id,i)=>{const o=freeze&&id===culprit?[-48,4]:spread[Math.min(i+(freeze&&i>1?1:0),spread.length-1)];out.set(id,new vec3(spot[0]+o[0],0,spot[2]+o[1]));});}
    return out;
  }
  private showReconstructionDetail(kind:ReconstructionBeat["kind"]):void {
    this.showTableau(kind==="freeze");
    const detail=reconstructionDetails(this.sealedGraph,this.sealedState,kind);if(!detail)return;
    this.dial.enabled=!!detail.time;this.dialTime=detail.time||"";this.dialLabel.text=this.dialTime;
    if(detail.time){this.dialFrom=this.dialTo.slice();this.dialTo=[detail.hourRadians,detail.minuteRadians];this.dialStarted=getTime();}
    for(const slip of this.claimSlips){slip.root.enabled=kind==="claims"||kind==="correction";slip.root.getTransform().setLocalPosition(slip.home);slip.root.getTransform().setLocalScale(vec3.one());slip.material.mainPass.baseColor=new vec4(.247,.89,1,.9);slip.ashes.forEach(ash=>ash.enabled=false);}
    this.ledgerRows=detail.ledger.length;
    if(kind==="ledger"){this.title.text="YOUR DEDUCTIONS";this.body.text=detail.ledger.map(row=>(row.filed?"✓ ":"○ ")+row.label+(row.filed?"":" — unfiled")).join("\n");}
  }
  private animateReconstructionDetails():void {
    if(this.dial?.enabled){const t=Math.min(1,Math.max(0,(getTime()-this.dialStarted)/.8));this.dialHour.getTransform().setLocalRotation(quat.angleAxis(-(this.dialFrom[0]+(this.dialTo[0]-this.dialFrom[0])*t),vec3.forward()));this.dialMinute.getTransform().setLocalRotation(quat.angleAxis(-(this.dialFrom[1]+(this.dialTo[1]-this.dialFrom[1])*t),vec3.forward()));}
    if(this.frames[this.frame]?.kind!=="correction")return;
    const p=Math.max(0,Math.min(1,(getTime()-this.began-this.correctionOffset)/2.2));this.burnProgress=p;
    this.claimSlips.forEach((slip,index)=>{slip.root.enabled=p<1;slip.root.getTransform().setLocalScale(new vec3(1,Math.max(.01,1-p),1));slip.root.getTransform().setLocalPosition(slip.home.add(new vec3(0,p*12,0)));slip.material.mainPass.baseColor=new vec4(1,.42,.35,Math.max(.08,1-p));
      slip.ashes.forEach((ash,i)=>{ash.enabled=p>0&&p<1;ash.getTransform().setLocalPosition(slip.home.add(new vec3((i-2)*3+p*(index%2?10:-10),7+p*(15+i*3),p*6)));ash.getTransform().setLocalRotation(quat.angleAxis(p*(i+1),vec3.forward()));});});
  }
  /** Director/LEAF capture hook; changes presentation time only after the seal. */
  captureReconstructionDetail(kind:"correction"|"ledger",seconds=12):boolean {
    if(this.phase!=="reconstruction"||!this.sealedState||!["correct","wrong"].includes(this.sealedState.verdict))return false;
    const index=this.frames.findIndex(b=>b.kind===kind);if(index<0)return false;this.holdUntil=0;this.began=getTime()-this.frames.slice(0,index).reduce((n,b)=>n+b.durationSeconds,0)-(kind==="correction"?.9:.1);this.frame=-1;this.update();this.animateReconstructionDetails();this.holdUntil=getTime()+Math.min(20,Math.max(0,seconds));return true;
  }
  reconstructionDetailDiagnostics():{kind:string;time:string;slips:number;burn:number;ledgerRows:number}{return {kind:this.frames[this.frame]?.kind||"",time:this.dialTime,slips:this.claimSlips.filter(s=>s.root.enabled).length,burn:this.burnProgress,ledgerRows:this.ledgerRows};}
  private image(parent:SceneObject,name:string,texture:Texture,width:number,height:number,bottom=false):Material {
    const root=uiObject(parent,name),screen=root.createComponent("Component.ScreenTransform") as ScreenTransform;screen.anchors=Rect.create(0,0,0,0);screen.offsets=Rect.create(-width/2,width/2,bottom?0:-height/2,bottom?height:height/2);
    const visual=root.createComponent("Component.Image") as Image,material=this.imageTemplate.clone();material.mainPass.baseTex=texture;material.mainPass.baseColor=new vec4(1,1,1,1);material.mainPass.depthTest=true;material.mainPass.depthWrite=false;material.mainPass.twoSided=true;visual.clearMaterials();visual.addMaterial(material);return material;
  }
  private buildRoute(graph:CaseGraph):void {
    this.routeRoot=uiObject(this.cast.room.getSceneObject(),"RoomscriptPlayerRoute");this.routeRoot.getTransform().setLocalPosition(new vec3(0,1.5,0));const segments:[vec3,vec3][]=[];
    for(const path of this.route.segments)for(let i=1;i<path.length;i++)segments.push([new vec3(path[i-1][0],0,path[i-1][2]),new vec3(path[i][0],0,path[i][2])]);
    if(segments.length){const material=this.clue.objection.tells.lightMaterial.clone();material.mainPass.baseColor=new vec4(.247,.89,1,.24);const stride=Math.max(1,Math.ceil(segments.length/2000));worldLines(this.routeRoot,"Your recorded footsteps",segments.filter((_,i)=>i%stride===0),material,1.1,vec3.up());}
    const repeated=Object.entries(this.route.inspections).filter(([,count])=>count>=2).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0];
    const label=repeated?graph.room.objects.find(o=>o.id===repeated[0])?.label:undefined;
    this.routeText=this.route.points.length?this.route.text:"No walking samples recorded.";
    if(repeated&&label)this.routeText+=" You checked the "+label+(repeated[1]===2?" twice.":" "+repeated[1]+" times.");
    else if(Object.keys(this.route.inspections).length)this.routeText+=" "+Object.keys(this.route.inspections).length+" objects checked.";
    this.routeRoot.enabled=false;
  }
  /** Director-only capture hold; never changes engine time or verdict. */
  holdFreeze(seconds=20):void {if(this.frames[this.frame]?.kind==="freeze")this.holdUntil=getTime()+Math.min(20,Math.max(0,seconds));}
  private update():void {if(this.beam)this.updateSpotlight();for(const spin of this.tableauSpin)if(!isNull(spin))spin.getTransform().setLocalRotation(quat.fromEulerAngles(.25,getTime()*.4,.15));
    if(this.heldAt>=0&&this.phase==="idle"&&this.complete())this.sealLabel.text="SEAL "+Math.min(100,Math.floor((getTime()-this.heldAt)*100))+"%";
    if(this.phase==="ending"&&this.exits.length)this.updateExits();
    if(this.phase!=="reconstruction")return;
    const camera=this.cast.flow.actor.camera.getTransform().getWorldPosition();for(const ghost of this.ghosts.values())if(ghost.enabled){const direction=camera.sub(ghost.getTransform().getWorldPosition());direction.y=0;if(direction.length>.01)ghost.getTransform().setWorldRotation(quat.lookAt(direction.normalize(),vec3.up()));}
    this.animateReconstructionDetails();
    if(this.holdUntil>getTime()){this.began+=getDeltaTime();return;}
    const elapsed=getTime()-this.began;let total=0,index=0;for(;index<this.frames.length-1;index++){total+=this.frames[index].durationSeconds;if(elapsed<total)break;}
    if(this.escapeStart){this.escapeActor.getTransform().setWorldPosition(vec3.lerp(this.escapeStart,this.escapeDoor,Math.min(1,elapsed/4)));if(elapsed>=4)this.escapeActor.enabled=false;}
    if(index!==this.frame){this.frame=index;const beat=this.frames[index],graph=this.sealedGraph;if(this.holdKind&&beat.kind===this.holdKind){this.holdUntil=getTime()+this.holdSeconds;this.holdKind="";}
      this.title.text=beat.kind==="freeze"?beat.time+" — THE TRUTH":beat.kind==="stamp"?beat.caption:"RECONSTRUCTION / "+beat.kind.toUpperCase();
      this.body.text=wrapText(beat.kind==="correction"||beat.kind==="freeze"?this.routeText:beat.kind==="resume"?this.summary.filter(line=>!line.speaker)[0]?.text||beat.caption:beat.caption,40);
      const marks=this.presentationMarks(beat,graph);
      for(const [id,ghost] of this.ghosts){const mark=marks.get(id);
        ghost.enabled=!!mark;if(mark)ghost.getTransform().setLocalPosition(mark);
        const material=this.ghostMaterials.get(id)!,g=this.ghostFrame(id,beat.kind,graph);
        if(g){material.mainPass.baseTex=g.texture;this.ghostScreens.get(id).offsets=ghostRect(g);this.ghostFrames.set(id,g.frame);
          material.mainPass.baseColor=id===graph.cast.victim.id?GHOST_TINT.victim:beat.kind==="claims"?GHOST_TINT.claim:id===graph.envelope.who&&["correction","freeze","resume"].includes(beat.kind)?GHOST_TINT.culprit:GHOST_TINT.truth;}
        else if(id===graph.cast.victim.id){material.mainPass.baseTex=beat.kind==="freeze"?this.victimFalling:this.victimStanding;material.mainPass.baseColor=new vec4(1,1,1,.75);}
        else if(isHarlowPreset(graph)){material.mainPass.baseTex=beat.kind==="claims"?this.art[id].claim:this.art[id].truth;material.mainPass.baseColor=new vec4(1,1,1,.8);}
        else{material.mainPass.baseTex=this.art[id].neutral;material.mainPass.baseColor=beat.kind==="claims"?new vec4(.247,.89,1,.7):id===graph.envelope.who?new vec4(1,.42,.35,.85):new vec4(1,1,1,.75);}}
      if(this.routeRoot)this.routeRoot.enabled=["correction","freeze","ledger"].includes(beat.kind)&&this.route.points.length>1;
      this.showReconstructionDetail(beat.kind);this.clue.objection.tells.audio.reconstructionBeat(beat.kind);
    }
    const length=this.frames.reduce((sum,b)=>sum+b.durationSeconds,0);
    if(elapsed>=length)this.showEnding();
  }  diagnostics():{phase:string;opened:boolean;picked:Hypothesis;result:string} {return {phase:this.phase,opened:this.opened,picked:{...this.picked},result:this.resultText};}
  private showEnding():void {
    this.phase="ending";this.clearReconstructionDetails();this.panel.enabled=false;this.ghosts.forEach(g=>g.enabled=false);if(this.routeRoot)this.routeRoot.enabled=false;
    // Run 8: the verdict stamp lands on the wall board (RoomscriptCaseBoard); the Morning Edition appears in your hands.
    // Run 9: the suspects step out through the door instead of vanishing; the accused reacts first
    // (the broken frame on a correct verdict, smug on a wrong one), then is led out last.
    const accused=this.cast.flow.actorFor(this.sealedState.accusation?.who||this.picked.who);
    {this.cast.getSceneObject().enabled=true;const door=this.cast.room.toWorld(caseExitPosition(this.sealedGraph));this.exits=[];let k=0;
      for(const person of this.sealedGraph.cast.suspects){const figure=this.cast.flow.actorFor(person.id);if(!figure)continue;const object=figure.getSceneObject();if(!object.enabled&&figure!==accused)continue;object.enabled=true;
        const from=figure.getTransform().getWorldPosition(),to=new vec3(door.x,from.y,door.z),isAccused=figure===accused;
        if(isAccused)figure.capturePose(this.sealedState.verdict==="correct"?"broken":"smug",4);
        this.exits.push({actor:object,from,to,start:getTime()+(isAccused?4:.4*k++),duration:Math.max(2,from.distance(to)/90)});}}
    this.newspaper=new RoomscriptNewspaper(this,this.getSceneObject(),this.cast.flow.actor.camera,this.sealedGraph,this.sealedState,this.clue.objection.tells.lightMaterial,accused?.portrait()?.texture||accused?.neutral||null,cue=>this.clue.objection.tells.audio.play(cue));this.result=this.newspaper.root;
    RoomscriptCaseBoard.current?.setStampAction(()=>this.openDetails()); // Run 9: pinch the verdict stamp for details
    this.clue.objection.tells.audio.silence(false);this.clue.objection.tells.audio.endingBeat();
  }
  /** Ending exits: a paper-theatre glide to the door (the actor adds its own bob and lean), then gone. */
  private updateExits():void {for(let i=this.exits.length-1;i>=0;i--){const e=this.exits[i];if(isNull(e.actor)){this.exits.splice(i,1);continue;}const t=(getTime()-e.start)/e.duration;if(t<0)continue;
    const k=Math.min(1,t),ease=k*k*(3-2*k);e.actor.getTransform().setWorldPosition(vec3.lerp(e.from,e.to,ease));if(k>=1){e.actor.enabled=false;this.exits.splice(i,1);}}}
  private openDetails():void {
    this.result.enabled=false;
    if(this.details){this.details.enabled=true;this.detailRender?.();return;}
    this.details=uiObject(this.getSceneObject(),"RoomscriptEndingDetails");const ui=new PanelUI(this.details,60,62,1.25,new vec4(1,.94,.84,1));
    const title=ui.text("Detail title","",7,"title"),body=ui.text("What happened","",34,"small");
    const pages=[{title:"YOUR ROUTE",text:this.routeText},...this.summary.map(line=>({title:line.speaker?"PRIVATE MOTIVE":"WHAT HAPPENED",text:line.text})),{title:"CASE RECORD",text:this.resultText}];let page=0;
    const render=()=>{title.text=pages[page].title;body.text=wrapText(pages[page].text,38);if(this.routeRoot)this.routeRoot.enabled=page===0&&this.route.points.length>1;};this.detailRender=render;
    ui.buttons([{id:"Ending previous",label:"Previous"},{id:"Ending next",label:"Next"}],id=>{page=(page+(id==="Ending next"?1:pages.length-1))%pages.length;render();},8);
    ui.buttons([{id:"Ending stamp",label:"Back to stamp"}],()=>{this.details.enabled=false;this.result.enabled=true;if(this.routeRoot)this.routeRoot.enabled=false;},8);render();
  }
  presentationDiagnostics():{ghosts:number;routePoints:number;routeMeters:number;routeText:string;details:boolean} {return {ghosts:[...this.ghosts.values()].filter(g=>g.enabled).length,routePoints:this.route?.points.length||0,routeMeters:this.route?.distanceMeters||0,routeText:this.routeText,details:!!this.details?.enabled};}
}
