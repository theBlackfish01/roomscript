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
- [ ] Remap, find/ask/show/accuse, opening, remove retired flow; solver/fuzz/vitest + naive player + captures; run10-loop.
- [ ] Script, aligned voices, matching subtitles in Preview; generated-case fallback.
- [ ] Director captures, measured export, video plan, integrated LEAF, hero tape, history scan; m3-case only if passed.
- [ ] RUN10_REPORT.md against every Done when criterion.

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
- ElevenLabs:557 credits (shared ledger merged); OpenAI images:$0; Claude API:$0.

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
