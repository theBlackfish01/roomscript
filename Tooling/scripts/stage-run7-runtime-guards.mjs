import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import{createHash}from'node:crypto';
const folder='Tooling/staging/run7/runtime-guards/';mkdirSync(folder,{recursive:true});const files=[];
function stage(name,edit){const before=readFileSync('Assets/Scripts/'+name,'utf8'),after=edit(before);if(before===after)throw Error('No change '+name);writeFileSync(folder+name,after);files.push({name,sourceSha256:createHash('sha256').update(before).digest('hex'),stagedSha256:createHash('sha256').update(after).digest('hex')});}
function sub(s,a,b){if(!s.includes(a))throw Error('Missing '+a.slice(0,70));return s.replace(a,b);}
stage('RoomscriptMain.ts',s=>{
 s=sub(s,'if(this.inputBusy||this.wrenBusy||this.interrogation.diagnostics().busy','if(this.state?.verdict||this.interrogation.controlsBlocked||this.inputBusy||this.wrenBusy||this.interrogation.diagnostics().busy');
 const at=s.indexOf('  async askWren(question:string):Promise<void>');if(at<0)throw Error('askWren missing');
 return s.slice(0,at)+`  async askWren(question:string):Promise<void> {
    if(this.wrenBusy||!this.engine.investigationEnabled||this.engine.snapshot().verdict)return;
    this.wrenBusy=true;const graph=this.engine.graphRef(),brief=buildKnowledgeBrief(graph,this.state.knowledge),key="wren-"+(++this.wrenSequence),began=Date.now();let choice=answerWren(brief,question);
    try {
      try {if(this.interrogation.client.canAnswerFree()){
        const response=await withDeadline(()=>this.interrogation.client.completeFree({provider:"gemini",model:"gemini-2.5-flash",promptVersion:"wren-knowledge-v1",messages:[{role:"system",content:'Choose one supplied option to answer the detective. Return ONLY JSON {"optionId":"..."}. Do not infer hidden facts. Heard accounts are claims, not certified truth.'},{role:"user",content:JSON.stringify({question,knowledge:brief})}]}),25000,this.interrogation.client.clock);
        if(this.engine.graphRef()!==graph)return;
        // A late response is still auditable, including after sealing, but cannot reopen presentation.
        this.engine.dispatch({type:"LlmOutput",key,occurrence:1,source:"live",response,latencyMs:Date.now()-began,at:began});
        try{choice=admitWrenChoice(brief,JSON.parse(response.content))||choice;}catch{}
      }}catch{if(this.engine.graphRef()===graph&&!this.engine.snapshot().verdict)this.toast("Wren is offline");}
      if(this.engine.graphRef()!==graph||this.engine.snapshot().verdict||!this.engine.investigationEnabled)return;
      const current=buildKnowledgeBrief(graph,this.state.knowledge);choice=admitWrenChoice(current,{optionId:choice.id})||answerWren(current,question);
      const state=this.engine.dispatch({type:"WrenSpoken",key,optionId:choice.id}),spoken=state.events.find(e=>e.seq===state.lastSeq&&e.type==="wrenSpoken");
      if(spoken?.text){this.interrogation.subtitles.set("WREN",spoken.text);await this.audio.narrateAdmittedWren(this.engine,this.interrogation.client,key);}
      if(this.engine.graphRef()!==graph||this.engine.snapshot().verdict||!this.engine.investigationEnabled)return;
      this.interrogation.controlsBlocked=false;this.caseLid.show(true);this.interrogation.restoreControls();
    }finally{this.wrenBusy=false;}
  }
}
`;
});
stage('RoomscriptLiveAiBeatLeafScenario.ts',s=>{
 s='import {buildKnowledgeBrief,admitWrenChoice} from "./Engine/game/WrenKnowledge";\n'+s;
 s=sub(s,'findSceneObjectByName("RoomscriptMain").getComponent(RoomscriptMain.getTypeName())','findSceneObjectByName("Roomscript").getComponent(RoomscriptMain.getTypeName())');
 return sub(s,'expect(wrenRaw>=0&&wrenLine>wrenRaw).toBe(true);',`expect(wrenRaw>=0&&wrenLine>wrenRaw).toBe(true);
      const rawChoice=wrenActions[wrenRaw];if(rawChoice.type!=="LlmOutput")throw new Error("Missing Wren raw response");
      const admittedChoice=admitWrenChoice(buildKnowledgeBrief(graph,known),JSON.parse(rawChoice.response.content));expect(!!admittedChoice).toBe(true);
      const chosenAction=wrenActions[wrenLine];expect(chosenAction.type==="WrenSpoken"&&chosenAction.optionId===admittedChoice!.id).toBe(true);`);
});
stage('RoomscriptClueController.ts',s=>{
 s=sub(s,'private gridMarks=new Map<string,RenderMeshVisual>();','private suspectMarks=new Map<string,SceneObject>();private gridMarks=new Map<string,RenderMeshVisual>();');
 s=sub(s,'this.pawns.clear();this.pawnHomes.clear();this.crosses.clear();this.gridMarks.clear();','this.pawns.clear();this.pawnHomes.clear();this.crosses.clear();this.gridMarks.clear();this.suspectMarks.clear();');
 s=sub(s,'const marks=refuterMarks(graph);this.order=',`const marks=refuterMarks(graph);
    for(const person of graph.cast.suspects){const actor=flow.actorFor(person.id)?.getSceneObject();const parent=actor||room.getSceneObject();
      const mark=worldLines(parent,"RoomscriptSuspectGrid_"+person.id,[[new vec3(-18,3,-18),new vec3(18,3,18)],[new vec3(-18,3,18),new vec3(18,3,-18)]],this.chalk.clone(),2,vec3.up()).getSceneObject();
      if(!actor)mark.getTransform().setLocalPosition(new vec3(marks[person.id][0],0,marks[person.id][2]));mark.enabled=false;this.suspectMarks.set(person.id,mark);this.generated.push(mark);
    }
    this.order=`);
 return sub(s,'this.crosses.forEach((cross,id)=>cross.enabled=state.grid.suspects.includes(id));','this.crosses.forEach((cross,id)=>cross.enabled=state.grid.suspects.includes(id));this.suspectMarks.forEach((mark,id)=>mark.enabled=state.grid.suspects.includes(id));');
});
stage('RoomscriptClueLeafScenario.ts',s=>{
 s=sub(s,'expect(engine.snapshot().grid.suspects.includes("S1")).toBe(false);','expect(engine.snapshot().grid.suspects.includes("S1")).toBe(false);expect(findSceneObjectByName("RoomscriptSuspectGrid_S1").enabled).toBe(false);');
 return sub(s,'expect(engine.snapshot().grid.suspects.includes("S1")).toBe(true);','expect(engine.snapshot().grid.suspects.includes("S1")).toBe(true);expect(findSceneObjectByName("RoomscriptSuspectGrid_S1").enabled).toBe(true);');
});
writeFileSync(folder+'manifest.json',JSON.stringify({status:'staged only',files},null,2));console.log(JSON.stringify(files.map(f=>f.name)));
