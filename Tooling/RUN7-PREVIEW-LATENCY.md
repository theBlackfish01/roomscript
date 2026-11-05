# Run 7 Preview wall-clock latency investigation

Read-only investigation, 2026-11-06. No GUI, activation/focus, Lens endpoint bypass, plugin edits, Cache edits, or Assets writes were used for this investigation.

## Evidence

- Parent observed roughly 25-second runtime queries, roughly 24 wall-seconds for a 600ms LEAF sleep, and 47 seconds from scenario list loaded to RUNS. A separate idle trace measured 395 frames / 9.98 seconds (~39.6Hz), mean ProcessFrame 10.71ms and Render 5.24ms. This does not establish the same rate during the ready gameplay phase.
- The shell process inspection showed MainWindowHandle=0 and empty MainWindowTitle after a hidden launch. This supports that the launch was hidden; it does **not** prove a throttling cause.
- Installed Lens Studio executable contains the Preview Config binder's `targetFrameRate`, with 30 Mobile / 45 SPECS / 60,90,120 PC presets. No verified background-throttling override was found in the bounded search. The generated editor.d.ts Preview module is incomplete; do not invent Config writes from string evidence.
- Installed renderer symbols refer to `Es::Engine::Widgets::OGLFrameTextureWidget`, `OGLBaseTextureWidget` and `Es::Preview::TextureRenderer`. Generic QQuickWindow hidden-window behavior is not proof about this renderer.

## LEAF transport source

Editor source: `%LOCALAPPDATA%/Snap/Lens Studio/Bundle/Plugins/[ChatTool] LEAF Plugin@5.23.0@362f6c78a8b5e47e6431049afb6a7109/dist/main.js`.

- Line 849: scenario-list retry interval 100ms. Line 1853: run list retries capped at 600. Retry timeout is cleared and subscription removed when a list response arrives (lines 895–905).
- Lines 974–1041: scenario-start and completion are event-driven Promise resolution; no periodic completion polling or intentional 25–47-second sleep.
- `runScenarioById` resets Preview and requests a new list before dispatch (around lines 2259–2288).
- Lines 2396–2434: PluginMessageBroker connects `preview.onMessage` and invokes subscribers directly; outgoing messages use `preview.postMessage`. No message interval setting exists here.
- Lens side: `Cache/TypeScript/Src/Packages/Leaf.lspkg/Utils/common/MessagingSystem/LensMessageBroker.ts` forwards MessageEvent synchronously; MessageScenarioHandler starts scenarios directly and awaits their completion.
- Runtime `Utils/common/Utils.ts` maps `sleep(ms)` to `UpdateDispatcher.createDelayedEvent(...,ms/1000)`. Dispatcher uses native DelayedCallbackEvent.reset; `nextFrame()` waits for an UpdateEvent with advancing getTime. No JavaScript poll explains a 40x sleep expansion.

Conclusion: neither a verified background setting nor deliberate LEAF transport delay was found. A native runtime / editor event-loop stall remains possible. Do not change undocumented Qt flags or activate the window.

## Concrete production issue staged for verification

Authoritative Opening ready-phase code called playAt('ClockTick') every second; Audio.playOn stopped/reassigned/restarted the .98-second asset each time. Parent subsequently observed native SinkWriterMediaType errors and much slower ready-phase steps than the idle trace. This is a hypothesis for the slowdown, not confirmed causality.

`scripts/run7-stage-audio-loop.mjs` stages Audio, Opening and Polish in `Tooling/staging/`:

- A separate persistent LowPower clock loops once per ready phase. Verdict/reset/scan stops it. Explicit one-shot ClockTick calls retain their separate component/counters and native-playback probes.
- Repeated score(name) with the same natively playing track does not stop/reassign/restart it.
- Native cue/clock/score stop, track assignment and play calls collect Date.now wall durations; max 20 calls over 100ms log `AUDIO_NATIVE_SLOW` with method label and duration. Diagnostics expose counts/max.
- S2 asserts native loop playback past one full clip, repeated-call start-count stability, independent one-shot/chime overlap, and idempotent stop. Existing playback coverage stays intact.

Still needed: main publishes after the Assets hold, Lens compilation, focused S2 runtime and ready-phase trace comparison. No performance improvement is claimed before that evidence.

Search artifacts: `results/run7-preview-settings/settings-search.json`, `scripts/run7-preview-settings-search.mjs`, `scripts/run7-preview-string-context.mjs`. The main search read 794 text files and streamed the full installed executable in bounded time.
