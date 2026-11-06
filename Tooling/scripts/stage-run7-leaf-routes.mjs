/** Stage route migrations only. Publishing requires a separate explicit release. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='Assets/Scripts/',out='Tooling/staging/run7/leaf-routes/';mkdirSync(out,{recursive:true});
const files=[];
function stage(name,mutate){const before=readFileSync(root+name,'utf8'),after=mutate(before);if(before===after)throw Error('No change: '+name);writeFileSync(out+name,after);files.push({name,sourceSha256:createHash('sha256').update(before).digest('hex'),stagedSha256:createHash('sha256').update(after).digest('hex')});}
function replace(source,from,to){if(!source.includes(from))throw Error('Missing source: '+from.slice(0,90));return source.replace(from,to);}
stage('RoomscriptHeroDemoLeafScenario.ts',s=>replace(replace(s,'await tap("Select "+id)','await tap("Question "+id)'), 'await tap("Place case");for(let i=0;', 'if(opening.diagnostics().phase==="placement")await tap("Place case");for(let i=0;'));
stage('RoomscriptCastLeafScenario.ts',s=>replace(s,'findInteractablesByName("Select "+id','findInteractablesByName("Question "+id'));
stage('RoomscriptInterrogationLeafScenario.ts',s=>{
 s=replace(s,'const hits=findInteractablesByName(name,undefined,true);expect(hits.length).toBe(1);','let hits=findInteractablesByName(name,undefined,true);for(let i=0;i<20&&!hits.length;i++){await sleep(50);hits=findInteractablesByName(name,undefined,true);}expect(hits.length).toBe(1);');
 s=replace(s,'    try {','    const openFree=async()=>{await tap("Questions");for(let i=0;i<10&&!flow.chips.topics().includes("free");i++)await tap("More questions");const index=flow.chips.topics().indexOf("free");expect(index>=0).toBe(true);await tap("Question "+(index+1));};\n    try {');
 s=replace(s,'      await tap("Question 1");await done();','      await tap("Question S2");await tap("Question 1");await done();');
 return s.replaceAll('await tap("Ask anything")','await openFree()');
});
stage('RoomscriptOpeningLeafScenario.ts',s=>replace(s,'expect(opening.diagnostics().phase).toBe("placement");const hand=new DefaultLeafInteractor();await hand.trigger(findInteractablesByName("Floor higher",undefined,true)[0]);expect(opening.getSceneObject().getParent().getTransform().getWorldPosition().y).toBe(5);expect(opening.cast.room.audit().length).toBe(0);await hand.trigger(findInteractablesByName("Floor lower",undefined,true)[0]);await hand.trigger(findInteractablesByName("Place case",undefined,true)[0]);await sleep(4500);',
 `const hand=new DefaultLeafInteractor();const tap=async(name:string)=>{const targets=findInteractablesByName(name,undefined,true);expect(targets.length).toBe(1);await hand.trigger(targets[0]);await sleep(100);};
    if(opening.diagnostics().phase==="placement"){
      await tap("Floor higher");expect(opening.getSceneObject().getParent().getTransform().getWorldPosition().y).toBe(5);expect(opening.cast.room.audit().length).toBe(0);await tap("Floor lower");await tap("Place case");
    }else{
      expect(global.deviceInfoSystem.isEditor()||opening.filmMode).toBe(true);expect(["knocks","tab"].includes(opening.diagnostics().phase)).toBe(true);expect(findInteractablesByName("Place case",undefined,true).length).toBe(0);expect(opening.diagnostics().trace.includes("placed")).toBe(true);expect(opening.cast.room.audit().length).toBe(0);
    }
    for(let i=0;i<100&&opening.diagnostics().phase!=="tab";i++)await sleep(100);`));
stage('RoomscriptTellsLeafScenario.ts',s=>replace(s,'    try {\n      await flow.askChip','    try {\n      await tap("Question S2");await flow.askChip'));
stage('RoomscriptShellLeafScenario.ts',s=>{
 s='import {RoomscriptOpeningController} from "./RoomscriptOpeningController";\n'+s;
 return replace(s,'expect(findSceneObjectByName("PreviewRoom").enabled).toBe(global.deviceInfoSystem.isEditor());','const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;expect(findSceneObjectByName("PreviewRoom").enabled).toBe(global.deviceInfoSystem.isEditor()&&!opening.filmMode);');
});
stage('RoomscriptActorLeafScenario.ts',s=>{
 s='import {RoomscriptRoomBinding} from "./RoomscriptRoomBinding";\n'+s;
 s=replace(s,'expect(object.getTransform().getWorldPosition().y).toBe(-160);','const room=findSceneObjectByName("RoomscriptCaseRoom").getComponent(RoomscriptRoomBinding.getTypeName()) as RoomscriptRoomBinding;expect(Math.abs(object.getTransform().getWorldPosition().y-room.toWorld([0,0,0]).y)<.01).toBe(true);');
 return replace(s,'const state=engine.snapshot();state.suspects.S2.layer=2;','const state=JSON.parse(JSON.stringify(engine.snapshot()));state.suspects.S2.layer=2;');
});
writeFileSync(out+'manifest.json',JSON.stringify({status:'staged only; no Assets writes',files},null,2));
console.log(JSON.stringify(files.map(f=>f.name)));
