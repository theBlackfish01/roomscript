import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {wrapText} from "./RoomscriptPanelUI";
import {glyphButton,glyphTexture,GlyphButton,CYAN,CORAL,IVORY,BRASS} from "./RoomscriptGlyphUI";
import {verbGlyph} from "./Engine/perf/GlyphTokens";
/** Passive statement and verb surface; engine owns judgement.
 * Run 8: after an answer, the same shoulder column shows Lying? / Object / Noted / Ask glyph tokens.
 * The statement itself is spoken and subtitled; no claim slab is drawn. Names are unchanged for LEAF.
 */
@component export class RoomscriptVerbBarUI extends BaseScriptComponent {
  @input @hint("Panel width cm (legacy)") @widget(new SliderWidget(40,60,1)) width:number=46;
  @input @hint("Text scale (legacy)") @widget(new SliderWidget(1,2.5,0.1)) fontScale:number=1.6;
  @input('vec4','{0.25,0.89,1,1}') @hint("Claim color") @widget(new ColorWidget()) ink:vec4;
  readonly onVerb=new Event<string>();private built=false;private canonical="";private previewed="";private tokens=new Map<string,GlyphButton>();
  readonly tokenWidth=13;readonly tokenHeight=5;
  build():void {if(this.built)return;this.built=true;const root=this.getSceneObject();root.createComponent("Component.Canvas");const step=this.tokenHeight+1.3;
    const verbs:[string,vec4][]=[["Press",CORAL],["Object",CYAN],["Believe",BRASS],["Questions",IVORY]];
    verbs.forEach(([verb,ink],i)=>{const token=glyphButton(root,verb,verb==="Believe"||verb==="Questions"?this.tokenWidth*.8:this.tokenWidth,verb==="Believe"||verb==="Questions"?this.tokenHeight*.85:this.tokenHeight,()=>this.onVerb.invoke(verb),ink);
      const glyph=verbGlyph(verb);token.set(glyphTexture(glyph.icon),glyph.word);token.root.getTransform().setLocalPosition(new vec3(verb==="Believe"||verb==="Questions"?-this.tokenWidth*.1:0,step*(1.5-i),.6));
      token.button.onHoverEnter.add(()=>this.preview(verb));token.button.onHoverExit.add(()=>this.preview(null));this.tokens.set(verb,token);});}
  setClaim(line:string):void {this.canonical=line;this.preview(null);}
  preview(verb:string|null):void {this.previewed=wrapText((verb?verb+": ":"")+this.canonical,Math.floor(this.width-3));}
  previewText():string{return this.previewed;}
  show(value:boolean):void {this.build();this.getSceneObject().enabled=value;}
}
