# Run 10 report — find, ask, catch

The redesigned hero game is implemented and verified in Preview. **Film the run10-loop checkpoint** for the new game; run10-fixes remains the earlier fallback. The remaining acceptance blocker is the actual exported-size measurement: Lens packaging requires a package ID that this project does not yet have. **m3-case is not awarded.** The code checkpoint **639d501** and all three requested tags are pushed.

## Work order

| Item | Status | Result |
| --- | --- | --- |
| 0. Baseline / Run 9 closeout | Done | Preflight, compile and interrogation handshake; ten-line Run 9 summary; leftovers commit d1b2dbc and pushed run9-end; redesign, AGENTS changes and prompt committed. |
| 1. Fixes | Done | One speech arbiter, uninterrupted lines, queued intent, Wren limits, SFX ducking, steady Ask · Show · Accuse row; instructional narration removed. run10-fixes pushed. |
| 2. New loop | Done with a placement fallback | Physical Find, up to four natural questions plus Ask your own…, picture Show, crack/next-layer answer/5-second truth ghost, row-based accusation and one-pinch seal, reaction/frozen murder/newspaper/Another case?; one opening file, voicemail and two narrator lines. |
| 3. Script and voices | Done | 36 documented lines pass wording checks; 26 aligned clips imported; final native-audio and subtitle gates pass. |
| 4. Generated cases | Deferred as authorized | Another case? explains that new cases are being prepared and offers Replay Harlow. The redesigned dynamic evidence compiler is not claimed complete. |
| 5. Captures / size / video plan | Partial | All seven requested views accepted; opening/row before-and-after evidence saved; video plan includes one uncut stretch. Export size remains blocked. |

## Against “Done when”

| Criterion | Status | Evidence |
| --- | --- | --- |
| 1. Solve using item pinches and the row, no drags | Done in LEAF | Final fail-fast naive-player: **25 pinches, 0 drags/holds, correct verdict, 105 engine minutes, 5 pips**, first answer **16.287 seconds**, scenario **131.844 seconds**. Solver uses collected knowledge; the exact 76-action engine log replays. |
| 2. One voice; subtitles match; lines finish | Done in Preview | Final full play: **879 caption samples, 0 mismatches, 0 native overlap frames, 0 narrator/TTS premature ends**; all **34 speech start/end events** recorded. Expanded audio-overlap also passes walking away 800 cm, deferred selection, Ask → Show → Ask, Wren busy-drop and the debt-note take. |
| 3. Stable row | Done | Fail-fast row-stability: **40 boundary alternations, zero visibility toggles**. Audio regression checks the row remains hidden while speaking. |
| 4. Script wording | Done | **36/36** lines pass; **26/26** source clips pass exact text/cast/decode/timing/manifest checks. Six new Wren lines ask questions. |
| 5. Director views | Done | Seven accepted views below. Visual inspection corrected cast placement, Show image depth, paper support/footprints and newspaper photo layering. |
| 6. Tests / solver / fuzz / retirement | Done | **85 files, 655 tests pass**; full **5,000-case fuzz** passes all five fixtures at 100% acceptance, zero failures. Final focused remap/solver/replay/64-seed fuzz/Show/ghost/actor checks: **34/34**. Removed-feature LEAFs retired. |
| 7. Export below 25 MB | Blocked | CLAD package.ts returned ACTION_REQUIRED missing_submission_metadata: packageId is empty. No raw-byte estimate is presented as an exported lens size. |

Strict means LEAF’s supported **fail-fast** policy. Integrated coverage is the complete naive-player route plus audio-overlap, row-stability, typed interrogation and timeout/replay boundaries. The boundary gate verifies the final accusation after timeout, Replay Harlow requiring a new file pinch, and opening the file before the introduction has finished scheduling. This is scripted Preview and visual-inspection evidence, not a first-time human usability study or a physical Specs test.

Final evidence: Tooling/results/run10-final-fullplay.json; Tooling/results/run10-hero-tape.json (exact captured graph, hash a5895dbc, 76 actions, correct verdict); Tooling/results/run10-vitest.log; Tooling/results/run10-full-fuzz.log. Earlier passes and failed diagnostic attempts remain in RUN10_PROGRESS; they do not replace the final marked-runtime pass.

## Removed and fallback behavior

The truth remains **Vale / charger cable / Study / 22:30**. Evidence holders changed; facts, statements, envelope and reducer verdict rules did not. The recorder carries the victim-location proof; the letter is one physical item; debt note and certificate are new paper props; Okafor’s bottle carries her alibi proof.

Removed from scene and flow: crate/two-file ceremony, casting sweep, chip/verb bars, case-lid actions, palm notebook, evidence wallet, furniture memories, photo presenting, case board, threads/web, zone plaques, objection pull, baseline questions, Clue suggestions/refutation, UV/dusting/blackout and timed letter reveal. No ASR work was added. Typed Ask your own… remains.

**20 unused production adapters** and their metadata were deleted, including the final orphan ReadingPanel; **23 removed-feature LEAF scenarios** were retired. Exact filenames and decisions are in docs/decisions.md and Tooling/results/run10-retirement-plan.md. Historical pure engine data remains for tape/test compatibility.

The certificate’s proposed sill position floated in front of curtains. This Preview room has no usable raised sill, so it rests on the measured console ledge beside the window, still in the fictional Conservatory. Both paper footprints are fully supported and clear nearby objects. This is the one physical-placement fallback from the spec. Existing cast and solid props were reused; no paid art or new solid mesh was needed.

Windows native playback needed additional handling: complete files avoid post-play seeks; finish callbacks are honored even when native position/playing state is stale. The debt-note take also has an offline PCM derivative. Failed long-session attempts are logged. The final explicitly refreshed runtime marker was pcm-note-native-finish, and its focused and full-play gates passed. Four graceful Lens restarts were used, no force-close. Preview is left paused to limit further audiodg growth; the underlying Windows resource growth is not claimed fixed.

## Captures to review

All paths are relative to the project root.

| View | Accepted file |
| --- | --- |
| Opening | docs/captures/2026-11-08-run10-opening-final.jpg |
| Vale at about 1.4 m with row | docs/captures/2026-11-08-run10-row-final.jpg |
| Show pictures | docs/captures/2026-11-08-run10-show-final.jpg |
| Caught lie and ghost | docs/captures/2026-11-08-run10-catch-final.jpg |
| Accuse — Where? | docs/captures/2026-11-08-run10-where-final.jpg |
| Frozen murder | docs/captures/2026-11-08-run10-freeze-final.jpg |
| Newspaper | docs/captures/2026-11-08-run10-newspaper-final.jpg |

Additional support checks: certificate-final.jpg and debt-note-final.jpg with the same date/run prefix. Before images: opening-first.jpg, row-v3.jpg (and the Run 9 vale-1p4m-v2.jpg), show-before.jpg, certificate-before.jpg and newspaper-before.jpg. These are diagnostic comparisons, not final acceptance.

The updated devpost/drafts/video-plan.md includes one uncut case-file → Vale → kettle → caught-lie stretch. A continuous video is planned, not claimed recorded.

## Tags, costs and final gate

| Tag | Use |
| --- | --- |
| run9-end | Pushed recovery checkpoint; Run 9 leftovers explicitly not Preview-verified. |
| run10-fixes | Pushed, verified earlier filming fallback. |
| run10-loop | Created and pushed at639d501; verified redesign and filming choice. |
| m3-case | Withheld until the remaining export-size gate passes. |

**Costs:** ElevenLabs **609 credits**; OpenAI images **$0**; Claude API **$0**. The 26 source MP3s total 316,626 bytes; the exact 3.840-second PCM note derivative adds 338,766 bytes. These are source audio bytes, not packaged lens size. Ledgers and NOTICE are current.

Final-gate list:
- [x] Integrated fail-fast full-loop, audio, row, interrogation and boundary coverage.
- [x] New exact-graph hero tape and replay validation.
- [x] Seven accepted visual views and updated continuous-video plan.
- [x] Code checkpoint639d501 and run10-loop pushed. Full reachable-history scan:123commits,7497blobs,33scene versions,196085081bytes,zero findings in15.813s. Committed receipt:Tooling/results/run10-history-secret-audit.json. A final report-HEAD receipt is retained locally as Tooling/results/run10-history-final.local.json.
- [ ] Actual exported lens measured below 25 MB.
- [ ] m3-case only after the remaining gate passes.

## Needs Wadood

The project needs an owned package ID before the actual size export can run. CLAD [specs-publish](C:/Users/wadoo/.codex/plugins/cache/ls-extensions/ls-clad/local/skills/specs-publish/SKILL.md) specifies, for a blank package ID, **“set a package ID they own.”** Its production package script therefore stops before export. No package identity, signing key or publication was invented for this check. After project metadata is supplied, rerun packaging, measure the artifact against 25 MB, and complete the remaining final gate.
