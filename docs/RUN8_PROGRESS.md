# Run 8 — wearer experience, object UI, AR wow moments (Claude Code)

Running log and memory across context compaction. Newest checkpoint at the bottom. The spec is [WEARER_UX_2026-11-06.md](WEARER_UX_2026-11-06.md).

- Agent: Claude Code (Opus 5.5), CLAD plugin `ls-clad` 1.0.0.
- Started: Fri Nov 6, 15:06 PKT. Feature freeze: Sun Nov 8, 21:00 PKT.
- Lens Studio 5.23.2, process started 15:01:32 PKT (Wadood's restart). Preflight via `/lens-studio-router` (preflight): project `RoomScriptF.esproj` loaded, signed in, MCP up. Preview: SPECS 27, Interactive Evening Room.
- Git: started on `master` at `e566196`. `safe.directory` was added for this repo because `.git` is owned by the Codex sandbox user.

## Plan (my calls; see decisions.md)

1. Baseline: strict interrogation LEAF, handshake, hide LEAF banners in film mode.
2. Staging: suspects on free floor, conversation spot 1.3–1.5 m, one UI per direction, subtitle under the face.
3. Object UI, in this order: opening case files → crate placement → glyph tokens and presenting evidence → palm notebook → wall case board → accusation → feedback at the action → line-style props and crate → chalk zone circles → ending → naive-player LEAF.
4. Wow moments: doorway tape, floor chalk outline, window rain/lightning/ghost, object replay, evidence web, frozen murder + orbit, UV flashlight, spatial cues, newspaper, fingerprint dusting.
5. Carry-overs, video/Devpost, final gate.

## Room survey (Evening Room, world cm)

- Floor y = −176. Default Preview eye at (0,0,0), so the eye height is 176 cm.
- Back wall (−Z) with the media console (top y ≈ −141, z ≈ −447) and two large framed prints.
- Coffee table top y ≈ −145, centre (11, −314). The sofa is around z = −196.
- Window with curtains to the right (+X).

## Checkpoints

### 15:06 PKT — start
- Read the spec, judges' notes, Run 7 report and PROGRESS. Captured the Run 7 opening as the "before" image: `docs/captures/2026-11-06-run8-before-opening.png` (a text panel with Preset / Cast my room buttons over a plain orange box crate).

### 15:40 PKT — baseline, staging, glyph tokens (`23ef296`)
- Strict interrogation LEAF PASS 16.781 s over the MCP transport (handshake: scenarios registered 15:03:01). After the token rewrite: PASS 31.646 s.
- Room survey done (see the decisions entry). Suspects are on free floor with authored conversation spots; glyph tokens beside the shoulder; one-line subtitle under the face; name tags at knee height; LEAF overlays hidden in film mode.
- Captures: `docs/captures/2026-11-06-run8-vale-question-v2.png`, `...-vale-answer-v3.png`.

### 16:05 PKT — opening case files, engraved crate, audio and engine modules (`c6dc120`)
- Opening: two case files on the crate (THE HARLOW TRUST with wax seal; CAST THIS ROOM with magnifier). Lift or pinch to pull a file open. The Preset file keeps the LEAF name `RoomscriptPullTab`. Strict opening LEAF PASS 77.7 s, after a fix: reveal beats now catch up when native audio stalls a frame.
- Engraved-light crate (line tubes; the lid outline rides the hinge) and the `RoomscriptEngravedLight` rim shader/material for GLB props (not yet applied).
- Audio worker: 38 new clips for 735 ElevenLabs credits (`Tooling/audio/RUN8-AUDIO.md`); registered as cues via `RoomscriptRun8CueAssets.ts`.
- Engine worker: EvidenceWeb, ObjectReplay, MorningEdition, FrozenTableau, Fingerprints, CaseBoardLayout, plus 28 tests (`Tooling/tests/game/RUN8-ENGINE.md`). Truth rules: convergence and tableau only after a verdict; the paper never names the true culprit on a wrong or timeout verdict; testimony threads only for proven or cited statements.
- Capture: `docs/captures/2026-11-06-run8-casefiles-v1.png`.

### 18:05 PKT — object UI pass complete (`d668646`…`8ca555e`)
- Props are engraved line drawings. The Run 7 GLB props had no normals and never rendered.
- Evening-v3 layout: the latch sits on the real door and the glass on the window. Plausible Dynamic casting (no speaker weapons); virtual Dynamic props rest on real tops.
- Chalk zone circles sit on measured free floor (Kitchen rings the table). Wren and the narrator get a head-locked line low in view.
- Palm notebook: left palm up shows the glyphs; the Preview fallback sits on the crate lid; the credibility lens cracks.
- Case board on the left wall (z=-172): portraits, rooms, weapons, memory photos that fly to their pins, red string, crosses, FILED and CASE CLOSED stamps.
- Presenting evidence: hold a pulled memory photo up to a suspect to ask about the object, or point at another guest. Strict `roomscript-run8-present` PASS 146.5 s.
- Accusation rig: WHO/WHERE/WITH tokens, a spotlight beam and floor spot, and a wax seal. A hold needs at least 1 s and at least 12 frames; the seal sound plays only after success, because native audio blocks about 1 s.
- Morning Edition newspaper ending, built from engine data.
- **Planned restart 17:39:46 → relaunch 17:39:54 PKT** (the process had degraded: native audio calls took 1.3–2.7 s). Handshake 17:40:58. After the restart the MCP scenario launch stalls again, so I'm using the local-manager runner: strict closing correct PASS 39.6 s.
- Pending: wow moments, naive-player LEAF, the clue fixture (it tests the old refutation card), and recapturing all beats.

### 18:07 PKT — wow moments 1, 3, 4, 6, 7, 9 (`d5bcd68`, `220f13b`)
- Crime scene: rain streaks and lightning on the real window (Preset: right wall, x ≈ 201), LightningCrack then spatial thunder from the window, and Harlow's ghost in the glass during the flash. Flashes come faster in the blackout beat. Crime-scene tape across the real doorway ("DO NOT CROSS · CRIME SCENE"). Chalk body outline on free floor at (22, 0, −405). Captures: `window-storm-v1`, `door-tape-v1`.
- Object replays: a newly collected memory blooms into a 5 s real-scale ghost vignette at the object, built only from `objectReplay()`. "NO ONE" shows only when the memory itself says the place was empty. Capture: `object-replay-v1`.
- Evidence web: coral threads from `evidenceWeb()` between suspects, objects and chalk zones. After the verdict, `convergence()` threads glow gold, pulse to the culprit and end on the wall board. Capture: `evidence-web-v1`.
- Fingerprint dusting: hovering about 1.4 s over a dustable object reveals glowing whorls, then files the memory through the same PinchObject path as a pinch. Strict local-manager `roomscript-run8-dust` PASS 15.1 s.
- UV torch: a violet cone from the left palm (camera fallback) during the blackout; the drag marks show only where the pool lands. Not captured yet.
- Spatial Wren cues: W1 "Over here" from the wall board after 40 s; W13 from the board at the first evidence.
- Director beats added for captures: question, answer, board/web, accuse, explore, storm, replay, ending (and later frozen).

### 18:15 PKT — wow 5: frozen murder at 22:30 (`e6b05a2`)
- Closing reconstruction: at the freeze beat, `frozenTableau()` draws the disturbed objects suspended 18 cm up in slowly turning gold rings, and the culprit's ghost holds the weapon (new "cord" line drawing). The resting copies of those objects are hidden while the freeze is up, so nothing is drawn twice.
- `holdAtBeat(kind, seconds)` pauses the reconstruction when a beat starts. The Director beat `frozen` accuses correctly and holds the freeze (local-manager run: RUN8_DIRECTOR_READY + FROZEN_TABLEAU `{"slot":"22:30","zone":"Z1","suspended":["O9"],"held":["O1"]}`).
- Fix: the head-locked companion subtitle line now hides with the subtitles (a stale opening narrator line was showing through the closing).
- Captures: docs/captures/2026-11-06-run8-frozen-v1.png (before: stale line, doubled mug and cord), -v2, -v3, -frozen-orbit-a.png, -frozen-orbit-b.png.
- Orbit path for the video (MovePreviewCamera, freeze held): setPosition (60,-40,-250) → lookAt (-5,-100,-400); then setPosition (-110,-45,-270) → lookAt (0,-100,-410). Avoid relative `orbit` calls stacking on an unreset pose: they swing the camera through the other ghosts.

### 18:40 PKT — objecting by holding up the proof; naive player PASS (`db6ac10`)
- Objecting is now physical, like asking. Tap the Object glyph, then pull a memory photo from an object and hold it up to the suspect being questioned. The photo shows *which* memory it is (its card art plus the first words of the memory, and "1/3" when an object holds several); each pull brings out the next observed memory in graph order, never ordered by correctness. Releasing the photo away from the suspect puts it back with no penalty. The statement-slip drop still works, and both go through one `objectWith()`, the same engine Object action.
- Naive-player LEAF rewritten for the object flow: open the Harlow Trust file, then Question S2, a whereabouts glyph, Object, the kettle photo held up to Vale, the object tour, the accusation rig, File deductions and the wax seal. **Strict local-manager PASS 99.8 s: 26 actions (limit 40), first answer 26.1 s, verdict correct, 4 deductions filed, 105 in-game minutes.**
- Hygiene restart (rule 13; the old process stalled frames, with tap-to-close taking 14–20 s): saved, graceful close 18:36:40, relaunch 18:36:45, new log 18:36:46. That makes 2 restarts this run, both graceful.
- Scene saved with the LeafIndex runner cleared (scenarioId "").
