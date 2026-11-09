# Harlow in your room — November 10

Built on `room-mapped-harlow` from master `913d699`. Preview's ending offers **Play Harlow in this room** alongside **Replay Harlow**. The new route captures the current Preview camera, detects room objects through the existing local Claude Opus bridge, measures World Query hits, requests placements, checks them, and restarts the authored Harlow case.

The model selects only four zone anchors and six evidence surfaces. A pure validator rejects missing/duplicate/unknown slots, invented points, crowded anchors, unsuitable surfaces, blocked guest footprints, overlapping guests, and long or suspect/weapon-naming casting lines. The engine verifies the mapped graph again. Vale / Study / charger cable, testimony, evidence, lies, recorded performances, and fictional room names remain unchanged. Four brief, silent toasts introduce the zones.

Suspect staging, chalk and replay positions retain their authored offsets. The existing Conservatory follows the Kitchen's translation, preserving the authored fifth area without adding a model-controlled slot. Other props use deterministic surface support; they are not real-object bindings.

## Running locally

Once per Lens Studio session, run the Lens MCP `ExecuteEditorCode` tool with `path` pointing to `Tooling/room-bridge/install-editor-handoff.ts` in this project. Then, from the project root, run `node Tooling/room-bridge/server.mjs --watch-cast`. Frame the room with some floor visible before choosing the ending action. The bridge loads its provider key only from `Tooling/.env`; the Lens contains no key. The bounded bridge session lasts just under ten minutes. Camera frames, requests, raw replies and costs are retained under `Tooling/results/room-cast/` and the existing Claude ledger.

The transport is a local log/file handoff delivered through Preview's editor message API. It uses no public relay and makes no HTTP calls to Lens Studio. After setup, the ending action completes without intermediate refreshes. A missing bridge/helper, insufficient scan, rejected placement or timeout replays the authored layout and logs the reason. On Spectacles the mapping action is hidden; Replay Harlow remains available.

## Verification

- Pure validator/layout tests: 8 passed, including a good reply, missing slot, unknown ID and weapon-naming line; case truth, exact hit heights and authored offsets are checked.
- Full existing suite plus new tests: 676 passed across 90 files. All three bridge transport tests passed, including restart ordering.
- Lens compilation and startup: passed after the new scripts were imported.
- Initial end-to-end ending action and mapped replay: passed automatically at 02:00 PKT, with unchanged envelope and zero binding errors. Visual inspection then failed: guests overlapped furniture.
- The strengthened final placement checks reject the tested scans with insufficient_measured_surfaces or unsupported_guest_offset and safely replay the authored case. No visually accepted final remap has been established.
- Normal naive-player acceptance: passed at 02:24 PKT; 25 actions, correct verdict, exact replay, and no caption mismatches, overlapping speech or early endings.
- Captures: [initial mapped room](captures/room-mapped-harlow-live.png), [raised-surface attempt](captures/room-mapped-harlow-after.png), and [scan view](captures/room-mapped-harlow-scan-view.png). These document the failed visual review, not a passing final layout.

TypeScript and JSON asset handoffs did not update the running Preview reliably. An attempted packaged editor plugin stalled Lens imports and was removed; the shipped setup uses the small retained editor timer instead. An initial level camera view contained no floor and correctly rejected the mapping. Testing also exposed a destroyed controls-hint reference when replaying in film mode; it was fixed and given a Lens regression check. Three editor restarts were used; the latter two required the previously authorized forced close after two graceful attempts each failed. No GUI automation or direct Lens HTTP workaround was used.

Visual review of the first accepted scan exposed guest overlap and low floor-noise points selected as surfaces. The final checker requires 90 cm guest separation, measured clear footprints at their unchanged offsets, and evidence tops at least 25 cm above the floor. A later narrow scan correctly fell back with zones_too_close. Before images are retained alongside the final capture.

The final scan (roomcast-1794259157445) found 15 floor points and 18 raised surfaces, with four eligible Hall anchors but no eligible Kitchen anchor for its two fixed guest offsets. Missing depth coverage is rejected rather than guessed. The remaining work is to obtain sufficient floor coverage while keeping those authored offsets. The bridge restart race (an old cast overwriting a newer detection) was also fixed and regression-tested.

## Final acceptance - 02:28 PKT

The 25 cm scan grid resolved the missing-anchor problem: 67 floor points and 26 raised surfaces, with valid placements for both guest groups. Final live run `roomcast-1794259647968` passed scan, Claude cast, pure checks, restart, four toasts, binding audit and unchanged envelope (`S2 / Z1 / O1`). The model response allowance is 3,600 tokens; raw responses are saved before parsing so malformed replies remain diagnosable. The previous cast error was not diagnosed conclusively.

Final captures were inspected: [mapped room](captures/room-mapped-harlow-final.png) and [side view](captures/room-mapped-harlow-final-side.png). Guests retain their measured floor positions and props use raised surfaces. The illustrated guests can occlude one another along a sight line; moving the Preview camera changes that view, as with the authored staging. Earlier failed captures and fallbacks above are retained as development evidence.

All requested gates passed before 02:30 PKT: 676 Vitest tests, 3 bridge tests, clean Lens compile/startup, initial ending-button integration, final live mapped replay and capture, and the unchanged naive-player playthrough (25 actions, correct verdict, exact replay, 2,328 caption samples, zero mismatches/overlaps/early endings). README updated for the Preview-only availability. No new voice lines or case truth. Existing local Scene.scene changes are excluded from commits.