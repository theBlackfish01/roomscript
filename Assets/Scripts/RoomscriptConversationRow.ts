import {uiObject} from "./RoomscriptPanelUI";
import {glyphButton,glyphTexture,GlyphButton,IVORY} from "./RoomscriptGlyphUI";
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout";
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem";
import {FlexDirection,FlexAlign,FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes";
export type ConversationChoice={id:string;label:string;picture?:Texture;choose:()=>void};
/** One UIKit surface, reused in place for every conversation choice. */
export class RoomscriptConversationRow {
  readonly root:SceneObject;
  private content:SceneObject;private actions:SceneObject;private showButton:GlyphButton;
  private menus=new Map<string,{root:SceneObject;buttons:GlyphButton[];items:ConversationChoice[]}>();
  private mode="row";private wanted=false;private blocked=false;
  constructor(private owner:BaseScriptComponent,parent:SceneObject,ask:()=>void,show:()=>void,accuse:()=>void){
    this.root=uiObject(parent,"RoomscriptConversationRow");this.root.createComponent("Component.Canvas");
    this.actions=this.container("Actions",true,35,6);
    this.add(this.actions,"Ask","Ask",11,6,ask,glyphTexture("ask"));
    this.showButton=this.add(this.actions,"Show","Show",11,6,show,glyphTexture("object"));
    this.add(this.actions,"Accuse","Accuse",11,6,accuse,glyphTexture("lie"));
    this.root.enabled=false;
  }
  private container(name:string,row:boolean,width:number,height:number):SceneObject {
    const root=uiObject(this.root,name),layout=root.createComponent(FlexLayout.getTypeName()) as FlexLayout;
    layout.autoDiscoverItemsOnStart=false;layout.onInitialized.add(()=>{layout.width=width;layout.height=height;layout.direction=row?FlexDirection.Row:FlexDirection.Column;layout.alignItems=FlexAlign.Center;layout.justifyContent=FlexJustify.Center;layout.columnGap=1;layout.rowGap=.8;});return root;
  }
  private add(parent:SceneObject,id:string,label:string,w:number,h:number,choose:()=>void,picture:Texture):GlyphButton {
    const button=glyphButton(parent,id,w,h,()=>{if(!this.blocked)choose();},IVORY);button.set(picture,label);
    if(parent===this.actions){for(let i=0;i<button.root.getChildrenCount();i++){const child=button.root.getChild(i);if(child.name==="Glyph icon")child.enabled=false;}button.word.layoutRect=Rect.create(-w/2+.5,w/2-.5,-1.5,1.5);button.word.getSceneObject().getTransform().setLocalPosition(new vec3(0,0,.7));button.word.horizontalAlignment=HorizontalAlignment.Center;button.word.sizeToFit=true;button.word.size=28;}
    const item=button.root.createComponent(FlexItem.getTypeName()) as FlexItem;item.overrideWidth=w;item.overrideHeight=h;item.flexGrow=0;item.flexShrink=0;
    (parent.getComponent(FlexLayout.getTypeName()) as FlexLayout).addItems([item]);return button;
  }
  choices(mode:string,items:ConversationChoice[]):void {
    this.close();this.mode=mode;this.actions.enabled=false;
    const key=mode+":"+items.length;let menu=this.menus.get(key);
    if(!menu){
      menu={root:this.container(mode,false,40,(items.length+1)*6.8),buttons:[],items};
      const group=menu;
      items.forEach((item,i)=>group.buttons.push(this.add(group.root,item.id,item.label,40,6,()=>{const choose=group.items[i].choose;this.close();choose();},item.picture||glyphTexture("ask"))));
      this.add(group.root,"Back to actions","Back",40,6,()=>this.close(),glyphTexture("more"));this.menus.set(key,group);
    }
    menu.items=items;menu.buttons.forEach((button,i)=>{button.root.name=items[i].id;button.set(items[i].picture||glyphTexture("ask"),items[i].label);});
    this.content=menu.root;this.content.enabled=true;this.sync();
  }
  // Keep reusable targets alive through SIK's complete release/hover-exit sequence.
  close():void {if(this.content&&!isNull(this.content))this.content.enabled=false;this.content=null;this.mode="row";this.actions.enabled=true;}
  canShow(value:boolean):void {this.showButton.button.enabled=value;this.showButton.word.textFill.color=value?IVORY:new vec4(.45,.42,.38,1);}
  show(value:boolean):void {this.wanted=value;this.sync();}
  speaking(value:boolean):void {this.blocked=value;this.sync();}
  private sync():void {this.root.enabled=this.wanted&&!this.blocked;}
  diagnostics(){return {mode:this.mode,visible:this.root.enabled,wanted:this.wanted,blocked:this.blocked};}
}
