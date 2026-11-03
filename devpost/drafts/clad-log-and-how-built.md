# Rewritten `devpost/clad-log.md`: structure, plus the "How it was built" section

**Agent instructions** (for the overnight run):
- Build this from the existing `devpost/clad-log.md`, `git log --date=iso` (with tags), `docs/decisions.md`, `docs/PROGRESS.md`, `docs/captures/` and the LEAF scenario files.
- **Move the current file to `devpost/clad-log-raw.md` unchanged** (it's the contemporaneous record).
- Don't invent entries, times or results. If a field is unknown, write "not recorded".
- Fix the spacing typos only in the new file.

---

```markdown
# CLAD and Lens Studio MCP build log: Roomscript

> Evidence for "Technical Implementation: how well did the project use CLAD, Lens Studio and the Lens Studio MCP".
> Contemporaneous raw log: [clad-log-raw.md](clad-log-raw.md). Times are PKT (UTC+5).

## Toolchain
| | |
|---|---|
| Lens Studio | 5.23.2.26081320. The project was recreated from the Specs Base Template on Oct 28 because Specs sign-in failed on 5.24.1. |
| CLAD | `ls-clad@ls-extensions` (lens-studio-devs/ls-extensions), installed with project scope: `claude plugin install ls-clad@ls-extensions --scope project` → `.claude/settings.json`. Version/commit: TODO |
| Lens Studio MCP | Lens Studio-managed `.mcp.json`. It is not committed because it holds a local token. |
| Agents | **Codex**: main builder; applies CLAD skills as inline procedures (FIRST_PASS §1b); parallel generic workers for disjoint pure-engine and tooling packages. **Claude Code**: design, implementation plan, two independent review rounds (eight reports; confirm reviewer agent). Models: TODO |
| Human | Wadood: scope, design approval, Lens sign-in and permissions, credential generation approval, pauses, reviews. |
| Rules | Scene edits only through the MCP (VirtualScene/ExecuteEditorCode). Commit after every verified package. Gateway tokens blanked before every commit (hook-enforced). Strict LEAF `fail-fast`. |

## At a glance
| Evidence | Count | Where |
|---|---|---|
| Commits / milestone tags | 49 (+ publication) / m0-probe, m1-terminal, m2-slice | `git log` |
| LEAF scenarios | 21 | `Assets/Scripts/*Scenario.ts` |
| Reviewed Preview captures | 34 | `docs/captures/` |
| Vitest | 411 / 37 files | `Tooling/` |
| Studies | production performer (28 live calls); validator red-team | `docs/*study*` |
| MCP bug found | 1 | `docs/mcp-bug-report.md` |

### CLAD skills used (uses in log · example)
| Skill | Uses | Example |
|---|---|---|
| live-lens-tester / specs-leaf-run-in-preview | 13 | E4 engine-bridge LEAF passed fail-fast in 1.539 s |
| script-author | 6 | C4 Gemini/OpenAI transport and TTS cache |
| specs-ai-remote-service | 5 | A5 provider probes; AI P1 token refresh without printing |
| editor-api / lens-api | 7 | … |
| specs-build-ui (UIKit) | 4 | C1 five UIKit shells |
| scene-construction | 4 | L1 13 object anchors, 5 zones |
| interaction-recipes | 3 | C7 DragInteraction for statement slips |
| specs-audio · build-sfx · build-music | 3 · 1 · 1 | 11 procedural WAVs, peak -0.4 dB |
| shader-graph · vfx-graph · mesh-builder-scripting · materials | 2 · 1 · 2 · 3 | C6 gaze-line GLSL; C7 shards |
| specs-camera · specs-keyboard · specs-project-init · router/field-notes · package-toolkit · preview-inspection | … | … |

### Lens Studio MCP tools (mentions in log)
VirtualScene 33 · RecompileTypeScriptTool 20 · RunAndCollectLogs 19 · ExecuteEditorCode 16 · PreviewPanelTool 6 · CaptureRuntimeViewTool 4 · ListAllPanels 4 · PreviewInteractTool 3 · MovePreviewCamera 2 · run_leaf_scenario 2 · ListInstalledPackagesTool 2 · QueryRuntimeSceneTool · SearchLensStudioAssetLibrary · InstallLensStudioPackage · ConvertSvgToTexture

## Timeline (chronological, one row per work package)
| When (PKT) | Package | Agent | CLAD skills | MCP tools | Verification | Evidence |
|---|---|---|---|---|---|---|
| 10-26 | Project from Specs Base Template (LS 5.24.1) | Wadood | — | — | — | — |
| 10-27 | CLAD installed, project scope | Claude Code | — | — | — | `.claude/settings.json` |
| 10-28 19:40 | Preflight, Specs environment check | Codex | router, field-notes, specs-project-init | ListAllPanels, EEC, VirtualScene, PreviewPanelTool | compile and runtime clean | — |
| … | (every row from the raw log, sorted, plus its commit hash from git log) | | | | | |

### Stage A: setup and provider probes (m0-probe)
### Stage B: deterministic truth engine (m1-terminal)
### Stage C: interrogation slice (m2-slice)
### Stage D: whole case (opening, clue, objection, closing, placement, offline mode)
<!-- Short paragraph per stage, then its rows. -->

## Human in the loop
- Oct 25–27: design and plan chosen (docs/design, docs/plan).
- Oct 28: LS 5.23.2 recreation; permission fix that unblocked the MCP; requested pause (WIP 260d801).
- Oct 28–29: two independent review rounds → fix lists (docs/REVIEW_*).
- Every live-AI run: Wadood-authorised token generation; tokens blanked before commit.

## Where the tools fought back (and what we did)
| Problem | Fix | Evidence |
|---|---|---|
| InstallLensStudioPackage picked RSG 4.0.0 (LS 5.25), Immutable→Mutable error, no rollback | Pinned RSG 2.0.1 + Utilities/SnapDecorators 2.0.0 | mcp-bug-report.md, decisions 10-28 |
| MCP transport dropped mid-repair | Checkpoint and resume procedure | PROGRESS |
| Native VFX asset null at runtime | 30 CPU mesh shards | decisions 10-29 C7 |
| Gemini schema rejects uniqueItems | Provider-schema projection plus regression | C4 |
| LEAF/JS execution timeouts in long Preview runs | TODO (outcome of Nov 3–4 run) | d7-timeout capture |
| Approval-service timeouts on git | Retry rule (AGENTS.md 12) | — |

## Verification boundary
**Logic proven:** solver, reducer, AI validation, stage-by-stage Preview LEAF, offline golden replay.
**Feel unproven (device):** placement on a real floor, additive readability, spatial audio, ray drops, ASR, performance.
```

---

## "How it was built" (for the README and Devpost, about 180 words)

Roomscript was built by coding agents directed by one person. **Codex** was the main builder: it applied Snap's **CLAD** skills as procedures and changed the project only through the **Lens Studio MCP**:
- VirtualScene and ExecuteEditorCode for every scene edit;
- RecompileTypeScriptTool and RunAndCollectLogs after every change;
- run_leaf_scenario, PreviewPanelTool and CaptureRuntimeViewTool to see and fix what the player sees.

Parallel workers built the pure TypeScript engine and the tooling. **Claude Code** wrote the design and implementation plan, and ran two independent review rounds (eight reports; confirm reviewer agent) whose fix lists drove the next pass.

The work moved in staged packages:
- A: setup and provider probes;
- B: the deterministic truth engine and solver;
- C: the interrogation slice;
- D: the whole case.

Each package ended in a commit only after its tests, a strict LEAF scenario and a reviewed Preview capture passed: 49 commits, 21 LEAF scenarios, 411 tests and 34 captures. CLAD's build-sfx and build-music generated every sound.

When the tooling broke, we wrote it up: the MCP installed an incompatible package version (`docs/mcp-bug-report.md`). Every decision is in `docs/decisions.md`, and every tool call that mattered is in `devpost/clad-log.md`.
