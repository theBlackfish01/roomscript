# Final audio batch handoff

Production Audio volume-cache / evidence dedup / Polish regression published by main release with byte checks. Pure selector tests passed13/13: eleven existing narrative tests plus `Tooling/tests/game/run7-evidence-audio.test.ts` (actual O11 multi-memory pinch, later action and distinct Letter/Blackout preservation).

Volume cache has no per-frame native getter. JS maintains smoothed levels and writes native volumes only for changes over.001 or reaching exactzero. `AUDIO_NATIVE_SLOW|volume:...` instruments setters over100ms; `loopDiagnostics().volumeWrites` permits idle before/after comparison. S2 checks native music/tension/clock volume is zero and repeating mute adds no writes. Native delay attribution remains unproven until main's measurements.

## Supplemental voices: published and byte-verified

`node Tooling/audio/run7-publish.mjs --imports-allowed` publishes the staged supplemental library only, preserving hero indices and production controllers. Then run `node Tooling/audio/run7-audit-published.mjs` for byte equality; its inventory inputs include v5. The supplemental import list and its338-entry manifest must ship together.

Published on main's import release at 2026-11-05 22:05 UTC (Nov 6 03:05 PKT): 346 files / 3,122,026 bytes, 338 voices + 4 effects, 2,644,254 audio bytes, 612.89 seconds. `run7-published-audit.json` reports zero byte mismatches and zero inventory gaps. All 304 existing voices remain byte-identical; 34 additions. Paid 33 usable takes plus 6 empty provider replies; the last noun was derived from an existing same-voice take with exact character timestamps. `run7-generation-retries.json` retains failed-output provenance and `run7-speaker-derivation.json` the zero-cost cut. No quota error. Full Run7 cost is 3,199 header credits; no estimates or reservations remain.

## Dedicated native generated-voice gate: published, runtime pending

Published `Assets/Scripts/RoomscriptGeneratedVoiceLeafScenario.ts` and registered `roomscript-generated-voices` with `seed="7"`, `source="file"` (or `recorded`), preserving all 38 other registry entries. Accepted seeds 7, 1041, 2026. Run one seed per bounded gate; suggested 300s. Four suspect whereabouts answers use actual question chips, forced-offline transport, exact resolved phrase order, and native isPlaying observations per segment. Caption fallback fails. Finally restores Preset and the previous offline flag.

Existing verdict tests remain separately required. Their `LineSpoken` assertion can pass with subtitles and therefore cannot replace this native-voice gate. The pure audit covers all statements/press/broken/neutral registers and composed live variants for each recorded graph, but does not synthesize facts or claim broad arbitrary object-name coverage outside the admitted vocabulary.

## S2 native-start regression: published, runtime pending

Published the source-hash-guarded `RoomscriptPolishLeafScenario.ts` update. Native clock start waits at most 2 simulation seconds / 120 frames / 15 wall seconds, then still requires native `clockPlaying`, unchanged start counts after repeated requests, and continued playback beyond 1.15 seconds. Each checkpoint logs state before its assertions. This addresses the immediate native-start observation race; it does not claim Preview startup latency is resolved. Publication hashes are in `Tooling/staging/run7-final-audio-tests-publication.json`. No compile, MCP calls or git writes were performed by this lane.
