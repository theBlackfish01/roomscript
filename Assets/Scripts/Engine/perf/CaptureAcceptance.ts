/** Technical native-video checks only; room composition, color, hands and audio need artifact inspection. */
export interface CaptureMeasurement {requestedSeconds:number;providerSeconds:number;width:number;height:number;ready:boolean;observedFrames:number;firstAnswerSeconds:number;}
export function captureAcceptance(value:CaptureMeasurement):{ok:boolean;issues:string[];minimumSeconds:number;minimumFrames:number} {
  const full=value.requestedSeconds>=60,minimumSeconds=full?60:5,minimumFrames=Math.ceil(value.requestedSeconds*30),issues:string[]=[];
  if(!Number.isFinite(value.requestedSeconds)||(value.requestedSeconds!==5&&!(value.requestedSeconds>=60&&value.requestedSeconds<=90)))issues.push("invalid_requested_duration");
  if(!value.ready)issues.push("provider_not_ready");
  if(!Number.isInteger(value.width)||!Number.isInteger(value.height)||value.width<=0||value.height<=0)issues.push("invalid_dimensions");
  if(!Number.isFinite(value.providerSeconds)||value.providerSeconds<minimumSeconds||(full&&value.providerSeconds>90))issues.push("invalid_encoded_duration");
  if(!Number.isInteger(value.observedFrames)||value.observedFrames<minimumFrames)issues.push("insufficient_observed_frames");
  if(full&&(!Number.isFinite(value.firstAnswerSeconds)||value.firstAnswerSeconds<0||value.firstAnswerSeconds>value.requestedSeconds))issues.push("first_answer_outside_window");
  return {ok:issues.length===0,issues,minimumSeconds,minimumFrames};
}
