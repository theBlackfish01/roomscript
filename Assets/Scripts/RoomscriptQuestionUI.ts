import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {PanelUI,wrapText} from "./RoomscriptPanelUI";
/** Question draft/review; no model call or clock charge happens until Ask is selected. */
@component export class RoomscriptQuestionUI extends BaseScriptComponent {
  @input @hint("Question review width cm") width:number=58;
  @input @hint("Question typography scale") fontScale:number=1.4;
  @input('vec4','{1,0.94,0.84,1}') @hint("Question ink") @widget(new ColorWidget()) ink:vec4;
  readonly onDraft=new Event<string>();readonly onSubmit=new Event<{question:string;topic:string}>();readonly onClose=new Event<void>();
  private view:PanelUI;private questionText:Text;private topicText:Text;private correctionLabels:Text[]=[];
  private question="";private topic="unclear";private choices:{topic:string;label:string}[]=[];
  build():void {if(this.view)return;this.view=new PanelUI(this.getSceneObject(),this.width,39,this.fontScale,this.ink);
    this.view.text("Question title","ASK ANYTHING",3,"title");
    this.questionText=this.view.text("Question draft","Choose a question or type on your Specs.",7,"small");
    this.topicText=this.view.text("Topic review","Asking about: unclear",3,"small");
    this.correctionLabels=this.view.buttons([{id:"Correct topic 1",label:"Whereabouts"},{id:"Correct topic 2",label:"Name"},{id:"Correct topic 3",label:"Personal item"}],id=>{const choice=this.choices[Number(id.slice(-1))-1];if(choice){this.topic=choice.topic;this.topicText.text="Asking about: "+choice.label;}});
    this.view.buttons([{id:"Free whereabouts",label:"Where were you?"},{id:"Free weird",label:"A strange question"}],id=>this.onDraft.invoke(id==="Free weird"?"Could a dragon juggle the moon?":"Where were you at 22:30?"));
    this.view.buttons([{id:"Type a question",label:"Type on Specs"},{id:"Submit question",label:"Ask"},{id:"Close question",label:"Cancel"}],id=>{if(id==="Type a question")this.keyboard();else if(id==="Submit question"&&this.question.trim())this.onSubmit.invoke({question:this.question,topic:this.topic});else if(id==="Close question"){this.show(false);this.onClose.invoke();}});
    this.view.show(false);
  }
  review(question:string,topic:string,choices:{topic:string;label:string}[]):void {this.build();this.question=question;this.topic=topic;this.choices=choices;
    this.questionText.text=wrapText(question,46);this.topicText.text="Asking about: "+(choices.find(c=>c.topic===topic)?.label||topic);
    choices.slice(0,3).forEach((choice,i)=>this.correctionLabels[i].text=choice.label);this.show(true);}
  show(value:boolean):void {this.build();this.view.show(value);}
  private keyboard():void {
    if(global.deviceInfoSystem.isEditor()){this.questionText.text="Use a Preview question above. On Specs, type any question here.";return;}
    require("LensStudio:TextInputModule");const options=new TextInputSystem.KeyboardOptions();
    options.enablePreview=true;options.keyboardType=TextInputSystem.KeyboardType.Text;options.returnKeyType=TextInputSystem.ReturnKeyType.Done;
    let text=this.question;options.initialText=text;
    options.onTextChanged=(value:string)=>{text=value;};options.onReturnKeyPressed=()=>{global.textInputSystem.dismissKeyboard();if(text.trim())this.onDraft.invoke(text.slice(0,2000));};
    options.onError=()=>{this.questionText.text="Keyboard unavailable. Choose a question above.";};global.textInputSystem.requestKeyboard(options);
  }
}
