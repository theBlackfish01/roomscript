# Run 10 voice handoff

Generated and checked November 8, 2026 (PKT). This is staged work; the main Lens session owns import, manifest wiring, compile, Preview and commits.

- Script: `docs/SCRIPT_2026-11-08.md`.
- Inventory: `Tooling/audio/run10-script.json`.
- Full manifest: `Tooling/audio/run10-voice-manifest.json`.
- Offline verification: `Tooling/audio/run10-verification.json`.
- Worker cost ledger: `Tooling/audio/run10-elevenlabs-ledger.json`.
- Export root: `Tooling/audio/out/run10/Assets/`.
- Exported manifest: `Scripts/Content/Run10VoiceManifest.ts` (`RUN10_VOICE_MANIFEST`).
- Exported imports: `Scripts/RoomscriptRun10VoiceAssets.ts` (`ROOMScriptRun10VoiceAssets`).
- MP3s: `Audio/Run10/<speaker>/<line ID>.mp3` beneath the export root.

There are **26 clips**, **316,626 bytes** of normalized mono 24 kHz MP3, **609 ElevenLabs credits**, all confirmed by response `character-cost` headers. This includes one rejected certificate take with provider alignment beyond the decoded audio. Its replacement used seed 1042; all other requests used seed 1041. Two dialogue clips reuse cached Run 6 timestamped takes at no new cost. No Claude or image generation was used. No files in `Assets/` or the shared ledger were modified by this audio worker.

The 12 narrator lines, 6 whispered Wren questions, Harlow introduction, 3 individual dialogue lines and 4 dismissals reuse the selected voices in `cast.json`. Every exported key is `speaker|steady|exact text`, matching the Run 7 supplemental lookup convention. Index order in the generated import array matches the exported manifest. `startSeconds` / `endSeconds` bound playback; character alignment is relative to `startSeconds`, as in the current voice library. Play the complete window and finish it before releasing the speech channel.

## Integration

1. Import the staged MP3 files through Lens asset tooling; publish the two staged TypeScript data/import modules at the same verified batch boundary.
2. Add the Run 10 manifest/imports to `RoomscriptAudio`'s supplemental map. IDs are also available for cue lookup; exact text is the caption source.
3. Opening order is **V10_OPEN → N10_OPEN_1 → N10_OPEN_2**. Harlow's new call is spoiler-free and lasts 4.64 seconds. Do not use the existing `HarlowVoicemail` dialogue here: that clip names Vale and the forged accounts and remains evidence-gated. The existing `OpeningExchange` explains the old flow and is retired.
4. The seven find observations play once per physical item, gated by its admitted discovery. The debt note, bottle and certificate text comes from the authored redesign; the lines do not add solver facts or advance suspect layers.
5. Wren eligibility is in the script. W10_READY and the item-specific hints are hero-only. All go through the shared queue, with whisper spatialization behind the wearer, 25-second stuck threshold, 45-second minimum interval, and drop-on-busy.
6. Existing next-layer suspect lines already cover all remapped items. Do not regenerate the bank or change its truth/admission rules.
7. Merge the worker ledger entries by unique `id` into `Tooling/results/elevenlabs-ledger.json`; add a `run10-2026-11-08` segment with allowance 15000 and recalculate the shared total. The worker ledger intentionally remains separate to avoid concurrent writes. Do not count its 609 credits again as a second expense after merging.
8. Add the new ElevenLabs output provenance to `NOTICE` and the script/seed/cost decision to `docs/decisions.md`.

## Verification

`node Tooling/audio/run10-voices.mjs --check`: PASS, all **36** documented spoken lines (26 staged and 10 retained). No forbidden mechanic terms; all six Wren hints are questions.

`node Tooling/audio/run10-verify.mjs`: PASS, **26/26** clips. Exact normalized caption text, original cast identity, MP3 decode, duration, monotonically ordered character timing, playback bounds, manifest/import order, complete request ledger and budget all checked. No unresolved reservation and no provider quota block.

The four new `D10_DISMISS_S1` through `D10_DISMISS_S4` clips each say exactly **That proves nothing.** They are authorized only by `objectionWrong` for that suspect. Cost of this increment: **52 credits**, included in the 609 total; added audio: **26,484 bytes**. No exact source existed in the audited voice banks. They append to the same staged manifest/import modules, with files `Audio/Run10/S1/D10_DISMISS_S1.mp3` through `Audio/Run10/S4/D10_DISMISS_S4.mp3`.

`node Tooling/audio/run10-dialogue-audit.mjs`: PASS, all **8 individual dialogue lines** resolve to aligned files in the original cast. Exact text substitutions and unchanged fact/verdict gates are in `run10-dialogue-audit.json`. Strip leading `[quietly]`, `[firmly]`, `[sad]` and `[coolly]` from spoken text/captions. Four arrival lines use existing steady clips; ValeConfession uses its existing **broken** take; the other three use D10_EDMUND, D10_HARLOW and D10_ESCAPE. OpeningExchange is excluded. No mixed dialogue MP3 needs to be played after this integration.

Preview, listening and on-screen subtitle composition are **not verified** by the worker. The main session must run the audio-overlap LEAF and inspect the caption captures. File metadata cannot establish that the correct speaker owns the subtitle slot or that runtime voices never overlap.

The timestamp endpoint was checked against the [official ElevenLabs documentation](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps). It supplies character-level timing alongside generated audio. The pipeline preserves that timeline during normalization.

## Native playback derivative
N10_DEBT uses Assets/Audio/Run10/NARRATOR/N10_DEBT.wav in RoomscriptRun10VoiceAssets index6. It is a complete44.1kHz mono16-bit PCM transcode of the original MP3,3.840s,338766bytes; the source manifest/ledger retains the generated MP3 provenance and alignment. Preserve this runtime override when regenerating asset bindings. Final marked-runtime audio-overlap and full-play gates passed.
