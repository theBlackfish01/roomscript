import{readFileSync,writeFileSync,mkdirSync}from'node:fs';import{createHash}from'node:crypto';const folder='Tooling/staging/run7/ui-diet/';mkdirSync(folder,{recursive:true});const files=[];
function sub(s,a,b){if(!s.includes(a))throw Error('Missing '+a.slice(0,80));return s.replace(a,b);}
function stage(name,edit){const before=readFileSync('Assets/Scripts/'+name,'utf8'),after=edit(before);if(before===after)throw Error('No change');writeFileSync(folder+name,after);files.push({name,sourceSha256:createHash('sha256').update(before).digest('hex'),stagedSha256:createHash('sha256').update(after).digest('hex')});}
stage('RoomscriptTellVisual.ts',s=>{
 s=sub(s,'for(const radius of [23.5,24.4])vertices.push(Math.cos(angle)*radius,Math.sin(angle)*radius+126,-3,0,0,1,step/8,radius===23.5?0:1);','for(const radius of [4.5,5.2])vertices.push(Math.cos(angle)*radius-32,Math.sin(angle)*radius+92,5,0,0,1,step/8,radius===4.5?0:1);');
 s=sub(s,'this.segments.forEach((segment,index)=>segment.enabled=index<suspect.composure);','this.segments.forEach(segment=>segment.enabled=false);');
 s=sub(s,'if(!this.prop)return;const now=getTime();','if(!this.prop)return;const now=getTime();this.segments.forEach(segment=>segment.enabled=false);');
 s=sub(s,'    this.prop.enabled=true;','    this.segments.forEach((segment,index)=>segment.enabled=index<this.shownSegments);\n    this.prop.enabled=true;');
 s=sub(s,'segments:number;absent:boolean;moving:boolean','segments:number;visibleSegments:number;absent:boolean;moving:boolean');
 return sub(s,'segments:this.shownSegments,absent:','segments:this.shownSegments,visibleSegments:this.segments.filter(segment=>segment.enabled).length,absent:');
});
stage('RoomscriptOpeningController.ts',s=>{
 s=s.replaceAll('new vec4(1,.84,.04,1)','new vec4(.91,.69,.29,1)');
 s=sub(s,'private objectLabels:SceneObject[]=[];','private objectBrackets=new Map<string,SceneObject>();private objectLabels:SceneObject[]=[];');
 s=sub(s,'this.fixtures.push(bracket);','bracket.enabled=false;this.objectBrackets.set(object.id,bracket);this.fixtures.push(bracket);');
 s=sub(s,'this.objectLabels=[];this.zoneLabels=[];','this.objectLabels=[];this.zoneLabels=[];this.objectBrackets.clear();');
 s=sub(s,'if(hidden.includes(object.name)||object.name.startsWith("Standin"))object.enabled=!active;','if(hidden.includes(object.name)||object.name.startsWith("Standin")||["Study plaque","Lounge plaque","Hall plaque","Kitchen plaque","Conservatory plaque"].includes(object.name))object.enabled=!active;');
 const begin=s.indexOf('    if(getTime()>=this.nextDetail)'),end=s.indexOf('    if(this.phase==="boot")return;',begin);if(begin<0||end<0)throw Error('Opening LOD region missing');
 s=s.slice(0,begin)+`    if(getTime()>=this.nextDetail){
      this.nextDetail=getTime()+.2;const flow=this.cast.flow,camera=flow.actor.camera.getTransform(),eye=camera.getWorldPosition(),rotation=camera.getWorldRotation(),forward=rotation.multiplyVec3(vec3.back());
      const face=flow.actor.getTransform().getWorldPosition().add(new vec3(0,130,0)).sub(eye),facing=face.length>.1&&face.normalize().dot(forward)>.5;
      const conversation=flow.diagnostics().busy||(facing&&(face.length<180||flow.chips.getSceneObject().enabled||flow.verbs.getSceneObject().enabled));
      const explore=this.phase==="ready"&&!this.verdict&&!flow.controlsBlocked&&!conversation;let nearest:SceneObject=null,best=180;
      if(explore)for(const node of this.objectLabels){const delta=node.getTransform().getWorldPosition().sub(eye),distance=delta.length;if(distance<best&&distance>.1&&delta.normalize().dot(forward)>.75){nearest=node;best=distance;}}
      for(const node of this.objectLabels){node.enabled=node===nearest;if(node.enabled)node.getTransform().setWorldRotation(rotation);}
      this.objectBrackets.forEach((bracket,id)=>bracket.enabled=!!nearest&&nearest.name==="RoomscriptNearObject_"+id);
      let far:SceneObject=null,alignment=.85;
      if(explore&&!nearest)for(const node of this.zoneLabels){const delta=node.getTransform().getWorldPosition().sub(eye),dot=delta.length>.1?delta.normalize().dot(forward):-1;if(delta.length>180&&dot>alignment){far=node;alignment=dot;}}
      for(const node of this.zoneLabels){node.enabled=node===far;if(node.enabled)node.getTransform().setWorldRotation(rotation);}
      if(this.phase==="ready"){this.chalk.forEach(object=>object.enabled=!conversation&&!flow.controlsBlocked);this.tape.enabled=!conversation&&!flow.controlsBlocked;}
    }
`+s.slice(end);return s;
});
stage('RoomscriptClueController.ts',s=>{
 s=s.replaceAll('new vec4(1,.84,.04,1)','new vec4(.91,.69,.29,1)');
 s=sub(s,'private busy=false;','private nextDetail=0;private excludedSuspects=new Set<string>();private busy=false;');
 s=sub(s,'this.suspectMarks.clear();','this.suspectMarks.clear();this.excludedSuspects.clear();this.nextDetail=0;');
 s=sub(s,'const graph=engine.graphRef(),inverse=','const graph=engine.graphRef(),inverse=');
 s=sub(s,'this.crosses.forEach((cross,id)=>cross.enabled=state.grid.suspects.includes(id));this.suspectMarks.forEach((mark,id)=>mark.enabled=state.grid.suspects.includes(id));','this.excludedSuspects=new Set(state.grid.suspects);this.crosses.forEach((cross,id)=>cross.enabled=this.excludedSuspects.has(id));this.suspectMarks.forEach((mark,id)=>mark.enabled=this.excludedSuspects.has(id));');
 s=sub(s,'  private update():void {',`  private updateDetail():void {
    if(!this.ivory)return;const flow=this.objection.flow,camera=flow.actor.camera.getTransform(),eye=camera.getWorldPosition(),forward=camera.getWorldRotation().multiplyVec3(vec3.back());
    const face=flow.actor.getTransform().getWorldPosition().add(new vec3(0,130,0)).sub(eye),facing=face.length>.1&&face.normalize().dot(forward)>.5;
    const conversation=flow.diagnostics().busy||(facing&&(face.length<180||flow.chips.getSceneObject().enabled||flow.verbs.getSceneObject().enabled));
    const board=this.selectedWho!==null||this.busy,explore=flow.engine.investigationEnabled&&!flow.controlsBlocked&&!conversation;
    this.gridMarks.forEach((visual,id)=>{const delta=visual.getTransform().getWorldPosition().sub(eye),inView=delta.length>.1&&delta.normalize().dot(forward)>.65;
      visual.enabled=board||(explore&&inView&&(visual.getSceneObject().name.startsWith("RoomscriptZoneGrid_")?forward.y<-.25:delta.length<180));});
    this.crosses.forEach((mark,id)=>mark.enabled=this.excludedSuspects.has(id)&&(board||explore));
    this.suspectMarks.forEach((mark,id)=>mark.enabled=this.excludedSuspects.has(id)&&(board||(explore&&forward.y<-.25)));
  }
  private update():void {
    if(getTime()>=this.nextDetail){this.nextDetail=getTime()+.2;this.updateDetail();}`);
 return s;
});
stage('RoomscriptClueLeafScenario.ts',s=>{
 s=sub(s,'const audioOrigin=clue.objection.tells.audio.getTransform().getWorldPosition();','const audioOrigin=clue.objection.tells.audio.getTransform().getWorldPosition(),camera=flow.actor.camera.getTransform(),cameraHome=camera.getWorldPosition(),cameraRotation=camera.getWorldRotation();');
 s=sub(s,'expect(engine.snapshot().grid.suspects.includes("S1")).toBe(true);expect(findSceneObjectByName("RoomscriptSuspectGrid_S1").enabled).toBe(true);',`expect(engine.snapshot().grid.suspects.includes("S1")).toBe(true);
      // The exclusion stays certified while its room marker yields to a nearby speaker.
      await tap("Question S2");const face=flow.actor.getTransform().getWorldPosition().add(new vec3(0,130,0));camera.setWorldPosition(face.add(new vec3(0,0,100)));camera.setWorldRotation(quat.quatIdentity());await sleep(350);
      expect(engine.snapshot().grid.suspects.includes("S1")).toBe(true);expect(findSceneObjectByName("RoomscriptSuspectGrid_S1").enabled).toBe(false);expect(clue.objection.tells.diagnostics().visibleSegments).toBe(0);
      camera.setWorldRotation(quat.fromEulerAngles(-Math.PI/3,0,0));await sleep(350);expect(findSceneObjectByName("RoomscriptSuspectGrid_S1").enabled).toBe(true);expect(engine.snapshot().grid.suspects.includes("S1")).toBe(true);
      camera.setWorldPosition(cameraHome);camera.setWorldRotation(cameraRotation);await sleep(250);`);
 return sub(s,'}finally{flow.cancel();flow.client.forceOffline=false;}','}finally{camera.setWorldPosition(cameraHome);camera.setWorldRotation(cameraRotation);flow.cancel();flow.client.forceOffline=false;}');
});
writeFileSync(folder+'manifest.json',JSON.stringify({status:'staged only',files},null,2));console.log(JSON.stringify(files.map(f=>f.name)));
