import {ArtFrame,characterArt,frameArt,frameSizeCm,anchorCm} from "./Content/ActorArt";
import {castTexture} from "./RoomscriptCastTextures";
/** Run 9 ghosts (ART_2D): the same illustrated frames as the living cast, drawn through a tinted, translucent
 * image material, so replays, the reconstruction and the lightning ghost need no separate ghost PNGs.
 * Sizes are real scale; the feet are the pivot. Presentation only. */
export interface GhostArt {texture:Texture;width:number;height:number;feetX:number;feetY:number;hand:{x:number;y:number}|null;frame:ArtFrame}
export const GHOST_TINT={
  claim:new vec4(.45,.86,1,.5),   // what they said: cool, thin
  truth:new vec4(.86,.94,1,.68),  // where they really were
  culprit:new vec4(1,.66,.58,.8), // the culprit at the truth beats (only after a verdict)
  victim:new vec4(.72,.9,1,.6),   // Harlow's ghost
  replay:new vec4(.6,.9,1,.5)
};
export function ghostArt(role:string,frame:ArtFrame):GhostArt|null {
  const art=characterArt(role);if(!art)return null;const f=frameArt(art,frame),texture=castTexture(art.name+"/"+f.body);if(!texture)return null;
  const size=frameSizeCm(f);return {texture,width:size.w,height:size.h,feetX:f.feet.x,feetY:f.feet.y,hand:f.rightHand?anchorCm(f,f.rightHand):null,frame:art.frames[frame]?frame:"neutral"};
}
/** Image offsets (cm) for a feet-pivoted ghost: left, right, bottom, top. */
export function ghostRect(g:GhostArt):Rect {return Rect.create(-g.feetX*g.width,(1-g.feetX)*g.width,-(1-g.feetY)*g.height,g.feetY*g.height);}
/** Does this role have a frame of its own (not the neutral fallback)? */
export function hasFrame(role:string,frame:ArtFrame):boolean {const art=characterArt(role);return !!art&&!!art.frames[frame];}
/** A feet-pivoted ghost image (screen-transform Image with its own tinted material). Returns the material and
 * the screen transform, so a caller can swap frames or fade it. */
export function ghostImage(parent:SceneObject,name:string,g:GhostArt,tint:vec4):{material:Material;screen:ScreenTransform} {
  const object=global.scene.createSceneObject(name);object.setParent(parent);
  const screen=object.createComponent("Component.ScreenTransform") as ScreenTransform;screen.anchors=Rect.create(0,0,0,0);screen.offsets=ghostRect(g);
  const image=object.createComponent("Component.Image") as Image,material=(requireAsset("../RoomscriptProbeImage.mat") as Material).clone();
  material.mainPass.baseTex=g.texture;material.mainPass.baseColor=tint;material.mainPass.depthTest=true;material.mainPass.depthWrite=false;material.mainPass.twoSided=true;
  image.clearMaterials();image.addMaterial(material);return {material,screen};
}
