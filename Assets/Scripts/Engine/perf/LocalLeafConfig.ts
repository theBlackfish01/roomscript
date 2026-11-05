export const LOCAL_LEAF_MAX_SECONDS=240;
/** The local harness changes transport only; parameter discovery and strict assertions remain LEAF-owned. */
export function localLeafConfig(id:string,json:string,registered:readonly string[],defaults:Record<string,string>):Record<string,string>{
  if(!id||!registered.includes(id))throw Error("Unknown registered LEAF scenario: "+id);
  const parsed:unknown=JSON.parse(json);
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error("LEAF parameters must be a JSON object of strings");
  const supplied=parsed as Record<string,unknown>;
  for(const key of Object.keys(supplied)){
    if(!Object.prototype.hasOwnProperty.call(defaults,key))throw Error("Unknown LEAF parameter: "+key);
    if(typeof supplied[key]!=="string")throw Error("LEAF parameter must be a string: "+key);
  }
  const timeout=supplied.__leaf__timeout_secs===undefined?LOCAL_LEAF_MAX_SECONDS:Number(supplied.__leaf__timeout_secs);
  if(!Number.isInteger(timeout)||timeout<1||timeout>LOCAL_LEAF_MAX_SECONDS)throw Error("Local LEAF timeout must be1–240 seconds");
  if(supplied.__leaf__diagnostic_policy!==undefined&&supplied.__leaf__diagnostic_policy!=="fail-fast")throw Error("Local LEAF requires fail-fast diagnostics");
  return {...defaults,...supplied as Record<string,string>,__leaf__timeout_secs:String(timeout),__leaf__diagnostic_policy:"fail-fast"};
}
