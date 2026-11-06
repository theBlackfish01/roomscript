import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'Tooling/staging/run7'),name='RoomscriptClosingController.ts';
const original=readFileSync(resolve(root,'Assets/Scripts',name),'utf8');let text=original;
function replace(from,to){if(!text.includes(from))throw Error('Stale T2 boundary: '+from.slice(0,90));text=text.replace(from,to);}
text='import {reconstructionDetails,ReconstructionDetails} from "./Engine/game/ReconstructionDetails";\n'+text;
replace('  private detailRender:(()=>void)|null=null;',`  private detailRender:(()=>void)|null=null;
  private dial:SceneObject;private dialHour:SceneObject;private dialMinute:SceneObject;private dialLabel:Text;private dialTime="";private dialFrom=[0,0];private dialTo=[0,0];private dialStarted=0;
  private claimSlips:{root:SceneObject;home:vec3;material:Material;ashes:SceneObject[]}[]=[];private burnProgress=0;private correctionOffset=0;private ledgerRows=0;`);
replace('    flow.engine.onState.add(state=>this.onState(state));',`    this.clue.objection.tells.audio.onNarrationSubtitle.add(({speaker,text})=>{if(this.phase==="reconstruction"&&this.frames[this.frame]?.kind==="resume"&&speaker==="NARRATOR")this.body.text=wrapText(text,40);});
    flow.engine.onState.add(state=>this.onState(state));`);
replace('    if(!this.panel)return;this.cast.room.initialize();','    if(!this.panel)return;this.clearReconstructionDetails();this.cast.room.initialize();');
if(!text.includes('flow.controlsBlocked=!value'))replace('const flow=this.cast.flow,targeting=!value&&this.opened&&this.phase==="idle";', 'const flow=this.cast.flow,targeting=!value&&this.opened&&this.phase==="idle";flow.controlsBlocked=!value;');
replace('    this.route=routeReplay(state);this.buildRoute(graph);','    this.route=routeReplay(state);this.buildRoute(graph);this.buildReconstructionDetails();');
replace('  private image(parent:SceneObject,',`  private clearReconstructionDetails():void {
    if(this.dial&&!isNull(this.dial))this.dial.destroy();this.dial=null;this.dialTime="";this.ledgerRows=0;this.burnProgress=0;
    for(const slip of this.claimSlips){if(!isNull(slip.root))slip.root.destroy();for(const ash of slip.ashes)if(!isNull(ash))ash.destroy();}this.claimSlips=[];
  }
  private buildReconstructionDetails():void {
    this.clearReconstructionDetails();const graph=this.sealedGraph,state=this.sealedState,detail=reconstructionDetails(graph,state,"claims");if(!detail)return;
    const material=this.clue.objection.tells.lightMaterial.clone();material.mainPass.baseColor=new vec4(1,.84,.04,1);
    this.dial=uiObject(this.panel,"RoomscriptReconstructionDial");this.dial.getTransform().setLocalPosition(new vec3(0,-14,3));
    const segments:[vec3,vec3][]=[];for(let i=0;i<48;i++){const a=i*Math.PI*2/48,b=(i+1)*Math.PI*2/48;segments.push([new vec3(7*Math.sin(a),7*Math.cos(a),0),new vec3(7*Math.sin(b),7*Math.cos(b),0)]);}
    for(let i=0;i<12;i++){const a=i*Math.PI/6,r=i%3?6.2:5.7;segments.push([new vec3(r*Math.sin(a),r*Math.cos(a),0),new vec3(7*Math.sin(a),7*Math.cos(a),0)]);}worldLines(this.dial,"Time rim",segments,material,.25);
    this.dialHour=uiObject(this.dial,"Hour hand");this.dialMinute=uiObject(this.dial,"Minute hand");worldLines(this.dialHour,"Hour",[[vec3.zero(),new vec3(0,3.7,0)]],material,.6);worldLines(this.dialMinute,"Minute",[[vec3.zero(),new vec3(0,5.5,0)]],material,.3);
    const label=uiObject(this.dial,"Dial time");label.getTransform().setLocalPosition(new vec3(0,-10,1));this.dialLabel=new PanelUI(label,28,5,.9,new vec4(1,.94,.84,1),false,true).text("Exact case time","",4,"small");this.dial.enabled=false;
    for(const entry of detail.slips){const root=uiObject(this.cast.room.getSceneObject(),"RoomscriptRejectedClaim_"+entry.suspect),home=new vec3(...entry.position);root.getTransform().setLocalPosition(home);root.getTransform().setWorldRotation(this.cast.flow.actor.camera.getTransform().getWorldRotation());
      const ink=this.clue.objection.tells.lightMaterial.clone();ink.mainPass.baseColor=new vec4(.247,.89,1,.9);worldLines(root,"Claim paper",[[new vec3(-12,-7,0),new vec3(12,-7,0)],[new vec3(12,-7,0),new vec3(12,7,0)],[new vec3(12,7,0),new vec3(-12,7,0)],[new vec3(-12,7,0),new vec3(-12,-7,0)],[new vec3(-9,-3,0),new vec3(9,-3,0)]],ink,.45);
      new PanelUI(root,23,12,.65,new vec4(.247,.89,1,1),false,true).text("Claim role",entry.label,10,"small");root.enabled=false;
      const ashes:SceneObject[]=[];for(let i=0;i<5;i++){const ash=uiObject(this.cast.room.getSceneObject(),"RoomscriptClaimAsh_"+entry.suspect+"_"+i);worldLines(ash,"Paper fragment",[[new vec3(-.6,0,0),new vec3(.6,0,0)]],ink,.6);ash.enabled=false;ashes.push(ash);}this.claimSlips.push({root,home,material:ink,ashes});
    }
    const index=this.frames.findIndex(b=>b.kind==="correction");this.correctionOffset=this.frames.slice(0,index).reduce((total,b)=>total+b.durationSeconds,0);
  }
  private showReconstructionDetail(kind:ReconstructionBeat["kind"]):void {
    const detail=reconstructionDetails(this.sealedGraph,this.sealedState,kind);if(!detail)return;
    this.dial.enabled=!!detail.time;this.dialTime=detail.time||"";this.dialLabel.text=this.dialTime;
    if(detail.time){this.dialFrom=this.dialTo.slice();this.dialTo=[detail.hourRadians,detail.minuteRadians];this.dialStarted=getTime();}
    for(const slip of this.claimSlips){slip.root.enabled=kind==="claims"||kind==="correction";slip.root.getTransform().setLocalPosition(slip.home);slip.root.getTransform().setLocalScale(vec3.one());slip.material.mainPass.baseColor=new vec4(.247,.89,1,.9);slip.ashes.forEach(ash=>ash.enabled=false);}
    this.ledgerRows=detail.ledger.length;
    if(kind==="ledger"){this.title.text="YOUR DEDUCTIONS";this.body.text=detail.ledger.map(row=>(row.filed?"✓ ":"○ ")+row.label+(row.filed?"":" — unfiled")).join("\\n");}
  }
  private animateReconstructionDetails():void {
    if(this.dial?.enabled){const t=Math.min(1,Math.max(0,(getTime()-this.dialStarted)/.8));this.dialHour.getTransform().setLocalRotation(quat.angleAxis(-(this.dialFrom[0]+(this.dialTo[0]-this.dialFrom[0])*t),vec3.forward()));this.dialMinute.getTransform().setLocalRotation(quat.angleAxis(-(this.dialFrom[1]+(this.dialTo[1]-this.dialFrom[1])*t),vec3.forward()));}
    if(this.frames[this.frame]?.kind!=="correction")return;
    const p=Math.max(0,Math.min(1,(getTime()-this.began-this.correctionOffset)/2.2));this.burnProgress=p;
    this.claimSlips.forEach((slip,index)=>{slip.root.enabled=p<1;slip.root.getTransform().setLocalScale(new vec3(1,Math.max(.01,1-p),1));slip.root.getTransform().setLocalPosition(slip.home.add(new vec3(0,p*12,0)));slip.material.mainPass.baseColor=new vec4(1,.42,.35,Math.max(.08,1-p));
      slip.ashes.forEach((ash,i)=>{ash.enabled=p>0&&p<1;ash.getTransform().setLocalPosition(slip.home.add(new vec3((i-2)*3+p*(index%2?10:-10),7+p*(15+i*3),p*6)));ash.getTransform().setLocalRotation(quat.angleAxis(p*(i+1),vec3.forward()));});});
  }
  /** Director/LEAF capture hook; changes presentation time only after the seal. */
  captureReconstructionDetail(kind:"correction"|"ledger",seconds=12):boolean {
    if(this.phase!=="reconstruction"||!this.sealedState||!["correct","wrong"].includes(this.sealedState.verdict))return false;
    const index=this.frames.findIndex(b=>b.kind===kind);if(index<0)return false;this.holdUntil=0;this.began=getTime()-this.frames.slice(0,index).reduce((n,b)=>n+b.durationSeconds,0)-(kind==="correction"?.9:.1);this.frame=-1;this.update();this.animateReconstructionDetails();this.holdUntil=getTime()+Math.min(20,Math.max(0,seconds));return true;
  }
  reconstructionDetailDiagnostics():{kind:string;time:string;slips:number;burn:number;ledgerRows:number}{return {kind:this.frames[this.frame]?.kind||"",time:this.dialTime,slips:this.claimSlips.filter(s=>s.root.enabled).length,burn:this.burnProgress,ledgerRows:this.ledgerRows};}
  private image(parent:SceneObject,`);
replace('    if(this.holdUntil>getTime()){', '    this.animateReconstructionDetails();\n    if(this.holdUntil>getTime()){');
replace('      this.clue.objection.tells.audio.reconstructionBeat(beat.kind);', '      this.showReconstructionDetail(beat.kind);this.clue.objection.tells.audio.reconstructionBeat(beat.kind);');
replace('    this.phase="ending";this.panel.enabled=false;', '    this.phase="ending";this.clearReconstructionDetails();this.panel.enabled=false;');
writeFileSync(resolve(out,name),text);writeFileSync(resolve(out,'t2-base-hashes.json'),JSON.stringify({[name]:createHash('sha256').update(original).digest('hex')},null,2)+'\n');
console.log('Staged T2 Closing only; no Assets writes.');
