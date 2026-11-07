/** Run 9 paper objects (ART_2D "Props and paper objects"): opaque textured paper (folders, newsprint, photo paper,
 * cork, the coral wax seal) from procedural textures made by Tooling/scripts/make-paper-textures.mjs.
 * Presentation only. */
export type PaperKind="FolderBack"|"FolderCover"|"WaxSeal"|"Newsprint"|"PhotoPaper"|"Cork"|"BrassPin";
export function paperTexture(kind:PaperKind):Texture {
  switch(kind){
    case "FolderBack":return requireAsset("../Art/Paper/FolderBack.png") as Texture;
    case "FolderCover":return requireAsset("../Art/Paper/FolderCover.png") as Texture;
    case "WaxSeal":return requireAsset("../Art/Paper/WaxSeal.png") as Texture;
    case "Newsprint":return requireAsset("../Art/Paper/Newsprint.png") as Texture;
    case "PhotoPaper":return requireAsset("../Art/Paper/PhotoPaper.png") as Texture;
    case "Cork":return requireAsset("../Art/Paper/Cork.png") as Texture;
    case "BrassPin":return requireAsset("../Art/Paper/BrassPin.png") as Texture;
  }
}
/** Ink colours that read as print on light paper (on the additive display they read as cut-outs in it). */
export const INK={oxblood:new vec4(.5,.1,.08,1),navy:new vec4(.1,.16,.32,1),brown:new vec4(.3,.21,.12,1),black:new vec4(.08,.07,.06,1)};
/** An opaque paper sheet: w x h cm, centred at `center` in the parent's space, facing the parent's +Z. */
export function paperQuad(parent:SceneObject,name:string,kind:PaperKind|Texture,w:number,h:number,center:vec3,tint=new vec4(1,1,1,1)):{object:SceneObject;material:Material} {
  const holder=global.scene.createSceneObject(name);holder.setParent(parent);holder.getTransform().setLocalPosition(center);
  const object=global.scene.createSceneObject(name+" image");object.setParent(holder);
  const screen=object.createComponent("Component.ScreenTransform") as ScreenTransform;screen.anchors=Rect.create(0,0,0,0);screen.offsets=Rect.create(-w/2,w/2,-h/2,h/2);
  const image=object.createComponent("Component.Image") as Image,material=(requireAsset("../RoomscriptProbeImage.mat") as Material).clone();
  material.mainPass.baseTex=typeof kind==="string"?paperTexture(kind):kind;material.mainPass.baseColor=tint;material.mainPass.depthTest=true;material.mainPass.depthWrite=true;material.mainPass.twoSided=true;
  image.clearMaterials();image.addMaterial(material);return {object:holder,material};
}
