import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'Tooling/staging/run7'),bases={};
function read(name){const text=readFileSync(resolve(root,'Assets/Scripts',name),'utf8');bases[name]=createHash('sha256').update(text).digest('hex');return text;}
function replace(text,from,to){if(!text.includes(from))throw Error('Stale point adapter boundary: '+from.slice(0,80));return text.replace(from,to);}
function save(name,text){writeFileSync(resolve(out,name),text);}
let cast=read('RoomscriptCastController.ts');
cast='import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";\n'+cast;
cast=replace(cast,'  private cast:RoomscriptSuspectActor[]=[];','  private accusationTargets:SceneObject[]=[];private accusationSelect:((id:string)=>void)|null=null;\n  private cast:RoomscriptSuspectActor[]=[];');
cast=replace(cast,'this.cards=[];this.nearest="";', 'this.cards=[];this.accusationTargets.forEach(o=>{if(!isNull(o))o.destroy();});this.accusationTargets=[];this.accusationSelect=null;this.nearest="";');
cast=replace(cast,'()=>{this.previewFocusUntil=getTime()+60;this.focus(actor.suspect);},8);', '()=>{if(this.accusationSelect){this.accusationSelect(actor.suspect);return;}this.previewFocusUntil=getTime()+60;this.focus(actor.suspect);},8);');
cast=replace(cast,'      this.cards.push(card);',`      const target=global.scene.createSceneObject("RoomscriptAccuse_"+actor.suspect);target.setParent(actor.getSceneObject());target.getTransform().setLocalPosition(new vec3(0,85,8));
      const shape=Shape.createBoxShape();shape.size=new vec3(64,130,18);const collider=target.createComponent("Physics.ColliderComponent");collider.shape=shape;
      const interaction=target.createComponent(Interactable.getTypeName()) as Interactable;interaction.targetingMode=3;
      interaction.onTriggerEnd.add(()=>{if(this.accusationSelect)this.accusationSelect(actor.suspect);});target.enabled=false;this.accusationTargets.push(target);
      this.cards.push(card);`);
cast=replace(cast,'  private placeUI(id:string)',`  /** SIK indirect ray + pinch changes the candidate only; Closing owns the seal. */
  setAccusationTargeting(select:((id:string)=>void)|null):void {this.accusationSelect=select;this.accusationTargets.forEach(o=>o.enabled=!!select);this.cards.forEach(o=>o.enabled=!select);}
  accusationTargeting():boolean {return !!this.accusationSelect;}
  private placeUI(id:string)`);
cast=replace(cast,'    if(!this.flow.engine.investigationEnabled||', '    if(this.accusationSelect||!this.flow.engine.investigationEnabled||');save('RoomscriptCastController.ts',cast);
let closing=read('RoomscriptClosingController.ts');
closing=replace(closing,'  private showInvestigation(value:boolean):void {const flow=this.cast.flow;flow.subtitles.getSceneObject().enabled=value;flow.chips.show(value);flow.verbs.show(value);this.clue.objection.caseLid.show(value);this.cast.getSceneObject().enabled=value;this.clue.objection.wallet.show(false);this.clue.notebook.show(false);}',`  private showInvestigation(value:boolean):void {const flow=this.cast.flow,targeting=!value&&this.opened&&this.phase==="idle";
    flow.subtitles.getSceneObject().enabled=value;if(value)flow.restoreControls();else{flow.chips.show(false);flow.verbs.show(false);}
    this.clue.objection.caseLid.show(value);this.cast.getSceneObject().enabled=value||targeting;this.cast.setAccusationTargeting(targeting?id=>this.pointSuspect(id):null);this.clue.objection.wallet.show(false);this.clue.notebook.show(false);
  }
  private pointSuspect(id:string):void {if(!this.opened||this.phase!=="idle"||!this.cast.flow.engine.graphRef().cast.suspects.some(s=>s.id===id))return;this.picked.who=id;this.render();this.clue.objection.tells.audio.play("ToastTick");}`);
closing=replace(closing,'private close():void {this.opened=false;', 'private close():void {this.heldAt=-1;this.opened=false;');
closing=replace(closing,'private accuse():void {if(this.phase!=="idle")return;', 'private accuse():void {if(!this.opened||this.phase!=="idle")return;');
closing=replace(closing,'this.sealedGraph=graph;this.opened=true;this.showInvestigation(false);this.panel.enabled=true;this.phase="reconstruction";', 'this.sealedGraph=graph;this.opened=true;this.phase="reconstruction";this.showInvestigation(false);this.panel.enabled=true;');
closing=replace(closing,'proof filed. Hold the seal when ready.', 'proof filed. Point and pinch a suspect; hold the seal when ready.');save('RoomscriptClosingController.ts',closing);
let clue=read('RoomscriptClueController.ts');
clue=replace(clue,'flow.chips.show(true);flow.verbs.show(true);this.objection.caseLid.show(true);', 'flow.restoreControls();this.objection.caseLid.show(true);');
clue=replace(clue,'this.objection.flow.chips.show(true);this.objection.flow.verbs.show(true);this.objection.caseLid.show(true);', 'this.objection.flow.restoreControls();this.objection.caseLid.show(true);');
clue=replace(clue,'this.objection.flow.chips.show(true);this.objection.flow.verbs.show(true);this.objection.caseLid.show(true);', 'this.objection.flow.restoreControls();this.objection.caseLid.show(true);');save('RoomscriptClueController.ts',clue);
writeFileSync(resolve(out,'point-accuse-base-hashes.json'),JSON.stringify(bases,null,2)+'\n');
console.log('Staged Cast, Closing, Clue; no Assets writes.');
