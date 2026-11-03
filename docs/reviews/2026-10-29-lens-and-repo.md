# Roomscript second-pass review: Lens integration, staging/UX, repo state

Reviewed 2026-10-29 (PKT), HEAD `5923208` plus the uncommitted C7/D1 working tree, in `C:\Users\wadoo\Desktop\SPECS_Hackathon\RoomScriptF`. Read-only: files, git, scene text, captures, the Lens log `LensStudioLog-2026-10-28-23-32-38-588-be9ff.txt` (23:32 → 08:33), and the installed `ls-clad` `vfx-graph` skill. No MCP tools, no repo writes. **[V]** = seen directly; **[S]** = inferred or needs a runtime/device check.

## Verdict

**Strong night of work, honestly reported, but not yet a game a judge can finish.**

- L1, C5, staging and C6 are real and verified by LEAF in the log. D1 also passes LEAF (`roomscript-clue` PASSED 02:46 and 02:49). Late compiles and Preview restarts are clean. The spatial-audio warning flood (82k lines) stopped once the AudioListener was added.
- C7 works up to the shatter. The shatter is blocked on the VFX exception, and the code also needs a change to use it (below).
- **What's missing for a complete hero case:**
  - accusation, reenactment and ending (D3);
  - the opening (D2);
  - the other three suspects as visible, selectable actors. Only Vale has art, and nothing in the UI calls `selectSuspect`. This is a scope gap that isn't in the plan's remaining list.
- **Biggest process risk:** about 1,000 lines of verified work plus the scene are uncommitted, and the repo has **no remote**.
- **Biggest UX risk:** modal cards spawn on top of Vale's face, and on device the fixture objects (kettle, lamp, window and so on) are invisible.

## Previous Lens and repo findings: status

| Prev. | Item | Status | Evidence |
|---|---|---|---|
| H1 | One coordinate frame, binding, virtual props | **Fixed [V]** | Hero zones (`Content/HeroCaseHarlow1041.ts:7-11`) equal the scene `RoomscriptZone_*` anchors. `RoomscriptRoomBinding.ts` audits within 0.1 cm and throws on drift. LEAF `roomscript-room-binding` PASSED 00:35. |
| M1 | Plaques out of the editor-only PreviewRoom | **Fixed [V]** | Plaques now sit under the zone anchors. The binding LEAF asserts they're visible with PreviewRoom disabled. `KitchenConsole` is still editor-only (fine). |
| H2 | Production interrogation path | **Fixed [V]** | `RoomscriptInterrogationController.ts`: Ask → AnswerPipeline → `LineSpoken` → subtitles/TTS. Live and offline LEAF pass. |
| H3 | Latency | **Fixed [V]** | Per PROGRESS: thinkingBudget 0 and `systemInstruction`; median text 1.66 s; first audio 1.7–4.5 s. |
| H4 | Staging | **Mostly fixed [V]** | HUD is on the crate lid; chips and verbs are 46 cm panels at 1.1 m; Vale's slot `(20,-160,-180)` is **1.81 m** away; subtitles are speaker-local. **New:** C7/D1 modal cards overlap her face (P1-3). |
| M3 | Crate colour on additive | **Fixed [V]** | Brighter wood and brass in `staging-preview.jpg`. |
| M10 | Plaque text size | **Fixed [V]** | `RoomscriptZonePlaqueUI.ts:11-15` sizes to 1.2° and measures the rendered cap height. |
| M2 | Floor and anchors hard-coded relative to the start head pose | **Open [V]** | `RoomscriptCaseRoom` sits at y −160. No placement step (P1-4). |
| M4 | Lazy engine init | **Partly fixed [V]** | Actor, binding, flow and clue call `engine.initialize()` first. But `snapshot()`, `caseGraph()` and `dispatch()` still don't self-initialize, and `initialize()` throws on a missing `player` or `roomRoot` (log 02:14:33). |
| L4 | Crate update loop | **Fixed [V]** | `RoomscriptCaseCrate.ts:8` disables the tick when the lid is open; `restart()` re-enables it. |
| M5 | `console` vs `print` | **Fixed** for production components. Only the dev ProbeLab and the AI LEAF scenario still use `print`. | |
| M5 | `@hint` | **Regressed in new files [V]** | `RoomscriptClueController.ts:12-15` and `RoomscriptSpatialObjectionController.ts:12-15` have no hints. |
| M5 | Header contracts (Connections/Lifecycle) | **Open [V]** | No component has one. |
| M5 | `Button.size` | **Fixed [V]** | `RoomscriptPanelUI.ts:60` sets it in `onInitialized`. |
| M6 | Voice | **Fixed** (A7: authored voice, coral for Vale). | |
| L5/L6 | Stale probe LEAF entries; 10 s sleep | **Open [V]** | `RoomscriptLeafIndex.ts:25-26`; `RoomscriptActorLeafScenario.ts:21`. |
| L7 | Dev objects in the scene; lens named SpecsBaseTemplate | **Open [V]** | `RoomScriptF.esproj:16 lensName: SpecsBaseTemplate`. |
| L12 | One SFX channel | **Partly fixed** | A separate spatial emitter was added; non-spatial cues still cut each other. |
| M7 | clad-log quality | **Open [V]** | Still invalid UTF-8 (byte 0x97 at 5825), mixed CRLF and LF, out of order, collapsed digits ("passed23.170s", "and41"). |
| M8 | LFS hooks tracked | **Fixed [V]** | All 5 hooks are tracked. Ownership is still mixed: `.git`, `Tooling`, `.githooks` and the new scripts belong to `CodexSandboxOffline`. |
| M9/L1/L2/L3 | Icons/Motion 4.0.0 strays, Echopark.hdr, tracked tsconfig/jsconfig, `.gitignore` dupes | **Open [V]** | Unchanged. |

## New findings

### P0

**P0-1 — Uncommitted, un-backed-up work [V].**
- **What's uncommitted.**
  - Scene: `Assets/Scene.scene` (+183/−66).
  - New C7/D1 scripts, each with its `.meta`: SpatialObjection, DragInteraction, WorldLines, ClueController, two LEAF scenarios, and Engine `CluePresentation.ts` / `SpatialObjection.ts`.
  - The VFX asset and its `.meta`.
  - Ten modified scripts, including the shared `PanelUI` passive-backing change and the `Audio` spatial emitter.
  - Two Tooling tests, six captures, and the NOTICE, PROGRESS, decisions and clad-log edits.
  - `git branch -a` shows only `master`, and there's **no remote**.
- **Risk.** One bad editor save, an agent mistake, or disk loss erases the whole night's C7/D1. The working-copy tokens are blank (lengths 0/0/0 at `Scene.scene:3019-3021`), so committing now is safe.
- **Fix.** Wadood commits now from his own terminal:
  - `git -c safe.directory=C:/Users/wadoo/Desktop/SPECS_Hackathon/RoomScriptF add …` then `… commit`.
  - The hook inherits `-c` through `GIT_CONFIG_PARAMETERS`, and `Tooling/node_modules/yaml` is present.
  - Alternatively, he grants the Codex commit command a persistent approval.
  - Then add a **private** remote and push (his decision; the LFS pre-push hook is tracked).
  - Exclude `docs/REVIEW_2026-10-28.md` and `docs/reviews/` only if he wants them out. They are his documents and harmless to commit.

### P1

**P1-1 — The shatter cannot work even after the instantiation [V].**
- **Evidence.**
  - `RoomscriptSpatialObjectionController.ts:17` is `private shatterAsset:VFXAsset|null=null` and is never assigned.
  - Line 44 creates its own runtime `VFXComponent`, so it will never see the object that `AssetManager.instantiate` creates.
  - The log shows `Input shatterAsset was not provided` (02:00:04) and `Cannot read property 'name' of null` (01:59, 02:00, 02:03) from the debug path.
- **Fix.**
  - Add `@input @hint("Instantiated shatter VFX object") shatterVfx:SceneObject`, wired via VirtualScene.
  - At start, `this.particles = shatterVfx.getComponent("Component.VFXComponent")`.
  - Delete the runtime `createComponent` and `shatterAsset`.
  - Keep the instantiated object disabled or `emitting=false` at start. The graph uses `spawn_continuous` at 600/s (`RoomscriptShatter.graphVfx:37-41`), so if it's left enabled it sprays particles at the world origin, which is the player's head.

**P1-2 — Only Vale exists as an actor [V].**
- **Evidence.** `Assets/Actor` has only `Vale-*.png`. `selectSuspect` is called only from `initialize()` (`RoomscriptInterrogationController.ts:47`), and no UI switches suspect.
- **Impact.**
  - Imran, Okafor and Pike can't be questioned or seen.
  - The tableau, "accused turns to look" (D3) and the arrivals (D2) have no actors.
  - The case may still be solvable through suggestions and objects, but it won't read as a four-suspect mystery.
- **Fix.**
  - Generate two poses each (neutral and rattled) with the existing `tempAssetGen` pipeline.
  - Use one `RoomscriptSuspectActor` per suspect at its claimed mark (`refuterMarks` already computes these).
  - Pinching a suspect calls `selectSuspect`, which moves the chips and verbs to that suspect.
- **Effort.** 3–5 agent-hours.

**P1-3 — Modal cards cover the suspect [V, captures].**
- **Memory card.** It develops at the controller's local origin (`SpatialObjectionController.ts:62`), with the controller at world `(0,-5,-135)`.
- **Private refutation card.** It is pinned to world `(0,-5,-130)` (`RoomscriptClueController.ts:48`).
- **What the captures show.** In `c7memory.jpg`, `c7slip.jpg` and `d1card.jpg`, both cards plus the objection controls sit over Vale's face. Their small coral text is the only legible thing.
- **Why it matters.** The card is fixed in world space, not relative to the player. A player who has walked around the room gets it behind them or off to the side [S].
- **What design 03 asks for:** "text lives on things". The Polaroid develops at the object, and the card flips at the refuter (shot 14).
- **Fix.**
  - Spawn the memory and private cards about 25 cm in front of the object or refuter anchor, facing the camera, with distance-scaled text. Or use a lazy-follow at about 0.9 m, below the eye line and offset left.
  - Keep the objection controls below the suspect's knees.

**P1-4 — On device, the room objects are invisible and the layout is fixed to the start pose [V code, S effect].**
- **Evidence.** Kettle, lamp, bottle, cable, window, mug, bed and door exist only as PreviewRoom stand-ins, which are disabled on device (`RoomscriptPreviewRoom.ts:3`). Their binding anchors carry 16 cm invisible pinch boxes (`SpatialObjectionController.ts:52-54`).
- **Impact on device:**
  - the gaze line points at air;
  - you "pinch the kettle" in empty space;
  - the floor sits 160 cm below wherever your head was at launch.
- **Fix, before the first device build:**
  1. Draw a bright forensic tent or bracket (line art) at every fixture anchor on device.
  2. Add a one-pinch "place case" step: a World Query floor hit plus yaw sets the `RoomscriptCaseRoom` transform.
  3. Measure Wadood's room once and author the hero anchors to match it. That's design 03 §7's honesty rule, and it lets the Preview and device shots match-cut.

**P1-5 — Far drops need real depth precision [S, device].**
- **Evidence.**
  - A slip must end within 24 cm of an object anchor (`SpatialObjectionController.ts:80`).
  - A pawn must end within 80 cm horizontally of a zone anchor 1.8–3 m away (`RoomscriptClueController.ts:58`).
  - LEAF passes because it programs the drag vector.
  - On device, SIK far manipulation keeps roughly a constant ray distance, so landing a slip on a lamp 2 m away needs walking or awkward depth pushing.
- **Fix.** On release, cast the ray from the camera through the dropped object:
  - For slips, pick the object anchor with the smallest angular distance, under about 6°.
  - For pawns, intersect the ray with the floor plane and take the nearest zone.
  - Keep the near-field memory-card path as it is.

**P1-6 — The LEAF suite wasn't re-run after the shared changes [V].**
- **Evidence.**
  - After 01:09, only `roomscript-objection` and `roomscript-clue` ran.
  - The `PanelUI` passive backing (caseLid, subtitles, plaques), `Audio`, and the scene all changed after the staging, tells and interrogation scenarios last passed (00:58–01:14).
  - The log also has `Failed to get scenario list after 600 attempts` (01:57) and a cancelled run (02:48).
- **Fix.** Before tagging `m2-slice`, run every non-probe, non-live scenario in one session and save the pass lines in PROGRESS. Drop the two probe entries and the 10 s sleep.

**P1-7 — PROGRESS contradicts itself [V].** The top says C5, staging, C6 and D1 are verified. The stage table (`docs/PROGRESS.md`, "Status by stage") still says "C5 pure pipeline prepared; C6–C7 pending" and "D — Not delivered". "What is playable" still says the production buttons aren't wired. **Fix:** update the table to C1–C6 complete; C7 interactions done, shatter blocked; D1 verified in Preview; D2–D7 pending. Move the stale verification summary under "Historical".

### P2

- **Deep copies on every action [V code, S cost].**
  - Each `dispatch` fires `onState` to Main, Actor, Flow (`render` → `caseGraph()` + `choices()` → `caseGraph()` + `snapshot()` + `buildFactSheet`), TellVisual, SpatialObjection (`refreshWallet`) and Clue (`renderKnowledge`). That's about 8 JSON round-trips of the graph per tap.
  - On device this may cost a frame or two each time.
  - **Fix:** freeze and cache the graph once in `RoomscriptEngineBridge.ts:24`, and pass the one snapshot that `dispatch` already makes.
- **Two "start pose" sources for the sweep [V].** The engine order comes from `player` at bridge init (`RoomscriptEngineBridge.ts:17-18`). The blade angles come from the camera at the Clue OnStart (`RoomscriptClueController.ts:30-33`). If they ever differ, the `while` tick loop (line 79) skips witnesses. **Fix:** store the reference origin and forward in the bridge and read them from there.
- **Vale's mark intersects the Preview desk [V].** Her slot is x −22…63 at z −180, and the desk is x 32…128 at z −180. `c6-gaze-diagnostic.jpg` and `d1ghost.jpg` show the desk top and a leg cutting through her. **Fix:** move the slot about 50 cm forward (z ≈ −130), or to x ≈ −15.
- **Accidental pinches near Vale [S].** The mug (O9), recorder (O12) and cable (O1) colliders sit at her hip height, within 50 cm of her. Inspecting costs 10 night-minutes and cancels her answer (`SpatialObjectionController.ts:59`). Consider direct-only targeting for objects within 60 cm of the actor, or a confirm tap.
- **Subtitle placement [V].** The subtitle sits at chest height (`RoomscriptSubtitleUI` local y 86). Design 03 §6.3 says "below the chin" (about 125–135 on a 170 cm puppet), and the brooch tell flares at y 97, right at the subtitle's top edge.
- **No unsubscription anywhere [V].** None of the `onState` / `onSpeaking` subscriptions are removed. That's fine for singletons, but it becomes a leak once actors exist per suspect (P1-2).
- **Spawn rate depends on frame rate [V].** The shatter emits for 90 ms at 600/s, so the shard count varies with frame rate. Use `node_main_particle_spawn_burst` instead.
- **Secret guard as a different user [V].** I tested this. Running `check-secrets.mjs` (or any `git diff --cached`) as `wadoo` without `-c safe.directory` makes git treat the folder as not a repo, fall into `diff --no-index`, print usage and exit 129. The script catches that and prints "could not read the index. Commit blocked." It doesn't hang or leak; it fails closed, with a misleading message. Inside a real commit run with `-c safe.directory`, the hook works, because `-c` reaches child git processes through `GIT_CONFIG_PARAMETERS`.
  - **Fix (Wadood):** `takeown /F <repo> /R /D Y`, or a global `safe.directory` entry.
  - **Fix (agent):** have the hook detect `rev-parse` failure and print "dubious ownership — run with -c safe.directory or fix ownership".
- **No microphone/ASR [V].** Device shot 13 ("shout Objection") is unbuilt. The free-question keyboard path (`RoomscriptQuestionUI.ts:24-31`) has only ever run in Preview, where it returns early. Verify it on device.
- **Before submission:** rename the lens from SpecsBaseTemplate and add an icon, both in Project Settings. Remove the ProbeLab and dev objects or gate them to the editor. Do the M9/L1/L2/L3 hygiene items.

## The VFX exception: recommendation

**The request is sound and low-risk. Approve it, with conditions. Wadood can also skip the exception entirely by dragging the asset in himself.**

**Why it's sound:**
- CLAD's own `vfx-graph/SKILL.md` ("Placing a VFX in the scene") says there is no VFX preset and that `setProperty` / `VirtualScene apply.modify` fail for `VFXComponent`. It names `AssetManager.instantiate()` through `ExecuteEditorCode` as the supported path: "the native path that drag-and-drop uses".
- The log shows the agent tried both alternatives first: a script input (02:00 "Input shatterAsset was not provided") and `requireAsset`.
- One call creates one SceneObject. It's reversible (delete the object, or `git checkout` the scene) and it touches no credentials.

**Conditions:**
1. **Commit first (P0-1)**, so the scene can be rolled back.
2. Use the exact CLAD snippet with UUID `51829ea2-ad44-43b1-b5f9-2b54493c160a`, and nothing else in that call.
3. Afterwards, rename, reparent and disable the object via VirtualScene, then make the P1-1 code change. Without that change the effect still won't play.
4. **Timebox about 1 h** to a visible shatter in Preview plus a `SHATTER|` log line in LEAF. If the custom-code graph misbehaves, switch to the fallback.

**Option B, no exception needed.** Wadood drag-and-drops `Assets/Actor/RoomscriptShatter.graphVfx` from the Asset Browser onto the `RoomscriptObjection` object himself, which takes about 10 seconds. The agent then wires it via VirtualScene. This is the same native path, and since the rule binds agents, no exception is needed.

**Fallback, Option C.** Build the shatter with MeshBuilder: about 30 bright triangle shards in one mesh, animated on the CPU for 0.6 s with gravity and fade, using the existing `lightMaterial`.
- The code already builds quads this way (`path()`, `worldLines`).
- It is deterministic, LEAF-testable and identical in Preview and on device.
- It costs about 1–2 agent-hours.
- It's also a fine primary choice if the GPU graph gives any trouble. The VFX graph's extra value is mostly CLAD-usage evidence for judging.

## Player experience: what a judge would see

**What works:**
- Vale at 1.8 m, in readable paper-theatre line art. Bright ivory and cyan read well on an additive display.
- The **gaze line** to the kettle (`c6-gaze-diagnostic.jpg`) is the best AR moment so far.
- The suggestion ghost, the cyan zone and weapon marks, and the clockwise blade with spatial ticks.
- The cyan and coral path ribbons on correct objection (`c7paths.jpg`).
- The crate lid HUD is compact and legible (`staging-preview.jpg`).

**What hurts:**
- **Clutter in front of the face** (P1-3). Every C7 and D1 capture stacks two or three dark-plated panels over Vale's head. On an additive display the plates vanish, leaving floating text over a face.
- **Small text.** Memory and card text uses the "small" role at about 1.3 m. In the captures it's the least legible text on screen. Check it against design 03's 0.7–0.9° caption floor.
- **The OBJECTION moment underdelivers** (`c7slam.jpg). It's coral text on a dark 64 cm plate:
  - no forensic yellow, no shake, no freeze;
  - no shatter (blocked);
  - no hold on the break pose;
  - no red string.
  - **Cheap upgrade (1–2 h):** use the existing `RoomscriptYellow` with no backplate, a scale-punch plus a 3-frame jitter, and a 250 ms hold; add the shards; and leave a coral line from Vale to the evidence object.
- **One suspect** (P1-2) makes the "Clue" half feel thin.

**Wow list status (design 03 §10):**

| Wow moment | Status |
|---|---|
| #2 gaze line | Present |
| #5 sweep | Present |
| #10 lawyer-up door exit and knock | Present |
| #1 objection | Partial |
| #8 room crossing itself off | Partial: dim marks and chalk Xs |
| #6 tableau | Partial: only Vale walks |
| #4 opening | Missing |
| #3 bullet-time reenactment (the money shot) | Missing |
| #7 blackout | Missing |
| #9 AI casting | Missing (deferred) |

**In a 2-minute video today:** shots 9–12 and 14 could be filmed in Preview, but there's no opening and no ending. **D3 and D2 are what turn this into a video.**

## Remaining work vs calendar

Today is Thu Oct 29. Project Review is Thu Nov 5. The deadline is Tue Nov 10 03:00 PKT, so in practice the night of Mon Nov 9. Codex did L1, C5, staging, C6, most of C7 and D1 in about 3.5 h overnight, so agent build speed isn't the bottleneck. Wadood's approvals, device time and the video are.

| Item | Agent h | Wadood h |
|---|---|---|
| Commit, remote, ownership (P0-1) | — | 0.5 |
| C7 finish: VFX or shards, P1-1, objection polish, full LEAF run, `m2-slice` | 2–3 | 0.5 |
| Three more suspects: art, actors at marks, select (P1-2) | 3–5 | 1 (art review) |
| UX pass: cards on things, text sizes, subtitle, slot (P1-3, P2) | 2–3 | 0.5 |
| D3 accusation, simplified puppet-ghost reenactment, scoring, wrong ending | 5–8 | 1 |
| D2 opening (knock, tape, crate, chalk, envelope, seal) plus arrivals | 3–6 | 0.5 |
| Device readiness: placement, fixture tents, ray-based drops (P1-4/5) | 3–5 | — |
| D6 degradation and stage mode, D7 suite, hero tape for an offline demo | 3–5 | 0.5 |
| Device sessions: build, hands, keyboard, audio, readability, fixes | 2–4 (fixes) | 6–10 |
| Hygiene, CLAD conventions, clad-log rewrite, lens rename | 2–3 | 0.5 |
| Video (3 min) and Devpost | — | 10–15 |
| **Total** | **≈25–45** | **≈21–30** |

**It fits, with little slack. Suggested schedule:**

| When | Work |
|---|---|
| Thu Oct 29 (evening) | Commit; VFX decision; finish C7 |
| Fri Oct 30 – Sat Oct 31 | Suspects and D3 |
| Sun Nov 1 | D2; first device build |
| Mon Nov 2 – Wed Nov 4 | UX and device fixes, D6/D7, hero tape. **Feature freeze Wed Nov 4.** |
| Thu Nov 5 | Project Review: a Preview playthrough plus one device clip |
| Fri Nov 6 – Mon Nov 9 | Video, Devpost, bug fixes only. Submit by about 22:00 PKT on Nov 9. |

Keep blackout, AI casting, D4/D5-Lens, E and F out unless the core case is green by Nov 4. That's already the recorded scope.
