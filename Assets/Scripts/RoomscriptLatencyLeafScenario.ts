import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptLlmClient} from "./RoomscriptLlmClient";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {TapeClient} from "./Engine/ai/Tape";
import {answerRequest} from "./Engine/ai/Prompts";
import {buildFactSheet} from "./Engine/perf/FactSheetBuilder";
import {validateLine} from "./Engine/perf/LineValidator";
import {withDeadline} from "./Engine/ai/Deadlines";

/** Diagnostic text-only sample; production still enforces the combined audio deadline. */
@component export class RoomscriptLatencyLeafScenario extends Scenario {
  async run():Promise<void> { await enterCase();
    await sleep(1500);
    const client=findSceneObjectByName("RoomscriptLlmClient").getComponent(RoomscriptLlmClient.getTypeName()) as RoomscriptLlmClient;
    const engine=findSceneObjectByName("RoomscriptEngine").getComponent(RoomscriptEngineBridge.getTypeName()) as RoomscriptEngineBridge;
    const graph=engine.caseGraph(),sheet=buildFactSheet(graph,engine.snapshot(),"S2");
    const record=new TapeClient({mode:"RECORD",clock:client.clock,live:client,emit:event=>engine.dispatch(event),log:line=>console.log(line)});
    const questions=["Where were you at 22:30?","Were you making tea in the Kitchen?","Tell me about the brooch.","What is your name?","Could a dragon juggle the moon?"];
    const rows:Array<{sample:number;ms:number;valid:boolean;codes:string[]}>=[];
    for(let i=0;i<20;i++) {
      const request=answerRequest(sheet,questions[i%questions.length],{provider:"gemini",model:"gemini-2.5-flash"});
      const start=client.clock.nowMs();
      try {
        const response=await withDeadline(token=>client.scheduler.submit("live",transport=>record.complete(request,transport),token).promise,12000,client.clock);
        const validation=validateLine(response.content,sheet,graph);
        rows.push({sample:i+1,ms:client.clock.nowMs()-start,valid:validation.ok,codes:validation.errors.map(error=>error.code)});
      } catch(error) {rows.push({sample:i+1,ms:client.clock.nowMs()-start,valid:false,codes:[String(error)]});}
      console.log("LATENCY_SAMPLE|"+JSON.stringify(rows[rows.length-1]));
      await sleep(250);
    }
    const times=rows.filter(row=>row.valid).map(row=>row.ms).sort((a,b)=>a-b);
    console.log("LATENCY_SUMMARY|"+JSON.stringify({provider:"gemini",rows,valid:times.length,p50:times[Math.ceil(times.length*.5)-1],p95:times[Math.ceil(times.length*.95)-1]}));
    expect(rows.length).toBe(20);
    expect(times.length).toBeGreaterThan(0);
  }
}
