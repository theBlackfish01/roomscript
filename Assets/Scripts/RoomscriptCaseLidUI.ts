import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {PanelUI} from "./RoomscriptPanelUI";
/** Passive case HUD and navigation. Counts are provided by the engine bridge. */
@component export class RoomscriptCaseLidUI extends BaseScriptComponent {
  @input @hint("Panel width cm") @widget(new SliderWidget(40,60,1)) width:number=46;
  @input @hint("Text scale") @widget(new SliderWidget(1,2.5,0.1)) fontScale:number=1.6;
  @input('vec4','{0.91,0.69,0.29,1}') @hint("Case brass lettering") @widget(new ColorWidget()) ink:vec4;
  readonly onAction=new Event<string>();private view:PanelUI;private status:Text;
  build():void {if(this.view)return;this.view=new PanelUI(this.getSceneObject(),this.width,15,this.fontScale,this.ink,true);
    this.view.text("Case title","HARLOW / 1041",3,"title");
    this.status=this.view.text("Case clock","180 min  |  Pips 5  |  Hunches 0",3,"body");
    this.view.buttons([{id:"Notebook",label:"Notebook"},{id:"Evidence",label:"Evidence"}],id=>this.onAction.invoke(id));}
  setCounters(minutes:number,pips:number,hunches:number):void {this.status.text=minutes+"m | "+pips+" pips | "+hunches+" hunches";}
  setStatus(text:string):void {this.status.text=text;}
  show(value:boolean):void {this.view.show(value);}
}
