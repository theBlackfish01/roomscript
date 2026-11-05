# Run 5 CLAD evidence — 2026-11-04

Codex main session; two workers at most. No desktop/computer-use tools used by the main session. Shell jobs are bounded; no full suite overlaps rendering or LEAF.

| PKT | Skill / tool | Work and observed result |
|---|---|---|
| 22:39 | lens-studio-router (preflight_only), editor-api, ListAllPanels, ExecuteEditorCode | Correct project, signed in. Read §1b and inline live-lens-tester procedure. |
| 22:41 | RecompileTypeScriptTool, RunAndCollectLogsTool | Existing Run 4 edits compile. No startup errors; refresh activity 19 ms. |
| 22:42–22:43 | specs-leaf-run-in-preview; open/list/run LEAF | Strict interrogation and all-tells pass on fresh process. |
| 22:44 | run_leaf_scenario hero-demo, log tail | Hero baseline fails at 48.911 s: `TypeError: Cannot read property 'holder' of undefined`. Mixed testimony/evidence solver roots incorrectly treated as evidence only. Scenario fixed; pure regression added. Full rerun remains pending. |
| 22:46–22:48 | lens-api, specs-audio; RecompileTypeScriptTool | Added exact-text bundled VoiceLibrary, engine-authorized mood/tell choice, character-aligned jaw and source-track segment support. Attached judged performance/register banks to runtime graph. Mixer now imports generated score/SFX with tension crossfade and speech ducking. |
| 22:48:18 | strict roomscript-bundled-voices LEAF | Pass in 13.342 s: four cast members, jaw peak 0.8, max same-frame start measurement 0 ms, zero network requests, zero subtitle fallback. **This was before compressed alias export.** |
| 22:50–22:52 | RecompileTypeScriptTool, RunAndCollectLogsTool | Compressed alias export compiles, but refresh times out with no activity. Lens operations stopped under AGENTS MCP failure rule; no raw HTTP fallback. Full hero audio, captures and compressed playback remain unverified. |
| Run 5 | specs-lens-perf-attribution, specs-capture-perf-trace (read only) | Profiling procedure loaded. MCP failure occurred before trace capture; no new S2 frame-time claim. |
| Run 5 | Codex audio worker | Offline size/coverage contracts; new ledger segment, attempted requested voice save blocked by shell network access. No new paid generation. |
| Run 5 | Codex art worker | Dependency-free production renderer after npm network/cache access failed; output and contract evidence in Tooling/art and captures. |
| Run 5 final offline gate | Codex shell / Vitest native configuration | 439/439 tests across 46 files, one worker, 86.84 s after rendering stopped. Pure Engine/Content/Tooling typecheck passed. Current text and reachable-history secret audits clean. |
| Run 5 art acceptance | Codex art worker and main visual review | Revised faces and silhouettes after thumbnail review. 26 contracts pass, 98/98 PNG/GLB hashes reproduced, four 1080p30 clips decode. Art remains unwired in Lens; OFL font sourcing pending. |

Git staging failed twice with `.git/index.lock: Permission denied`. No commit, push or tag claimed. These Git failures are workspace restrictions. Automatic approval review separately rejected art-worker cleanup of duplicate prototype folders as potentially irreversible; those folders remain untouched. Rule 15 says skip approval-dependent actions.
