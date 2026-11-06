import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {glyphButton,glyphTexture,GlyphButton,IVORY} from "./RoomscriptGlyphUI";
import {questionGlyph} from "./Engine/perf/GlyphTokens";
/** Passive question surface; emits intent, never chooses truth or spends time.
 * Run 8: a column of three small glyph tokens beside the suspect's shoulder, plus a "more" glyph.
 * Interactable names ("Question 1..3", "More questions") are unchanged for LEAF.
 */
@component export class RoomscriptChipBarUI extends BaseScriptComponent {
  @ui.group_start("Settings")
  @input @hint("Panel width cm (legacy; tokens use tokenWidth)") @widget(new SliderWidget(40,60,1)) width:number=46;
  @input @hint("Text scale (legacy)") @widget(new SliderWidget(1,2.5,0.1)) fontScale:number=1.6;
  @input('vec4','{1,0.94,0.84,1}') @hint("Token ink") @widget(new ColorWidget()) ink:vec4;
  @ui.group_end
  readonly onQuestion=new Event<string>();
  /** About 2.2 deg tall at the 1.4 m conversation spot. */
  readonly tokenWidth=13;readonly tokenHeight=5;
  private built=false;private tokens:GlyphButton[]=[];private more:GlyphButton;private keys:string[]=[];private labels:string[]=[];private person="";
  build():void {if(this.built)return;this.built=true;const root=this.getSceneObject();root.createComponent("Component.Canvas");
    const step=this.tokenHeight+1.3;
    for(let i=0;i<3;i++){const index=i;const token=glyphButton(root,"Question "+(i+1),this.tokenWidth,this.tokenHeight,()=>this.onQuestion.invoke(this.keys[index]),this.ink||IVORY);token.root.getTransform().setLocalPosition(new vec3(0,step*(1.5-i),.6));this.tokens.push(token);}
    this.more=glyphButton(root,"More questions",this.tokenWidth*.62,this.tokenHeight*.8,()=>this.onQuestion.invoke("more"),this.ink||IVORY);this.more.root.getTransform().setLocalPosition(new vec3(-this.tokenWidth*.19,step*-1.45,.6));this.more.set(glyphTexture("more"),"More");
  }
  setPerson(name:string):void {this.person=name;}
  setTopic(_label:string):void {}
  setQuestions(items:{topic:string;label:string}[]):void {this.build();this.keys=items.map(i=>i.topic);this.labels=items.map(i=>i.label);
    for(let i=0;i<3;i++){const item=items[i];this.tokens[i].root.enabled=!!item;if(item){const glyph=questionGlyph(item.topic,item.label);this.tokens[i].set(glyphTexture(glyph.icon),glyph.word);}}}
  setPage(page:number,total:number):void {this.build();this.more.word.text=total>1?"More":"";this.more.root.enabled=total>1;}
  topics():string[]{return this.keys.slice();}
  /** Full wording of the visible tokens (diagnostics and Wren tips; never rendered as a slab). */
  questionLabels():string[]{return this.labels.slice();}
  show(value:boolean):void {this.build();this.getSceneObject().enabled=value;}
}
