import {describe,it,expect} from "vitest";
import {captureAcceptance,CaptureMeasurement} from "../../../Assets/Scripts/Engine/perf/CaptureAcceptance";
const probe:CaptureMeasurement={requestedSeconds:5,providerSeconds:5,width:1392,height:3180,ready:true,observedFrames:150,firstAnswerSeconds:-1};
describe("native movie acceptance",()=>{
  it("rejects the observed one-frame 0.033-second recording despite positive duration",()=>{expect(captureAcceptance({...probe,providerSeconds:1/30}).issues).toContain("invalid_encoded_duration");});
  it("requires positive dimensions and a ready playback provider",()=>{expect(captureAcceptance({...probe,width:0}).ok).toBe(false);expect(captureAcceptance({...probe,height:NaN}).ok).toBe(false);expect(captureAcceptance({...probe,ready:false}).ok).toBe(false);});
  it("requires at least 150 observed frames as well as five encoded seconds",()=>{expect(captureAcceptance({...probe,observedFrames:1}).ok).toBe(false);expect(captureAcceptance(probe).ok).toBe(true);});
  it("keeps full-take 60–90-second and first-answer requirements",()=>{const full={...probe,requestedSeconds:70,providerSeconds:70,observedFrames:2100,firstAnswerSeconds:40};expect(captureAcceptance(full).ok).toBe(true);for(const duration of [59,91])expect(captureAcceptance({...full,providerSeconds:duration}).ok).toBe(false);expect(captureAcceptance({...full,firstAnswerSeconds:-1}).ok).toBe(false);expect(captureAcceptance({...full,firstAnswerSeconds:71}).ok).toBe(false);});
});
