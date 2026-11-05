# Run 6 narrative audio integration handoff

**Prepared and unit-tested, not wired in Lens.** Lens operations stopped after the parent reported `Failed to get scenario list after 600 attempts`. No new component was added and no existing Lens controller/audio component was changed by this lane.

`Assets/Scripts/Engine/game/NarrativeAudio.ts` is a platform-free presentation selector. `Tooling/tests/game/narrative-audio.test.ts` passes 10/10 focused tests. Tests cover real reducer tell/objection events, cumulative snapshot idempotence, model-output isolation, delayed voicemail admission, wrong/correct/timeout separation, reset replay, non-mutation, normalized tension and exact coverage against the actual shipped voice/dialogue/SFX manifests. This is not a Lens compile or playback result.

## Minimal integration after MCP recovers

Create `RoomscriptNarrativeAudio` as the Lens adapter with `flow: RoomscriptInterrogationController` and `audio: RoomscriptAudio` inputs; instantiate/wire through VirtualScene. Keep the selector instance and the latest immutable engine state. Subscribe to `engine.onState` once, cache `engine.graphRef()` once, and clean up subscriptions on destroy. Do not call `snapshot()` or `caseGraph()` in Update or drag handlers.

1. On an engine state event, set `audio.setComposure(composureTension(state))` (the existing mixer method takes normalized **tension**, despite its name) and enqueue `selector.consume(graph,state)`.
2. Forward existing OpeningController `beat(name)` calls to `selector.opening(graph,state,name)`. It voices placed/tape/crate/first arrival/ready. Do not separately play Wren's opening after OpeningExchange, which already contains it. Existing authored opening SFX remain.
3. Before the accusation panel opens/its seal becomes actionable, enqueue `selector.beforeSeal(graph,state)`. Both unknown and proved versions are exact shipped Wren lines.
4. After a bounded idle interval with no input, enqueue `selector.idle(graph,state)`. Use a delayed callback, not an Update snapshot. The selector emits this guidance once per playback session.
5. ClosingController forwards each reconstruction beat kind to `selector.reconstruction(graph,state,kind)`, and the result-card transition to `selector.ending(graph,state)`. Resume narration is the engine's cited ending spine; correct plays ValeConfession, wrong plays WrongEscape, and timeout never starts reconstruction/confession.

## Playback contract

- Queue speech serially behind current suspect speech. `flow.diagnostics().busy` can be checked by a low-frequency delayed callback. Do not discard queued once-only instructions when the player starts a question: defer them, or explicitly reset presentation only when restarting the whole case.
- Add an explicit speech-busy signal from InterrogationController before `perform` starts and release it in its `finally` block. This avoids narrator/suspect overlap between dispatch and first decoded audio. Parent owns this controller and Tts.
- Recheck `dialogueAllowed(graph,latestState,actual DIALOGUE_MANIFEST entry)` **at playback**, not only enqueue time. Replace the existing RoomscriptAudio gate: it currently lets any sealed verdict use graph truths, which would permit ValeConfession on a wrong verdict and HarlowVoicemail before admitted motive.
- HarlowVoicemail requires both `F_REPLY_AFTER_ARRIVAL` and `F_VALE_MOTIVE` in engine knowledge, even after sealing. If the voicemail beat fires first, the selector remembers it and emits the recording only after a later state admits motive.
- Add promise-based completion to dialogue playback so scenes, Wren and narration cannot cut one another off. Dialogue scenes have no claimed word alignment. Exact voice rows retain provider timing and can use the parent's subtitle reveal path.
- Track narration ducking separately from suspect ducking, so finishing one source does not restore the score while the other is active. Stop/mute both score layers immediately when `silence(true)` is called. Current code mutes only the base layer immediately and also prevents no new SFX; reconcile this before mixer acceptance.
- Add bounded, dedicated loop components for Rain/RoomTone/UvHum (`ambience` cues); use `LowPower` for background loops. A blocked scene test alone is not listening acceptance for loop seams.
- Existing tell, objection, sweep and opening controllers already play their own SFX. Do not double these. The selector adds letter/voicemail/flight/blackout beats, evidence-specific Kettle/Polaroid/PaperSlip, deduction Typewriter and reconstruction sounds. Full S3 still needs a map of all thirty effects to their final presentation beats and a listening pass.

After wiring: MCP compile, runtime log diff, strict bundled voices, hero/closing/timeout/naive route, mixer/timing checks and captures. No gate is claimed complete here.
