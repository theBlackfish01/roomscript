# Harlow in your room — November 10

Built on `room-mapped-harlow` from master `913d699`. Preview's ending offers **Play Harlow in this room** alongside **Replay Harlow**. The new route captures the current Preview camera, detects room objects through the existing local Claude Opus bridge, measures World Query hits, requests placements, checks them, and restarts the authored Harlow case.

The model selects only four zone anchors and six evidence surfaces. A pure validator rejects missing/duplicate/unknown slots, invented points, crowded anchors, unsuitable surfaces, and long or suspect/weapon-naming casting lines. The engine verifies the mapped graph again. Vale / Study / charger cable, testimony, evidence, lies, recorded performances, and fictional room names remain unchanged. Four brief, silent toasts introduce the zones.

Suspect staging, chalk and replay positions retain their authored offsets. The existing Conservatory follows the Kitchen's translation, preserving the authored fifth area without adding a model-controlled slot. Other props use deterministic surface support; they are not real-object bindings.

## Running locally

Once per Lens Studio session, run the Lens MCP `ExecuteEditorCode` tool with `path` pointing to `Tooling/room-bridge/install-editor-handoff.ts` in this project. Then, from the project root, run `node Tooling/room-bridge/server.mjs --watch-cast`. Frame the room with some floor visible before choosing the ending action. The bridge loads its provider key only from `Tooling/.env`; the Lens contains no key. The bounded bridge session lasts just under ten minutes. Camera frames, requests, raw replies and costs are retained under `Tooling/results/room-cast/` and the existing Claude ledger.

The transport is a local log/file handoff delivered through Preview's editor message API. It uses no public relay and makes no HTTP calls to Lens Studio. After setup, the ending action completes without intermediate refreshes. A missing bridge/helper, insufficient scan, rejected placement or timeout replays the authored layout and logs the reason. On Spectacles the mapping action is hidden; Replay Harlow remains available.

## Verification

- Pure validator/layout tests: 7 passed, including a good reply, missing slot, unknown ID and weapon-naming line; case truth, exact hit heights and authored offsets are checked.
- Full existing suite plus new tests: 675 passed across 90 files. Both bridge frame-transport tests also passed.
- Lens compilation and startup: passed after the new scripts were imported.
- Live mapping and naive-player acceptance: verification in progress.
- Capture: pending the completed live mapping.

TypeScript and JSON asset handoffs did not update the running Preview reliably. An attempted packaged editor plugin stalled Lens imports and was removed; the shipped setup uses the small retained editor timer instead. An initial level camera view contained no floor and correctly rejected the mapping. Testing also exposed a destroyed controls-hint reference when replaying in film mode; it was fixed and given a Lens regression check. Three editor restarts were used; the latter two required the previously authorized forced close after two graceful attempts each failed. No GUI automation or direct Lens HTTP workaround was used.
