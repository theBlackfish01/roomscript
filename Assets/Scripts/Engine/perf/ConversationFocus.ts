export interface ConversationCandidate {id:string;distanceCm:number;dot:number;}
export const CONVERSATION_FOCUS={enterCm:200,leaveCm:260,enterDot:Math.cos(35*Math.PI/180),leaveDot:Math.cos(70*Math.PI/180),enterSeconds:.3,leaveSeconds:1};
export const PREVIEW_CONVERSATION_FOCUS={...CONVERSATION_FOCUS,enterCm:500,leaveCm:650,enterDot:Math.cos(45*Math.PI/180),enterSeconds:.15,preferGaze:true};

/** Time-qualified entry and exit, with a retained target throughout the hysteresis band. */
export class ConversationFocus {
  constructor(private limits:typeof CONVERSATION_FOCUS & {preferGaze?:boolean}=CONVERSATION_FOCUS){}
  private current:string|null=null;
  private candidate:string|null=null;
  private candidateSince=0;
  private outsideSince:number|null=null;
  private previousTime:number|null=null;

  reset():void {this.current=null;this.candidate=null;this.candidateSince=0;this.outsideSince=null;this.previousTime=null;}
  /** Deliberate selection bypasses acquisition dwell; subsequent loss still observes exit dwell. */
  select(id:string):void {this.current=id;this.candidate=null;this.outsideSince=null;}
  update(now:number,samples:readonly ConversationCandidate[]):string|null {
    if(!Number.isFinite(now))return this.current;
    if(this.previousTime!==null&&now<this.previousTime){this.candidateSince=now;this.outsideSince=this.outsideSince===null?null:now;}
    this.previousTime=now;
    const valid=samples.filter(s=>Number.isFinite(s.distanceCm)&&s.distanceCm>=0&&Number.isFinite(s.dot));
    if(this.current){
      const sample=valid.find(s=>s.id===this.current);
      const outside=!sample||sample.distanceCm>this.limits.leaveCm||sample.dot<this.limits.leaveDot;
      if(!outside){this.outsideSince=null;return this.current;}
      if(this.outsideSince===null)this.outsideSince=now;
      if(now-this.outsideSince+1e-9<this.limits.leaveSeconds)return this.current;
      this.current=null;this.outsideSince=null;this.candidate=null;
    }
    const eligible=valid.filter(s=>s.distanceCm<=this.limits.enterCm&&s.dot>=this.limits.enterDot);
    eligible.sort((a,b)=>(this.limits.preferGaze?b.dot-a.dot:0)||a.distanceCm-b.distanceCm||(a.id<b.id?-1:a.id>b.id?1:0));
    const next=eligible[0]?.id||null;
    if(next!==this.candidate){this.candidate=next;this.candidateSince=now;}
    if(next&&now-this.candidateSince+1e-9>=this.limits.enterSeconds){this.current=next;this.candidate=null;}
    return this.current;
  }
  diagnostics():{current:string|null;candidate:string|null;candidateSince:number;outsideSince:number|null}{return {current:this.current,candidate:this.candidate,candidateSince:this.candidateSince,outsideSince:this.outsideSince};}
}
