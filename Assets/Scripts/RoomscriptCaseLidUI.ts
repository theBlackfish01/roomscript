import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {HandInputData} from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandInputData";
import {glyphButton,glyphTexture,iconImage,label,GlyphButton,IVORY,BRASS,CORAL,CYAN} from "./RoomscriptGlyphUI";
import {lineTubes,polyline,tinted} from "./RoomscriptLineArt";
import {uiObject} from "./RoomscriptPanelUI";
/** Run 8 palm notebook (WEARER_UX object UI 4). Turn the left palm up: notebook, evidence and accuse
 * glyphs fan out above the palm with the case clock and the credibility lens. Turn it down: gone.
 * Palm down or no tracked hands (Preview, or Specs when palm-up isn't detected): the same three glyphs sit small
 * on the crate lid (fallback).
 * Passive view: counts come from the engine bridge; actions are emitted as intents only.
 * Interactable names "Notebook", "Evidence", "Accuse" are unchanged for LEAF.
 */
@component export class RoomscriptCaseLidUI extends BaseScriptComponent {
  @input @hint("Panel width cm (legacy)") @widget(new SliderWidget(40,60,1)) width:number=46;
  @input @hint("Text scale (legacy)") @widget(new SliderWidget(1,2.5,0.1)) fontScale:number=1.6;
  @input('vec4','{0.91,0.69,0.29,1}') @hint("Case brass lettering") @widget(new ColorWidget()) ink:vec4;
  readonly onAction=new Event<string>();
  private built=false;private allowed=true;private palm:SceneObject;private lid:SceneObject;private group:SceneObject;private tokens:GlyphButton[]=[];
  private clock:Text;private title="THE HARLOW TRUST";private lens:SceneObject;private cracks:SceneObject[]=[];private pips=5;private crackFlash=0;
  private camera:SceneObject;private hands:HandInputData;private onPalm=false;private palmSeen=0;
  build():void {if(this.built)return;this.built=true;
    this.lid=this.getSceneObject();this.lid.createComponent("Component.Canvas");
    this.group=uiObject(this.lid,"RoomscriptPalmGroup");this.group.createComponent("Component.Canvas");
    const specs:[string,string,vec4][]=[["Notebook","notebook",IVORY],["Evidence","evidence",CYAN],["Accuse","seal",CORAL]];
    specs.forEach(([id,icon,ink],i)=>{const token=glyphButton(this.group,id,11,4.4,()=>this.onAction.invoke(id),ink);token.set(this.texture(icon),id==="Notebook"?"Notes":id);token.root.getTransform().setLocalPosition(new vec3((i-1)*12,0,.6));this.tokens.push(token);});
    this.clock=label(this.group,"Palm clock","",16,3,BRASS,"small",.5);this.clock.getSceneObject().getTransform().setLocalPosition(new vec3(-6,5.2,.6));
    // Credibility lens: cracks appear as pips are lost (feedback at the action, not a screen-edge toast).
    this.lens=uiObject(this.group,"Credibility lens");this.lens.getTransform().setLocalPosition(new vec3(9,5.2,.6));iconImage(this.lens,"Lens icon",requireAsset("../Art/UI/Icons/Credibility.png") as Texture,3.6);
    const line=requireAsset("../Materials/RoomscriptCyan.mat") as Material;
    const crackShapes=[[[-.2,1.4],[.3,.3],[-.1,-.2]],[[.3,.3],[1.2,.1],[1.5,-.5]],[[-.1,-.2],[-.9,-.9],[-1.1,-1.5]],[[.3,.3],[.5,-1],[.2,-1.5]],[[-.2,1.4],[-1,1],[-1.4,.4]]];
    crackShapes.forEach((shape,i)=>{const crack=lineTubes(this.lens,"Lens crack "+i,polyline(shape.map(([x,y])=>new vec3(x,y,1))),tinted(line,CORAL),.16).getSceneObject();crack.enabled=false;this.cracks.push(crack);});
    for(let i=0;i<global.scene.getRootObjectsCount();i++){const o=global.scene.getRootObject(i);if(o.name==="Camera Object"){this.camera=o;break;}}
    try{this.hands=HandInputData.getInstance();}catch{this.hands=null;}
    this.createEvent("UpdateEvent").bind(()=>this.update());this.dock(false);
  }
  private texture(icon:string):Texture {switch(icon){case "notebook":return requireAsset("../Art/Run8/GlyphNotebook.png") as Texture;case "evidence":return requireAsset("../Art/Run8/GlyphEvidence.png") as Texture;default:return requireAsset("../Art/Run8/GlyphSeal.png") as Texture;}}
  /** Palm mode follows the left palm; lid mode docks the glyphs on the crate (Preview fallback). */
  /** Run 9 (review item 8): reparent only on a change; on the palm the group has no parent, which used to re-dock every frame. */
  private docked=false;
  private dock(palm:boolean):void {if(this.docked&&this.onPalm===palm)return;this.docked=true;this.onPalm=palm;const t=this.group.getTransform();
    if(palm){this.group.setParent(null);t.setWorldScale(vec3.one());}else{this.group.setParent(this.lid);t.setLocalPosition(new vec3(0,1,0));t.setLocalRotation(quat.quatIdentity());t.setLocalScale(vec3.one());}}
  private update():void {
    let palmUp=false,center:vec3=null;
    if(this.hands){const left=this.hands.getHand("left");if(left&&left.isTracked()&&left.isFacingCamera()){center=left.getPalmCenter();palmUp=!!center;}}
    if(palmUp){this.palmSeen=getTime();if(!this.onPalm)this.onSound?.("PalmOpen");}
    const usePalm=palmUp||(this.onPalm&&getTime()-this.palmSeen<.35);
    this.dock(usePalm);
    if(usePalm&&center&&this.camera){const eye=this.camera.getTransform().getWorldPosition(),toward=eye.sub(center).normalize();
      this.group.getTransform().setWorldPosition(center.add(toward.uniformScale(4)).add(new vec3(0,7,0)));this.group.getTransform().setWorldRotation(quat.lookAt(toward,vec3.up()));}
    // Run 9 (review item 10): the lid copy is the fallback on Specs too, so Accuse never depends on palm-up detection.
    this.group.enabled=this.allowed;
    if(this.crackFlash&&getTime()>this.crackFlash){this.crackFlash=0;this.lens.getTransform().setLocalScale(vec3.one());}
  }
  /** Optional cue hook (wired by the main script to RoomscriptAudio). */
  onSound:((cue:string)=>void)|null=null;
  setCounters(minutes:number,pips:number,hunches:number):void {this.build();this.clock.text=minutes+" min";
    if(pips<this.pips){this.onSound?.("LensCrack");this.crackFlash=getTime()+.6;this.lens.getTransform().setLocalScale(vec3.one().uniformScale(1.5));}
    this.pips=pips;this.cracks.forEach((crack,i)=>crack.enabled=i<5-Math.max(0,pips));}
  /** The glyph token root for an action ("Notebook", "Evidence", "Accuse"), for highlights that sit on it. */
  tokenRoot(id:string):SceneObject|null {const token=this.tokens.find(t=>t.root.name===id||t.root.name.endsWith(id));return token?token.root:null;}
  setStatus(text:string):void {this.build();this.clock.text=text;}
  setTimeline(lines:string[]):void {}
  setMode(text:string):void {this.build();}
  setTitle(text:string):void {this.build();this.title=text.toUpperCase();}
  show(value:boolean):void {this.build();this.allowed=value;this.group.enabled=value;}
  diagnostics():{onPalm:boolean;visible:boolean;cracks:number}{return {onPalm:this.onPalm,visible:this.group.enabled,cracks:this.cracks.filter(c=>c.enabled).length};}
}
