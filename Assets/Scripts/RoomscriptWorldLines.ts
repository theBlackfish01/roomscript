/** Small unlit world-space strokes, shared by case presentation adapters. */
export function worldLines(parent:SceneObject,name:string,segments:[vec3,vec3][],material:Material,width=.8,normal=vec3.forward()):RenderMeshVisual {
  const root=global.scene.createSceneObject(name);root.setParent(parent);const mesh=new MeshBuilder([{name:"position",components:3},{name:"normal",components:3},{name:"texture0",components:2}]);mesh.topology=MeshTopology.Triangles;mesh.indexType=MeshIndexType.UInt16;
  const vertices:number[]=[],indices:number[]=[];
  segments.forEach(([a,b],index)=>{let side=b.sub(a).cross(normal);if(side.length<.01)side=vec3.right();side=side.normalize().uniformScale(width/2);
    [a.sub(side),a.add(side),b.add(side),b.sub(side)].forEach((p,i)=>vertices.push(p.x,p.y,p.z,0,0,1,i<2?0:1,i===0||i===3?0:1));const n=index*4;indices.push(n,n+1,n+2,n,n+2,n+3);});
  mesh.appendVerticesInterleaved(vertices);mesh.appendIndices(indices);const visual=root.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;visual.mesh=mesh.getMesh();visual.mainMaterial=material;mesh.updateMesh();return visual;
}
export function dottedSegment(a:vec3,b:vec3,count:number):[vec3,vec3][] {return Array.from({length:count},(_,i)=>[vec3.lerp(a,b,i/count),vec3.lerp(a,b,(i+.55)/count)] as [vec3,vec3]);}
