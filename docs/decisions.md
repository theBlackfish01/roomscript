# Decisions

One entry per decision: date, decision, why, alternatives considered. Newest at the top.

- **2026-10-28: Wadood resumed and approved core-case-first scope.** Build one complete case end to end: live AI interrogation with tells, Spatial Objection, suggestion sweep, accusation and reenactment, and opening. Then the should tier in plan order. Clue Night only if the core case is done and green by **November 4, 2026**. This supersedes the October 26 unconditional scope. Order: every review P0 with a regression test; C5 together with L1 and A5–A8; staging; C6; C7; D1; D3; D2; D6/D7; should tier; gated Clue Night. Reason: deliver a demonstrable case before expanding breadth. Alternatives: pursuing all tiers concurrently or cutting should entirely. Follow FIRST_PASS §1b in Codex, refresh tokens when reaching live AI tests, blank them before every commit, and commit each item.
- **2026-10-28: resume preflight requires Wadood.** RoomScriptF.esproj exists, but this Codex session exposes zero Lens Studio MCP tools (including ListAllPanels, ExecuteEditorCode, VirtualScene and RecompileTypeScriptTool). The installed router skill is available. Stop implementation per AGENTS.md and FIRST_PASS §3; ask Wadood to open this project with MCP enabled and restart/reconnect Codex. Raw HTTP is not an alternative. No implementation, tests, Lens mutations or token generation occurred during this attempt.

- **2026-10-28: room role binding distrusts scan-provided capabilities.** Derive affordances from a fixed type table; normalize IDs, references, confidence and centimeter coordinates. Room identity hashes sorted types and canonical zone indices, excluding layout/labels. Virtual props fill minima and required typed roles; completely empty scans require an explicit placement anchor. All five fixture types pass 25 tests.

- **2026-10-28: shared engine contracts and units.** B1 establishes platform-free Types, UTF-8 FNV-1a, sorted canonical JSON and named sfc32 substreams. Room coordinates use centimeters end to end to match Lens Studio; the design's illustrative meter values must be converted on ingestion. Model prose actions have no truth/verdict/tell fields; reducers must validate all externally supplied IDs and keep truth in CaseGraph. Canonical serialization rejects unsupported/lossy data rather than silently dropping it.

- **2026-10-28: A5 model/fallback decision.** Gemini 2.5 Flash is primary structured chat (20/20 valid); gpt-4o-mini secondary (8/20, 12 rate limits). OpenAI gpt-4o-mini-tts works (20/20). Use cache-first chips, validated live free text and 6.5s hard LineBank fallback: separate chat+TTS medians sum to ~3.96s, not a measured end-to-end median. Keep cap 4 but add cooldown/suppress speculation on rate limit. Built-in TTS is unavailable here, so subtitles are the final audio fallback. Imagen stays optional with authored art because its exact example request is rejected. Preview camera shows Evening Room, so use its stream for vision rather than a bundled photo. Sync gate remains deferred. Full measurements/decisions: docs/probe-results.md.

- **2026-10-28: measure completed concurrency batches.** The first P-f implementation rejected on the first failed sibling, potentially overlapping subsequent batches. It is diagnostic-only and excluded from the authoritative concurrency result. `settleProbeBatch` now awaits all siblings; two Vitest regressions cover early asynchronous and synchronous rejection. The rerun uses two seconds between batches.
- **2026-10-28: camera results require a valid display material.** A missing Image material caused local display failures, not camera-service failure. Added an authored ImageMaterial preset, clone per display and a LEAF material assertion. Final P-g passed 20/20 and displayed the simulated Evening Room. Initial failed P-g runs are excluded.

- **2026-10-28: use gpt-4o-mini for the four-call concurrency probe.** Initial gpt-4.1-nano calls returned not-found failures while gpt-4o-mini returned schema-valid text. Concurrency needs a responding endpoint; do not infer throttling from an unavailable model. Final model selection awaits complete batches.
- **2026-10-28: report built-in TTS as unavailable in this editor API.** LS 5.23.2's TextToSpeechModule is deprecated and declares no synthesis methods. P-d logs 20 capability checks, not pretend network requests. If OpenAI speech fails, subtitles remain the honest Preview fallback; keep device verification explicit.
- **2026-10-28: UIKit lifecycle and ancestry.** Set FlexLayout.autoDiscoverItemsOnStart=false before manually adding items; parent content beneath its BackPlate so the plane and controls share an interactable ancestor. Both regressions are covered by the LEAF panel scenario, with separate strict IK reach coverage. Opening LEAF resets Preview, so finish testing before measuring provider batches.

- **2026-10-28: pin the inspection bridge to 2.0.1.** MCP auto-install selected a package with newer UIKit/InteractionKit imports. Its version switch failed because the archive was not registered in the Asset Library. Installed explicit 2.0.1, rewired via VirtualScene, removed the incompatible archive via AssetManager and renamed the replacement. Compilation, logs and runtime queries pass. Check compatibility before other testing-package imports.
- **2026-10-28: store native package archives directly in this local repository.** Override generated LFS filtering for `.lspkg` outside the managed block; no LFS remote exists and recoverable local snapshots are required. Preserve generated text/scene rules and the secret hook.

- **2026-10-28: strict staged-secret scanning, including documentation.** The pre-commit hook rejects authorization scheme prefixes, PEM blocks and populated gateway scene fields. The plan spells the prefix's trailing space as `\x20` so the requirement remains documented without creating a false positive. Lens boolean ScriptInputsDefault metadata is distinguished from actual ScriptInputs values. No hook bypass is used.

- **2026-10-28: pin packages to the installed Lens Studio release.** RSG 4.0.0 targets LS 5.25.0 and its renamed UIKit/InteractionKit imports break this LS 5.23.2 template. Select RSG 2.0.1 (Asset Library target 5.23.0), Utilities/SnapDecorators 2.0.0; verify before proceeding. Alternative: migrate all libraries/editor to the newest generation, rejected because sign-in on newer Lens Studio already blocked this project and the current build should stay on 5.23.2. Never patch Cache sources.
- **2026-10-28: Evening Room for the initial Preview baseline.** The source was discovered through PreviewPanelTool, configured as Interactive / SPECS 27 and read back. It offers a dim staging environment consistent with additive-light art direction. The authored Roomscript PreviewRoom remains future C1 work.
- **2026-10-28: use inline CLAD procedures in Codex and generic workers for disjoint pure tooling/engine work.** FIRST_PASS §1b governs the runtime adaptation. Main owns Lens scene writes and verification; the A2 worker owns Tooling and .githooks only. No typed markdown-agent spawn or nested agents.

- **2026-10-28: Lens Studio 5.23.2, project `RoomScriptF`.** SPECS developer-account sign-in fails on 5.24 (a known issue; the hackathon Devpost page advises 5.23.2). The project was recreated from the Specs Base Template in 5.23.2 rather than downgrading the 5.24.1 project. 5.23.2 meets CLAD's 5.22+ requirement. The game is still called Roomscript; only the folder and project name changed.
- **2026-10-27: repo root = this Lens project folder.** Lens Studio maintains `.mcp.json` here and CLAD is installed at project scope here, so one agent session in this folder gets both. The engine lives in `Assets/Scripts/Engine/` (compiled by Lens, tested by vitest from `Tooling/`). Alternative considered: a parent repo with the Lens project as a subfolder (rejected: MCP and CLAD wouldn't load from the parent).
- **2026-10-26: scope = must + should + Clue Night** (Wadood). Preview first; a device is expected before Nov 8.
- **2026-10-25: live answers via chat + validator + TTS, not Realtime.** The validator must run before audio plays, and Realtime mic input is device-only. Realtime is at most a device-only stretch for Wren's banter.

- **2026-10-28: separate baseline corrections from the main cover ladder.** A same-layer topic override replaces the harmless baseline lie after proof; it cannot skip Vale's murder accounts. Shared Statement.replacementFor and SuspectState.topicOverrides encode this explicitly; reducer and performance tests cover it.
- **2026-10-28: refute a suggested tuple, never use a hidden-envelope shortcut.** A true alibi card must actually contradict the suggested WHO/WHERE/WHAT tuple under the solver. Suspect refutations are restricted to currently available truthful accounts. The notebook grid uses only observed facts.
- **2026-10-28: free inspection means a zero case-minute minimum route.** The hero solver finds eight independent physical observations sufficient to isolate the envelope, with minimum0 and slack1. Questions/pressure/suggestions still cost15 minutes, unknown-topic deflection5. Interrogation is the dramatic and teaching route; zero clock cost is not zero real playtime or a measured 15-minute playtest.
- **2026-10-28: rejected model prose never becomes prompt memory.** Keep every attempted model output in the action log for audit/replay, but construct recent dialogue only from accepted lineSpoken events. Seven gates validate performance; only the deterministic verdict can unlock confession mode.
- **2026-10-28: fuzz fairness and pre-break reachability.** Random players must eventually take time-consuming actions; unlimited free Dismiss is a legal stall, not a termination bug. The fuzz harness caps free/arbitrary actions at7 before a charged action. Breaker alternatives are counted with the current break edge disabled, preventing its own unlocked target from masquerading as an independent prior breaker. Inherited baseline corrections compare source/target layers, avoiding repeat-Hunch rewards.
- **2026-10-28: explicit stand-in bootstrap, separate authored roots.** C1 uses the requested simple furniture placeholders and procedural articulated crate, with position/dimension/material controls. UI stays UIKit; the engine remains pure. PreviewRoom subtracts160cm eye height from floor-space fixture coordinates and is disabled outside editor.
- **2026-10-28: first-play audio and strict LEAF policy.** Never stop an AudioComponent before it has a track/player; stop only if a track exists and is playing. The shell scenario regresses first playback. LEAF2 accepts `fail-fast`, not `fail`; the earlier Stage A strict-policy wording was incorrect and has been corrected. C1 explicitly passes fail-fast.

## 2026-10-28 C2: single state owner
RoomscriptEngineBridge owns the deterministic graph/state and publishes copies; Main only wires UI counters and lifecycle. This prevents presentation adapters from mutating truth. LEAF verifies replay and copy isolation inside Lens.

## 2026-10-28 C3: theatre placeholder and room role binding
Use original vector-drawn ivory puppet textures for the four explicitly requested placeholder poses. Custom shader samples the silhouette edge for a stress rim and warps the lower lip from an audio envelope; no model output selects stress. Hero logical Kitchen Z4 binds to the physical kitchen plaque/stand-ins by role, not fixture numeric IDs (fixture kitchen differs). Vale stands at (175,-160,-300), behind an editor-only console. Full speech playback linkage is verified in C4.

## 2026-10-28: explicit development pause and WIP preservation
Wadood requested a pause and extensive documentation. Stop all implementation and worker tests; preserve unfinished C4/C5 and D5 preparation in local WIP commit260d801, without marking their packages or milestones complete. The active generation acceptance run was canceled. The new async batching fix remains unverified. Blank all three gateway token fields through VirtualScene and save before committing. Resume only on Wadood's instruction; docs/PAUSE_HANDOFF_2026-10-28.md and PROGRESS.md are the restart sources.

## 2026-10-28: provider schema subset and measured integration limits
Gemini rejected uniqueItems in responseSchema. ProviderSchema projects the supported schema subset, with a regression test; the deterministic line validator continues enforcing omitted constraints. One full-account Gemini answer took8972ms under the diagnostic12s deadline, then passed validation, RECORD/REPLAY and TTS/jaw checks. Preserve the production6.5s fallback and measure a real distribution during C5; do not reuse the simpler Stage A median as end-to-end proof.

## 2026-10-28: raw outputs are audit-only actions
Every TapeClient output is admitted first as LlmOutput. Reducer handling returns after sequence/log append, including after verdict, without touching knowledge, beats, clock or presentation. Accepted performances remain separate validated LineSpoken actions. The harvester uses the shared safe tape decoder and refuses conflicting occurrences or unsafe output paths.

## 2026-10-28: distinguish fuzz assertions from process success
The integrated run completed250 passing tests, including5000 accepted generated cases, but exited1 after Vitest worker RPC starvation. A worker added event-loop yielding every25 completed cases without changing compiler inputs. Its final verification was interrupted at pause. Record the run as not clean; do not weaken assertions or silently count it as a passing suite.

- **2026-10-28 23:47 PKT: resume preflight cleared; E1 uses exact breaker sets.** MCP connected to RoomScriptF with sign-in true; the prior unavailable-session blocker is historical. Reconfirmed Wadood's core-case-first scope and November 4 Clue Night gate above. Objections require set equality so evidence dumping cannot advance ladders; multi-card authored proofs remain supported. Alternative: penalize each irrelevant card, rejected because drag-and-prove should have one clear result.

- **2026-10-28 23:48 PKT: E2 absence applies to all suspect treatment actions.** Reject Believe, Object, CallLiar and RevealEvidence while lawyered, without charging pips or changing memory. Keep log/rejected event for replay. Actions become available at the same clock boundary as Ask/Press.

- **2026-10-28 23:50 PKT: E3 independent direct contradictions.** Recording, voicemail and Okafor's reply are each sufficient proof that Harlow answered after Vale arrived. Removed the redundant cable requirement; evidence guessing remains prohibited by E1.

- **2026-10-28 23:56 PKT: E4 paid object inspection supersedes the earlier free-inspection decision.** Charge 10 night-minutes per holder's newly available object memories (max bundled evidence cost), free repeat viewing. Automatic beat-delivered documents remain free. Hero minimum is 80 minutes; rating uses the solver's real weighted minimum and efficiency requires all supported deductions. Rejected a three-wake-up cap because it blocks otherwise valid clue discovery. The long teaching demo uses the already delivered letter for motive and finishes at 175 minutes. Weighted solving increases the 5000-case batch to about 122 seconds; allow 240s while preserving seeds/acceptance checks.

- **2026-10-28 23:59 PKT: A1 opaque stable performer refs.** Hash kind plus private ID into an opaque 16-hex alias; detect duplicate aliases before sending a sheet. Stable aliases preserve recent-line filtering across account changes without including graph names. Generated prompts use neutral topic names and first-person covers that omit the concealed category. Bump answer prompt to v2; retain the original v1 recorded tape as provenance, never rewrite it to masquerade as new live output.

- **2026-10-29 00:01 PKT: A2 validates the exact text presented.** Normalize NFKC, strip format characters and standardize punctuation; speak the returned normalized text. For this English cast, reject non-Latin letters and non-ASCII decimal digits remaining after normalization. Expand contractions only for lexical checks, with explicit time forms and confession/meta/reference guards. Keep original provider output in the audit log. These lexical checks are bounded safeguards, not a general semantic proof.

### 2026-10-29 — A3 conservative performance checks
Compare negation polarity with the required cited claim and reject uncited person/location words and victim conditions. Remove the victim from universally safe entities. Preserve harmless paraphrases; canonical engine cards remain the source of truth. Verified 140 targeted tests and clean Lens runtime.

### 2026-10-29 — A4 performance authority
Use the latest gameplay action and its engine-emitted cue, matched to suspect/topic, to authorize exceptional speech. Layer alone is insufficient because baseline corrections occur at layer zero. Audit-only actions do not invalidate a cue. Caller mode cannot upgrade permissions. Added spoof, same-layer legitimate break, stale cue, press and replay regressions.

### 2026-10-29 — repeatable Tooling typecheck
Added npm run typecheck using the existing Tooling-only configuration and typed the transport mock. This does not replace Lens MCP compilation.

### 2026-10-29 — retain LFS lifecycle hooks
Track the four existing generated hooks unchanged. Keep the pre-commit secret check and pre-push LFS forwarding. Hook contracts are covered by five tests.

### 2026-10-29 — P0 handoff reconciliation
Current progress now leads with the closed P0 fixes and pending C5/P1 work. Historical pause evidence remains labelled as historical; the independent review corrections and subsequent fresh verification are distinct.

### 2026-10-29 — A5 live Gemini configuration
Separate system instructions from user turns, preserve conversation roles, disable thinking and cap output at 384 tokens. Twenty samples all validated at 1.66s median / 2.06s p95. Keep cache-first chips and live free questions per the design; audio still needs a shared deadline. Retain all raw outputs as replay events and a credential-free harvested tape.

### 2026-10-29 — A6 fallback and schema projection
Use the existing single retry for gpt-4o-mini after Gemini failure; preserve the same fact sheet/schema and absolute answer deadline. Map gateway diagnostics to stable codes without retaining secret-bearing text. Strict OpenAI schema uses required properties and no additional properties; local validator still enforces lengths, counts and uniqueness. Real fallback call passed in 2.33s.

### 2026-10-29 — A8 before audio precaching
Keep one physical transport slot available for live work; cancelled requests retain slots until settlement. Clamp interactive cooldown to 2500ms; longer outages use the normal answer fallback. Single-slot schedulers retain existing behavior for constrained callers. This prerequisite precedes A7 within the C5/P1 work group.

### 2026-10-29 — A7 parallel audio within question budget
Prepare all sentences concurrently under the shared scheduler, attach rejection handlers immediately and play in source order. Keep a 60-clip voice-keyed LRU; precache only validated current-account lines and neutral fillers. First audio must begin within 6.5s of the question, while normal playback may finish later. Missing or late audio retains readable subtitles. Authored suspect voice replaces the default onyx. Device listening quality remains a human/device check.

### 2026-10-29 — L1 common coordinate frame
Preserve hero semantic IDs and move its authored coordinates to the existing room fixture. Scene anchors and virtual props use a single floor root at the Preview floor height; runtime consumers transform case-local centimeters through that root. Physical stand-ins remain Preview-only, while anchor/virtual-prop/plaque content remains enabled on device. This fixes the current fixture binding without claiming a real-world room scan.

### 2026-10-29 — C5 reviewed topic and production ownership
Lock the topic before Ask and model generation for both chips and free questions. Corrections are free until submission; model topic changes cannot alter the canonical filed statement. Record raw output before admitting a LineSpoken action. Keep authored cache-first chips, live free questions, current-account audio precache and subtitle fallback. A missing/expired gateway enters offline mode without repeated calls. Three live production samples passed the combined first-audio deadline; this is a small integration sample, separate from the 20-request Gemini text table.

### 2026-10-29 — staging at the actual Preview origin
Use a 1.81m interrogation mark, 30cm question/verb surfaces and a 75%-scale crate with the HUD on its moving lid. Keep subtitles with the actor and reserve full room plaques for 1.2-degree cap height measured at setup; envelope labels retain their separate fixed sizing. Reset interactive Preview camera before placement audits; authored camera transform alone does not describe its runtime pose. Stop the crate tick at completion.

### 2026-10-29 — engine-authorized performance tells
Resolve the cue from the latest gameplay action's tell event and active statement, then delay300ms from real audio start. If audio is unavailable, use admitted subtitle performance start so the playable offline path retains the same clues. A deflection suppresses the cue even if the previous Ask filed a cover. Gaze target is the statement's authored about-object; shader width is0.25degrees at each fragment's depth. Returning availability remains determined by night-minutes; presentation plays a knock and returns the actor when the30-minute absence ends.

### 2026-10-29 - C7 observed-memory selection and VFX blocker
Object drops submit a memory only when that object has exactly one observed evidence item. Ambiguous objects require a wallet card; presentation never searches breakers to choose winning evidence. Memory cards page one at a time. Proven actor marks use true at-facts in the replacement statement and 55cm forward furniture clearance. Direct Preview dragging exposed UIKit backing/proximity colliders re-enabling on reopen; passive backing now disables both after initialization and on enable, with a LEAF regression.

C7 is not accepted yet. The shatter graph imports, but requireAsset and a wired VFXAsset input become null at runtime without native scene instantiation. VirtualScene cannot instantiate it as a prefab. CLAD vfx-graph requires AssetManager.instantiate through ExecuteEditorCode, conflicting with the project's VirtualScene-only rule. Requested one specific exception asynchronously; do not perform it until approved. Proceed with independent D1 while waiting. Diagnostic timeline restored to 1 and particle preview disabled. Captures c7slam/c7paths use 20x diagnostic timing; they prove layout/path rendering, not production duration or the unrendered shatter.

## 2026-10-29 02:51 PKT - D1 verified; C7 effect exception remains pending

D1 uses one deterministic clockwise holder order calculated from the player's setup position and facing and stored in the case graph. Presentation stops at the engine's first refuter and reveals only its private event's observed evidence. An unrefuted suggestion is possible, not a verdict. The notebook and room marks use PlayerKnowledge exclusively; the new regression prevents premature suspect elimination from a location refutation without known murder location.

The two-sweep LEAF regression exposed a native audio timeout in repeated spatial-audio enablement. Initialize a dedicated emitter once, add the camera AudioListener through VirtualScene, and coalesce audible ticks on delayed frames while recording all visited holders. Two successive sweep runs passed after the fix; the final run also checks listener presence and that cue playback does not move the audio host.

C7/D1 share object interaction routing and scene registration. Save one coherent checkpoint containing verified D1 and the explicitly unfinished C7 effect adapter, without milestone tags. C7's required graph effect remains blocked by AGENTS.md's VirtualScene-only rule versus vfx-graph's explicit native AssetManager.instantiate requirement. Wadood's pending exception is scoped to the already-imported RoomscriptShatter asset (51829ea2-ad44-43b1-b5f9-2b54493c160a), one instantiation call, then VirtualScene placement. No raw HTTP fallback and no guessed runtime asset export. Resume C7 verification once approved, then D3, D2, D6/D7 and the should tier.

2026-10-29: The checkpoint commit could not execute: automatic approval review timed out on both the initial attempt and the permitted retry. Work remains saved and uncommitted; stop for Needs Wadood permission guidance. This is an approval-service timeout, not a secret-hook failure or unsafe-action finding.
`n2026-10-29: Use the existing RoomscriptShatter scene object when present, otherwise code shards. No AssetManager.instantiate exception. Personal API credentials remain Tooling-only; detect their formats before harness work.

2026-10-29 review P0: stars 2-3 require one knowledge hypothesis and all exact deductions. Efficiency uses the solver's fully supported route including guaranteed timed evidence (hero 90 minutes). Unrefuted suggestions give neutral wording and no envelope breath; the standard refutation rules remain. Wallet entries include observed statements as well as objects.

2026-10-29 C7: Preserve and wire Wadood's scene VFX object. Runtime asset was null despite its saved asset reference; use the authorized 30-triangle CPU fallback under that object. Do not spend the build on native VFX or call AssetManager.instantiate.

2026-10-29 L2/L3: Three original vector portraits provide distinct lighter/glasses/gloves identities without generation latency. Each has its own actor instance, selected TTS speaker and tell parent. Crate-local cards preserve face visibility; looking down accesses the case desk.

### 2026-10-30 � D3 final accusation
Timeout closes investigation but permits one valid accusation. Reveal reads sealed true timeline facts only after correct/wrong verdict. Explicit File known proof credits only exact known engine routes. Simplified silhouettes provide the reenactment; the result shows rating, case ID and seal.

### 2026-10-30 � D2 opening
The authored opening blocks investigation until the pull-tab and reveal complete. Timing is presentation-only and never advances the action clock. Knock scheduling uses separated beats so a slow first frame cannot skip one. Feature LEAF scenarios skip the independently tested pre-show.
