/** One-shot world placement for optional reading modals, never a per-frame camera follower. */
export function placeReadingPanel(panel:SceneObject,camera:SceneObject,width:number,height:number,floorY:number,faces:vec3[]):void {
  const view=camera.getTransform(),eye=view.getWorldPosition(),rotation=view.getWorldRotation(),inverse=view.getInvertedWorldTransform();
  const candidates=[new vec3(0,-12,-105),new vec3(0,-65,-105),new vec3(70,-12,-105),new vec3(-70,-12,-105),new vec3(0,-80,-105),new vec3(70,-65,-105),new vec3(-70,-65,-105)];
  let chosen:vec3=null,best=Infinity;
  for(const local of candidates){
    const world=eye.add(rotation.multiplyVec3(local));
    // Reserve at least 60cm above the floor for the lower edge, even when looking at the crate.
    const up=rotation.multiplyVec3(vec3.up()),right=rotation.multiplyVec3(vec3.right());
    world.y=Math.max(world.y,floorY+60+Math.abs(up.y)*height/2+Math.abs(right.y)*width/2);
    const relative=inverse.multiplyPoint(world),depth=-relative.z;let overlaps=0;
    for(const face of faces){const f=inverse.multiplyPoint(face);if(f.z>=-1||depth<=0||-f.z<depth-24)continue;
      const ratio=depth/-f.z;if(Math.abs(f.x*ratio-relative.x)<width/2+24*ratio&&Math.abs(f.y*ratio-relative.y)<height/2+24*ratio)overlaps++;
    }
    if(overlaps<best){chosen=world;best=overlaps;}if(overlaps===0)break;
  }
  const transform=panel.getTransform();transform.setWorldScale(vec3.one());transform.setWorldRotation(rotation);transform.setWorldPosition(chosen);
}
