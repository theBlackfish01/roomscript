import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {MemoryCardView,MemoryCardData} from "./RoomscriptMemoryCardView";
/** Passive evidence wallet; selection IDs come from observed engine evidence only. */
@component export class RoomscriptEvidenceWalletUI extends BaseScriptComponent {
  @input @hint("Panel width cm") @widget(new SliderWidget(40,60,1)) width:number=46;
  @input @hint("Text scale") @widget(new SliderWidget(1,2.5,0.1)) fontScale:number=1.6;
  @input('vec4','{1,0.42,0.35,1}') @hint("Truth lettering") @widget(new ColorWidget()) ink:vec4;
  readonly onClose=new Event<void>();readonly onSelect=new Event<string>();readonly onShown=new Event<void>();readonly onCardChanged=new Event<string>();private view:MemoryCardView;private entries:{id:string;text:string}[]=[];private index=0;
  private resolveCard:((id:string)=>MemoryCardData|null)|null=null;
  build():void {if(this.view)return;this.view=new MemoryCardView(this.getSceneObject(),{
    textName:"Evidence card",expandName:"Expand evidence",closeName:"Close evidence",previousName:"Previous evidence",nextName:"Next evidence",useName:"Use evidence",
    onPrevious:()=>this.next(-1),onNext:()=>this.next(1),onClose:()=>this.onClose.invoke(),onUse:()=>{const entry=this.entries[this.index];if(entry)this.onSelect.invoke(entry.id);}
  });this.show(false);}
  setCardResolver(resolve:(id:string)=>MemoryCardData|null):void {this.resolveCard=resolve;this.render();}
  setEntries(entries:{id:string;text:string}[]):void {const old=this.entries[this.index]?.id;this.entries=entries;const retained=entries.findIndex(entry=>entry.id===old);this.index=retained>=0?retained:Math.min(this.index,Math.max(0,entries.length-1));this.render();}
  private next(delta:number):void {if(!this.entries.length)return;this.index=(this.index+delta+this.entries.length)%this.entries.length;this.render();this.onCardChanged.invoke(this.entries[this.index].id);}
  private render():void {const entry=this.entries[this.index];this.view?.set(entry?this.resolveCard?.(entry.id)||null:null);}
  show(value:boolean):void {if(value){this.render();this.view?.expand(false);}this.getSceneObject().enabled=value;if(value)this.onShown.invoke();}
  cardDiagnostics():{id:string|null;expanded:boolean;authored:boolean}{return this.view?.diagnostics()||{id:null,expanded:false,authored:false};}
}
