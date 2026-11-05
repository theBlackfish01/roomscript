// UIKit layout helpers adapted from CLAD, Apache-2.0 (see NOTICE). Passive view primitives only.
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate";
import {InteractionPlane} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractionPlane/InteractionPlane";
import {RectangleButton} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton";
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout";
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem";
import {FlexDirection,FlexAlign,FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes";

export function uiObject(parent:SceneObject,name:string):SceneObject {
  const o=global.scene.createSceneObject(name); o.setParent(parent); o.getTransform().setLocalPosition(new vec3(0,0,0.6)); return o;
}
function flex(o:SceneObject,width:number,height:number,horizontal=false):FlexLayout {
  const layout=o.createComponent(FlexLayout.getTypeName()) as FlexLayout;
  layout.autoDiscoverItemsOnStart=false;
  layout.onInitialized.add(()=>{layout.width=width;layout.height=height;layout.direction=horizontal?FlexDirection.Row:FlexDirection.Column;
    layout.alignItems=FlexAlign.Stretch;layout.justifyContent=FlexJustify.Start;layout.rowGap=0.5;layout.columnGap=1;});
  return layout;
}
export function applyTextRole(text:Text,role:"title"|"body"|"small",scale:number):void {
  const roles={title:{size:96,weight:700},body:{size:78,weight:500},small:{size:64,weight:500}};
  text.size=roles[role].size*scale;(text as Text&{weight?:number}).weight=roles[role].weight;
  text.font=(role==="title"?requireAsset("../Art/Fonts/Anton-Regular.ttf"):requireAsset("../Art/Fonts/CourierPrime-Regular.ttf")) as Font;
}
export function wrapText(text:string,columns=42):string {
  return text.split("\n").map(paragraph=>{const rows:string[]=[];let row="";for(const word of paragraph.split(" ")){
    if(row.length+word.length+1>columns){rows.push(row);row=word;}else row+=(row?" ":"")+word;
  }rows.push(row);return rows.join("\n");}).join("\n");
}
export class PanelUI {
  private column:SceneObject;
  private layout:FlexLayout;
  constructor(readonly root:SceneObject,readonly width:number,readonly height:number,readonly scale:number,readonly color:vec4,passiveBacking=false,noBacking=false) {
    root.createComponent("Component.Canvas");
    const backing=uiObject(root,"Backing");
    if(!noBacking&&!passiveBacking&&!/Roomscript(VerbBarUI|Cast|SubtitleUI)/.test(root.name)){const plate=backing.createComponent(BackPlate.getTypeName()) as BackPlate;plate.size=new vec2(width,height);plate.style="dark";
    if(passiveBacking)plate.onInitialized.add(()=>{const plane=backing.getComponent(InteractionPlane.getTypeName()) as InteractionPlane;
      const disable=()=>{plate.interactable.enabled=false;backing.getComponent("ColliderComponent").enabled=false;plane.enabled=false;if(plane.collider)plane.collider.enabled=false;};disable();plate.createEvent("OnEnableEvent").bind(disable);
      // SIK creates the proximity collider at OnStart, after BackPlate initializes.
      const ready=plate.createEvent("UpdateEvent");ready.bind(()=>{if(plane.collider){plane.collider.enabled=false;ready.enabled=false;}});});}
    this.column=uiObject(backing,"Content");this.layout=flex(this.column,width-3,height-3);
  }
  private item(parent:SceneObject,layout:FlexLayout,width:number,height:number,name:string):SceneObject {
    const o=uiObject(parent,name),item=o.createComponent(FlexItem.getTypeName()) as FlexItem;
    item.overrideWidth=width;item.overrideHeight=height;item.flexGrow=0;item.flexShrink=0;layout.addItems([item]);return o;
  }
  private label(parent:SceneObject,value:string,width:number,height:number,role:"title"|"body"|"small"):Text {
    const o=uiObject(parent,"Label"),t=o.createComponent("Component.Text") as Text;
    t.text=value;applyTextRole(t,role,this.scale);t.depthTest=true;t.textFill.color=this.color;
    t.horizontalAlignment=HorizontalAlignment.Center;t.verticalAlignment=VerticalAlignment.Center;
    t.horizontalOverflow=HorizontalOverflow.Overflow;t.verticalOverflow=VerticalOverflow.Overflow;t.sizeToFit=true;
    t.layoutRect=Rect.create(-width/2,width/2,-height/2,height/2);return t;
  }
  text(name:string,value:string,height:number,role:"title"|"body"|"small"="body"):Text {
    return this.label(this.item(this.column,this.layout,this.width-3,height,name),value,this.width-3,height,role);
  }
  buttons(items:{id:string;label:string}[],onAction:(id:string)=>void,height=5,onHover?:(id:string|null)=>void,onDown?:(id:string)=>void):Text[] {
    const row=this.item(this.column,this.layout,this.width-3,height,"Button row"),layout=flex(row,this.width-3,height,true);
    const width=(this.width-3-(items.length-1))/items.length;
    return items.map(spec=>{
      const o=this.item(row,layout,width,height,spec.id),button=o.createComponent(RectangleButton.getTypeName()) as RectangleButton;
      button.size=new vec3(width,height,1);button.onTriggerUp.add(()=>onAction(spec.id));
      if(onDown)button.onTriggerDown.add(()=>onDown(spec.id));
      if(onHover){button.onHoverEnter.add(()=>onHover(spec.id));button.onHoverExit.add(()=>onHover(null));}
      return this.label(o,spec.label,width,height,"small");
    });
  }
  show(value:boolean):void {this.root.enabled=value;}
}
