import {flatText} from "./RoomscriptLineArt";
import {uiObject} from "./RoomscriptPanelUI";
import {glyphButton,glyphTexture,GlyphButton,IVORY} from "./RoomscriptGlyphUI";
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout";
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem";
import {FlexDirection,FlexAlign,FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes";
export type ConversationChoice={id:string;label:string;picture?:Texture;choose:()=>void;hover?:(inside:boolean)=>void};
type Menu={root:SceneObject;buttons:GlyphButton[];items:ConversationChoice[];back:()=>void;more?:GlyphButton};
/** UIKit targets stay alive through the complete SIK release/hover-exit sequence. */
export class RoomscriptConversationRow {
 readonly root:SceneObject;private content:SceneObject;private actions:SceneObject;private showButton:GlyphButton;
 private menus=new Map<string,Menu>();private mode="row";private wanted=false;private blocked=false;
 private all:ConversationChoice[]=[];private page=0;private back:()=>void;
 constructor(private owner:BaseScriptComponent,parent:SceneObject,ask:()=>void,show:()=>void,accuse:()=>void){
  this.root=uiObject(parent,"RoomscriptConversationRow");this.root.createComponent("Component.Canvas");this.actions=this.container("Actions",true,35,6);
  this.add(this.actions,"Ask","Ask",11,6,ask);this.showButton=this.add(this.actions,"Show","Show",11,6,show);this.add(this.actions,"Accuse","Accuse",11,6,accuse);this.root.enabled=false;
 }
 private container(name:string,row:boolean,width:number,height:number,parent=this.root):SceneObject{
  const root=uiObject(parent,name),layout=root.createComponent(FlexLayout.getTypeName()) as FlexLayout;
  layout.autoDiscoverItemsOnStart=false;layout.onInitialized.add(()=>{layout.width=width;layout.height=height;layout.direction=row?FlexDirection.Row:FlexDirection.Column;layout.alignItems=FlexAlign.Center;layout.justifyContent=FlexJustify.Center;layout.columnGap=1;layout.rowGap=.8;});return root;
 }
 private add(parent:SceneObject,id:string,value:string,w:number,h:number,choose:()=>void,picture?:Texture):GlyphButton{
  const b=glyphButton(parent,id,w,h,()=>{if(!this.blocked)choose();},IVORY);b.set(picture||glyphTexture("ask"),value);
  for(let i=0;i<b.root.getChildrenCount();i++){const c=b.root.getChild(i);if(c.name==="Glyph icon")c.enabled=!!picture;}
  if(!picture){b.word.layoutRect=Rect.create(-w/2+.5,w/2-.5,-h*.3,h*.3);b.word.getSceneObject().getTransform().setLocalPosition(new vec3(0,0,.7));b.word.horizontalAlignment=HorizontalAlignment.Center;b.word.sizeToFit=true;b.word.size=28;}
  const item=b.root.createComponent(FlexItem.getTypeName()) as FlexItem;item.overrideWidth=w;item.overrideHeight=h;item.flexGrow=0;item.flexShrink=0;(parent.getComponent(FlexLayout.getTypeName()) as FlexLayout).addItems([item]);return b;
 }
 choices(mode:string,items:ConversationChoice[],onBack?:()=>void):void{this.close();this.mode=mode;this.all=items;this.page=0;this.back=onBack||(()=>{});this.renderChoices();}
 private renderChoices():void{
  if(this.content)this.content.enabled=false;this.actions.enabled=false;
  const pictures=this.all.some(i=>!!i.picture),pageSize=pictures?3:5,items=this.all.slice(this.page*pageSize,(this.page+1)*pageSize),key=this.mode+":"+items.length;let m=this.menus.get(key);
  if(!m){
   const root=this.container(this.mode,false,pictures?38:40,pictures?23:(items.length+1)*6.8);m={root,buttons:[],items,back:()=>{}};const menu=m;const title=flatText(root,"Choice title",this.mode==="ask"?"Ask":this.mode==="show"?"Show":this.mode,2,new vec4(1,.94,.84,1),"title",40,3);title.getSceneObject().getTransform().setLocalPosition(new vec3(0,(pictures?23:(items.length+1)*6.8)/2+3,.5));
   const group=pictures?this.container("Item pictures",true,38,15,root):root;
   if(pictures){const f=group.createComponent(FlexItem.getTypeName()) as FlexItem;f.overrideWidth=38;f.overrideHeight=15;(root.getComponent(FlexLayout.getTypeName()) as FlexLayout).addItems([f]);}
   items.forEach((item,i)=>{
    const b=this.add(group,item.id,item.label,pictures?12:40,pictures?15:6,()=>{const c=menu.items[i];this.close();c.choose();},item.picture);
    if(pictures){for(let j=0;j<b.root.getChildrenCount();j++){const child=b.root.getChild(j);if(child.name==="Glyph icon"){const screen=child.getComponent("Component.ScreenTransform") as ScreenTransform;screen.offsets=Rect.create(-4.8,4.8,-1.8,7.8);}}
     b.word.getSceneObject().getTransform().setLocalPosition(new vec3(0,-4.5,.7));b.word.layoutRect=Rect.create(-5.5,5.5,-2.5,2.5);b.word.horizontalAlignment=HorizontalAlignment.Center;b.word.sizeToFit=true;}
    b.button.onHoverEnter.add(()=>menu.items[i]?.hover?.(true));b.button.onHoverExit.add(()=>menu.items[i]?.hover?.(false));menu.buttons.push(b);
   });
   const nav=this.container("Choice navigation",true,38,6,root),f=nav.createComponent(FlexItem.getTypeName()) as FlexItem;f.overrideWidth=38;f.overrideHeight=6;(root.getComponent(FlexLayout.getTypeName()) as FlexLayout).addItems([f]);
   this.add(nav,"Back to actions","Back",18,6,()=>{const back=menu.back;this.close();back();});menu.more=this.add(nav,"More items","More",18,6,()=>this.nextPage());this.menus.set(key,menu);
  }
  m.items=items;m.back=this.back;m.more.root.enabled=this.all.length>pageSize;m.buttons.forEach((b,i)=>{b.root.name=items[i].id;b.set(items[i].picture||glyphTexture("ask"),items[i].label);});this.content=m.root;this.content.enabled=true;this.sync();
 }
 nextPage():void{const n=this.all.some(i=>!!i.picture)?3:5;this.page=(this.page+1)%Math.ceil(this.all.length/n);this.renderChoices();}
 close():void{for(const item of this.all)item.hover?.(false);if(this.content&&!isNull(this.content))this.content.enabled=false;this.content=null;this.mode="row";this.actions.enabled=true;}
 actionRoot(name:string):SceneObject|null{for(let i=0;i<this.actions.getChildrenCount();i++){const child=this.actions.getChild(i);if(child.name===name)return child;}return null;}
 canShow(value:boolean):void{this.showButton.button.enabled=value;this.showButton.word.textFill.color=value?IVORY:new vec4(.45,.42,.38,1);}
 show(value:boolean):void{this.wanted=value;this.sync();}speaking(value:boolean):void{this.blocked=value;this.sync();}
 private sync():void{this.root.enabled=this.wanted&&!this.blocked;}
 diagnostics(){return {mode:this.mode,page:this.page,visible:this.root.enabled,wanted:this.wanted,blocked:this.blocked};}
}
