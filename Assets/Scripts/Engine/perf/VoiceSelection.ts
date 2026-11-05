/** Exact-text lookup only. Voice selection never changes a performed answer. */
export interface VoiceRecord {index:number;speaker:string;text:string;take:string;startSeconds?:number;endSeconds?:number;alignment?:{characters:string[];starts:number[];ends:number[]};}
export class VoiceIndex<T extends VoiceRecord> {
  private lines=new Map<string,T[]>();
  constructor(records:readonly T[]){for(const record of records){const key=record.speaker+"|"+record.text;const list=this.lines.get(key)||[];list.push(record);this.lines.set(key,list);}}
  find(speaker:string,text:string,mood:string,allowTell=false):T|undefined {
    const records=this.lines.get(speaker+"|"+text)||[];
    if(allowTell){const tell=records.find(r=>r.take==="tell");if(tell)return tell;}
    return records.find(r=>r.take===mood&&r.take!=="tell")||records.find(r=>r.take==="steady")||records.find(r=>r.take!=="tell");
  }
}
