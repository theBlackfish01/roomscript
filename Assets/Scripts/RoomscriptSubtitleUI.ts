import {PanelUI,wrapText} from "./RoomscriptPanelUI";
/** Passive speaker-local subtitles; only admitted text is supplied by the controller. */
@component export class RoomscriptSubtitleUI extends BaseScriptComponent {
  @input @hint("Subtitle width cm") width:number=62;
  @input @hint("Subtitle typography scale") fontScale:number=1.5;
  @input('vec4','{1,0.94,0.84,1}') @hint("Subtitle ink") @widget(new ColorWidget()) ink:vec4;
  private view:PanelUI;private speaker:Text;private line:Text;private current="";
  build():void {if(this.view)return;this.view=new PanelUI(this.getSceneObject(),this.width,7,this.fontScale,this.ink,true,true);
    this.speaker=this.view.text("Speaker","",1,"title");this.line=this.view.text("Spoken subtitle","",5,"small");}
  private phrase(line:string):string {const words=line.split(/\s+/);let out="";for(let i=words.length-1;i>=0;i--){if((words[i]+" "+out).length>46&&out)break;out=words[i]+(out?" "+out:"");}return out;}
  set(speaker:string,line:string):void {this.build();this.speaker.text="";this.current=line;this.line.text=this.phrase(line);}
  reveal(line:string):void {this.build();const phrase=this.phrase(line);if(this.line.text!==phrase)this.line.text=phrase;}
  text():string{return this.current;}
}
