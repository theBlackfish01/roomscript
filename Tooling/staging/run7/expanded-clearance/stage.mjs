import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const dir='Tooling/staging/run7/expanded-clearance/',names=['RoomscriptMemoryCardView.ts','RoomscriptEvidenceWalletUI.ts','RoomscriptSpatialObjectionController.ts','RoomscriptStoryMoments.ts','RoomscriptMemoryCardLeafScenario.ts','RoomscriptStoryMomentsLeafScenario.ts'];
const sources=Object.fromEntries(names.map(name=>[name,readFileSync('Assets/Scripts/'+name,'utf8')]));
writeFileSync(dir+'base-hashes.json',JSON.stringify(Object.fromEntries(names.map(name=>[name,createHash('sha256').update(sources[name]).digest('hex')])),null,2));
function once(source,before,after){if(source.split(before).length!==2)throw Error('Expected one match: '+before);return source.replace(before,after);}
let view='import {raisePanelAboveSurface} from "./RoomscriptPanelClearance";\n'+sources[names[0]];
view=once(view,'  private image:Material;', '  private supportY:number|null=null;\n  private image:Material;');
view=once(view,'this.expanded.enabled=this.isExpanded;}','this.expanded.enabled=this.isExpanded;this.refreshPlacement();}');
view=once(view,'  diagnostics():',`  setSupportHeight(surfaceY:number):void {this.supportY=surfaceY;this.refreshPlacement();}
  refreshPlacement():void {if(!this.isExpanded||this.supportY===null)return;this.expanded.getTransform().setLocalPosition(new vec3(0,0,.6));raisePanelAboveSurface(this.expanded,50,76,this.supportY);}
  diagnostics():`);
writeFileSync(dir+names[0],view);
let wallet=sources[names[1]];wallet=once(wallet,'  cardDiagnostics():','  setSupportHeight(surfaceY:number):void {this.view?.setSupportHeight(surfaceY);}\n  cardDiagnostics():');writeFileSync(dir+names[1],wallet);
let objection=sources[names[2]];
objection=once(objection,'this.placePanel(this.wallet.getSceneObject(),object?this.tells.room.objectAnchor(object.id).getTransform().getWorldPosition():this.caseLid.getTransform().getWorldPosition());',
'const support=object?this.tells.room.objectAnchor(object.id).getTransform().getWorldPosition():this.caseLid.getTransform().getWorldPosition();this.placePanel(this.wallet.getSceneObject(),support);this.wallet.setSupportHeight(support.y);');
objection=once(objection,'    this.placePanel(this.getSceneObject(),this.tells.room.objectAnchor(object).getTransform().getWorldPosition());',
'    const support=this.tells.room.objectAnchor(object).getTransform().getWorldPosition();this.placePanel(this.getSceneObject(),support);this.memoryView.setSupportHeight(support.y);');
objection=once(objection,'this.placePanel(this.getSceneObject(),object?this.tells.room.objectAnchor(object.id).getTransform().getWorldPosition():this.flow.actor.getTransform().getWorldPosition().add(new vec3(0,65,0)));',
'const support=object?this.tells.room.objectAnchor(object.id).getTransform().getWorldPosition():this.flow.actor.getTransform().getWorldPosition().add(new vec3(0,65,0));this.placePanel(this.getSceneObject(),support);this.memoryView.setSupportHeight(support.y);');
objection=once(objection,'if(t===1)this.develops=0;','if(t===1){this.develops=0;this.memoryView.refreshPlacement();}');
writeFileSync(dir+names[2],objection);
let story='import {raisePanelAboveSurface} from "./RoomscriptPanelClearance";\n'+sources[names[3]];
story=once(story,'home:vec3;born:number','home:vec3;born:number;supportY:number');
story=once(story,'entry:StoryCard={root,compact,full,home,born:getTime()}','entry:StoryCard={root,compact,full,home,born:getTime(),supportY:this.engine.roomRoot.getTransform().getWorldTransform().multiplyPoint(new vec3(...plan.position)).y}');
story=once(story,'this.cards.forEach(c=>{c.compact.enabled=false;c.full.enabled=c===entry;});','this.cards.forEach(c=>{c.compact.enabled=false;c.full.enabled=c===entry;});full.getTransform().setLocalPosition(new vec3(0,0,.6));raisePanelAboveSurface(full,48,58,entry.supportY);');
story=once(story,'for(const card of this.cards){const t=', 'for(const card of this.cards){if(card===this.modal)continue;const t=');
writeFileSync(dir+names[3],story);
let memoryTest='import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";\n'+sources[names[4]];
memoryTest=once(memoryTest,'async run():Promise<void>{','async run(config?:ScenarioConfig):Promise<void>{');
memoryTest=once(memoryTest,'    const tap=async',`    const capture=config?.get("capture")||"none",hold=Math.min(20,Math.max(1,Number(config?.get("hold")||"10")));
    if(!["none","memory","wallet","both"].includes(capture)||!Number.isFinite(hold))throw Error("Use capture=none/memory/wallet/both and hold=1..20");
    const expandedCheck=async(kind:string,parent:SceneObject,support:SceneObject)=>{const panel=findSceneObjectByName("Expanded memory",parent),matrix=panel.getTransform().getWorldTransform(),surface=support.getTransform().getWorldPosition(),anchorBefore=new vec3(surface.x,surface.y,surface.z);
      expect(panel.enabled).toBe(true);const bottom=Math.min(...[-1,1].flatMap(x=>[-1,1].map(y=>matrix.multiplyPoint(new vec3(x*25,y*38,0)).y)));expect(bottom>=surface.y+2.99).toBe(true);
      console.log("MEMORY_EXPANDED_BOUNDS|"+JSON.stringify({kind,bottom,supportY:surface.y,clearance:bottom-surface.y}));
      if(capture===kind||capture==="both"){console.log("MEMORY_EXPANDED_CAPTURE|"+JSON.stringify({kind,hold,bottom,supportY:surface.y}));await sleep(hold*1000);}
      expect(support.getTransform().getWorldPosition().distance(anchorBefore)<.001).toBe(true);
    };
    const tap=async`);
memoryTest=once(memoryTest,'expect(engine.snapshot().knowledge.evidenceIds.includes(objection.cardDiagnostics().id!)).toBe(true);',
'expect(engine.snapshot().knowledge.evidenceIds.includes(objection.cardDiagnostics().id!)).toBe(true);await expandedCheck("memory",objection.getSceneObject(),opening.cast.room.objectAnchor("O11"));');
memoryTest=once(memoryTest,'objection.wallet.setEntries(walletEntries(engine.graphRef(),engine.snapshot()));expect(objection.wallet.cardDiagnostics().expanded).toBe(true);',
'objection.wallet.setEntries(walletEntries(engine.graphRef(),engine.snapshot()));expect(objection.wallet.cardDiagnostics().expanded).toBe(true);await expandedCheck("wallet",objection.wallet.getSceneObject(),opening.cast.room.objectAnchor("O11"));');
writeFileSync(dir+names[4],memoryTest);
let storyTest='import {storyMomentPlans} from "./Engine/game/StoryMomentPlan";\n'+sources[names[5]];
storyTest=once(storyTest,'    const advance=async',`    const checkExpanded=(kind:"letter"|"voicemail")=>{const plan=storyMomentPlans(engine.graphRef(),engine.snapshot()).find(p=>p.kind===kind)!;expect(!!plan).toBe(true);
      const panel=findSceneObjectByName("Story expanded",findSceneObjectByName("RoomscriptStory_"+kind)),matrix=panel.getTransform().getWorldTransform(),support=engine.roomRoot.getTransform().getWorldTransform().multiplyPoint(new vec3(...plan.position));
      const bottom=Math.min(...[-1,1].flatMap(x=>[-1,1].map(y=>matrix.multiplyPoint(new vec3(x*24,y*29,0)).y)));expect(panel.enabled).toBe(true);expect(bottom>=support.y+2.99).toBe(true);expect(opening.cast.room.audit().length).toBe(0);
      console.log("STORY_EXPANDED_BOUNDS|"+JSON.stringify({kind,bottom,supportY:support.y,clearance:bottom-support.y}));
    };
    const advance=async`);
storyTest=once(storyTest,'expect(engine.snapshot().elapsedMinutes).toBe(45);await tap("Close story memory");','expect(engine.snapshot().elapsedMinutes).toBe(45);checkExpanded("letter");await tap("Close story memory");');
storyTest=once(storyTest,'await tap("Read voicemail");expect(main.storyMoments.diagnostics().modal).toBe(true);await tap("Close story memory");','await tap("Read voicemail");expect(main.storyMoments.diagnostics().modal).toBe(true);checkExpanded("voicemail");await tap("Close story memory");');
writeFileSync(dir+names[5],storyTest);
console.log('Staged expanded memory/story surface clearance and real-corner capture gates. Assets unchanged.');
