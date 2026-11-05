import {authoredCableGeometry,CableMeshData} from "./Content/AuthoredCableGeometry";
/** Small authored tabletop cord. No case facts or scan output are changed. */
export function createAuthoredCable(anchor:SceneObject,objectId:string):SceneObject|null {
  let root:SceneObject=null;
  try{
    const cyan=(requireAsset("../Materials/RoomscriptCyan.mat") as Material).clone(),copper=(requireAsset("../Materials/RoomscriptBrass.mat") as Material).clone();
    cyan.mainPass.baseColor=new vec4(.247,.89,1,1);copper.mainPass.baseColor=new vec4(.91,.69,.29,1);
    root=global.scene.createSceneObject("RoomscriptPropVisual_"+objectId);root.setParent(anchor);root.getTransform().setLocalPosition(vec3.zero());root.getTransform().setLocalRotation(quat.quatIdentity());root.getTransform().setLocalScale(vec3.one());
    const geometry=authoredCableGeometry();
    const build=(name:string,data:CableMeshData,material:Material)=>{const child=global.scene.createSceneObject(name);child.setParent(root);child.getTransform().setLocalPosition(vec3.zero());child.getTransform().setLocalRotation(quat.quatIdentity());child.getTransform().setLocalScale(vec3.one());
      const mesh=new MeshBuilder([{name:"position",components:3},{name:"normal",components:3},{name:"texture0",components:2},{name:"color",components:4}]);mesh.topology=MeshTopology.Triangles;mesh.indexType=MeshIndexType.UInt16;
      mesh.appendVerticesInterleaved(data.vertices);mesh.appendIndices(data.indices);if(!mesh.isValid())throw Error("Invalid authored cable mesh");
      const visual=child.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;visual.mesh=mesh.getMesh();visual.mainMaterial=material;mesh.updateMesh();};
    build("Authored tabletop cord",geometry.cord,cyan);build("Copper cable sleeves",geometry.connectors,copper);
    console.log("AUTHORED_CABLE|"+JSON.stringify({object:objectId,origin:"authored",role:"fictional rope",surface:"authored Preset support",triangles:(geometry.cord.indices.length+geometry.connectors.indices.length)/3}));return root;
  }catch(error){if(root&&!isNull(root))root.destroy();console.log("AUTHORED_CABLE|"+JSON.stringify({object:objectId,fallback:"memory photograph",error:String(error)}));return null;}
}
