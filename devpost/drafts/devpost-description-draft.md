# Devpost submission text (final, Nov 8)

Paste-ready for the Devpost form.

**Project name:** Roomscript

**Elevator pitch:** A murder mystery in your own room on Snap Spectacles. Question four suspects in their own voices, show them what you find and catch the lie. AI performs; a rules engine keeps it fair.

**Video:** https://youtu.be/Lyoo6iMqbLQ

**Repository:** https://github.com/theBlackfish01/roomscript

**Built with:** lens-studio, spectacles, typescript, clad, lens-studio-mcp, leaf, spectacles-interaction-kit, ui-kit, codex, claude-code, elevenlabs, gemini, openai, vitest

**Images** (in `docs/captures/`):
1. `2026-11-08-run10-row-final.jpg`: "Walk up to a suspect: Ask, Show, Accuse."
2. `2026-11-08-run10-catch-final.jpg`: "A caught lie replays the truth where it happened."
3. `2026-11-08-run10-freeze-final.jpg`: "Walk around the frozen murder at 22:30."
4. `2026-11-08-run10-newspaper-final.jpg`: "The morning paper, built from how you played."

---

## About the project (paste into the story field)

### What it does
Roomscript turns your room into a crime scene. Edmund Harlow is dead, and four guests were in the house that night: a charming debtor, an immaculate trustee, a doctor guarding her sister's secret and a nervous art dealer. Each of them is lying about something.

You walk up to a suspect and three buttons appear beside them: **Ask, Show, Accuse**. They answer in their own voices. You find the evidence on the surfaces around you (a kettle, Harlow's recorder, a charger cable, a torn debt note) and show it to them. When a piece of evidence breaks a story, the suspect cracks, and a ghost replays what really happened at the spot where it happened. When you're sure, you accuse: who, where and with what, sealed with one pinch. Then you walk around the frozen murder and read about it in the morning paper.

### Who it's for
People who love murder-mystery games, escape rooms and detective board games: anyone who enjoys watching a character, testing their story and proving them wrong. A full case takes about 15 minutes, in your own living room.

### Why glasses
The suspects stand life-size in your room and the evidence sits on your own surfaces. You investigate by walking: up to a person to talk, over to the kettle to check it, back to show them. When a lie breaks, the truth replays where it happened. On a laptop this would be menus and a list of clues. On glasses, your room is the crime scene.

### Fair AI
AI characters can usually say anything, which makes a mystery unfair: a suspect might invent a clue or contradict the solution. Roomscript fixes that.
- A deterministic rules engine decides every fact, lie, tell and verdict before you start, and a solver proves the case can be solved.
- The AI only performs what the engine allows. Type your own question and the answer is generated live, then checked against what that suspect may say before a word is spoken.
- Every action goes into a log that replays the case exactly.

### How we planned it
We planned Roomscript with the Devpost Learn **plan-lens** skill.
- Its brief (`devpost/design-brief.md`) set our done criteria, each one checkable in the preview.
- Its AR habits shaped the interface: content on the thing it's about, a few big targets, and things that show when needed and then get out of the way.
- After every build we went through its "judge it" checklist.

That checklist also saved the project. By the ninth build Roomscript had a crate ceremony, a case board, an evidence web, palm menus, UV dusting and statements you dragged across the room. When I played it myself, the voices worked and the rest didn't:
- a second voice talked over the narrator;
- lines cut off;
- buttons jumped;
- the narrator explained the controls out loud;
- the evidence was furniture that "remembered" things for no reason.

We went back to plan-lens, rewrote the brief around one spatial moment (Vale's cold kettle), and rebuilt the game from it.

### How we built it
- **CLAD and the Lens Studio MCP.** Codex and Claude Code built the Lens over ten build runs.
  - CLAD procedures: lens-studio-router, editor-api, lens-api, specs-build-ui, scene-construction, live-lens-tester, and build-mesh (with analyze_glb) for the 3D props.
  - MCP tools: VirtualScene for every scene change, RecompileTypeScriptTool, RunAndCollectLogsTool, CaptureRuntimeViewTool and ConvertSvgToTexture.
- **LEAF tests for every done criterion.**
  - An automated first-time player solves the case in 25 pinches, with no drags.
  - A full voiced play has no overlapping or cut-off lines.
  - The Ask · Show · Accuse row never flickers at the edge of its range.
  - 655 engine tests and 5,000 fuzzed generated cases back the rules underneath.
- **Art and sound:**
  - stylised character illustrations from an image model;
  - props from Snap's text-to-3D generator;
  - paper evidence drawn in code;
  - voices from ElevenLabs designed voices for fictional characters.

### Challenges
- **Keeping AI faithful.** Strict checks reject some good lines as well as bad ones, so every check has a recorded fallback, and the case never depends on a live answer.
- **Long Preview sessions degraded,** as audio memory grew until Lens Studio stopped responding. We kept sessions short and restarted before every long test batch.
- **Our own feature list.** The hardest part was cutting features we had already built.

### What we learned
- **Design for a face, not a screen.** One voice at a time, one row of three buttons, evidence that someone in the story actually touched. Every feature we removed made the game easier to follow.
- **Separate the performance from the truth.** Let the AI act, and let the engine decide what's true.
- **A passing test isn't a good experience.** Automated tests proved the game worked. Playing it ourselves showed whether it made sense.

### What's next
- Wearing it on Spectacles hardware: comfort, hand tracking and brightness.
- New cases built from a scan of your own room (the engine already compiles and solves them).
- Spoken questions on the device.

### Disclosures
- **Recording:** recorded in Lens Studio's Preview, in a simulated room. Not yet tested on Spectacles hardware.
- **AI-generated assets:**
  - character art from an OpenAI image model;
  - voices and music from ElevenLabs (fictional characters, no voice cloning);
  - props from Snap's text-to-3D generator.

  Live answers to typed questions use Gemini through Snap's Remote Service Gateway and OpenAI text-to-speech.
- **Pre-existing code:** Snap's Lens Studio packages (Spectacles Interaction Kit, UI Kit, Remote Service Gateway) and a few MIT-licensed pieces listed in `NOTICE`. Everything else was written for this project.
