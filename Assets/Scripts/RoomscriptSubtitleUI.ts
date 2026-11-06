import {SubtitlePresentation} from "./Engine/perf/SubtitlePresentation";
import {subtitleWindow} from "./Engine/perf/GlyphTokens";
import {label} from "./RoomscriptGlyphUI";
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
  onAwake():void {this.createEvent("UpdateEvent").bind(()=>{if(this.line)this.paint(this.presentation.advance(getTime()));});}
  build():void {if(this.line)return;this.line=label(this.getSceneObject(),"Spoken subtitle","",this.lineWidth,4.2,this.ink||new vec4(1,.94,.84,1),"small",.82);
    this.line.horizontalOverflow=HorizontalOverflow.Overflow;this.line.outlineSettings.enabled=true;this.line.outlineSettings.size=.12;this.line.outlineSettings.fill.color=new vec4(0,0,0,1);}
  private paint(text:string):void {if(!text&&this.shown&&getTime()<this.holdUntil)return;const visible=subtitleWindow(text,this.maxChars);if(this.shown!==visible){this.shown=visible;this.line.text=visible;}}
  set(speaker:string,line:string):void {this.build();this.presentation.set(line,getTime());this.paint(this.presentation.text());}
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
