import{readFileSync,writeFileSync,mkdirSync}from'node:fs';import{createHash}from'node:crypto';const folder='Tooling/staging/run7/wren-brief/';mkdirSync(folder,{recursive:true});const files=[];
function sub(s,a,b){if(!s.includes(a))throw Error('Missing '+a.slice(0,70));return s.replace(a,b);}
function stage(name,edit){const before=readFileSync('Assets/Scripts/Engine/game/'+name,'utf8'),after=edit(before);writeFileSync(folder+name,after);files.push({name,sourceSha256:createHash('sha256').update(before).digest('hex'),stagedSha256:createHash('sha256').update(after).digest('hex')});}
stage('WrenKnowledge.ts',s=>{
 s=sub(s,'knowledge:PlayerKnowledge):KnowledgeBrief','knowledge:PlayerKnowledge,version:1|2=2):KnowledgeBrief');
 s=sub(s,'const factOptions:WrenOption[]=facts.map(f=>({id:"fact:"+f.id,kind:"fact",text:f.canonical!,factIds:[f.id],statementIds:[]}));',`// v1 stays byte-compatible with recorded WrenSpoken tapes. Only v2 is offered to new models.
  const factOptions:WrenOption[]=facts.map(f=>{
    let text=f.canonical!;
    if(version===2&&/\\b(I|my|mine|me|we|our|ours)\\b/i.test(text)){
      const observed=graph.evidence.find(e=>knowledge.evidenceIds.includes(e.id)&&e.proves.includes(f.id)&&e.proves.every(id=>admitted.has(id)));
      const owner=graph.cast.suspects.find(person=>person.id===f.args.who);
      text=observed?.canonical||(owner?owner.name+': "'+text+'"':"The recorded detail reads: "+text);
    }
    return {id:(version===2?"v2:":"")+"fact:"+f.id,kind:"fact",text,factIds:[f.id],statementIds:[]};
  });`);
 s=sub(s,'const summary=factOptions.slice(-3);',`const incidental=new Set(facts.filter(f=>/_BASELINE$/.test(f.id)||f.args.prop==="identity").map(f=>f.id));
  const summary=(version===1?factOptions:factOptions.filter(option=>!incidental.has(option.factIds[0]))).slice(-3);`);
 s=sub(s,'{id:"summary:"+hashHex(summary.map(f=>f.id).join("|")),kind:"summary",','{id:(version===2?"v2:":"")+"summary:"+hashHex(summary.map(f=>f.id).join("|")),kind:"summary",');
 return sub(s,':"We have no certified evidence yet. What would you like to inspect?",',':version===2&&factOptions.length?"We have confirmed a few personal details. What could establish where everyone was?":"We have no certified evidence yet. What would you like to inspect?",');
});
stage('Reducer.ts',s=>sub(s,'admitWrenChoice(buildKnowledgeBrief(graph,previous.knowledge),{optionId:action.optionId})','admitWrenChoice(buildKnowledgeBrief(graph,previous.knowledge,action.optionId.startsWith("v2:")?2:1),{optionId:action.optionId})'));
// A pure test-only copy resolves imports to current Engine; Lens source remains untouched.
writeFileSync(folder+'WrenKnowledge.testable.ts',readFileSync(folder+'WrenKnowledge.ts','utf8').replaceAll('../core/','../../../../Assets/Scripts/Engine/core/'));
writeFileSync(folder+'Reducer.testable.ts',readFileSync(folder+'Reducer.ts','utf8').replaceAll('from "../','from "../../../../Assets/Scripts/Engine/').replaceAll('from "./','from "../../../../Assets/Scripts/Engine/game/').replace('../../../../Assets/Scripts/Engine/game/WrenKnowledge','./WrenKnowledge.testable'));
writeFileSync(folder+'manifest.json',JSON.stringify({status:'staged only',files},null,2));console.log(JSON.stringify(files.map(f=>f.name)));
