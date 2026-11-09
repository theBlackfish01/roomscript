# Preview model bridge

## Harlow room mapping

Once per Lens Studio session, run `ExecuteEditorCode` through Lens MCP with `path` set to the absolute path of `Tooling/room-bridge/install-editor-handoff.ts`. Then run `node Tooling/room-bridge/server.mjs --watch-cast` from the project root. The ending's **Play Harlow in this room** action captures the current view, measures surfaces, validates Claude Opus's placement proposal, shows four casting toasts and restarts the same authored case. Include floor and furniture in the view. The server session lasts just under ten minutes; restart it for a later demo.

This uses a retained editor timer to deliver local JSON through Preview messages. It does not refresh Preview between stages or expose a public relay. If the bridge/helper is absent or the scan/proposal fails validation, the original layout is replayed. No new case facts or voice lines are generated. Requests, replies and scan images are saved under `Tooling/results/room-cast/`; `live.json` is an ignored, short-lived handoff. See `docs/ROOM_MAPPED_HARLOW.md` for verification and limitations.

## Earlier scan and typed-question tooling

Provider keys are loaded only from `Tooling/.env`. Never copy them into Assets, scene inputs or captures.

The saved Evening Room scan was produced from real Preview CameraModule frames, strict Claude Opus JSON and World Query surface hits. Raw captures, camera poses, model responses and placement evidence live in `Tooling/results/run7-room-scan`. The Preset uses that recorded scan. Dynamic now has separate live-file runtime evidence: strict source=file seeds 7, 1041 and 2026 each reached a correct verdict with exact replay and zero binding errors at checkpoint 338b0db. These gates reused one completed live six-object scan, not three fresh scans. See Tooling/results/run7-file-seed{7,1041,2026}.json.

Lens rejects insecure localhost connections outside Experimental APIs. The working camera path uses a local file handoff: the Lens logs three CameraModule frames, the Tooling watcher sends them directly to Claude, then writes `LiveScanReply.ts`. Preview reloads and resumes the pending scan, projects the original camera rays through World Query, and compiles the detected room. The first automatic handoff found six furniture surfaces and compiled seed 7 as `RS-b1d95b61`. Verdict acceptance subsequently passed for seeds 7, 1041 and 2026 against that completed live input; new visual and final integration gates remain separate. The reload is a Preview development limitation, not seamless device scanning.

Start from the project root:

```
node Tooling/room-bridge/server.mjs --watch
```

The optional `launch.mjs` HTTPS relay has NOT been run: automatic approval review rejected exposing camera images and questions through Cloudflare without explicit approval. Keep `LocalBridgeSession.ts` empty. Do not start this optional path without that approval. The downloaded project-local executable is untracked; its official release SHA256 was verified. An absent watcher times out to the recorded Preset.

The following typed companion requires the optional HTTPS relay and remains unverified and unavailable in the default file-handoff setup:

```
node Tooling/room-bridge/ask.mjs "Where did you go after the study?"
node Tooling/room-bridge/ask.mjs --wren "What do we know?"
```

Input is queued for the Lens adapter; normal Preset chips stay prerecorded. Suspect outputs still pass the existing director/line admission pipeline, and Wren receives only the PlayerKnowledge brief. Every accepted provider response is recorded before performance. The companion is a Preview fallback for the native keyboard, not a claim of spoken device input.

Costs are recorded in `Tooling/results/run7-claude-ledger.json`. Opus5.5 estimates use $4/M input and $20/M output, with a conservative bound also retained; these are token estimates, not invoice totals. The entire Run7 budget is $30. Missing provider/quota stops generation only.
