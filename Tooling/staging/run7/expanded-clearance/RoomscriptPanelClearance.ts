/** Lift a presentation panel only; its support/object anchor is never modified.
 * Actual transformed corners include all inherited scales and rotations.
 */
export function raisePanelAboveSurface(panel:SceneObject,width:number,height:number,surfaceY:number,clearance=3):number {
  const transform=panel.getTransform(),matrix=transform.getWorldTransform();
  const lowest=Math.min(...[-1,1].flatMap(x=>[-1,1].map(y=>matrix.multiplyPoint(new vec3(x*width/2,y*height/2,0)).y)));
  const lift=Math.max(0,surfaceY+clearance-lowest);
  if(lift>0)transform.setWorldPosition(transform.getWorldPosition().add(new vec3(0,lift,0)));
  return lift;
}
