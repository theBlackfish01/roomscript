# Progress

Read this first after a context reset. Updated 2026-10-28 21:51 PKT.

## Status

| Stage | Status | Milestone | Verification |
|---|---|---|---|
| A · Setup and probes | complete | m0-probe | 34 Vitest tests, 2 LEAF scenarios, captures, 20 samples per probe/model |
| B · Truth engine | complete | m1-terminal | 170 tests; 1000 players /29487 actions; terminal demo; Lens compilation + runtime startup |
| C · Interrogation slice | C1–C2 complete; C3 next | m2-slice pending | |
| D · Whole case | not started | m3-case pending | |
| E · Should tier | not started | m4-should pending | |
| F · Clue Night | not started; gate pending | m5-cluenight pending | |

## Current state and next steps

1. Stage B complete: B3 41ed85f, B4 4b915da, B5 0a1e446, B6 68ebaa7, B7 64df6b0; B8 checkpoint and m1-terminal tag follow. 170 tests pass across11 files; Lens compiles and starts with only the known LEAF editor warning.
2. C1 complete:55 authored objects,7 materials,5 UIKit shells plus plaques,10 sound cues and music. Two LEAF scenarios pass fail-fast. docs/c1-build-manifest.md records layout, capture paths, audits and fixes. Main remains wiring-only; no Lens game logic yet. C2 engine bridge verified; C3 actor is next.
3. C4 pure AI port/scheduler/tape worker runs independently; main owns all Lens work. Continue C–F; no remote/push. Stage B engine is playable in Tooling via npm.cmd run play or npm.cmd run play -- --demo.

MCP is working. Lens Studio 5.23.2.26081320, signed in; Spectacles target; Perspective camera / World tracking; SIK 2.0.0 and SpectaclesUIKit 2.0.0. RSG 2.0.1, Utilities/SnapDecorators 2.0.0; inspection/interact bridges 2.0.1, Leaf 2.0.0. Compatible packages compile. Never reinstall newest versions blindly; see docs/mcp-bug-report.md.

ProbeLab is now disabled in the authored scene. Its scripts and LEAF tests remain for regressions. Credentials were generated and successfully used for real provider calls, then blanked through VirtualScene before committing. Regenerate all three via the authorized Editor Network flow before live calls; tokens expire in roughly one hour. Never log/stage them. The LEAF probe scenarios currently require ProbeLab enabled before running.

## Verification

- **Vitest:** 34/34 across 3 files: secret guard (21), probe aggregation (11), settled concurrency batches (2). `npm.cmd test` in Tooling. Pure helper tests only; Lens components compile solely with RecompileTypeScriptTool.
- **LEAF:** `roomscript-probe-layout-and-button` passed, including layout count, spacing, button state change and display-material regression. `roomscript-probe-ik-reach` passed; the originally requested diagnostic policy `fail` was unrecognized and fell back to default (correct strict value is `fail-fast`). Opening LEAF resets Preview; don't do it during measurements.
- **Lens:** MCP TypeScript compilation succeeds. No Lens runtime exceptions after fixes. The LEAF editor plugin emits a warning on reset: `Skipping plugin state save: instance was destroyed before its state finished loading.` Scenario registration and execution still work; this is an upstream plugin warning, not a clean-zero-warning claim.
- **Captures reviewed:** docs/captures/2026-10-28-a1-baseline.png; 2026-10-28-a4-probelab-running.png; 2026-10-28-a4-speech.png; 2026-10-28-a4-camera-fixed.png; 2026-10-28-a4-camera-frame2.png. Camera captures show the simulated Evening Room in the texture panel. Earlier imagen/camera captures document failed/empty display states.
- **Probe evidence:** docs/probe-measurements-initial.md contains A–D authoritative samples and diagnostic-only initial E/F. docs/probe-measurements-corrected.md supersedes E/F and supplies G. Source log LensStudioLog-2026-10-28-20-04-09-576-866b8.txt: initial baseline byte 1623625, corrected baseline 1809777. Do not merge repeated diagnostic batches into latency counts.

## Probe results

| Probe | Result | Successful p50 / p95 |
|---|---|---|
| OpenAI gpt-4.1-nano strict JSON | 0/20, not found | unavailable |
| OpenAI gpt-4o-mini strict JSON | 8/20 valid, 12 rate limited | 1766 / 2051 ms |
| Gemini 2.5 Flash responseSchema | 20/20 valid | 1743 / 2361 ms |
| Gemini 2.0 Flash responseSchema | 0/20, unavailable or no access | unavailable |
| OpenAI gpt-4o-mini-tts / onyx | 20/20 assets loaded and AudioComponent playing | 2217 / 3205 ms |
| Built-in TTS | unsupported in this editor's API; 20 capability checks | not latency measurements |
| Imagen 3 | 0/20 corrected attempts; 5 unsupported configuration, 15 rate limited | unavailable |
| Four concurrent mini calls | 13/20 complete batches; 7 rate limited | 3043 / 5294 ms |
| Camera Default_Color | 20/20, simulated room shown | 273 / 284 ms including intentional 250ms sampling window |
| Sync | deferred to F as authorized | not measured |

## Known limitations / verify on device

- Terminal gameplay is complete; Lens gameplay is not yet wired. Stage C–F remain. Do not call the probe panel the game.
- Imagen rejected both initial options and the package's exact example parameter set. Preserve its live path and use authored art fallback.
- Fast request sequences trigger gateway rate limits. Use bounded scheduling, cooldown and authored/replay fallback; no retry storm.
- Audio verification is asset load plus playback state; human listening quality and all physical Specs behavior remain unverified.
- ASR/microphone, AR keyboard, camera permissions, tracking and spatial audio need physical Specs. No device actions performed.

## Preview tour at this checkpoint (10 minutes)

This is a diagnostics tour, to be replaced by the actual gameplay tour after C/D.

- 0–2 min: enable RoomscriptProbeLab in the scene, reset Preview and confirm the seven-button panel in SPECS 27 / Evening Room.
- 2–4 min: pinch G and inspect the live simulated-room texture. This probe needs no provider tokens.
- 4–6 min: inspect Logger's PROBE lines and docs/probe-results.md; B/C can be retried after refreshing gateway credentials, subject to rate limits.
- 6–8 min: open LEAF, choose Preview execution and run roomscript-probe-layout-and-button. Opening/running LEAF resets the scene.
- 8–10 min: inspect captures and the bug-report draft, then disable ProbeLab again before normal game work.

## Checkpoint log

- 2026-10-28: A2 commit c71ff8c, secret guard/tooling, 21 tests; no remote.
- 2026-10-28: A1/A3 commit da5484d, compatible gateway/dependencies, all three credentials generated and baseline capture.
- 2026-10-28: A4 completed with 34 tests, two LEAF scenarios and real provider/camera batches. Fixed FlexLayout startup, backing ancestry, missing Image material and early-rejection concurrency accounting. Bug regressions added.
- 2026-10-28: A4 commit 143a315. A5 chooses Gemini 2.5 Flash + OpenAI TTS, cache-first chips, validated live free text, rate-limit cooldown, optional Imagen/authored art, simulated-room camera input. Separate medians suggest ~3.96s uncached spoken latency; no combined-latency claim. Stage A complete, m0-probe.
- Prior disconnect/crash and package incompatibilities are resolved; reproduction details are preserved in docs/mcp-bug-report.md. Wadood relaunched Lens Studio and authorized continuation. No raw HTTP to the Lens MCP, no Cache modifications, no remote/push.

- B3 commit41ed85f. B4 solver verified32 tests including20 broken variants; final integrated Lens compile21:19 succeeds, runtime starts without Lens exceptions.
- B5 reducer verified13 tests: replay, objections, baseline isolation, timed lawyering, tuple refutation, verdict lock and validated performance admission. B6 dependency checkpoint follows immediately.
- B6 safety verified41 tests, including all authored lines and rejected-output prompt-memory regression; B1-B6 integrated Lens compilation passes. Terminal and1000-player fuzz remain before m1-terminal.
- B7 terminal verified4 integration tests plus real interactive session and --demo. Demo reaches3 objections,4 deductions, correct verdict at75/180 case minutes. Use npm.cmd run play in Tooling. B8 uncovered inherited baseline repeat-Hunch bug; fixed and regression added, final fuzz pending.

- B8: 1000 deterministic fair players /29487 actions;250 correct,699 timeout,51 credibility failure; highest layer2; no repeated successful objection per source, no contradictory active accounts, true knowledge preserves actual solution. Fairness charges time after at most7 free/arbitrary actions; free inspection itself does not imply real-time timeout.

- C1 complete21:43: shells navigate; cues/music play; crate opens; PreviewRoom editor gate verified. LEAF shell-navigation and shell-ik-reach pass fail-fast, captures reviewed. C4/C5 pure AI modules are ready in working tree (33+15 worker tests) but not yet committed or Lens-adapted; preserve them.


- C2 complete21:51: solver unique, eight checks, one hypothesis; roomscript-engine-bridge LEAF passes fail-fast (real Ask +15 minutes, replay equality and snapshot isolation). Recompile and fresh runtime show no Lens exception; known LEAF editor warning remains. Capture docs/captures/2026-10-28-c2-engine-bridge.png reviewed:165-minute HUD.
