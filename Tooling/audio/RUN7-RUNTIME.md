# Run 7 audio adapter API

`RoomscriptAudio.ts` now implements the prepared Run 6 selector/guard and Run 7 supplemental library. This batch changes Audio only, apart from the separately requested `@allowUndefined` safeguard on Actor.smug and additive asset publication. Main owns Lens compile and the controller call sites below. There are **no new Audio scene inputs**.

## Bind and forward beats

Once the owning controller's engine and Audio have started:

```ts
audio.bindNarrative(flow.engine, () => flow.diagnostics().busy);
audio.onNarrationSubtitle.add(({speaker, text}) => { /* route to Wren/narrator one-line caption */ });
```

An optional third callback `(objectId: string) => vec3 | undefined` supplies known room anchor positions for spatial event sounds. Return undefined for missing IDs; Dynamic has different object IDs. Omitting it safely uses flat cue playback. `bindNarrative` unsubscribes earlier handlers, caches immutable graph/state on engine events, and resets the selector/queue on case replacement. Nothing calls engine snapshot in Update.

Forward the existing presentation beats:

| Trigger | Audio call |
| --- | --- |
| Opening placement, tape, crate, first S2 arrival, ready | `openingBeat('placed'|'tape'|'crate'|'arrival:S2'|'ready')` |
| Before showing the actionable accusation seal | `beforeSeal()` |
| Explicit idle timer | `idleTip()` |
| Each Closing reconstruction beat | `reconstructionBeat(beat.kind)` |
| Final result transition | `endingBeat()` |

Engine tells, evidence, deductions, letter/voicemail/flight/blackout/timeout are selected automatically from `onState` after binding. Do not separately replay those selector-owned event cues. Existing authored opening/tell/objection sounds remain controller-owned. In particular, remove any legacy additional Wren opening when the selector plays OpeningExchange, and avoid a second generic ClockTick/Objection sound for each reconstruction beat if `reconstructionBeat` supplies the proper effect.

Direct `narrate(speaker, exactText)` remains a Promise<boolean>; it now queues rather than cutting off other narration. It resolves true for played exact bundled audio and false for missing/rejected/cancelled speech. Missing audio emits the complete subtitle and retains a bounded reading interval. It does not synthesize or alter text. Callers must supply engine-admitted or authored performance text, never unvalidated model prose.

`dialogue(name, graph, state)` retains its boolean API (accepted into queue, not completed). It checks `dialogueAllowed` at enqueue and again against latest state at playback. Wrong never enables ValeConfession. Voicemail still requires observed motive and reply-order facts after sealing. All authored case-specific scenes are restricted to HARLOW-1041; the generic ArrivalDialogue can play in Dynamic. Dynamic cited summaries without exact audio use subtitles.

Narration waits behind the supplied flow-busy signal and existing `duckSpeech(true)` suspect signal. Active narration pauses when suspect speech begins and resumes from its audio position; its completion clock excludes paused intervals. Suspect and narrator duck flags are independent. The score's tension layer follows normalized engine composure only during Interrogation. Rain/RoomTone/UvHum each have one bounded LowPower loop component.

`silence(true)` immediately mutes **both** score layers and ambience, stops pooled cues and suppresses new SFX. Narration remains independently available. Closing currently calls silence(true): if reconstruction SFX should play, main must deliberately release that mute or use score control instead. Do not expect new effects to bypass an explicit mute.

## Exact Run 7 narrator lines

Use `narrate('NARRATOR', text)` only if the accepted compiler binding matches that fixture/role. Main approved these seven exact lines for the accepted scan; they describe fictional affordances, not murder truth. All seven are published and verified through `run7-scan-narration-spec.json`.

| Accepted scan fixture | Exact text |
| --- | --- |
| media console | Your media console: a hiding place. |
| record player | Your record player: a witness. |
| left speaker | Your left speaker: a possible weapon. |
| right speaker | Your right speaker: a possible weapon. |
| woven chair | Your woven chair: a hiding place. |
| coffee table | Your coffee table: a witness. |
| sofa | Your sofa: a hiding place. |

Additional authored fixtures and finish lines remain available:

| Authoring ID | Exact text |
| --- | --- |
| casting-lamp | Your desk lamp: witness. |
| casting-kettle | Your kettle: witness. |
| casting-cable | Your charger cable: the rope. |
| casting-mug | Your mug: a memory. |
| casting-door | Your doorway: the hall. |
| casting-desk | Your desk: the study. |
| casting-chair | Your chair: a witness. |
| casting-shelf | Your shelf: a hiding place. |
| casting-clock | Your clock: the timekeeper. |
| casting-sofa | Your sofa: the lounge. |
| casting-table | Your table: a witness. |
| casting-plant | Your plant: a witness. |
| casting-finish | Tonight, this room is Harlow's study. |
| casting-dynamic-finish | Same room. New murder. |

The final Harlow line is Preset-only. Existing hero narration remains available through the original library first; the Run 7 index is an exact-text fallback.

## Once-only contextual questions

`contextualTip(id)` returns true only when queued for the first time in the current case. False guard checks do not consume the tip. Guards read PlayerKnowledge and public room object types, never envelope/hidden truth; they are checked again at playback.

| ID | Exact Wren text | Guard |
| --- | --- | --- |
| casting-fallback | Shall we open the case we brought? | Active case, no verdict |
| tip-memory | What would the kettle remember? | Observed evidence held by a kettle |
| tip-pull | Could you pull that memory closer? | At least one observed evidence item |
| tip-object | Would her words hold up beside the kettle? | HARLOW-1041, active S2, known kettle evidence and a heard statement |
| tip-suggest | Who would you place in that room? | A heard statement |
| tip-lift | What changes when you lift it? | At least one observed evidence item |
| tip-accuse | Who can you point to and prove? | Known facts and a heard statement |

These questions guide interaction and do not certify a deduction. Conversational Wren remains the separate PlayerKnowledge choice path. That caller can submit its admitted exact text to narrate; missing takes retain full subtitles.

## Effects and diagnostics

`play` and `playAt` now include CastingChime, ToastTick, PullMemory and LiftInspect. Old cue names and `diagnostics(): {spatial,flat,tick}` are unchanged.

`narrativeDiagnostics()` adds queued, playing, played, fallback, rejectedDialogue, cueStarts, tickStarts, tickAge, tickDuration and tickPosition. These are playback observations, not fabricated `isPlaying` values.

The polish scenario calls Chime and ClockTick, then asserts tick.isPlaying after `nextFrame`. The shipped ClockTick MP3 independently decodes to approximately **0.98 seconds** (container duration 1.06 s). A degraded frame/LEAF delay longer than the clip can legitimately observe false. A backend start delay is another possibility; the old boolean alone cannot distinguish them. Suggested scenario fix: record starts before play, poll within a bounded early window, assert the tick start count increments, verify its dedicated component remains independent of Chime, and log age/duration/position on failure. Do not lengthen or loop the real tick merely to satisfy a late probe. This lane did not edit the scenario.

## Verification

The existing pure selector/guard suite passes **10/10 tests**, one worker, 38 ms test time (2.19 s process duration). First sandboxed config load failed with filesystem access denied; the authorized escalation rerun passed. The prior six audio-window/E8 gate tests also passed. This is not a runtime Audio compile/playback certification; main's Lens gate is required for pause/resume, timeline, mixing, subtitles and contextual cues.

All 304 final published audio files match staging byte-for-byte; ten presentation sprites also match. Exact costs are 2,888 ElevenLabs header credits, zero Claude dollars in this lane.
