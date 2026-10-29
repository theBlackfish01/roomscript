import {it,expect} from "vitest";
import {tapeEntries} from "../../../Assets/Scripts/Content/Tapes/C5GeminiLatency";
import {tapeEntries as openAIEntries} from "../../../Assets/Scripts/Content/Tapes/C5OpenAIFallback";
import {reduceGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {buildFactSheet} from "../../../Assets/Scripts/Engine/perf/FactSheetBuilder";
import {validateLine} from "../../../Assets/Scripts/Engine/perf/LineValidator";
import {legacyAnswerRequest as answerRequest} from "../../mocks/legacy-answer";
import {TapeClient} from "../../../Assets/Scripts/Engine/ai/Tape";
import {FakeClock} from "./helpers";

it("replays all twenty real Gemini samples offline against the current sheet",async()=>{
  const graph=createHeroCase(),sheet=buildFactSheet(graph,createGameState(graph),"S2");
  const tape=new TapeClient({mode:"REPLAY",clock:new FakeClock(),entries:tapeEntries,replayLatency:0,emit:()=>{}});
  const questions=["Where were you at 22:30?","Were you making tea in the Kitchen?","Tell me about the brooch.","What is your name?","Could a dragon juggle the moon?"];
  for(let i=0;i<20;i++) {
    const response=await tape.complete(answerRequest(sheet,questions[i%5],{provider:"gemini",model:"gemini-2.5-flash"}));
    expect(validateLine(response.content,sheet,graph).ok).toBe(true);
  }
  expect(tapeEntries).toHaveLength(20);
});

it("replays the real OpenAI strict-schema fallback after an engine question",async()=>{
  const graph=createHeroCase();
  const state=reduceGame(graph,createGameState(graph),{seq:1,by:"P1",type:"Ask",suspect:"S2",topic:"where@22:30"});
  const sheet=buildFactSheet(graph,state,"S2");
  const tape=new TapeClient({mode:"REPLAY",clock:new FakeClock(),entries:openAIEntries,replayLatency:0,emit:()=>{}});
  const response=await tape.complete(answerRequest(sheet,"Where were you at 22:30?",{provider:"openai",model:"gpt-4o-mini"}));
  expect(validateLine(response.content,sheet,graph).ok).toBe(true);
});
