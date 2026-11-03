# Offline Roomscript audio

All voices, sound effects and score in this pipeline are generated with ElevenLabs, never at Lens runtime. Keys are loaded only by these local Tooling scripts. `out/` is ignored: it holds raw responses, the content-hash cache and the local ffmpeg executable. Do not delete the cache between reruns.

Run from the repository root:

1. `node Tooling/audio/cast.mjs`
2. `node Tooling/audio/select-cast.mjs`
3. `Tooling/node_modules/.bin/tsx.cmd Tooling/scripts/variants-generate.ts`
4. `Tooling/node_modules/.bin/tsx.cmd Tooling/scripts/audio-inventory.ts`
5. `node Tooling/audio/render.mjs`
6. `node Tooling/audio/cues.mjs sfx`, then `node Tooling/audio/cues.mjs music`
7. `node Tooling/audio/video-score.mjs` and `node Tooling/audio/dialogues.mjs`
8. `Tooling/node_modules/.bin/tsx.cmd Tooling/scripts/audio-segments.ts` then `node Tooling/audio/render.mjs --manifest-only`
9. `node --test Tooling/audio/pipeline.test.mjs` and `node Tooling/audio/verify.mjs`
10. At an agreed Lens checkpoint only: `node Tooling/audio/publish.mjs`, then import/compile/Preview verification through Lens MCP.

Generation writes to `Tooling/audio/out/staged`, so hundreds of incoming clips do not trigger hundreds of Lens hot reloads. The first 62 baseline files predated this staging correction; all subsequent output is staged and published in batches. Sentence clips are cut locally from real character alignments, without paid synthesis or time stretching.

One ElevenLabs request runs at a time. Every paid call first reserves credits in `Tooling/results/elevenlabs-ledger.json`. Successful `character-cost` response headers replace the reservation; missing headers keep the conservative estimate. A network timeout retains its reservation and blocks automatic resubmission to avoid accidental duplicate billing. Inspect provider history before resolving one. Historical key tests reserve 3,105 credits because their music/voice-design headers were not preserved. The hard budget is 150,000 credits, including that reserve.

Cache keys include endpoint, voice ID, exact text and every generation setting. A voice swap affects that voice only. Raw generations remain available after ffmpeg normalization: mono 24 kHz, 40 kbps MP3, target −16 LUFS voice; quieter effects and music. Normalization does not trim or time-stretch, so ElevenLabs character alignment remains on the same timeline. `VoiceManifest.ts` is a pure data module; `RoomscriptVoiceAssets.ts` contains literal Lens imports in identical order.

Casting is an automated technical selection: this Codex runtime cannot listen. All 21 previews and the rubric are in [audio-casting.md](../../docs/audio-casting.md). Wadood's subjective listening check remains pending; no listening quality claim is made.

## Licence and provenance

Created in collaboration with ElevenLabs. Voices are AI-generated original fictional characters, not clones or impersonations. These outputs are governed by ElevenLabs terms, not the repository's code MIT licence. The [Music Terms](https://elevenlabs.io/music-terms), checked 2026-11-03, distinguish plan eligibility and media uses; their table allows online/offline commercial media except film, TV, radio and Studio Games on self-serve plans, with an Indie Game definition. API access begins with paid plans. The restricted key cannot confirm the account plan. Wadood must verify the actual plan and hackathon music rules before publication; successful API generation does not establish those rights. Do not present the score as a reusable stock-music library or sublicense it under MIT.

Sources: [voice design](https://elevenlabs.io/docs/api-reference/text-to-voice/design), [speech with timestamps](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps), [sound effects and loop option](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert), [music](https://elevenlabs.io/docs/api-reference/music/compose). The final 170-second video score uses an explicit composition plan with section durations. An earlier timed-prompt take is retained in the ignored cache and counted in the ledger. Section feel and transitions still need an editorial listening check.

`variants-generate.ts` asks Claude Opus 5.5 for ten candidates per statement/mode, runs independent judgment, and filters at current strictness. `variants-finalize.ts` rechecks against the current engine after concurrent engine edits. `variants-repair.ts` fills only filter shortfalls with constrained new candidates; it never loosens the validator. The generated registers also pass the current assertion-free gate. Per-request token usage and estimated cost are in three `Tooling/results/anthropic-*-ledger.json` files.

ffmpeg is an existing local tool recovered from the machine's ffmpeg-static cache. Its executable stays ignored and is not distributed. No third-party source code is copied into this pipeline.

## Run 4 completion checkpoint

The selected runtime export contains 552 original voice performances plus 326 derived sentence clips, 30 SFX, eight runtime score cues and five dialogue scenes (13.02 MB). Full requested variant mood expansion stopped on ElevenLabs HTTP 401 `quota_exceeded`: 403 requested performances remain unrendered. `Tooling/results/elevenlabs-ledger.json` records 82,898 accounted credits (21,193 header-confirmed; 61,705 conservative estimates), zero unresolved reservations, and a provider block preventing further paid calls. Do not clear the block without Wadood confirming available provider quota. Anthropic generation/judging totals $1.848136.

Every paid original is backed up in `library/`; these files remain outside the Lens. `out/` additionally keeps raw responses and the content-hash request cache. A fresh checkout can use the normalized library to rebuild sentence clips. The locally installed ffmpeg executable must be available at `out/bin/ffmpeg.exe`.

For an offline rebuild, use `audio-inventory.ts --runtime`, `audio-segments.ts`, `node Tooling/audio/ship.mjs`, and `node Tooling/audio/verify.mjs --ship`. Publish the verified lean snapshot with `node Tooling/audio/publish.mjs --ship` at an agreed Lens checkpoint. The default publisher targets the larger master snapshot and should not be used for shipping. Video audio is under `video/`, outside Assets. See [INTEGRATION.md](INTEGRATION.md) for exact exports, alignment, coverage and remaining Lens work.
