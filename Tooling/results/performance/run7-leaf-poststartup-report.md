# Run 7 post-startup Preview trace

The 8 ms target is **not met**. Across 6,918 complete ProcessFrame + CoreManagerRender pairs, measured non-overlapping wall spans average **15.57 ms** (median 14.73, p90 18.49, p99 23.99). None fit within 8 ms. Mean frame-start interval is 24.56 ms, approximately 40.7 starts per second; this is not the analyzer's pooled multi-marker FPS estimate.

The worst pair is 1,928.44 ms at the beginning of the trace. Its CoreManagerRender lasts 1,864.98 ms, including Scene::Update at 1,839.18 ms. That update exposes no child spans, so the trace cannot identify the component or native call responsible. The largest separate unaccounted interval between frame work and the next frame start is 367.98 ms at trace offset 75.743 seconds. No 100-second gap appears in the captured portion.

Steady work remains dominated by Track: mean 9.39 ms within ProcessFrame's 10.66 ms. Exposed Track children account for only a small part: FaceDetectPreprocess totals3.18 seconds over3,670 calls and FaceTrack0.057 seconds over6,920 calls. CoreManagerRender averages4.91ms; nested Scene::Update averages1.20ms and RenderFrame1.42ms. Child spans are nested, not additive to their parent.

This trace started **after the LEAF transport timeout** because MCP calls serialized. It therefore misses the initial 100–173 second delay it was intended to investigate. The scheduled capture window was180 seconds, while Perfetto trace bounds cover169.959 seconds. Nearby native logs report a6,189ms score-track operation finishing02:58:40.732 PKT and a1,673ms clock-track operation finishing02:58:43.252, exceeding some corresponding captured maxima. Do not equate this trace with complete wall-clock coverage or claim it excludes native stalls. There is no scheduler data, so active CPU time and blocking time cannot be separated.

SQL results and the compact JSON summary are adjacent to this report. The152.75MB `.pftrace` must remain out of git. No Lens calls, Assets changes or tests were run as part of this analysis.
