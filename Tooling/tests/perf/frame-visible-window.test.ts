import {describe,it,expect} from "vitest";
import {FrameVisibleWindow} from "../../../Assets/Scripts/Engine/perf/FrameVisibleWindow";

describe("frame-visible presentation window",()=>{
  it("keeps a new toast visible when native calls stall its first update for five seconds",()=>{
    const window=new FrameVisibleWindow();expect(window.show("Memory collected")).toBe(true);
    expect(window.advance(5)).toBe(true);expect(window.text).toBe("Memory collected");expect(window.secondsRemaining).toBeCloseTo(2.4);
  });
  it("expires after 2.5 seconds of normal frame updates",()=>{
    const window=new FrameVisibleWindow();window.show("Memory collected");
    for(let i=0;i<149;i++)expect(window.advance(1/60)).toBe(true);
    expect(window.advance(1/60)).toBe(false);expect(window.text).toBe("");expect(window.secondsRemaining).toBe(0);
  });
  it("renews repeated text without another tick, then allows the same text after expiry",()=>{
    const window=new FrameVisibleWindow();let ticks=Number(window.show("Memory collected"));
    for(let i=0;i<20;i++)window.advance(.1);
    ticks+=Number(window.show("Memory collected"));expect(ticks).toBe(1);expect(window.secondsRemaining).toBe(2.5);
    for(let i=0;i<25;i++)window.advance(.1);
    ticks+=Number(window.show("Memory collected"));expect(ticks).toBe(2);
    expect(window.show("Statement filed")).toBe(true);expect(window.text).toBe("Statement filed");
  });
});
