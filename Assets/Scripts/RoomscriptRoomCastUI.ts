import {PanelUI,uiObject,wrapText} from "./RoomscriptPanelUI";
/** One passive UIKit toast, below eye level; never voiced or interactive. */
@component export class RoomscriptRoomCastUI extends BaseScriptComponent {
 private root:SceneObject;private text:Text;
 show(camera:SceneObject,message:string):void {
  if(!this.root){this.root=uiObject(camera,"RoomscriptRoomCastToast");this.root.getTransform().setLocalPosition(new vec3(0,-16,-110));const panel=new PanelUI(this.root,66,12,.55,new vec4(1,.94,.84,1),true);this.text=panel.text("Room casting", "",9,"body");}
  this.text.text=wrapText(message,40);this.root.enabled=true;
 }
 hide():void{if(this.root)this.root.enabled=false;}
}
