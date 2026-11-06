import {SubtitlePresentation} from "./Engine/perf/SubtitlePresentation";
import {subtitleWindow} from "./Engine/perf/GlyphTokens";
import {label} from "./RoomscriptGlyphUI";
const BODILESS=["WREN","NARRATOR","DETECTIVE","SUGGESTION",""];
/** Passive speaker-local captions. Missing alignment uses estimated 0.30 s/word timing.
 * Run 8: one short line below the speaker's face; the newest revealed words roll in.
 */
@component export class RoomscriptSubtitleUI extends BaseScriptComponent {
  @input @hint("Subtitle width cm") width:number=62;
  @input @hint("Subtitle typography scale") fontScale:number=1.5;
  @input('vec4','{1,0.94,0.84,1}') @hint("Subtitle ink") @widget(new ColorWidget()) ink:vec4;
  /** One line: about 38 characters at ~3.2 cm cap height reads at 1.4 m. */
  readonly maxChars=38;readonly lineWidth=46;
  private line:Text;private presentation=new SubtitlePresentation();private shown="";private holdUntil=0;
  /** Voices without a body (Wren, narrator, the detective, suggestions) use one head-locked line low in view. */
  private companion:Text;private companionRoot:SceneObject;private bodiless=false;
  onAwake():void {this.createEvent("UpdateEvent").bind(()=>{if(this.line)this.paint(this.presentation.advance(getTime()));});
    // The head-locked companion line lives under the camera, so it follows this object's visibility by hand (the closing hides subtitles).
    this.createEvent("OnDisableEvent").bind(()=>{if(this.companionRoot&&!isNull(this.companionRoot))this.companionRoot.enabled=false;});
    this.createEvent("OnEnableEvent").bind(()=>{if(this.companionRoot&&!isNull(this.companionRoot))this.companionRoot.enabled=true;});}
  build():void {if(this.line)return;this.line=label(this.getSceneObject(),"Spoken subtitle","",this.lineWidth,4.2,this.ink||new vec4(1,.94,.84,1),"small",.82);
    this.line.horizontalOverflow=HorizontalOverflow.Overflow;this.line.outlineSettings.enabled=true;this.line.outlineSettings.size=.12;this.line.outlineSettings.fill.color=new vec4(0,0,0,1);}
  private paint(text:string):void {if(!text&&this.shown&&getTime()<this.holdUntil)return;const visible=subtitleWindow(text,this.maxChars);if(this.shown!==visible){this.shown=visible;this.line.text=this.bodiless?"":visible;if(this.companion)this.companion.text=this.bodiless?visible:"";}}
  private route(speaker:string):void {this.bodiless=BODILESS.includes((speaker||"").toUpperCase());if(this.bodiless&&!this.companion)this.buildCompanion();}
  private buildCompanion():void {let camera:SceneObject=null;for(let i=0;i<global.scene.getRootObjectsCount();i++){const o=global.scene.getRootObject(i);if(o.getComponent("Component.Camera")&&o.name==="Camera Object"){camera=o;break;}}
    if(!camera)return;this.companionRoot=global.scene.createSceneObject("RoomscriptCompanionLine");this.companionRoot.setParent(camera);this.companionRoot.getTransform().setLocalPosition(new vec3(0,-18,-105));
    this.companion=label(this.companionRoot,"Companion subtitle","",46,4,new vec4(.247,.89,1,1),"small",.7);this.companion.horizontalOverflow=HorizontalOverflow.Overflow;}
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
