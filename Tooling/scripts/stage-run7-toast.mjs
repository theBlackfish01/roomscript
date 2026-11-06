import{readFileSync,writeFileSync}from'node:fs';import{createHash}from'node:crypto';const folder='Tooling/staging/run7/a6-audit/',files=[];
function sub(s,a,b){if(!s.includes(a))throw Error('Missing '+a.slice(0,70));return s.replace(a,b);}
function stage(name,edit){const before=readFileSync('Assets/Scripts/'+name,'utf8'),after=edit(before);writeFileSync(folder+name,after);files.push({name,sourceSha256:createHash('sha256').update(before).digest('hex'),stagedSha256:createHash('sha256').update(after).digest('hex')});}
stage('RoomscriptMain.ts',s=>{
 s='import {peripheralFeedback} from "./Engine/game/PeripheralFeedback";\n'+s;
 s=sub(s,'for(const e of state.events.filter(e=>e.seq===state.lastSeq)){if(e.type==="deduction")this.toast("Deduction certified");else if(e.type==="evidenceCollected")this.toast("Memory collected");else if(e.type==="objectionCorrect")this.toast("Account refuted");}','const message=peripheralFeedback(state.events,state.lastSeq);if(message)this.toast(message);');
 return sub(s,'if(!this.toastText)return;this.toastText.text=text;this.toastUntil=getTime()+2.5;this.audio.play("ToastTick");','if(!this.toastText)return;const repeated=this.toastText.text===text&&getTime()<this.toastUntil;this.toastText.text=text;this.toastUntil=getTime()+2.5;if(!repeated)this.audio.play("ToastTick");');
});
stage('RoomscriptMemoryCardLeafScenario.ts',s=>sub(s,'await tap("RoomscriptObject_O11");expect(objection.cardDiagnostics()', 'await tap("RoomscriptObject_O11");expect((findSceneObjectByName("Toast").getChild(0).getComponent("Component.Text") as Text).text).toBe("Memory collected");expect(objection.cardDiagnostics()'));
writeFileSync(folder+'toast-manifest.json',JSON.stringify({status:'staged only',files},null,2));console.log(JSON.stringify(files.map(f=>f.name)));
