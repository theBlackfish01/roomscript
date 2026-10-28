// CCW box construction adapted from CLAD mesh-builder-scripting, Apache-2.0. See NOTICE.
/** Parametric stand-in/articulated-case geometry. Authored roots own placement; no game state. */
@component export class RoomscriptPropMesh extends BaseScriptComponent {
  @ui.group_start("References")
  @input @hint("Authored unlit surface material") material:Material;
  @ui.group_end
  @ui.group_start("Shape")
  @input @hint("Stand-in geometry") @widget(new ComboBoxWidget([new ComboBoxItem("Box","box"),new ComboBoxItem("Round","round")])) shape:string="box";
  @input @hint("Width cm") @widget(new SliderWidget(0.2,250,0.1)) width:number=10;
  @input @hint("Height cm") @widget(new SliderWidget(0.2,250,0.1)) height:number=10;
  @input @hint("Depth cm") @widget(new SliderWidget(0.2,250,0.1)) depth:number=10;
  @ui.group_end
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.build());}
  private build():void {
    if(!this.material)return;
    const b=new MeshBuilder([{name:"position",components:3},{name:"normal",components:3,normalized:true},{name:"color",components:4}]);
    b.topology=MeshTopology.Triangles;b.indexType=MeshIndexType.UInt16;
    if(this.shape==="round")this.round(b);else this.box(b);
    const visual=this.getSceneObject().createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    visual.mesh=b.getMesh();visual.mainMaterial=this.material;b.updateMesh();
  }
  private box(b:MeshBuilder):void {
    const x=this.width/2,y=this.height/2,z=this.depth/2;
    const faces=[
      [[x,-y,-z],[x,y,-z],[x,y,z],[x,-y,z],[1,0,0]],
      [[-x,-y,z],[-x,y,z],[-x,y,-z],[-x,-y,-z],[-1,0,0]],
      [[-x,y,-z],[-x,y,z],[x,y,z],[x,y,-z],[0,1,0]],
      [[-x,-y,z],[-x,-y,-z],[x,-y,-z],[x,-y,z],[0,-1,0]],
      [[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z],[0,0,1]],
      [[x,-y,-z],[-x,-y,-z],[-x,y,-z],[x,y,-z],[0,0,-1]]];
    faces.forEach((f,i)=>{for(let j=0;j<4;j++)b.appendVerticesInterleaved([...f[j],...f[4],1,1,1,1]);const q=i*4;b.appendIndices([q,q+1,q+2,q,q+2,q+3]);});
  }
  private round(b:MeshBuilder):void {
    const n=32,rx=this.width/2,rz=this.depth/2,y=this.height/2;
    for(let i=0;i<=n;i++){const a=i*2*Math.PI/n,c=Math.cos(a),s=Math.sin(a);
      b.appendVerticesInterleaved([rx*c,-y,rz*s,c,0,s,1,1,1,1,rx*c,y,rz*s,c,0,s,1,1,1,1]);}
    for(let i=0;i<n;i++){const q=2*i;b.appendIndices([q,q+1,q+3,q,q+3,q+2]);}
    for(const side of [-1,1]){const start=b.getVerticesCount();b.appendVerticesInterleaved([0,side*y,0,0,side,0,1,1,1,1]);
      for(let i=0;i<=n;i++){const a=i*2*Math.PI/n;b.appendVerticesInterleaved([rx*Math.cos(a),side*y,rz*Math.sin(a),0,side,0,1,1,1,1]);}
      for(let i=0;i<n;i++)b.appendIndices(side===1?[start,start+i+2,start+i+1]:[start,start+i+1,start+i+2]);}
  }
}
