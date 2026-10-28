import {PanelUI} from "./RoomscriptPanelUI";
/** Authored brass plaque / envelope label, with no interaction or game decisions. */
@component export class RoomscriptZonePlaqueUI extends BaseScriptComponent {
  @input @hint("Plaque wording") label:string="STUDY";
  @input @hint("Plaque width cm") @widget(new SliderWidget(12,55,1)) width:number=28;
  @input('vec4','{0.91,0.69,0.29,1}') @hint("Brass lettering") @widget(new ColorWidget()) ink:vec4;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>new PanelUI(this.getSceneObject(),this.width,7,1.7,this.ink).text("Plaque",this.label,4,"body"));}
}
