# Roomscript: implementation plan (agent-facing)

This is the authoritative build plan for agents working in this repository. It adapts Wadood's plan (`human-plan-2026-10-26.md`, same folder) to this repository's paths and to the CLAD toolkit's conventions. Where the two differ, follow this one.

**Scope (Wadood's decision, Oct 26):**
- must and should tiers, plus Clue Night;
- LIAR!, on-device voice questions and a Snap3D exhibit only if time is left;
- Preview first. Wadood will have Spectacles before Nov 8, and device work comes last.

**Reference docs:**
- [`../design/01-roomscript-design.md`](../design/01-roomscript-design.md): the game itself; read it whole.
- [`../design/02-architecture.md`](../design/02-architecture.md): schemas (§3–§6), prompts (§4.5), validator (§5.4), director (§7), casting (§8), closing argument (§9), tapes (§10), multiplayer (§11), budgets (§12), module map (§14). Ignore its §15 dates, which are off by one; this file supersedes them.
- [`../design/03-ar-staging-and-storyboard.md`](../design/03-ar-staging-and-storyboard.md): staging rules (§0), opening (§1), suspects (§2), evidence (§3), set-pieces beat by beat (§4), sound (§5), visual language and palette (§6), storyboard (§7), multiplayer staging (§8).
- [`../design/04-ai-gameplay.md`](../design/04-ai-gameplay.md): AI systems, lie ladders, gossip, Wren, director, evidence, closing argument.
- [`../design/05-clue-and-la-noire-research.md`](../design/05-clue-and-la-noire-research.md): reference mechanics and repos (licences listed).

---

## 1. Repository layout

The Lens Studio project folder is the git root and the Claude Code working directory. `.mcp.json` and the project-scoped CLAD plugin live here, so agent sessions must start here with Lens Studio open.

```
RoomScriptF/                        git root · Lens Studio project (5.23.2) · agent cwd
  AGENTS.md, CLAUDE.md              Lens-managed block + Roomscript rules
  RoomScriptF.esproj                Lens project manifest (edit via Lens tools only)
  Assets/
    Scene.scene                     NOTE: RSG tokens get saved here; never commit live tokens
    Scripts/
      Engine/                       pure TS library (no Lens APIs); subfolders by area, see §3
      Content/                      hero case, line banks, pitch library, tapes, as typed TS modules
      Roomscript*.ts                Lens components (CLAD naming: RoomscriptMain.ts, Roomscript<Concern>Controller.ts, Roomscript<Panel>UI.ts)
    GeneratedSFX/, GeneratedMeshes/, Icons/, …   created by CLAD asset skills
  Packages/                         SIK, UIKit (+ RSG, LEAF, SyncKit as added)
  Tooling/                          Node only, never imported by Lens
    package.json, tsconfig.json, vitest.config.ts
    tests/                          vitest specs importing ../../Assets/Scripts/Engine and Content
    scripts/                        play.ts, fuzz-cases.ts, fuzz-players.ts, harvest-tape.ts, check-secrets.mjs
    mocks/                          MockLlm.ts (LlmPort for Node)
  docs/                             README, FIRST_PASS, plan/, design/, PROGRESS, decisions, later, probe-results, captures/
  devpost/                          clad-log.md, stats.md, writeup-draft.md, footage.md
  NOTICE                            attributions for copied MIT/Apache code
```

**Why the engine lives inside `Assets/`:**
- Lens Studio supports relative TypeScript imports between files in `Assets/`, so components import the engine directly with no sync step.
- vitest imports the same files from `Tooling/`.
- Keep engine files free of decorators and Lens globals so both compilers accept them.

**If Lens Studio ever tries to compile `Tooling/`:** move `Tooling/` to a sibling folder, record it in `docs/decisions.md`, and restart the session with `--add-dir`.

---

## 2. CLAD map: which skill or agent for what

Invoke skills during planning as well as execution. Batch skill loads in one message.

| Need | CLAD skill / agent |
|---|---|
| Session gate (version, MCP, sign-in) | `/lens-studio-router` with `mode: preflight_only` (don't use `full`: it would spawn a generic build) |
| Specs project setup (camera, DeviceTracking, SIK prefab, preview device) | `/specs-project-init` |
| Packages | `/ensure-package-installed` (RSG ≥0.2.0, LEAF, SyncKit); `/update-lens-packages` |
| Scene writes | `/scene-construction` → VirtualScene (single writer; read `references/virtual-scene.md` first) |
| One-shot scene bootstrap with assets | agent `ls-clad:specs-experience-builder` (spawn at depth 1 with a precise brief, Stage C1) |
| Editor API | `/editor-api` before any `ExecuteEditorCode`; agent `ls-clad:editor-api-specialist` for 2+ calls |
| Component scripts | `/lens-api` (read `references/conventions.md` for the header contract and @input grouping); agent `ls-clad:script-author` for parallel script batches |
| UI (chips, verbs, notepad, wallet, case board, overlays, HUD) | `/specs-build-ui` (UIKit only; `<Name>UI.ts` modules; @input typed as the UI class); `/icon-selector`; `/font-selector` |
| Hand input: pinch objects, drag statements, hover previews | `/specs-interaction-recipes` (Tap/Drag recipes; bind in OnStartEvent) |
| Driving the preview in tests | `/specs-preview-interaction` (PreviewInteractTool) |
| Meshes: room stand-ins, crate, envelope, pawns, props | `/build-mesh` (FAST3D or text-to-3D for props; `mesh-builder-scripting` for chalk lines, ribbon, tape, rings) |
| Materials, shaders, VFX | `/materials`; `/shader-graph` (rim light, gaze line, flicker, hatching); `/vfx-graph` (shatter, motes, chalk dust, whisper thread, UV specks) |
| Rendering and visibility | `/camera-and-rendering` |
| Sound | `/build-sfx` (knocks, tape zip, thud, tick, tink, shing, objection sting, ratchet, chime, chalk); `/build-music` (noir bed, suspect motifs in one key); `/specs-audio` (LowLatency for cues) |
| AI (chat, Gemini, Imagen, TTS, Snap3D, tokens) | `/specs-ai-remote-service` (RSG ≥0.2.0; **self-generate all three tokens via ExecuteEditorCode**; check the package source for exact signatures) |
| Camera frames for the room scan | `/specs-camera`; `/specs-world-query` (raycast placement); `/specs-depth` (device enhancement only) |
| Text input | `/specs-keyboard` (the AR keyboard does **not** appear in SPECS 27 preview simulation) |
| Voice | `/specs-asr` (device only; preview returns "Nothing heard") |
| Multiplayer | `/specs-sync-kit`; agent `ls-clad:specs-sync-kit-validator` after each Sync Kit build step |
| Testing | agent `ls-clad:live-lens-tester`; `/specs-leaf-install-packages`, `/specs-leaf-write-scenarios`, `/specs-leaf-run-in-preview` |
| Verify / QA | `/verify-preview` and the See-and-fix loop (`lens-studio-field-notes`) |
| Debugging | `/lens-debug`, `/specs-debug`, `/lens-log-analysis`, `/lens-js-debugger` |
| Performance (late) | `/specs-lens-perf-attribution`, `/specs-lens-perf-optimize`, `/specs-optimize-lens-mesh` |
| Never in this pass | `/specs-publish` |

**Subagent depth rule.** Agents spawned by a subagent silently do nothing. Spawn every CLAD agent and every parallel worker from the main session.

---

## 3. Engine module map (`Assets/Scripts/Engine/`)

```
core/        Prng.ts (sfc32 + named substreams) Hash.ts (fnv1a) CanonicalJson.ts Types.ts
room/        RoomModel.ts Affordances.ts Substitution.ts RoomFixtures.ts
case/        CasePitchSchema.ts PitchValidator.ts Simulator.ts Dealer.ts StatementBuilder.ts BeatPlanner.ts
             CaseCompiler.ts Solver.ts RepairPlanner.ts
knowledge/   KnowledgeModel.ts PlayerKnowledge.ts GossipRules.ts
game/        Actions.ts Reducer.ts GameState.ts Clock.ts Composure.ts ObjectionJudge.ts RefutationRound.ts
             Accusation.ts Scoring.ts Hunches.ts
perf/        FactSheetBuilder.ts AnswerSchema.ts Gazetteer.ts LineValidator.ts LineBank.ts KeywordIntent.ts SpeculativeCache.ts
direction/   TensionModel.ts Director.ts PartnerBrain.ts GameMaster.ts
closing/     ArgumentSchema.ts DeductionMatcher.ts CrossExam.ts
ai/          LlmPort.ts (interface) Prompts.ts (versioned) Tape.ts Scheduler.ts Deadlines.ts
sync/        SyncProtocol.ts (CaseInit, graphHash, host-ordered Action{seq,by}, chunked log, private visibility)
```

**Content** (`Assets/Scripts/Content/`, typed TS modules):
- `HeroCaseHarlow1041.ts`, `HeroLineBank.ts`, `PitchLibrary.ts` (6 authored pitches);
- `Tapes/*.ts` (harvested tapes);
- `STORY.md` sits beside them as a human-readable summary.

---

## Stage A: setup and probes (plan Phase 0)

**A1. Preflight.**
1. `/lens-studio-router` with `mode: preflight_only`. If Wadood isn't signed in, ask him: a blocking question is allowed here.
2. `/specs-project-init`. The `.esproj` already targets Spectacles (Specs Base Template); confirm the camera is DeviceTracking World, the SIK prefab is present and the preview device is Specs.
3. `VirtualScene read`.

**A2. Repository.**
1. `git init` (the `.gitignore` already covers secrets and generated folders).
2. Add a **pre-commit hook** that runs `node Tooling/scripts/check-secrets.mjs`. It fails if staged content contains:
   - non-empty `snapToken`/`openAIToken`/`googleToken` values in any `.scene` file;
   - `Bearer\x20` strings (the escape denotes a literal space);
   - PEM blocks.

   Document how to clear tokens before committing: either a `Tooling/scripts/strip-scene-tokens.mjs` that blanks the three fields in the working copy, or a clean/smudge filter.
3. Scaffold `Tooling/`: TypeScript, vitest and tsx, with a tsconfig whose `include` reaches `../Assets/Scripts/Engine/**` and `../Assets/Scripts/Content/**`.
4. Create `NOTICE`, and the `docs/PROGRESS.md` and `devpost/clad-log.md` entries.
5. First commit.

**A3. AI plumbing prerequisites.**
1. `/ensure-package-installed` Remote Service Gateway ≥0.2.0.
2. Following `/specs-ai-remote-service`, self-generate all three tokens via `ExecuteEditorCode`, write them to `RemoteServiceGatewayCredentials`, and save.
3. Note in PROGRESS that tokens last about an hour. Regenerate whenever calls return `Unauthenticated`.

**A4. ProbeLab.** A dev-only `RoomscriptProbeLab` SceneObject with a UIKit button panel (`/specs-build-ui`). Each probe runs 20× and logs `PROBE|name|ms|ok|detail`. Drive the buttons with `/specs-preview-interaction` and collect results with `RunAndCollectLogsTool`.

| Probe | What | Record |
|---|---|---|
| P-a | OpenAI chat with strict `json_schema` (`gpt-4.1-nano`, `gpt-4o-mini`) | p50/p95; does strict work; schema adherence |
| P-b | Gemini with `responseSchema` (`gemini-2.5-flash`, `gemini-2.0-flash`; only use model IDs listed in the skill) | p50/p95 |
| P-c | OpenAI TTS (check the exact model and voice names in the RSG `OpenAI.ts`) → AudioComponent | time to audio; plays in preview? |
| P-d | Built-in `TextToSpeechModule` | works in preview alongside RSG? |
| P-e | Imagen `imagen-3.0-generate-002` | latency; refusals; texture displays |
| P-f | 4 parallel chat calls | throttling / errors |
| P-g | Camera stream frame in Preview (`/specs-camera`) | what it shows: simulated room, webcam, or nothing |
| P-h | Sync Kit basic two-pane test (can wait for Stage F if SyncKit isn't installed yet) | sessions join? |

Write `docs/probe-results.md`, choose the models, and apply the decision table. Keep ProbeLab disabled in the scene, but keep its script for regressions.

**A5. Decision table** (apply automatically, and record each decision in `docs/decisions.md`):

| If… | Then… |
|---|---|
| Chat + TTS work in Preview, median ≤3.5 s | Live answers (L3) as designed |
| Chat median >3.5 s | Rely on the speculative cache; chips use pre-written lines first; live only for free text |
| Gateway fails in Preview | Build against `LineBank` + `MockLlm`; live path stays and is tested on device later |
| OpenAI TTS fails in Preview | Built-in TTS + subtitles in Preview; OpenAI TTS on device |
| Camera stream shows the simulated room | Vision scan works in Preview |
| It doesn't | Bundled room photo → Gemini → stand-ins, captioned honestly |
| Sync Kit two-pane fails | Clue Night drops to stretch; the duel is the multiplayer story |

**Exit:**
- preflight passed;
- repo initialised with the hook;
- tokens working;
- probe table written;
- commit tagged `m0-probe`.

---

## Stage B: truth engine (plan Phase 1)

**Parallelism.** The main agent writes `core/Types.ts` (all shared types) first. It then spawns parallel general-purpose subagents on disjoint folders: [B2 room], [B3 hero content], [B4 solver], [B5 game reducer], [B6 perf]. Each writes its own tests in `Tooling/tests/<area>/`. The main agent integrates and runs the full suite, then B7–B8.

**B1. Core.**
- **Files:** `Prng`, `Hash`, `CanonicalJson`, `Types` (RoomScan, CaseGraph, Fact, Statement, Evidence, Beat, RequiredDeduction, Action, GameEvent, GameState), following design 02 §3–§6.
- **Accept:** same seed → same sequence; substreams independent.

**B2. Room.**
- **Files:** `RoomModel`, `Affordances` (type → roles), `Substitution` (minimums: 3 zones, 3 weapon candidates, 2 witnesses), `RoomFixtures`.
- **Fixtures (5):** `wadood-room` (desk, bed, door, window, kettle, lamp, charger cable, mug, bottle), a dorm, a studio flat, an office, a minimal room.
- **Accept:** all fixtures bind; substitution fills gaps; `roomId` doesn't depend on layout.

**B3. Hero case, HARLOW-1041** (`Content/HeroCaseHarlow1041.ts` + `HeroLineBank.ts` + `STORY.md`)
- **The case:**
  - victim Edmund Harlow;
  - suspects Marguerite Vale (culprit), Imran, Okafor and Pike, innocents with concrete secrets;
  - 5 zones, 5 weapons by type;
  - 12 slots, 21:00–23:45; murder slot 22:30–22:45, body found 22:41;
  - layered statements: culprit has 3 rungs, innocents 1–2;
  - object memories, refutation cards and clockwise order;
  - beats: letter, voicemail, flight, blackout/body-moved;
  - required deductions;
  - baseline questions;
  - tells per suspect: Vale's brooch + gaze snap; Imran's lighter; Okafor's glasses glare; Pike's glove tug.
- **The LineBank:** every claim line, plus press, break, deflection, filler and lawyer-up lines, and the final confession.
- **Accept:** passes all 8 solver checks.

**B4. Solver.**
- **What it does:** hypothesis enumeration; `consistent`; reachable knowledge; checks 1–8 (design 02 §3.3) with structured error codes; minimum-cost route; player-knowledge mode (for grid, hints, Hunches).
- **Accept:**
  - the hero passes;
  - 20 deliberately broken variants each fail with the right code: `NOT_UNIQUE`, `LIE_UNBREAKABLE`, `SHORTCUT`, `ROUTES_LT_2`, `HERRING_HARMFUL`, `MIN_ROUTE_TOO_LONG`, `BEAT_BREAKS_SOLVABILITY`, `INCONSISTENT_TRUTHS`.

**B5. Game reducer.**
- **Actions:** Ask, Press, Believe, Object, PinchObject, RevealEvidence, Suggest, CallLiar, Dismiss, UseHunch, Accuse, ArgumentClaim, plus LLM events (PitchReceived, LineSpoken, GossipSpoken, BeatChosen, ArgumentExtracted). **Every action carries a host `seq` and a player `by`.**
- **State:** clock, composure, rapport, layer, lawyered, pips, notebook of canonical claims, grid, Hunches, who was shown what, beats fired, verdict.
- **Rules modules:** ObjectionJudge, RefutationRound, Accusation, Scoring (Holmes rating), Hunches.
- **Accept:**
  - golden replay test: log → identical state;
  - a correct objection swaps the layer and earns a Hunch; a wrong one costs a pip;
  - three empty presses → lawyered for 2 slots;
  - a suggestion is refuted by the first refuter clockwise; objects are always truthful;
  - no refuter → `breathesIn` event.

**B6. Performance safety core.**
- **Files:** `FactSheetBuilder` (current layer only, no stance), `AnswerSchema` (per-call enums), `Gazetteer` (names and nicknames, zones and Clue names, objects and synonyms, times in spoken forms), `LineValidator` (7 gates, design 02 §5.4), `LineBank`, `KeywordIntent`.
- **Accept:**
  - adversarial fixtures are rejected: wrong name, invented time, confession, "as an AI", uncited memory, entity outside the cited facts;
  - 100% of LineBank lines pass.

**B7. Terminal player** (`Tooling/scripts/play.ts`; `npm run play`)
- **Commands:** chips, typed questions via `KeywordIntent`, press/believe/object with IDs, pinch, suggest, accuse. It prints claim cards and `TELL` markers.
- **Accept:** the hero case can be solved in about 15 minutes. Tag `m1-terminal`.

**B8. Property tests** (`Tooling/scripts/fuzz-players.ts`)
- **Run:** 1,000 random players.
- **Assert:** no layer ever holds two contradictory claims; the game always terminates; the minimum route is ≤60% of the clock.

**Lens check.** After B1–B6, `RecompileTypeScriptTool` must be clean with the engine present in `Assets/`.

---

## Stage C: interrogation slice (plan Phase 2)

**C1. Scene bootstrap** (spawn `ls-clad:specs-experience-builder` once, with a precise brief)
- **Ask it for:**
  - a `PreviewRoom` root of stand-in furniture matching the `wadood-room` fixture positions (desk, bed, door, window, kettle, lamp, charger cable, mug, bottle). **This root is enabled only in the editor preview**; on device the real room is used. Verify the editor/device check against `StudioLib.d.ts`.
  - the forensic case crate;
  - the WHO/WHERE/WITH WHAT envelope;
  - brass zone plaques;
  - an interrogation mark;
  - SFX via `/build-sfx` (knock, tape zip, crate thud, clock tick, tink, shing, objection sting, ratchet, chime, chalk scratch);
  - a low noir music bed via `/build-music`;
  - UI shells via `/specs-build-ui`: `RoomscriptChipBarUI`, `RoomscriptVerbBarUI` (Believe/Press/Object with a line-preview slot), `RoomscriptNotepadUI` (grid + Statements tab), `RoomscriptEvidenceWalletUI`, `RoomscriptCaseLidUI` (clock, pips, Hunches);
  - a minimal `RoomscriptMain.ts` that **only wires references and contains no game logic**.
- **Theme:** design 03 §6, "luminol, not noir": coral `#FF6B5A` truth (solid), cyan `#3FE3FF` claims (dashed), forensic yellow `#FFD60A` markers, ivory `#FFF0D6` people, brass `#E8B04A` board, chalk `#EEF4FF`. Dark is transparent on device, so nothing relies on black.
- **Afterwards:** run its self-audit, the See-and-fix loop, and log it to `devpost/clad-log.md`. **Screen-record this step** (hero CLAD footage). Wadood should have OBS running.

**C2. Engine bridge.**
- **Build:** `RoomscriptMain` loads the hero case, runs the solver and logs a report.
- **Accept:** the log shows `solver: unique ✓`.

**C3. Suspect actor v1** (`RoomscriptSuspectActor.ts`)
- **Build:** a paper-theatre puppet:
  - billboard pose planes (neutral, listening, rattled, broken) with placeholder ivory line-art textures;
  - a rim shader that warms ivory→amber→coral with stress (`/shader-graph`);
  - a jaw flap driven by audio amplitude;
  - the lower body hidden by furniture.
- **Accept:** Vale stands at her claimed mark and reacts to state.

**C4. AI plumbing.**
- **Files:**
  - `RoomscriptLlmClient.ts`: implements the engine's `LlmPort` via RSG `OpenAI.chatCompletions` (strict json_schema) and Gemini;
  - `Engine/ai/Scheduler.ts`: priority live > case-load > speculative, a cap of 4, cancellation;
  - `Deadlines.ts`;
  - `Tape.ts`: LIVE/RECORD/REPLAY/HERO modes; RECORD logs `TAPE|key|base64` lines; `Tooling/scripts/harvest-tape.ts` turns `RunAndCollectLogsTool` output into `Content/Tapes/*.ts`;
  - `RoomscriptTts.ts`: OpenAI TTS split by sentence, built-in TTS fallback, 60-clip LRU, AudioComponent LowLatency.
- **Accept:** a chip question round-trips; RECORD then REPLAY reproduces it offline.

**C5. Live answer pipeline.**
- **The pipeline:** question → `FactSheetBuilder` → per-call schema → model → `LineValidator` → TTS → actor. On failure: one retry if ≥2.5 s remain, then `LineBank`, then a deflection template.
- **The topic chip:** "asking about: …", with a one-tap correction row.
- **Latency hiding:**
  - subtitle at 0 ms;
  - the detective's line;
  - fillers at 600 ms and 2.5 s;
  - a 6.5 s hard fallback.
- **Free text:**
  - on device it uses `/specs-keyboard` (and ASR later);
  - in preview, a dev "Ask anything" chip list sends the exact text through the same live path. It includes one deliberately weird question for the video.
- **Accept:** validated spoken answers; network-off falls back cleanly; the latency table is recorded.

**C6. Tells, verbs, composure.**
- **Tells:**
  - prop tells per suspect (an emissive flare plus SFX);
  - a gaze line from the eyes to the lie's real object, constant angular width (`/shader-graph`), fired 300 ms after the audio starts;
  - baseline questions that teach the tell.
- **Verbs:** Believe/Press/Object, with the exact line previewed on hover (`/specs-interaction-recipes` for hover).
- **Pressure:**
  - a segmented composure ring behind the head;
  - lawyering up: the suspect walks out through the real door and a knock brings them back 30 night-minutes later.
- **HUD:** Hunches, the clock and the pips, all on the case lid.
- **Accept:** every lie fires the tell; deflections never do; LEAF scenario green.

**C7. Objects remember + Spatial Objection v1.**
- **Objects remember:** pinch an object → its sound + a Polaroid develops → a claim card goes into the wallet.
- **Objecting:** drag a statement slip (DragInteraction recipe) onto an object or evidence card; the engine judges it.
  - **Correct:**
    1. 250 ms of silence, then a freeze;
    2. OBJECTION slams in;
    3. the cyan alibi path tears from the coral truth path;
    4. shatter (`/vfx-graph`);
    5. the next lie layer swaps in;
    6. the suspect walks to their true mark.
  - **Wrong:** a 1.2 s bounce and a pip.
- **Accept:** storyboard shots 9–12 play in Preview; LEAF scenario green. Tag `m2-slice`.

**Gate C** (record in `docs/decisions.md`). Continue if 2 of 3 pass:
- **Engine:** green.
- **Live answers:** validated speech in Preview with ≤10% rejected, or the L2 fallback path chosen.
- **Scene:** one interrogation with tells playable.

If the engine fails, fix it before continuing.

---

## Stage D: the whole case (plan Phase 3)

**D1. Clue layer.**
- **The suggestion:**
  - pawns on the case lid;
  - drag a pawn into a zone and touch an object → a dotted suggestion ghost appears and the clock ratchets.
- **The refutation:**
  - the sweep blade circles clockwise from the player's position at setup, with roulette ticks, and stops at the first refuter;
  - the refuter shows a private card;
  - nobody can refute → the envelope "breathes in".
- **The notepad:**
  - a grid that crosses itself off, driven by `PlayerKnowledge`;
  - a Statements tab with tell markers;
  - the room mirrors the grid: zones dim, tents flip, pawns get chalk Xs.
- **Accept:** storyboard shot 14 plays.

**D2. Opening ritual + tableau.**
- **The opening:**
  1. motes freeze;
  2. three knocks come from the door's position;
  3. tape zips across the door;
  4. the crate thuds down; pull the tab and light pours from the lid;
  5. chalk draws the outline (MeshBuilder line strip, animated);
  6. the envelope rises;
  7. a card riffle shows the player's zones and objects;
  8. the wax seal stamps;
  9. the missing clock ticks from its outline.
- **Arrivals:** the first suspect under the tape; the others develop like Polaroids at their claimed marks.
- **Accept:** shots 1 and 8.

**D3. Accusation + reenactment + scoring.**
- **The accusation:**
  - place three cards; the accused turns to look;
  - hold to break the seal; the clock stops;
  - a ✓ ladder.
- **The reenactment:**
  - the ribbon unspools from the empty clock;
  - dust ghosts walk slot by slot;
  - bullet time at the murder slot, cup beads frozen, slow orbit;
  - then the cup shatters, the clock reappears, the tape falls and CASE CLOSED stamps.
- **Scoring:** Holmes rating and case code.
- **Wrong accusation:** the real culprit walks out through the tape.
- **Accept:** shots 17–20.

**D4. Casting.**
- **Manual tagger:** pinch a spot → radial menu (zone names, object types).
- **Substitution:** missing types arrive as props "in the box".
- **Vision scan in Preview:** camera frame or bundled room photo → Gemini boxes → suggested tags, confirmed with one pinch.
- **Device path:** camera unproject → World Query. Build it now; verify on device later.
- **Accept:** two fixtures stage the same seed differently (shot 22).

**D5. Generation loop + Case Compiler overlay.**
- **Engine:** `CasePitchSchema`, `PitchValidator`, `Simulator`, `Dealer`, `StatementBuilder`, `BeatPlanner`, `CaseCompiler` (≤50 re-samples), `RepairPlanner` (JSON-patch errors), `PitchLibrary` (6 authored), `Tooling/scripts/fuzz-cases.ts`.
- **Lens:** behind the opening, run P1 pitch (Gemini Flash), P2 repair, P3 line packs ×4 (truth-blind per layer), P4 critique, P8 evidence pack.
- **The overlay:** a toggle showing pitch → bind → solver checks → repairs.
- **Accept:** ≥90% of 1,000 seeds compile on 5 fixtures in Node; ≥80% of live pitches compile within 45 s in Lens. Otherwise the authored library becomes primary; record it.

**D6. Degradation ladder + stage mode.**
- **Build:** L3 → L2 → L1 → L0, automatic per call, plus a hidden stage-mode switch forcing L0.
- **Accept:** pulling the network mid-interrogation never breaks the scene.

**D7. LEAF suite** (`ls-clad:live-lens-tester`).
- **Scenarios:**
  - ask → answer;
  - correct objection → break; wrong → pip;
  - suggestion → refutation;
  - accusation;
  - network off → L1;
  - tell fires on every lie.
- **Accept:** suite green. Tag `m3-case`.

---

## Stage E: should tier (plan Phase 4, in this order; stop where the run ends)

1. **Lie ladders, 2–3 rungs.** After a break, the live "improvised next lie" comes from the next pre-validated layer.
2. **Wren** (`PartnerBrain`; player knowledge only):
   - hints cost a Hunch;
   - theory checks run against what you know;
   - recaps;
   - a floating presence with a voice, doubling as tutorial narrator.
3. **Director + generated evidence:**
   - `TensionModel` + `Director`: the LLM picks from the eligible beat enum, with a utility fallback;
   - a letter slides under the real door (text + claim card);
   - a voicemail plays from an object in the victim's voice;
   - a suspect tries to leave.
4. **Blackout + luminol:**
   1. light is banked from minute one;
   2. lightning, then the added light cuts out hard; only eyes remain;
   3. a UV torch reveals coral drag marks;
   4. power returns zone by zone, and a suspect has moved.
5. **Gossip + whisper beat:**
   - `GossipRules`: allies get revealed evidence + treatment; rivals get attitude only;
   - pawns lean together with a luminous thread;
   - hearsay lines are validated;
   - the next suspect references how you treated their friend.
6. **Imagen portraits:** template prompt, ink-wash treatment, silhouette fallback.
7. **Closing argument + defence:**
   - a case board with deduction sockets;
   - typed argument → P10 extraction (notebook IDs, verbatim spans) → `DeductionMatcher`;
   - the defence asks up to 2 gap questions;
   - you answer by dragging or throwing evidence.
8. **Morning Edition + case file:**
   - a newspaper from the event log;
   - your route against Holmes's;
   - what you missed, the lie you believed, and the hash check.

Tag `m4-should` when items 1–4 are done.

---

## Stage F: Clue Night (plan Phase 5)

**Gate.** Must tier green, should items 1–4 done, and the Sync Kit probe passing.

**F1. Engine.** `sync/SyncProtocol`:
- `CaseInit{seed, room, pitch}` with a `graphHash` check;
- host-ordered `Action{seq, by}`;
- a chunked log for late joiners;
- the other detective joins the refutation order;
- private-card visibility per player;
- a notebook per player;
- turn order.

Test it with two simulated peers in vitest.

**F2. Lens.** `/specs-sync-kit`, then `RoomscriptSyncBridge.ts`:
- **Sync setup:**
  - host-owned SyncEntity (`claimOwnership`, gate writes with `doIOwnStore()`);
  - `startMode` stays `START_MENU`;
  - Single Player Type: Mocked Online.
- **Sharing and privacy:**
  - LLM calls run on the host only and are broadcast as `LineSpoken`; each device does TTS locally, spatialised;
  - the private card flies face-down and opens only on the recipient's device;
  - the observer device turns the suspect's voice down 12 dB.
- **Mind the two-pane Preview quirks** in the skill's §10 decoder: server time drifts between panes, and `isHost` behaves differently.
- **Afterwards:** run `ls-clad:specs-sync-kit-validator`.

**F3. Accept.** In two Preview panes:
- a suggestion gets a private refutation;
- the other detective sees only that a card was shown;
- each player gets their own verdict.

Tag `m5-cluenight`.

---

## Not in this pass

- Device testing, filming and editing.
- Devpost submission and making the repo public.
- `/specs-publish`.
- Creating a GitHub remote.
- Stretch extras (LIAR!, Snap3D exhibit, Lyria score, Realtime banter for Wren), unless everything above is green.
