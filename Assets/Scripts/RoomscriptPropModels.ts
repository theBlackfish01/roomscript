/** Run 9 props (ART_2D "Props and paper objects"): textured SPECS text-to-3D meshes, one per prop kind,
 * gated with analyze_glb, scaled to real size and grounded (min-Y = 0), with the lightmap baked into one
 * 512² JPEG (Tooling/scripts/repack-prop-glb.mjs). Presentation only: the room binding places them at the
 * engine's object positions. PROP_MODELS=false restores the Run 8 line drawings everywhere. */
export const PROP_MODELS=true;
export function propPrefab(kind:string):ObjectPrefab|null {
  if(!PROP_MODELS)return null;
  switch(kind){
    case "blunt":return requireAsset("../Art/Props3D/Candlestick.glb") as ObjectPrefab;
    case "light":return requireAsset("../Art/Props3D/DeskLamp.glb") as ObjectPrefab;
    case "clock":return requireAsset("../Art/Props3D/MantelClock.glb") as ObjectPrefab;
    case "kettle":return requireAsset("../Art/Props3D/Kettle.glb") as ObjectPrefab;
    case "sharp":return requireAsset("../Art/Props3D/LetterKnife.glb") as ObjectPrefab;
    case "poison":return requireAsset("../Art/Props3D/MedicineBottle.glb") as ObjectPrefab;
    case "heavy":return requireAsset("../Art/Props3D/Bookend.glb") as ObjectPrefab;
    case "cup":return requireAsset("../Art/Props3D/Mug.glb") as ObjectPrefab;
    case "screen":return requireAsset("../Art/Props3D/Recorder.glb") as ObjectPrefab;
    default:return null;
  }
}
/** Instantiate the model for a kind under parent, named like the line drawing so lifts, counts and the
 * freeze treat it the same. Returns null when the kind has no model (the caller draws lines instead). */
export function propModel(parent:SceneObject,id:string,kind:string):SceneObject|null {
  const prefab=propPrefab(kind);if(!prefab||typeof prefab.instantiate!=="function")return null;
  const root=global.scene.createSceneObject("RoomscriptPropVisual_"+id);root.setParent(parent);root.getTransform().setLocalPosition(vec3.zero());
  const model=prefab.instantiate(root);model.getTransform().setLocalPosition(vec3.zero());return root;
}
/** The evidence crate as two meshes (body and lid), sized to the authored 46 x 12 x 28 cm box so the hinge,
 * the case files and the envelope keep their recorded layout. Null when PROP_MODELS is off. */
export function cratePrefabs():{body:ObjectPrefab;lid:ObjectPrefab}|null {
  if(!PROP_MODELS)return null;
  return {body:requireAsset("../Art/Props3D/CrateBody.glb") as ObjectPrefab,lid:requireAsset("../Art/Props3D/CrateLid.glb") as ObjectPrefab};
}
