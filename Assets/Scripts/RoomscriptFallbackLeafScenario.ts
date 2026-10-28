import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptLlmClient} from "./RoomscriptLlmClient";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {AnswerPipeline} from "./Engine/ai/AnswerPipeline";
import {LlmError} from "./Engine/ai/LlmPort";
import {TapeClient} from "./Engine/ai/Tape";
import {heroLineBank} from "./Content/HeroLineBank";

/** Simulate a primary outage, then exercise the real OpenAI strict-schema transport. */
@component export class RoomscriptFallbackLeafScenario extends Scenario {
  async run():Promise<void> {
    await sleep(1500);
    const client=findSceneObjectByName("RoomscriptLlmClient").getComponent(RoomscriptLlmClient.getTypeName()) as RoomscriptLlmClient;
    const engine=findSceneObjectByName("RoomscriptEngine").getComponent(RoomscriptEngineBridge.getTypeName()) as RoomscriptEngineBridge;
    const graph=engine.caseGraph();engine.dispatch({type:"Ask",suspect:"S2",topic:"where@22:30"});
    const recorder=new TapeClient({mode:"RECORD",clock:client.clock,live:client,emit:event=>engine.dispatch(event),log:line=>console.log(line)});
    const pipeline=new AnswerPipeline({clock:client.clock,scheduler:client.scheduler,model:{provider:"gemini",model:"gemini-2.5-flash"},lineBank:heroLineBank,
      llm:{complete:(request,token)=>request.provider==="gemini"?Promise.reject(new LlmError("unavailable")):recorder.complete(request,token)}});
    const result=await pipeline.start({graph,state:engine.snapshot(),suspect:"S2",kind:"free",topic:"where@22:30",question:"Where were you at 22:30?"}).promise;
    expect(result.attempts).toBe(2);expect(result.origin).toBe("model");
    engine.dispatch({type:"LineSpoken",suspect:"S2",key:"fallback-live",answer:result.answer});
    expect(engine.snapshot().events.slice(-1)[0].type).toBe("lineSpoken");
    console.log("OPENAI_FALLBACK|"+JSON.stringify({latencyMs:result.latencyMs,attempts:result.attempts,rejections:result.rejectionCount,admitted:true}));
  }
}
