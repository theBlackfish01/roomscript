/** Articulated case lid presentation. Expects authored hinge, contains no game decisions. */
@component export class RoomscriptCaseCrate extends BaseScriptComponent {
  @input @hint("Authored lid hinge") hinge:SceneObject;
  @input @hint("Opening duration seconds") @widget(new SliderWidget(0.3,3,0.1)) duration:number=1.2;
  @input @hint("Lid opening degrees") @widget(new SliderWidget(45,110,1)) angle:number=80;
  private elapsed=0;private tick:SceneEvent;
  onAwake():void {this.tick=this.createEvent("UpdateEvent");this.tick.bind(()=>{if(!this.hinge){this.tick.enabled=false;return;}this.elapsed+=getDeltaTime();const t=Math.min(1,this.elapsed/this.duration);
    this.hinge.getTransform().setLocalRotation(quat.fromEulerAngles(-this.angle*Math.PI/180*(1-Math.pow(1-t,3)),0,0));if(t===1)this.tick.enabled=false;});}
  restart():void {this.elapsed=0;this.tick.enabled=true;}
  isAnimating():boolean {return this.tick.enabled;}
  close():void {this.tick.enabled=false;this.elapsed=0;this.hinge.getTransform().setLocalRotation(quat.quatIdentity());}
}
