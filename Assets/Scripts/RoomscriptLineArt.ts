// Run 8 "engraved light" line art: thin square tubes readable from any angle on an additive display.
// Box construction pattern adapted from CLAD mesh-builder-scripting (Apache-2.0, see NOTICE).
export type Segment=[vec3,vec3];
export function tinted(base:Material,color:vec4):Material {const m=base.clone();m.mainPass.baseColor=color;return m;}
/** One RenderMeshVisual of square tubes (4 open sides per segment). */
export function lineTubes(parent:SceneObject,name:string,segments:Segment[],material:Material,thickness=.5):RenderMeshVisual {
  const root=global.scene.createSceneObject(name);root.setParent(parent);
  const b=new MeshBuilder([{name:"position",components:3},{name:"normal",components:3},{name:"texture0",components:2}]);b.topology=MeshTopology.Triangles;b.indexType=MeshIndexType.UInt16;
  const h=thickness/2;let base=0;
  for(const [a,c] of segments){const dir=c.sub(a);if(dir.length<1e-4)continue;const d=dir.normalize();
    let u=Math.abs(d.y)<.9?d.cross(vec3.up()).normalize():d.cross(vec3.right()).normalize();const v=d.cross(u).normalize();u=u.uniformScale(h);const w=v.uniformScale(h);
    const ring=[u.add(w),u.sub(w),u.uniformScale(-1).sub(w),u.uniformScale(-1).add(w)];
    for(let s=0;s<4;s++){const p=ring[s],q=ring[(s+1)%4],n=p.add(q).normalize();
      for(const corner of [a.add(p),a.add(q),c.add(q),c.add(p)])b.appendVerticesInterleaved([corner.x,corner.y,corner.z,n.x,n.y,n.z,0,0]);
      b.appendIndices([base,base+1,base+2,base,base+2,base+3]);base+=4;}
    if(base>60000)break;}
  const visual=root.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;visual.mesh=b.getMesh();visual.mainMaterial=material;b.updateMesh();return visual;
}
const v3=(x:number,y:number,z:number)=>new vec3(x,y,z);
export function boxEdges(w:number,h:number,d:number,c=vec3.zero()):Segment[] {
  const x=w/2,y=h/2,z=d/2,p=[v3(-x,-y,-z),v3(x,-y,-z),v3(x,-y,z),v3(-x,-y,z),v3(-x,y,-z),v3(x,y,-z),v3(x,y,z),v3(-x,y,z)].map(q=>q.add(c));
  return [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].map(([i,j])=>[p[i],p[j]] as Segment);
}
/** Rectangle in a plane: "xy" (facing +z) or "xz" (lying flat, facing +y). */
export function rectEdges(w:number,h:number,c=vec3.zero(),plane:"xy"|"xz"="xy"):Segment[] {
  const x=w/2,y=h/2,p=plane==="xy"?[v3(-x,-y,0),v3(x,-y,0),v3(x,y,0),v3(-x,y,0)]:[v3(-x,0,-y),v3(x,0,-y),v3(x,0,y),v3(-x,0,y)];
  return p.map((q,i)=>[q.add(c),p[(i+1)%4].add(c)] as Segment);
}
export function circleEdges(r:number,n:number,c=vec3.zero(),plane:"xy"|"xz"="xy",from=0,to=Math.PI*2):Segment[] {
  const pts:vec3[]=[];for(let i=0;i<=n;i++){const a=from+(to-from)*i/n;pts.push(plane==="xy"?v3(Math.cos(a)*r,Math.sin(a)*r,0).add(c):v3(Math.cos(a)*r,0,Math.sin(a)*r).add(c));}
  return pts.slice(1).map((p,i)=>[pts[i],p] as Segment);
}
export function polyline(points:vec3[],closed=false):Segment[] {const out:Segment[]=points.slice(1).map((p,i)=>[points[i],p] as Segment);if(closed&&points.length>2)out.push([points[points.length-1],points[0]]);return out;}
/** Flat world-space text (no backing). */
export function flatText(parent:SceneObject,name:string,value:string,size:number,color:vec4,font:"title"|"body"="title",width=40,height=8):Text {
  const o=global.scene.createSceneObject(name);o.setParent(parent);const t=o.createComponent("Component.Text") as Text;t.text=value;t.size=size;t.textFill.color=color;t.depthTest=true;
  t.font=(font==="title"?requireAsset("../Art/Fonts/Anton-Regular.ttf"):requireAsset("../Art/Fonts/CourierPrime-Regular.ttf")) as Font;
  t.horizontalAlignment=HorizontalAlignment.Center;t.verticalAlignment=VerticalAlignment.Center;t.horizontalOverflow=HorizontalOverflow.Shrink;t.verticalOverflow=VerticalOverflow.Shrink;t.sizeToFit=true;t.layoutRect=Rect.create(-width/2,width/2,-height/2,height/2);return t;
}
