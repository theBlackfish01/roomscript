# Roomscript review: Lens integration, repo hygiene and plan adherence

Reviewed 2026-10-28 (PKT), at HEAD `12a85b9`, in `C:\Users\wadoo\Desktop\SPECS_Hackathon\RoomScriptF`.

**Method.** This was a read-only pass. I read the files, ran git, grep and Python scripts that only read, and parsed `Assets/Scene.scene` as text. I also cross-checked claims against the Lens Studio log named in PROGRESS (`%LOCALAPPDATA%/Snap/Lens Studio/logs/LensStudioLog-2026-10-28-20-04-09-576-866b8.txt`).

**Limits.**
- I used no MCP tools, did not open the editor and did not run vitest. The handoff says no test runs until Wadood resumes, and running vitest would also write cache files.
- So test counts are the docs' claims, checked only against the test-file inventory.
- I read the CLAD conventions from the installed `ls-clad` plugin: `lens-api/references/conventions.md`, `specs-build-ui/SKILL.md` and `specs-audio/SKILL.md`.

**Labels.**
- **[V] Verified:** I saw direct evidence (file:line, git output or log line).
- **[S] Suspected:** inferred, or needs a runtime or device check.

---

## 1. Executive summary

**The foundation is honest and clean:**
- the engine is pure;
- no secret was ever committed;
- every asset has a `.meta`;
- package versions match the decisions;
- the UI is built from UIKit modules;
- the pause docs are unusually candid.

**The Lens side is still a shell.** None of the production chips or verbs touch the engine. Only the LEAF tests drive the pipeline: `dispatch`, `AnswerPipeline`, TTS and the notebook and wallet setters. That matches what PROGRESS says.

**What the playable demo depends on:**
1. **A room-binding gap.** The hero case is authored against a different room layout from the Preview stand-ins, and nothing in Lens maps case objects to scene objects.
2. **The un-built interrogation controller.**
3. **A latency mismatch.** One measured live answer took 8.97 s, against a 5 s generation and 6.5 s hard-fallback budget.
4. **Staging that contradicts design 03.** The UI wall covers about 90% of the forward view at 1.1 m, and Vale stands 3.5 m away.

The hygiene problems are minor and easy to fix: the hook decision, ownership, a raw-in-LFS blob, stray 4.0.0 packages, and an encoding-damaged clad-log.

**No critical issues in the code or the secrets.** The one critical-level risk is the plan itself: must, should and Clue Night won't fit in about 70 hours. Re-scope now.

---

## 2. Findings

### Critical

**C-0 — Scope against the hours (plan risk) [V for the arithmetic, S for the outcome].**
- **The numbers.** The remaining must-tier work for one full Preview case is about 70–100 h (§8). Wadood's calendar from Oct 29 to Nov 9 holds about 64 h (`docs/plan/human-plan-2026-10-26.md` §11). The IMPLEMENTATION_PLAN scope is still must, should and Clue Night.
- **Fix.** Wadood decides now to lock the demo to the human plan's "never cut" list. That is interrogation with tells, Spatial Objection, the suggestion sweep, accusation and reenactment, and the opening. Defer D4 casting UI, the D5 Lens generation overlay, all of E and all of F. Record it in `docs/decisions.md`.

### High

**H1 — The hero case's coordinates don't match the Preview room, and no Lens binding exists [V].**
- **Evidence.**
  - The hero case's zones are in `Assets/Scripts/Content/HeroCaseHarlow1041.ts:7-11`. Kitchen Z4 is at `[120,0,45]`, Conservatory Z5 at `[140,0,-150]` and Hall Z3 at `[-140,0,90]`.
  - The Preview stand-ins follow the `wadood-room` fixture (`Engine/room/RoomFixtures.ts:15-18`). There, Kitchen is at `[180,0,-250]`, Conservatory at `[-120,0,-280]` and Hall at `[170,0,40]`.
  - Object positions differ the same way. For example, O10 window glass is at `(145,130,-155)` in the case and `StandinWindow` is at `(-120,125,-280)` in the scene.
  - The case's five virtual props have no scene object: O2 candlestick, O3 letter knife, O5 bookend, O7 clock and O12 recorder.
  - No script maps object, zone or suspect IDs to SceneObjects. The handoff's "bind by semantic role" exists only as prose.
- **Impact.** This blocks C6 (a gaze line to the lie's real object), C7 (pinchable objects and Polaroids), D1 (a clockwise sweep that has to match the authored clockwise order, [S]) and D3 (a reenactment walking zone by zone).
- **Fix.**
  - Pick one coordinate truth. Either re-author the hero positions into the wadood-room frame, or move the stand-ins.
  - Add a `RoomscriptRoomBinding.ts` that maps case IDs to anchor SceneObjects.
  - Add a LEAF check that every case object has a bound anchor within N cm.
  - Create the five virtual props as stand-ins with forensic tents.

**H2 — No production interrogation path [V; matches PROGRESS, so this isn't an overclaim].**
- **Evidence.**
  - `RoomscriptMain.ts:29-30`: chips only `setTopic` and play `Tink`, and verbs only play `Objection` or `ClockTick`.
  - Grep finds no production caller of `dispatch`, `AnswerPipeline`, `speak`, `setEntries`, `setClaim` or `setQuestions`. All callers are LEAF scenarios.
  - The notebook and wallet always show placeholders.
- **Fix.** Build the C5 controller (§8, item 3) before anything else on the Lens side.

**H3 — Live-answer latency doesn't fit the production budget.**
- **Evidence [V]:**
  - `Engine/ai/Deadlines.ts:4` sets `generationMs 5000` and `answerMs 6500`.
  - The only integrated live Gemini answer took 8972 ms (`Content/Tapes/C4Gateway.ts`, `latencyMs`).
  - `RoomscriptLlmClient.ts:26-28` sends no `thinkingConfig` and no `maxOutputTokens`. It also flattens every message into one user part instead of using `systemInstruction`.
  - The RSG 2.0.1 `GoogleGenAITypes.ts` supports both `thinkingConfig` and `systemInstruction`.
- **Likely cause [S].** Gemini 2.5 Flash thinks dynamically by default, and that's the likely source of the 9 s. With the current deadlines, most live answers would fall back to the line bank.
- **Fix.**
  - Set `generationConfig.thinkingConfig = {thinkingBudget: 0}` and a `maxOutputTokens` cap.
  - Move the system prompt into `systemInstruction`.
  - Re-measure with 20 samples on the real answer prompt and record the latency table that C5 requires.

**H4 — Interrogation staging contradicts design 03 [V for positions, S for perception].**
- **The UI wall.**
  - Three stacked UIKit panels sit at z = −110 (`RoomscriptCaseLidUI/ChipBarUI/VerbBarUI`). They span x ±23 and y −36…+33.5 (per `docs/c1-build-manifest.md`).
  - That covers about 87% × 90% of the roughly 53 × 77 cm visible area at 1.1 m (design 03 §2.2).
  - The C2 capture `docs/captures/2026-10-28-c2-engine-bridge.png` confirms it.
- **Vale's position.** She stands at `(175,−160,−300)`, which is 3.47 m away and 30° to the right.
- **What design 03 asks for:**
  - "the room is the star" and one hero brightness at a time (§0, rules 1–2);
  - the suspect at 0.9–2.0 m during the interrogation (§2.2);
  - statements as cyan slips by the head (§3.3);
  - "No HUD: the box lid" (§3.5);
  - subtitles at the speaker's depth (§6.3);
  - no large panels (§6.5 item 2).
- **Status.** The handoff (§10) acknowledges the UI dominance but nobody owns it.
- **Fix.** In C5 and C6:
  - Move the clock, pips and Hunches onto the crate lid.
  - Make the chips and verbs a compact row beside or below the suspect, or a lazy-follow wallet.
  - Bring the interviewed suspect to her personality distance of 1.3–2.0 m.
  - Hang statement slips and subtitles at the suspect.

### Medium

**M1 — The zone plaques and the occluding console disappear on device [V].**
- **Evidence.** In the scene hierarchy, `Study/Lounge/Hall/Kitchen/Conservatory plaque` and `KitchenConsole` are children of `PreviewRoom`. `RoomscriptPreviewRoom.ts:3` disables that root when `!isEditor()`.
- **Impact.** On Specs there are no brass plaques, and nothing hides Vale's lower body. Her texture has no below-the-waist fade (design 03 §2.1).
- **Fix.** Put the plaques under `RoomscriptAnchors`, bound to the real zones. Add a hatch fade below the waist to the puppet, or keep a minimal on-device occluder.

**M2 — Hard-coded floor and anchors (device) [V for code, S for device effect].**
- **Evidence.** `PreviewRoom` is at y −160, `RoomscriptSuspectSlot` at y −160 and `InterrogationMark` at −159.8. All are fixed relative to the starting head pose.
- **Impact [S].** A seated or shorter player sees Vale sink into the floor or float. She can also land inside real furniture.
- **Fix.** Before device day, derive the floor from World Query or a hit test, and use D4 placement.

**M3 — The crate is drawn in dark fills that vanish on an additive display [V].**
- **Evidence.**
  - `Assets/Materials/RoomscriptWood.mat` has baseColor (0.35, 0.23, 0.14). It's used by CrateFront, CrateBack, CrateLeft and CrateRight.
  - `RoomscriptSlate.mat` has (0.12, 0.18, 0.22). It's used by CrateBase.
- **Why it matters.** Neither colour is in the palette. The crate is home base and stays on device. Design 03 §6.5 item 1 says dark fills are invisible.
- **Fix.** Draw the crate in brass and ivory engraving lines, or as a bright rim with low-alpha faces.

**M4 — Initialization depends on hierarchy order [V].**
- **Evidence.**
  - `RoomscriptSuspectActor.ts:31` calls `engine.snapshot()` in `OnStart`.
  - Before `initialize()`, `JSON.parse(JSON.stringify(undefined))` throws a SyntaxError (`RoomscriptEngineBridge.ts:21`).
  - It works today only because Main's object is the parent and starts first.
  - But `RoomscriptMain.ts:21` returns early, without initializing, if any of its 7 references is missing. The actor then throws.
- **Fix.** Make `EngineBridge` initialize lazily in `snapshot()`, `caseGraph()` and `dispatch()` (or in its own OnStart). Guard the actor.

**M5 — CLAD convention gaps, which count toward judging [V].**
- **No header contract.** No component has the `/** Name — … Connections … Lifecycle */` header from `lens-api/references/conventions.md`. Each has a one-line comment instead.
- **Legacy `print()`.** Every component uses `print()`, which CLAD's DO NOT list names.
- **Inputs without `@hint`:**
  - `RoomscriptSuspectActor.ts:6-14`, eight inputs, `camera` and `engine` among them;
  - `RoomscriptTts.ts:9-10`.
- **Inconsistent groups.** `group_start` is used inconsistently. `CaseLidUI`, `VerbBarUI`, `NotepadUI`, `EvidenceWalletUI` and `Audio` have none, and there are no `@ui.label` or `@ui.separator` headers.
- **Button size.** `RoomscriptPanelUI.ts:55` sets `RectangleButton.size` synchronously. specs-build-ui G2 says to set it in `onInitialized`. ProbeLabUI does it correctly.
- **Labels.** Button labels are raw `Component.Text` rather than `ElementContent`. There's no theme font and no icons.
- **Fix.** One mechanical pass of 1–2 h.

**M6 — Every suspect speaks with the wrong voice [V].**
- **Evidence.**
  - `RoomscriptTts.ts:19` defaults to `voice="onyx"`, and line 30 hard-codes a generic acting instruction.
  - The content gives Vale `voice:"coral"` with acting notes (`HeroCaseHarlow1041.ts:35`).
  - The AI LEAF scenario calls `speak(line)` without a voice.
  - TTS isn't spatialized, although its object is sensibly placed at the suspect's head (`RoomscriptTts`, local y 145).
- **Fix.** Pass `suspect.voice` and `actingNotes` from the controller.

**M7 — `devpost/clad-log.md` is weak as judging evidence [V]. See §6.**

**M8 — LFS hooks, hooks path and ownership [V].**
- **The hooks.** The four untracked files (`.githooks/post-checkout`, `post-commit`, `post-merge`, `pre-push`) are the standard git-lfs 3.6.1 hooks. git-lfs wrote them into `core.hooksPath=.githooks` at 20:49. The repo stores 16 Assets binaries in LFS.
- **Why they matter.** `pre-push` is what uploads LFS objects. Delete it, or leave it untracked so a clone lacks it, and a future push to GitHub leaves pointer-only PNG and WAV files.
- **Recommendation: track all four.** They're tiny and `.gitattributes:255` already normalizes them to LF. Don't delete them.
- **Clone setup.** A clone also needs `git config core.hooksPath .githooks`. `Tooling/README.md` documents that, but the root docs don't.
- **Ownership.** `.git`, `.git/objects`, `.githooks`, `Tooling` and many scripts are owned by `W-LS5\CodexSandboxOffline`, while the folder and Assets are owned by `wadoo`. That ownership mismatch is why every git command needs `-c safe.directory`.
- **Fix.** Wadood runs `takeown /F <repo> /R /D Y`. Alternatively, he decides to add a scoped `safe.directory`. Agents must not change config.

**M9 — Stray Icons 4.0.0 and Motion 4.0.0 packages from the failed RSG 4.0.0 install [V].**
- **Evidence.**
  - `Packages/Icons.lspkg` (1.9 MB) and `Motion.lspkg` both report version 4.0.0, core 385 / client 14.29. The project is core 372 / client 14.16.
  - No script or other package imports them.
  - They came in A2 (`c71ff8c`) alongside the RSG 4.0.0 attempt.
  - The handoff's list of compatible packages omits them.
  - The `Plugins/0e17…/IconAtlas` editor plugin arrived with them.
- **Fix.** Confirm in the Asset Browser that nothing uses them, then remove them through Lens tools.

**M10 — Text is smaller than design 03 §6.3 asks for [S; computed].**
- **How I computed it.** CLAD's `em = size/43.886` cm, with cap height assumed at about 0.7 em.
- **Plaques.** They use 39 × 1.7 = 66 units, so the cap is about 1.06 cm. At 1.8–3.1 m that's 0.20–0.35°, against a spec of 1.0–1.5° and an absolute minimum of 0.5°.
- **UI "small" role.** At 110 cm it's about 0.43°. That meets CLAD's 38-unit floor but not design 03's 0.5° minimum.
- **Fix.** Scale plaque text by distance (`applyTextRole(…, distance)`) and check in the See-and-fix captures.

### Low

- **L1 — Echopark.hdr (1.5 MB) [V].** It's committed raw, not as an LFS pointer, even though its attribute is `filter=lfs` (committed in A2 before LFS was active). It's also unreferenced: the diffuse and specular IDs aren't in the scene. Remove it via the Asset Browser, or `git add --renormalize`.
- **L2 — `tsconfig.json` and `jsconfig.json` are tracked [V].** The Lens-managed `.gitignore:13-14` ignores them, and Lens regenerates them. Untrack them, or accept the churn.
- **L3 — `.gitignore` duplicates [V].** `*.lock` (lines 17 and 32), `spk_debug_key.pem` (16 and 34), `leaf_plugin_settings.json` (41 and 53), and Cache, Workspaces, PluginsUserPreferences and Support, each twice.
- **L4 — Update and subscription leaks [V].**
  - `RoomscriptCaseCrate.ts:7-8`: the `UpdateEvent` keeps writing the hinge rotation every frame after the lid has finished opening.
  - The `engine.onState` subscriptions in `RoomscriptMain.ts:23` and `RoomscriptSuspectActor.ts:31` are never removed. That becomes a real leak once actors are created per suspect or per case.
- **L5 — Stale LEAF index entries [S].** `RoomscriptLeafIndex.ts:15-16` still lists the two ProbeLab scenarios, but ProbeLab is disabled. Running the full index would probably fail them.
- **L6 — Slow test [V].** `RoomscriptActorLeafScenario.ts:21` ends with `sleep(10000)`, which adds 10 s to every suite run.
- **L7 — Dev objects in the shipping scene [V].** These are `RoomscriptProbeLab` (disabled), `AiPreviewAgent Handler`, `LEAF Plugin Bridge` and `LeafIndex`. The last three gate themselves to the editor, so they're dead weight only. Also, the `.esproj` `lensName` is still `SpecsBaseTemplate`. Clean up before publishing.
- **L8 — Debug button [V].** The case HUD has a dev-only "Cue" button (`RoomscriptCaseLidUI.ts:12`).
- **L9 — Small overclaims in the logs [V].**
  - The handoff says "WITH WHAT", but the envelope label reads `WHAT` (scene `label: WHAT`).
  - `RoomscriptEngineBridge.ts:17` prints a hard-coded `checks=8`.
- **L10 — A second scene writer [V].** `Tooling/scripts/strip-scene-tokens.mjs` writes `Scene.scene` directly, outside VirtualScene. Use it only with Lens closed. The pause used VirtualScene correctly.
- **L11 — Brittle error mapping [V].** `RoomscriptLlmClient.ts:35-37` and `RoomscriptTts.ts:31` classify errors by regex. `RoomscriptTts.ts:42` logs `builtin_unsupported_LS5.23` for any failure, and `speak()` resolves the same way whether or not audio played.
- **L12 — One SFX channel [V].** `RoomscriptAudio.ts:23` stops the previous cue whenever a new one plays. The objection set-piece layers its cues, so it needs at least two channels.
- **L13 — Doc formatting [V].**
  - Digits lose their leading spaces throughout `decisions.md` and `clad-log.md`, for example "commit260d801", "minimum0" and "passed23.170s".
  - `probe-results.md` has a BOM and mixed CRLF line endings.
  - `decisions.md` mixes heading formats and isn't ordered newest-first.
- **L14 — ProbeLab timer leak (dev only) [V].** `deadline()` never removes its DelayedCallbackEvent on timeout.
- **L15 — Codex auto-approval [V].** The `.codex/config.toml` managed block sets `default_tools_approval_mode = "approve"`, so Codex can run any Lens MCP tool without a prompt.
[Historical authorization-header reference redacted for publication.]

---

## 3. Lens components: what is correct

- **Lifecycle.**
  - Every component binds in `onAwake` and does its work in `OnStartEvent`: Main, PropMesh, ZonePlaque, Actor, Tts and Audio.
  - SIK subscriptions (`RectangleButton.onTriggerUp`) are made from Main's OnStart path, and no GestureModule is used.
  - Runtime-created UIKit components work, as the LEAF navigation and IK passes show.
- **Audio.** Cues and TTS use `LowLatency`, and music uses `LowPower`. They're set in OnStart, as `specs-audio` requires. Never stopping a player that hasn't got a track is a regression-tested fix.
- **UI.**
  - It uses UIKit `BackPlate`, `FlexLayout`, `FlexItem` and `RectangleButton`, with `autoDiscoverItemsOnStart=false` plus `addItems`.
  - Each panel is a `<Name>UI.ts` module, and Main's inputs are typed as the UI classes.
  - The ink colours are exact palette conversions: brass (0.91, 0.69, 0.29), ivory (1, 0.94, 0.84), cyan (0.25, 0.89, 1), chalk (0.93, 0.96, 1) and coral (1, 0.42, 0.35).
- **Truth boundary.**
  - `EngineBridge` owns state alone and hands out deep copies.
  - LLM output is admitted as an audit-only `LlmOutput` event, and validation comes before speech.
  - The Gemini provider-schema subset has a regression test.
- **APIs.**
  - `FileAudioTrackProvider.getAudioFrame`, `deviceInfoSystem.isEditor()`, `quat.lookAt` and `Text.weight` all exist in `Support/StudioLib.d.ts`. The jaw path reuses a single `Float32Array`.
  - The billboard turns about Y only.
  - All units are centimetres.
- **PreviewRoom** is editor-only, and LEAF asserts it (`RoomscriptShellLeafScenario.ts:20`).

## 4. Engine purity [V]

- A grep of `Assets/Scripts/Engine` and `Content` for these patterns finds none in code: `global.`, `script.`, `require(`, `requireAsset`, `BaseScriptComponent`, `@component`, `@input`, `print(`, `getTime`, `Date`, `Math.random`, `setTimeout`, `setImmediate`, `process.`, `Buffer`, Node module imports, `.lspkg` imports, `console.`, `globalThis`, `TextEncoder`/`btoa`. The only hits are the word "window" in story text.
- Every import is relative.
- Tape base64 and UTF-8 are implemented in the engine itself (`Engine/ai/Tape.ts:185-202`).
- Async code is limited to `Engine/ai` (Promises with an injected `ClockPort`), which is acceptable.

## 5. Scene, assets, packages and history [V]

**Scene structure.**
- The scene has 182 SceneObjects.
- The `Roomscript` root (Main) has these children: UI, Anchors (mark and SuspectSlot, then Tts), PreviewRoom (stand-ins, plaques, console), Audio, Crate (hinge, lid, three envelope plaques), Engine and LlmClient.
- `LeafIndex` and `RoomscriptGatewayCredentials` sit at the root.
- The credentials in HEAD are blank (`Scene.scene:2634-2636`).

**Assets.**
- Every asset file has a `.meta`, and there are no orphan metas.
- `GeneratedSFX` holds 11 WAVs (10 cues and the music), all in LFS and all loaded through `requireAsset`.
- The actor's four PNGs (about 44 KB each) and its material and graph shader are referenced from the scene.
- Template leftovers: `Image.png` and `flat.graphShader` are used only by ProbeLab's material. `Echopark.hdr` is unused (L1).

**Packages** (read from each archive's `package.native`):

| Package | Version | Matches the decisions? |
|---|---|---|
| RSG | 2.0.1 | Yes |
| AiPreviewAgentInspect / Interact | 2.0.1 | Yes |
| LEAF | 2.0.0 | Yes |
| SIK / UIKit | 2.0.0 | Yes |
| Utilities / SnapDecorators | 2.0.0 | Yes |
| Icons / Motion | 4.0.0 | No: strays (M9) |

The `*.lspkg -filter binary` override at `.gitattributes:256` works: `check-attr` shows the filter unset, and the archives are stored as raw blobs.

**History and size.**
- 17 commits; 604 loose objects; `.git` is 33 MB, including 6.3 MB of LFS objects.
- The largest blobs are SIK.lspkg (1.93 MB), Icons.lspkg (1.92 MB, stray), Echopark.hdr (1.50 MB, raw and unused), UIKit (1.25 MB) and 16 captures (5.5 MB of raw PNG in `docs/`).
- Old pre-downgrade versions of Utilities and SnapDecorators (476 KB and 470 KB) remain in history.
- Nothing is oversized enough to need a history rewrite.

**Generated folders.** `Cache/`, `Workspaces/`, `PluginsUserPreferences/` and `Support/` were never committed, in any commit. Neither were `tempAssetGen/node_modules` (81 MB) or `Tooling/.npm-cache` (142 MB), which are ignored.

**Secrets [V]. The history is clean.**
- All 8 historical `Assets/Scene.scene` blobs have empty `openAIToken`, `googleToken` and `snapToken` fields.
[Historical authorization-header reference redacted for publication.]
- These files exist locally, are ignored, and never appear in history: `.mcp.json`, `ls-live-instance.json` (absent), `spk_debug_key.pem`, `.claude/settings.local.json`, `.codex/config.toml`, `.cursor/mcp.json`, `.vscode/mcp.json`, `.virtual-scene.json` (no populated token keys) and `leaf_plugin_settings.json`.

**The secret guard.**
- `core.hooksPath=.githooks` is set, and `pre-commit` is tracked.
- It reads the index, parses the YAML, fails closed and never prints values.
- Its one gap: it needs `Tooling/node_modules/yaml`, so on a fresh clone without `npm ci` it blocks every commit. It fails closed, which is safe but surprising, and that should be documented at the root.

## 6. Is `devpost/clad-log.md` good enough as judging evidence?

The content is decent: 30+ entries naming skills, MCP tools and results. The presentation is poor, and CLAD use is a quarter of the score.

**Problems [V]:**
1. **Not valid UTF-8.** Lines 35–37 contain Windows-1252 bytes, so the separators render as `�`. Line endings mix CRLF and LF.
2. **Out of order.** Entries jump B2, A5, A4, A3, then the format header (line 17), then 19:40, then Oct 26–27, then B3 onwards.
3. **Missing timestamps.** The C4 entries have none, and three different separators are used (`·`, `—`, `|`).
4. **Collapsed numbers.** For example "passed23.170s", "WIP260d801", "and41".
5. **No summary.** There's no table of which skills, agents and MCP tools were used, how many times, and what each produced. The strongest artefacts aren't linked: `docs/mcp-bug-report.md` (three reproducible MCP bugs) and `Tooling/c1-scene-bootstrap.json` (the VirtualScene bootstrap).
6. **The C1 "hero CLAD footage" never happened as planned.** The plan says to spawn `specs-experience-builder` once and screen-record it. Codex ran it inline and nothing was recorded. Many entries say "inline procedures", which judges may read as weaker CLAD use unless the log explains why (FIRST_PASS §1b).

**Fix:**
- Rewrite the log as UTF-8 with LF line endings, in chronological order, one row per use: time, package, skill/agent/MCP tool, input, output (with file or capture links) and outcome.
- Add a summary block and a section on bugs CLAD caught.
- Plan a screen-recorded CLAD segment for the next Lens set-piece, for example the objection.

## 7. Plan adherence and honesty

| Claim (PROGRESS and handoff) | What the code and logs show | Verdict |
|---|---|---|
| A complete; `m0-probe` | The tag exists at `194651b`, the probe table is written and RSG 2.0.1 is pinned. The P-h Sync probe is deferred, which the plan allows. | Accurate |
| B complete; `m1-terminal` | The tag exists at `c747018` and the engine modules are present. B7's acceptance test ("solved in about 15 minutes") was never measured. The docs admit this, but the stage is still labelled "Complete". The plan's `knowledge/` module and `perf/SpeculativeCache.ts` don't exist, and neither does `Tooling/mocks`. | Mild overclaim on the label; the text is honest |
| C1 complete | The scene, UI shells, crate, SFX and music are all present. The LEAF shell-navigation and IK passes appear in the Lens log (line 10427 and others). But the plan's single spawned and recorded `specs-experience-builder` run was done inline, and the plaques are editor-only (M1). | Mostly accurate; the footage step was missed |
| C2 complete | The log prints "Roomscript solver: unique ✓" and LEAF `roomscript-engine-bridge` passed in 1.542 s (log line 10950). | Accurate |
| C3 complete | LEAF `roomscript-suspect-actor` passed in 12.104 s (line 11578). Occlusion holds in Preview only, and the distance is 3.5 m against design 03's 0.9–2.0 m. | Accurate to the plan's wording; drifts from the design |
| C4 partial | LEAF `ai-record-replay` failed once (`LlmError: unavailable`, line 13877), then passed in 23.170 s (line 14065). `AI_CHECK` reports jaw = 0.5017. The UI isn't wired. | Accurate |
| C5 "pure pipeline prepared" | `AnswerPipeline.ts` and `pipeline.test.ts` (15 cases) exist; there's no Lens controller. | Accurate |
| D5 "prep" | All eight compiler modules, `PitchLibrary` and the async fuzz harness exist (`Tooling/scripts/fuzz-cases.ts:36-43`, with a test timeout of 120 s). Verification of the async fix is pending. | Accurate |
| "Final tape import and worker edits not compile or startup checked" | The log shows "TypeScript compilation succeeded" at 22:06:08, after the last Assets edit (`RepairPlanner.ts` 22:06, `C4Gateway.ts` 22:05). Preview then restarted cleanly four times between 22:07 and 22:15, printing the solver and "shells ready" lines with no Roomscript exceptions. That wasn't a formal MCP See-and-fix cycle, and LEAF wasn't re-run. | **Underclaim**: compile and startup did happen |
| Test counts (170 and 250, exit 1) | 21 test files exist, with 206 `it`/`test` call sites. I didn't run them. | Not verified |

**Design drift:**
- The palette is honoured in the UI but broken by the Wood and Slate crate (M3).
- The staging rules in design 03 §0 and §2.2, §3.3, §3.5, §6.3 and §6.5 are broken by the UI wall and Vale's distance (H4).
- Typography is below spec (M10).
- The CLAD conventions are partly followed (M5).
- One rule is followed well: each suspect has a single signature prop for its tell, which is in the content.

## 8. Remaining work for a playable Preview demo of one full case

The full case covers live-AI interrogation, objection, suggestion sweep, accusation and reenactment. Each estimate is Wadood's hours, with agents writing most of the code.

| # | Item | Estimate |
|---|---|---|
| 1 | **Resume baseline:** tests green, MCP compile and logs, LEAF re-run, ownership, hooks | 2–3 h |
| 2 | **Room binding:** one coordinate truth, the binding component, five virtual props and tents, plaques re-parented (H1, M1) | 4–6 h |
| 3 | **C5 interrogation controller:** chip → `Ask` → AnswerPipeline → validated `LineSpoken` → per-suspect TTS → actor. Also detective caption, subtitles at the speaker, fillers, topic-correction row, Preview "Ask anything" list, notebook and statement updates, the latency fix with a 20-sample table, and a network-off LEAF test. | 10–14 h |
| 4 | **Three more suspects:** art in four poses each, marks, voices | 4–6 h |
| 5 | **C6 minimal:** Believe/Press/Object dispatch, prop-flare tell with SFX, simple gaze line, composure ring, simplified lawyer-up | 6–8 h |
| 6 | **C7:** pinch → Polaroid → wallet. Then statement onto evidence. A correct objection runs silence, OBJECTION, tear or shatter, the layer swap and the walk. A wrong one bounces and costs a pip. Plus LEAF. | 10–14 h |
| 7 | **D1 suggestion sweep:** selection on the lid, ghost, ratchet, clockwise sweep over the bound anchors, private card, breathes-in, grid from `PlayerKnowledge` | 8–12 h |
| 8 | **D3:** three-card accusation, hold-to-break seal, ✓ ladder, simplified reenactment (puppet ghosts slot by slot), CASE CLOSED, wrong ending, Holmes rating | 10–14 h |
| 9 | **D2 minimal opening** (on the never-cut list): knock, tape, crate, chalk, envelope, seal, arrivals | 4–6 h |
| 10 | **D6 and D7:** degradation ladder and stage mode, LEAF suite, a recorded full-play hero tape for an offline-safe demo | 6–8 h |
| 11 | **Staging and readability pass** (H4, M3, M10) | 3–5 h |
| 12 | **Hygiene, CLAD conformance and clad-log rewrite** | 3–4 h |
| | **Total** | **about 70–100 h** |

Device verification needs another 6–10 h, and the film plus Devpost another 10–15 h.

Against about 64–70 h of Wadood's time, this only fits if three things hold:
- agents carry the implementation;
- the set-pieces are simplified (no particle systems, puppet-based reenactment);
- Wadood re-scopes now (C-0).

## 9. What is solid

- **Engine.** It is pure and deterministic, and shared between Lens and vitest with no sync step.
- **Secrets.** Strict secret hygiene with a well-designed guard; the history is verified clean.
- **Assets and packages.** Every asset has a `.meta`; package versions are pinned to LS 5.23.2 and documented; the `.lspkg` raw-storage decision is recorded.
- **Truth boundary.** It is enforced in the Lens adapters, not just in the engine.
- **Verification.** It is real: LEAF passes are visible in the Lens log, including real Gemini → record → offline replay → TTS → jaw. Failures are kept in the record rather than hidden.
- **Documentation.** The pause handoff, decisions and the MCP bug report are high quality and honest. The bug report is good material for CLAD judging.
- **Schedule.** The project is ahead of the human calendar: C1–C3 were planned for Oct 29–30.

## 10. Top 7 actions, in priority order

1. **Re-scope with Wadood** (C-0). Lock the demo to the never-cut list, defer D4 UI, D5-Lens, E and F, and record it in `decisions.md`.
2. **Unify the room** (H1, M1). Make the hero case and PreviewRoom share one coordinate frame. Add `RoomscriptRoomBinding` and a LEAF check, add the five virtual props, and move the plaques out of the editor-only root.
3. **Build the C5 interrogation controller end to end** (H2, M6). Fix latency at the same time (H3: `thinkingBudget 0`, `systemInstruction`, `maxOutputTokens`), then measure 20 samples and record a hero tape.
4. **Re-stage the interrogation** (H4, M3, M10). Put the HUD on the crate lid, compact the chips and verbs near the suspect, place the suspect at 1.3–2.0 m, put subtitles and slips at the speaker, brighten the crate and size text to spec.
5. **Repo hygiene** (M8, M9, L1–L3):
   - track the four LFS hooks;
   - Wadood takes ownership of `.git`, or opts into `safe.directory`;
   - untrack `tsconfig.json` and `jsconfig.json`;
   - remove the unused `Echopark.hdr` and the Icons and Motion 4.0.0 packages after confirming they're unused;
   - dedupe `.gitignore`;
   - document `core.hooksPath` and `npm ci` at the root.
6. **CLAD conformance pass** (M5, M4, L4–L6):
   - header contracts, `console.*`, `@hint` on every input, grouped inputs with labels;
   - `Button.size` set in `onInitialized`;
   - lazy engine initialization;
   - stop the crate's update after it opens;
   - remove the stale probe scenarios from the LEAF index and the 10 s sleep.
7. **Rewrite `devpost/clad-log.md`** (M7). Make it UTF-8, chronological and fully timestamped. Add a summary table, the MCP bug report and the bootstrap JSON as evidence, and a capture link per stage. Schedule a screen-recorded CLAD session for the objection set-piece to replace the missing C1 footage.
