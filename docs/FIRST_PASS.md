# Roomscript: first pass (mission brief)

You are building **Roomscript**, "Clue meets L.A. Noire, in your room", a Specs lens for Snap's "Learn AR with SPECS" hackathon. The deadline is **Tue Nov 10, 2026, 03:00 PKT**. Wadood (the owner) works a day job and wants **as much of the project as possible implemented in this one autonomous run**. Treat this as a long session:
- work through the stages in order;
- verify as you go;
- commit after every work package;
- keep `docs/PROGRESS.md` current so you can recover after a context reset.

## 0. Read first (in this order)

1. `AGENTS.md`, all of it: the Lens-managed block and the Roomscript rules below it.
2. `docs/plan/IMPLEMENTATION_PLAN.md`: authoritative work packages (Stages A–F), the CLAD map and the repo layout.
3. `docs/design/01-roomscript-design.md`: the game. Read it whole.
4. `docs/design/02-architecture.md`, §2–§14: schemas, prompts, validator, director, casting, closing, tapes, multiplayer and budgets. Ignore its §15 dates.
5. `docs/design/03-ar-staging-and-storyboard.md`, §0–§8: staging rules, set-pieces, sound, palette, storyboard.
6. `docs/design/04-ai-gameplay.md` and `05-clue-and-la-noire-research.md`, as needed.

Then:
- invoke `/lens-studio-router` with `mode: preflight_only`;
- run `/specs-project-init`;
- create a task list (TaskCreate) mirroring Stages A–F;
- start Stage A.

## 1. How to work

1. **Be autonomous.** Don't stop to ask unless the item is in §3, "Needs Wadood". Otherwise:
   - make the reasonable call within the design docs;
   - record it in `docs/decisions.md` (date, decision, why, alternatives);
   - keep going.
2. **The truth rule.** The deterministic engine decides every fact, lie, tell, refutation, objection and verdict. The LLM writes and voices. Never break this, not even temporarily.
3. **CLAD conventions** (from `lens-studio-field-notes`):
   - VirtualScene is the only scene writer;
   - load `ls-clad:editor-api` before any `ExecuteEditorCode`;
   - no raw HTTP to the MCP server, no `tsc` for Lens code;
   - the See-and-fix loop after each meaningful change: `RecompileTypeScriptTool` → `RunAndCollectLogsTool` diff → `CaptureRuntimeViewTool` → judge the pixels → fix;
   - 2+ captures for anything animated;
   - CLAD's definition of done (assets imported through tools, UI from UIKit, recompile and logs clean, capture reviewed).
4. **Testing:**
   - engine: `cd Tooling && npm test` (vitest), which must stay green;
   - Lens flows: LEAF via `ls-clad:live-lens-tester`.

   Don't mark a work package done until its acceptance check passes. Note in `docs/PROGRESS.md` how it was verified (test names, capture paths).
5. **Parallelism.**
   - Spawn workers only from the main session; nested subagents silently do nothing.
   - Use parallel general-purpose subagents for engine work on disjoint folders (Stage B), and later for engine halves of Stages E and F while you do Lens work.
   - Spawn `ls-clad:specs-experience-builder` once, for the C1 scene bootstrap, with the brief in the plan.
   - Other CLAD agents: `ls-clad:script-author` for batches of component scripts, `ls-clad:editor-api-specialist` for heavy Editor API work, `ls-clad:live-lens-tester` for LEAF, `ls-clad:specs-sync-kit-validator` after Sync Kit steps.
6. **Commits.** Commit after each work package (`git commit -m "B4: solver …"`), with the pre-commit secret check on, and tag the milestones (`m0-probe`, `m1-terminal`, `m2-slice`, `m3-case`, `m4-should`, `m5-cluenight`). **Never push, and never add a remote.**
7. **Secrets.**
   - RSG tokens are written into `Assets/Scene.scene` when generated and expire after about an hour. Never commit them live; strip or blank them before committing, as the hook enforces.
   - Never stage `*.pem`, `.mcp.json`, `ls-live-instance.json`, `.claude/settings.local.json` or `.codex/config.toml`.
   - Regenerate tokens via `/specs-ai-remote-service` whenever calls return `Unauthenticated`.
8. **What Preview can and can't do:**
   - ASR, mic input and Realtime are device-only;
   - the AR keyboard doesn't appear in SPECS 27 preview simulation;
   - camera-stream behaviour is checked by probe P-g.

   So every question must be reachable by chips. Free text goes through `/specs-keyboard` on device, and through a dev "Ask anything" chip list in Preview that sends the exact text down the live path.
9. **CLAD evidence matters** (a quarter of the judging). For every significant CLAD skill, agent or MCP use, append a line to `devpost/clad-log.md`: time, what, which skill or agent or tool, result. Save notable captures to `docs/captures/` with dated names.
10. **Scope.** Build only what the plan describes. Ideas go to `docs/later.md`. If a work package is blocked:
    - record the blocker in `PROGRESS.md`;
    - take the next independent package;
    - come back later.

## 1b. If you are running in Codex

The plan's wording is Claude-flavoured. Follow CLAD's own cross-runtime rules (`lens-studio-field-notes` → "Cross-runtime orchestration"):
- **Skills.** CLAD skills come from the `ls-clad` plugin; invoke them by name. If one can't be invoked, read its `skills/<name>/SKILL.md` from the plugin's install folder and follow it inline.
- **CLAD agents** (`specs-experience-builder`, `live-lens-tester`, `editor-api-specialist`, `specs-sync-kit-validator`, `script-author`). Codex can't spawn these markdown agents, which is not a broken install. Load `agents/<name>.md` and run its procedure inline in your own context.
- **Parallel engine work.** If your Codex build can spawn worker agents, use them for Stage B as described. Otherwise build Stage B sequentially, in this order: Types → room → solver → reducer → perf → hero content → player → fuzz.
- **Progress.** Use your plan tool in place of TaskCreate.
- **MCP tools** are surfaced as `mcp__lens_studio.<Tool>`, with no ToolSearch step. The Lens Studio tools are pre-approved in `.codex/config.toml`.
- **Asking Wadood.** You're in an interactive session. For a §3 item, end your turn with the question. Otherwise **don't end your turn just to report progress**: finish a work package, commit, update PROGRESS.md and continue with the next.

## 2. Run order

| Stage | Plan section | Milestone | Notes |
|---|---|---|---|
| **A · Setup and probes** | Stage A | `m0-probe` | Preflight, repo, git and secret hook, Tooling scaffold, RSG ≥0.2.0, tokens, ProbeLab P-a…P-h, decision table |
| **B · Truth engine** | Stage B | `m1-terminal` | Write `Types.ts`, then fan out subagents; hero case + `STORY.md`; terminal player; property tests; engine compiles in Lens |
| **C · Interrogation slice** | Stage C | `m2-slice` | C1 builder bootstrap (Wadood records it), engine bridge, actor, AI plumbing, live answers, tells and verbs, Objection |
| **D · Whole case** | Stage D | `m3-case` | Clue layer, opening, accusation and reenactment, casting, generation + overlay, fallback ladder, LEAF suite |
| **E · Should tier** | Stage E | `m4-should` | In the listed order; stop where the run ends |
| **F · Clue Night** | Stage F | `m5-cluenight` | Only if its gate passes; engine half (F1) may run in parallel earlier |

Not in this pass:
- device work, filming, Devpost;
- `/specs-publish`;
- remotes and pushing;
- stretch extras (LIAR!, Snap3D exhibit, Lyria score, Realtime banter for Wren), unless everything above is green.

## 3. Needs Wadood (the only reasons to stop and ask)

- **Lens Studio sign-in** (the router's gate), or Lens Studio crashing or being closed (MCP down). Ask him to relaunch it, then continue.
- **Permission prompts** only he can approve.
- **Creating a GitHub remote or pushing.**
- **Anything that needs the physical Specs.** Build it, mark it "verify on device" and continue.
- **Spending money, accepting terms, or publishing.**

Stopping is never the answer to a blocker. Record it under "Needs Wadood" in `docs/PROGRESS.md`, then take the fallback or move on to the next independent package (AGENTS.md rule 12).

Everything else, decide yourself and record it. That includes story details within the design, styling within the palette and technical choices. Wadood reviews `Content/STORY.md` and the captures later.

## 4. When you finish (or run out of road)

Update `docs/PROGRESS.md` with a final report, and say the same in chat:

1. **Status per stage:** done, partial or not started, with milestone tags.
2. **What's verified and how:** vitest counts, LEAF results, capture paths.
3. **Probe results and the decisions taken.**
4. **Known issues and anything marked "verify on device".**
5. **A 10-minute guided tour for Wadood:** what to click in Preview, in order, to see each feature.
6. **What the next run should do first.**
