# Roomscript progress — RESUMED

Updated 2026-10-28 23:47 PKT. Lens Studio MCP is restored: correct project, signed in, LS 5.23.2, Perspective/World camera, SIK/UIKit 2.0.0 and SPECS 27 Interactive Evening Room verified. Node 22.14.0 available; Blender CLI absent (not needed for current pure-engine fixes).

## Current review fixes

- E1 complete: objection evidence must equal a listed breaker set. Evidence dumping and partial multi-item evidence are rejected; exact multi-item routes remain valid. Targeted game/player suite: 25/25 passed. Lens compile and runtime clean; runtime front capture reviewed (existing shell, staging still pending).
- Next: E2 absent-suspect action guards, then E3/E4 and A1–A4, P0 hygiene; C5 with L1 and A5–A8 afterwards.
- Tests need elevated local execution because sandboxed esbuild cannot resolve the workspace config through the user directory. Approved retry passed; no test assertions weakened.
## Resume scope and review corrections

Approved scope: one complete case first (live AI interrogation and tells, Spatial Objection, suggestion sweep, accusation/reenactment, opening), then should tier in plan order. Clue Night only if the core case is done and green by November 4. See [decisions.md](decisions.md).

Order: every review P0 with regression coverage; C5 with L1 and A5–A8; staging; C6; C7; D1; D3; D2; D6/D7; should tier; conditional Clue Night. All implementation findings remain open. Restore MCP and pass preflight first. Refresh credentials at live AI tests and blank them before every commit.

**Review corrections supersede the historical pause-time verification statements below.** The [test review](reviews/2026-10-28-tests.md) records **252/252 tests across 21 files, exit 0 (69.5 s)** and verifies async case-fuzz batching against a failing synchronous counterfactual. The [Lens review](reviews/2026-10-28-lens-and-repo.md) found final-tree compilation at **22:06:08** and four subsequent clean Preview starts. These are review evidence, not checks rerun in this session. Two Tooling test type errors remain at `tests/ai/pipeline.test.ts:38`; passing Vitest does not establish typecheck success.

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

Workers stopped; the generation worker's active test was canceled. Four generated Git LFS hook files are intentionally untracked. No further development is authorized until Wadood resumes.

## First work after resume

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
