/** Run 8 Director/film hygiene: LEAF draws its banner and diagnostic report on its own root cameras.
 * The package is read-only, so film mode switches those roots off. Test results stay in the logs.
 */
const LEAF_OVERLAY_ROOTS=["LeafDebugUICamera","LeafDiagnosticReportCamera","ThirdPersonCam"];
export function hideLeafOverlays():number {
  let hidden=0;
  for(let i=0;i<global.scene.getRootObjectsCount();i++){const root=global.scene.getRootObject(i);
    if(root.enabled&&LEAF_OVERLAY_ROOTS.includes(root.name)){root.enabled=false;hidden++;}}
  return hidden;
}
