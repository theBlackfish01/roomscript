import {CaseGraph,GameState,Vec3} from "../core/Types";
import {getCurrentStatements,statementFacts} from "./Actions";

/** Setup marks follow the first account, including authored covers. They do not certify it. */
export function refuterMarks(graph:CaseGraph):Record<string,Vec3> {
  const marks:Record<string,Vec3>={};graph.room.objects.forEach(o=>marks[o.id]=o.pos.slice() as Vec3);
  graph.cast.suspects.forEach(person=>{const claim=getCurrentStatements(graph,person.id,0).find(s=>s.topic.startsWith("where@"));
    const fact=claim&&graph.facts.find(f=>statementFacts(claim).includes(f.id)&&f.pred==="at"&&f.args.who===person.id);
    const zone=fact&&graph.room.zones.find(z=>z.id===fact.args.zone);
    if(!zone)throw new Error("Missing claimed mark for "+person.id);marks[person.id]=[zone.anchor[0],0,zone.anchor[2]+55];});return marks;
}
export function clockwiseAngle(origin:Vec3,forward:Vec3,point:Vec3):number {
  const angle=Math.atan2(point[0]-origin[0],-(point[2]-origin[2]))-Math.atan2(forward[0],-forward[2]);
  return (angle+Math.PI*4)%(Math.PI*2);
}
/** Resolve once at setup and retain in the case graph for deterministic replay. */
export function clockwiseRefuters(graph:CaseGraph,origin:Vec3,forward:Vec3):string[] {
  const marks=refuterMarks(graph);return graph.refutation.order.map((id,index)=>{if(!marks[id])throw new Error("Missing refuter "+id);return {id,index,angle:clockwiseAngle(origin,forward,marks[id])};})
    .sort((a,b)=>a.angle-b.angle||a.index-b.index).map(item=>item.id);
}
export function notebookPages(graph:CaseGraph,state:GameState):{grid:string[];statements:string[]} {
  const rows=(title:string,items:{id:string;name:string}[],excluded:string[])=>title+"\n\n"+items.map(item=>(excluded.includes(item.id)?"X ":"? ")+item.name).join("\n");
  return {grid:[rows("WHO",graph.cast.suspects,state.grid.suspects),rows("WHERE",graph.room.zones.map(z=>({id:z.id,name:z.clueName})),state.grid.zones),rows("WITH WHAT",graph.weapons.map(id=>({id,name:graph.room.objects.find(o=>o.id===id)!.label})),state.grid.weapons)],
    statements:state.notebook.map(claim=>{const person=graph.cast.suspects.find(s=>s.id===claim.speaker)!,tell=state.events.some(e=>e.type==="tell"&&e.refs?.includes(claim.statement));return person.name+"\n"+(claim.broken?"REFUTED":tell?"TELL NOTED":"FILED")+"\n\n"+claim.canonical;})};
}
export function privateRefutation(graph:CaseGraph,state:GameState,seq:number,player:string):{holder:string;card:string;text:string}|null {
  const event=state.events.find(e=>e.seq===seq&&e.type==="refuted"&&e.data?.privateTo===player);
  if(!event?.actor||!event.refs||!state.knowledge.factIds.includes(event.refs[1]))return null;
  const fact=graph.facts.find(f=>f.id===event.refs![1]);return fact?{holder:event.actor,card:event.refs[0],text:fact.canonical||"This possibility has been excluded."}:null;
}
