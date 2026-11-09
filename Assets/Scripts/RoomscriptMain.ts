
import {RoomscriptAudio} from "./RoomscriptAudio";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptRoomBinding} from "./RoomscriptRoomBinding";
import {RoomscriptClosingController} from "./RoomscriptClosingController";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptWindowStorm} from "./RoomscriptWindowStorm";
import {RoomscriptWrenHints} from "./RoomscriptWrenHints";
import {RoomscriptObjectReplay} from "./RoomscriptObjectReplay";
import {RoomscriptStoryMoments} from "./RoomscriptStoryMoments";
import {RoomscriptNextGlow} from "./RoomscriptNextGlow";
import {RoomscriptFindItems} from "./RoomscriptFindItems";
import {routeSample} from "./Engine/game/RouteReplay";
import {GameState} from "./Engine/core/Types";
import {localBridgeAvailable,localBridgePost} from "./RoomscriptLocalBridge";
import {withDeadline} from "./Engine/ai/Deadlines";
import {RoomscriptRoomMap} from "./RoomscriptRoomMap";
/** Wiring for find, ask, catch. Engine actions own every observed fact and verdict. */
@component export class RoomscriptMain extends BaseScriptComponent {
 @input audio:RoomscriptAudio;
 @input engine:RoomscriptEngineBridge;
 @input interrogation:RoomscriptInterrogationController;
 storm:RoomscriptWindowStorm;wren:RoomscriptWrenHints;replays:RoomscriptObjectReplay;
 storyMoments:RoomscriptStoryMoments;nextGlow:RoomscriptNextGlow;findItems:RoomscriptFindItems;
 private state:GameState;private inputBusy=false;
 onAwake():void{this.createEvent("OnStartEvent").bind(()=>this.start());}
 private start():void{
   this.engine.initialize();this.interrogation.initialize();this.state=this.engine.snapshot();
   this.engine.onState.add(state=>this.state=state);
   this.audio.suspectPlaying=()=>this.interrogation.tts.diagnostics().playing;
   this.audio.speakerPosition=id=>{const actor=this.interrogation.actorFor(id);return actor?.getTransform().getWorldPosition().add(new vec3(0,actor.heights().face,0));};
   this.interrogation.onAccuseRequested.add(()=>RoomscriptClosingController.current?.open());
   this.audio.bindNarrative(this.engine,()=>false,id=>{const o=this.engine.graphRef().room.objects.find(o=>o.id===id);return o?this.engine.roomRoot.getTransform().getWorldTransform().multiplyPoint(new vec3(...o.pos)):undefined;});
   this.audio.onNarrationSubtitle.add(({speaker,text})=>this.interrogation.subtitles.set(speaker,text));
   this.audio.onNarrationSubtitleAligned.add(({speaker,text,fullText})=>{const s=this.interrogation.subtitles;if(s.fullText()!==fullText)s.set(speaker,fullText);s.reveal(text);});
   const room=this.engine.roomRoot.getComponent(RoomscriptRoomBinding.getTypeName()) as RoomscriptRoomBinding;
   this.storm=new RoomscriptWindowStorm(this,this.engine,this.audio);
   this.wren=new RoomscriptWrenHints(this,this.engine,(text,at)=>this.audio.hint(text,at));
   this.replays=new RoomscriptObjectReplay(this,this.engine,this.interrogation,room,(cue,at)=>this.audio.playAt(cue,at));
   this.findItems=new RoomscriptFindItems(this.engine,this.interrogation,room);
   new RoomscriptRoomMap(this,RoomscriptOpeningController.current.cast);
   this.storyMoments=new RoomscriptStoryMoments(this,this.engine,this.interrogation,this.audio);
   this.nextGlow=new RoomscriptNextGlow(this,this.engine,this.interrogation);
   this.nextGlow.blocked=()=>RoomscriptOpeningController.current?.filmMode?"film":RoomscriptClosingController.current?.diagnostics().opened?"accusation":this.audio.speechBusy()?"speech":"";
   const tick=this.createEvent("DelayedCallbackEvent");tick.bind(()=>{if(this.state&&this.engine.investigationEnabled&&!this.state.verdict){const p=this.engine.roomRoot.getTransform().getInvertedWorldTransform().multiplyPoint(this.engine.player.getTransform().getWorldPosition()),sample=routeSample(this.state,[p.x,p.y,p.z],Math.floor(getTime()*1000));if(sample)this.engine.dispatch(sample);void this.pollInput();}tick.reset(1);});tick.reset(1);
   console.log("Roomscript: find, ask, catch ready");
 }
 private async pollInput():Promise<void>{
   const f=this.interrogation;if(this.state?.verdict||f.controlsBlocked||this.inputBusy||f.diagnostics().busy||f.client.forceOffline||!localBridgeAvailable())return;
   this.inputBusy=true;try{const input=await withDeadline(()=>localBridgePost("input-next",{}),5000,f.client.clock);if(typeof input.question==="string"&&input.question.trim()&&input.target!=="wren")await f.askFree(input.question);}catch{}finally{this.inputBusy=false;}
 }
}
