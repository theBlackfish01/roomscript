import {LlmRequest} from "./LlmPort";
import {geminiResponseSchema} from "./ProviderSchema";

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
