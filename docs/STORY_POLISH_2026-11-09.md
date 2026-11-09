# Harlow story and dialogue repair — November 9

The target is Wadood's Lens Studio Preview demo. The cast, culprit, physical evidence, contradiction chain and verdict rules are retained.

## Story and performances

Twenty-two authored accounts replace the repetitive factual delivery. They include the suspects' initial alibis, admissions after evidence, observations of other guests and objects, and four new public background answers. Imran borrowed to protect his father's shop; Vale managed Harlow's trust; Okafor knew him professionally; Pike is his art dealer. The background question is second, after the alibi. Relationships and motives now emerge through conversation without exposing the later admissions early.

There are 32 new complete recordings: 29 suspect performances (including alternate alibis and Vale's pressed accounts) and three narrator observations for the knife, candlestick and bookend. ElevenLabs eleven_v3 used the existing cast voices, individual delivery directions and stability 0.5. Character-cost headers report 1,491 credits. Exact words and directions are in SCRIPT_2026-11-08.md; generation receipts are in Tooling/audio/harlow-natural-manifest.json and the shared ledger.

Authored variants remain bound to the engine's current account reference and layer. Every spoken answer still passes validation and enters the action log. New background facts are public and do not decide the murder. The production factory now owns the complete performance bank; Preview testing caught and corrected the bridge overwriting it with the historical bank.

## Interaction corrections

- An opening mouse release cannot also select a newly displayed menu choice: choices wait 300 ms after binding. Imran's knife question occupied the former Ask position, making this a plausible source of the reported wrong question. Alibi remains first; diagnostics now log the selected suspect, topic and statement.
- The knife's clickable width is 30 cm, covering its 22 cm model; the former target was only 18 cm. Character colliders retain full height and head coverage but exclude broad transparent side margins that could intercept nearby props.
- Knife, candlestick and bookend now have narrated inspection responses. Re-inspecting a known item repeats its observation when speech is idle, without charging extra time or interrupting another voice.
- Pike's unrelated flight timer is retired from the production case. Talking to Imran no longer makes another guest run to the door merely because elapsed game time crossed a threshold.

## Verification

- Full regression suite: 668 tests in 89 files passed after final production-bank integration.
- Lens TypeScript compilation and refreshed runtime passed without errors.
- New story-flow LEAF passed: five alibi selections across all four people, correct repeat take, background answer, native ray hit at the knife handle edge, initial and repeated inspection speech, no extra inspection time, no Pike movement and no TTS fallback.
- Every shipped speech asset (948) decodes to silence throughout its final 350 ms. New clips retain the verified 44.1 kHz stereo 128 kbps format and 600 ms tail.
- All 32 new recordings passed native AudioComponent completion and duration checks in Preview. Per-clip measurements and alibi-selection evidence are retained in Tooling/results/story-polish-verification.json.
- Full native case play passed: correct verdict, 25 clicks, 105 game minutes, exact action replay, 2,770 caption samples, zero caption mismatches, overlaps or early endings.
- Director Ask passed. Captures retained in docs/captures/story-polish-ask.png (close framing), story-polish-ask-wide.png (readable menu, no face overlap) and story-polish-knife.png. Earlier baseline: preview-polish-ask-final.png. Knife runtime bounds cover x=-175..-145 cm, centred on its visible model at x=-160 cm.

Session hygiene: project saved before restart. Two graceful close attempts did not exit the active Lens Studio process; the owner's earlier force-close authorization was then used for that process only. Fresh project/sign-in handshake at approximately 22:54 PKT, one restart this run. No GUI automation. Existing local Scene.scene edits are excluded from this commit.

At 23:02 PKT, an automatic editor OAuth refresh reset Preview after eight native clip checks. No assertion failed; that interrupted run was discarded and the complete voice test restarted after sign-in settled.

The native timing checks establish complete playback, not a subjective listening review of acting on the owner's speakers. Device export acceptance remains outside this Preview-only task.
