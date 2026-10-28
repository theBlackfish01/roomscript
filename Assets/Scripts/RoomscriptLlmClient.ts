import {OpenAI} from "RemoteServiceGateway.lspkg/HostedExternal/OpenAI";
import {Gemini} from "RemoteServiceGateway.lspkg/HostedExternal/Gemini";
import {RemoteServiceGatewayCredentials,AvaliableApiTypes} from "RemoteServiceGateway.lspkg/RemoteServiceGatewayCredentials";
import {CancellationToken,ClockPort,LlmError,LlmPort,LlmRequest,LlmResponse} from "./Engine/ai/LlmPort";
import {Scheduler} from "./Engine/ai/Scheduler";
import {geminiRequest,openAIRequest,providerError} from "./Engine/ai/ProviderRequests";
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
  hasCredentials(provider:"openai"|"gemini"):boolean {
    const token=RemoteServiceGatewayCredentials.getApiToken(provider==="openai"?AvaliableApiTypes.OpenAI:AvaliableApiTypes.Google);
    return !!token && token.length>20 && !token.includes("[INSERT");
  }
  async complete(request:LlmRequest,cancellation?:CancellationToken):Promise<LlmResponse> {
    cancellation?.throwIfCancelled();if(this.forceOffline)throw new LlmError("unavailable");
    if(!this.hasCredentials(request.provider))throw new LlmError("unauthenticated");this.requests++;
    try {
      let content:string;
      if(request.provider==="openai") {
        const response=await OpenAI.chatCompletions(openAIRequest(request));
        content=response.choices[0]?.message.content as string;
      } else {
        const response=await Gemini.models(geminiRequest(request));
        content=response.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("");
      }
      cancellation?.throwIfCancelled();if(typeof content!=="string"||!content.trim())throw new LlmError("invalid_response");
      return {content,model:request.model};
    } catch(error) {
      throw providerError(error);
    }
  }
}
