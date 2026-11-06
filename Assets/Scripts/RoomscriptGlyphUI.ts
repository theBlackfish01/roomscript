// Run 8 wearer UI: small UIKit Ghost (outline) tokens with a line icon and one word.
import {RectangleButton} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton";
import {applyTextRole,uiObject} from "./RoomscriptPanelUI";
import {GlyphIcon} from "./Engine/perf/GlyphTokens";

export function glyphTexture(icon:GlyphIcon):Texture {
  switch(icon){
    case "name":return requireAsset("../Art/Run8/GlyphName.png") as Texture;
    case "where":return requireAsset("../Art/Run8/GlyphWhere.png") as Texture;
    case "lie":return requireAsset("../Art/Run8/GlyphLie.png") as Texture;
    case "noted":return requireAsset("../Art/Run8/GlyphNoted.png") as Texture;
    case "object":return requireAsset("../Art/Run8/GlyphObject.png") as Texture;
    case "person":return requireAsset("../Art/Run8/GlyphName.png") as Texture;
    case "clock":return requireAsset("../Art/UI/Icons/Composure.png") as Texture;
    case "hunch":return requireAsset("../Art/UI/Icons/Hunch.png") as Texture;
    case "glove":return requireAsset("../Art/UI/Icons/Glove.png") as Texture;
    case "witness":return requireAsset("../Art/Run7/RoleWitness.png") as Texture;
    case "detail":return requireAsset("../Art/UI/Icons/Glint.png") as Texture;
    case "more":return requireAsset("../Art/Run7/More.png") as Texture;
    default:return requireAsset("../Art/Run8/GlyphAsk.png") as Texture;
  }
}
export const IVORY=new vec4(1,.94,.84,1),CYAN=new vec4(.247,.89,1,1),CORAL=new vec4(1,.42,.35,1),BRASS=new vec4(.91,.69,.29,1);
/** Flat icon quad (alpha-blended, no backing plate). Needs a Canvas ancestor; the ScreenTransform
 * offsets (not the local position) place it, relative to its parent. Returns its material. */
export function iconImage(parent:SceneObject,name:string,texture:Texture,size:number,tint=new vec4(1,1,1,1),position=new vec3(0,0,.6)):Material {
  const object=uiObject(parent,name);object.getTransform().setLocalPosition(new vec3(0,0,position.z));
  const screen=object.createComponent("Component.ScreenTransform") as ScreenTransform;screen.anchors=Rect.create(0,0,0,0);
  screen.offsets=Rect.create(position.x-size/2,position.x+size/2,position.y-size/2,position.y+size/2);
  const image=object.createComponent("Component.Image") as Image,material=(requireAsset("../RoomscriptProbeImage.mat") as Material).clone();
  material.mainPass.baseTex=texture;material.mainPass.baseColor=tint;material.mainPass.depthTest=true;material.mainPass.depthWrite=false;material.mainPass.twoSided=true;image.clearMaterials();image.addMaterial(material);return material;
}
export function label(parent:SceneObject,name:string,value:string,width:number,height:number,color:vec4,role:"title"|"body"|"small"="small",scale=1):Text {
  const o=uiObject(parent,name),t=o.createComponent("Component.Text") as Text;
  t.text=value;applyTextRole(t,role,scale);t.depthTest=true;t.textFill.color=color;
  t.horizontalAlignment=HorizontalAlignment.Center;t.verticalAlignment=VerticalAlignment.Center;
  t.horizontalOverflow=HorizontalOverflow.Shrink;t.verticalOverflow=VerticalOverflow.Shrink;t.sizeToFit=true;
  t.layoutRect=Rect.create(-width/2,width/2,-height/2,height/2);return t;
}
export interface GlyphButton {root:SceneObject;button:RectangleButton;icon:Material;word:Text;set(texture:Texture,word:string):void;}
/** One pinchable token. `name` is the LEAF-visible interactable name. Size is about 2.3 deg tall at 1.4 m. */
export function glyphButton(parent:SceneObject,name:string,width:number,height:number,onTap:()=>void,ink=IVORY):GlyphButton {
  const root=uiObject(parent,name);const button=root.createComponent(RectangleButton.getTypeName()) as RectangleButton;
  // Secondary = thin outline, transparent fill: reads on an additive display without a dark slab.
  (button as any)._themeOverride="SnapOS2";(button as any)._styleSnapOS2="Secondary";
  button.size=new vec3(width,height,.6);button.onTriggerUp.add(()=>onTap());
  const iconSize=height*.62,icon=iconImage(root,"Glyph icon",glyphTexture("ask"),iconSize,new vec4(1,1,1,1),new vec3(-width/2+height*.55,0,.7));
  const textWidth=width-height*1.15-1.2,word=label(root,"Glyph word","",textWidth,height*.62,ink,"small",.5);word.horizontalAlignment=HorizontalAlignment.Left;word.size=Math.round(height*4.4);
  word.getSceneObject().getTransform().setLocalPosition(new vec3(-width/2+height*1.1+textWidth/2,0,.7));
  return {root,button,icon,word,set:(texture,value)=>{icon.mainPass.baseTex=texture;word.text=value;}};
}
