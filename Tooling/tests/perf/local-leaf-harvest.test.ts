import {describe,it,expect} from "vitest";
import {harvestLocalLeaf,redact} from "../../scripts/harvest-local-leaf.mjs";
const record=(id:string,status:string)=>'I 03:20:00.000 [Assets/Scripts/Runner.ts:1] ROOMSCRIPT_LOCAL_LEAF|'+JSON.stringify({requestId:id,scenarioId:"roomscript-test",status,transport:"local-manager",strict:true,config:{seed:"7"}});
describe("local LEAF evidence harvesting",()=>{
  it("associates only each request's bounded markers and errors",()=>{
    const log=['OUTSIDE|{}',record('one','running'),'I 03:20:00.010 [Assets/Scripts/Test.ts:1] CHECK|{"passed":true}','E 03:20:00.011 Native.cpp:10 Error: example',record('one','passed'),'OUTSIDE|{}',record('two','running'),'I 03:21:00.000 [Assets/Scripts/Test.ts:2] NEXT|{"count":2}',record('two','failed'),'AFTER|{}'].join('\n');
    const runs=harvestLocalLeaf(log);expect(runs).toHaveLength(2);expect(runs[0].markers.map(m=>m.name)).toEqual(['CHECK']);expect(runs[0].errors).toHaveLength(1);expect(runs[1].markers.map(m=>m.name)).toEqual(['NEXT']);expect(runs[0].mcpTransportPass).toBe(false);expect(runs[0].evidenceLabel).toBe('LEAF strict local-manager PASS');
  });
  it("redacts credential fields and inline bearer/keys before reports",()=>{
    expect(redact({token:'private',nested:{api_key:'private'},text:['Bearer','private','sk-ant-private'].join(' ')})).toEqual({token:'[REDACTED]',nested:{api_key:'[REDACTED]'},text:'Authorization [REDACTED] [REDACTED]'});
    expect(redact('https://local/path?capability=private&token=private')).not.toContain('private');
  });
  it("does not call an orphan terminal record a complete strict pass",()=>{
    const [run]=harvestLocalLeaf(record('orphan','passed'));expect(run.scopeComplete).toBe(false);expect(run.evidenceLabel).not.toBe('LEAF strict local-manager PASS');expect(run.markers).toEqual([]);
  });
  it("retains running requests without attributing preceding markers",()=>{
    const [run]=harvestLocalLeaf('OLD|{}\n'+record('active','running')+'\nI 03:20:01.000 [Assets/Scripts/Test.ts:1] ACTIVE|{"n":1}');expect(run.latest.status).toBe('running');expect(run.markers).toHaveLength(1);
  });
});
