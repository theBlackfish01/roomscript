import {it,expect,vi} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {heroLineBank} from "../../../Assets/Scripts/Content/HeroLineBank";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {AnswerPipeline} from "../../../Assets/Scripts/Engine/ai/AnswerPipeline";
import {Scheduler} from "../../../Assets/Scripts/Engine/ai/Scheduler";
import {LlmError} from "../../../Assets/Scripts/Engine/ai/LlmPort";
import {performanceRef} from "../../../Assets/Scripts/Engine/perf/ReferenceIds";
import {FakeClock,deferred,flush} from "./helpers";
it("stage mode answers free questions immediately without a transport or filler",async()=>{
  const clock=new FakeClock(),complete=vi.fn(async()=>{throw new Error("Network forbidden");}),filler=vi.fn(),graph=createHeroCase();
  const pipeline=new AnswerPipeline({clock,scheduler:new Scheduler(clock),llm:{complete},model:{provider:"gemini",model:"test"},lineBank:heroLineBank,preferAuthored:()=>true});
  const result=await pipeline.start({graph,state:createGameState(graph),suspect:"S2",question:"Where were you?",kind:"free",topic:"where@22:30"},{filler}).promise;
  expect(result).toMatchObject({origin:"line-bank",attempts:0,latencyMs:0});expect(result.answer.cites).not.toContain("none");expect(complete).not.toHaveBeenCalled();clock.advance(7000);expect(filler).not.toHaveBeenCalled();
});
it("a missing Google credential still permits an authenticated OpenAI fallback",async()=>{
  const clock=new FakeClock(),graph=createHeroCase(),complete=vi.fn().mockRejectedValueOnce(new LlmError("unauthenticated")).mockResolvedValueOnce({content:JSON.stringify({topic:"where@22:30",cites:[performanceRef("a","C_VALE_ALIBI_0")],line:"I was in the Kitchen making tea at 22:30.",emotion:"guarded"})});
  const pipeline=new AnswerPipeline({clock,scheduler:new Scheduler(clock),llm:{complete},model:{provider:"gemini",model:"test"},lineBank:heroLineBank});
  const result=await pipeline.start({graph,state:createGameState(graph),suspect:"S2",question:"Where?",kind:"free",topic:"where@22:30"}).promise;
  expect(result.origin).toBe("model");expect(complete.mock.calls.map(([request])=>request.provider)).toEqual(["gemini","openai"]);
});
it("losing both providers during a pending answer settles on authored prose and releases settled slots",async()=>{
  const clock=new FakeClock(),graph=createHeroCase(),pending=deferred<any>(),complete=vi.fn().mockImplementationOnce(()=>pending.promise).mockRejectedValue(new LlmError("unavailable")),scheduler=new Scheduler(clock);
  const pipeline=new AnswerPipeline({clock,scheduler,llm:{complete},model:{provider:"gemini",model:"test"},lineBank:heroLineBank});
  const task=pipeline.start({graph,state:createGameState(graph),suspect:"S2",question:"Where?",kind:"free",topic:"where@22:30"});clock.advance(200);pending.reject(new LlmError("unavailable"));await flush();const result=await task.promise;expect(result.origin).toBe("line-bank");expect(result.latencyMs).toBeLessThanOrEqual(6500);expect(scheduler.activeCount).toBe(0);
});
