import {OpenAI} from "RemoteServiceGateway.lspkg/HostedExternal/OpenAI";
import {RoomscriptLlmClient} from "./RoomscriptLlmClient";
import {AdmittedSpeech} from "./Engine/ai/LiveSpeechAdmission";
import {allowModelTransport} from "./Engine/ai/ModelPolicy";
import {CancellationToken,LlmError} from "./Engine/ai/LlmPort";
import {withDeadline} from "./Engine/ai/Deadlines";
/** Scoped playback asset only: this never generates words or dispatches gameplay actions. */
export async function synthesizeAdmittedSpeech(client:RoomscriptLlmClient,ticket:AdmittedSpeech,voice:string,allowed:()=>boolean,parent?:CancellationToken):Promise<AudioTrackAsset>{
  if(!allowed()||!ticket.text.trim()||!allowModelTransport("free",client.stageMode,client.forceOffline)||!client.hasCredentials("openai"))throw new LlmError("unavailable");
  const track=await withDeadline(token=>client.scheduler.submit("live",async()=>{
    token.throwIfCancelled();if(!allowed()||client.forceOffline)throw new LlmError("cancelled");
    return OpenAI.speech({model:"gpt-4o-mini-tts",voice:voice as any,input:ticket.text,instructions:ticket.scope==="wren"?"A calm detective companion. Read only the supplied words, clearly and concisely.":"A restrained theatrical suspect. Read only the supplied words with quiet tension.",response_format:"mp3"});
  },token).promise,8000,client.clock,parent);
  parent?.throwIfCancelled();if(!allowed()||client.forceOffline)throw new LlmError("cancelled");return track;
}
