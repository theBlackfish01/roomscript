---
type: project-plan
status: adopted project; the schedule is a proposal
date: 2026-10-26
---

# Roomscript: implementation plan

**Decisions (Oct 26, Wadood):**
- He is going with Roomscript for Snap's "Learn AR with SPECS" hackathon.
- **Scope:** must + should tiers + **Clue Night**. Cheaper stretch extras (LIAR!, on-device voice questions, a Snap3D exhibit) go in only if time is left.
- **Device:** he can get Spectacles before Nov 8, so the build is preview-first, with device testing and filming late.
- **Time:** evenings and weekends.
- **Setup:** nothing installed yet. Lens Studio and CLAD were not found on this machine; Node 22 and git are present.
- **Later on Oct 26:** Lens Studio 5.23.2 is installed (he downloaded it). Claude Code CLI 2.1.86 and Codex CLI 0.135.0 are already present, and CLAD supports both. CLAD itself is not installed yet.
- He said the current design and planning look good.

**What's decided and what's a proposal.** The project, scope, device situation and hours are his decisions. Dates, hour estimates, ordering and gates below are a proposal for him to adjust.

**Design references:**
- [Roomscript - ideal version design - 2026-10-26](../design/01-roomscript-design.md)
- [Architecture detail](../design/02-architecture.md): schemas, prompts, module map.
- [Staging and storyboard](../design/03-ar-staging-and-storyboard.md).
- [AI gameplay](../design/04-ai-gameplay.md).

**Key dates (PKT):**
- **Thu Oct 29, 21:00:** Live Build.
- **Thu Nov 5, 22:00:** Project Review.
- **Tue Nov 10, 03:00:** deadline, which is Monday night.
- **Sun Nov 1:** the Max Planck application is also due.

---

## 0. At a glance

| Phase | Dates | Goal | Exit (done when) |
|---|---|---|---|
| **0 · Setup and risk probes** | Mon Oct 26 – Tue Oct 27 | Tools installed; the gateway questions answered | Probe table recorded; Lens Studio MCP tools visible in Claude Code |
| **1 · Truth engine** (agents) | Mon Oct 26 – Wed Oct 28 | The hero case playable **in a terminal** | `npm test` green; `npm run play` solves HARLOW-1041 |
| **2 · Interrogation slice** | Wed Oct 28 – Sat Oct 31 | One suspect, live, in Preview, with tells, verbs, composure and an Objection | Gate on Fri Oct 30; milestone on Sat Oct 31 |
| **3 · The whole case** | Sun Nov 1 – Thu Nov 5 | Every must-have, a full case in two rooms, live generation | Must tier locked by the Project Review on Thu Nov 5 |
| **4 · Should tier** | Fri Nov 6 – Sat Nov 7 | Maximum safe AI | Ordered list with a cut line |
| **5 · Clue Night** | Sat Nov 7 – Sun Nov 8 | Two detectives | Gate at Sat Nov 7, 14:00 |
| **6 · Device, film, submit** | Device day + Sun Nov 8 – Mon Nov 9 | Video and Devpost | Submitted |

**Budget.** About **72 hours of Wadood's time** (calendar in §11), plus unattended agent time. The earlier design plan assumed full-time work (120+ hours). This plan fits only because of three choices:
1. **Agents build the engine by day.** The pure-TypeScript engine is built and tested in Node with no Lens Studio, so it can run while he's at work.
2. **The hero case is hand-written first.** Lens work never waits on case generation.
3. **The engine is multiplayer-ready from day one:** an event-sourced, host-ordered action log. That makes Clue Night mostly wiring.

Even so, expect to cut from the bottom of the should tier. §9 gives the order.

**Calendar conflicts:**
- **Max Planck (due Sun Nov 1):** reserve that morning, or finish it on Saturday morning.
- **GRE:** suggest keeping it light until Nov 10. That's his call.

---

## 1. How the work runs

### Two lanes
- **Agent lane (daytime, unattended).** Claude Code or Codex sessions working in `engine/`, `tools/` and `content/`. Everything is pure TypeScript tested with vitest in Node, with no Lens Studio needed. Queue work in the morning, review it in the evening. Each work package below is a self-contained brief with acceptance tests.
- **Studio lane (evenings and weekends, at the machine).** Lens Studio open, with Claude Code and CLAD driving it over MCP. Test in Preview, judge the feel, record footage.

If the computer can't stay on during the day, the agent lane moves into the evenings and the should tier shrinks.

### Repository
`C:\Users\wadoo\Desktop\SPECS_Hackathon`, outside the vault. (Updated Oct 26: Wadood created the Lens Studio project at `SPECS_Hackathon\RoomScriptF`, so the repo root is its parent.) Git from the first commit, pushed to a private GitHub repo and made public at submission.

```
SPECS_Hackathon/
  AGENTS.md, CLAUDE.md   rules for agents (below)
  engine/                pure TS (ES2019, no Node or Lens APIs) + vitest
  tools/                 Node scripts: play, fuzz-cases, fuzz-players, sync-engine, harvest-tape, validator-replay
  content/               hero case, authored pitches, line banks, gazetteer data
  Roomscript/            Lens Studio project (Specs Base Template, Lens Studio 5.23.2). Assets/Engine is a synced copy of
                         engine/src. Its own AGENTS.md and .mcp.json are managed by Lens Studio; the token files are gitignored
  docs/                  probe-results.md, decisions.md, later.md, architecture diagram
  devpost/               clad-log.md, stats, write-up draft, footage list
  NOTICE, LICENSES/      attributions for copied MIT/Apache code
```

**`AGENTS.md` rules for every agent:**
1. **Engine purity.** `engine/` imports nothing from Node or Lens, targets ES2019 (the Lens runtime is ES2021, per Lens Studio's generated AGENTS.md) and doesn't use `structuredClone`, `window` or `document`. All randomness goes through `Prng` named substreams.
2. **The LLM never decides truth.** Any path where model output changes a fact, lie flag, tell, refutation, objection result or verdict is a bug.
3. **Every LLM output enters the game as an event** in the action log, so it is replayable and syncable.
4. **Tests first for engine behaviour.** Every bug gets a regression test.
5. **Licences.** Copy code only from MIT, Apache or BSD sources, and record source and licence in `NOTICE`.
6. **Log CLAD and MCP work.** Append the prompt, tools used and outcome to `devpost/clad-log.md`.
7. **No new ideas mid-build.** New ideas go to `docs/later.md`.

### Habits from day one
- **Screen-record** every Lens Studio + Claude Code session with OBS, with files named by date. The video needs 15–20 s of CLAD footage, and it can't be recreated later.
- **Commit** at least every evening.
- **Tag milestones:** `m0-probe`, `m1-terminal`, `m2-slice`, `m3-case`, `m4-should`, `m5-cluenight`, `m6-submit`.

### Definition of done for any feature
- It works in Preview with mouse and chips.
- It has a fallback path.
- Its engine logic has tests.
- It has a LEAF scenario or a written manual test.
- If it's a video beat, there's a footage note.

---

## 2. Phase 0: setup and risk probes (Mon Oct 26 – Tue Oct 27, about 6 hours)

**Goal:** tools working, and one question answered that could sink the architecture: *do the gateway's chat, TTS and Imagen calls work from Preview, and how fast?*

### 0.1 Install (Wadood; downloads and accounts are his)
1. **Lens Studio with Spectacles (SPECS 27) support.** Snap's current samples need 5.22 or newer; take the exact build from the Specs developer site.
2. **Sign in** with the Snapchat account for the hackathon. Gateway tokens are tied to it.
3. **CLAD** (repo `lens-studio-devs/ls-extensions`, Apache-2.0). From a terminal in `SPECS_Hackathon\RoomScriptF`, run `claude plugin marketplace add lens-studio-devs/ls-extensions --scope project`, then `claude plugin install ls-clad@ls-extensions --scope project`. Lens Studio 5.23.2 already writes `.mcp.json` (the `lens-studio` server on localhost) and an `AGENTS.md` into the project, so Claude Code connects while Lens Studio has the project open. Run Lens-side agent sessions from that folder.
4. **Check MCP.** In Claude Code, list the tools and confirm the Lens Studio ones appear: `scene-graphql`, `VirtualScene`, `ExecuteEditorCode`, `RecompileTypeScriptTool`, `RunAndCollectLogsTool`, `CaptureRuntimeViewTool`, `PreviewInteractTool`.
5. **OBS** (or any screen recorder).

### 0.2 Repo scaffold (agent, 30 min)
- the layout above and `AGENTS.md`;
- an `engine/` package (TypeScript strict, ES2019, no DOM lib, vitest);
- GitHub Actions running `npm test`;
- a private GitHub repo.

### 0.3 Project init through CLAD (Wadood + agent, 45 min)
1. ~~Create the SPECS project~~: done by Wadood on Oct 26 (`Roomscript/`, Specs Base Template). Use CLAD's `specs-ai-remote-service` skill for the gateway.
2. Install the Remote Service Gateway package and generate the tokens. CLAD regenerates them through `ExecuteEditorCode`; plan for roughly a 1-hour lifetime.
3. Commit.
4. **Record this session.** It's the first CLAD footage.

### 0.4 Gateway probe lens (2–3 hours, built by CLAD)
A throwaway `ProbeLab` scene with one button per call. Each call fires 20 times and logs its latency.

| Probe | What | Record |
|---|---|---|
| P-a | OpenAI chat with strict `json_schema`, `gpt-4.1-nano` and `gpt-4o-mini` | p50/p95; does `strict:true` work; schema adherence |
| P-b | Gemini `responseSchema`, `gemini-2.5-flash` and `-flash-lite` | p50/p95 |
| P-c | OpenAI TTS `gpt-4o-mini-tts` with `instructions` | time to audio; quality |
| P-d | Built-in TTS (`TextToSpeechModule`) | works in Preview alongside the gateway? |
| P-e | Imagen portrait | latency; refusals |
| P-f | 4 parallel chat calls | errors; throttling |
| P-g | Camera stream in Preview | what it shows: the simulated room or a webcam |
| P-h | Snap's Sync Kit sample in two Preview panels | does it run? (de-risks Clue Night early) |

Results go in `docs/probe-results.md`, and the models are chosen from them.

### 0.5 What the probe decides

| If… | Then… |
|---|---|
| Chat and TTS work in Preview, median ≤3.5 s | Live answers as designed |
| Chat works but the median is over 3.5 s | Rely on the speculative cache. Chips use pre-written lines first; live answers only for typed questions |
| The gateway doesn't work in Preview | Develop against pre-written lines and a Node mock of `LlmPort`. The video uses replay tapes recorded on the device |
| OpenAI TTS fails in Preview | Built-in TTS plus subtitles in Preview; OpenAI TTS on the device |
| The camera stream shows the simulated room | The vision scan is showable in Preview |
| It doesn't | Room photo → Gemini → stand-in props, captioned honestly |
| The Sync Kit sample fails in Preview | Clue Night becomes stretch-only; the same-case duel is the multiplayer story |

**Exit:**
- probe table filled in;
- models chosen;
- tokens working;
- first CLAD footage recorded;
- repo pushed;
- tag `m0-probe`.

---

## 3. Phase 1: the truth engine in Node (agent lane, Mon Oct 26 – Wed Oct 28)

**Goal:** the whole hero case playable in a terminal before any AR exists. This is the spine everything plugs into. The schemas are in the architecture report, §3–6.

**WP1.1 Core** (`engine/core`)
- **Files:**
  - `Prng.ts`: sfc32, with named substreams `prng(seed, name, n)`;
  - `Hash.ts`: fnv1a;
  - `CanonicalJson.ts`;
  - `Types.ts`: RoomScan, CaseGraph, Fact, Statement, Evidence, Beat, RequiredDeduction, Action, GameEvent, GameState.
- **Accept:**
  - the same seed gives the same sequence;
  - substreams are independent, so extra draws in one never shift another.

**WP1.2 Room** (`engine/room`)
- **Files:**
  - `RoomModel.ts`;
  - `Affordances.ts`: maps object type to roles;
  - `Substitution.ts`: adds virtual props to reach the minimums of 3 zones, 3 weapon candidates and 2 witnesses;
  - `RoomFixtures.ts`: five fixtures, which are Wadood's room, a dorm room, a studio flat, an office and a minimal room.
- **Accept:**
  - every fixture binds;
  - substitution fills the gaps;
  - `roomId` doesn't depend on layout.

**WP1.3 The hero case, HARLOW-1041** (`content/hero/`)
- **A hand-written CaseGraph:**
  - 4 suspects: Vale (culprit), and Imran, Okafor and Pike, each innocent with a secret;
  - 5 zones and 5 weapons;
  - 12 time slots from 21:00 to 23:45, with the murder in the 22:30–22:45 slot (body found at 22:41);
  - statements with layers: three rungs for the culprit, 1–2 for innocents;
  - object memories;
  - refutation cards and the clockwise order;
  - beats: letter, voicemail, flight, blackout;
  - required deductions;
  - baseline questions.
- **The `LineBank`:** every line each suspect can say, plus fillers, deflections, break lines, lawyer-up lines and the final confession.
- **Who does what:** an agent drafts it. **Wadood reads the story** (about 1 hour), because taste matters here.
- **Accept:** it passes all 8 solver checks (WP1.4).

**WP1.4 Solver** (`engine/case/Solver.ts`)
- **What it does:**
  - enumerates hypotheses and checks which stay consistent;
  - works out what knowledge is reachable;
  - runs checks 1–8 with structured error codes;
  - finds the minimum-cost route;
  - has a player-knowledge mode for the grid, hints and Hunches.
- **Accept:**
  - the hero case passes;
  - 20 deliberately broken variants each fail with the right code, such as `NOT_UNIQUE`, `LIE_UNBREAKABLE` or `SHORTCUT`.

**WP1.5 Game reducer** (`engine/game`)
- **Actions** (`Actions.ts`): Ask, Press, Believe, Object, PinchObject, RevealEvidence, Suggest, CallLiar, Dismiss, UseHunch, Accuse, ArgumentClaim. **Each carries a host-assigned `seq` and a player ID `by`**, so the engine is multiplayer-ready.
- **Other files:**
  - `Reducer.ts`;
  - `GameState.ts`: clock, each suspect's composure, rapport, layer and lawyered state, pips, a notebook of canonical claims, grid, Hunches, who was shown what, beats fired, verdict;
  - `ObjectionJudge.ts`, `RefutationRound.ts`, `Accusation.ts`;
  - `Scoring.ts`: the Holmes rating against the minimum route;
  - `Hunches.ts`, `Clock.ts`, `Composure.ts`.
- **Accept:**
  - replaying an action log reproduces the state exactly (golden test);
  - a correct objection swaps the layer and earns a Hunch; a wrong one costs a pip;
  - three empty presses make the suspect lawyer up for 2 slots;
  - a suggestion goes to the first clockwise refuter, and objects are always truthful;
  - no refuter produces a `breathesIn` event.

**WP1.6 Performance safety core** (`engine/perf`)
- **Files:**
  - `FactSheetBuilder.ts`: current layer only, no stance;
  - `AnswerSchema.ts`: per-call enums;
  - `Gazetteer.ts`: names and nicknames, zones and Clue names, objects and synonyms, times in spoken forms;
  - `LineValidator.ts`: the 7 gates;
  - `LineBank.ts`;
  - `KeywordIntent.ts`: maps questions to topics offline.
- **Accept:**
  - adversarial fixtures are rejected: wrong name, invented time, confession, "as an AI", uncited memory, entity outside the cited facts;
  - 100% of LineBank lines pass.

**WP1.7 Terminal player** (`tools/play.ts`)
- **The REPL:** chips, typed questions through `KeywordIntent`, press/believe/object with evidence IDs, pinching objects, suggestions, accusation. It prints claim cards and `TELL` markers.
- **Accept:** Wadood solves HARLOW-1041 in about 15 minutes. **Milestone `m1-terminal`.**

**WP1.8 Property tests** (`tools/fuzz-players.ts`)
- **1,000 random players.** Assert that no layer ever contains two contradictory claims, that the game always ends, and that the minimum route is ≤60% of the clock.

**Wadood's time:** about 1 hour of review per evening, plus the story read and the terminal playthrough.

---

## 4. Phase 2: the interrogation slice in Lens (Wed Oct 28 – Sat Oct 31)

**Goal:** one suspect in Preview, answering live, with tells, the three verbs, composure and one Objection. This is the heart of the entry; if it feels great, the rest is assembly.

**WP2.1 Engine in Lens** (agent, 1 hour)
- **Build:** `tools/sync-engine.ts` copies `engine/src` to `Roomscript/Assets/Engine`, and it compiles through `RecompileTypeScriptTool`. `RoomscriptMain.ts` loads the hero case and logs a solver report.
- **Accept:** Preview logs "unique ✓".

**WP2.2 The room set** (CLAD + Wadood, 2 hours)
- **Build:** `specs-experience-builder` builds the simulated room with stand-ins **matching Wadood's real room** (desk, bed, door, window, kettle, lamp, cable, mug, bottle), with brass zone plaques, a smoothed Preview camera, and a matching `wadood-room` fixture.
- **Accept:** positions match the fixture.
- **Film:** the build timelapse. This is the hero CLAD shot.

**WP2.3 Suspect actor v1** (CLAD + Wadood, 3 hours)
- **Build:** a "living engraving" paper-theatre puppet:
  - billboard planes with 3–4 pose textures (neutral, listening, rattled, broken);
  - an ivory rim shader that warms to coral under stress (`shader-graph`);
  - a jaw flap driven by audio amplitude;
  - furniture masking the lower body;
  - placeholder line-art textures until the Imagen portraits in Phase 4.
- **Accept:** Vale stands at her claimed mark and reacts to state changes.

**WP2.4 AI plumbing** (agent + Wadood, 3 hours)
- **Build:**
  - `RsgLlmClient.ts` implementing `LlmPort` (OpenAI chat with json_schema, plus Gemini);
  - `Scheduler.ts`: priority live > case-load > speculative, a cap of 4 requests, cancellation;
  - `Deadlines.ts`;
  - `Tape.ts`: LIVE, RECORD, REPLAY and HERO modes;
  - `TtsService.ts`: OpenAI TTS split by sentence, built-in TTS as fallback, a 60-clip LRU cache.
- **Accept:**
  - a chip question makes the round trip;
  - RECORD logs a tape;
  - REPLAY reproduces it offline.

**WP2.5 Live answer pipeline** (agent + Wadood, 3 hours)
- **The pipeline:**
  1. the question;
  2. the fact sheet;
  3. a per-call schema;
  4. the model;
  5. `LineValidator`;
  6. TTS;
  7. the actor speaks.

  A failed line is retried once, then replaced from the LineBank.
- **The topic chip:** the interpreted topic shows as a chip ("asking about: …") with a one-tap correction row.
- **Latency hiding:**
  - the subtitle appears at 0 ms;
  - the detective's line plays;
  - fillers at 600 ms and 2.5 s;
  - a hard fallback at 6.5 s.
- **Accept:**
  - chips and typed questions get spoken, validated answers;
  - network off falls back cleanly;
  - the median miss is ≤3.5 s, or whatever the probe allows.

**WP2.6 Tells, verbs, composure** (CLAD + Wadood, 3 hours)
- **Tells:**
  - Vale's brooch flare with its "tink" sound (`build-sfx`);
  - a gaze-line shader of constant angular width, pointing at the lie's real object;
  - baseline questions that teach the tell.
- **The verbs:** Believe / Press / Object, with a hover preview of the detective's line.
- **Pressure and the HUD:**
  - the composure ring, in segments, behind the head;
  - lawyering up: the suspect leaves through the real door and knocks to return;
  - a Hunch counter;
  - the clock and pips, kept minimal on the box lid and the empty clock outline.
- **Accept:**
  - the baseline teaches the tell;
  - every lie fires it;
  - deflections never do.

**WP2.7 Objects remember, Spatial Objection v1** (CLAD + Wadood, 3–4 hours)
- **Objects remember.** Pinching an object plays a sound and develops a Polaroid, which becomes a claim card. Evidence goes in a floating wallet that works in Preview; the palm fan comes later on the device.
- **Objecting.** Drag a statement slip onto an object or evidence card, and the engine judges it.
  - **Correct:**
    1. 250 ms of silence, then a freeze;
    2. the OBJECTION word slams in;
    3. the cyan alibi path tears from the coral truth path;
    4. the slip shatters (`vfx-graph`);
    5. the next layer of the story swaps in;
    6. the suspect walks to their real mark.
  - **Wrong:** the slip bounces back in 1.2 s, and you lose a pip.
- **Accept:** storyboard shots 9–12, the Vale sequence, play in Preview.

**Live Build, Thu Oct 29, 21:00** (about 1 hour). Ask the questions in §12 and record the answers in `docs/decisions.md`.

**Gate, Fri Oct 30 evening:**

| Gate | Pass | If it fails |
|---|---|---|
| Engine | Hero case passes the solver; golden tests green; terminal playthrough done | Stop Lens work and fix the engine first, since it is the spine |
| Live answers | Validated spoken answers in Preview; ≤10% rejected; fallback works | Use pre-written lines plus live topic mapping. Still Roomscript |
| Scene | One interrogation with tells playable | Simplify the actor to a portrait card with a rim light |

**Rule:** 2 of 3 passing means continue. If all three fail, talk it through before the weekend.

**Sat Oct 31 (about 9 hours).** Finish WP2.6–2.7, polish the Vale sequence until it feels great, and record the first preview take. **Milestone `m2-slice`.** Start WP3.1 if ahead.

---

## 5. Phase 3: the whole case (Sun Nov 1 – Thu Nov 5)

Sunday morning is reserved for the Max Planck application.

**WP3.1 Clue layer** (CLAD + agent, 4 hours)
- **The suggestion:**
  - suspect pawns sit on the box lid;
  - drag a pawn into a zone and touch an object; a dotted ghost appears and the clock ratchets forward.
- **The refutation:**
  - a light blade sweeps clockwise from the player's starting position, with roulette ticks, and stops at the first refuter;
  - the refuter shows a private card;
  - if nobody can refute, the envelope breathes in.
- **The notepad:**
  - a grid that crosses itself off, driven by the player-knowledge solver;
  - a Statements tab with tell markers;
  - the room mirrors the grid: zones dim, tents flip, pawns get chalk Xs.
- **Accept:**
  - storyboard shot 14 plays;
  - the grid always matches the player-knowledge solver.

**WP3.2 Opening ritual and tableau** (CLAD, 3 hours)
- **The opening:**
  1. motes freeze;
  2. three knocks come from the door's position;
  3. tape zips across the door;
  4. the crate thuds onto the desk; pull the tab and light pours from the lid;
  5. chalk draws the outline (a MeshBuilder line strip, animated);
  6. the envelope rises;
  7. a card riffle shows Wadood's zones and objects;
  8. the wax seal stamps;
  9. the missing clock starts ticking.
- **Arrivals:** the first suspect ducks under the tape; the others develop like Polaroids at their claimed marks.
- **Sound:** sound effects and music through `build-sfx` and `build-music`.
- **Accept:** storyboard shots 1 and 8.

**WP3.3 Accusation, reenactment, scoring** (CLAD + agent, 4 hours)
- **The accusation:**
  - place three cards; the accused turns to look at you;
  - hold to break the seal, and the clock stops;
  - a ladder of ✓ stamps.
- **The reenactment:**
  - the ribbon unspools from the empty clock;
  - coral dust ghosts walk the night with path lines;
  - bullet time at the murder slot freezes the cup's beads, with a slow orbit;
  - then the cup shatters, the clock reappears, the tape falls, the guests leave and CASE CLOSED stamps.
- **Scoring:** the Holmes rating and the case code.
- **Wrong accusation:** the real culprit walks out through the tape.
- **Accept:** storyboard shots 17–20.

**WP3.4 Casting** (agent + CLAD, 3 hours)
- **Manual tagging:** pinch a spot, then pick a zone name or object type from a radial menu. Substituted props "arrive in the box".
- **Vision scan in Preview:** a camera-stream frame or room photo goes to Gemini, which returns suggested tags; each is confirmed with one pinch.
- **The device path** (camera unproject → World Query) is built now and checked on the device later.
- **Accept:** two fixtures stage the same seed's case differently (storyboard shot 22).

**WP3.5 Generation loop** (agent lane from Thu Oct 29; wired in on Wed Nov 4, about 4 hours of Wadood's time)
- **Engine:**
  - `CasePitchSchema`, `PitchValidator`, `Simulator`, `Dealer`, `StatementBuilder`, `BeatPlanner`;
  - `CaseCompiler`, which re-samples up to 50 times;
  - `RepairPlanner`, which emits JSON-patch errors;
  - `PitchLibrary` with **6** authored pitches, cut from 12 to fit the hours;
  - `tools/fuzz-cases.ts`.
- **Lens:** all of these run behind the opening:
  - P1 pitch (Gemini Flash);
  - P2 repair;
  - P3 line packs, four in parallel, truth-blind per layer;
  - P4 critique;
  - P8 evidence pack.
- **The Case Compiler overlay:** a toggle showing pitch → bind → solver checks → repairs.
- **Accept:**
  - ≥90% of 1,000 seeds compile across 5 fixtures in Node;
  - in Lens, a live pitch compiles within 45 s at least 80% of the time.

  Otherwise the authored library becomes primary, which is still "generated cast and lines", honestly labelled.
- **Gate:** the generation gate is **Wed Nov 4**, not Oct 30.

**WP3.6 Degradation and stage mode** (agent, 1 hour)
- **Build:** the game steps down automatically per call: live → cached → buttons → offline hero case. A hidden switch forces the offline hero case for filming.
- **Accept:** pulling the network mid-interrogation never breaks the scene.

**WP3.7 Tests** (CLAD `live-lens-tester` + LEAF, 2 hours)
- **Scenarios:**
  - a question gets an answer;
  - a correct objection breaks the suspect; a wrong one costs a pip;
  - a suggestion gets refuted;
  - the accusation works;
  - network off steps down to buttons;
  - the tell fires on every lie.
- **Film:** the LEAF panel going green.

**Thu Nov 5, must-tier lock and Project Review at 22:00.**
- Bring a 90-second rough cut (a replay take), the Devpost draft and the architecture diagram.
- **Milestone `m3-case`.** Any must-have not done by Thursday evening gets simplified or cut, not carried forward.

---

## 6. Phase 4: should tier (Fri Nov 6 – Sat Nov 7)

The engine halves are built earlier in the agent lane, during Phases 2–3, so most items here are Lens wiring and feel. The order is value per hour; stop where time runs out.

1. **Lie ladders, 2–3 rungs (1 h).** Layers already exist; P3 writes packs per layer. After a break, the live "improvised next lie" comes from the next pre-validated layer.
2. **Wren (2 h).** `PartnerBrain` sees the player's knowledge only.
   - Hints cost a Hunch.
   - Theory checks run against what you know.
   - Recaps.
   - A small floating presence with a voice, which doubles as tutorial narrator.
3. **Director and generated evidence (3 h).**
   - `TensionModel` and `Director`: the LLM picks from the eligible beats, with a utility rule as fallback.
   - A letter slides under the real door: P8 text plus a claim card.
   - A voicemail plays from an object in the victim's voice.
   - A suspect tries to leave.
4. **Blackout and luminol twist (2–3 h).**
   1. Light is "banked" from minute one: lamp halos, motes, a hum.
   2. Lightning at the window, then all added light cuts out hard; only the eyes remain.
   3. A UV hand torch reveals coral drag marks.
   4. Power returns zone by zone, and one suspect has moved (beat `object_moved`).
5. **Gossip and the whisper beat (2 h).**
   - `GossipRules`: allies learn the evidence you revealed and how you treated their friend; rivals learn attitude only.
   - Pawns lean together, joined by a luminous thread.
   - Hearsay lines are validated.
   - The next suspect mentions how you treated their friend.
6. **Imagen portraits (1 h).** A template prompt, an ink-wash treatment on the puppet, and a silhouette fallback.
7. **Closing argument and defence (3 h).**
   - A case board with deduction sockets, for Preview.
   - A typed argument goes to P10 extraction, which may use only notebook IDs and verbatim spans, then to `DeductionMatcher`.
   - The defence asks up to two gap questions the engine chose.
   - You answer by dragging or throwing evidence.
8. **Morning Edition (1.5 h).**
   - A newspaper built from the event log that quotes your moments.
   - A case file: your route against Holmes's, what you missed, the lie you believed, and the hash check.

**Cut line:** if Sat Nov 7 at 14:00 arrives without items 1–4 done, skip Clue Night.

---

## 7. Phase 5: Clue Night (Sat Nov 7 afternoon – Sun Nov 8 morning, gated)

**Gate (Sat 14:00):**
- must tier green;
- should items 1–4 done;
- probe P-h passed.

**Engine side (agent lane; can start in Node on Wed Nov 4).** `SyncProtocol`:
- `CaseInit{seed, room, pitch}`, with a graph-hash check;
- host-ordered `Action{seq, by}`;
- a chunked log for late joiners;
- the other detective joins the refutation order;
- private-card visibility per player;
- a notebook per player;
- turn order.

**Lens side (CLAD + Wadood, about 6 hours).**
- **Sync:** `SyncBridge.ts` on Sync Kit: a host-owned SyncEntity with a NetworkEventBus.
- **AI calls run only on the host** and are broadcast as `LineSpoken` events. Each device synthesises TTS locally and places it at the suspect.
- **The private card** flies face-down across the room and opens only on the recipient's device.
- **Audio:** the observing device turns the suspect's voice down 12 dB.
- **Colocation:** through the Sync Kit prefab, checked on the device later.
- **Audit:** `specs-sync-kit-validator` (film it).
- **Preview:** two panels, one detective each.
- **Scope:** 2 competitive players. "Inspector" game-master narration only if there's time.

**Accept (in two Preview panels):**
- a suggestion gets a private refutation;
- the other detective sees only that a card was shown;
- both accuse, and each gets their own verdict.

**If the gate fails:** the same-case duel (case code plus Holmes rating) is the multiplayer story, and it ships regardless.

---

## 8. Phase 6: device, film, submit

**Device day,** whenever the Spectacles arrive (Sat Nov 7 at the latest):
1. Pair, enable developer mode, and push the lens from Lens Studio.
2. **Performance:** frame rate during the objection and reenactment. Use `specs-lens-perf-attribution` if needed.
3. **Voice:** ASR questions (device only) feed the same pipeline as typed questions. A spoken "Objection!" keyword fires the objection.
4. **Room scan:** camera frame → Gemini → unproject → World Query. Confirm the tags land on real objects.
5. **Audio:** levels on the open-ear speakers, and the spatial cues.
6. **Visibility:** lines and colours in the real room with the lights dimmed.
7. **The three device shots.** Each has a Preview fallback and a "Captured on Spectacles" badge:
   - casting (shot 7);
   - shouting "Objection!" (shot 13);
   - walking round the frozen moment (shot 19).

   Stretch extras if there's time: LIAR!, and a Snap3D exhibit in an evidence bag.

**Hero tape freeze, Sat Nov 7 night.** Generate HARLOW-1041 live once, compile it, read every line, and record the tape. It drives the replay takes.

**Filming, Sun Nov 8:**
- preview takes following the storyboard, in replay mode with the smoothed camera;
- one live typed weird question;
- one seed in two rooms;
- a three-seed montage;
- CLAD footage: build timelapse, shader before and after, verify-loop screenshots, LEAF going green, tape harvest;
- under-the-hood captures: the Case Compiler overlay, the solver report, the hash check.

**Edit, Sun Nov 8 night.** Under 3:00, following the storyboard, with voiceover and captions that include the honesty note.

**Submit.**
- **Target:** Sunday night.
- **Buffer:** Monday Nov 9 evening, for final fixes, the Devpost text, and making the repo public with `LICENSE` and `NOTICE`.
- **Latest:** submit by **23:00 PKT** (the deadline is Tue Nov 10, 03:00 PKT). Tag `m6-submit`.

**Devpost checklist:**
- pitch, problem, audience and why it matters;
- how it works, with an architecture diagram;
- "the AI decides nothing that matters";
- validator stats;
- 20 generated case JSONs with solver reports;
- the CLAD prompt log, MCP transcripts and LEAF results;
- attributions;
- the video.

---

## 9. If behind schedule: the cut order

Cut from the top first:
1. Clue Night (the duel remains)
2. Morning Edition (keep the Holmes rating)
3. Closing argument and defence
4. Gossip whisper beat
5. Imagen portraits (keep the line art)
6. Blackout twist (keep the letter beat)
7. Director, cut down to the letter-under-the-door beat
8. Wren, cut down to hints
9. Vision scan (manual casting only)
10. Live generation (hero case plus the authored library only)
11. Live answers (pre-written lines plus live topic mapping)

**Never cut:**
- the interrogation with tells;
- Spatial Objection;
- the Clue suggestion sweep;
- the accusation and reenactment;
- the opening ritual.

Those are the product.

---

## 10. Risks specific to this plan

| Risk | Early sign | Response |
|---|---|---|
| Not enough hours | Slice not done by Sat Oct 31 night | Apply the cut order straight away, not later |
| Lens Studio learning curve | WP2.2/2.3 take more than twice the estimate | Lean harder on CLAD; simpler actor (portrait cards) |
| CLAD or MCP setup trouble | Phase 0 slips past Tuesday | Build scenes by hand, but keep CLAD for scripts, the room build and the verify loop, because judging needs CLAD evidence |
| Gateway unusable in Preview | Probes P-a or P-c fail | Pre-written lines plus a Node mock; device replay tapes for the video |
| Rate limits while filming | Throttling in probe P-f | Speculative calls off for filming; replay takes |
| Device late or never arrives | Not here by Sat Nov 7 | Preview-only video; device shots use their Preview fallbacks; voice shown as typing |
| Token expiry (~1 hour) | `Unauthenticated` errors | Regenerate before each session; offline hero case as fallback |
| Max Planck and GRE clash | — | Sunday Nov 1 morning reserved; GRE light until Nov 10 (his call) |
| Ideas creeping in mid-build | — | They go to `docs/later.md` |

---

## 11. Day-by-day calendar (proposal)

| Date | Wadood's hours (est.) | Studio lane (Wadood) | Agent lane (daytime) | Done when |
|---|---|---|---|---|
| **Mon Oct 26** | 3.5 | Install Lens Studio, CLAD, MCP; repo; project init (record it) | WP1.1, WP1.2 | MCP tools visible; repo pushed |
| Tue Oct 27 | 3.5 | Probe lens (P-a to P-h) | WP1.3 draft, WP1.4 | Probe table; models chosen · `m0-probe` |
| Wed Oct 28 | 3.5 | Read the hero story; play it in the terminal; WP2.1 | WP1.5–1.8 | `m1-terminal` |
| **Thu Oct 29** | 2.5 + Live Build 21:00 | WP2.2 room set (film the timelapse) | WP2.4 plumbing; WP3.5 compiler starts | Room in Preview |
| **Fri Oct 30** | 3.5 | WP2.3 actor; WP2.5 live answers | WP3.5 continues; WP3.1 engine parts | **Gate** |
| Sat Oct 31 | 9 | WP2.6 tells and verbs; WP2.7 Objection; polish; first take | WP3.5; `GossipRules`, `PartnerBrain` | `m2-slice` |
| Sun Nov 1 | 4–5 (Max Planck in the morning) | WP3.1 Clue layer | WP3.5 fuzzing; `TensionModel`, `Director` | Suggestion loop works |
| Mon Nov 2 | 3.5 | WP3.2 opening and tableau | `DeductionMatcher`; `SyncProtocol` | Opening plays |
| Tue Nov 3 | 3.5 | WP3.3 accusation and reenactment | WP3.6 fallbacks; LEAF scaffolds | Case playable end to end |
| Wed Nov 4 | 3.5 | WP3.4 casting; WP3.5 wiring and overlay | `fuzz-cases` report | **Generation gate** |
| **Thu Nov 5** | 2.5 + Review 22:00 | WP3.7 tests; rough cut | Devpost draft; diagram | `m3-case` (must lock) |
| Fri Nov 6 | 3.5 | Should items 1–3 | Engine fixes for should items | — |
| Sat Nov 7 | 10 | Should items 4–6; **gate 14:00** → Clue Night or should 7–8; device day if it's here; hero tape freeze | `SyncBridge` glue | `m4-should` |
| Sun Nov 8 | 10 | Finish Clue Night (if gated in) or polish; film; edit | Stats; case JSON appendix | Video cut · `m5-cluenight` |
| **Mon Nov 9** | 4 | Final fixes; Devpost; repo public; **submit by 23:00** | — | `m6-submit` |

Total: about 72 hours of Wadood's time.

---

## 12. Questions to ask at Live Build (Thu Oct 29)

1. Does the submission need a published lens, or is a repo plus video enough? The plan assumes repo plus video.
2. What are the gateway rate limits, concurrency limits and token lifetime for hackathon accounts?
3. Are OpenAI chat and TTS supported in Preview? Any known Preview limits?
4. Is camera-stream access with internet in SPECS 27 ("Transparent Permission") fine for judging?
5. What evidence of CLAD and Lens Studio MCP use do the judges want to see?
6. Is the "Experimental Mode" watermark on device footage a problem?
7. Is a Connected Lens shown through Preview panels acceptable for multiplayer?

---

## 13. First actions tonight (Mon Oct 26)

1. Download and install Lens Studio (Spectacles-compatible) and sign in. (Wadood)
2. Initialise git in `C:\Users\wadoo\Desktop\SPECS_Hackathon` and scaffold `engine/`, `tools/`, `content/`, `docs/` and `devpost/` beside the Lens project. (An agent can do this now.)
3. Install CLAD, connect MCP and check the tools. (Wadood + agent)
4. Start OBS before the first CLAD action.
5. Queue WP1.1–WP1.2 for an agent to run tomorrow during the day.
