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
  private more:Text;private view:PanelUI;private person:Text;private topic:Text;private labels:Text[]=[];private keys:string[]=[];
  build():void {if(this.view)return;this.view=new PanelUI(this.getSceneObject(),this.width,24,this.fontScale,this.ink);
    this.person=this.view.text("Suspect","MARGUERITE VALE",5,"title");
    this.topic=this.view.text("Topic","Asking about: whereabouts",4,"small");
    this.labels=this.view.buttons([{id:"Question 1",label:"Where were you?"},{id:"Question 2",label:"Your name"}],id=>this.onQuestion.invoke(this.keys[id==="Question 1"?0:1]||id),4);
    this.labels.push(...this.view.buttons([{id:"Question 3",label:"Your brooch"},{id:"Ask anything",label:"Ask anything"}],id=>this.onQuestion.invoke(id==="Question 3"?(this.keys[2]||id):"free"),4));
    this.more=this.view.buttons([{id:"More questions",label:"More 1/1"}],()=>this.onQuestion.invoke("more"),4)[0];
  }
  setPerson(name:string):void {this.person.text=name.toUpperCase();}
  setTopic(label:string):void {this.topic.text="Asking about: "+label;}
  setQuestions(items:{topic:string;label:string}[]):void {this.keys=items.map(i=>i.topic);for(let i=0;i<3;i++){this.labels[i].text=items[i]?.label||"";this.labels[i].getSceneObject().getParent().enabled=!!items[i];}}
  setPage(page:number,total:number):void {this.more.text="More "+(page+1)+"/"+total;this.more.getSceneObject().getParent().enabled=total>1;}
  topics():string[]{return this.keys.slice();}
  show(value:boolean):void {this.view.show(value);}
}
