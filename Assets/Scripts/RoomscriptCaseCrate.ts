/** Articulated case lid presentation. Expects authored hinge, contains no game decisions. */
@component export class RoomscriptCaseCrate extends BaseScriptComponent {
  @input @hint("Authored lid hinge") hinge:SceneObject;
  @input @hint("Opening duration seconds") @widget(new SliderWidget(0.3,3,0.1)) duration:number=1.2;
  @input @hint("Lid opening degrees") @widget(new SliderWidget(45,110,1)) angle:number=80;
  private elapsed=0;
  onAwake():void {this.createEvent("UpdateEvent").bind(()=>{if(!this.hinge)return;this.elapsed+=getDeltaTime();const t=Math.min(1,this.elapsed/this.duration);
    this.hinge.getTransform().setLocalRotation(quat.fromEulerAngles(-this.angle*Math.PI/180*(1-Math.pow(1-t,3)),0,0));});}
  restart():void {this.elapsed=0;}
}
