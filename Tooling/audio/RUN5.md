# Run 5 audio checkpoint

Offline audio export is verified. The Vale voice swap and new synthesis are blocked by shell network access.

- Published audio: **9,907,527 bytes (9.91 decimal MB)**, down from 13,020,141 bytes. This is audio payload, not the exported Lens build size.
- 878 exact-text/take entries now share 552 voice tracks. All 552 runtime performances and 326 sentence keys remain available. Thirty effects, eight music cues and five dialogue scenes remain.
- `startSeconds` / `endSeconds` identify a sentence in its original track. Its character alignment starts relative to that segment, not the full file. Set the AudioComponent position and stop at `endSeconds`; do not play the remaining sentence by accident. Full-line matches take precedence.
- Trim only silence outside the recorded character alignment (60 ms before, 80 ms after). Do not time-stretch audio. Original normalized masters and old derived files remain in Tooling/library or the ignored staging/cache.
- Canonical steady lines, narration, Wren, arrivals and tells use 40 kbps mono; extra moods/variants/registers use 32 kbps. SFX use 32 kbps; music retains 64 kbps. Keeping all canonical moods at 40 kbps gave 10.32 MB; the final mix of bitrates meets 10 MB without removing a bank choice.
- `node Tooling/audio/run-bounded.mjs --test Tooling/audio/pipeline.test.mjs`: **8/8 passed**. Both `verify.mjs --ship` and `verify.mjs --published`: zero missing keys/files, zero alignment/offset errors, size below 10 MB. Lens playback checks belong to the main session.

## Voice request and costs

The ledger has a new `run5-2026-11-04` segment beginning 2026-11-04, with Wadood's 30,000-credit authorization and the preceding quota block preserved in segment history. Entries carry their segment ID. The historical conservative accounting ceiling increases from 150,000 to 180,000; provider quota remains authoritative.

The first save-designed-voice request for Vale take 1 (`Ajczv1caVKcFEG1TdJH0`) failed immediately with `NETWORK_UNCERTAIN_RESERVATION_RETAINED`. No successful new API response or paid generation was received. The zero-credit save reservation is retained to prevent blind duplicate requests. No approval/UI workaround was attempted under rule 15. Current audio still uses Vale take 2; `cast.json` records the pending owner selection explicitly. Other roles are unchanged.

Run 5 recorded confirmed spend: **0 ElevenLabs credits, $0 Anthropic**. Historical ledger totals remain 82,898 accounted credits: 21,193 header-confirmed, 61,705 estimates. There is one unresolved zero-credit save request. Do not describe the Vale swap as finished.

When authorized shell network access is available, first reconcile whether the save request created the requested designed voice, then resolve that zero-credit reservation. Run `run5-start.mjs`, then repeated bounded `render.mjs --speaker S2 --limit 40` batches. Rebuild sentence derivatives and the lean export after Vale finishes. Other missing moods follow Vale and hero-path gaps. Stop immediately on provider quota error.

Dialogue notes: OpeningExchange contains Narrator/Wren only, so it needs no Vale re-render. Arrival's non-Vale parts can be reused from existing exact-text tracks. Confession and WrongEscape are Vale-only. HarlowVoicemail is a mixed render without speaker alignment: preserve Harlow's existing performance when replacing Vale's part; do not silently regenerate him. Its motive disclosure still requires the engine admission described in INTEGRATION.md.

All unattended batch entrypoints enforce a 570-second process timeout; paid requests retain their 240-second timeout and ffmpeg processes use a 60-second timeout.
