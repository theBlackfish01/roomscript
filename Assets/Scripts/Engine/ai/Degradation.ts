/** Presentation availability only. Never changes case facts, costs, knowledge or verdicts. */
export class Degradation {
  level:0|1|2|3;
  private timeouts=0;
  constructor(stageMode=false,hasProvider=true){this.level=stageMode||!hasProvider?0:3;}
  get preferAuthored():boolean{return this.level===0;}
  get label():string{return ["Offline case / captions","Prepared questions / captions","Prepared dialogue","Live dialogue"][this.level];}
  failure(code:string):void {
    if(this.level===0)return;
    if(code==="timeout"){if(++this.timeouts>=3)this.level=Math.min(this.level,2) as 1|2;}
    else if(code==="rate_limit")this.level=Math.min(this.level,2) as 1|2;
    else if(code==="unavailable"&&++this.timeouts>=3)this.level=1;
  }
  success():void {this.timeouts=0;if(this.level!==0)this.level=3;}
  offline():void {this.level=0;}
}
