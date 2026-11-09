import {describe,expect,it} from "vitest";
import {SpeechPlayback} from "../../../Assets/Scripts/Engine/perf/SpeechPlayback";
describe("native speech completion",()=>{
  it("keeps ownership while playback continues beyond caption/estimated end times",()=>{
    const playback=new SpeechPlayback();
    expect(playback.observe(true,false,0)).toBe("waiting");
    expect(playback.observe(true,false,4240)).toBe("waiting");
    expect(playback.observe(true,false,5450)).toBe("waiting");
    expect(playback.observe(false,true,5500)).toBe("completed");
  });
  it("does not let a delayed previous finish callback cut off a playing clip",()=>{
    const playback=new SpeechPlayback();
    expect(playback.observe(true,true,20)).toBe("waiting");
    expect(playback.observe(true,true,3000)).toBe("waiting");
    expect(playback.observe(false,true,4000)).toBe("completed");
  });
  it("waits for a late finish signal after the playing flag clears",()=>{
    const playback=new SpeechPlayback();
    playback.observe(true,false,0);
    expect(playback.observe(false,false,3800)).toBe("waiting");
    expect(playback.observe(false,true,3900)).toBe("completed");
  });
  it("bounds a missing start or stuck native player and accepts short clips",()=>{
    expect(new SpeechPlayback().observe(false,false,3001)).toBe("timeout");
    expect(new SpeechPlayback().observe(false,true,30)).toBe("completed");
    const playback=new SpeechPlayback();playback.observe(true,false,0);
    expect(playback.observe(true,false,60001)).toBe("timeout");
  });
  it("handles Preview's latched EOF only after the whole native file has had time to play",()=>{
    const playback=new SpeechPlayback();
    expect(playback.observe(true,false,200,5400,5400)).toBe("waiting");
    expect(playback.observe(true,false,4240,5400,5400)).toBe("waiting");
    expect(playback.observe(true,false,5400,5400,5400)).toBe("waiting");
    expect(playback.observe(true,false,5650,5400,5390)).toBe("completed");
    expect(new SpeechPlayback().observe(true,false,5650,5400,3000)).toBe("waiting");
  });
});
