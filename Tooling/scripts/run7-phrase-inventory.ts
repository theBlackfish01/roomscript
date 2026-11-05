import {readFileSync,writeFileSync} from "node:fs";
import {prepareDynamicCase} from "../../Assets/Scripts/Content/DynamicCase";
import {createHeroCase} from "../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {hashHex} from "../../Assets/Scripts/Engine/core/Hash";
import {getPitch} from "../../Assets/Scripts/Content/PitchLibrary";
import {RoomInput} from "../../Assets/Scripts/Engine/room/RoomModel";

const lines=new Map<string,{id:string;speaker:string;text:string}>();
const args=process.argv.slice(2);
const argument=(flag:string)=>{const index=args.indexOf(flag);return index<0?undefined:args[index+1];};
const roomPath=argument("--room"),outputPath=argument("--out")||"audio/run7-phrase-spec-v3.json";
const themes=new Set<string>(),seeds=[7,1041,2026];
for(let seed=0;seed<100&&themes.size<6;seed++){const theme=getPitch(seed).theme;if(!themes.has(theme)){themes.add(theme);seeds.push(seed);}}
const hero=createHeroCase().room,zones=hero.zones.slice(0,3);
const living:RoomInput={source:"simulated",zones,objects:[
  {id:"sofa",label:"sofa",type:"soft",zone:zones[0].id,pos:[0,45,-150]},
  {id:"table",label:"coffee table",type:"heavy",zone:zones[0].id,pos:[50,50,-150]},
  {id:"plant",label:"plant",type:"plant",zone:zones[1].id,pos:[-100,50,-120]},
  {id:"lamp",label:"floor lamp",type:"light",zone:zones[1].id,pos:[-130,140,-130]},
  {id:"door",label:"door",type:"door",zone:zones[2].id,pos:[150,110,30]}]};
const rooms:RoomInput[]=[hero,living];
if(roomPath)rooms.push(JSON.parse(readFileSync(roomPath,"utf8")) as RoomInput);
for(const room of rooms)for(const seed of seeds) {
  const result=prepareDynamicCase(seed,room);
  if(!result.ok)throw new Error("compile failed: "+seed);
  for(const plan of result.phrasePlans)for(const segment of plan.segments) {
    const text=segment.text.trim();if(!/[A-Za-z0-9]/.test(text))continue;
    const id="phrase:"+segment.speaker+":"+hashHex(text);lines.set(id,{id,speaker:segment.speaker,text});
  }
}
const out={provenance:"Run 7 deterministic compiler text; compact authored hero room plus synthetic living-room test fixture"+(roomPath?" and supplied RoomInput: "+roomPath:"; neither a recorded scan"),seeds,lines:[...lines.values()].sort((a,b)=>a.speaker.localeCompare(b.speaker)||a.text.localeCompare(b.text))};
writeFileSync(outputPath,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify({lines:out.lines.length,characters:out.lines.reduce((n,l)=>n+l.text.length,0)}));
