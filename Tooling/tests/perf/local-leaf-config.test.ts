import {describe,it,expect} from "vitest";
import {localLeafConfig} from "../../../Assets/Scripts/Engine/perf/LocalLeafConfig";
const defaults={seed:"7",__leaf__timeout_secs:"600",__leaf__diagnostic_policy:"fallback",__leaf__log_level:"INFO",__leaf__diagnostic_report_duration_ms:"-1"};
const config=(json="{}",id="registered")=>localLeafConfig(id,json,["registered"],defaults);
describe("Preview local LEAF transport configuration",()=>{
  it("retains scenario defaults and forces bounded strict diagnostics",()=>{expect(config()).toEqual({...defaults,__leaf__timeout_secs:"240",__leaf__diagnostic_policy:"fail-fast"});});
  it("accepts registered string overrides and shorter timeouts",()=>{expect(config('{"seed":"1041","__leaf__timeout_secs":"120"}')).toMatchObject({seed:"1041",__leaf__timeout_secs:"120"});});
  it("rejects unregistered scenarios, malformed JSON and unknown/non-string overrides",()=>{for(const json of ['[]','null','{"unknown":"x"}','{"seed":7}','{'])expect(()=>config(json)).toThrow();expect(()=>config('{}','other')).toThrow();});
  it("cannot weaken strictness or escape the timeout bound",()=>{for(const seconds of ['-1','0','241','600','Infinity','1.5'])expect(()=>config(JSON.stringify({__leaf__timeout_secs:seconds}))).toThrow();expect(()=>config('{"__leaf__diagnostic_policy":"fallback"}')).toThrow();});
});
