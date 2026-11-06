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
