import {LOCAL_BRIDGE_SESSION} from "./Content/LocalBridgeSession";
/** Preview-only HTTPS transport. The provider key lives exclusively in Tooling. */
export function localBridgeAvailable():boolean {return global.deviceInfoSystem.isEditor()&&/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(LOCAL_BRIDGE_SESSION.url)&&LOCAL_BRIDGE_SESSION.token.length>30;}
export async function localBridgePost(route:"scan"|"complete"|"locate"|"input-next",data:unknown):Promise<any>{
  if(!localBridgeAvailable())throw new Error("local_bridge_unavailable");
  const internet:InternetModule=require("LensStudio:InternetModule");
  const response=await internet.fetch(LOCAL_BRIDGE_SESSION.url+"/"+route,{method:"POST",headers:{"Content-Type":"application/json","X-Roomscript-Session":LOCAL_BRIDGE_SESSION.token},body:JSON.stringify(data)});
  if(response.status!==200)throw new Error("local_bridge_response_"+response.status);return response.json();
}
