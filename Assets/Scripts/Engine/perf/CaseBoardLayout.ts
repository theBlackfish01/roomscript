import {CaseGraph,GameState,Id} from "../core/Types";
import {evidenceWeb,EvidenceWebOptions,WebNode,WebThread} from "../game/EvidenceWeb";

/** x,y are the item's centre in board cm (origin board centre, +y up); w,h are full extents. */
export interface BoardItem {id:string;kind:"suspect"|"zone"|"weapon"|"photo"|"stamp";label:string;x:number;y:number;w:number;h:number;crossed:boolean}
export interface BoardString {from:string;to:string;kind:WebThread["kind"]}
export interface CaseBoard {width:number;height:number;items:BoardItem[];strings:BoardString[]}
export const BOARD_LABEL_MAX=14;

/** Shorten to the label limit: drop leading words first ("brass candlestick" -> "candlestick"), then cut. */
export function boardLabel(text:string,max=BOARD_LABEL_MAX):string {
  let words=text.replace(/\s+/g," ").trim().split(" ");
  while(words.join(" ").length>max&&words.length>1)words=words.slice(1);
  return words.join(" ").slice(0,max);
}
function personLabel(name:string):string {
  if(name.length<=BOARD_LABEL_MAX)return name;
  const parts=name.split(" "),short=parts[0].charAt(0)+". "+parts[parts.length-1];
  return short.length<=BOARD_LABEL_MAX?short:boardLabel(parts[parts.length-1]);
}
const round=(n:number)=>Math.round(n*100)/100;

/** Corkboard: WHO / WHERE / WITH WHAT rows on the left, collected-evidence photos and the verdict stamp on the right.
 * Crossing comes only from state.grid; photos only from state.knowledge.evidenceIds; strings only from evidenceWeb. */
export function caseBoardLayout(graph:CaseGraph,state:GameState,opts:{width?:number;height?:number}&EvidenceWebOptions={}):CaseBoard {
  const width=opts.width&&opts.width>0?opts.width:120,height=opts.height&&opts.height>0?opts.height:80;
  const unit=Math.min(width,height),margin=unit*.0375,gap=unit*.025;
  const left=-width/2+margin,top=height/2-margin,bottom=-height/2+margin,right=width/2-margin;
  const leftW=width*.6-margin,rightStart=left+leftW+gap*2,rightW=right-rightStart;
  const items:BoardItem[]=[];
  const rows:{kind:BoardItem["kind"];prefix:string;cards:{id:Id;label:string;crossed:boolean}[]}[]=[
    {kind:"suspect",prefix:"who:",cards:graph.cast.suspects.map(s=>({id:s.id,label:personLabel(s.name),crossed:state.grid.suspects.includes(s.id)}))},
    {kind:"zone",prefix:"where:",cards:graph.room.zones.map(z=>({id:z.id,label:boardLabel(z.clueName),crossed:state.grid.zones.includes(z.id)}))},
    {kind:"weapon",prefix:"what:",cards:graph.weapons.map(id=>({id,label:boardLabel(graph.room.objects.find(o=>o.id===id)?.label||id),crossed:state.grid.weapons.includes(id)}))}
  ];
  const columns=Math.max(1,...rows.map(r=>r.cards.length)),rowH=(top-bottom-gap*2)/3;
  const cardW=(leftW-(columns-1)*gap)/columns,cardH=Math.min(rowH-gap,cardW*1.25);
  rows.forEach((row,r)=>{
    const y=top-rowH/2-r*(rowH+gap);
    row.cards.forEach((card,c)=>items.push({id:row.prefix+card.id,kind:row.kind,label:card.label,x:round(left+cardW/2+c*(cardW+gap)),y:round(y),w:round(cardW),h:round(cardH),crossed:card.crossed}));
  });
  const stampH=height*.15,photoTop=top-stampH-gap,photoH=photoTop-bottom;
  if(state.verdict!==null)items.push({id:"stamp",kind:"stamp",label:state.verdict==="correct"?"CASE CLOSED":state.verdict==="wrong"?"WRONG CALL":"CASE COLD",
    x:round(rightStart+rightW/2),y:round(top-stampH/2),w:round(rightW),h:round(stampH),crossed:false});
  const photos=graph.evidence.filter(e=>state.knowledge.evidenceIds.includes(e.id));
  if(photos.length){
    let best={cols:1,w:0};
    for(let cols=1;cols<=photos.length;cols++){
      const rowsN=Math.ceil(photos.length/cols),w=(rightW-(cols-1)*gap)/cols,h=(photoH-(rowsN-1)*gap)/rowsN,fit=Math.min(w,h/.8);
      if(fit>best.w)best={cols,w:fit};
    }
    const w=best.w,h=w*.8;
    photos.forEach((e,i)=>{
      const c=i%best.cols,r=Math.floor(i/best.cols);
      const holder=graph.room.objects.find(o=>o.id===e.holder)?.label||graph.room.zones.find(z=>z.id===e.holder)?.clueName||e.holder;
      items.push({id:"photo:"+e.id,kind:"photo",label:boardLabel(holder),x:round(rightStart+w/2+c*(w+gap)),y:round(photoTop-h/2-r*(h+gap)),w:round(w),h:round(h),crossed:false});
    });
  }
  const has=new Set(items.map(i=>i.id));
  const place=(node:WebNode,thread:WebThread):string|null=>{
    if(node.kind==="suspect")return has.has("who:"+node.id)?"who:"+node.id:null;
    if(node.kind==="zone"){
      const photo=thread.evidence&&graph.evidence.find(e=>e.id===thread.evidence)?.holder===node.id?"photo:"+thread.evidence:null;
      return photo&&has.has(photo)?photo:has.has("where:"+node.id)?"where:"+node.id:null;
    }
    if(node.kind==="object"){
      if(has.has("what:"+node.id))return "what:"+node.id;
      const own=thread.evidence&&graph.evidence.find(e=>e.id===thread.evidence)?.holder===node.id?"photo:"+thread.evidence:null;
      if(own&&has.has(own))return own;
      const first=photos.find(e=>e.holder===node.id);return first?"photo:"+first.id:null;
    }
    return null; // The victim has no card on the board.
  };
  const strings:BoardString[]=[],seen=new Set<string>();
  for(const thread of evidenceWeb(graph,state,opts)){
    const from=place(thread.from,thread),to=place(thread.to,thread);
    if(!from||!to||from===to)continue;
    const key=from+"|"+to+"|"+thread.kind;if(seen.has(key))continue;
    seen.add(key);strings.push({from,to,kind:thread.kind});
  }
  return {width,height,items,strings};
}
