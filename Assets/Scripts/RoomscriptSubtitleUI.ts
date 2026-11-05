import {PanelUI} from "./RoomscriptPanelUI";
import {SubtitlePresentation} from "./Engine/perf/SubtitlePresentation";
/** Passive speaker-local captions. Missing alignment uses estimated 0.30 s/word timing. */
@component export class RoomscriptSubtitleUI extends BaseScriptComponent {
  @input @hint("Subtitle width cm") width:number=62;
  @input @hint("Subtitle typography scale") fontScale:number=1.5;
  @input('vec4','{1,0.94,0.84,1}') @hint("Subtitle ink") @widget(new ColorWidget()) ink:vec4;
  private view:PanelUI;private speaker:Text;private line:Text;private presentation=new SubtitlePresentation();
  onAwake():void {this.createEvent("UpdateEvent").bind(()=>{if(this.line)this.paint(this.presentation.advance(getTime()));});}
  build():void {if(this.view)return;this.view=new PanelUI(this.getSceneObject(),Math.min(58,this.width),7,Math.min(1.2,this.fontScale),this.ink,true,true);
    this.speaker=this.view.text("Speaker","",1,"title");this.line=this.view.text("Spoken subtitle","",5,"small");}
  private paint(text:string):void {if(this.line.text!==text)this.line.text=text;}
  set(speaker:string,line:string):void {this.build();this.speaker.text="";this.presentation.set(line,getTime());this.paint(this.presentation.text());}
  untimed(line:string):void {this.build();this.presentation.untimed(line,getTime());this.paint(this.presentation.text());}
  reveal(line:string):void {this.build();this.presentation.reveal(line,getTime());this.paint(this.presentation.text());}
  text():string{return this.presentation.fullText();}
  fullText():string{return this.presentation.fullText();}
  diagnostics():ReturnType<SubtitlePresentation["diagnostics"]>{return this.presentation.diagnostics();}
}
