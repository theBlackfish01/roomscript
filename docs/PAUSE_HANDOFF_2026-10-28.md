# Roomscript implementation pause — 28 October 2026

Development is paused at Wadood's explicit request. This is a handoff, not a completed-build report. No new development or test runs should start until Wadood resumes the work.

Read this document and [PROGRESS.md](PROGRESS.md) before resuming. [FIRST_PASS.md](FIRST_PASS.md) remains the mission brief and [IMPLEMENTATION_PLAN.md](plan/IMPLEMENTATION_PLAN.md) remains the authority for scope and acceptance.

## 1. Where the project stands

The deterministic investigation engine and a playable terminal version of HARLOW-1041 are complete. Lens Studio contains the forensic room bootstrap, navigable UIKit shells, an engine bridge, and Vale's paper-theatre actor. Live AI recording/replay and speech have passed a Lens integration test, but the production question buttons are **not yet connected to the complete interrogation pipeline**.

There is useful preparation for later packages: the pure answer pipeline and a substantial deterministic case generator. Their presence does not mean the corresponding Lens experiences are finished.

| Stage/package | Status at pause | Milestone / evidence |
|---|---|---|
| A: preflight, packages, repository, probes, decisions | Complete | `m0-probe` |
| B: truth engine, hero, solver, reducer, performance safety, terminal, player fuzz | Complete | `m1-terminal` |
| C1: room, crate, audio and UIKit shells | Complete | `40f0da9`; two strict LEAF passes and reviewed captures |
| C2: engine bridge | Complete | `8d11fe4`; solver report, replay/isolation LEAF and HUD capture |
| C3: suspect actor v1 | Complete | `0b1a657`; actor LEAF and two captures; subsequent C4 test exercised real speech amplitude |
| C4: AI plumbing | Partial, preserved as WIP | Live answer → RECORD → offline REPLAY, validation, speech, cache and subtitle fallback passed LEAF; release checkpoint still needs finishing |
| C5: live answer experience | Partial, pure engine only | `AnswerPipeline.ts` and 15 tests; Lens controller, input flow and latency study remain |
| C6–C7: tells, verbs, objections and objects | Not implemented in Lens | Relevant truth rules already exist in B; no `m2-slice` |
| D: whole case | Not delivered | D5 engine preparation exists; D1–D4, D5 Lens flow, D6–D7 remain; no `m3-case` |
| E: should tier | Not started as experiences | Some prerequisite truth/content exists; no `m4-should` |
| F: Clue Night | Not started | Gate and Sync probe pending; no `m5-cluenight` |

No remote was added and nothing was pushed or published. No physical Specs testing was performed.

Completed C1–C3 checkpoints are `40f0da9`, `8d11fe4` and `0b1a657`. All unfinished implementation described below is preserved in **`260d801`**, explicitly named `WIP: preserve AI plumbing and case compiler at requested pause`. The documentation checkpoint follows it; no unfinished milestone tag was created.

## 2. Pause state and safe restart

- Workspace: `C:/Users/wadoo/Desktop/SPECS_Hackathon/RoomScriptF`.
- Lens Studio: **5.23.2.26081320**; project targets Spectacles, with World tracking and a perspective camera.
- Preview: **SPECS 27 / Interactive / Evening Room**.
- The project was saved at pause. All three credential fields were blanked through VirtualScene and the project saved again. Live requests now require fresh credentials.
- `RoomscriptProbeLab` is disabled. `RoomscriptLeafIndex`, the scene shells, bridge, actor and AI adapters are authored in the scene.
- Workers were told to stop. The case-generation worker's active test session was interrupted; it exited. No worker development is intended to continue in the background.
- The pre-commit secret check remains enabled. Generated Git LFS hooks `post-checkout`, `post-commit`, `post-merge`, and `pre-push` were left untracked; they are not unfinished game work.
- Do not blindly upgrade packages. Compatible installed archives include RSG 2.0.1, Utilities/SnapDecorators 2.0.0, SIK/UIKit 2.0.0, inspection/interact bridges 2.0.1 and LEAF 2.0.0. SIK's runtime reports embedded version 0.18.0; distinguish that from the archive version.

On Windows, use `npm.cmd`: `npm.ps1` is blocked by local execution policy. `rg` was unavailable, so PowerShell file searches were used. Git operations in this environment needed a command-scoped `safe.directory` setting and approval for `.git` writes; no global trust configuration was changed.

The Lens managed `AGENTS.md` block prohibits direct HTTP to the Lens MCP. Continue using MCP tools. An actual MCP outage, editor crash, sign-in problem, or human-only permission prompt is a reason to stop for Wadood; a failing game test is a reason to diagnose the code.

## 3. Completed foundation

### Stage A: setup and measured provider behavior

Preflight, Specs initialization, repository tooling, the secret hook, compatible gateway packages and all three credential-generation paths were established. ProbeLab contains seven UIKit controls and preserved regression scenarios.

The measured table is in [probe-results.md](probe-results.md); original and corrected sample records are separate so failed diagnostic attempts are not counted twice.

| Probe | Result | Successful p50 / p95 |
|---|---|---|
| OpenAI `gpt-4.1-nano` strict JSON | 0/20; model not found | unavailable |
| OpenAI `gpt-4o-mini` strict JSON | 8/20 valid; 12 rate-limited | 1766 / 2051 ms |
| Gemini 2.5 Flash response schema | 20/20 valid | 1743 / 2361 ms |
| Gemini 2.0 Flash | 0/20; unavailable/no access | unavailable |
| OpenAI mini TTS, onyx | 20/20 assets loaded and AudioComponent playing | 2217 / 3205 ms |
| Built-in TTS | API has no usable synthesis methods in this editor | capability check, not latency |
| Imagen 3 | 0/20 corrected calls; 5 unsupported configuration, 15 rate-limited | unavailable |
| Four concurrent mini requests | 13/20 complete batches; 7 rate-limited | 3043 / 5294 ms |
| Camera | 20/20, simulated Evening Room at 1392×1590 | 273 / 284 ms, including 250 ms sampling window |
| Sync | Deferred to F | not measured |

Decisions: Gemini 2.5 Flash is the primary text model, mini is secondary; use authored/cache-first chips and validated live free text, bounded scheduling and cooldown; use OpenAI TTS with explicit subtitle fallback in this editor; keep Imagen optional with authored art. Separate chat/TTS medians suggested approximately 3.96 seconds but that was **not a measured combined latency**.

Earlier MCP/package problems are documented for a bug report in [mcp-bug-report.md](mcp-bug-report.md). Latest RSG/bridge releases targeted newer Lens APIs and were incompatible with 5.23; package mutations also exposed editor errors and a crash. The working compatible setup was recovered before the current implementation work.

### Stage B: deterministic investigation

Primary code is in `Assets/Scripts/Engine/` and `Assets/Scripts/Content/`. These are plain TypeScript modules shared by Lens and Vitest, with no Lens or Node APIs in the engine/content layer.

- Core: shared types, canonical serialization, reproducible hashing and sfc32 PRNG with named independent substreams.
- Rooms: five fixtures, normalized identity independent of layout, affordance binding and deterministic missing-prop substitution.
- Solver: hypothesis enumeration, player-knowledge solving, reachability, independent evidence routes, eight structured checks and minimum clock-cost route.
- Reducer: host sequence ordering, replay, questions, Believe/Press/Object, evidence, suggestions/refutation, Hunches, beats, accusations, score inputs, canonical notebook and validated performances.
- Performance safety: current-account-only fact sheets, per-call enums, Gazetteer, seven validation gates, authored line bank and keyword topic matching.
- Terminal: interactive command player plus scripted solve demonstration.
- Fuzz: 1,000 deterministic fair players, 29,487 actions; 250 correct verdicts, 699 timeouts, 51 credibility failures, with the relevant invariants preserved.

Important truth rules already enforced: false claims never become known facts; a model cannot choose truth or verdict; rejected prose does not become prompt memory; a same-layer baseline correction cannot skip the main lie ladder; repeated objections cannot repeatedly earn Hunches; confession requires the deterministic correct verdict and culprit.

The solver's minimum route for the hero is **0 case minutes** because eight physical observations are free. This is neither zero real playtime nor a measured fifteen-minute playtest. Player fuzz uses a fairness rule that eventually takes charged actions; a player can legally stall forever with free actions.

### HARLOW-1041 content

See [STORY.md](../Assets/Scripts/Content/STORY.md) for the authored story and solve route. Victim: Edmund Harlow. Suspects: Imran Qadir, Marguerite Vale, Dr Ada Okafor and Jonah Pike. Vale is the culprit; the envelope is S2 / Z1 Study / O1 cable. The murder slot begins at 22:30, body discovery is 22:41, and the case clock is 180 minutes.

Vale has three principal accounts (`C_VALE_ALIBI_0/1/2`), separate baseline questions, and a final confession gated by the verdict. Letter, voicemail, flight and blackout beats are prevalidated in content; their complete spatial experiences are not built.

## 4. What exists in Lens

### C1: authored room and presentation shells

The detailed C1 inventory is [c1-build-manifest.md](c1-build-manifest.md). It records the original 55 authored objects, seven materials, five UIKit shells, plaques, procedural furniture, hinged crate and audio. C3/C4 added actor/console/adapters after that inventory.

`RoomscriptMain.ts` only wires references, lifecycle and UI events. The current shells navigate, update counters, show demo topics and play cues; they do not yet constitute the playable Lens investigation.

The five panels are `RoomscriptCaseLidUI`, `RoomscriptChipBarUI`, `RoomscriptVerbBarUI`, `RoomscriptNotepadUI`, and `RoomscriptEvidenceWalletUI`. Notebook and wallet are modal and hide underlying controls. The common `RoomscriptPanelUI` uses UIKit BackPlate, FlexLayout and RectangleButton.

`RoomscriptPreviewRoom` enables stand-ins only when `global.deviceInfoSystem.isEditor()` is true. The room uses centimeters and a floor offset of -160 cm. The articulated crate opens with readable WHO/WHERE/WITH WHAT labels. Ten generated cues and a quiet generated music loop are present. The first-play AudioComponent bug was fixed and regressed: never stop a player before it has a track.

### C2: the engine bridge

`RoomscriptEngineBridge.ts` is the sole Lens-side owner of the graph/state. `initialize()` loads the hero, verifies it, and prints `Roomscript solver: unique ✓; checks=8; hypotheses=1; minRoute=0`. `dispatch(payload, player)` assigns the next host sequence and calls the reducer. `snapshot()` and `caseGraph()` return copies; `onState` updates the case HUD.

The bridge LEAF test verifies a real Ask costs fifteen minutes, a false account does not become knowledge, replay matches exactly and returned snapshots cannot mutate the owner. The capture shows 165 minutes after that test.

### C3: Vale's actor

`RoomscriptSuspectActor.ts` uses four original placeholder textures: neutral, listening, rattled and broken. The billboard is 170 cm tall and stands at `(175, -160, -300)` behind the editor-only kitchen console. This is to the right of the initial forward-facing UI. Hero Kitchen Z4 is bound by semantic role to the physical kitchen; do not equate hero and fixture numeric zone IDs.

`Assets/Actor/RoomscriptPuppet.graphShader` provides an alpha-edge rim warmed ivory → amber → coral by engine composure, plus mouth-region deformation driven by an audio amplitude envelope. Engine state selects the stressed poses. The four textures are intentionally placeholder theatre art, not finished portraits.

The actor test verifies posture changes, stress after a correct objection, grounding and amplitude smoothing. The C4 real speech test subsequently observed a maximum jaw value of approximately **0.502**, confirming the live audio-to-actor path. Human listening quality remains unverified.

## 5. Unfinished implementation preserved at pause

### C4: AI adapters, recording and speech

Files now exist:

- `Engine/ai/LlmPort.ts`, `Prompts.ts`, `Scheduler.ts`, `Deadlines.ts`, `Tape.ts`, `ProviderSchema.ts`.
- `RoomscriptLlmClient.ts`: Gemini and strict-schema OpenAI through RSG, injected Lens clock, shared scheduler and a deliberate offline switch.
- `RoomscriptTts.ts`: sentence splitting, OpenAI speech, LowLatency playback, cancellation, actor audio linkage, 60-clip LRU and explicit subtitle fallback.
- `RoomscriptAiLeafScenario.ts`: real live answer, validation, record/replay equality, no replay transport, speech, jaw movement, offline cache hit and uncached subtitle fallback.
- `Tooling/scripts/harvest-tape.ts` and `Content/Tapes/C4Gateway.ts`.
- `LlmOutput` action type and reducer audit-only handling.

The scheduler counts actual pending transports, including canceled transports that cannot abort. **Wrap deadlines outside `Scheduler.submit`**, otherwise a timeout can incorrectly release a still-active physical slot. Raw model output is logged as `LlmOutput` before validation; it changes only sequence/log, not facts, clock, beats or presentation history. Accepted speech still requires `LineSpoken` admission through the validator.

Tape modes are LIVE, RECORD, REPLAY and HERO. Keys hash the canonical request/model/prompt version; repeated calls have ordered occurrences. RECORD emits `TAPE|key|base64`. The harvester validates entries and credentials, rejects conflicting duplicate occurrences, constrains output to `Content/Tapes/*.ts`, and will not overwrite a different module. Generated modules export `tapeEntries`.

The first live test failed because Gemini rejects JSON Schema `uniqueItems`. `ProviderSchema.ts` now converts the supported subset and has a regression test. Application validation still enforces omitted constraints.

The rerun **passed** strict LEAF in 23.170 seconds. Its captured model response was the valid account, “I was in the Kitchen making tea at 22:30.” The one recorded text request took approximately **8972 ms**, substantially slower than Stage A's simple probe median; this is a single integrated sample, not a new latency distribution. The test used a twelve-second diagnostic request deadline. Production C5 must retain its 6.5-second fallback, so do not treat this successful diagnostic request as meeting the production timing budget.

Still needed before C4 is treated as an ordinary completed package: review the preserved changes, verify the final saved tree compiles/starts, resolve the full-suite harness verification, and connect/verify the production chip route as part of the C5 integration. The UI currently does not invoke this pipeline. The OpenAI production adapter compiles; its exact new request path has not received the same live round-trip test as Gemini.

### C5: pure answer pipeline only

`Engine/ai/AnswerPipeline.ts` has fifteen passing unit tests. It provides cache-first chips, live free questions, immediate detective text, filler callbacks at 600 ms and 2.5 s, a generation deadline, a 6.5-second hard fallback and at most one retry when enough time remains. Its fallback order is authored line bank, validated canonical wording, then deflection. It never mutates game state.

`start()` returns a task with `promise`, `cancel` and a cancellation token. Pass that token to TTS; a subsequent question cancels stale audio even after the earlier answer promise resolved. A `ChosenAnswer` reports answer, mode, origin, latency, attempts and rejection count.

Missing: Lens interrogation controller and Main wiring; subtitles/detective/filler presentation; topic correction UI; device keyboard; Preview's explicit free-question list including a weird question; notebook/wallet updates; live latency and rejection measurements; network-off LEAF/captures. The `specs-keyboard` skill was read in preparation, but no keyboard code was written.

### D5: case compiler engine preparation

Worker-written modules are `CasePitchSchema`, `PitchValidator`, `Simulator`, `Dealer`, `StatementBuilder`, `BeatPlanner`, `CaseCompiler`, and `RepairPlanner`, alongside six authored pitches in `Content/PitchLibrary.ts` and a case fuzz harness.

`compileCase(seed, room, pitch, options?)` returns an accepted graph or structured failure, attempt count, trace, errors, solver issues, repair suggestions, bindings and timeline. The compiler caps attempts at fifty. Seeded timelines, physical witnesses, weapon movement and envelope variation are generated; narrative model fields do not become mechanical truth. The shared types were not changed for this subsystem.

Earlier final-graph runs accepted **5000/5000 cases**, one thousand on each fixture, with sixty distinct room/envelope combinations and all accepted on their first attempt. Thirteen targeted compiler tests passed, including physical carrying and repair/bounded-failure behavior. **Live pitch acceptance is not measured.** No Lens compiler overlay or P1/P2/P3/P4/P8 orchestration exists.

The integrated Vitest process exposed a harness problem: one synchronous five-thousand-case test blocked worker RPC long enough to time out `onTaskUpdate`. Every assertion passed, but the process exited 1. Before pause, the worker fully applied an async harness using the same generator and `setImmediate` every twenty-five cases, with a sync/async equivalence regression. Its verification run was interrupted on Wadood's pause request. **The async fix is unverified; do not report the full suite green.**

## 6. Verification record and its limits

| Check | Result |
|---|---|
| Completed Stage B suite | 170 tests passed across 11 files |
| Latest integrated suite before async harness edit | 250 assertions/tests passed across 21 files; **exit 1** from one unhandled Vitest worker RPC timeout |
| Case compiler worker targeted tests | 13 passed; later full async run interrupted |
| AI raw-output regression | 6 passed |
| Tape harvester | 12 passed |
| Pure answer pipeline | 15 passed |
| Gemini provider-schema regression | 1 passed in integrated run |
| C1 LEAF | `roomscript-shell-navigation`, `roomscript-shell-ik-reach` passed `fail-fast` |
| C2 LEAF | `roomscript-engine-bridge` passed `fail-fast` |
| C3 LEAF | `roomscript-suspect-actor` passed `fail-fast` |
| C4 LEAF | `roomscript-ai-record-replay` passed `fail-fast`, 23.170 s |
| Last successful Lens compile/start | C4 adapter/test version passed before final worker harness edits and harvested tape import; no final post-pause recompile attempted |

Stage A's two probe scenarios passed, but the requested diagnostic policy `fail` was unrecognized and defaulted. Use **`fail-fast`** for strict checks. This correction is recorded; do not retroactively claim strict Stage A execution.

Known editor diagnostics: LEAF sometimes warns that its instance was destroyed before settings finished loading. Rapid recompiles also emitted pending-message-cap warnings; active worker file writes briefly produced compile-data warnings for generation files. Distinguish these from game runtime errors. On resume, collect a clean post-compilation startup after workers stop writing.

Key reviewed images:

- `docs/captures/2026-10-28-c1-shells-fixed.png`: shell layout.
- `docs/captures/2026-10-28-c1-notebook.png`: modal navigation.
- `docs/captures/2026-10-28-c1-crate-front.png` and `...-c1-crate-isometric.png`: lid/envelope readability.
- `docs/captures/2026-10-28-c2-engine-bridge.png`: LEAF pass and 165-minute HUD.
- `docs/captures/2026-10-28-c3-neutral.png`: isolated actor.
- `docs/captures/2026-10-28-c3-rattled-console.png`: stressed pose and furniture occlusion.
- `docs/captures/2026-10-28-c4-record-replay.png`: strict AI integration pass banner; not proof that production UI is connected.

The C4 source log is `C:/Users/wadoo/AppData/Local/Snap/Lens Studio/logs/LensStudioLog-2026-10-28-20-04-09-576-866b8.txt`; harvesting began at byte **3442262**. `C4Gateway.ts` contains one validated tape record. Raw credentials were not included in it.

## 7. Remaining work, in implementation order

1. **Finish C4/C5 integration and verification.** Resolve async fuzz verification, establish a clean Lens baseline, refresh tokens only for live tests, wire the real question path and complete the interaction/latency/replay checks. Preserve the truthful distinction between canonical claim cards and model performances.
2. **C6 tells and verbs.** Prop flare/SFX; gaze line at 300 ms after audio starts; baseline teaching; exact line hover preview; composure ring; lawyering walkout/return. The reducer emits tell events before performance selection: the presenter must defer them and suppress them for deflection/filler/lawyered speech.
3. **C7 objects and spatial objection.** Pinchable objects, sound/Polaroid/wallet cards, drag statement onto evidence, deterministic judgment, correct/wrong staging, path tear/shatter, layer change and movement. Verify shots 9–12 and LEAF; then evaluate Gate C and tag `m2-slice`.
4. **D1 Clue layer.** Suggestion pawns/zone/object, ghost, clockwise refutation sweep, private card, envelope reaction and knowledge-driven notebook/grid/room states.
5. **D2 opening ritual.** Full knock/tape/crate/chalk/envelope/riffle/seal sequence and suspect arrivals. Existing crate animation/audio are prerequisites, not the finished ritual.
6. **D3 accusation/endgame.** Three-card accusation, hold seal, deterministic ladder, reenactment, scoring, correct/wrong endings.
7. **D4 casting.** Manual tagger, substitution UI, Preview vision-assisted suggestions with confirmation, device unprojection/World Query path marked verify-on-device.
8. **D5 generation.** Integrate and verify prepared engine; implement live pitch/repair/line packs/critique/evidence and compiler overlay. Measure live acceptance separately; apply authored-primary fallback if thresholds fail.
9. **D6–D7.** Automatic degradation/stage mode, complete Lens LEAF suite and `m3-case`.
10. **E1–E8 in order.** Visible lie ladders; Wren; Director/evidence; blackout/luminol; gossip; Imagen portraits with fallback; closing argument/defence; Morning Edition/case file. `m4-should` requires items 1–4.
11. **F only if gate passes.** Must tier green, E1–E4 done and successful Sync probe. Then deterministic two-peer protocol/private notebooks/turn order, Sync Kit bridge/ownership/host-only AI/private visibility/local audio, two-pane acceptance and `m5-cluenight`.

No device work, filming, Devpost submission, publishing, remote creation or pushing is authorized by this pass. Physical-only checks should be documented rather than blocking unrelated implementation.

## 8. First actions after Wadood resumes

1. Read `AGENTS.md`, `PROGRESS.md`, this handoff and `FIRST_PASS.md`; inspect git status. Preserve the WIP checkpoint. Recheck router `preflight_only` and Specs project configuration if the editor/session changed.
2. Run the corrected generation tests to completion, then the integrated suite. Do not weaken the checks or count the earlier exit-1 run as green.

   ```powershell
   cd Tooling
   npm.cmd test -- tests/case-generation
   npm.cmd test
   ```

3. Use MCP `RecompileTypeScriptTool`, then `RunAndCollectLogsTool` refresh. Do not compile Lens components with Node/tsc. Diagnose any final import/metadata problem without changing Cache.
4. Re-run the offline shell/bridge/actor LEAF scenarios as needed for changed concerns. Correct strict policy: `fail-fast`.
5. Generate SNAP, OPENAI and GOOGLE credentials together through the CLAD authorized Editor Network flow, save, and rerun the live AI integration only when ready. Credentials expire after roughly one hour; blank/save before any commit.
6. Finish C4 review/checkpoint, then build the C5 controller. Use CLAD skills and inline agent procedures; do not spawn the C1 experience-builder a second time.

Useful tooling commands from `Tooling`:

```powershell
npm.cmd run play
npm.cmd run play -- --demo
npm.cmd run fuzz
npm.cmd exec -- tsx scripts/fuzz-cases.ts 1000
npm.cmd exec -- tsx scripts/harvest-tape.ts capture.log ../Assets/Scripts/Content/Tapes/Name.ts --from-byte 12345
```

There is no `fuzz:cases` package script yet; use the explicit command above. Do not rerun large fuzz jobs concurrently with live latency measurements: CPU contention compromises timing interpretation and can provoke test-runner timeouts.

## 9. Ten-minute guided Preview tour at this checkpoint

This tour shows the current build, not a complete playable Lens case. Credentials are deliberately blank, so skip live AI calls until the next development session refreshes them.

| Time | What to try | What it demonstrates |
|---|---|---|
| 0–1 min | Open the saved project and Preview, SPECS 27 / Evening Room. Reset if needed. Inspect Logger for the unique solver report. | Engine initializes and HUD starts at 180 minutes. |
| 1–2 min | Pinch **Notebook**, switch **Statements**, then **Close notebook**. | Modal UIKit shell; contents are not yet the full live notebook. |
| 2–3 min | Pinch **Evidence**, try its navigation controls, close it. | Evidence wallet shell; object collection is still future C7. |
| 3–4 min | Use **Cue** repeatedly, and watch the crate open after a reset. Look left toward the crate if outside the initial view. | Generated cues, music, articulated lid and three envelope labels. |
| 4–5 min | Inspect the kitchen area to the right, or use the saved neutral and rattled actor captures. | Vale at her claimed mark, ivory puppet and lower-body occlusion. |
| 5–6 min | Open the LEAF panel, choose Preview and run `roomscript-engine-bridge` with `fail-fast`. | Real Ask action changes the clock to 165; replay/isolation checks pass. Opening/running LEAF resets Preview. |
| 6–7 min | Run `roomscript-suspect-actor` in LEAF. | Listening/jaw checks, a correct objection, changed posture/stress. It uses scripted test actions, not finished user gameplay. |
| 7–8 min | Run `roomscript-shell-navigation`; optionally `roomscript-shell-ik-reach`. | Shell controls, audio/geometry checks and simulated hand reach. |
| 8–9 min | Review the C3 and C4 captures and the recorded tape module. Do not run the live AI scenario with blank credentials. | Evidence of live validated speech, real jaw motion and offline replay from the previous test. |
| 9–10 min | Return to/reset the normal Preview. Try the question/verb shells while noting their current limits; read the next-run list above. | Clear boundary: buttons currently update demo topic/cue presentation, not a full investigation. |

For a complete investigation today, the separate terminal demo is available with `npm.cmd run play -- --demo`: it reaches three objections, four deductions and a correct verdict at 75/180 case minutes. That is a terminal feature, not a Preview feature.

## 10. Known limitations to carry forward

- Production Lens question, evidence, tell, accusation and endgame flows are unfinished.
- UI currently dominates the forward view while Vale is in the kitchen to the right. C5/C6 need coherent interrogation staging and readability review.
- Placeholder actor art and primitive furniture are intentional first-pass assets; device occlusion against real furniture is unverified.
- Full suite exit status is not green until the async fuzz harness completes successfully.
- One live answer took about nine seconds; production fallback must be verified under this slower condition.
- Gemini's provider schema is a subset, and lexical line validation is not a semantic proof. Canonical cards and the engine remain authoritative.
- Gateway rate limits require bounded retries/cooldown. Built-in TTS and current Imagen behavior require the recorded fallbacks.
- ASR/mic, AR keyboard, device camera permissions, tracking, World Query, spatial audio and physical Specs interactions remain **verify on device**.
- Sync, live pitch acceptance, full interrogation rejection rate, end-to-end latency distribution and human audio quality have not been established.

Resume from this state; do not restart the engine or redo completed setup merely because the session context changed.
