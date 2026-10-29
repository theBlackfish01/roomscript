import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {PanelUI,wrapText} from "./RoomscriptPanelUI";
/** Passive evidence wallet; selection IDs come from observed engine evidence only. */
@component export class RoomscriptEvidenceWalletUI extends BaseScriptComponent {
  @input @hint("Panel width cm") @widget(new SliderWidget(40,60,1)) width:number=46;
  @input @hint("Text scale") @widget(new SliderWidget(1,2.5,0.1)) fontScale:number=1.6;
  @input('vec4','{1,0.42,0.35,1}') @hint("Truth lettering") @widget(new ColorWidget()) ink:vec4;
  readonly onClose=new Event<void>();readonly onSelect=new Event<string>();private view:PanelUI;private body:Text;private entries:{id:string;text:string}[]=[];private index=0;
  build():void {if(this.view)return;this.view=new PanelUI(this.getSceneObject(),this.width,54,this.fontScale,this.ink);
    this.view.text("Wallet title","EVIDENCE & STATEMENTS",4,"title");this.body=this.view.text("Evidence card","No evidence collected.",30,"body");
    this.view.buttons([{id:"Previous evidence",label:"Previous"},{id:"Use evidence",label:"Use evidence"},{id:"Next evidence",label:"Next"}],id=>{if(!this.entries.length)return;
      if(id==="Use evidence")this.onSelect.invoke(this.entries[this.index].id);else {this.index=(this.index+(id==="Next evidence"?1:this.entries.length-1))%this.entries.length;this.render();}});
    this.view.buttons([{id:"Close evidence",label:"Close"}],()=>this.onClose.invoke());this.show(false);}
  setEntries(entries:{id:string;text:string}[]):void {this.entries=entries;this.index=Math.min(this.index,Math.max(0,entries.length-1));this.render();}
  private render():void {if(this.body)this.body.text=this.entries.length?wrapText(this.entries[this.index].text,35):"No evidence collected.";}
  show(value:boolean):void {this.view.show(value);}
}
