# Kickoff prompts

## Run 4: the big final-polish run (Tue Nov 3, overnight)

Before pasting:
1. **Restart Lens Studio**, open RoomScriptF, and sign in. A fresh process matters: long sessions caused the Preview timeouts.
2. `Tooling/.env` already holds `ANTHROPIC_API_KEY` and `ELEVENLABS_API_KEY`; both were tested on Nov 3.
3. In a terminal, `cd C:\Users\wadoo\Desktop\SPECS_Hackathon\RoomScriptF` and run `codex --approve-for-me`.

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

## Run 5: your notes plus finishing (Wed Nov 4)

Paste after your playthrough, adding your voice picks and notes:

```
Continue the Roomscript build: this is Run 5, my notes plus finishing. Lens Studio was just restarted and I'm signed in. Read AGENTS.md, docs/PROGRESS.md (Run 4's final report) and docs/REVIEW_2026-11-03.md. All of Run 4's decisions still apply.

1. Apply my voice-casting picks below. Re-render only the swapped characters; the cache should keep the rest.
2. Fix everything in my playthrough notes below.
3. Finish whatever Run 4 left partial or not started, in Run 4's lane order.
4. Then:
   - restart Lens Studio;
   - run the full integrated LEAF;
   - recapture every beat in Director mode.

The ElevenLabs ledger cap (150,000 credits) still applies. The feature freeze is Sat Nov 7 at 21:00 PKT.

My voice picks:
<paste here>

My notes:
<paste here>
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
