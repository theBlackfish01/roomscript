import {OpenAI} from "RemoteServiceGateway.lspkg/HostedExternal/OpenAI";
import {Gemini} from "RemoteServiceGateway.lspkg/HostedExternal/Gemini";
import {CancellationToken,ClockPort,LlmError,LlmPort,LlmRequest,LlmResponse} from "./Engine/ai/LlmPort";
import {Scheduler} from "./Engine/ai/Scheduler";
import {geminiResponseSchema} from "./Engine/ai/ProviderSchema";
/** Gateway-only transport. Authentication stays in RSG; deadlines never release pending transport slots. */
@component export class RoomscriptLlmClient extends BaseScriptComponent implements LlmPort {
  forceOffline=false;private requests=0;
  readonly clock:ClockPort={nowMs:()=>getTime()*1000,after:(ms,callback)=>{
    const e=this.createEvent("DelayedCallbackEvent");let pending=true;
    e.bind(()=>{pending=false;this.removeEvent(e);callback();});e.reset(ms/1000);
    return ()=>{if(pending){pending=false;this.removeEvent(e);}};
  }};
  readonly scheduler=new Scheduler(this.clock,4);
  onAwake():void {this.createEvent("OnDestroyEvent").bind(()=>this.scheduler.dispose());}
  requestCount():number{return this.requests;}
  async complete(request:LlmRequest,cancellation?:CancellationToken):Promise<LlmResponse> {
    cancellation?.throwIfCancelled();if(this.forceOffline)throw new LlmError("unavailable");this.requests++;
    try {
      let content:string;
      if(request.provider==="openai") {
        const response=await OpenAI.chatCompletions({model:request.model,temperature:request.temperature??0,messages:request.messages,
          ...(request.schema?{response_format:{type:"json_schema" as const,json_schema:{name:"roomscript",strict:true,schema:request.schema}}}:{})});
        content=response.choices[0]?.message.content as string;
      } else {
        const response=await Gemini.models({model:request.model,type:"generateContent",body:{
          contents:[{role:"user",parts:[{text:request.messages.map(m=>m.role.toUpperCase()+":\n"+m.content).join("\n\n")}]}],
          generationConfig:{temperature:request.temperature??0,...(request.schema?{responseMimeType:"application/json",responseSchema:geminiResponseSchema(request.schema)}:{})}}});
        content=response.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("");
      }
      cancellation?.throwIfCancelled();if(typeof content!=="string"||!content.trim())throw new LlmError("invalid_response");
      return {content,model:request.model};
    } catch(error) {
      if(error instanceof LlmError)throw error;const message=String(error);
      if(/429|quota|rate.limit/i.test(message))throw new LlmError("rate_limit");
      if(/unauthenticated|unauthorized|401/i.test(message))throw new LlmError("unauthenticated");
      throw new LlmError("unavailable");
    }
  }
}
