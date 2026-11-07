import {SubtitlePresentation} from "./Engine/perf/SubtitlePresentation";
import {subtitleLines} from "./Engine/perf/GlyphTokens";
import {label} from "./RoomscriptGlyphUI";
const BODILESS=["WREN","NARRATOR","DETECTIVE","SUGGESTION",""];
const WREN_INK=new vec4(.247,.89,1,1);
/** Passive speaker-local captions. Missing alignment uses estimated 0.30 s/word timing.
 * Run 8: one short line below the speaker's face; the newest revealed words roll in.
 * Run 9 (Wadood's review): the long line crossed Vale and ran into the Ask token at 1.4 m. Now a compact caption
 * of two rows of at most 22 characters (about 28 cm wide) on a soft dark backing, centred under the chin.
 */
@component export class RoomscriptSubtitleUI extends BaseScriptComponent {
  @input @hint("Subtitle width cm") width:number=62;
  @input @hint("Subtitle typography scale") fontScale:number=1.5;
  @input('vec4','{1,0.94,0.84,1}') @hint("Subtitle ink") @widget(new ColorWidget()) ink:vec4;
  /** Two rows of up to 22 characters at about 2.4 cm cap height: about 28 cm wide, readable at 1.4 m. */
  readonly maxChars=22;readonly rows=2;readonly lineWidth=30;
  private line:Text;private presentation=new SubtitlePresentation();private shown="";private holdUntil=0;
  /** Voices without a body (Wren, narrator, the detective, suggestions) use one head-locked line low in view. */
  private companion:Text;private companionRoot:SceneObject;private bodiless=false;
  onAwake():void {this.createEvent("UpdateEvent").bind(()=>{if(this.line){this.paint(this.presentation.advance(getTime()));this.placeBodiless();}});
    // The head-locked companion line lives under the camera, so it follows this object's visibility by hand (the closing hides subtitles).
    this.createEvent("OnDisableEvent").bind(()=>{if(this.companionRoot&&!isNull(this.companionRoot))this.companionRoot.enabled=false;});
    this.createEvent("OnEnableEvent").bind(()=>{if(this.companionRoot&&!isNull(this.companionRoot))this.companionRoot.enabled=true;});}
  build():void {if(this.line)return;this.line=label(this.getSceneObject(),"Spoken subtitle","",this.lineWidth,7,this.ink||new vec4(1,.94,.84,1),"small",.62);
    this.line.horizontalOverflow=HorizontalOverflow.Overflow;this.line.outlineSettings.enabled=true;this.line.outlineSettings.size=.12;this.line.outlineSettings.fill.color=new vec4(0,0,0,1);
    this.line.backgroundSettings.enabled=true;this.line.backgroundSettings.fill.color=new vec4(.06,.05,.04,.62);this.line.backgroundSettings.margins=Rect.create(1.2,1.2,.7,.7);this.line.backgroundSettings.cornerRadius=.8;}
  /** The revealed text changes a few times a second at most; skip the regex and split when it hasn't (rule 13). */
  private lastRaw:string|null=null;
  private paint(text:string):void {if(!text&&this.shown&&getTime()<this.holdUntil)return;if(text===this.lastRaw)return;this.lastRaw=text;const visible=subtitleLines(text,this.maxChars,this.rows);if(this.shown!==visible){this.shown=visible;this.show();}}
  /** Run 9 (Wadood's review): Wren's head-locked line landed across whichever suspect the wearer faced. One text
   * layer per direction of view: while the conversation's caption slot (under the suspect's chin) is in view,
   * a bodiless voice uses that slot in Wren's cyan; an object's own caption slot (the opening crate) wins while in
   * view; otherwise the line stays head-locked low in view. */
  private target:"line"|"slot"|"companion"="companion";private nextPlace=0;private camera:Transform|null=null;
  /** An object's own caption (the opening crate's) that bodiless lines borrow while it is in view. */
  private slot:Text|null=null;private slotSaved="";private slotOwned=false;private slotWritten="";
  setBodilessSlot(text:Text|null):void {this.releaseSlot();this.slot=text;this.nextPlace=0;}
  private inView(o:SceneObject):boolean {if(!this.camera||!o||isNull(o)||!o.isEnabledInHierarchy)return false;const to=o.getTransform().getWorldPosition().sub(this.camera.getWorldPosition());
    return to.length<420&&to.length>1&&to.normalize().dot(this.camera.back)>Math.cos(34*Math.PI/180);}
  private placeBodiless():void {if(!this.bodiless||!this.shown||getTime()<this.nextPlace)return;this.nextPlace=getTime()+.2;
    if(this.slotOwned&&this.slot&&this.slot.text!==this.slotWritten){this.slotSaved=this.slot.text;this.slot.text=this.slotWritten;}
    const target=this.pickTarget();if(target!==this.target){this.target=target;this.show();}}
  /** Also decided on every text change: during the opening this object is disabled, so its update never runs. */
  private pickTarget():"line"|"slot"|"companion" {return this.slot&&this.inView(this.slot.getSceneObject())?"slot":this.inView(this.getSceneObject())?"line":"companion";}
  private releaseSlot():void {if(this.slotOwned&&this.slot&&!isNull(this.slot))this.slot.text=this.slotSaved;this.slotOwned=false;}
  private show():void {if(this.bodiless)this.target=this.pickTarget();const target=this.bodiless?this.target:"line";
    if(target==="slot"&&this.shown&&this.slot){if(!this.slotOwned){this.slotSaved=this.slot.text;this.slotOwned=true;}this.slotWritten=this.shown;this.slot.text=this.shown;}else this.releaseSlot();
    this.line.text=target==="line"?this.shown:"";this.line.textFill.color=this.bodiless?WREN_INK:this.ink||new vec4(1,.94,.84,1);if(this.companion)this.companion.text=target==="companion"?this.shown:"";}
  private route(speaker:string):void {this.lastRaw=null;this.bodiless=BODILESS.includes((speaker||"").toUpperCase());this.nextPlace=0;this.target="companion";if(this.bodiless&&!this.companion)this.buildCompanion();}
  private buildCompanion():void {let camera:SceneObject=null;for(let i=0;i<global.scene.getRootObjectsCount();i++){const o=global.scene.getRootObject(i);if(o.getComponent("Component.Camera")&&o.name==="Camera Object"){camera=o;break;}}
    if(!camera)return;this.camera=camera.getTransform();this.companionRoot=global.scene.createSceneObject("RoomscriptCompanionLine");this.companionRoot.setParent(camera);this.companionRoot.getTransform().setLocalPosition(new vec3(0,-18,-105));
    this.companion=label(this.companionRoot,"Companion subtitle","",46,4,WREN_INK,"small",.7);this.companion.horizontalOverflow=HorizontalOverflow.Overflow;}
  set(speaker:string,line:string):void {this.build();this.route(speaker);this.presentation.set(line,getTime());this.paint(this.presentation.text());}
  untimed(line:string):void {this.build();this.presentation.untimed(line,getTime());this.paint(this.presentation.text());}
  reveal(line:string):void {this.build();this.presentation.reveal(line,getTime());this.paint(this.presentation.text());}
  /** Director/film capture only: keep the last visible line instead of clearing it. Never changes text. */
  holdForCapture(seconds:number):void {this.holdUntil=getTime()+Math.max(0,Math.min(240,seconds));}
  text():string{return this.presentation.fullText();}
  fullText():string{return this.presentation.fullText();}
  /** What the wearer actually sees on the single line. */
  visibleLine():string{return this.shown;}
  diagnostics():ReturnType<SubtitlePresentation["diagnostics"]>{return this.presentation.diagnostics();}
}
