# Run 7 supplemental audio integration

The verified hero voice library keeps its existing indices and selected cast. Run 7 adds independent phrase, narrator and effect imports. Generation stays under `Tooling/audio/out/run7/Assets` until the main Lens session releases imports. Publish with `node Tooling/audio/run7-publish.mjs --imports-allowed` only at that checkpoint, then compile with Lens MCP and verify in Preview.

## Exports

- `Content/Run7VoiceManifest.ts`: `RUN7_VOICE_MANIFEST`, rows with `key`, `speaker`, `text`, `take`, `index`, `group`, `startSeconds`, `endSeconds` and real character `alignment` relative to the start offset.
- `RoomscriptRun7VoiceAssets.ts`: `ROOMScriptRun7VoiceAssets[index]`, matching literal `AudioTrackAsset` imports. No scene input wiring is needed for these imports.
- `Content/Run7AudioManifest.ts`: `RUN7_AUDIO_MANIFEST`, effect names and provenance.
- `RoomscriptRun7CueAssets.ts`: `ROOMScriptRun7CueAssets[name]`, with `CastingChime`, `ToastTick`, `PullMemory`, `LiftInspect`.

The lookup key is `speaker + '|steady|' + text.trim().replace(/\s+/g, ' ')`. S1-S4 remain stable voice slots even when Dynamic changes suspect names. Narration uses `NARRATOR`; contextual hints use `WREN`. None of these supplemental pieces is a hesitation/tell take. Narration spec IDs such as `casting-lamp` are convenient authoring IDs; exact text keys are the playback contract.

## Generated questions

Use the engine's `phrasePlan(graph, speaker, admittedText)` / `prepareDynamicCase(...).phrasePlans`. The raw segments must join to the entire admitted line exactly. Whitespace/punctuation-only pieces are silent. Resolve **all** word-bearing pieces before starting playback. If any is missing, choose whole-line live TTS or the full admitted subtitle; never drop a missing word, name, object or negation. A new scan may introduce vocabulary beyond the authored-room inventory; this fallback is deliberate and honest.

For each resolved piece, play its track at `startSeconds` and stop at `endSeconds`; duration is their difference. Character alignment is already shifted relative to this start. These offsets remove long leading and trailing gaps without time stretching. Preserve the original line in captions: display the already-spoken prefix plus current piece reveal, and retain punctuation/spacing from the raw engine plan. Replacing the subtitle with each isolated token makes generated dialogue unreadable.

Some ElevenLabs short-phrase timestamps extend past their decoded MP3 duration. Such rows carry `alignmentBounded: true`: the full audio starts at zero and trailing reveal timestamps are capped at the measured duration, preserving all speech. Raw provider alignment remains in the Tooling manifest. `audio-window.test.mjs` covers this observed regression; no synthetic timing is presented as a new forced alignment.

The existing `RoomscriptTts` bundle loop already supports start/end offsets, cancellation, jaw alignment and speech ducking. Extend its lookup with a Dynamic phrase plan and pass accumulated-caption metadata, or add an equivalent dedicated loop. Keep cached lookups in a map and resolve once per utterance. Do not rebuild plans in `update()`.

## Casting, tips and effects

The narrator's fixture-specific lines are authored performances, not detections or facts. Play a line only when its object/role matches the accepted engine binding. `casting-finish` says “Tonight, this room is Harlow's study.” and is Preset-only. `casting-dynamic-finish` says “Same room. New murder.” and suits the Dynamic reveal. The recorded-scan label is UI provenance independent of audio.

Wren's seven contextual tips are questions; each should fire once at its relevant need state. They are separate from conversational PlayerKnowledge answers, which must use the engine-admitted text and gracefully fall back to subtitles if no exact voice exists.

Effects are single-shot, quiet assets. Trigger CastingChime when a label settles, ToastTick on a peripheral toast, PullMemory at the start of a successful pull, and LiftInspect when an inspectable object enters its lifted state. Do not loop effects every drag/update frame. Existing voice ducking and narration guard apply.

## Verification and limits

`node Tooling/audio/run7-verify.mjs` checks every expected inventory line, selected voice IDs, export order, character timing, decoded audio and four effects. The resulting `run7-verification.json` records bytes, durations and exact ledger costs. This is a technical decode/alignment check, not a subjective listening claim or a Lens integration pass. Parent-run LEAF and captures remain required.

Reruns are cached and skip existing exact clips. `run7-render.mjs` supports `--spec`, `--group`, `--limit`; wrap paid batches in `run-bounded.mjs`. Stop paid generation on any provider quota response. Existing takes, whole-line TTS or full subtitles keep the Lens playable. Keys, raw responses and signed URLs never enter Assets or git.
