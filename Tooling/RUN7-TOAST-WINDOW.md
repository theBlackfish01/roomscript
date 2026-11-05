# Peripheral toast timing regression

Main observed `roomscript-memory-cards` fail with an empty toast instead of `Memory collected`: synchronous native effect calls consumed about five seconds after the old `getTime()+2.5` deadline was set. The one-second route timer could therefore clear the message before its first rendered frame.

Staged `Engine/perf/FrameVisibleWindow.ts` tracks 2.5 seconds of presentation time, debiting each update by at most 0.1 seconds. Main's Update handler reads only that pure presentation object and `getDeltaTime()`; it does not read engine state. Repeated active text renews its duration and emits no second ToastTick. Different text, or the same text after expiry, gets one tick.

`Tooling/tests/perf/frame-visible-window.test.ts` passed 3/3 against staging: long first frame, normal expiration, and renewal/replacement. The existing native memory-card assertion remains unchanged and must still pass in Lens. Long stalls intentionally extend wall-clock lifetime; this favors an opportunity to read over expiration while nothing can render.

Source guard: `Tooling/staging/run7-toast-window-source.json`. Production files remain staged until main releases imports. No Lens compile or MCP call was used by this lane.
