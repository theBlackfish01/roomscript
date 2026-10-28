import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptLlmClient} from "./RoomscriptLlmClient";
import {RoomscriptTts} from "./RoomscriptTts";
import {RoomscriptSuspectActor} from "./RoomscriptSuspectActor";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {TapeClient} from "./Engine/ai/Tape";
import {answerRequest} from "./Engine/ai/Prompts";
import {buildFactSheet} from "./Engine/perf/FactSheetBuilder";
import {validateLine} from "./Engine/perf/LineValidator";
import {withDeadline} from "./Engine/ai/Deadlines";
/** Real gateway RECORD → offline REPLAY, validator and speech playback integration. */
@component export class RoomscriptAiLeafScenario extends Scenario {
  async run():Promise<void> {
    await sleep(1500);
    const client=findSceneObjectByName("RoomscriptLlmClient").getComponent(RoomscriptLlmClient.getTypeName()) as RoomscriptLlmClient;
    const engine=findSceneObjectByName("RoomscriptEngine").getComponent(RoomscriptEngineBridge.getTypeName()) as RoomscriptEngineBridge;
    const tts=findSceneObjectByName("RoomscriptTts").getComponent(RoomscriptTts.getTypeName()) as RoomscriptTts;
    const actor=findSceneObjectByName("RoomscriptSuspectSlot").getComponent(RoomscriptSuspectActor.getTypeName()) as RoomscriptSuspectActor;
    engine.dispatch({type:"Ask",suspect:"S2",topic:"where@22:30"});
    const sheet=buildFactSheet(engine.caseGraph(),engine.snapshot(),"S2");
    const request=answerRequest(sheet,"Where were you at 22:30?",{provider:"gemini",model:"gemini-2.5-flash"});
    const record=new TapeClient({mode:"RECORD",clock:client.clock,live:client,emit:event=>engine.dispatch(event),log:line=>print(line)});
    const response=await withDeadline(token=>client.scheduler.submit("live",t=>record.complete(request,t),token).promise,12000,client.clock);
    const validated=validateLine(response.content,sheet,engine.caseGraph());
    expect(validated.ok).toBe(true);
    const before=client.requestCount();client.forceOffline=true;
    const replay=new TapeClient({mode:"REPLAY",clock:client.clock,entries:record.snapshot(),emit:event=>engine.dispatch(event),replayLatency:0});
    const repeated=await replay.complete(request);expect(repeated.content).toBe(response.content);expect(client.requestCount()).toBe(before);client.forceOffline=false;
    let maxJaw=0;const monitor=this.createEvent("UpdateEvent");monitor.bind(()=>maxJaw=Math.max(maxJaw,actor.diagnostics().jaw));
    const line=validated.answer!.line;
    await tts.speak(line);this.removeEvent(monitor);
    expect(tts.diagnostics().played).toBeGreaterThan(0);expect(maxJaw).toBeGreaterThan(0.01);
    client.forceOffline=true;await tts.speak(line);expect(tts.diagnostics().hits).toBeGreaterThan(0);
    await tts.speak("This uncached phrase must use subtitles.");expect(tts.diagnostics().fallback).toBeGreaterThan(0);client.forceOffline=false;
    print("AI_CHECK|record_replay_equal|speech_played|jaw="+maxJaw+"|cache_hit|offline_subtitle_fallback");
  }
}
