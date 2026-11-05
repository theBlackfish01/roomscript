# Devpost submission draft — Run 7

**Editorial draft; reconcile against the final Run 7 report before publishing.** Evidence below includes the Run 6 pure suite and Run 7 A2 baseline. Planned capabilities are not completion claims. The actual form and music-plan eligibility remain owner checks.

**Project name:** Roomscript

**Elevator pitch:** A one-player murder mystery that casts your room as the crime scene. Question voiced AI suspects and carry their words to the evidence. The engine decides the truth.

**Video:** TODO public YouTube video, under 3:00. **Full uncut playthrough/source:** TODO real continuous recording. **Repository:** https://github.com/theBlackfish01/roomscript (private until Wadood releases it).

**Candidate tags:** Lens Studio, Specs, CLAD, Lens Studio MCP, TypeScript, SIK, UIKit, LEAF, ElevenLabs, Claude, Codex, Claude Code, Vitest. Include a provider/device tag only if the final artifact uses it; verify required form tags.

## What it does and who it is for

Roomscript is a one-player murder mystery that casts your room as the crime scene, for anyone who loves Clue and detective games. A suspect speaks. A tell leads your eyes to an object. That object's memory contradicts the story. You carry the statement to the evidence and make a physical objection.

The authored story, **The Harlow Trust**, concerns Edmund Harlow's death and four guests with secrets. You question them, inspect evidence, test a who/where/with-what theory, then seal an accusation. Truth, lies, tells, refutations, proof and the verdict come from a deterministic engine. AI performs the permitted account; it cannot change the murder.

**Run 7's two-mode design:** Preset is the repeatable Harlow story with prerecorded voices and a saved-scan sweep; Dynamic scans the simulated room and compiles a new verified case on its furniture. The video should tell the Preset story, then show **same room, new murder** only if the Dynamic end-to-end gate passes. Until then, Dynamic is work in progress and authored anchors must not be called a recorded scan.

## Why glasses

The room is the board. Evidence belongs on the furniture, a suspect stands at a claimed location, and an objection physically connects their words to the thing that disproves them. The intended interface changes as you approach: room marks from far away, an object's memory nearby, and three large questions beside the nearest in-view suspect. The crate holds occasional case controls; faces and the room stay visible.

Those are the design goals behind the Run 7 UI pass. Hardware comfort is unproven, and a simulated-room demonstration does not prove real-room recognition.

## What we learned

**Design for a face, not a screen.** More panels did not make the mystery clearer. The judges' live review pushed us toward one compact panel, a few large pinch targets, short cards that expand on request, and small feedback that leaves quickly. We put the main moment back in the room: a person, a claim and a contradiction.

**Separate performance from truth.** Letting a language model invent facts makes a fair mystery fragile. Our engine fixes the case before play; it supplies a permitted current account, validates performance and records model outputs for replay. Rejected or late lines fall back to permitted authored text. Wren must answer from what the player knows, never from the hidden solution.

**Test the experience, not just the code.** Pure tests can prove a reducer or solver. They cannot show whether a face is obscured, a slip is too small or a new voice actually plays in the current scene. We use strict LEAF scenarios, runtime captures and actual performance tapes, and keep failed or incomplete gates visible.

## How the Devpost Learn skill pack helped

Roomscript's design began before we installed the pack. In Run 7 we used **plan-lens** to formalise Wadood's existing decisions and review them against the pack's AR rules and Preview limits. It helped turn a long feature list into five observable checks: a complete voiced route, readable spatial controls, measured room casting, three generated-case verdicts, and truth-safe live performance/endings.

Its recognition warning made the fallback explicit: a simulated camera stream alone is not a working room scan, and authored anchors are not scan results. Its after-build checklist made us separate **logic proven** from **feel unproven**, retain a continuous gameplay take, and make the next design changes measurable. The judges supplied the R1–R10 direction; the pack helped us apply and test it. [Brief](../design-brief.md) · [Recorded checklist and changes](../run7-skill-review.md).

## How we built it

Wadood directed the concept, scope and casting. Codex builds with CLAD's cross-runtime procedures, with bounded parallel lanes for engine/content, audio, art and publication. Claude Code contributed planning and independent reviews. The real history and limitations are preserved.

- **Truth engine:** plain deterministic TypeScript shared by Lens and Vitest. A case compiler, room substitutions and solver verify the case before play. The action log supports replay.
- **Performance:** authored and validated banks, exact-text bundled voices, engine-authorised tells, and guarded live replies. Synthetic ElevenLabs voices give fictional suspects distinct performances.
- **Lens:** SIK/ UIKit interactions, VirtualScene as the scene writer, Lens MCP compilation/logs, strict LEAF and runtime captures.
- **Local model work:** Claude is used from Tooling for content/validator studies; Run 7 permits a Preview bridge for vision and performance. Provider keys never enter Assets or the saved scene. Provider choice is an implementation detail; fallback behaviour and truth safety are the product contract.
- **Evidence:** [CLAD log](../clad-log.md), [decisions](../../docs/decisions.md), [current progress](../../docs/PROGRESS.md).

## Verified baseline and remaining gates

At the Run 6 checkpoint, **462/462 pure tests across 49 files** passed. Strict four-suspect playback passed after the new Vale library landed. A repaired hero route passed on the earlier cast; the replacement-cast hero call failed during registration before running. Those are different evidence snapshots. Run 7 A2 subsequently passed the replacement bundle in 11.836 s and the repaired hero in 169.471 s, with the new-cast tape committed at `b3f4144` (`Tooling/results/run7-a2-hero.json`). The final integrated gate for later Run 7 features remains separate and pending.

The saved validator corpora have zero accepted attacks out of 96 development and 48 holdout examples; 20/34 natural holdout answers still fail validation. That inspected corpus is regression evidence, not proof of universal language safety. Conservative fallbacks remain necessary.

Run 6's audio export is 9.95 MB. Art/contact-sheet generation is verified offline, but that does not certify runtime wiring or visual acceptance. No exported Lens size, final frame target or physical Specs comfort result follows from these numbers.

Before picture lock, update this section from the final report with the actual scan decision, generated-case seed results, current-cast hero tape, new UI/moment captures and continuous take. Omit any capability claim whose gate did not pass.

## Challenges

The main difficulties were keeping AI performances faithful, getting live voice within a useful deadline, preventing long Preview sessions from degrading, and moving from working prototype panels to a room-first experience. We retained authored/prerecorded fallbacks, restarted before long verification and capture sessions, and separated compilation from runtime acceptance. A provider quota stops only that generation lane; it does not stop the build.

## What comes next

Physical Specs evaluation: hand tracking, spatial sound, additive brightness and long-session comfort. Multiplayer remains deferred and is not part of this submission's claim. Unfinished Run 7 features stay explicitly listed in the final report.

## Disclosure and release checklist

Footage is Lens Studio Preview in a simulated room. The main Preset story uses authored lines and prerecorded synthetic voices; a live AI label is used only on a real live exchange. A recorded scan is frozen output of an actual scan, while authored anchors are labelled as authored. No real person's voice was cloned. No physical Specs test is claimed. Provider names need not appear in the video, but technical credits remain accurate in NOTICE.

Wadood still confirms the actual submission form, music-use eligibility, final public video and repository release. Add exact music/voice credits, a link to the continuous recording and the final test/capture report. Never claim completion from this editorial draft alone.
