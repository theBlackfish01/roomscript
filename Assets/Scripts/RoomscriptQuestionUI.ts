import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {PanelUI,wrapText} from "./RoomscriptPanelUI";
/** Typed free question; the draft is committed once, only on Ask. */
@component export class RoomscriptQuestionUI extends BaseScriptComponent {
 @input width:number=40;@input fontScale:number=1.4;@input('vec4','{1,0.94,0.84,1}') ink:vec4;
 readonly onDraft=new Event<string>();readonly onSubmit=new Event<{question:string;topic:string}>();readonly onClose=new Event<void>();
 private view:PanelUI;private questionText:Text;private question="";private topic="unclear";
 build():void{if(this.view)return;this.view=new PanelUI(this.getSceneObject(),40,24,this.fontScale,this.ink);this.view.text("Question title","ASK YOUR OWN…",4,"title");this.questionText=this.view.text("Question draft","",10,"small");this.view.buttons([{id:"Type a question",label:"Edit"},{id:"Submit question",label:"Ask"},{id:"Close question",label:"Cancel"}],id=>{if(id==="Type a question")this.keyboard();else if(id==="Submit question"&&this.question.trim())this.onSubmit.invoke({question:this.question,topic:this.topic});else if(id==="Close question"){this.show(false);this.onClose.invoke();}});this.view.show(false);}
 review(question:string,topic:string,_choices:{topic:string;label:string}[]):void{this.build();this.question=question;this.topic=topic;this.questionText.text=wrapText(question,38);this.show(true);if(!question)this.keyboard();}
 show(value:boolean):void{this.build();this.view.show(value);}
 private keyboard():void{
  require("LensStudio:TextInputModule");const options=new TextInputSystem.KeyboardOptions();options.enablePreview=true;options.keyboardType=TextInputSystem.KeyboardType.Text;options.returnKeyType=TextInputSystem.ReturnKeyType.Done;
  let text=this.question;options.initialText=text;options.onTextChanged=(value:string)=>{text=value;};options.onReturnKeyPressed=()=>{global.textInputSystem.dismissKeyboard();if(text.trim())this.onDraft.invoke(text.slice(0,2000));};options.onError=()=>{this.questionText.text="Typing is unavailable right now.";};global.textInputSystem.requestKeyboard(options);
 }
}
