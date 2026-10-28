import {OpenAI} from "RemoteServiceGateway.lspkg/HostedExternal/OpenAI";
import {Gemini} from "RemoteServiceGateway.lspkg/HostedExternal/Gemini";
import {Imagen} from "RemoteServiceGateway.lspkg/HostedExternal/Imagen";
import {RoomscriptProbeLabUI} from "./RoomscriptProbeLabUI";
import {settleProbeBatch} from "./RoomscriptProbeBatch";

/** Stage A diagnostics. No model response is admitted to game truth. */
@component
export class RoomscriptProbeLab extends BaseScriptComponent {
  @ui.group_start("References")
  @input @hint("UIKit probe panel") ui: RoomscriptProbeLabUI;
  @ui.group_end
  @ui.group_start("Settings")
  @input @hint("Samples per probe and per model") samples: number = 20;
  @input @hint("Request deadline in seconds") deadlineSeconds: number = 45;
  @ui.group_end
  private busy = false;
  private audio: AudioComponent;
  private cameraTexture: Texture;
  private frameCount = 0;
  private cameraModule: CameraModule;
  private cameraProvider: CameraTextureProvider;
  private cameraRegistration: EventRegistration;

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => {
      this.audio = this.getSceneObject().createComponent("Component.AudioComponent") as AudioComponent;
      this.audio.playbackMode = Audio.PlaybackMode.LowLatency;
      this.ui.build(key => { void this.run(key); });
      print("PROBE_READY|20 samples per model|tokens never logged");
    });
    this.createEvent("OnDestroyEvent").bind(() => {
      if (this.cameraProvider && this.cameraRegistration) this.cameraProvider.onNewFrame.remove(this.cameraRegistration);
    });
  }
  private wait(seconds: number): Promise<void> {
    return new Promise(resolve => {
      const event = this.createEvent("DelayedCallbackEvent");
      event.bind(() => {this.removeEvent(event); resolve();}); event.reset(seconds);
    });
  }
  private deadline<T>(work: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const event = this.createEvent("DelayedCallbackEvent");
      event.bind(() => reject(new Error("deadline"))); event.reset(this.deadlineSeconds);
      work.then(value => {this.removeEvent(event); resolve(value);}, error => {this.removeEvent(event); reject(error);});
    });
  }
  private validate(text: string): string {
    const value = JSON.parse(text);
    if (value.line !== "I was in the study." || value.citation !== "probe-1" || Object.keys(value).sort().join(",") !== "citation,line") throw new Error("schema_mismatch");
    return "schema_valid";
  }
  private async openAI(model: string): Promise<string> {
    const response = await OpenAI.chatCompletions({model, temperature: 0,
      messages: [{role: "user", content: 'Return line exactly "I was in the study." and citation exactly "probe-1".'}],
      response_format: {type: "json_schema", json_schema: {name: "probe", strict: true,
        schema: {type: "object", properties: {line: {type: "string"}, citation: {type: "string"}}, required: ["line", "citation"], additionalProperties: false}}}});
    return this.validate(response.choices[0].message.content as string);
  }
  private async gemini(model: string): Promise<string> {
    const response = await Gemini.models({model, type: "generateContent", body: {
      contents: [{role: "user", parts: [{text: 'Return line exactly "I was in the study." and citation exactly "probe-1".'}]}],
      generationConfig: {temperature: 0, responseMimeType: "application/json", responseSchema: {
        type: "OBJECT", properties: {line: {type: "STRING"}, citation: {type: "STRING"}}, required: ["line", "citation"]}}}});
    return this.validate(response.candidates[0].content.parts.map(p => p.text || "").join(""));
  }
  private async speech(): Promise<string> {
    const track = await OpenAI.speech({model: "gpt-4o-mini-tts", voice: "onyx", input: "The room remembers.",
      instructions: "Speak quietly, like a noir detective.", response_format: "mp3"});
    this.audio.audioTrack = track; this.audio.play(1);
    return "audio_loaded;playing=" + this.audio.isPlaying();
  }
  private async imagen(): Promise<string> {
    const result = await Imagen.generateImage({model: "imagen-3.0-generate-002", body: {
      instances: [{prompt: "A single ivory envelope with a teal wax seal on a dark background, flat graphic illustration, no text, no people."}],
      parameters: {sampleCount: 1, addWatermark: false, aspectRatio: "1:1", enhancePrompt: true, language: "en", seed: 0}}});
    if (!result.predictions || !result.predictions[0]?.bytesBase64Encoded) throw new Error("no_image_or_refusal");
    const texture = await new Promise<Texture>((resolve, reject) => Base64.decodeTextureAsync(result.predictions[0].bytesBase64Encoded, resolve, () => reject(new Error("image_decode"))));
    this.ui.showTexture(texture);
    return "texture_displayed;" + texture.getWidth() + "x" + texture.getHeight();
  }
  private async camera(): Promise<string> {
    if (!this.cameraTexture) {
      this.cameraModule = require("LensStudio:CameraModule");
      const request = CameraModule.createCameraRequest();
      request.cameraId = global.deviceInfoSystem.isEditor() ? CameraModule.CameraId.Default_Color : CameraModule.CameraId.Right_Color;
      this.cameraTexture = this.cameraModule.requestCamera(request);
      this.cameraProvider = this.cameraTexture.control as CameraTextureProvider;
      this.cameraRegistration = this.cameraProvider.onNewFrame.add(() => {this.frameCount++;});
    }
    const before = this.frameCount;
    this.ui.showTexture(this.cameraTexture);
    await this.wait(0.25);
    if (this.frameCount <= before) throw new Error("no_camera_frames");
    return "frames=" + (this.frameCount - before) + ";" + this.cameraTexture.getWidth() + "x" + this.cameraTexture.getHeight();
  }
  private safeError(error: unknown): string {
    const message = String(error);
    if (/unauthenticated|unauthorized|401/i.test(message)) return "Unauthenticated";
    if (/429|quota|rate.limit/i.test(message)) return "rate_limit";
    if (/404|not.found/i.test(message)) return "not_found";
    if (/403|permission|denied/i.test(message)) return "permission_denied";
    if (/deadline/.test(message)) return "deadline";
    if (/schema|JSON/.test(message)) return "schema_invalid";
    if (/camera_frames/.test(message)) return "no_camera_frames";
    if (/configuration not supported/i.test(message)) return "configuration_not_supported";
    return "request_failed";
  }
  async run(key: string): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    print("PROBE_BEGIN|P-" + key);
    const models = key === "a" ? ["gpt-4.1-nano", "gpt-4o-mini"] : key === "b" ? ["gemini-2.5-flash", "gemini-2.0-flash"] : [""];
    try {
      for (const model of models) for (let sample = 0; sample < this.samples; sample++) {
        const name = "P-" + key + (model ? ":" + model : "");
        this.ui.status(name + " · " + (sample + 1) + "/" + this.samples);
        const started = Date.now(); let ok = true; let detail = "";
        try {
          if (key === "a") detail = await this.deadline(this.openAI(model));
          else if (key === "b") detail = await this.deadline(this.gemini(model));
          else if (key === "c") detail = await this.deadline(this.speech());
          else if (key === "d") {ok = false; detail = "unsupported_api;TextToSpeechModule_has_no_synthesis_methods_in_LS5.23";}
          else if (key === "e") detail = await this.deadline(this.imagen());
          else if (key === "f") { await this.deadline(settleProbeBatch([0,1,2,3].map(() => () => this.openAI("gpt-4o-mini")))); detail = "4_schema_valid;gpt-4o-mini"; }
          else if (key === "g") {
            try {detail = await this.deadline(this.camera());}
            catch (error) { if (sample === 0) print("PROBE_CAMERA_DIAGNOSTIC|" + String(error)); throw error; }
          }
          else throw new Error("Unknown probe");
        } catch (error) {ok = false; detail = this.safeError(error);}
        print("PROBE|" + name + "|" + (Date.now() - started) + "|" + ok + "|" + detail);
        await this.wait(key === "c" || key === "f" ? 2 : 0.1);
      }
      this.ui.status("P-" + key + " complete · results in Logger");
      print("PROBE_DONE|P-" + key);
    } finally {this.busy = false;}
  }
}
