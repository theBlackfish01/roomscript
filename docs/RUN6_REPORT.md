# Run 6 report — 2026-11-05

**Partial. Logic proven / feel unproven.** Work is committed and pushed to the private `run5-wip` branch. `master` remains `bfaf5ff`: the replacement-voice hero gate did not complete, so the requested promotion condition was not met. No new milestone or release tag. The pre-existing edit to `docs/KICKOFF_PROMPT.md` is untouched. The saved scene has only regenerated LEAF bridge IDs and is deliberately uncommitted pending Phase A2.

## Requested items

| Item | State | Result and remaining work |
|---|---|---|
| 1. Vale swap | Done offline; listening review pending | S2-1 saved and selected. Replaced all 134 runtime Vale sources and her arrival, confession, escape and voicemail reply. OpeningExchange has no Vale and stays unchanged. Other speakers retained. Compressed export: 878 entries, 552 voice tracks, 9,954,375 audio bytes; verifier clean. |
| 2. In-game voices / master | Partial | Strict compressed four-cast playback passed after restart with new Vale. Earlier-cast hero passed in 171.752 s. New-cast hero failed in MCP registration before running; no scene commit or promotion. |
| 3. S2 frame time | Partial, unresolved | Immutable shared snapshot checks pass. Polish scenario fails clock `isPlaying()` before reaching its frame probe. MP3 decodes correctly; changing assertion timing did not resolve it and was reverted. No new frame number or <8 ms claim; historical 29.7 ms remains the last measurement. |
| 4. Audio wiring / E6 / E2 | Partial | Timestamp-based word reveal implemented and compiled; four pure tests and bundled playback pass. Ten tests cover a new pure narration selector, exact shipped lines, deferred motive gate, tension and endings. Selector remains unwired. 40 more optional Vale mood takes preserved outside runtime; remaining coverage pending. |
| 5. Art / A3 | Partial | Thick bright ivory strokes, halo, larger faces, stronger posture/head/expression contrast complete offline. 27 contracts and 98/98 repeat hashes pass. All four room composites reviewed. Actors/cards/props/ghosts are not newly wired; residency/compression and 20 Preview pose captures pending. |
| 6. UI / fonts | Partial | Anton and Courier Prime with OFL licenses imported as files; cards/contact sheets use Courier Prime. Existing case card/timeline/slips retained. New panel-by-panel runtime styling, angular sizing and captures pending. |
| 7. Moments / reconstruction / endings | Partial | Existing engine/reconstruction retained; pure voiced-cue and distinct-ending guards prepared. New ghost renderer, time dial, slip burn, ledger presentation and voiced stage beats not wired. |
| 8. VFX / UX ≤40 clicks | Not started this run | Existing prototype effects remain. No new VFX pass or naive-player gate. |
| 9. Final gate / tape / rename | Partial | Earlier-cast bundled hero tape harvested and replay checked, explicitly labelled as earlier-cast evidence. No final integrated suite, Director captures, m3-case or Lens rename. |
| 10. Y2 live-AI exchange | Not started | No fresh token generation or new live exchange. |
| 11. Y1 crate compiler | Not started in Lens | Prior engine compiler retained; three-case page pending. |
| 12. Camera / T3 | Not started | No camera spike or turntable. |
| 13. Export / size | Not started export | Audio 9.95 MB; art sources 5.96 MB plus fonts 0.324 MB. These are not an exported Lens measurement or a <18 MB claim. |
| 14. V3 recall | Done, pure engine | Holdout false rejection 70.6% → 58.8%; development 46.4% → 39.1%. Attacks remain 0/96 and 0/48 accepted; all 169 judged-disallowed samples rejected. No API cost. Final Lens compile pending. |
| 15. Publication | Partial | Updated NOTICE/fonts/AI voice disclosure, README with GIF slot and build explanation, Devpost copy, submission state and history scan. Video, final captures, music-plan/rules checks and public release remain pending. |

Historical stages A/B/C retain `m0-probe`, `m1-terminal`, `m2-slice`. D/E are partial. F/Clue Night stays deferred. Feature freeze remains **Sat Nov 7, 21:00 PKT**; this run ended before freeze, so unfinished authorized features remain in the active plan. At freeze, move remaining features to later.md and allow fixes only.

## Verification and decisions

- Full pure suite: **462/462 tests across 49 files**, exit 0, 89.20 s, one worker after art and LEAF stopped. Engine/Content/Tooling typecheck passed. Lens components were compiled only through MCP.
- Audio: **11/11 pipeline contracts**, clean staged/published manifest verification. Art: **27/27 contracts**, **98/98 deterministic hashes**. Pure narration: **10/10**; subtitle timing: **4/4**; validator focused: **55/55** (included in full suite where applicable).
- Lens 5.23.2.26081320, correct project and sign-in confirmed. Initial registration handshake **0.483 s**; refreshed runtime logging began at 29 ms. New process started **14:23:35 PKT**, followed by import settle, successful compilation and refresh (25 ms first activity).
- LEAF strict policy is `fail-fast`, not `strict`. The initial typo defaulted to fallback; corrected runs supplied fail-fast. New-cast bundled check passed in **11.975 s**: four lines, jaw peak **0.8**, same-frame start measurement 0 ms, zero network calls/fallbacks.
- Hero readiness repair waits up to one second for the real UIKit control after panel enabling; it never substitutes direct callbacks. Earlier-cast hero passed **171.752 s**, correct verdict/four deductions and exact replay. Tape: `Tooling/results/run6-hero-earlier-cast.json`; sanitized log: `Tooling/results/run6-lens-verification.log`.
- After restart, the new-cast hero tool returned **`Tool execution failed: Failed to get scenario list after 600 attempts`**, before dispatch. AGENTS requires stopping Lens tools after failure, so no raw HTTP, GUI, retries or silent success claim followed. A worker's final pure engine edit at 14:25:54 preceded this gate; automatic import may have overlapped registration. That is a possible contributor, not a diagnosed cause.
- The new narration gate rejects confession for wrong/timeout verdicts and requires engine-admitted motive for Harlow's voicemail. **The existing RoomscriptAudio still needs this guard integrated**; the new selector is not connected. See `Tooling/audio/RUN6-WIRING.md`.
- V3 saved corpus hashes and limits: [recall report](RUN6_VALIDATOR_RECALL.md). The holdout was inspected during repair and is regression evidence, not a new unseen test.
- Full reachable-history text scan: **925 blobs, zero findings** at the code checkpoint; current-file text scan also clean. Pre-commit secret hook stayed enabled. These are scoped text scans, not a claim about arbitrary binary steganography.
- Removed the 18 unused duplicate `Tooling/art/web` and `Tooling/art/specs` files with authorized `git rm`. Retained `prototype/` and real history. Git writes, GitHub/LFS and ElevenLabs worked through normal escalations; no GUI tools used.

## Needs Wadood

1. Restore/restart the LEAF bridge, then resume a clean gate with asset writes paused: strict bundle and repaired hero on the replacement library. Once both pass, save/commit scene, fast-forward `master`, push it and continue there. The earlier-cast success cannot replace this gate.
2. Listen to the selected cast and Harlow voicemail splice. Forced alignment permission is absent; the splice uses the midpoint of a detected silence at 1.0599565 s, retaining Harlow's original recording. It is not word alignment.
3. Review Devpost rules/form and the actual Eleven Music subscription eligibility. Final video, public release and submission remain owner work.
4. Physical Specs-only comfort, additive brightness, spatial audio, hand/ray drops, keyboard and ASR remain unverified.

Automatic approval review initially rejected uploading the generated voicemail for forced alignment as potentially sensitive. A provenance-backed retry was approved; ElevenLabs returned `401 missing_permissions`. The documented offline splice completed the dependency without an upload. No approval is pending.

## Captures to review

- **Suspects:** [all 20 poses](captures/2026-11-05-art-after-poses.png), then [Vale](captures/2026-11-05-art-room-Vale.png), [Qadir](captures/2026-11-05-art-room-Qadir.png), [Okafor](captures/2026-11-05-art-room-Okafor.png), [Pike](captures/2026-11-05-art-room-Pike.png). These are new **offline composites over a historical Preview room**, not newly wired Lens captures.
- **UI:** [historical cards](captures/2026-10-29-l3-cards.png). No Run 6 UI acceptance capture.
- **Reconstruction:** [historical ghost prototype](captures/2026-10-29-d1ghost.jpg). No new reconstruction capture.
- **Endings:** [historical ending](captures/2026-10-30-d3-ending.png), [timeout](captures/2026-10-30-d7-timeout.png).
- **Objection:** [historical slam](captures/2026-10-29-c7slam.jpg), [shards](captures/2026-10-29-c7-shards.png). No Run 6 VFX capture.

## Ten-minute diagnostic tour after bridge recovery

1. Place the case and pull the tab; confirm all four guests arrive.
2. Select each guest and ask their name; confirm the bundled voices and timed captions, especially new Vale.
3. Ask Vale about 22:30, inspect the kettle, close the memory, then drag her statement onto the kettle evidence to object.
4. Ask Okafor about Harlow, ask Vale her revised 22:30 account, and use Okafor's statement for the next objection.
5. Inspect the remaining proof, make a suggestion and watch the refutation sweep. Open Accuse, choose Vale/Study/cable, file the four deductions and hold the seal.
6. Review the current ending; use the separate closing scenarios for wrong and timeout. Compare the offline art sheets separately until A3 is wired.

This is a diagnostic tour, not final acceptance of the present snapshot. Next run should first restore the Phase A2 gate, then diagnose the clock probe and measure S2, wire the tested narration guard/queue, and prioritize A3/A4 visual work before the remaining moments and final gate.

## Costs

**Run 6 ElevenLabs: 4,900 header-confirmed credits**, including 40 optional unshipped takes; no unresolved reservations or quota error. **Claude: $0** (under $3). Art/fonts/corpus rescoring: $0. The new Run 6 ledger segment shares the existing 30,000-credit top-up; it does not create another allowance. Dollar billing was not inferred from credit counts.
