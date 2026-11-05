---
status: draft
---

# Design brief: Roomscript

**Provenance — Run 7, November 5, 2026.** Roomscript's design and implementation began before this skill pack, in [the design](../docs/design/01-roomscript-design.md), [architecture](../docs/design/02-architecture.md), [storyboard](../docs/design/03-ar-staging-and-storyboard.md) and [plan](../docs/plan/IMPLEMENTATION_PLAN.md). Codex first consolidated this brief on November 4. At Wadood's explicit Run 7 request, Codex installed `challengepost/learn-specs` project-locally in `Tooling/skills/plan-lens` (initial `.agents/skills` install disappeared across a Lens restart), read its skill, AR rules, Preview limits and template, and applied `plan-lens` to Wadood's existing decisions. There was no new interview or new sign-off. This remains a draft of the requested build, not a completion certificate. The [skill review](run7-skill-review.md) records what the pack changed and the current evidence.

## The one spatial moment

Vale says she was making tea. Your kettle remembers being cold. Pull its memory out like a photograph, carry Vale's statement to the kettle, and watch **OBJECTION** fracture her account. A coral thread connects the words to the thing that disproves them; Vale answers in her own voice.

**For anyone who loves Clue and detective games:** a one-player murder mystery that casts your room as the crime scene. Voiced suspects and physical objections are the headline.

## Why it belongs on glasses

- Uses: shares your view, draws in the world, leaves your body free.
- The camera proposes furniture for the cast; the case puts testimony and evidence beside that furniture. You walk toward a suspect to question them, look down to the crate for case controls, and physically carry a statement to its contradiction.
- A laptop can run the same fair deduction rules. Glasses can keep the person, their words and your evidence in one continuous view while your hands act on them. Hardware comfort remains unproven.

## Product or overlay

- Type: a detective-game product that augments the room's furniture.
- What it senses: fixture types, possible witness/weapon/hiding-place/timekeeper roles, image boxes and proposed positions. Vision proposes; deterministic room binding, substitution, compilation and solving decide what is usable and whether a case is valid. The model never decides facts, lies, tells or verdicts.
- **Preset — The Harlow Trust (default):** HARLOW-1041 on hand-tuned Evening Room anchors, fully prerecorded voices and a fixed seed. Its sweep should replay a saved real scan, labelled **recorded scan**. Until the spike yields that scan, use and label **authored anchors**; never relabel authored data as a scan.
- **Dynamic — Cast my room:** a live simulated-room scan in Preview, then a new solver-verified case on the detected fixtures. Different seeds can produce a different murder in the same room. Phrase-composed speech serves generated statements; live free questions use permitted performances. Both modes share art, controls and effects.
- Preview stand-in/fallback: the Evening Room simulation; authored anchors and prerecorded lines if scanning or a local model bridge is unavailable. A fallback is visibly identified as such. No claim about sensing a real physical room follows from a simulated-room scan.
- The pack conservatively excludes live camera recognition from Preview acceptance. Wadood explicitly kept a bounded spike after a prior camera-stream probe worked. Recognition stays experimental until measured, with the authored presentation as the accepted fallback. The local model bridge is Preview-only; Gemini/device work is optional under Wadood's latest override. No provider branding is needed in the video. Keys stay in Tooling.

## Where things live

- The user looks between the speaking suspect and the real furniture relevant to their claim. Suspects have distinct marks; keep the centre walkway clear.
- **Crate lid:** mode selection before opening and compact case controls below eye level. One small world-anchored panel at a time. Never place a card across a speaker's face.
- **Suspect questions:** appear beside the nearest in-view suspect within about 1.5 m. At most three question chips plus More; targets at least about 2.5 degrees tall (about 4.4 cm at 1 m). Use 5 cm minimum at 1 m as an implementation default, and scale for the actual distance.
- **Furniture:** labels and memory prompts sit on or beside the visible Evening Room surfaces. Director/film mode hides stand-in boxes. Virtual props rest on real surfaces and remain few.
- **Memory/statement cards:** an icon plus three words until pinched open. A pulled photograph remains near the object and hand. Slips are large enough to carry reliably.
- **Feedback:** a small peripheral toast for about 2 s, near the task's view rather than on a far display edge. It must not cover the face or block the next pinch target.
- **Palette and type:** Anton for hero words, Courier Prime for cards. Coral `#FF6B5A` means certified truth, cyan `#3FE3FF` means claims, forensic yellow `#FFD60A` means attention, ivory `#FFF0D6` means people/captions, and brass `#E8B04A` means quiet board framing. Solid/dashed marks carry meaning as well as colour.

## Hands and input

- Pinch the crate tab to open; Preview/Director placement is automatic, with a tested fallback for controls.
- Walk up to a suspect; pinch a large question chip or More. A free typed question in Preview carries the same intent as speech on Specs.
- Pinch and pull a memory photograph from an object. Lift the cable or mug to inspect. Carry a statement to contradictory evidence to object.
- Drag a pawn and weapon into a room zone to suggest. Point/select a suspect to accuse, then hold the seal to commit. Standard SIK interactions carry Preview demonstrations; custom physical pointing is not claimed proven by mouse input.
- Targets are big and highlight when aimed at.
- Voice and equivalent control: questions remain available through chips and Preview text entry. Wren's What do we know? control uses only PlayerKnowledge. Neither microphone nor ASR is required for the Preview route.

## When things show

- The crate offers Preset/Dynamic only at the start. Opening and casting flow into the first question within about 30 s in the deterministic Preset route.
- Far away: zone names, silhouettes and dim room marks. Near an object: its memory prompt. Near an in-view suspect: its questions. Step back and questions recede.
- During speech: one short speaker-local subtitle line reveals words. Other panels recede. Story beats queue behind answers.
- Tells, including hesitation takes, occur only when the engine authorises them. A tell is a lead, never proof of guilt.
- One-line Wren tips appear once at the moment of need and ask rather than reveal. The optional notebook expands on demand; exclusions are marked on the room itself.
- Reconstruction shows cited truth and a faint replay of the player's route, with measured distance/visits. Unknown positions stay unknown. The freeze is 22:30; discovery was at 22:41.
- The ending begins with a stamp and named stars; detail expands on request. Correct, wrong and timeout endings are distinct. Confession/motive narration stays behind the engine's gates.
- Out-of-view attention uses a quiet spatial cue and, if necessary, a small directional hint (default); no permanent instruction wall.

## Done criteria

Each criterion has a Preview check; terminal-only evidence cannot pass its Lens portion.

1. **Complete Preset:** from the crate, reach a voiced first answer in about 30 s, carry a statement to evidence, and finish the naive-player route in at most 40 clicks. Strict bundled-voices and hero-demo pass on the current cast; save a replayable performance tape. Capture an uncut 60–90 s opening-to-answer segment.
2. **Readable spatial interaction:** Preview captures show one small panel, no covered face, at most three large question chips, distance-driven questions/memories, a pulled photograph, lifted prop, large carried slip and small transient feedback. Review all four suspects in five poses and the ending stamp. Real-hand comfort stays unproven.
3. **Room casting:** capture 3–5 viewpoints. A scan passes only if at least five objects land within about 25 cm, the case compiles and the sweep looks right in a capture. Otherwise ship the authored-anchor sweep and record no-go. Preset's recorded-scan fixture must come from an actual measured scan.
4. **Dynamic case:** three seeded Evening Room cases each compile, play to a verdict in the terminal and pass a LEAF smoke test; live-scan provenance and authored fallback are distinguishable. Speech can use phrase segments or explicit caption fallback if quota prevents generation.
5. **Truth-safe performance and ending:** a free Preview question produces a voiced in-character response through the allowed performance path; Wren answers only from PlayerKnowledge. All model outputs enter replay logs. Strict interrogation/all-tells and correct/wrong/timeout closing pass; Director captures show the letter, voicemail, flight, blackout, reconstruction and endings. Integrated results are reported per scenario, never inferred from compilation.

## Out of scope

- Multiplayer/Clue Night; Wadood will decide later.
- Always-on recording, identifying or following people; camera work is an explicit room-casting action in the simulated room.
- Claims of hardware-tested recognition, hand comfort, speech input or persistent spatial anchors.
- A free-speaking voice agent unless its spike proves engine-only facts; prerecorded voices remain the video's main path.
- Unrequested new mechanics. Feature freeze is **Sun November 8, 2026, 21:00 PKT**; then fixes only.

## Risks and open questions

- Run 6 proves 462 pure tests. Run 7 A2 now passes strict replacement-cast bundle playback (11.836 s) and repaired hero (169.471 s), with a saved Preview tape at `b3f4144`. Later Run 7 features still require the final integrated gate.
- The skill's Preview caution is deliberately retained: a camera stream is not object detection or 3D localisation. The room-scan spike must prove each stage independently.
- Runtime art, UI diet, narration, distance changes and new physical moments need fresh captures; offline contact sheets do not pass Lens acceptance.
- Safe free-text validation rejects some faithful lines. Keep permitted bank selection and authored fallbacks; do not relax truth safety for a more fluent demo.
- The bridge may be down, and provider quotas may run out. Use authored/prerecorded/phrase/caption fallbacks and continue development. Missing generations go into Needs Wadood.
- Additive brightness, fatigue, hand-tracking drops, spatial audio, keyboard/ASR and physical room alignment remain **feel unproven**.
- Music-plan eligibility, final video, public repository release and submission remain owner checks.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
