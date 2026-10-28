import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptLlmClient} from "./RoomscriptLlmClient";
import {RoomscriptTts} from "./RoomscriptTts";
import {RoomscriptSuspectActor} from "./RoomscriptSuspectActor";
import {RoomscriptChipBarUI} from "./RoomscriptChipBarUI";
import {RoomscriptVerbBarUI} from "./RoomscriptVerbBarUI";
import {RoomscriptSubtitleUI} from "./RoomscriptSubtitleUI";
import {RoomscriptQuestionUI} from "./RoomscriptQuestionUI";
import {Answer,GameState} from "./Engine/core/Types";
import {AnswerPipeline,AnswerTask,ChosenAnswer,InterrogationMode} from "./Engine/ai/AnswerPipeline";
import {TapeClient} from "./Engine/ai/Tape";
import {LlmError,CancellationSource} from "./Engine/ai/LlmPort";
import {buildFactSheet} from "./Engine/perf/FactSheetBuilder";
import {keywordIntent,questionChips} from "./Engine/perf/KeywordIntent";
import {performanceMode} from "./Engine/game/Reducer";
import {heroLineBank} from "./Content/HeroLineBank";

/** Production adapter. Engine actions precede performance; validated output is logged before speech. */
@component export class RoomscriptInterrogationController extends BaseScriptComponent {
  @input @hint("Deterministic case owner") engine:RoomscriptEngineBridge;
  @input @hint("Gateway transport") client:RoomscriptLlmClient;
  @input @hint("Sentence audio player") tts:RoomscriptTts;
  @input @hint("Current suspect actor") actor:RoomscriptSuspectActor;
  @input @hint("Question chip UI") chips:RoomscriptChipBarUI;
  @input @hint("Canonical statement and verbs") verbs:RoomscriptVerbBarUI;
  @input @hint("Speaker-local subtitles") subtitles:RoomscriptSubtitleUI;
  @input @hint("Free question draft and correction") questions:RoomscriptQuestionUI;
  readonly onSpeaking=new Event<{suspect:string;statement:string|null;mode:InterrogationMode;seq:number}>();
  readonly onObjectRequested=new Event<void>();
  private pipeline:AnswerPipeline;private task:AnswerTask;private warming:CancellationSource;
  private selected="S2";private revision=0;private busy=false;private last:ChosenAnswer|null=null;private lastAudioMs:number|null=null;
  private speaking:{suspect:string;statement:string|null;mode:InterrogationMode;seq:number}|null=null;
  onAwake():void {this.createEvent("OnDestroyEvent").bind(()=>{this.warming?.cancel();this.cancel();});}
  initialize():void {
    if(this.pipeline)return;this.engine.initialize();this.chips.build();this.verbs.build();this.subtitles.build();this.questions.build();
    const tape=new TapeClient({mode:"RECORD",clock:this.client.clock,live:this.client,emit:event=>this.engine.dispatch(event),log:line=>console.log(line)});
    this.pipeline=new AnswerPipeline({clock:this.client.clock,scheduler:this.client.scheduler,llm:tape,lineBank:heroLineBank,model:{provider:"gemini",model:"gemini-2.5-flash"}});
    this.chips.onQuestion.add(topic=>{if(topic==="free")this.reviewQuestion("");else void this.askChip(topic);});
    this.questions.onDraft.add(text=>this.reviewQuestion(text));
    this.questions.onSubmit.add(draft=>{this.questions.show(false);this.chips.show(true);this.verbs.show(true);void this.askFree(draft.question,draft.topic);});
    this.questions.onClose.add(()=>{this.chips.show(true);this.verbs.show(true);});
    this.verbs.onVerb.add(verb=>{if(verb==="Object"){this.onObjectRequested.invoke();return;}this.cancel();
      const state=this.engine.dispatch({type:verb==="Press"?"Press":"Believe",suspect:this.selected});
      if(verb==="Press"&&!this.rejected(state))void this.perform("Answer the detective's challenge.","chip",this.topic(state));});
    this.tts.onAudioStarted.add(event=>{if(this.speaking){this.lastAudioMs=event.latencyMs;this.onSpeaking.invoke(this.speaking);this.speaking=null;}});
    this.engine.onState.add(state=>this.render(state));this.selectSuspect(this.actor.suspect);
  }
  diagnostics():{busy:boolean;suspect:string;last:ChosenAnswer|null;audioMs:number|null;offline:boolean} {return {busy:this.busy,suspect:this.selected,last:this.last,audioMs:this.lastAudioMs,offline:this.client.forceOffline};}
  cancel():void {this.revision++;this.pipeline?.cancel();this.tts?.stop();this.busy=false;this.speaking=null;}
  selectSuspect(id:string):void {
    this.cancel();const graph=this.engine.caseGraph();if(!graph.cast.suspects.some(s=>s.id===id))throw new Error("Unknown suspect");
    this.selected=id;this.actor.suspect=id;this.actor.applyState(this.engine.snapshot());this.render(this.engine.snapshot());
    this.warming?.cancel();this.warming=new CancellationSource();void this.tts.precacheCurrent(this.warming.token);
  }
  private choices():{topic:string;label:string;question:string}[] {
    const graph=this.engine.caseGraph(),sheet=buildFactSheet(graph,this.engine.snapshot(),this.selected),person=graph.cast.suspects.find(s=>s.id===this.selected)!;
    const all=questionChips(sheet),topics=[all.find(c=>c.topic.startsWith("where@"))?.topic,person.baseline.truthTopic,person.baseline.lieTopic];
    return topics.map(topic=>all.find(c=>c.topic===topic)).filter(Boolean).map(chip=>({topic:chip!.topic,question:chip!.question,label:chip!.topic.startsWith("where@")?"Whereabouts":chip!.topic==="baseline:name"?"Your name":chip!.topic.replace("baseline:","Your ")}));
  }
  reviewQuestion(text:string):void {const graph=this.engine.caseGraph(),sheet=buildFactSheet(graph,this.engine.snapshot(),this.selected);
    this.questions.review(text,keywordIntent(text,sheet,graph).topic,this.choices());this.chips.show(false);this.verbs.show(false);}
  async askChip(topic:string):Promise<void> {const choice=this.choices().find(c=>c.topic===topic);if(choice)await this.ask(choice.question,"chip",topic);}
  async askFree(question:string,topic?:string):Promise<void> {const graph=this.engine.caseGraph(),sheet=buildFactSheet(graph,this.engine.snapshot(),this.selected);
    await this.ask(question,"free",topic??keywordIntent(question,sheet,graph).topic);}
  private async ask(question:string,kind:"chip"|"free",topic:string):Promise<void> {
    this.cancel();const state=this.engine.dispatch({type:"Ask",suspect:this.selected,topic,question});
    if(this.rejected(state)){this.subtitles.set("WREN",state.verdict?"The case is closed.":"Give this suspect some space.");return;}
    await this.perform(question,kind,topic);
  }
  private rejected(state:GameState):boolean {return state.events.some(event=>event.seq===state.lastSeq&&event.type==="rejected");}
  private topic(state:GameState):string {return this.engine.caseGraph().statements.find(s=>s.id===state.activeStatement)?.topic || "unclear";}
  async perform(question:string,kind:"chip"|"free",topic:string):Promise<void> {
    const graph=this.engine.caseGraph(),state=this.engine.snapshot(),suspect=this.selected,revision=this.revision;
    const derived=performanceMode(graph,state,suspect,topic);if(derived==="confession")return;
    const mode=derived as InterrogationMode,began=this.client.clock.nowMs();this.busy=true;this.lastAudioMs=null;
    const isCurrent=()=>revision===this.revision&&this.engine.snapshot().elapsedMinutes===state.elapsedMinutes&&this.engine.snapshot().activeStatement===state.activeStatement;
    this.task=this.pipeline.start({graph,state,suspect,question,kind,topic,mode},{
      detective:()=>{this.subtitles.set("DETECTIVE",question);this.chips.setTopic(this.choices().find(c=>c.topic===topic)?.label||topic);},
      rejected:event=>{if(event.codes.includes("unauthenticated"))this.client.forceOffline=true;},
      filler:event=>{if(isCurrent()){this.admit(event.answer,"filler");if(this.tts.cached(event.answer.line))void this.tts.speak(event.answer.line,undefined,this.task?.token,began);}}
    });
    const task=this.task;
    try {
      const chosen=await task.promise;if(!isCurrent())return;
      if(!this.admit(chosen.answer,chosen.mode))return;
      this.last=chosen;this.speaking={suspect,statement:state.activeStatement,mode:chosen.mode,seq:state.lastSeq};
      await this.tts.speak(chosen.answer.line,undefined,task.token,began);
      console.log("INTERROGATION|"+JSON.stringify({origin:chosen.origin,textMs:chosen.latencyMs,audioMs:this.lastAudioMs,rejections:chosen.rejectionCount,mode:chosen.mode}));
    } catch(error) {if(!(error instanceof LlmError)||error.code!=="cancelled")console.log("INTERROGATION|safe_fallback");}
    finally {if(revision===this.revision){this.busy=false;this.speaking=null;}}
  }
  private admit(answer:Answer,mode:InterrogationMode):boolean {
    const state=this.engine.dispatch({type:"LineSpoken",suspect:this.selected,key:"performance-"+this.revision,answer,mode});
    const spoken=state.events.find(event=>event.seq===state.lastSeq&&event.type==="lineSpoken");
    if(!spoken)return false;const person=this.engine.caseGraph().cast.suspects.find(s=>s.id===this.selected)!;
    this.subtitles.set(person.name,spoken.text!);return true;
  }
  private render(state:GameState):void {
    const graph=this.engine.caseGraph(),person=graph.cast.suspects.find(s=>s.id===this.selected)!;
    this.chips.setPerson(person.name);this.chips.setQuestions(this.choices());
    this.verbs.setClaim(state.activeSuspect===this.selected?graph.statements.find(s=>s.id===state.activeStatement)?.canonical||"Ask a question to file a statement.":"Ask a question to file a statement.");
  }
}
