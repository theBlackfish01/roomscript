import {CancellationSource,CancellationToken} from "../ai/LlmPort";

export type SpeechRole="suspect"|"narrator"|"wren";
export type SpeechResetReason="case-change"|"ending";
export type SpeechEndReason="completed"|"fallback"|"failed"|SpeechResetReason;
export interface SpeechRequest {
  id:string;
  role:SpeechRole;
  speaker?:string;
  text?:string;
  /** Rechecked immediately before playback, never used to interrupt an active line. */
  allowed?:()=>boolean;
  /** Resolve only once the physical voice/caption has finished. Stop it on token cancellation. */
  run:(token:CancellationToken)=>Promise<boolean>;
}
export interface SpeechEvent {
  type:"start"|"end"|"drop";
  id:string;
  role:SpeechRole;
  speaker?:string;
  text?:string;
  revision:number;
  reason?:SpeechEndReason|"busy"|"not-allowed";
}
type Job={request:SpeechRequest;revision:number;resolve:(played:boolean)=>void};
type Active={job:Job;source:CancellationSource;resetReason?:SpeechResetReason};
const PRIORITY:Record<SpeechRole,number>={suspect:0,narrator:1,wren:2};

/** A single non-preemptive performance channel. No timers, Lens state, or game truth. */
export class SpeechArbiter {
  private queue:Job[]=[];
  private active:Active|null=null;
  private revision=0;
  private idleWaiters:(()=>void)[]=[];
  constructor(private onEvent:(event:SpeechEvent)=>void=()=>{}) {}

  enqueue(request:SpeechRequest):Promise<boolean> {
    if(request.role==="wren"&&(this.active!==null||this.queue.length>0)){
      this.emit({request,revision:this.revision,resolve:()=>{}},"drop","busy");
      return Promise.resolve(false);
    }
    return new Promise(resolve=>{
      const job:Job={request,revision:this.revision,resolve};
      // Insert after equal-priority jobs, preserving deterministic FIFO order.
      const at=this.queue.findIndex(other=>PRIORITY[other.request.role]>PRIORITY[request.role]);
      if(at<0)this.queue.push(job);else this.queue.splice(at,0,job);
      this.pump();
    });
  }

  /** A case boundary is the only operation allowed to cancel a started line. */
  reset(reason:SpeechResetReason):void {
    this.revision++;
    const pending=this.queue.splice(0);
    if(this.active){this.active.resetReason=reason;this.active.source.cancel();}
    for(const job of pending){this.emit(job,"drop",reason);job.resolve(false);}
    this.finishIdle();
  }

  /** Resolves after all currently queued work has drained, including cancellation cleanup. */
  idle():Promise<void> {
    if(!this.active&&!this.queue.length)return Promise.resolve();
    return new Promise(resolve=>this.idleWaiters.push(resolve));
  }

  diagnostics():{active:Omit<SpeechEvent,"type">|null;queued:number;revision:number} {
    const job=this.active?.job;
    return {active:job?{id:job.request.id,role:job.request.role,speaker:job.request.speaker,text:job.request.text,revision:job.revision}:null,queued:this.queue.length,revision:this.revision};
  }

  private pump():void {
    if(this.active)return;
    while(this.queue.length){
      const job=this.queue.shift()!;
      let allowed=false;
      try{allowed=job.revision===this.revision&&(!job.request.allowed||job.request.allowed());}catch{/* A failed admission guard cannot grant playback. */}
      if(!allowed){this.emit(job,"drop","not-allowed");job.resolve(false);continue;}
      const active:Active={job,source:new CancellationSource()};this.active=active;
      this.emit(job,"start");void this.run(active);return;
    }
    this.finishIdle();
  }

  private async run(active:Active):Promise<void> {
    let played=false,reason:SpeechEndReason="failed";
    try{active.source.token.throwIfCancelled();played=await active.job.request.run(active.source.token);reason=played?"completed":"fallback";}
    catch{/* Playback failures release the channel; presentation owns its fallback. */}
    finally{
      reason=active.resetReason||reason;
      this.emit(active.job,"end",reason);
      // Keep exclusive ownership until cancellation cleanup actually returns.
      this.active=null;
      active.job.resolve(played&&!active.resetReason);
      this.pump();
    }
  }

  private emit(job:Job,type:SpeechEvent["type"],reason?:SpeechEvent["reason"]):void {
    try{this.onEvent({type,id:job.request.id,role:job.request.role,speaker:job.request.speaker,text:job.request.text,revision:job.revision,reason});}
    catch{/* Diagnostics must never prevent channel release. */}
  }
  private finishIdle():void {if(!this.active&&!this.queue.length){const waiters=this.idleWaiters.splice(0);for(const resolve of waiters)resolve();}}
}
