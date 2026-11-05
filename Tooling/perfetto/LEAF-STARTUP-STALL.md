# LEAF first-resume investigation (Run 7)

Read-only audit; no Preview capture was started by this lane and no Assets changed.

## Evidence

- `Leaf/Utils/common/Utils.ts` converts sleep milliseconds to seconds exactly once. `sleep(300)` creates a native `DelayedCallbackEvent` reset to `0.3` seconds. It resumes only when the Preview event loop advances.
- `DefaultLeafScenarioManager` logs RUNS, logs runner configuration, constructs `InteractionTracer`, then calls `scenario.run`. The tracer only patches two SIK registration methods; it does not enumerate the scene or perform network/audio work.
- `MessageScenarioHandler` calls `startScenario` and posts `ScenarioStartResponse` through `Editor.context.postMessage`. This is a remaining synchronous native boundary before control returns to the Preview loop; the source alone does not show whether it blocks.
- `Logger.ensureOverlay()` runs before the RUNS console line. Its initial overlay creation therefore cannot by itself explain the entire gap after that line. Subsequent rendering of the overlay remains part of the next-frame workload.
- The continuous recorder scenario first awaits `sleep(300)`, before recorder creation, API probing or hand setup. Its observed gap therefore predates those operations.
- Native log `LensStudioLog-2026-11-06-01-53-34-732-ab082.txt`: RUNS and runner configuration at 02:43:16.888 PKT. No log line from any subsystem until 02:45:46.547, a 149.659 s gap. That next audio operation reports only 530 ms for `cue.track:Knock`; recorder API probing follows at 02:45:46.558. Measured audio calls do not account for the full gap.
- Audio overhead is independently real: nearby Rain/RoomTone/score calls each take approximately 0.7–3.3 s. This does not establish that audio caused the silent 149.659 s interval.
- A later run starts at 02:48:49.874 and reaches its recorder API at 02:51:43.019 (173.145 s). The first wait is getting slower across this editor session.
- UpdateDispatcher retains fired delayed events and disabled next-frame events on its singleton script. This is a possible long-session accumulation issue, not evidence of this stall, and cached package code was not changed.

The earlier 10 s idle trace captured 395 frames and missed this interval. It establishes ordinary steady-state frame costs, not startup stall attribution. The working diagnosis is blocked/paused Preview frame or message dispatch with separate native audio overhead. A long trace must distinguish a giant ProcessFrame/Scene::Update span from a gap between frames.

## Capture handoff (main agent only)

Execute `capture-leaf-startup-start.ts.txt` through Lens MCP ExecuteEditorCode immediately before launching a bounded LEAF scenario. It uses the existing canonical Preview profiling API, schedules finish at 180000 ms, and returns immediately. It does not alter or focus any window. Its state key is independent from the earlier S2 capture, and its output prefix is `roomscript_leaf_startup`.

Poll `capture-leaf-startup-status.ts.txt` after the scheduled end. `capture-leaf-startup-cleanup.ts.txt` finishes any remaining session. The timer requests 180 s; an editor-thread stall can delay its callback, so use the recorded timestamps rather than claiming an exact hard wall duration.

After the output is nonzero and stable, use the existing local analyzer:

```powershell
node Tooling/scripts/run-bounded.mjs 120 Tooling/bin/perfetto/venv/Scripts/python.exe -u Tooling/perfetto/run_analysis.py <absolute-trace-path>
```

For focused SQL, compare maximum complete ProcessFrame duration, largest start-to-start frame gap, and unfinished slices. Inspect the longest frame's children only if it spans the stall. A gap with no frame work points to outer scheduling/IPC rather than game update code. Do not reuse the historical `run7_phase2.mjs` output path without changing it: that script intentionally saves the earlier S2 evidence file.
