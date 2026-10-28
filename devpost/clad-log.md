# CLAD and Lens Studio MCP log

- 2026-10-28 21:02 PKT · B2 room engine · generic Codex worker tooling_a2, main MCP compilation/log review · 25 room tests pass, five fixtures bind, virtual substitution and deterministic room IDs verified; no Lens runtime exceptions.

- 2026-10-28 20:53 PKT · B1 pure engine contracts/core · Codex main + RecompileTypeScriptTool/RunAndCollectLogsTool · 39 Vitest tests pass, pure engine compiles in Lens; no runtime exceptions, known LEAF editor reset warning remains.

- 2026-10-28 20:49 PKT · A5 · CLAD-guided probe decision table · Gemini 2.5 Flash primary, OpenAI TTS, cache/LineBank/tape fallback and rate-limit cooldown; camera simulation verified, Imagen optional. A4 commit 143a315; m0-probe checkpoint.

- 2026-10-28 20:33–20:46 PKT · provider probes · PreviewInteractTool, RunAndCollectLogsTool, specs-ai-remote-service and specs-camera · complete chat/TTS batches; generated audio assets report playback; live camera shows Evening Room after image-material repair. No tokens logged. Initial concurrency/Imagen diagnostics retained separately from corrected runs.
- 2026-10-28 20:43 PKT · regression QA · live-lens-tester / run_leaf_scenario · panel scenario passed again with Image material assertion. Tooling worker added safe log aggregation, main added settled-batch regression; full Vitest suite 34/34.

- 2026-10-28 20:25–20:32 PKT · A4 panel and regression QA · specs-build-ui, script-author inline, specs-camera, specs-preview-interaction, live-lens-tester inline and LEAF skills · seven UIKit buttons, texture display and 20-sample probe controller; compiled with MCP. Fixed FlexLayout discovery/registration race and backing interaction ancestry. Two LEAF scenarios passed, including IK with diagnostic policy fail. Capture: docs/captures/2026-10-28-a4-probelab-running.png.

- 2026-10-28 20:10–20:20 PKT · recovery/A3 · editor-api-specialist inline, package-toolkit, specs-ai-remote-service, VirtualScene, ExecuteEditorCode · compatible RSG/dependencies restored, all three tokens generated and wired; TypeScript and refreshed runtime logs clean.
- 2026-10-28 20:17–20:20 PKT · baseline QA · verify-preview, preview-inspection, QueryRuntimeSceneTool, CaptureRuntimeViewTool, PreviewPanelTool · repaired auto-installed inspection package using 2.0.1; runtime query successful, expected empty overlay captured at docs/captures/2026-10-28-a1-baseline.png.

Evidence for the judging criterion "use of CLAD and the Lens Studio MCP". One line per significant use:
`YYYY-MM-DD HH:MM · what · skill / agent / MCP tool · result (files, captures)`.

- 2026-10-28 19:40 PKT · first-build preflight · lens-studio-router (preflight_only), lens-studio-field-notes, editor-api; ListAllPanels + ExecuteEditorCode · correct RoomScriptF project, LS 5.23.2.26081320, authorization true.
- 2026-10-28 19:42 PKT · Specs environment check · specs-project-init; VirtualScene read, ListInstalledPackagesTool, PreviewPanelTool · 118 scene objects / 44 assets at baseline; camera Perspective + World, SIK root, UIKit present; Preview set/read back SPECS 27 Interactive Evening Room.
- 2026-10-28 19:43 PKT · baseline verification · RecompileTypeScriptTool → RunAndCollectLogsTool · compile succeeded; zero runtime errors, SIK 0.18.0 runtime banner. No capture completed.
- 2026-10-28 19:44 PKT · gateway prerequisites · ensure-package-installed, specs-ai-remote-service; SearchLensStudioAssetLibrary + InstallLensStudioPackage · newest RSG 4.0.0 unpacked dependencies but installation returned Immutable-to-Mutable observer error; stopped Lens work and reported it.
- 2026-10-28 19:47 PKT · resume after Wadood's permission fix · ListAllPanels, ListInstalledPackagesTool, VirtualScene, RecompileTypeScriptTool · MCP recovered; 7 packages found, 118 scene objects / 57 assets; compiler exposed incompatible UIKit/InteractionKit imports.
- 2026-10-28 19:50 PKT · version compatibility repair · lens-package-toolkit, update-lens-packages, editor-api-specialist procedure inline; ExecuteEditorCode using Asset Library metadata · RSG 4.0.0 target LS 5.25.0; selected and read back RSG 2.0.1 target LS 5.23.0.
- 2026-10-28 19:51 PKT · dependency repair interrupted · ExecuteEditorCode · transport disconnected during Utilities/SnapDecorators 2.0.0 selection; package rename also unconfirmed. No token values generated or logged; recovery checkpoint in docs/PROGRESS.md.
- 2026-10-28 19:52 PKT · A2 tooling · Codex generic worker tooling_a2 (not a CLAD markdown agent) · staged-content secret guard, scene token stripper, tracked pre-commit hook, Vitest scaffold; 21 tests passed. No Lens code compiled with Node.

- 2026-10-26 · project created from the Specs Base Template · Lens Studio 5.24.1 · `Roomscript.esproj`, with Lens Studio's generated AGENTS.md and `.mcp.json`
- 2026-10-28 · project recreated in Lens Studio 5.23.2 because of the SPECS sign-in issue on 5.24 · Specs Base Template · `RoomScriptF.esproj`
- 2026-10-27 · CLAD plugin installed at project scope · `claude plugin install ls-clad@ls-extensions --scope project` · `.claude/settings.json`

- 2026-10-28 21:19 PKT — B3/B4 parallel pure-engine workers authored HARLOW-1041, fallback lines and human STORY, plus eight-check solver. Hero passes; 20 broken variants produce expected codes. Main integrated tuple-aware refutation.
- 2026-10-28 21:19 PKT — B5/B6 main reducer plus parallel safety worker: 13 reducer and41 safety tests, all authored lines admitted and adversarial samples rejected. CLAD RecompileTypeScriptTool succeeded; RunAndCollectLogsTool confirmed startup without Lens exceptions (known LEAF editor reset warning remains). No scene changes in these packages, so visual/LEAF checks remain the Stage A baseline until C1.
- 2026-10-28 21:24 PKT � B7 parallel engine worker built and verified terminal player; main integrated four tests and documented honest case-clock timing. B8 fuzz caught repeat-Hunch baseline bug, fixed with reducer regression.
- 2026-10-28 21:25 PKT � Stage B complete:170 Vitest tests,1000 players,29487 actions, terminal demo; RecompileTypeScriptTool + RunAndCollectLogsTool succeeded. B8 exposed and regressed inherited-baseline repeat rewards and circular breaker independence. CLAD builder loaded inline for C1; sound/music preflight found no FFmpeg, installed project-local tempAssetGen tool for acoustic verification.
- 2026-10-28 21:43 PKT � C1 inline specs-experience-builder + specs-build-ui, mesh-builder-scripting, materials, build-sfx/build-music, specs-audio and live-lens-tester:55 authored objects,7 materials,11 WAVs, five UIKit shells and plaques. AssetManager import verified, two-phase VirtualScene bootstrap, See-and-fix corrected layout/envelope-facing/first-play audio. Both shell LEAF scenarios pass fail-fast; four final captures reviewed. FFmpeg peak -0.4dB all assets; no human listening claim.
