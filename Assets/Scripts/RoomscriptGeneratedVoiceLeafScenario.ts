import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptCaseModes} from "./RoomscriptCaseModes";
import {EVENING_ROOM_SCAN} from "./Content/EveningRoomScan";
import {RUN7_VOICE_MANIFEST} from "./Content/Run7VoiceManifest";
import {phraseVoiceKey,resolvePhrasePlayback} from "./Engine/perf/PhrasePlayback";
/** Four actual generated answers, exact phrase order and native playback. No gateway fallback. */
@component export class RoomscriptGeneratedVoiceLeafScenario extends Scenario {
  async run(config?:ScenarioConfig):Promise<void>{
    await sleep(300);const modes=findSceneObjectByName("RoomscriptCaseModes").getComponent(RoomscriptCaseModes.getTypeName()) as RoomscriptCaseModes,opening=modes.opening,flow=opening.cast.flow,engine=flow.engine,tts=flow.tts;
    const seed=Number(config?.get("seed")||"7"),source=config?.get("source")||"file";expect([7,1041,2026].includes(seed)).toBe(true);expect(["file","recorded"].includes(source)).toBe(true);
    const offline=flow.client.forceOffline;flow.client.forceOffline=true;const hand=new DefaultLeafInteractor(),records:{text:string;voice:string;native:boolean}[]=[],summaries:any[]=[];
    const observe=()=>{if(records.length&&tts.diagnostics().playing)records[records.length-1].native=true;};
    const unsubscribe=tts.onAudioStarted.add(event=>{records.push({text:event.text,voice:event.voice,native:tts.diagnostics().playing});});
    try{
      expect(source==="file"?await modes.fromFileReply(seed):engine.configureDynamic(seed,EVENING_ROOM_SCAN).ok).toBe(true);opening.finish();await sleep(100);
      for(const suspect of engine.graphRef().cast.suspects){flow.selectSuspect(suspect.id);const index=flow.chips.topics().indexOf("whereabouts");expect(index>=0).toBe(true);const targets=findInteractablesByName("Question "+(index+1),undefined,true);expect(targets.length).toBe(1);
        const before=tts.diagnostics(),start=records.length,seq=engine.snapshot().lastSeq;await hand.trigger(targets[0]);observe();const deadline=Date.now()+55000;
        for(let i=0;i<500&&flow.diagnostics().busy&&Date.now()<deadline;i++){await sleep(50);observe();}expect(flow.diagnostics().busy).toBe(false);observe();
        const action=engine.snapshot().log.find(action=>action.seq>seq&&action.type==="LineSpoken"&&action.suspect===suspect.id);if(!action||action.type!=="LineSpoken")throw Error("Generated answer was not admitted");
        const expected=resolvePhrasePlayback(engine.phrasePlan(suspect.id,action.answer.line),(speaker,text)=>RUN7_VOICE_MANIFEST.find(record=>record.key===phraseVoiceKey(speaker,text)));expect(!!expected).toBe(true);
        const played=records.slice(start),after=tts.diagnostics();expect(played.length).toBe(expected!.length);expect(after.played-before.played).toBe(expected!.length);expect(after.fallback).toBe(before.fallback);
        played.forEach((piece,i)=>{expect(piece.voice.startsWith("bundle:"+suspect.id+":")).toBe(true);expect(piece.text).toBe(expected![i].record.text);expect(piece.native).toBe(true);});
        summaries.push({suspect:suspect.id,line:action.answer.line,segments:played.length,native:played.filter(piece=>piece.native).length});
      }
      console.log("GENERATED_VOICE_CHECK|"+JSON.stringify({seed,source,caseId:engine.graphRef().caseId,voices:summaries.length,summaries,nativeSegments:records.filter(piece=>piece.native).length,fallback:false}));
    }finally{unsubscribe();flow.cancel();engine.configurePreset();opening.finish();flow.client.forceOffline=offline;}
  }
}
