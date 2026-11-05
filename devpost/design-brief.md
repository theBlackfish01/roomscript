# Roomscript design brief

Prepared by Codex on November 4, 2026, at Wadood's request. This is a retrospective consolidation of the project's October 25–27 [design](../docs/design/01-roomscript-design.md), [architecture](../docs/design/02-architecture.md), [spatial storyboard](../docs/design/03-ar-staging-and-storyboard.md), implementation work and [November 3 review](../docs/REVIEW_2026-11-03.md). It was not generated before the build by the organisers' `plan-lens` skill. Design intent and verified implementation are distinguished below.

## One spatial moment

Vale says she was making tea. The kettle remembers being cold. The detective drags the statement slip onto the evidence: **OBJECTION** flares, the statement fractures, and a coral proof thread connects the contradiction to the room. Vale changes her account because the engine has certified the contradiction.

The player should feel they caught a person using something they noticed, rather than selected a dialogue branch. The headset keeps the speaker, the statement and the evidence in the same space.

## Product and audience

An intimate detective game for mystery, escape-room and deduction-game players. One room, four suspects, one case and a short sequence of testable lies. The fixed hero case, HARLOW-1041, concerns Edmund Harlow's death. Each suspect conceals a concrete secret; the truth engine gives every crucial inference a supported route.

The interaction combines interrogation and physical evidence with a who/where/with-what deduction game. Time and credibility make choices consequential. The ending names what the player earned: solving the case, proving it and breaking the culprit's final account.

## Why glasses

The suspect's location is a claim. A tell directs attention to a physical evidence anchor. A gesture joins the words to the contradiction while both remain visible. A phone could display the same logic, but would flatten this continuous view of person, claim and place into separate screens. Whether glasses make these gestures comfortable is a device-test question, not something Preview proves.

## Where things live

- The case crate is the investigation desk. Passive cards, case briefing, proof slips and the timeline belong near its lid.
- Suspects occupy distinct marks around the room, with names above their heads and cards away from their faces.
- Five zones and thirteen evidence anchors turn the room into a readable board. This build uses manual alignment and explicit virtual substitutions, not automatic room recognition.
- Ivory marks observations, yellow marks attention and actions, brass supports quiet framing, coral marks certified contradictions/proof, and cyan denotes claims and gaze. Background darkness is not paint on an additive display.
- Production art aims for luminous engraving, distinct silhouettes, expressive poses and tell props that read at thumbnail scale. Art assets and their runtime wiring have separate acceptance gates.

## Hands and input

Pinch the crate tab to open the case. Choose a suspect and a topic chip; inspect objects for memories. Drag a statement to contradictory evidence. Place suspect/weapon pawns in a zone for a suggestion. Select the accusation and hold the seal to commit it.

All mapped questions must remain accessible with chips in Preview. Device keyboard and speech are optional input paths and require physical Specs checks. First-time hints and fewer than forty clicks for the naive-player route are intended acceptance targets, not current measured claims.

## When things show

The opening establishes the crate, victim, question and four guests before the case clock advances. During an answer, keep the speaker and one relevant card visible. Tells follow speech, but a tell is only a lead. An objection displays what was **SAID** and what is **PROVEN**. The timeline records admitted knowledge.

Timed story beats queue behind speech: the letter, voicemail, Pike's attempted flight and blackout/UV trace. Reconstruction uses only certified facts. Its freeze is 22:30; the body was found at 22:41. Unknown positions stay unknown. Correct, wrong and timeout endings need distinct voiced conclusions.

Audio directs attention and carries character: bundled voices with timing-driven mouths, Wren and narrator guidance, restrained room sounds and a composure-sensitive score. Stage mode must cover every hero-path line with actual audio; subtitle-only fallback is not acceptable for that gate.

## Done criteria

| Requirement | Evidence needed |
|---|---|
| Fair case | Unique solver result, independent refutation routes, regression tests and deterministic replay |
| Safe performance | Zero accepted attacks in recorded corpora; every model output audited; model cannot change truth |
| Playable Stage route | Strict integrated LEAF, real audio on every hero line, visible jaw movement and a bundled-audio performance tape |
| Readable art/UI | Reviewed contact sheets, Preview beat captures, distinct cast silhouettes, at most two panels in key scenes |
| Complete endings | Strict correct/wrong/timeout LEAF and no text overflow |
| Performance/size | S2 frame target checked after profiling; audio under 10 MB and exported Lens under 18 MB |
| Release | Final captures, truthful labelled live-AI beat, secret scan, complete notices and final video |

## Out of scope

Clue Night multiplayer, arbitrary room scanning, speculative extra mysteries and new mechanics are deferred. The feature freeze is November 7 at 21:00 PKT. Hardware-only interactions remain labelled unverified. New ideas go to `docs/later.md`.

## Risks and build notes

Strict prose validation still rejects many faithful natural answers: the latest holdout rejects 24/34 (70.6%) while accepting zero of 48 attacks. The preferred mitigation is mapped questions plus validated director/bank selection. Safety is not loosened to improve recall.

Preview processes degrade during long reload-heavy sessions. Restart before long captures and run bounded scenarios. Run 4 lost hours to a hung window-activation call; Run 5 forbids desktop/UI automation and uses MCP, shell and file edits. Each blocked dependency is recorded while independent packages continue.

The audio export is 9.91 MB with no runtime bank choice removed; duplicated sentence files are replaced with offsets into their original recordings. The new compressed export has file/coverage/offset tests and compiles, but its Lens runtime refresh timed out. Vale's requested voice swap is blocked by shell network access. These are current limits, not design changes.

## After the build: judge it

**Logic proven:** deterministic case/solver/reducer tests, strict validator corpora, replay tests and individual Preview scenarios at documented checkpoints. A four-suspect voice/jaw scenario passed before compression. **Feel unproven:** real-floor alignment, additive brightness, reading comfort, spatial audio, gesture fatigue and device performance. The complete Stage hero route and final integrated capture gate remain unfinished.

Review [PROGRESS](../docs/PROGRESS.md) for current package status rather than treating this brief as a completion certificate. Wadood's first playthrough should test whether a new player understands the question, distinguishes a tell from proof, can find the next action and can explain the ending in their own words.
