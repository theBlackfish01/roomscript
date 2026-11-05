# Run 6 audio

## Vale swap checkpoint

- Owner-selected S2-1 (`Ajczv1caVKcFEG1TdJH0`) saved successfully; `cast.json` selects index 0. Other six cast choices unchanged.
- Authenticated voice search reconciled Run 5's interrupted zero-credit save before retry. New `run6-2026-11-05` ledger segment uses the existing Nov 4 30,000-credit top-up, not another allowance. Segment reservations are capped at that allowance and provider quota errors still stop generation.
- Re-recorded all **134 runtime Vale original performances**, including canonical moods, tells, variants and registers. Sentence aliases rebuilt from shipped sources first; this fixes a bug where optional retired-voice performances could take priority for shared sentences. Regression covers both source ordering and stale cast IDs.
- Arrival reuses the other three speakers' existing arrival recordings. Confession uses the new exact-text broken Vale performance. WrongEscape and the short voicemail reply are new Vale-only takes. OpeningExchange has Narrator/Wren only and is unchanged.
- Harlow's original ElevenLabs-generated performance is retained. Forced alignment was initially rejected by auto-review as a potentially sensitive audio upload; provenance established that this was original fictional ElevenLabs output, and the retry was approved. The provider key then returned `401 missing_permissions` (zero cost). Fallback cuts at **1.0599565 s**, the midpoint of the detected silence from 0.753583 to 1.36633 s after Vale's single word. This is signal-based editing, **not** word alignment; listening review of this splice remains pending. No human recording was uploaded.
- Published **878 entries / 552 shared voice tracks**, plus 30 SFX, eight score cues and five dialogue scenes: **9,954,375 bytes**. Stage and published verifiers report zero missing keys/files, stale casts, alignment or offset errors. Published 595 audio files, retired 134 old runtime files; paid masters preserved under `library/` and history.
- Pipeline contracts pass. Lens import, strict bundled playback and hero acceptance belong to the main session.
- Checkpoint cost: **3,542 header-confirmed ElevenLabs credits**, $0 Anthropic, zero unresolved reservations. Historical accounting total 86,440 (24,735 header-confirmed, 61,705 prior estimates). Subsequent optional generation is tracked separately in the same Run 6 segment below.

ClockTick diagnostic: shipped MP3 decodes to 24,000 mono samples at 24 kHz (one second), peak -5.8 dB, mean -33.7 dB. Legacy `GeneratedSFX/ClockTick.wav` is 80 ms. A runtime duration of .08 indicates the legacy source; immediate `isPlaying()` alone does not prove decoding.

Provider references: [voice creation](https://elevenlabs.io/docs/api-reference/text-to-voice/create), [voice search](https://elevenlabs.io/docs/api-reference/voices/search), [forced alignment](https://elevenlabs.io/docs/api-reference/forced-alignment/create).

## Remaining takes

One further bounded batch completed 40 optional Vale mood replacements outside `Assets/`; normalized originals are backed up in `library/`. Optional generation is paused for the main-session checkpoint commit. These takes are not added to the published runtime snapshot. Do not publish a later snapshot during LEAF.
