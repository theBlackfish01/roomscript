# Run 7 LEAF startup stall — captured

The trace contains **four ProcessFrames across342.68 seconds**. The dominant pauses are **between frames**, not inside game update:76.58 seconds and242.85 seconds with no traced ProcessFrame/CoreManagerRender work. The largest actual frame pair is16.00 seconds, including a15.93-second Scene::Update. The final render is unfinished when capture ends.

This confirms a different problem from steady-state rendering cost. A180-second editor capture timer fired after350.884 seconds; Preview frame delivery and the editor timer were both delayed. Native logs show the plugin announcing the scenario at03:06:59.014 PKT, the Lens logging RUNS at03:08:17.848, and the plugin timeout at03:12:20.818. Preview callbacks resume after the timeout. Native audio operations still cause independently measured multi-second stalls, but they do not account for the242.85-second gap outside frame work.

The installed LEAF plugin source uses Promises and timers, with no busy-loop wait in the run path. A candidate native boundary remains: it posts ScenarioCompletedRequest synchronously inside the ScenarioStartResponse callback received through `preview.onMessage`; the Lens replies via `Editor.context.postMessage` while handling a MessageEvent. Re-entrant native messaging or outer editor/Preview scheduling could block delivery. **This source inspection does not identify the exact blocking call.** No plugin/cache file or OS service was changed.

There is no scheduler data, so this is not active-CPU attribution. With only three completed pairs, a gameplay FPS estimate would be misleading. Use the earlier post-startup report for ordinary paired frame costs and this trace for the startup failure. The compact JSON and raw bounded SQL output are adjacent.
