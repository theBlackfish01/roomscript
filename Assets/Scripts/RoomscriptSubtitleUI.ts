import {PanelUI,wrapText} from "./RoomscriptPanelUI";
/** Passive speaker-local subtitles; only admitted text is supplied by the controller. */
@component export class RoomscriptSubtitleUI extends BaseScriptComponent {
  @input @hint("Subtitle width cm") width:number=62;
  @input @hint("Subtitle typography scale") fontScale:number=1.5;
  @input('vec4','{1,0.94,0.84,1}') @hint("Subtitle ink") @widget(new ColorWidget()) ink:vec4;
  private view:PanelUI;private speaker:Text;private line:Text;private current="";
  build():void {if(this.view)return;this.view=new PanelUI(this.getSceneObject(),this.width,15,this.fontScale,this.ink);
    this.speaker=this.view.text("Speaker","",3,"title");this.line=this.view.text("Spoken subtitle","Choose a question.",9,"small");}
  set(speaker:string,line:string):void {this.build();this.speaker.text=speaker;this.current=line;this.line.text=wrapText(line,38);}
  text():string{return this.current;}
}
