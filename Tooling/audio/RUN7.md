# Run 7 audio delivery

Final technical staging verification passed on 2026-11-05 19:38 UTC (Nov 6 00:38 PKT), including accepted-room v4 vocabulary and seven exact scan-casting lines. Main released imports; the final library was published as **304 files (2,768,857 bytes including source)**, all byte-checked against staging. This report covers offline delivery and publication, not a Lens listening or integrated LEAF pass. The Audio adapter is implemented; main owns beat call sites and Lens verification.

| Item | Outcome |
| --- | --- |
| Generated-case phrase audio | Published: 268 unique phrase clips, union of v1-v4 inventories. All inventories are fully covered; eight exact existing takes were reused. V3 adds accurate furniture phrasing such as “touched” and matching denials; v4 uses the accepted seven-object room scan across six cast themes. |
| Casting sweep | Published: 21 narrator lines, including seven exact accepted-scan affordances, authored fixture roles, Preset closing and “Same room. New murder.” |
| Contextual Wren tips | Done: seven one-line questions for fallback, memory, pull, objection evidence, room suggestion, lifting and accusation. |
| New effects | Done: CastingChime, ToastTick, PullMemory and LiftInspect. |
| E8 voice-agent spike | No-go for directly streamed agent speech. Protocol/API and truth-safety design complete, executable boundary tests pass; no live Lens WSS/microphone/audio trial and no agent created. See [spike evidence](RUN7-VOICE-AGENT.md). |
| Lens integration | Audio adapter implemented: supplemental exact lookup, guarded serial narration, contextual-tip API, selector beat API, tension/ambience/ducking, subtitle events and four new cues. Main owns beat call sites, Dynamic TTS phrase integration and Lens acceptance. See [runtime API](RUN7-RUNTIME.md) and [asset contract](RUN7-WIRING.md). |
| Listening | Needs Wadood: selected cast and fragment-to-fragment transitions need subjective audition. This tooling agent made no listening-quality claim. |

The published union contains **296 voice clips and four effects**, **2,338,140 audio bytes** (about 2.34 MB), and **541.92 seconds** of decoded voice. Voices are mono 24 kHz / 32 kbps MP3, normalized to -16 LUFS; effects target -23 LUFS. Raw response caches remain ignored under Tooling. The verified hero library and its indices are unchanged.

V1-v3 include authored and synthetic room vocabulary; v4 adds the accepted seven-object scan RoomInput supplied by the main/engine lane. Inventory provenance records the exact supplied fixture path. The audio inventory itself does not independently verify scan placement accuracy. Actual unseen furniture names can still require new phrase pieces; the runtime must use full-line live TTS or complete subtitles if any word-bearing segment is missing. Dynamic graph facts remain engine-owned.

## Verification

- `node Tooling/audio/run7-verify.mjs`: all inventory rows covered, selected voices match, manifest/import order matches, every MP3 decodes, timestamps remain within playback bounds, four effects present. Machine evidence: `run7-verification.json`.
- `node --test Tooling/audio/audio-window.test.mjs Tooling/audio/voice-agent-gate.test.mjs`: six focused tests pass. Audio regression: provider timestamps exceeded decoded duration for some short fragments; export now preserves those full clips and bounds reveal times. Truth-gate tests reject invented/additional words, stale requests, absent IDs and partial/corrected/interrupted turns; no provider audio is returned.
- No full test suite, GUI automation, Chromium, scene edits or Lens MCP calls were used by this lane.

## Costs

`Tooling/results/elevenlabs-ledger.json`, segment `run7-2026-11-05`:

| Purpose | Header-confirmed credits |
| --- | ---: |
| New phrase segments | 2,359 |
| Casting narration and Wren tips | 481 |
| Four effects | 48 |
| Total | **2,888** |

No estimates, failed requests, unresolved reservations or provider block in this Run 7 segment. Remaining segment allowance is 22,112 credits; this is a local allowance calculation, not a provider balance query. Cumulative ledger accounting is 90,686 credits, including older conservative estimates. Claude use in this lane: **$0**. E8 conversations: **0**.

No missing requested audio due to quota. Remaining historical variant-bank expansion from earlier runs is outside this supplemental inventory. Preserve existing fallbacks and do not turn a future quota error into a development blocker.

## Provenance and skill contribution

All new audio uses ElevenLabs and the already selected Roomscript fictional voices. No voice clones or new character casting were introduced. Text comes from deterministic compiled statements or authored narration; model prose cannot alter case truth. E8 used primary ElevenLabs WebSocket/client-tool/authentication docs plus CLAD `specs-websocket`, `specs-audio` and `specs-asr` guidance to identify available Lens API shapes and the unverified Preview microphone dependency. That review changed the ship decision to no-go for direct generated agent speech.

Publish only after imports are released: `node Tooling/audio/run7-publish.mjs --imports-allowed`. It copies the staged supplemental Assets additively. Commit the resulting assets, manifests, Tooling sources, verification and ledger with the main verified package. Keep the Tooling `.env`, raw cache and signed credentials ignored.
