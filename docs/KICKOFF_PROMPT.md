# Kickoff prompt (first pass)

Paste this into a fresh Claude Code session started in this folder, with Lens Studio open on this project and you signed in.

```
You're starting the first build run for Roomscript in this Lens Studio project. Lens Studio is open on this project and I'm signed in.

Read AGENTS.md, then docs/FIRST_PASS.md, and follow it end to end:
- Preflight first: /lens-studio-router with mode preflight_only, then /specs-project-init.
- Then work through Stages A to F in docs/plan/IMPLEMENTATION_PLAN.md, in order.

I want a massive portion of the project done in this pass, so keep going stage after stage without waiting for me:
- Use parallel subagents for engine work, and CLAD skills and agents for all Lens work.
- Verify each work package (vitest, See-and-fix captures, LEAF).
- Commit after each work package.
- Keep docs/PROGRESS.md, docs/decisions.md and devpost/clad-log.md current.

Only stop for the items under "Needs Wadood" in FIRST_PASS.md. Make every other call yourself and record it.

When you finish, or are truly blocked, give me the final report described in FIRST_PASS.md §4, including a 10-minute guided tour of what to try in Preview.
```

**In Codex**, add this line after the first paragraph: `You're running in Codex: follow §1b of FIRST_PASS.md for how CLAD's skills and agents work here.`

For later runs, replace the first line with "Continue the Roomscript build" and add: "Read docs/PROGRESS.md first and pick up from the next unfinished work package."
