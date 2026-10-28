# CLAD and Lens Studio MCP log

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
