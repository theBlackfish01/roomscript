import {LlmRequest,LlmError} from "./LlmPort";
import {geminiResponseSchema,openAIResponseSchema} from "./ProviderSchema";

/** Provider payloads are pure data; the Lens adapter owns authenticated transport. */
export function geminiRequest(request:LlmRequest) {
  const system=request.messages.filter(message=>message.role==="system").map(message=>message.content).join("\n\n");
  return {model:request.model,type:"generateContent",body:{
    ...(system?{systemInstruction:{parts:[{text:system}]}}:{}),
    contents:request.messages.filter(message=>message.role!=="system").map(message=>({
      role:message.role==="assistant"?"model":"user",parts:[{text:message.content}]
    })),
    generationConfig:{temperature:request.temperature??0,maxOutputTokens:384,thinkingConfig:{thinkingBudget:0},
      ...(request.schema?{responseMimeType:"application/json",responseSchema:geminiResponseSchema(request.schema)}:{})}
  }};
}

export function openAIRequest(request:LlmRequest) {
  return {model:request.model,temperature:request.temperature??0,max_completion_tokens:384,
    messages:request.messages.map(message=>({...message})),
    ...(request.schema?{response_format:{type:"json_schema" as const,json_schema:{name:"roomscript",strict:true,schema:openAIResponseSchema(request.schema)}}}:{})};
}

/** Error text never reaches the UI or prompt; keep only the stable transport category. */
export function providerError(error:unknown):LlmError {
  if(error instanceof LlmError)return error;
  let message=String(error);
  if(error && typeof error==="object") {try{message+=" "+JSON.stringify(error);}catch{/* Ignore cyclic diagnostics. */}}
  if(/unauthenticated|unauthorized|permission.denied|\b401\b|\b403\b/i.test(message))return new LlmError("unauthenticated");
  if(/\b429\b|quota|rate.limit|resource.exhausted/i.test(message))return new LlmError("rate_limit");
  return new LlmError("unavailable");
}
