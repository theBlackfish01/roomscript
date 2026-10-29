import {PanelUI} from "./RoomscriptPanelUI";
/** Authored brass plaque / envelope label, with no interaction or game decisions. */
@component export class RoomscriptZonePlaqueUI extends BaseScriptComponent {
  @input @hint("Plaque wording") label:string="STUDY";
  @input @hint("Plaque width cm") @widget(new SliderWidget(12,55,1)) width:number=28;
  @input @hint("Player camera for authored angular cap height") camera:SceneObject;
  @input @hint("Size a room plaque to 1.2 degrees at setup") angularSizing:boolean=false;
  @input('vec4','{0.91,0.69,0.29,1}') @hint("Brass lettering") @widget(new ColorWidget()) ink:vec4;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>{
    if(!this.angularSizing){new PanelUI(this.getSceneObject(),this.width,7,1.7,this.ink,true).text("Plaque",this.label,4,"body");return;}
    const distance=this.camera?this.getTransform().getWorldPosition().distance(this.camera.getTransform().getWorldPosition()):150;
    const height=2*distance*Math.tan(1.2*Math.PI/360);
    const label=new PanelUI(this.getSceneObject(),Math.max(this.width,height*this.label.length*.85+4),height+3,1.7,this.ink,true).text("Plaque",this.label,height,"body");
    const settle=this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
    settle.bind(()=>{const box=label.getBoundingBox();const measured=box.top-box.bottom;if(measured>0)label.size=Math.min(800,label.size*height/measured);});settle.reset(0.1);
  });}
}
