import {morningEdition} from "./Engine/game/MorningEdition";
import {scoreCase} from "./Engine/game/Scoring";
import {CaseGraph,GameState} from "./Engine/core/Types";
import {lineTubes,rectEdges,polyline,flatText,tinted} from "./RoomscriptLineArt";
import {glyphButton,glyphTexture,iconImage} from "./RoomscriptGlyphUI";
/** Run 8 ending (WEARER_UX object UI 10, wow 8): the Morning Edition appears in your hands.
 * Every word comes from morningEdition()/scoreCase() over the sealed engine state. */
const IVORY=new vec4(1,.94,.84,1),BRASS=new vec4(.91,.69,.29,1),CORAL=new vec4(1,.42,.35,1),GOLD=new vec4(1,.84,.04,1),DIM=new vec4(1,.94,.84,.3);
export class RoomscriptNewspaper {
  readonly root:SceneObject;private began=0;private updates:SceneEvent;
  constructor(owner:BaseScriptComponent,parent:SceneObject,camera:SceneObject,graph:CaseGraph,state:GameState,line:Material,portrait:Texture|null,onDetails:()=>void,sound:(cue:string)=>void){
    const paper=morningEdition(graph,state),score=scoreCase(graph,state);
    this.root=global.scene.createSceneObject("RoomscriptNewspaper");this.root.setParent(parent);this.root.createComponent("Component.Canvas");
    const W=44,H=32,v=(x:number,y:number,z=.3)=>new vec3(x,y,z);
    lineTubes(this.root,"Paper edge",rectEdges(W,H),tinted(line,IVORY),.3);
    lineTubes(this.root,"Paper rules",[...polyline([v(-W/2+2,H/2-7.2),v(W/2-2,H/2-7.2)]),...polyline([v(-W/2+2,H/2-7.8),v(W/2-2,H/2-7.8)]),...polyline([v(0,H/2-16,.2),v(0,-H/2+2,.2)])],tinted(line,DIM),.18);
    const t=(name:string,value:string,size:number,color:vec4,font:"title"|"body",w:number,h:number,x:number,y:number)=>{const text=flatText(this.root,name,value,size,color,font,w,h);text.getSceneObject().getTransform().setLocalPosition(v(x,y,.5));return text;};
    t("Masthead",paper?.masthead||"THE MORNING EDITION",3.2,BRASS,"title",W-4,4,0,H/2-3.2);
    t("Dateline",paper?.date||"",1.2,DIM,"body",W-4,1.6,0,H/2-6);
    t("Headline",paper?.headline||"CASE CLOSED",3.6,IVORY,"title",W-4,7,0,H/2-11.8);
    t("Subhead",paper?.subhead||"",1.4,IVORY,"body",W-4,2.2,0,H/2-16.2);
    if(portrait){iconImage(this.root,"Front-page photo",portrait,11,new vec4(1,1,1,1),v(-W/4,-3.5,.4));}
    lineTubes(this.root,"Photo frame",rectEdges(13,13,v(-W/4,-3.5)),tinted(line,BRASS),.22);
    t("Photo caption",paper?.photoCaption||"",1.1,DIM,"body",18,2.4,-W/4,-11.6);
    t("Columns",(paper?.columns||[]).join("\n"),1.15,IVORY,"body",W/2-4,12,W/4,-2);
    // Holmes rating as three small stars, engine-scored.
    score.stars.forEach((star,i)=>{const c=v(W/4-5+i*5,-11.4,.5),pts=Array.from({length:10},(_,k)=>{const a=Math.PI/2+k*Math.PI/5,r=k%2?.7:1.6;return c.add(new vec3(Math.cos(a)*r,Math.sin(a)*r,0));});
      lineTubes(this.root,"Star "+i,polyline(pts,true),tinted(line,star.earned?GOLD:DIM),.22);});
    const details=glyphButton(this.root,"Ending details",12,4,onDetails,state.verdict==="correct"?BRASS:CORAL);details.set(glyphTexture("notebook" as any),"Details");details.root.getTransform().setLocalPosition(v(W/2-7,-H/2-3.4,.5));
    // In your hands: low and close, facing you, world-locked so you can look it over.
    const cam=camera.getTransform(),eye=cam.getWorldPosition();let forward=cam.getWorldRotation().multiplyVec3(vec3.back());forward.y=0;forward=forward.length>.01?forward.normalize():vec3.back();
    const at=eye.add(forward.uniformScale(48)).add(new vec3(0,-24,0));this.root.getTransform().setWorldPosition(at);
    this.root.getTransform().setWorldRotation(quat.lookAt(eye.sub(at).normalize(),vec3.up()).multiply(quat.fromEulerAngles(-.25,0,0)));
    this.began=getTime();this.root.getTransform().setLocalScale(new vec3(1,.02,1));sound("NewspaperUnfold");
    this.updates=owner.createEvent("UpdateEvent");this.updates.bind(()=>{const k=Math.min(1,(getTime()-this.began)/.6),e=1-Math.pow(1-k,3);if(!isNull(this.root))this.root.getTransform().setLocalScale(new vec3(1,Math.max(.02,e),1));if(k>=1)this.updates.enabled=false;});
  }
  set enabled(value:boolean){if(!isNull(this.root))this.root.enabled=value;}
}
