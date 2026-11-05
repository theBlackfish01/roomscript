# Run 7 audio delivery

Final publication includes accepted-room v4 vocabulary, the v5 admitted-object noun expansion, seven exact scan-casting lines, and eight live-answer register pieces. Main released imports and the library was published as **346 files (3,122,026 bytes including source)**, all byte-checked against staging with zero mismatches. This report covers offline delivery and publication, not a Lens listening or integrated LEAF pass. The Audio adapter is implemented; main owns Lens verification.

| Item | Outcome |
| --- | --- |
| Generated-case phrase audio | Published: 310 unique phrase/register clips, union of v1-v5 inventories. All inventories are fully covered; eight exact existing takes were reused. V3 adds accurate furniture phrasing such as “touched” and matching denials; v4 uses the accepted seven-object room scan across six cast themes. |
| Casting sweep | Published: 21 narrator lines, including seven exact accepted-scan affordances, authored fixture roles, Preset closing and “Same room. New murder.” |
| Contextual Wren tips | Done: seven one-line questions for fallback, memory, pull, objection evidence, room suggestion, lifting and accusation. |
| New effects | Done: CastingChime, ToastTick, PullMemory and LiftInspect. |
| E8 voice-agent spike | No-go for directly streamed agent speech. Protocol/API and truth-safety design complete, executable boundary tests pass; no live Lens WSS/microphone/audio trial and no agent created. See [spike evidence](RUN7-VOICE-AGENT.md). |
| Lens integration | Audio adapter implemented: supplemental exact lookup, guarded serial narration, contextual-tip API, selector beat API, tension/ambience/ducking, subtitle events and four new cues. Main owns beat call sites, Dynamic TTS phrase integration and Lens acceptance. See [runtime API](RUN7-RUNTIME.md) and [asset contract](RUN7-WIRING.md). |
| Listening | Needs Wadood: selected cast and fragment-to-fragment transitions need subjective audition. This tooling agent made no listening-quality claim. |

The published union contains **338 voice clips and four effects**, **2,644,254 audio bytes** (about 2.64 MB), and **612.89 seconds** of decoded voice. Voices are mono 24 kHz / 32 kbps MP3, normalized to -16 LUFS; effects target -23 LUFS. Raw response caches remain ignored under Tooling. The verified hero library and its indices are unchanged.

V1-v3 include authored and synthetic room vocabulary; v4 adds the accepted seven-object scan RoomInput supplied by the main/engine lane. Inventory provenance records the exact supplied fixture path. The audio inventory itself does not independently verify scan placement accuracy. Actual unseen furniture names can still require new phrase pieces; the runtime must use full-line live TTS or complete subtitles if any word-bearing segment is missing. Dynamic graph facts remain engine-owned.

## Verification

- `node Tooling/audio/run7-verify.mjs`: all inventory rows covered, selected voices match, manifest/import order matches, every MP3 decodes, timestamps remain within playback bounds, four effects present. Machine evidence: `run7-verification.json`.
- `node --test Tooling/audio/audio-window.test.mjs Tooling/audio/voice-agent-gate.test.mjs`: six focused tests pass. Audio regression: provider timestamps exceeded decoded duration for some short fragments; export now preserves those full clips and bounds reveal times. Truth-gate tests reject invented/additional words, stale requests, absent IDs and partial/corrected/interrupted turns; no provider audio is returned.
- No full test suite, GUI automation, Chromium, scene edits or Lens MCP calls were used by this lane.

## Costs

`Tooling/results/elevenlabs-ledger.json`, segment `run7-2026-11-05`:

| Purpose | Header-confirmed credits |
| --- | ---: |
| New phrase segments (including live-register pieces and final vocabulary audit) | 2,670 |
| Casting narration and Wren tips | 481 |
| Four effects | 48 |
| Total | **3,199** |

No estimates, unresolved reservations or provider block in this Run 7 segment. Remaining segment allowance is 21,801 credits; this is a local allowance calculation, not a provider balance query. Cumulative ledger accounting is 90,997 credits, including older conservative estimates. Claude use in this lane: **$0**. E8 conversations: **0**. Six successful HTTP responses for one short noun contained empty audio; all 45 charged credits remain in this total, and those outputs were not exported.

No missing requested audio due to quota. Remaining historical variant-bank expansion from earlier runs is outside this supplemental inventory. Preserve existing fallbacks and do not turn a future quota error into a development blocker.

Pre-expansion offline audit (Nov 6 PKT): `run7-audit-published.mjs` compared all 312 published files against staging byte for byte: zero mismatches, zero missing then-requested inventory rows, 2,954 credits across 298 completed ledger entries. Evidence: `run7-published-audit.json`. A later admitted-vocabulary audit and expansion are recorded below; no quota top-up is currently required.

Final vocabulary expansion, **published Nov 6 at 03:05 PKT**: all three accepted six-object file-source graphs resolve 479/479 bank/variant/register combinations each. ScanAdmission actually admits 15 labels across 11 object types. An all-label fixture exposed 34 missing speaker/noun pieces; after 33 new clips and one timestamp-delimited reuse of S3's existing `left speaker` take, all three vocabulary fixtures resolve 551/551 combinations and every noun has all four voices. Existing 304 clips remain byte-identical. Evidence: `run7-v5-verification.json`, `run7-published-audit.json` and the refreshed published-library `run7-generated-voice-audit.json`. The 245-credit increment includes the six empty outputs; the reused `speaker` cut costs zero. Please audition that derived noun and phrase transitions before film. No new missing inventory rows remain.

The existing generated-case LEAF gates prove verdict flow and `LineSpoken` admission, but permit caption fallback. The published and registered `roomscript-generated-voices` scenario now checks all four speakers through real question controls, exact phrase order and per-piece native playback with networking forced off. It must pass in Lens before claiming native generated speech acceptance; offline composition coverage alone does not establish that.

Native Preview latency remains a separate runtime issue. Main measured a 3,010ms native `score.play:MainTheme` call. Production clock restarts were replaced by one loop; redundant startup Interrogation and silent Tension playback were removed, with tension starting only when needed. Native-call timing and S2 playback regressions were added. These changes preserve shipped speech and require main's Lens verification; the ledger/inventory audit does not prove latency resolved.

### Native channel lifecycle audit (read-only)

The local Lens contract explicitly destroys every component and child when a SceneObject is destroyed, with the complete hierarchy accessible during `OnDestroyEvent` (`Support/StudioLib.d.ts:12844`). Thus normal full-scene Preview reset already owns native channel cleanup. `AudioComponent.stop(false)` stops playback; its inherited `Component.destroy()` destroys the component. `AudioTrackAsset` exposes no explicit unload/destroy method in this API. No unsupported release call or OS audio-service action was introduced.

`RoomscriptAudio` creates 11 fixed child players once at start: four spatial effects, two flat effects, one one-shot tick, one production clock loop, music, tension and narration. A name-keyed map adds at most three ambience players. TTS creates one player on its own SceneObject; its synthesized-track cache evicts above 60 entries. Actor jaw animation reads the assigned track and creates no second player. The cached VirtualScene has one enabled Audio owner and one enabled TTS owner, each with one script component; ProbeLab is disabled. These are bounded allocations, not evidence of a growing native-player count.

Audio teardown cancels live narration, resolves queued/waiting jobs, removes engine subscriptions, stops narration/ambience and clears the static active pointer. Its remaining child channels rely on the documented parent destruction. TTS cancels speech/stops active playback; the owning controller also cancels warming on destruction. Destroying only either script component could leave its generated sibling/children alive, but that is not the normal reset path under investigation. Per main's decision, no unused script-only cleanup patch was staged.

Neither this audit nor the observed large `audiodg` working set establishes an application leak or explains the 150–173-second first-callback delay. S2's native-start logs and measured runtime evidence remain necessary. CLAD `specs-audio` confirms LowPower/LowLatency intent but supplies no additional native disposal contract. No Assets writes, Lens calls or runtime proof were produced by this audit.

## Provenance and skill contribution

All new audio uses ElevenLabs and the already selected Roomscript fictional voices. No voice clones or new character casting were introduced. Text comes from deterministic compiled statements or authored narration; model prose cannot alter case truth. E8 used primary ElevenLabs WebSocket/client-tool/authentication docs plus CLAD `specs-websocket`, `specs-audio` and `specs-asr` guidance to identify available Lens API shapes and the unverified Preview microphone dependency. That review changed the ship decision to no-go for direct generated agent speech.

Publish only after imports are released: `node Tooling/audio/run7-publish.mjs --imports-allowed`. It copies the staged supplemental Assets additively. Commit the resulting assets, manifests, Tooling sources, verification and ledger with the main verified package. Keep the Tooling `.env`, raw cache and signed credentials ignored.


Earlier live-register supplement (published and byte-verified before v5): all S1–S4 voices now cover exact engine prefixes `Well, detective.` and suffixes `Write that down.`. Updated verification covers 304 voice clips and four effects, 2,391,876 audio bytes, 553.68 decoded voice seconds, and zero missing inventory rows. Eight clips were added (two reused existing takes, six newly rendered), costing 66 header-confirmed credits. The runtime import list and manifest were published together; the original hero library remains unchanged.
