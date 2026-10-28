# Progress

Agents: keep this current. After a context reset, read this first. Newest entries at the top of the log.

## Status

| Stage | Status | Milestone | Verified by |
|---|---|---|---|
| A · Setup and probes | partial; MCP disconnected during package repair | not tagged | Preflight, template compile and runtime logs passed; see log |
| B · Truth engine | not started | `m1-terminal` | |
| C · Interrogation slice | not started | `m2-slice` | |
| D · Whole case | not started | `m3-case` | |
| E · Should tier | not started | `m4-should` | |
| F · Clue Night | not started | `m5-cluenight` | |

## Open issues / blockers

- **2026-10-28 19:51 PKT — active: Lens Studio MCP disconnected during dependency version selection.** Transport error: `error sending request for url (http://localhost:50040/mcp)`. Last confirmed: RSG 2.0.1 installed; SIK/UIKit 2.0.0; Utilities/SnapDecorators/Motion/Icons 4.0.0. Utilities and SnapDecorators downgrade to 2.0.0 was attempted but its completion is unknown. Package rename to `RemoteServiceGateway` was not confirmed. No Lens process appeared in a subsequent local process check. Reopen the project and inspect current packages before retrying; never assume the failed request made no changes.
- RSG 4.0.0 was initially offered by the newest-version Asset Library search. Installation unpacked dependencies but returned `Invalid transition from Immutable to Mutable. You cannot change model in Observers. Use Validators instead.` Wadood granted MCP permissions and authorized rechecking. Read calls recovered; RSG 4.0.0 was installed but did not compile against the template: it expects `UIKit.lspkg` and `InteractionKit.lspkg`. Asset Library resource metadata identifies it as Lens Studio **5.25.0**, while RSG **2.0.1** targets **5.23.0**. Pin compatible versions rather than editing generated Cache sources.
- No provider tokens generated, no gateway probes run, no Roomscript gameplay implemented yet. Do not interpret unavailable probes as gateway failures or choose the offline ladder from them.

## Current work packages

- [x] Read AGENTS, FIRST_PASS, implementation plan, core architecture and staging design.
- [x] Router `preflight_only`: correct project, Lens Studio 5.23.2.26081320, `isAuthorized: true`, MCP reachable.
- [x] Specs setup inspected: Camera Object = Perspective + DeviceTracking World; SIK root present; SIK/UIKit installed. Project target equals Spectacles.
- [x] Preview configured and read back as SPECS 27 / Interactive / Evening Room.
- [ ] A1 final capture and commit checkpoint (interrupted by package work).
- [x] A2 tooling scaffold: 21 Vitest tests passed (one file); git initialized, no remote. Tracked secret hook enabled; staged-content scan passed. Commit checkpoint recorded below.
- [ ] A3 compatible gateway dependency set, credentials scene wiring, all three tokens, clean compile/runtime.
- [ ] A4 ProbeLab P-a through P-g; P-h may wait until F.
- [ ] A5 model/fallback decisions from measured results, tag `m0-probe`.
- [ ] B truth engine → C interrogation → D whole case → E should tier → F gated Clue Night.

## Recovery / next run

1. Reconnect Lens Studio MCP after Wadood reopens `RoomScriptF.esproj`; inspect loaded project, packages, scene and compiler state.
2. Verify RSG 2.0.1, Utilities 2.0.0 and SnapDecorators 2.0.0 are installed. RSG archive currently has a spaced filename; resolve package self-imports using Lens asset tools, not filesystem/Cache edits. Check whether unused Motion/Icons 4.0.0 dependencies should be removed through package tools.
3. Finish A2 verification and commit if not already recorded below, then A3 token wiring via VirtualScene and authorized Editor API. Keep secrets out of all tool output and commits.
4. Build/run ProbeLab, record real measurements, then proceed to B with shared Types first and disjoint engine workers.

## Interim verification report / Preview tour

- **Stage status:** A partial; B–F not started. No milestone tags.
- **Lens verification:** template TypeScript compilation succeeded, followed by a refreshed runtime log with zero errors and `SIK Version : 0.18.0`. This is a baseline only; later RSG 4.0.0 installation introduced missing-module compiler errors. Its compatible-version repair is not yet verified.
- **Probes:** none run; latency, model choice, TTS, camera and sync behavior remain unmeasured.
- **Captures / LEAF:** no captures or LEAF scenarios completed yet.
- **Tooling verification:** 21 Vitest tests passed, including real template YAML, JSON/multiline credential stripping, malformed-scene rejection and staged-content regression. npm install and tests required scoped sandbox escalation; no policy changes were made. Use `npm.cmd` on this Windows host because PowerShell blocks `npm.ps1`.
- **Device:** all device behavior remains unverified. No device actions taken.
- **10-minute tour at this checkpoint:** there is no Roomscript gameplay to tour yet. After reopening: minutes 0–2, confirm the project and SPECS 27 Preview; 2–4, inspect Camera Object's Perspective / World tracking; 4–6, inspect the SIK hierarchy and installed package versions; 6–8, inspect Logger/compiler results while dependency repair resumes; 8–10, review this checklist and `docs/probe-results.md`. Do not expect suspects, chips, clues or an accusation flow yet. Replace this diagnostic tour with an actual feature tour when C/D are playable.

- 2026-10-27, late night: setup is blocked by a sign-in error. Wadood was asked to log in and got "Error"; registering a new account also failed. Which login it was (Claude Code CLI or Lens Studio's Snapchat account) isn't recorded yet. The first build run has not started.
- 2026-10-28: it was Lens Studio. This is a known issue: Lens Studio 5.24 added SPECS developer-account sign-in, and the hackathon's Devpost page advises using **Lens Studio 5.23.2** if you can't sign in on 5.24 (download: https://ar.snap.com/download/v5-23-2). 5.23.2 still meets CLAD's 5.22+ requirement. This project was created in 5.24.1, so if 5.23.2 won't open it, recreate it from the Specs Base Template and move `docs/`, `devpost/`, `NOTICE`, the custom part of `AGENTS.md`, the `.gitignore` additions and `.claude/settings.json` (the CLAD plugin) into the new folder.

- 2026-10-28: RESOLVED (pending sign-in check): Wadood installed Lens Studio 5.23.2 and created a fresh Specs Base Template project, `RoomScriptF` (5.24.1 had warned the old project may break). Docs, rules, ignores and the CLAD plugin were moved here. The old `Roomscript` folder is no longer used.

## Verify on device

- (none yet)

## Log

- **2026-10-28:** A2 tooling complete; checkpoint commit `A2: add tested tooling and secret guard; record MCP recovery checkpoint`. All 21 tests passed, hook enabled, staged scan passed. Current Lens files are included as an explicitly unverified package-repair snapshot; no milestone tag or playable-build claim. Git operations use a command-scoped safe-directory setting because sandbox and owner accounts differ; no global Git trust setting changed. No pushes/remotes.
- **2026-10-28:** First build run started in Codex. CLAD procedures loaded inline; generic worker `tooling_a2` assigned Tooling and tracked hook only. Node v22.14.0 available; `rg` absent, using PowerShell searches. MCP installation and disconnect errors recorded above.

- 2026-10-27: docs, plan and agent rules placed in the repo by Wadood's planning assistant. No code yet.
