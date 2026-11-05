import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {PanelUI,wrapText} from "./RoomscriptPanelUI";
/** Passive question surface; emits intent, never chooses truth or spends time. */
@component export class RoomscriptChipBarUI extends BaseScriptComponent {
  @ui.group_start("Settings")
  @input @hint("Panel width cm") @widget(new SliderWidget(40,60,1)) width:number=46;
  @input @hint("Text scale") @widget(new SliderWidget(1,2.5,0.1)) fontScale:number=1.6;
  @input('vec4','{1,0.94,0.84,1}') @hint("Person label color") @widget(new ColorWidget()) ink:vec4;
  @ui.group_end
  readonly onQuestion=new Event<string>();
  private more:Text;private view:PanelUI;private person:Text;private topic:Text;private labels:Text[]=[];private keys:string[]=[];
  build():void {if(this.view)return;this.view=new PanelUI(this.getSceneObject(),this.width,43,this.fontScale,this.ink);
    this.person=this.view.text("Suspect","MARGUERITE VALE",5,"title");
    this.topic=this.view.text("Topic","",1,"small");
    for(let i=0;i<3;i++)this.labels.push(...this.view.buttons([{id:"Question "+(i+1),label:""}],()=>this.onQuestion.invoke(this.keys[i]),9));
    this.more=this.view.buttons([{id:"More questions",label:"More"}],()=>this.onQuestion.invoke("more"),6)[0];
  }
  setPerson(name:string):void {this.person.text=name.toUpperCase();}
  setTopic(label:string):void {this.topic.text="";}
  setQuestions(items:{topic:string;label:string}[]):void {this.keys=items.map(i=>i.topic);for(let i=0;i<3;i++){this.labels[i].text=wrapText(items[i]?.label||"",25);this.labels[i].getSceneObject().getParent().enabled=!!items[i];}}
  setPage(page:number,total:number):void {this.more.text="More "+(page+1)+"/"+total;this.more.getSceneObject().getParent().enabled=total>1;}
  topics():string[]{return this.keys.slice();}
  show(value:boolean):void {this.view.show(value);}
}
