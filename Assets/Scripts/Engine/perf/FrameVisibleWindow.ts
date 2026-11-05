/** Presentation time only: a stalled update cannot spend an entire notice before it renders. */
export class FrameVisibleWindow {
  private message="";
  private remaining=0;
  constructor(private readonly seconds=2.5,private readonly maxFrameSeconds=.1) {}
  get active():boolean {return this.remaining>0;}
  get text():string {return this.message;}
  get secondsRemaining():number {return this.remaining;}
  /** Returns true only for a new notice; repeated visible text renews without another sound. */
  show(text:string):boolean {
    const changed=!this.active||this.message!==text;
    this.message=text;this.remaining=this.seconds;return changed;
  }
  advance(deltaSeconds:number):boolean {
    if(!this.active)return false;
    const delta=Number.isFinite(deltaSeconds)?Math.max(0,Math.min(this.maxFrameSeconds,deltaSeconds)):0;
    this.remaining=Math.max(0,this.remaining-delta);
    if(this.remaining<1e-9){this.remaining=0;this.message="";}
    return this.active;
  }
}
