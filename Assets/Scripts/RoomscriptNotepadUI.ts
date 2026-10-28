import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {PanelUI,wrapText} from "./RoomscriptPanelUI";
/** Passive notebook tabs. Never derives exclusions from hidden case truth. */
@component export class RoomscriptNotepadUI extends BaseScriptComponent {
  @input @hint("Panel width cm") @widget(new SliderWidget(40,60,1)) width:number=46;
  @input @hint("Text scale") @widget(new SliderWidget(1,2.5,0.1)) fontScale:number=1.6;
  @input('vec4','{0.93,0.96,1,1}') @hint("Chalk lettering") @widget(new ColorWidget()) ink:vec4;
  readonly onClose=new Event<void>();private view:PanelUI;private body:Text;private grid="No exclusions yet.";private statements="No statements filed.";private tab="Grid";
  build():void {if(this.view)return;this.view=new PanelUI(this.getSceneObject(),this.width,54,this.fontScale,this.ink);
    this.view.text("Notebook title","DETECTIVE'S NOTEBOOK",4,"title");
    this.view.buttons([{id:"Grid",label:"Grid"},{id:"Statements",label:"Statements"}],id=>{this.tab=id;this.render();});
    this.body=this.view.text("Notebook entries","WHO / WHERE / WITH WHAT\nNo exclusions yet.",31,"small");
    this.view.buttons([{id:"Close notebook",label:"Close"}],()=>this.onClose.invoke());this.show(false);}
  setEntries(grid:string,statements:string):void {this.grid=grid;this.statements=statements;this.render();}
  private render():void {if(this.body)this.body.text=wrapText(this.tab==="Grid"?"WHO / WHERE / WITH WHAT\n"+this.grid:this.statements,42);}
  show(value:boolean):void {this.view.show(value);}
}
