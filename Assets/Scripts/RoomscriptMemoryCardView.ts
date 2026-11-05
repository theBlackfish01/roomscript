import {PanelUI,uiObject,wrapText} from "./RoomscriptPanelUI";
export interface MemoryCardData {id:string;title:string;caption:string;texture:Texture;icon:Texture;authored:boolean;}
/** One admitted memory, progressively disclosed. No engine actions or hidden-data lookup. */
export class MemoryCardView {
  private collapsed:SceneObject;private expanded:SceneObject;private title:Text;private caption:Text;
  private image:Material;private icon:Material;private data:MemoryCardData|null=null;private isExpanded=false;
  constructor(readonly root:SceneObject,options:{textName:string;expandName:string;closeName:string;previousName:string;nextName:string;useName?:string;onPrevious:()=>void;onNext:()=>void;onClose:()=>void;onUse?:()=>void}){
    this.collapsed=uiObject(root,"Collapsed memory");this.expanded=uiObject(root,"Expanded memory");
    const small=new PanelUI(this.collapsed,44,34,1.35,new vec4(1,.94,.84,1));
    this.title=small.buttons([{id:options.expandName,label:"Filed memory"}],()=>this.expand(true),12)[0];
    this.icon=cardImage(this.title.getSceneObject().getParent(),"Memory role icon",requireAsset("../Art/Run7/RoleWitness.png") as Texture,6,6,new vec3(-17,0,1));
    const full=new PanelUI(this.expanded,50,76,1.1,new vec4(1,.94,.84,1));
    const artRow=full.text("Admitted memory artwork","",27,"small");
    this.image=cardImage(artRow.getSceneObject().getParent(),"Memory artwork",requireAsset("../Art/Run7/MemoryPhoto.png") as Texture,21,26);
    this.caption=full.text(options.textName,"",22,"small");
    const controls=(ui:PanelUI)=>{const items=[{id:options.previousName,label:"Previous"},...(options.useName?[{id:options.useName,label:"Use evidence"}]:[]),{id:options.nextName,label:"Next"}];
      ui.buttons(items,id=>{if(id===options.previousName)options.onPrevious();else if(id===options.nextName)options.onNext();else options.onUse?.();},9);
      ui.buttons([{id:options.closeName,label:"Close"}],options.onClose,9);
    };controls(small);controls(full);this.expand(false);
  }
  set(data:MemoryCardData|null):void {const retain=this.isExpanded&&!!data&&data.id===this.data?.id;this.data=data;this.title.text=data?.title||"No memory yet";this.caption.text=wrapText(data?.caption||"No memory has surfaced yet.",35);if(data){this.image.mainPass.baseTex=data.texture;this.icon.mainPass.baseTex=data.icon;}this.expand(retain);}
  expand(value:boolean):void {this.isExpanded=value&&!!this.data;this.collapsed.enabled=!this.isExpanded;this.expanded.enabled=this.isExpanded;}
  diagnostics():{id:string|null;expanded:boolean;authored:boolean}{return {id:this.data?.id||null,expanded:this.isExpanded,authored:!!this.data?.authored};}
}
export function cardImage(parent:SceneObject,name:string,texture:Texture,width:number,height:number,position=new vec3(0,0,.6)):Material {
  const object=uiObject(parent,name);object.getTransform().setLocalPosition(position);
  const screen=object.createComponent("Component.ScreenTransform") as ScreenTransform;screen.anchors=Rect.create(0,0,0,0);screen.offsets=Rect.create(-width/2,width/2,-height/2,height/2);
  const image=object.createComponent("Component.Image") as Image,material=(requireAsset("../RoomscriptProbeImage.mat") as Material).clone();
  material.mainPass.baseTex=texture;material.mainPass.baseColor=new vec4(1,1,1,1);material.mainPass.depthTest=true;material.mainPass.depthWrite=false;material.mainPass.twoSided=true;image.clearMaterials();image.addMaterial(material);return material;
}
