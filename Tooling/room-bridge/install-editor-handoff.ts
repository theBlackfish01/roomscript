// ExecuteEditorCode body. Run once per Lens Studio session before the local bridge.
// Retain the native timer: an unreferenced editor timer is garbage-collected.
const FS=await import("LensStudio:FileSystem");
const model=pluginSystem.findInterface(Editor.Model.IModel);
const dock=pluginSystem.findInterface(Editor.Dock.IDockManager);
const state=globalThis as any;if(state.roomscriptHandoffTimer)clearInterval(state.roomscriptHandoffTimer);
state.roomscriptHandoffTimer=setInterval(()=>{try{
 const project=model.project;if(Editor.isNull(project))return;
 const file=project.projectDirectory.appended(new Editor.Path("Tooling/results/room-cast/live.json"));
 if(!FS.exists(file))return;const raw=FS.readFile(file);if(raw.length>200000)return;
 const reply=JSON.parse(raw);
 if(!/^roomcast-\d+$/.test(reply?.requestId)||Date.now()-Number(reply.requestId.slice(9))>240000)return;
 if(!["detected","cast","failed"].includes(reply.stage))return;
 for(const panel of dock.panels)if(panel.id==="Snap.Plugin.Gui.PreviewPanel") (panel as any).postMessage({type:"RoomscriptRoomCastReply",payload:reply});
}catch{}},500);
return {installed:true,transport:"local file to Preview message"};
