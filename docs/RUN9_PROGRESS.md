# Run 9 — illustrated cast, real props, polish (Claude Code)

Running log and memory across context compaction. Newest checkpoint at the bottom. Specs: [ART_2D_2026-11-07.md](ART_2D_2026-11-07.md) (art), [WEARER_UX_2026-11-06.md](WEARER_UX_2026-11-06.md) (interaction), [REVIEW_2026-11-06-run8.md](REVIEW_2026-11-06-run8.md) (fix list).

- Agent: Claude Code (Opus 5.5), CLAD plugin `ls-clad` 1.0.0.
- Started: Sat Nov 7, 01:40 PKT. Feature freeze: Sun Nov 8, 21:00 PKT.
- Lens Studio process started 00:55:20 PKT (Wadood's restart). Preflight via `/lens-studio-router` (preflight): project `RoomScriptF.esproj` loaded, signed in, MCP up.
- The Preview panel was closed in this workspace: reopened with `Editor.Dock.IDockManager.createPanel` (Editor API, no GUI tools). The Preview input was the Sunlit Room; switched back to the Interactive **Evening Room**.
- Git: started on `master` at `71780b2`.

## Split of work

- **Art subagent** (background): image generation, cutouts, normalisation, anchors and contact sheets, only in `Tooling/art2d/`, the OpenAI ledger and `docs/captures/2026-11-07-run9-contact-*.png`. It writes `Tooling/art2d/out/<NAME>_READY.md` per character and keeps `Tooling/art2d/LOG.md`.
- **Main session:** every Lens scene change, code fix, LEAF run, capture and commit.
- **Lock file:** the main session creates `Tooling/art2d/LEAF_RUNNING` during LEAF runs and captures; the art subagent doesn't start a local model or Chromium while it exists.

## Checkpoints

### 01:50 PKT — git hygiene (item 0.11)
- `5869b6b`: the reviewed scene change (LEAF bridge removed) and the `RoomscriptEngravedLight.mat` shader fix, the Nov 7 art docs, the Run 8 review, the AGENTS.md changes and the Run 9 prompt, `run8-props-console-v1.png`; gitignore `Tooling/staging/`, `Tooling/results/run7-native-video/`, `Tooling/results/run7-preview-settings/`.
- `d106528`: archived the Run 7 helper scripts and seed logs (they were untracked). Pushed.

### 02:45 PKT — Run 8 review fixes 1–9 (`df729ac`)
- Baseline handshake: strict interrogation LEAF PASS over MCP at 01:44.
- Fixes 1–9 done (details in decisions.md). LEAF strict, MCP-launched: run9-cancel-pull PASS 48.9 s, run8-dust PASS 72.0 s, clue PASS 19.4 s (first pass since Run 7), closing correct PASS 42.6 s, closing wrong PASS 48.1 s. vitest: present-evidence and board tests pass.
- Restart 1 of 3 at 02:35:45 (degraded Preview, <1 GB free RAM). The MCP LEAF call often times out client-side while the plugin keeps running: read results with `node Tooling/scripts/wait-leaf-log.mjs <id> <maxSec> <sinceHH:MM:SS>`.
- Art subagent: Vale, Pike and Harlow complete by 02:34 (Vale contact sheet: `docs/captures/2026-11-07-run9-contact-vale.png`, all frames the same person); Qadir and Okafor in progress. Cost ~$2 so far.
- Not yet: fix 10 (export size), the scene file (only plugin bridge changes, uncommitted).
- Next: ActorArt anchors + illustrated actor (Vale first), captures at 1.4 m / 3 m / 45°.

### 03:22 PKT — illustrated cast in the room (`4f90386`, then this commit)
- All five characters imported (`Tooling/scripts/sync-cast-art.mjs` → `Assets/Art/Cast`, `Content/ActorArt.ts`, `RoomscriptCastTextures.ts`). Art subagent done: $3.78, 3.84 MB, no fallback.
- Vale at 1.4 m / 3 m / 45°: `docs/captures/2026-11-07-run9-vale-1p4m-v1.png`, `-vale-3m-v1`, `-vale-45deg-v1`. Face sharp, on the floor. Cast line-up `docs/captures/2026-11-07-run9-cast-lineup.png`; contact sheets `-contact-<name>.png`.
- Ghosts use the same art (`RoomscriptGhostArt.ts`); the 12 ghost PNGs are deleted. The reconstruction places ghosts on measured free floor (side edge of ring zones), Vale's tableau frame holds the cable at the freeze, Harlow staggers then lies fallen. Ending: the accused reacts (broken or smug), everyone glides out through the door.
- Frozen murder capture: `docs/captures/2026-11-07-run9-frozen-v3.png` (v1, v2 show the overlap fixes).
- Helpers: `Tooling/scripts/wait-log-marker.mjs <MARKER> <since> <max> [contains]` for Director beats. The first MCP run after a recompile often times out before starting: re-issue it.
- Next: props and paper objects (phase 3), then composition (phase 4).
