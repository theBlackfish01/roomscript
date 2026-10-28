import {RoomscriptCaseLidUI} from "./RoomscriptCaseLidUI";
import {RoomscriptChipBarUI} from "./RoomscriptChipBarUI";
import {RoomscriptVerbBarUI} from "./RoomscriptVerbBarUI";
import {RoomscriptNotepadUI} from "./RoomscriptNotepadUI";
import {RoomscriptEvidenceWalletUI} from "./RoomscriptEvidenceWalletUI";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
/** Scene wiring only. Engine bridge will own all case state; UI receives values/events. */
@component export class RoomscriptMain extends BaseScriptComponent {
  @ui.group_start("References")
  @input @hint("Case HUD") caseLid:RoomscriptCaseLidUI;
  @input @hint("Question chips") chips:RoomscriptChipBarUI;
  @input @hint("Statement and verbs") verbs:RoomscriptVerbBarUI;
  @input @hint("Notebook") notebook:RoomscriptNotepadUI;
  @input @hint("Evidence wallet") wallet:RoomscriptEvidenceWalletUI;
  @input @hint("Audio cues and music") audio:RoomscriptAudio;
  @input @hint("Deterministic case owner") engine:RoomscriptEngineBridge;
  @input @hint("Production question and speech flow") interrogation:RoomscriptInterrogationController;
  @ui.group_end
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.start());}
  private start():void {
    if(!this.caseLid||!this.chips||!this.verbs||!this.notebook||!this.wallet||!this.audio||!this.engine){print("Roomscript: authored references not wired");return;}
    this.caseLid.build();this.chips.build();this.verbs.build();this.notebook.build();this.wallet.build();
    this.engine.onState.add(state=>this.caseLid.setCounters(state.clockMinutes-state.elapsedMinutes,state.pips,state.hunches));
    this.engine.initialize();
    this.caseLid.onAction.add(action=>{if(action==="Audio cue"){this.caseLid.setStatus("Cue: "+this.audio.previewNext());return;}
      this.caseLid.show(false);this.chips.show(false);this.verbs.show(false);this.notebook.show(action==="Notebook");this.wallet.show(action==="Evidence");this.audio.play("ChalkScratch");});
    const close=()=>{this.notebook.show(false);this.wallet.show(false);this.caseLid.show(true);this.chips.show(true);this.verbs.show(true);};
    this.notebook.onClose.add(close);this.wallet.onClose.add(close);
    this.interrogation?.initialize();
    console.log("Roomscript: production interrogation ready");
  }
}
