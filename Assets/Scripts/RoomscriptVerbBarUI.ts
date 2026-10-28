import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {PanelUI,wrapText} from "./RoomscriptPanelUI";
/** Passive statement and verb surface; engine owns judgement. */
@component export class RoomscriptVerbBarUI extends BaseScriptComponent {
  @input @hint("Panel width cm") @widget(new SliderWidget(40,60,1)) width:number=46;
  @input @hint("Text scale") @widget(new SliderWidget(1,2.5,0.1)) fontScale:number=1.6;
  @input('vec4','{0.25,0.89,1,1}') @hint("Claim color") @widget(new ColorWidget()) ink:vec4;
  readonly onVerb=new Event<string>();private view:PanelUI;private claim:Text;private canonical="";
  build():void {if(this.view)return;this.view=new PanelUI(this.getSceneObject(),this.width,14,this.fontScale,this.ink);
    this.claim=this.view.text("Current claim","Ask a question to file a statement.",5,"small");
    this.view.buttons([{id:"Believe",label:"Believe"},{id:"Press",label:"Press"},{id:"Object",label:"Object"}],id=>this.onVerb.invoke(id),5,id=>this.preview(id));}
  setClaim(line:string):void {this.canonical=line;this.preview(null);}
  preview(verb:string|null):void {this.claim.text=wrapText((verb?verb+": ":"")+this.canonical,Math.floor(this.width-3));}
  previewText():string{return this.claim.text;}
  show(value:boolean):void {this.view.show(value);}
}
