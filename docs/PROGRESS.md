# Roomscript progress — RESUMED

Updated 2026-10-29 02:51 PKT. P0 fixes, C5 with L1/A5-A8, staging, C6 and D1 are verified. C7 shatter needs the pending native-instantiation exception. Credentials are blank.

## Current work

- D1 suggestion sweep is verified: real pawn drag into a zone, weapon touch, dotted ghost, clockwise first-refuter sweep/private card, full no-refuter sweep/envelope breath, knowledge-only notebook and room markings. `roomscript-clue` passed twice after the audio fix, including listener/host-position regression checks. Engine targets: 138/138 across 8 files; Lens compile and Preview startup clean. Captures: `docs/captures/2026-10-29-d1ghost.jpg` and `2026-10-29-d1card.jpg`.
- D1 exposed a native timeout at repeated spatial-audio enablement. Spatial audio now initializes once on a separate emitter; the camera has an AudioListener; delayed frames coalesce audible ticks while retaining every visited refuter. The regression exercises both successive sweeps and deterministic replay.
- Checkpoint includes C7's unfinished effect wiring because D1 shares its object interactions and scene registration. No `m2-slice` or `m3-case` tag is justified yet. Pending approval is limited to one `AssetManager.instantiate([vfxAsset])` call for imported `RoomscriptShatter` UUID `51829ea2-ad44-43b1-b5f9-2b54493c160a`; all subsequent scene changes remain VirtualScene.
- Staging and C6 are complete. C7 interactions are implemented and LEAF/direct Preview drag verified; **C7 is not complete** because its VFX graph imports but runtime-only references export as null. VirtualScene cannot instantiate the graph. A specific one-call native instantiation exception is pending Wadood in the chat. D1 is now verified. Return to C7 effect verification/commit/tag after approval, then D3, D2 and D6/D7.
- C7 WIP includes paged object memories, observed-only wallet, real SIK slip dragging, wrong bounce/pip, correct silence/stamp/tearing paths/next layer/true-mark walk. Regression found and fixed UIKit backing/proximity colliders intercepting direct drag after reopening. Diagnostic timing restored to 1; particle preview off. No C7 commit yet.
- Production interrogation is wired: chips, free-question review/correction, deterministic claim, validated speech/subtitles and offline fallback. Full case remains unfinished.
- Integrated P0 gate: **320/320 tests, 24 files, exit 0**. Latest C5 targeted run: **195/195 tests, 14 files**, Tooling typecheck clean. Lens MCP compile/start clean.
- Strict Preview LEAF passes for offline controls and three live production answers. First audio: **1851 / 1744 / 4513 ms**, zero rejected outputs. See [C5 evidence](c5-production-latency-2026-10-29.json).
- Tests require elevated local execution because sandboxed esbuild cannot resolve workspace configuration through the user directory. No push or remote created.
## Resume scope and review corrections

Approved scope: one complete case first (live AI interrogation and tells, Spatial Objection, suggestion sweep, accusation/reenactment, opening), then should tier in plan order. Clue Night only if the core case is done and green by November 4. See [decisions.md](decisions.md).

Order: every review P0 with regression coverage; C5 with L1 and A5–A8; staging; C6; C7; D1; D3; D2; D6/D7; should tier; conditional Clue Night. P0 implementation findings are closed; P1 and later work remains. MCP preflight passed. Refresh credentials at live AI tests and blank them before every commit.

**Review corrections supersede the historical pause-time verification statements below.** The [test review](reviews/2026-10-28-tests.md) records **252/252 tests across 21 files, exit 0 (69.5 s)** and verifies async case-fuzz batching against a failing synchronous counterfactual. The [Lens review](reviews/2026-10-28-lens-and-repo.md) found final-tree compilation at **22:06:08** and four subsequent clean Preview starts. These are review evidence, not checks rerun in this session. At review time two Tooling test type errors were reported at `tests/ai/pipeline.test.ts:38`; passing Vitest does not establish typecheck success.

The remaining sections preserve the historical pause checkpoint and its captures; the old pause instruction and pending-verification claims are superseded by this update.

The detailed handoff is [PAUSE_HANDOFF_2026-10-28.md](PAUSE_HANDOFF_2026-10-28.md). It contains the implementation inventory, evidence, unfinished interfaces, known issues, remaining A–F work, restart commands and a ten-minute Preview tour.

## Status by stage

| Stage | State | Milestone |
|---|---|---|
| A — setup and probes | Complete | `m0-probe` |
| B — deterministic truth engine and terminal | Complete | `m1-terminal` |
| C — interrogation slice | Partial: C1–C3 complete; C4 partial; C5 pure pipeline prepared; C6–C7 pending | `m2-slice` not created |
| D — whole case | Not delivered; D5 engine preparation preserved | `m3-case` not created |
| E — should tier | Not started as Lens experiences | `m4-should` not created |
| F — Clue Night | Not started; gate and Sync probe pending | `m5-cluenight` not created |

**What is playable:** the terminal investigation, including the scripted solve demo. **What Preview currently contains:** room/crate/audio, navigable UIKit shells, a verified engine bridge, Vale's actor and testable AI adapters. The production buttons are not yet wired to a complete Lens interrogation. Do not describe the current Preview as the finished game.

## Local checkpoints

| Commit | Work |
|---|---|
| `c71ff8c` | A2 tooling and secret guard |
| `da5484d` | Compatible gateway/dependencies, credentials and A1 baseline |
| `143a315` | A4 probes and measurements |
| `194651b` | A5 decisions; `m0-probe` |
| `70996d5` | B1 shared deterministic core |
| `47ca224` | B2 room binding/substitution |
| `41ed85f` | B3 hero case and line bank |
| `4b915da` | B4 solver |
| `0a1e446` | B5 reducer |
| `68ebaa7` | B6 performance safety |
| `64df6b0` | B7 terminal player |
| `c747018` | B8 fuzz; `m1-terminal` |
| `40f0da9` | C1 scene/UI/audio bootstrap |
| `8d11fe4` | C2 engine bridge |
| `0b1a657` | C3 paper-theatre actor |
| `260d801` | **WIP preservation at pause:** AI plumbing, pure answer pipeline, raw-output audit, harvested tape and D5 case compiler preparation |

The WIP commit is intentionally not a package-completion claim. The final documentation commit follows it. No remote, push, publication or physical Specs action was performed.

## Verification summary

- Completed Stage B baseline: **170 tests passed across 11 files**.
- Latest integrated run: **250 tests passed across 21 files, but the process exited 1** because a long synchronous case-fuzz test caused a Vitest worker RPC `onTaskUpdate` timeout. This is not a clean full-suite pass.
- Before pause, the worker wrote `fuzzCasesAsync`, yielding every 25 cases, and an equivalence regression. The subsequent verification run was interrupted on request. **Fix verification is pending.** Thirteen targeted compiler tests had passed.
- Generated-case measurements before that harness change: **5000/5000** cases accepted, 1000 on each of five fixtures, sixty distinct room/envelope combinations. Live pitch acceptance is **not measured**.
- Player fuzz: **1000 players / 29487 actions**; 250 correct, 699 timeout, 51 credibility failure; highest layer 2; no repeated successful objection reward, contradictory active account or loss of the true solution from true knowledge. Fairness forces a charged action after at most seven free/arbitrary actions.
- Strict LEAF passes: `roomscript-shell-navigation`, `roomscript-shell-ik-reach`, `roomscript-engine-bridge`, `roomscript-suspect-actor`, and `roomscript-ai-record-replay`.
- The AI test passed in **23.170 s**, including real Gemini output, validation, recording, equal offline replay with no live transport, speech, real jaw amplitude (max ~0.502), offline cached speech and uncached subtitle fallback.
- Its single recorded text request took **8972 ms** under a 12-second diagnostic deadline. Production C5 retains a **6.5-second hard fallback**; its latency/rejection acceptance is not established.
- Last checked C4 Lens components compiled and started. Final harvested-tape import and final worker edits have not received a post-pause compilation/startup check.

LEAF strict policy is **`fail-fast`**. Stage A's two probe scenarios passed using the fallback/default policy because the earlier requested `fail` value was unrecognized. Do not claim strict verification for those earlier runs.

Known editor warnings include LEAF instance/settings teardown on reset and transient pending-message/compile-data warnings during rapid worker edits. Collect a clean startup after compilation when resuming; don't equate a compile pass with a runtime pass.

## Captures and evidence

- [C1 manifest](c1-build-manifest.md): original scene inventory and audit.
- [Fixed shell layout](captures/2026-10-28-c1-shells-fixed.png), [notebook](captures/2026-10-28-c1-notebook.png).
- [Crate front](captures/2026-10-28-c1-crate-front.png), [crate isometric](captures/2026-10-28-c1-crate-isometric.png).
- [C2 engine/HUD](captures/2026-10-28-c2-engine-bridge.png).
- [C3 neutral actor](captures/2026-10-28-c3-neutral.png), [rattled actor and console](captures/2026-10-28-c3-rattled-console.png).
- [C4 integration pass](captures/2026-10-28-c4-record-replay.png). This is a test pass capture, not evidence of completed production UI wiring.
- [Harvested tape](../Assets/Scripts/Content/Tapes/C4Gateway.ts): one validated, credential-free live answer.
- [MCP bug report](mcp-bug-report.md): earlier package/runtime mismatch and recovery details.

The C4 source log is `C:/Users/wadoo/AppData/Local/Snap/Lens Studio/logs/LensStudioLog-2026-10-28-20-04-09-576-866b8.txt`; harvest byte baseline **3442262**.

## Probe decisions retained

See [probe-results.md](probe-results.md) and the measurement files for individual samples.

| Probe | Result | Successful p50 / p95 ms |
|---|---|---|
| GPT-4.1 nano strict JSON | 0/20, not found | — |
| GPT-4o mini strict JSON | 8/20; 12 rate limits | 1766 / 2051 |
| Gemini 2.5 Flash | 20/20 schema-valid | 1743 / 2361 |
| Gemini 2.0 Flash | 0/20, unavailable/no access | — |
| Mini TTS / onyx | 20/20 assets loaded and playing | 2217 / 3205 |
| Built-in TTS | Unsupported synthesis API in LS 5.23 | not a latency test |
| Imagen 3 | 0/20 corrected calls | — |
| Four mini calls concurrently | 13/20 complete batches | 3043 / 5294 |
| Camera | 20/20 simulated Evening Room | 273 / 284, includes 250 ms sampling |
| Sync | Deferred | not measured |

Use Gemini 2.5 primary, mini secondary, cache/authored-first chips, validated live free text, max-four transport scheduling/cooldown, OpenAI TTS/subtitles and optional Imagen/authored art. The ~3.96 s sum of separate chat and TTS medians was an estimate, not a measured combined response time.

## Environment and secrets

Lens Studio **5.23.2.26081320**, signed in at last check; Spectacles target, Perspective camera / World tracking; Preview **SPECS 27 / Interactive / Evening Room**. Compatible packages are recorded in the handoff. Do not upgrade blindly or edit Cache.

At pause, all SNAP/OPENAI/GOOGLE credential fields were blanked through VirtualScene and the project was saved. Refresh all three through the CLAD authorized Editor Network flow before live tests; tokens expire in roughly an hour. The pre-commit secret hook remains on. ProbeLab stays disabled.

Historical pause state: workers stopped and generated hooks were untracked. The current run is authorized; the hooks are now tracked.

## Historical restart list (superseded by Current work above)

1. Read the handoff and project instructions; inspect git status and check Lens MCP/preflight.
2. Finish verification of the async generation-test fix: `npm.cmd test -- tests/case-generation`, then `npm.cmd test` from Tooling. Avoid concurrent large fuzz jobs while measuring live latency.
3. Compile through Lens MCP and collect fresh startup logs. Resolve final-tree issues before declaring C4 complete.
4. Refresh credentials only when ready for live verification; finish C4 review, then wire the C5 production answer/input/subtitle path.
5. Continue C6–C7, evaluate Gate C, then D1–D7, E in order and F only if its gate passes. Exact remaining features are in handoff §7.

## Preview tour and remaining limits

The **ten-minute guided tour is in [handoff §9](PAUSE_HANDOFF_2026-10-28.md#9-ten-minute-guided-preview-tour-at-this-checkpoint)**. It covers shell navigation, cues, crate, actor and offline LEAF checks while clearly separating them from unfinished gameplay. Live AI tests will fail without refreshed credentials.

Device keyboard, ASR/microphone, camera permissions, tracking, World Query, physical hand interaction, spatial audio and real-furniture occlusion remain **verify on device**. Human audio quality, live pitch acceptance, a full interrogation rejection-rate study, complete end-to-end latency, the whole-case Lens flow and multiplayer remain unverified or unbuilt.

## E2 — 2026-10-28 23:48 PKT
Complete: Believe, Object, CallLiar and RevealEvidence reject an absent suspect before any treatment or reward mutation. Four regressions also verify normal acceptance at the return boundary and replay equality. 25/25 game tests pass, Lens compile/start clean. Next E3.

## E3 — 2026-10-28 23:50 PKT
Complete: voicemail and Okafor's reply each independently break Vale's layer-1 account, replacing the unnecessary cable-plus-reply pair. 86/86 targeted tests passed across six files, including 5000/5000 generated cases. Lens compile/start clean. E1 commit 4f10e6a; E2 09f4786. Next E4 inspection cost/scoring.

## E4 — 2026-10-28 23:56 PKT
Complete: hero/generated object memories cost 10 minutes per newly inspected holder bundle; replay viewing is free. Solver hero minimum is 80/180, exhaustive inspection 130, efficient supported route 90, demo 175. Score recomputes actual minimum and requires all deductions for the efficiency star; blind correct guess earns 1. Full run: 262 passed, one 5000-case batch timed out at 120s. Raised batch timeout to 240s without reducing coverage; targeted rerun 2/2 passed (5000/5000 accepted, max 83.2ms, p95 44.6ms, 122s batch). Compiler regression 13/13 passed. All tests verified across these runs; no claim of a new single full-suite exit-zero run. Lens compile/start clean; engine bridge LEAF passed fail-fast in 1.539s. Capture: captures/2026-10-28-e4-engine-bridge.png. Next A1 prompt stance leakage.

## A1 — 2026-10-28 23:59 PKT
Complete: performer refs are stable opaque 16-hex aliases with a duplicate guard; authored lines, memory, schema and replay tests use the same mapping. Generated topics are background/borrowed_item/visit; cover text is first-person and never names the hidden category. Prompt v2 invalidates old request keys; C4Gateway v1 is preserved unmodified as historical evidence and will miss safely in production. New regression checks every initial suspect sheet/request in hero and generated case for stance leakage. 149/150 first targeted run (test harness still decoded old IDs), then corrected private lookup and 41/41 performance tests passed; all 150 covered tests now verified. Lens compile/start clean. Next A2 validator hardening.

## A2 — 2026-10-29 00:01 PKT
Complete: NFKC and invisible-character cleanup before validation; expanded contractions for checks, unsupported scripts/digits rejected, added h-format and approximate spoken hours. Broader confession/culprit/lie/meta/ref patterns cover every A2 review probe. Only normalized admitted text reaches speech (including AI LEAF). 130/130 targeted tests passed, including 39 new review regressions and all authored performances. Lens compile/start clean. Next A3 semantic guards.

### A3 — claim polarity and unsupported people (2026-10-29)
Complete. Required-claim polarity is checked; unsupported relationships, locations and victim conditions are rejected. 140 targeted tests passed, including 49 review safety cases. Lens compile and refreshed runtime are clean. These are conservative lexical checks, not a claim of general language entailment.

### A4 — engine-owned performance permissions (2026-10-29)
Complete. The reducer derives answer/press/broken/lawyered/confession permissions from the latest gameplay cue or correct culprit verdict, ignoring caller privileges. A baseline correction can authorize a break at layer zero; an old break cannot authorize later questions. Raw output audit events preserve the cue. 142 targeted tests passed; Lens compile/runtime clean.

### P0 hygiene — Tooling typecheck (2026-10-29)
The two mock-call type errors are fixed by typing the mock as LlmPort.complete. npm run typecheck now passes for Tooling plus pure Engine/Content; no Lens components enter this configuration. Pipeline regressions pass 15/15.

### P0 hygiene — Git LFS hooks (2026-10-29)
Tracking all four generated LFS hooks. Verified hook configuration is .githooks, git-lfs 3.6.1 is installed, and five hook/secret-guard contract tests pass. No remote or push.

### P0 integrated gate and A5 — 2026-10-29
Full P0 suite: 320/320 tests across 24 files, exit 0 in 130.36s. 5000/5000 generated cases accepted, maximum 227.7ms, p95 48.9ms. A5 complete: Gemini uses a separate systemInstruction, thinkingBudget 0 and maxOutputTokens 384. Live LEAF measured 20/20 valid responses, median 1661ms, p95 2057ms, max 2126ms. Text only; combined audio budget awaits A7/C5. Table: c5-gemini-latency-2026-10-29.json. Twenty real outputs harvested as C5GeminiLatency and replay-validated offline; 3 request/replay tests pass, Tooling typecheck and Lens compile/start clean. Next A6 fallback.

### A6 — OpenAI fallback (2026-10-29)
Complete. Pure provider request shaping and sanitized error mapping; strict schema projection removes unsupported constraints while local validation retains them. Gemini failure uses the one permitted retry on gpt-4o-mini when time remains; unauthenticated does not retry. 60 AI tests and Tooling typecheck pass. Live fail-fast LEAF simulated primary outage then obtained/admitted a real OpenAI answer in 2327ms, two attempts, zero validation rejections. Actual fallback tape harvested and both Gemini/OpenAI offline replay tests pass. Lens compile/start clean.

### A8 — scheduler reserve (2026-10-29)
Complete before A7 because precaching depends on it. With capacity four, background work starts at most three transports; live work can use the fourth without pretending cancellation aborted pending requests. Cooldown is capped at 2500ms. 24 scheduler/pipeline tests and Tooling typecheck pass; Lens compile/start clean.

### A7 — audio preparation and shared deadline (2026-10-29)
Complete at the adapter level; C5 will invoke current-account precache. Sentences synthesize concurrently and play in order. Titles, initials, decimals and a.m./p.m. stay intact. Voice defaults to the actor's authored suspect voice. Current account chips and neutral fillers have a precache API; offline cached speech works. Audio uses the remaining 6.5s question budget, with subtitle fallback and no late playback. Eight pure speech regressions and Tooling typecheck pass. Live fail-fast LEAF passed: first audio 3057ms, sentence gap 7.8ms, coral voice, precache/offline/deadline/cancellation checks. Lens compile/start clean. Actor initialization now explicitly initializes the engine before reading state.

### L1 — room binding (2026-10-29)
Complete. Hero zone coordinates match the Preview fixture by semantic name while case IDs remain stable. All 13 objects and five zones have authored anchors under a floor-local CaseRoom root; five virtual props are present. Zone plaques moved out of PreviewRoom, bottle/mug stand-ins aligned with case positions. Binding component maps case to world and audits missing/drifting anchors. 39 content/room/tape tests pass; fail-fast roomscript-room-binding LEAF verifies translated root, all anchors, device-visible props/plaques with PreviewRoom disabled, and detection of intentional drift. Lens compile/start clean; front and top captures reviewed. Saved captures/2026-10-29-l1-room-binding.jpg. Full staging remains next after C5.

### C5 — production interrogation (2026-10-29)
Complete. Engine Ask precedes performance; the reviewed topic is locked for chips and free questions. Raw model outputs enter the action log before validated LineSpoken, subtitles and TTS. UIKit question review supports correction, exact Preview presets and device keyboard. Unauthenticated switches to offline fallback; current-account clips warm on suspect selection. Strict offline control/replay and three live model-plus-audio scenarios pass; 195 targeted tests and Tooling typecheck pass. Screenshot confirms the staging issues remain; staging is the next item.

### Staging — 2026-10-29
HUD parented to the articulated crate lid, cue button removed, chips/verbs narrowed, brighter wood and smaller crate, speaker-local subtitles, Vale at 1.81m. Text roles enlarged and five plaques calibrated from rendered cap bounds to 1.2 degrees at setup. Crate update event disables when open and restarts on demand. Actor inputs have hints; main/bridge use console. Strict staging, shell navigation, IK notebook reach and production interrogation LEAF pass; Lens compile/start clean. Runtime Preview camera had drifted to z=249cm; reset it before measurements. Final capture: captures/2026-10-29-staging-preview.jpg. Physical display luminance/readability remains a device check.

### C6 — tells, verbs, composure (2026-10-29)
Complete for the active interrogation actor. Engine TellCue selects authored tells, never model text; prop flare and dashed 0.25-degree gaze shader begin 300ms after speech (or admitted subtitle fallback). Covers both Vale layers and all cast baseline lies; truth, deflection, filler and lawyered replies stay quiet. Segmented composure display, claim preview on hover, door exit after three empty presses and knock/return after 30 charged night-minutes. Strict offline tells LEAF and real model/audio/tell integration pass; live tell delay318ms and first audio1742/1966/3999ms, zero rejection. 131 targeted tests and Tooling typecheck pass; Lens compile/start clean. A Preview reset interrupted the first live attempt; clean retry passed. Diagnostic capture extends visibility to8s only for inspection; production duration restored to0.9s.

Checkpoint verification 2026-10-29 02:54 PKT: final roomscript-objection LEAF passed (25.850 s) after shared audio changes; Tooling typecheck exit 0, git diff --check clean. Runtime capture reviewed after resetting Preview camera. C7 shatter remains unverified and blocked as noted above.

## Needs Wadood - checkpoint not committed

The local C7/D1 checkpoint commit was NOT executed. Automatic permission approval review timed out twice (original and permitted retry); this is not a finding that the commit is unsafe. Changes remain in the working tree, with no staging performed. Last successful commit remains 5923208 (C6). User review reports under docs/REVIEW_2026-10-28.md and docs/reviews/ remain untracked and intentionally excluded. Gateway tokens are blank, project saved, and secret hook remains enabled.

Resume after permission guidance: commit the verified checkpoint (Assets/Scene.scene, changed/new Assets/Scripts including EngineBridge metadata, RoomscriptShatter asset+meta, the two new Tooling game tests, NOTICE, progress/decisions/CLAD log and six dated captures). Do not stage the user review reports. Then, if approved, instantiate the single prepared VFX asset with the requested native exception, finish C7 visuals/LEAF, and continue D3 -> D2 -> D6/D7 -> should tier.
