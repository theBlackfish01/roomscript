# Kickoff prompts

## Run 4: the big final-polish run (Tue Nov 3, overnight)

Before pasting:
1. **Restart Lens Studio**, open RoomScriptF, and sign in. A fresh process matters: long sessions caused the Preview timeouts.
2. `Tooling/.env` already holds `ANTHROPIC_API_KEY` and `ELEVENLABS_API_KEY`; both were tested on Nov 3.
3. In a terminal, `cd <project>` and run `codex --approve-for-me`.

```
Continue the Roomscript build: this is Run 4, the big final-polish run. I want to get as much as possible done tonight: everything in docs/REVIEW_2026-11-03.md, not just part of it. Lens Studio was just restarted, it is open on this project, and I'm signed in. You're running in Codex: follow §1b of docs/FIRST_PASS.md for how CLAD's skills and agents work here.

Read AGENTS.md (rules 11–14 are new or updated), docs/PROGRESS.md, then docs/REVIEW_2026-11-03.md. That review is the plan: work packages, art direction, audio, decisions and schedule. Full specs are in docs/reviews/2026-11-03-*.md; the mockups and art contact sheet are in docs/reviews/2026-11-03-media/; the prototype generators are in Tooling/art/; and the submission drafts are in devpost/drafts/.

Context:
- There are no physical Specs, so judges see only Lens Studio Preview in a video under 3 minutes.
- Multiplayer (Clue Night) is moved to later.md.

My direction: the overall idea works. What needs the most work:
1. Polish, above all UI design and character design.
2. The case must be more straightforward about what exactly happened (G4). Add no new red herrings.
3. Music and voices (Group 2b).

My decisions:
- **GitHub:** you may create the repo PRIVATE. The gh CLI is logged in as theBlackfish01. Run `gh repo create roomscript --private --source . --push`, then push the tags and LFS objects. If gh isn't authenticated in your environment, put the exact commands under Needs Wadood. Never make it public; I'll do that on Sun Nov 8.
- **Licence:** MIT.
- **Design brief:** you write devpost/design-brief.md from docs/design and docs/plan, with an honest provenance header.
- **History:** publish the real git history. Don't squash.
- **Feature freeze:** Sat Nov 7 at 21:00 PKT.
- **ElevenLabs:** use it for all voices, music and sound effects (Group 2b), with ELEVENLABS_API_KEY from Tooling/.env.
  - The key is restricted: it can't read the balance.
  - Keep your own credit ledger from the character-cost headers in Tooling/results/elevenlabs-ledger.json.
  - Use a content-hash cache keyed by voice ID, text and settings, so nothing is paid for twice and swapping one character's voice tomorrow re-renders only that character.
  - Hard cap: 150,000 credits (≈ $50). Stop and record under Needs Wadood if you reach it.
  - Never put the key in Assets/, logs, docs or the lens. The lens never calls ElevenLabs at runtime.
- **Claude:** use claude-opus-5-5 for writing and judging the variant banks (V1). Record its cost too.
- **Voice casting:** don't wait for me. Pick the best of the 3 previews per character yourself, using a stated rubric, and build the full library with it. Keep all previews in docs/audio-casting.md. I'll confirm or swap voices tomorrow.

Step 0: commit the uncommitted review and docs files (docs/REVIEW_*, docs/reviews/, Tooling/art/, Tooling/audio/.gitignore, devpost/drafts/, AGENTS.md, docs/*.md) as "docs: final review and polish plan". Then create the private GitHub repo and push.

Then work in lanes, with LIMITED parallelism. My laptop runs out of memory if too much runs at once:
- **At most 2 subagents at a time,** alongside the main Lens session, each on disjoint folders.
- **Order:** start Lane B and Lane C first. When Lane B finishes, start Lane D. Run Lane E whenever a slot is free.
- **One Playwright/Chromium instance at a time:** the art renders run one at a time, and the browser closes after each batch.
- **Never run the full vitest suite** (or the 5000-case fuzz) while art is rendering or a LEAF batch is running; use targeted tests in between. Run the full suite only at checkpoints, when nothing else heavy is running.
- If memory gets tight (Lens Studio slows, or processes get killed), drop to 1 subagent and record it.
- If subagents aren't available, interleave the lanes in the order shown.

Lane B, engine and content (Node only: Assets/Scripts/Engine, Assets/Scripts/Content, Tooling/tests):
- G4 case clarity: the story spine in Content/STORY.md, checked against the facts, plus engine data for the opening case card, the "What we know" timeline, the SAID/PROVEN slips and the ending summary.
- G1, G2 (no red herring), G3.
- The reconstruction's pure engine beat list (B2), with citations and tests.
- V3 validator v4; V2 director schema and pipeline; V1 runtime (LineBank variant selection, register composition).
- V5 Partner.ts (Wren).
- The Y1 engine fixes (N6, first-person generated statements, minimum route ≥ 60).
- Each comes with tests, a regenerated hero tape and a new seal version.

Lane C, voice text and audio (Tooling/audio, Tooling/scripts, Assets/Audio, generated Content/*Bank*.ts and *Manifest*.ts only):
- V1: generate the variant and register banks with Claude.
- E1: casting previews, then your pick.
- V4/E2/E3: the full voice library (mood takes, tell takes, set-piece dialogues, narrator and Wren lines).
- E4: about 30 sound effects.
- E5: the score cues, plus the 2:50 video soundtrack.
- E6: timestamp alignment data.
- E7: the scratch voiceover for the video.

Lane D, art (Tooling/art, Assets/Art, devpost/media):
- A1: the production pipeline, with contract tests.
- A2: art direction v2. Every suspect in 5 poses, the Harlow ghost, props as GLB, Polaroid cards from the case data, icons, hero words, fonts, reconstruction sprites, the blackout/UV visuals, and the video motion graphics.
- Self-review the contact sheets and iterate until each suspect is distinct and striking at thumbnail size. Save before/after sheets in docs/captures/.

Lane E, publication (README.md, LICENSE, NOTICE, devpost/, docs/PROGRESS.md header):
- the MIT LICENSE, plus a NOTICE covering the ElevenLabs/AI-voice disclosure and every third-party asset;
- README, devpost/README.md and devpost/design-brief.md;
- the rewritten clad-log, keeping the raw log;
- the PROGRESS submission-state block, path redaction and the lens rename.

Lane A, Lens (main session), wiring each lane's output as it lands:
1. Group 0: S1 fresh-process gate (record the handshake), S2 per-frame copies, S3 audio mixer, S4 Director/film mode, S5 live-path robustness.
2. The UI system: A4 stage manager and card system (one panel at a time, design-03 palette), A5 typography.
3. Characters: A3, wiring the new art (pose maps, blink, mouth from the timestamps, puppet shader rim fix, cards, GLB props).
4. Case clarity in Lens: the opening case card, the "What we know" timeline strip on the crate lid, the SAID/PROVEN slips, and the voiced ending summary.
5. Voices and music: wire the voice library (Stage mode must speak, rule 14), the mood and tell takes, the score with the composure-driven tension layer, and the sound effects through the mixer.
6. The moments: B2 reconstruction T1 then T2, B1 beats on stage (letter, voicemail, Pike's flight, blackout/UV), B3 ending (correct, wrong, timeout).
7. A6 hero VFX pass; A7 UX simplification, with the naive-player LEAF route.
8. Y1 Case Compiler page; Y2 the labelled live-AI beat.
9. A8 camera rig (20-minute spike), A9 size budget, B2 T3. Y3 is stretch only.
10. Final gate:
    - restart Lens Studio;
    - run the full integrated LEAF (hero-demo, interrogation, all-tells, closing correct/wrong/timeout, the naive-player route);
    - capture every beat in Director mode into docs/captures/;
    - record a hero performance tape with bundled audio;
    - assess and tag m3-case.

Work autonomously and follow rule 12: never idle on a blocker. Record it under Needs Wadood, then take the fallback or the next package.
- Commit after every verified package, and push to the private remote.
- Before any long LEAF batch, check the Preview handshake. If it's over 1 s, restart Lens Studio, or keep doing Node-side work and record it.
- Keep PROGRESS, decisions.md and devpost/clad-log.md current.

Finish with the FIRST_PASS §4 final report, including:
- what's done, partial or not started per work package;
- the Needs Wadood list;
- the contact sheets, captures and voice previews I should look at or listen to;
- the credits spent (ElevenLabs and Anthropic);
- a list for Run 5.
```

## Run 7: ambitious overnight: the judges' lessons, room casting, UI, art, audio, moments (Thu Nov 5, night)

This run includes the Nov 5 judge review (docs/REVIEW_SESSION_2026-11-05.md) and Wadood's decisions: the skill pack first, camera room casting with Claude Opus locally, a voice-agent spike, multiplayer decided on Friday, and the freeze on Sun Nov 8 at 21:00.

Before pasting: restart Lens Studio, open RoomScriptF and sign in; `cd C:\Users\wadoo\Desktop\SPECS_Hackathon\RoomScriptF`; run `codex --approve-for-me`.

```
Continue the Roomscript build: this is Run 7, an ambitious overnight run. Lens Studio was just restarted, it is open on this project, and I'm signed in. You're running in Codex: follow §1b of docs/FIRST_PASS.md.

Read, in order:
1. AGENTS.md (rules 12–17; 16 and 17 are new);
2. **docs/REVIEW_SESSION_2026-11-05.md**: the hackathon judges' live review, the changes R1–R10, and my decisions at the end;
3. docs/RUN6_REPORT.md;
4. docs/PROGRESS.md;
5. docs/REVIEW_2026-11-03.md.

**Feature freeze is now Sun Nov 8 at 21:00 PKT.** Be ambitious: quality matters more than finishing early.

**What the judges reward:**
- a complete product, not a "website on your face";
- big pinch targets, minimal text and progressive disclosure;
- feedback as small peripheral toasts;
- augmenting the real room, not simulating one;
- an interface that changes with distance (they praised one project for exactly this);
- physical, hands-free actions;
- originality, using what only glasses have (a camera that sees what you see, graphics in view, free hands);
- and, quoted: "we haven't seen LLMs or voice models in Specs yet."

Roomscript's voiced AI suspects and physical objections are our edge. Make them the headline, and cut UI clutter hard.

**Rules recap:**
- **Rule 16:** on an MCP or LEAF failure, pause asset writes, gracefully restart Lens Studio from the shell, and retry (up to 3 restarts). Never end the run over it.
- **Rule 15:** no GUI tools; normal escalations for git, network and npm; never wait on me; timeouts of 10 minutes or less.
- **Rule 17:** the local Claude vision bridge is Preview-only, the key stays in Tooling, and labels are honest.

**Git:** you're on `run5-wip` at `46f9e58` (pushed). Commit the uncommitted scene (regenerated LEAF bridge IDs) and my docs edits. When step 2 passes, fast-forward `master` to `run5-wip`, push, and work on `master` from then on.

**Parallelism (memory):** at most 2 subagents alongside the main Lens session, one Chromium at a time, and no full test suite during LEAF or art renders.

**Budgets:**
- **Claude** (`claude-opus-5-5`): up to $30 for vision casting, banks and judging. Record it.
- **ElevenLabs:** about 25,000 credits left. Spend them in this order: phrase segments for generated cases, the casting narration, new effects, then the voice-agent spike. Stop on a quota error and record it; I can top up.

Commit and push after every verified step. Keep PROGRESS, decisions.md and devpost/clad-log.md current.

## 1. The DevPost skill pack first (R8)
- Install `challengepost/learn-specs` project-locally, never globally.
- Run plan-lens, answering from our design, to produce or validate devpost/design-brief.md with an honest provenance note.
- Run its "After the build: judge it" checklist on the current build, and turn its findings into a list you act on in this run.
- Record what the skill pack changed. That's the Devpost "how the skill pack helped" answer.

## 2. The Phase A2 gate on the new cast
- Restart Lens Studio, let imports settle, and write no assets during registration.
- Run strict roomscript-bundled-voices and the repaired hero route.
- Commit the scene, fast-forward `master` and push.

## 3. SPIKE (about 2 hours, then go or no-go): the camera reads the room and casts the case

This is the headline AR feature.
- **Capture:** grab Preview camera frames of the simulated Evening Room from 3–5 viewpoints. The camera module worked in Preview in the Stage A probe.
- **Detect, with Claude Opus locally:** objects, Clue-role affordances (witness, weapon, hiding place, timekeeper) and 2D boxes, in strict JSON.
  - Transport: a localhost Tooling bridge the lens calls in Preview (dev flag, rule 17), or an offline pass where you capture frames through MCP and write a room-scan JSON the lens loads. Pick whichever works, and record why.
  - Also implement the in-lens Gemini (RSG) detection path for Specs.
- **Locate in 3D:** hit-test through the box centres (World Query, or the Preview room's depth/geometry), merge across viewpoints, and snap to surfaces.
- **Compile:** feed the detected fixtures into the existing room binding and case compiler (Substitution, Solver) to get a verified case. The engine decides; vision only proposes.
- **Present:** the casting sweep. Labels pop onto real furniture one at a time, voiced by the narrator: "Your desk lamp: WITNESS. Your charger cable: THE ROPE." It ends with "Tonight, this room is Harlow's study."
- **Go if:** at least 5 objects land within about 25 cm, the case compiles, and the sweep looks right in a capture.
- **No-go:** do the R3 casting sweep on authored anchors to the visible real furniture. Record the decision and evidence either way.
- **Honest label:** "In Preview the room scan uses Claude Opus through a local bridge; on Specs, Gemini through Snap's gateway."

## 4. Lanes (main session on Lens, plus at most 2 subagents)

**Lens, main session, in this order:**
1. **A3 art:** all 5 poses per actor, cards, props and ghosts, with texture residency and compression. Capture each suspect.
2. **R1 UI diet:**
   - one small world-anchored panel at a time, never in front of a speaker's face, with the HUD on the crate lid;
   - at most 3 big question chips (at least about 2.5° tall) with "More";
   - icon-plus-three-words cards that expand on pinch;
   - peripheral toasts;
   - the ending as a stamp plus stars;
   - the Clue grid marked in the room itself, with the notebook optional;
   - one-line subtitles at the speaker, with word reveal;
   - the Anton/Courier Prime fonts and the design-03 palette.
3. **R2 interface by distance:**
   - walk up to a suspect to question them (nearest in view within about 1.5 m), with no picker menu and a tested Preview fallback;
   - level of detail by distance: far, zone names, silhouettes and room marks; near an object, its memory; near a suspect, the questions.
4. **R3 casting sweep and room anchoring:** from the spike, or authored. Hide the stand-in boxes in Director and film mode; virtual props sit on real surfaces.
5. **Physical delight moments:**
   - pinch and **pull a memory out of an object**, like drawing out a photograph;
   - **lift** the cable or mug to inspect it;
   - **point at a suspect to accuse**;
   - the objection: carrying the slip, made big.
6. **R5 contextual voiced tips and R6 less friction.** Wren speaks one-line hints at the moment of need, once each; they ask, they don't tell. Auto-placement in Preview and Director mode, and the first question within about 30 s.
7. **Audio wiring:**
   - the narration selector and guard (Tooling/audio/RUN6-WIRING.md);
   - narrator triggers;
   - dialogue scenes on their beats, with Harlow's motive gated;
   - the score's tension layer;
   - effects on beats;
   - **voice tells**: hesitation takes play only on engine-authorised tells.
8. **The moments:**
   - B2 reconstruction with the new ghosts, plus T2 (dial, slip burn, ledger, narration);
   - **R7:** your own route replayed as a faint trail next to the truth ("You walked 23 m; you checked the kettle twice");
   - B1 beats on stage: letter, voicemail, Pike's flight, blackout/UV;
   - B3 endings: correct with Vale's confession and the voiced summary; wrong; timeout.
9. **R4 live AI beat:**
   - A free typed question in Preview (spoken on Specs) gets an in-character answer chosen by the live director, voiced, and labelled "live AI via Snap RSG". Fresh RSG tokens; blank them before committing.
   - **A conversational Wren:** ask "what do we know?" and Wren answers only from PlayerKnowledge, never the hidden truth.
10. **A6 hero VFX** (objection, tells, sweep, seal, opening), then **A7**: the naive-player LEAF finishing in 40 clicks or fewer.
11. **S2:** fix the polish scenario's clock `isPlaying()` failure, then measure frame time toward 8 ms.

**Lane B, engine and content (subagent):**
- **Generated cases playable in your room.** Run the compiler on the detected (or authored) Evening Room: first-person statements, line banks, verified solvability.
- **Voices for any generated case:** phrase-composed speech from pre-rendered ElevenLabs segments per voice (zone names, object types, times, templates), with live RSG TTS only as a fallback.
- Wren's PlayerKnowledge answers.
- The route-replay data.
- **Acceptance:** a generated case on the Evening Room plays to a verdict in the terminal and in a LEAF smoke test.

**Lane C, audio and voice (subagent):**
- the casting-sweep narration;
- phrase segments for generated cases;
- new effects (casting chime, toast tick, pull-memory whoosh, lift);
- **E8 spike, an ElevenLabs voice agent that plays a suspect.** Check whether it can run in the lens (WebSocket, mic in Preview or on device, audio playback), and design truth safety so facts come only from engine tools. Ship it only if it's truth-safe; otherwise document it for later. The video uses prerecorded voices.

**Lane D, art (subagent, when a slot is free):**
- the casting labels;
- toasts and icons;
- the pulled-memory photograph;
- the stamp;
- the route trail;
- role cards for any detectable object type.

**Lane E, publication (when a slot is free):**
- **R9:** update devpost/drafts/video-plan.md:
  - gameplay in the first 10 s;
  - by 0:20, "A one-player murder mystery that casts your room as the crime scene, for anyone who loves Clue and detective games";
  - an uncut 60–90 s segment;
  - hands, not a mouse;
  - honest Preview labels;
  - the AI-voice beat and a 15 s "AI voices, engine truth" explainer;
  - room casting as a key shot.
- **R10:** the Devpost description (what, who, what we learned, how the skill pack helped).
- The README.

## 5. Final gate
- restart Lens Studio;
- run the integrated LEAF (hero-demo, interrogation, all-tells, closing correct/wrong/timeout, naive-player, plus casting and generated-case smoke tests);
- Director-mode captures of every beat;
- a new-cast hero performance tape;
- **an uncut continuous 60–90 s run** from opening the crate to the first answer;
- tag m3-case if it passes;
- rename the lens to Roomscript.

## 6. If time remains
- A9: exported lens size (target under 18 MB);
- A8: the camera spike, then B2 T3;
- the rest of the publication check: README GIF from a capture, final NOTICE (including Claude for vision, ElevenLabs voices and music, and the AI disclosure), a history scan.

## Two modes: Preset for the demo, Dynamic as a real capability
Build both, selectable from the crate lid at the start:

**Preset ("The Harlow Trust", the default and the video's main story).**
- The authored HARLOW-1041 case on hand-tuned anchors to the Evening Room's real furniture.
- Fully prerecorded voices; deterministic, so every take is the same.
- Its casting sweep replays a **saved room scan**: one real scan from the spike, frozen into a fixture so it looks identical every time. Label it "recorded scan".

**Dynamic ("Cast my room", a real, working capability).**
- A live room scan (Claude Opus bridge in Preview, Gemini on Specs), then the compiler deals a **new verified case** on the detected furniture.
- Phrase-composed voices, with live AI for free questions.
- Each run can differ: a new seed means a new murder in the same room.
- It must play end to end to a verdict, with LEAF smoke tests on at least 3 seeds, but it doesn't need the Preset's hand polish.

Both modes share the engine, UI, art and VFX.

**In the video:** the Preset carries the story. A short Dynamic segment then shows the same room cast as a different case ("same room, new murder"). Add that shot to the video plan.

**Don't start multiplayer.** I'll decide tomorrow based on this run's progress.

## Overrides (Wadood, latest; these win over anything above)
- **Model provider doesn't matter.** This is developed and demoed on my laptop in Lens Studio Preview.
  - Use whichever model gives the best result. Claude Opus through the local bridge is fine as the **main** path for room casting, and also for live answers or Wren if it's better than the gateway models.
  - Gemini (RSG) is optional; skip the device-path work if it costs time.
  - No provider labels are needed in the video. Just keep the key out of Assets/ and the scene, and fall back gracefully (authored or prerecorded) if the bridge isn't running.
- **Never let a budget or quota block development.**
  - If ElevenLabs returns a quota error, stop *generating audio* only, and keep building everything else.
  - Use fallbacks for any missing audio: existing takes, phrase pieces, live RSG TTS, or subtitles.
  - List what's missing under Needs Wadood so I can top up and re-render later.
  - The same goes for Claude spend and any other provider limit.

Finish with the FIRST_PASS §4 final report, including:
- done, partial or not started per item;
- the spike decisions (room casting, voice agent);
- Needs Wadood;
- the Preview captures I should look at (suspects, UI, casting sweep, moments, endings, objection, live AI, Wren);
- costs (Claude, ElevenLabs).
```

## Run 6: finish Runs 4 and 5, then polish (Thu Nov 5, historical)

Run 5's work was committed by Claude to `run5-wip` (`6518394`) and pushed. Rule 15 is rewritten so Codex requests its automatic git and network approvals again.

Before pasting: restart Lens Studio, open RoomScriptF and sign in; `cd C:\Users\wadoo\Desktop\SPECS_Hackathon\RoomScriptF`; run `codex --approve-for-me`.

```
Continue the Roomscript build: this is Run 6. It finishes everything left over from Runs 4 and 5, then does the Run 6 polish. Lens Studio was just restarted, it is open on this project, and I'm signed in. You're running in Codex: follow §1b of docs/FIRST_PASS.md.

Read AGENTS.md (rule 15 was REWRITTEN), docs/RUN5_REPORT.md, docs/PROGRESS.md and docs/REVIEW_2026-11-03.md. All earlier decisions stand: private repo, MIT, real history, feature freeze Sat Nov 7 at 21:00 PKT.

**Git state:** Run 5's whole working tree was committed for you by Claude as `6518394` on branch `run5-wip` and pushed to origin. `master` is still at `bfaf5ff`.
- Keep working on `run5-wip`.
- As soon as Phase A step 2 passes, fast-forward `master` to it and push `master`. From then on, commit to `master`.
- Remove the duplicate prototype folders Tooling/art/web and Tooling/art/specs with `git rm` if nothing uses them; history keeps them.

**Rule 15 correction:** Run 5 committed nothing and couldn't reach ElevenLabs, because it skipped every approval. Request sandbox escalations normally; my automatic approver handles them: git add/commit/push and LFS; network to api.elevenlabs.io, api.anthropic.com and github.com; npm.
- Only GUI tools (computer-use, screenshots, window activation, UI automation) stay forbidden.
- Never wait on me personally: record it under Needs Wadood and move on.
- Timeouts of 10 minutes or less on every command and LEAF batch.

**Parallelism:** at most 2 subagents, one Chromium at a time, and no full test suite during art renders or LEAF.

**ElevenLabs:** use the 30,000 new credits freely, with a new ledger segment, and stop on a quota error. **Claude:** under $3, recorded.

Commit and push after every verified step. Keep PROGRESS, decisions.md and devpost/clad-log.md current.

## Phase A: finish what Runs 4 and 5 left blocking

1. **Vale voice swap.**
   - Save designed preview S2-1 (generatedVoiceId Ajczv1caVKcFEG1TdJH0) as a voice.
   - Update Tooling/audio/cast.json.
   - Re-render only Vale's lines (performances, mood and tell takes) and her parts in the opening exchange, the arrival and the confession.
   - Compress, re-export and verify.

2. **Voices verified in the game.**
   - Restart Lens Studio and let the asset import finish before refreshing. Last time, the refresh after importing hundreds of audio files timed out; if it happens again, consolidate the voice clips into fewer files (segment playback already supports this).
   - Run strict roomscript-bundled-voices on the compressed library, and the repaired hero route.
   - Commit the scene, then fast-forward `master`.

3. **S2 frame time.** It measured 29.7 ms against an 8 ms target. Profile per-frame copies, listeners and text rebuilds, fix them, and record the new number.

4. **Finish the audio wiring:**
   - Wren and narrator triggers (V5): opening, first tell, first objection, each beat, idle, and before the seal.
   - The dialogue scenes on their beats (E3), with Harlow's motive gated until the engine admits it.
   - The score's composure-driven tension layer and every sound effect on its beat (full S3 acceptance).
   - Word-by-word subtitle reveal from the timestamps (E6).
   - Spend leftover credits on missing hero-path takes, then the remaining mood and tell takes (E2).

## Phase B: Run 6, a complete good-looking hero case for the video

5. **Art, my top visual priority.** The suspects now have distinct silhouettes; good. But the lines are thin and dim, and the poses differ mostly in the hands.
   - Make strokes thicker and brighter: ivory, with a soft glow, so they read over the photoreal Preview room.
   - Push pose contrast through posture, head tilt and face.
   - Make faces slightly larger.
   - Composite-test over a Preview room capture before wiring.
   - Then do A3: wire actors, cards, props and ghosts through VirtualScene, selecting and compressing textures (not everything loaded at once).
   - Preview captures of each suspect in each pose.

6. **UI:**
   - A4, one panel at a time in the design-03 palette with the new card art and icons;
   - A5, OFL fonts imported, with angular sizing;
   - the opening case card;
   - the "What we know" strip;
   - the SAID/PROVEN slips.

   Capture each.

7. **The moments, voiced:**
   - B2 reconstruction T1 polish with the new ghost sprites, then T2 (time dial, slip burn, deduction ledger, narration);
   - B1 beats on stage (letter, voicemail in Harlow's voice, Pike's flight, blackout/UV);
   - B3 endings (correct with Vale's confession and the voiced summary; wrong; timeout).

8. **A6 hero VFX:**
   - the objection: hero-word texture, glow, shake, shards, coral string;
   - the tells;
   - the sweep;
   - the seal;
   - the opening.

   Then **A7 UX simplification**, with the naive-player LEAF finishing the case in 40 clicks or fewer.

9. **Final gate:**
   - restart Lens Studio;
   - run the integrated LEAF (hero-demo, interrogation, all-tells, closing correct/wrong/timeout, naive-player);
   - Director-mode captures of every beat;
   - a hero performance tape with bundled audio;
   - tag m3-case if it passes;
   - rename the lens to Roomscript.

## Phase C: everything else that's still open (after Phase B, before the freeze)

10. **Y2:** one labelled live-AI exchange (fresh RSG tokens; blank them before committing).
11. **Y1:** the Case Compiler page on the crate lid (deal and prove three cases on the Preview room).
12. **A8:** camera rig (20-minute spike), then B2 T3 (camera path or diorama turntable).
13. **A9:** export the lens, record the build size (target under 18 MB) and compress textures and audio until it fits.
14. **V3 recall:** lower the 70.6% holdout false rejection without any loss in attack safety; rescore the saved corpora with no API cost.
15. **Publication final check:**
    - NOTICE complete, including the AI-voice disclosure;
    - README with a hero GIF slot and a "How it was built" section;
    - devpost texts;
    - a full-history secret scan;
    - a PROGRESS submission-state block.

At the freeze (Sat Nov 7, 21:00 PKT), stop feature work. Move anything unfinished to docs/later.md, then do fixes only.

Finish with the FIRST_PASS §4 final report, including:
- done, partial or not started per item;
- Needs Wadood;
- the captures I should look at (suspects, UI, reconstruction, endings, objection);
- costs.
```

## Run 5: recover and finish (Wed Nov 4, historical)

Run 4 stalled after about 70 minutes: a computer-use approval hung for 10 hours. Run 5 forbids those tools (AGENTS rule 15), may use the 30,000 ElevenLabs credits Wadood added on Nov 4, and puts the Lens wiring of voices and the art lane first.

Before pasting: restart Lens Studio, open RoomScriptF and sign in; `cd <project>`; run `codex --approve-for-me`.

```
Continue the Roomscript build: this is Run 5. Lens Studio was just restarted, it is open on this project, and I'm signed in. You're running in Codex: follow §1b of docs/FIRST_PASS.md.

Read AGENTS.md (new rule 15), docs/PROGRESS.md, Run 4's final report, and docs/REVIEW_2026-11-03.md. All of Run 4's decisions still apply: private GitHub repo, MIT, design brief by you, real history, feature freeze Sat Nov 7 at 21:00 PKT.

**What went wrong in Run 4:** a computer-use window-activation call hung for about 10 hours, so only about 70 minutes of real work happened. Rule 15 now forbids those tools.
- Do NOT use computer-use, desktop screenshots, window activation or any UI automation.
- Use only the Lens Studio MCP tools, the shell and file edits.
- Give every shell command and LEAF batch a timeout of 10 minutes or less.
- If anything needs my approval or a GUI action, skip it, record it under Needs Wadood, and move on.
- Never let one blocked step stop the other lanes.

**ElevenLabs: I added 30,000 new credits, and you can use them freely.** Record a new ledger segment that starts now, and stop when the provider returns a quota error.
- Spend them in this order: my voice swaps below (re-render only the swapped characters); then any missing hero-path takes; then the remaining mood and tell takes; then extra effects or music that the new moments need.
- Still re-encode locally with ffmpeg to fit the size budget.
- Claude calls are allowed only if truly needed, under $3, and recorded.

**Parallelism stays limited** (memory): at most 2 subagents alongside the main Lens session, one Chromium at a time, and no full test suite during art renders or LEAF.

Priorities, in order:

1. **Preserve and verify the uncommitted Run 4 Lens work.**
   - Recompile and run targeted LEAF.
   - Commit only what passes. Revert or park what's broken in a branch; never lose it.
   - Rule 14 still applies: don't commit the scene until voices are wired (step 2).

2. **Make the suspects speak:** V4 Lens-side wiring.
   - Wire the existing voice library (Assets/Audio/Voice, Dialogue, Music, Sfx) through RoomscriptVoiceLibrary, the S3 mixer and the director/bank selection, so Stage mode and the hero route play real voices, mood and tell takes, the narrator, Wren, the set-piece dialogues, the score with its composure tension layer, and the sound effects.
   - **Size:** Assets/Audio is 16 MB. Re-encode locally with ffmpeg to fit the A9 budget (voices about 40 kbps mono, music 64–96 kbps), and drop unused takes. Record the build size.
   - **Acceptance:** strict Stage-mode LEAF with audio on every hero-path line; the jaw moves; no subtitle-only fallback on the hero path.

3. **S2 frame time:** the probe measured 29.7 ms against an 8 ms target. Profile it (per-frame copies, listeners, text rebuilds) and fix it.

4. **Art lane, which never ran in Run 4. This is my top visual priority** (start it as a subagent immediately):
   - A1: production pipeline in Tooling/art, with contract tests.
   - A2: Art direction v2 (luminous line art, a distinct silhouette per suspect, expressive poses, the Harlow ghost, GLB props, Polaroid cards, icons, hero words, fonts, reconstruction and blackout sprites, video motion graphics). Review your own contact sheets until each suspect is distinct and striking at thumbnail size, and save before/after sheets in docs/captures/.
   - Then A3: wire the art through VirtualScene.

5. **UI and case clarity in Lens:**
   - A4 stage manager and card system (one panel at a time, design-03 palette) and A5 typography;
   - the opening case card;
   - the "What we know" timeline strip;
   - the SAID/PROVEN slips;
   - the voiced ending summary.

6. **The moments:** B2 reconstruction (T1, then T2), B1 beats (letter, voicemail, Pike's flight, blackout/UV), B3 ending (correct, wrong, timeout). Then A6 hero VFX and A7 UX simplification, with the naive-player LEAF route.

7. **Lane E, publication** (subagent when a slot is free): README, LICENSE (MIT), NOTICE (ElevenLabs/AI-voice disclosure, all third-party assets), devpost/README.md, devpost/design-brief.md, the rewritten clad-log (keep the raw log), the PROGRESS submission-state block, path redaction, the lens rename. Also fix the mangled apostrophes ("?s") in Assets/Scripts/Content/STORY.md.

8. **Y1 Case Compiler page and the Y2 labelled live-AI beat;** then A8 camera rig (20-minute spike), A9, B2 T3.

9. **V3 recall** (70.6% holdout false rejection): keep the attack rate at zero. Route mapped questions through the director and banks, so free-text validation is rarely needed. Don't loosen safety to hit the number.

10. **Final gate:**
    - restart Lens Studio;
    - run the full integrated LEAF (hero-demo, interrogation, all-tells, closing correct/wrong/timeout, naive-player route);
    - capture every beat in Director mode into docs/captures/;
    - record a hero performance tape with bundled audio;
    - assess and tag m3-case.

Commit after every verified package and push to the private remote. Keep PROGRESS (reconcile it with Run 4's real state first), decisions.md and devpost/clad-log.md current.

Finish with the FIRST_PASS §4 final report, including:
- done, partial or not started per package;
- Needs Wadood;
- the captures and contact sheets I should look at;
- costs.

My voice picks (from the casting page):
- **Swap Vale to take 1** (preview S2-1, generatedVoiceId Ajczv1caVKcFEG1TdJH0, replacing take 2).
  - Create or save that designed voice as needed, update Tooling/audio/cast.json, and re-render only Vale's lines: performances, mood and tell takes, and her parts in the dialogue scenes (opening exchange, arrival, confession).
  - Do this first, from the new credits.
- **Keep everyone else:** Imran take 1, Okafor take 1, Pike take 1, Harlow take 1, Wren take 2, Narrator take 3.
```

## Run 3 (historical, from the 2026-10-29 review)


Before pasting:
1. Make sure the C7/D1 checkpoint is committed. If it isn't, the prompt has Codex commit first.
2. **Optional, takes about 10 s:** drag `Assets/Actor/RoomscriptShatter.graphVfx` from the Asset Browser onto the `RoomscriptObjection` object. If you skip this, Codex builds the shatter in code.
3. Open Lens Studio on this project and sign in.

Then start Codex in this folder (`codex --approve-for-me`) and paste:

```
Continue the Roomscript build. Lens Studio is open on this project and I'm signed in. You're running in Codex: follow §1b of docs/FIRST_PASS.md for how CLAD's skills and agents work here.

Read AGENTS.md (including the new rules 11 and 12), docs/PROGRESS.md, then docs/REVIEW_2026-10-29.md. The review's fix list and resume order are this run's plan. The full reports are in docs/reviews/2026-10-29-*.md.

1. If git status shows uncommitted C7/D1 work, blank the gateway tokens and commit it first as a checkpoint (no milestone tag).
2. Fix the review's P0 list, each with a regression test:
   - scoring N1 (a guess must not score 3/3; rethink the starting-envelope oracle);
   - exact argument claims N5;
   - the two A4 test holes;
   - statement evidence in the wallet, with a test that every hero breaker is presentable in Lens.
3. Finish C7:
   - Shatter: if a RoomscriptShatter VFX object already exists in the scene (I placed it), wire it through an @input and keep it disabled until the objection. Otherwise build the code-shard fallback (about 30 MeshBuilder shards, CPU-animated, lightMaterial). Do not use AssetManager.instantiate.
   - Add the objection polish from the review.
   - Tag m2-slice once LEAF passes.
4. Then, in order:
   - L2: the other three suspects as visible, selectable actors;
   - L3: cards anchored away from the speaker's face, plus readable text sizes;
   - D3: accusation, simplified reenactment and ending, including the final accusation at timeout;
   - D2: the opening;
   - L4/L5: a place-the-case step, fixture markers, ray-based drops;
   - the AI P1 items: the validator paraphrase guard and false-rejection check, the deflection lock, the A7 continuation deadline;
   - D6/D7 and a hero tape for an offline demo.
5. Validator red-teaming: build a small Node harness in Tooling/ that uses ANTHROPIC_API_KEY from Tooling/.env to generate adversarial and natural lines. Use claude-opus-5-5 (via @anthropic-ai/sdk) to write adversarial lines and to judge false rejections, and claude-haiku-5-5 for bulk natural in-character answers, as a stand-in for a small, fast production model. Use the exact IDs, no date suffixes. Opus 5.5 can't turn thinking off, so set effort explicitly. Report bypass and false-rejection rates, plus the total API cost. Add an sk-ant-/sk-/AIza pattern to the secret guard first.

Work autonomously and follow rule 12: never idle on a blocker. Record it under Needs Wadood, then take the fallback or the next package.
- Commit after every verified package.
- Keep PROGRESS (fix its stale stage table), decisions.md and devpost/clad-log.md current.
- Target: the whole hero case playable in Preview by Sun Nov 1.

When you finish or run out of road, give the FIRST_PASS §4 final report, including the guided Preview tour and the Needs Wadood list.
```

## First pass (historical)

Paste this into a fresh Claude Code session started in this folder, with Lens Studio open on this project and you signed in.

```
You're starting the first build run for Roomscript in this Lens Studio project. Lens Studio is open on this project and I'm signed in.

Read AGENTS.md, then docs/FIRST_PASS.md, and follow it end to end:
- Preflight first: /lens-studio-router with mode preflight_only, then /specs-project-init.
- Then work through Stages A to F in docs/plan/IMPLEMENTATION_PLAN.md, in order.

I want a massive portion of the project done in this pass, so keep going stage after stage without waiting for me:
- Use parallel subagents for engine work, and CLAD skills and agents for all Lens work.
- Verify each work package (vitest, See-and-fix captures, LEAF).
- Commit after each work package.
- Keep docs/PROGRESS.md, docs/decisions.md and devpost/clad-log.md current.

Only stop for the items under "Needs Wadood" in FIRST_PASS.md. Make every other call yourself and record it.

When you finish, or are truly blocked, give me the final report described in FIRST_PASS.md §4, including a 10-minute guided tour of what to try in Preview.
```

**In Codex**, add this line after the first paragraph: `You're running in Codex: follow §1b of FIRST_PASS.md for how CLAD's skills and agents work here.`

For later runs, replace the first line with "Continue the Roomscript build" and add: "Read docs/PROGRESS.md first and pick up from the next unfinished work package."
