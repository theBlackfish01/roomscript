# Devpost submission: draft

<!-- I couldn't see the actual form (403). Open "Enter a submission" by Thu and add any custom questions. The page asks for: what the Lens does, who it's for, what you learned. Map each section to a criterion: Design / Technical Implementation / Innovation-Idea / Presentation. -->

**Project name:** Roomscript

**Elevator pitch (under 200 chars):**
A murder mystery staged in your room on Snap Spectacles. AI suspects improvise, but a solver-proven engine decides the truth. Break lies by dragging evidence across the room.

**Video:** TODO YouTube link (public, under 3:00)
**Try it out:** TODO GitHub repo link
**Built with (tags):** lens-studio, spectacles, snap-specs, clad, lens-studio-mcp, typescript, spectacles-interaction-kit, spectacles-ui-kit, leaf, remote-service-gateway, gemini, openai-tts, codex, claude-code, vitest <!-- add any required tags from the form -->

**Gallery (3:2, about 1200×800):**
1. hero: the objection shatter;
2. the crate opening with the chalk outline;
3. Vale's tell (gaze line);
4. the suggestion sweep;
5. the verdict and case seal;
6. the architecture diagram;
7. an agent and MCP session screenshot.

Each caption ends with "Lens Studio Preview, simulated room".

---

## Inspiration
<!-- Idea criterion: the problem and why it matters -->
Murder mysteries are one of the oldest social games: Clue's fair deduction and L.A. Noire's face-to-face interrogations. AI should make them endlessly replayable, but language models invent facts, so an AI-run mystery can contradict itself and is rarely *fair*. We wanted the opposite division of labour: **a machine that proves the case is solvable, and an AI that only acts it out**. Glasses let that case happen *in your own room*.

## What it does
<!-- Design criterion: a complete, coherent loop -->
Roomscript turns your room into the crime scene for one complete case, *HARLOW-1041*:
- **Place the case:** align fixture markers to your furniture. A knock, the crate's tab pulls, the light comes up, the chalk outline races across the floor, and four suspects arrive.
- **Interrogate:**
  - ask topic questions (chips work in Preview);
  - each suspect has a baseline and **tells**: a gaze line flicks to the object they're hiding;
  - answers can be **live AI** (Gemini through Snap's Remote Service Gateway, voiced by TTS) or authored lines in Stage mode.
- **Objects remember:** inspect the kettle, lamp or window glass for memory cards.
- **OBJECTION!** Drag a contradicting statement onto the lie. The world freezes, the slip shatters, a proof thread links the evidence, and the suspect falls back to her next account.
- **Suggest** a who/where/what. The refutation sweep circles the suspects, and one privately shows a card.
- **Accuse:** hold the seal. A truth reconstruction plays, then your deductions are scored against the shortest fully supported route.

**Who it's for:**
- mystery, escape-room and board-game fans who want a sit-down detective night at home;
- later, groups of friends (Clue Night, co-located multiplayer, is designed).

## How we built it
<!-- Technical Implementation: CLAD + Lens Studio + MCP; be concrete -->
**Agents did the building; Wadood directed.**
- Codex was the main builder, applying CLAD skills as procedures, with parallel workers for pure engine and tooling packages. Claude Code handled design, planning and two independent review rounds (eight reports; confirm reviewer agent).
- Every scene edit went through the **Lens Studio MCP**, and every package ended with a compile, a runtime log check, a strict LEAF scenario and a reviewed Preview capture:
  - VirtualScene, ExecuteEditorCode;
  - RecompileTypeScriptTool → RunAndCollectLogs;
  - run_leaf_scenario, PreviewPanelTool/CaptureRuntimeViewTool for see-and-fix;
  - PreviewInteractTool, MovePreviewCamera, ConvertSvgToTexture.
- **CLAD skills used:** specs-build-ui and UIKit shells; specs-ai-remote-service; specs-audio; live-lens-tester and LEAF; scene-construction; shader-graph (the gaze-line shader); vfx-graph; mesh-builder-scripting (crate, chalk, shards); interaction-recipes (drag); build-sfx/build-music (every sound and the score).
- **Architecture: truth is compiled, not generated.**
  - A pure TypeScript engine owns every fact, lie, tell, refutation and verdict. A solver proves a unique solution with independent routes.
  - The LLM receives a truth-blind fact sheet, and its lines pass **seven validation gates** before they are spoken. Late or rejected lines fall back to an authored line bank within 6.5 s.
- **Verification:**
  - 411 Vitest tests;
  - 1,000 fuzzed players (29,487 actions);
  - 5,000 generated cases accepted by the solver;
  - 21 LEAF scenarios;
  - a 28-call live-AI study in Preview;
  - a Claude-generated red-team of the validator (0/96 attacks accepted after fixes).
- 49 commits, one per verified package, with milestone tags. The full trail is in `devpost/clad-log.md`.

## Challenges we ran into
- **Package versions:** the MCP installed a Remote Service Gateway built for a newer Lens Studio, which broke the project. We pinned compatible versions and **wrote up the MCP bug** (`docs/mcp-bug-report.md`).
- **Latency vs honesty:** live text p50 was 2.4 s, but first audio was 5.1 s and only 18 of 28 answers were voiced in time. We built a deadline-driven pipeline with caption fallback and a fully offline **Stage mode**.
- **The validator** can't be both safe and permissive: an independent holdout still rejects about half of natural paraphrases. We chose safety, with authored fallbacks.
- **Native VFX** came back null at runtime, so the objection shatter is 30 CPU-animated mesh shards.
- **Preview stability:** long integrated LEAF runs hit JavaScript execution timeouts. <!-- update with the outcome of Run 1 -->

## Accomplishments that we're proud of
- A complete, fair, solver-proven mystery whose AI can't break its truth.
- Spatial Objection: deduction as a physical gesture in your room.
- Agent-built end to end, with tests, LEAF scenarios and studies, rather than "it compiled".

## What we learned
<!-- The page explicitly asks for this -->
- **Designing for glasses:**
  - additive displays make black transparent;
  - text and cards belong beside a speaker's face, not over it;
  - cards anchor to the crate;
  - a physical gesture beats a menu for the key moment.
- **Agent building:** agents are fast but need a definition of done they can check, such as LEAF scenarios, captures and commit-per-package. Most of the real bugs were caught by a screenshot or a strict scenario, not by the compiler.
- **AI in games:** keep the model away from truth; let it perform. Measure latency and rejection honestly, and design the fallback first.
- **Labels:** *logic proven* (tests, solver, Preview) vs *feel unproven* (comfort, readability and audio on real Specs).

## What's next
- Test on Spectacles hardware.
- In-Lens case casting from the compiler (any room, new case).
- Voice "Objection!" through ASR on device.
- Clue Night: two detectives, one room (Sync Kit).

## Honesty note (put at the end of the story)
All footage is Lens Studio Preview with a simulated room. Most dialogue in the video is Stage mode (authored lines); one labelled exchange is live AI. AI voices are synthetic. Not yet tested on Spectacles hardware.
