import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {PanelUI} from "./RoomscriptPanelUI";
/** Passive question surface; emits intent, never chooses truth or spends time. */
@component export class RoomscriptChipBarUI extends BaseScriptComponent {
  @ui.group_start("Settings")
  @input @hint("Panel width cm") @widget(new SliderWidget(40,60,1)) width:number=46;
  @input @hint("Text scale") @widget(new SliderWidget(1,2.5,0.1)) fontScale:number=1.6;
  @input('vec4','{1,0.94,0.84,1}') @hint("Person label color") @widget(new ColorWidget()) ink:vec4;
  @ui.group_end
  readonly onQuestion=new Event<string>();
  private view:PanelUI;private person:Text;private topic:Text;private labels:Text[]=[];private keys:string[]=[];
  build():void {if(this.view)return;this.view=new PanelUI(this.getSceneObject(),this.width,22,this.fontScale,this.ink);
    this.person=this.view.text("Suspect","MARGUERITE VALE",3,"title");
    this.topic=this.view.text("Topic","Asking about: whereabouts",2.5,"small");
    this.labels=this.view.buttons([{id:"Question 1",label:"Where were you?"},{id:"Question 2",label:"Your name"}],id=>this.onQuestion.invoke(this.keys[id==="Question 1"?0:1]||id));
    this.labels.push(...this.view.buttons([{id:"Question 3",label:"Your brooch"},{id:"Ask anything",label:"Ask anything"}],id=>this.onQuestion.invoke(id==="Question 3"?(this.keys[2]||id):"free")));
  }
  setPerson(name:string):void {this.person.text=name.toUpperCase();}
  setTopic(label:string):void {this.topic.text="Asking about: "+label;}
  setQuestions(items:{topic:string;label:string}[]):void {this.keys=items.map(i=>i.topic);items.slice(0,3).forEach((item,i)=>this.labels[i].text=item.label);}
  show(value:boolean):void {this.view.show(value);}
}
