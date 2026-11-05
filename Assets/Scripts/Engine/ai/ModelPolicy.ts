/** Stage keeps prepared questions/audio deterministic. An explicit free question
 * may use live models without changing that mode; forceOffline always wins.
 */
export function allowModelTransport(scope:"standard"|"free",stageMode:boolean,forceOffline:boolean):boolean {
  return !forceOffline&&(!stageMode||scope==="free");
}
export function preferPreparedQuestions(mode:"preset"|"dynamic",stageMode:boolean,forceOffline:boolean,degraded:boolean):boolean {
  return mode==="preset"||stageMode||forceOffline||degraded;
}
