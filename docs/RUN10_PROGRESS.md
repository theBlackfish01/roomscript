# Run 10 — find, ask, catch
1. Run 9 shipped the signed-off illustrated cast and same-art ghosts; do not regenerate the cast.
2. Eleven SPECS-generated solid props were gated and imported; the frozen murder staging was captured.
3. Paper folders, seals, newspaper and board were implemented; some later texture replacements remain unverified.
4. Two-row subtitles passed offline tests and Vale's 1.4 m capture; later caption routing remains unverified.
5. Board pictures, braided cable, opening caption and BOARD_CARDS_CHECK were written by 17:50 Nov 7, not Preview-verified.
6. Next-object glow passed strict LEAF; naive-player passed with 28 actions before the redesign.
7. Run 9's audiodg growth blocked its final captures and report; the owner restarted Lens for Run 10.
8. Run 9 measured about 24.8 MB raw before deleting old cast art; actual export remained blocked by package ID.
9. Run 9 reported $4.86 image cost, zero ElevenLabs and Claude API spend; Run 10 budgets start separately.
10. Run 10 drops furniture narration, old multi-menu/drag flow, board, memories, UV and crate ceremony; conversations and art stay.

## Plan and status
- [x] Preflight, compile, strict interrogation handshake.
- [x] Checkpoint Run 9 and push run9-end; commit redesign instructions/prompt.
- [x] Speech arbiter, no interruption, steady row, silence mechanics; strict audio/row LEAF + captures; run10-fixes.
- [x] Remap, find/ask/show/accuse, opening, remove retired flow; solver/fuzz/vitest + naive player + captures; run10-loop.
- [x] Script, aligned voices, matching subtitles in Preview; generated-case fallback.
- [x] Director captures, video plan, integrated LEAF and exact hero tape. History/push closeout below.
- [ ] Actual export blocked by packageId; m3-case withheld.
- [x] RUN10_REPORT.md against every Done when criterion.

## Session handshake — Nov 8, approximately 01:11 PKT
- Branch master at 56aaa73 plus documented Run 9 leftovers.
- CLAD router preflight inline: MCP reachable, project RoomScriptF.esproj matches, isAuthorized=true; Lens 5.23.2 PID 42660, started 01:08:29.
- RecompileTypeScriptTool succeeded; runtime refresh showed SIK startup and a LEAF plugin destroyed-instance state-save warning, no Lens script error.
- roomscript-interrogation initial baseline passed with fallback policy; superseded by the successful fail-fast new-row handshake below.
- Restarts used: **0 / 4** (owner's initial restart is the baseline).
- No plan tool exposed; this checklist is the durable plan. CLAD markdown agents run inline.
- One worker owns Tooling/audio and SCRIPT_2026-11-08.md; main owns all Lens work. No concurrent full tests, LEAF or renders.
- User explicitly authorizes checkpoint pushes and budgets, superseding older no-push instructions.

## Costs this run
- ElevenLabs:609 credits (shared ledger merged); OpenAI images:$0; Claude API:$0.

## Needs Wadood
- Actual lens packaging previously required a registered package ID. Recheck at size gate; do not claim raw asset totals are exported size.

### 01:22 PKT — restart 1 / 4
- Saved through Editor API; sandbox CloseMainWindow returned false. Elevated graceful CloseMainWindow succeeded and process exited normally; no force-close used. Relaunched this project for the audio/row LEAF batch.
- Speech/focus pure regressions passed 7/7. First Lens integration compiled; native runtime and captures still pending.
- Run 9 checkpoint d1b2dbc and run9-end pushed to verified private origin. Redesign brief/log commit 5f37c77 created.
- Script worker completed 19 aligned clips (262551 bytes), 527 ElevenLabs credits; staged under Tooling/audio/out/run10.


### 01:27 PKT — diagnostic policy correction
- LEAF 5.23 accepts diagnostic policy fail-fast, not strict; strict logs a warning and uses fallback. Baseline interrogation did pass, but was NOT strict despite the requested argument. Future strict runs use fail-fast. No milestone claim depends on that baseline policy.
- First audio-overlap scenario failed because its topic was whereabouts instead of authored where@22:30; fixed fixture. Also found W1/W13 bypassing Wren through legacy HandMoments SFX; all legacy W-number voice cues are now blocked at playOn.

### 01:39 PKT — speech integration
- First fail-fast audio-overlap passed (55 samples, zero caption mismatches/native overlaps/early ends); row-stability passed (40 boundary alternations, zero visibility toggles).
- Imported22 aligned Run10 clips through Editor API. Individual dialogue replaces mixed tracks; gate checks retained. Costs557 ElevenLabs credits, image/Claude$0.
- Extended audio test exposed native startup timing: isPlaying can initially be false after play; completion must observe playback before releasing the channel. Fix under Preview verification; no run10-fixes tag yet.
- First row capture was off-axis due MovePreviewCamera lookAt expecting x/y/z rather than target. Corrected view shows cast but selection hold expired before capture; not visual acceptance. Capture fixture will be recaptured promptly.

### 01:49 PKT — phase1 visual review and restart2
- audio-overlap expanded test passed fail-fast,23.283s: suspect+narrator+Wren+4 individual arrival speakers,51 sampled frames,0 caption mismatches,0 native overlaps,0 TTS early ends. Wren busy drop tested.
- Vale row capture v4 accepted at1.43m: three readable labels, no face overlap, 6cm targets, Show dimmed. v3 retained as before correction (text too small without world-space size-to-fit). Saved images in chunks after discovering larger node-repl save calls were rejected.
- Preview paused at ~609MB audiodg /2.88GB Lens. Restart2/4 requested before final fixes checks; graceful close only.

### 01:53 PKT — real-pinch regression
- Restart2 graceful close succeeded; new PID26852, project/sign-in confirmed after startup MCP registration settled. Initial early probes returned Tool not found while plugins loaded; retry after settling succeeded.
- Updated interrogation handshake from old question chips to Ask row + typed draft. It exposed immediate menu destruction during SIK release (Object is null). Cleanup now disables the menu and destroys it after0.3s.
- First immediate run after recompilation returned Widget is not initialized; wait for LEAF panel initialization before retry, no raw HTTP/GUI workaround.

### Phase1 verified — run10-fixes
- Final compile succeeded. fail-fast roomscript-audio-overlap and roomscript-row-stability passed after restart2. New-row roomscript-interrogation passed with real Ask/Ask-your-own menu pinches, exact typed question, charged-once behavior and deterministic replay.
- Delayed menu destruction was still unsafe during native-audio stalls. Final fix pools reusable menu targets by mode/count; targets remain alive through SIK hover exit. Strict interrogation is its regression.
- Accepted row image: docs/captures/2026-11-08-run10-row-v4.jpg. Before: docs/captures/2026-11-07-run9-vale-1p4m-v2.jpg; v3 documents rejected tiny text.
- Phase1 includes aligned speech imports early because per-speaker dialogue captions required them. Full-play audio gate remains phase2/final work.
- Preview paused. Restarts2/4. New content/CaughtReplay are prepared but not yet wired or included in the fixes checkpoint.

### Phase2 integration — approximately02:20 PKT
- Rewrote physical Find, shared row choice expansion, simplified typed question, single case file opening, persistent cast, successful-catch ghost, Pike flight and one-pinch accusation→reaction→frozen truth→newspaper. Generated cases deferred behind Another case? note; Replay Harlow offered.
- Reparented four retained crate children and deleted obsolete scene systems through VirtualScene. Removed19 unused production adapters and metadata. LEAF worker is migrating retained gates and retiring removed-feature scenarios.
- Run10 content focused solver/replay64seed fuzz6/6, CaughtReplay16/16, ShowItem6/6 passed offline. Full suite underway with Preview paused. No new Preview acceptance yet.
- Imported final4 aligned dismissal clips;26total,609 ElevenLabs credits; no images/Claude spend. Restarts remain2/4.

### Restart3/4 — 02:18 PKT
- Phase2 compile succeeded. Saved scene; PID26852 graceful close returned true and exited normally. Relaunched project for strict full-loop/capture batch. No force used.

### First strict fullplay — 02:18 PKT
- Restart3 PID16268 (actual start02:16:10), project/auth confirmed. roomscript-naive-player fail-fast passed87.197s:25pinches,0drags/holds,firstanswer13.58s,correct verdict,105engine minutes,5pips. Exact action replay matched.
- Fullplay audio:1110samples,0subtitle mismatches,0native overlapframes,0TTS earlyends. Every speech start/end is saved in Tooling/results/run10-fullplay-audio.json; source action tape in run10-hero-action-tape.json.
- Initial visual check rejected cast staging: :run10 suffix bypassed measured free-floor predicate. Fixed with focused6/6 regression. Frozen truth renders signed-off culprit/victim art; newspaper needs a downward viewing angle for full-page capture.
- Read-only review prompted serialized Ask/Show intents, spatial dialogue/dismissals, guaranteed opening intro and timeout/final-accusation handling. Preview paused during these corrections; rerun gates after edits.
- Package size recheck: CLAD package.ts returned ACTION_REQUIRED missing_submission_metadata because packageId is empty. Cannot truthfully report exported size yet.

### 02:38 PKT — muted capture recovery
- Director row and corrected Show pass visually, saved final images. Where staging failed132.4s with speech-idle timeout during muted N10_LETTER. Lens responsive; audiodg606MB. Preview paused, asset writes settled.
- Muted narration/TTS now use timed captions without opening native speech streams; the audio gates still explicitly unmute and inspect native completions. Added narrator early-end audit and native-start wait for TTS. Final allowed restart4 planned before retest.
- Corrected ConvertSvg outputFolder double Assets prefix via asset_graphql moveAsset; shipped paper thumbnail paths now match requireAsset.
- Full offline suite after retirement/staging corrections:85files,655tests PASS in45.45s at02:38:42. Includes200generated cases,1000historical random players,64remapped-case seeds and exact Run10 solver/replay proofs.
- Full reachable history scan at fixes HEAD:122commits,7366blobs,193276980bytes,zero findings in20.62s; final-HEAD rerun required after commit.

### Restart4/4 — 02:40 PKT
- Saved after compile, closed PID16268 gracefully (true/exitedtrue), no force. Lens remains closed during full5000-case fuzz. Relaunch before remaining exclusive Preview batch; restart budget exhausted after this relaunch.

- Full 5000-case compiler fuzz passed all five fixtures (1000 each), acceptance100%, zero failures, max153.64ms; six tests passed135.63s. Final Preview relaunch follows.

- Restart4 relaunched PID28796 at02:44:28. MCP startup initially returned Tool not found while plugins loaded; settled and confirmed correct project/isAuthorized=true. No force,4/4 used. Final compile/Preview batch running.

### Final audio audit correction — 02:50 PKT
- Expanded audio-overlap first failed narrator early-end audit: native EOF leaves a stale stopped position (observed1.98/2.15 for2.48s clips). Files/manifests checked; no shortened exports. Both playback waiters now retain high-water progress and require native finish callback for a short stopped position; explicit reset/cancel remains distinguished.
- Latest unmuted audio-overlap PASS, including walking800cm away and queued Ask/Object/Ask, zero overlaps/caption mismatches. Row-stability PASS. Preview boundary/fullplay/captures ongoing.

### Full play and Director acceptance — approximately03:08 PKT
- Latest full unmuted naive-player PASS107.748s:25pinches, first answer13.417s, correct verdict105minutes/5pips,967caption samples,0mismatches/overlaps/TTS or narrator premature ends;34start/end events. Exact captured graph and76actions saved.
- Boundary test PASS after retaining the replay pinch target; typed interrogation PASS.
- Director opening, row, Show, caught ghost, Where and frozen murder accepted. Paper audit rejected floating certificate and overhanging page footprints, corrected to measured console supports; debt/certificate final images accepted. Fullplay/tape will be refreshed for final paper positions. Newspaper capture ongoing.

### Native seek stall —03:14 PKT
- Latest fullplay stalled at N10_DEBT and reported a60s native completion timeout. audiodg~1063MB, Lens responsive, restart budget exhausted. Preview paused. Earlier107.748s fullplay passed, but this rerun is not counted as a pass.
- Removed unnecessary post-play seeks from complete per-line narration/TTS assets; alignment still subtracts the authored leading-silence offset. Files remain complete, preserving the whole line. Retesting without a fifth restart.

- Post-seek-removal audio-overlap PASS, but fullplay again stalled on N10_DEBT (163.418s fail). The prior seek change was insufficient. Testing a lossless PCM derivative of this exact take, no regeneration/extra cost, with the note included in audio-overlap regression. No additional restart.

### Final marked-runtime gate —03:37 PKT
- Explicit pause→compile→refresh→resume, confirmed RUN10_AUDIO_BUILD|pcm-note-native-finish. Native completion now honors the finish callback even if Windows still reports playing; complete files avoid post-play seeks. Expanded audio-overlap including PCM debt note PASS.
- Final full unmuted naive-player PASS131.844s:25pinches,0drags/holds, first answer16.287s, correct verdict105minutes/5pips,879caption samples,0mismatches,0native overlaps,0narrator/TTS early ends,34speech start/end events. Both previously stalling observations completed.
- Newspaper portrait layering/aspect fixed; final capture accepted with real2catches/10items/1question/105minutes. All seven Director views accepted. Preview paused and project saved;4/4 graceful restarts, no force.
- Engine/content focused final check34/34 passed after paper footprint corrections. Full655-test suite and5000-case fuzz remain green; no engine logic changed after them.
- Final exact graph/action capture: Tooling/results/run10-final-fullplay.json and run10-final-hero-capture.log. Git/tape/history/report closeout follows.
