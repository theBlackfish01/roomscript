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
