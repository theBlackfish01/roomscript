# Lens Studio MCP package compatibility and preview tooling issues

Observed 2026-10-28 on Windows, Lens Studio **5.23.2.26081320**, Codex MCP client, signed-in Specs Base Template project `RoomScriptF`. Template packages: SpectaclesInteractionKit 2.0.0 and SpectaclesUIKit 2.0.0.

## 1. Newest package selection can install an incompatible editor generation

**Trigger:** Search the Asset Library for Remote Service Gateway using newest-only selection, then install the returned resource through `InstallLensStudioPackage`.

**Actual:** RSG 4.0.0 and dependencies were imported, but the install returned:

```
Invalid transition from Immutable to Mutable. You cannot change model in Observers. Use Validators instead.
```

The imported package then failed TypeScript compilation because it references `UIKit.lspkg` and `InteractionKit.lspkg`, while the template contains `SpectaclesUIKit.lspkg` and `SpectaclesInteractionKit.lspkg`. Asset Library metadata identified RSG 4.0.0 as targeting Lens Studio 5.25.0; RSG 2.0.1 targets 5.23.0. The reported install failure did not roll back the files/dependencies.

**Expected:** choose a version compatible with the running editor/template, or report the incompatibility before modifying the project. A failed installation should clearly describe any partial changes.

**Recovery verified:** RSG 2.0.1 with Utilities/SnapDecorators 2.0.0, correct archive names, clean compilation and runtime. No generated Cache edits.

## 2. Preview inspection auto-install introduces compiler errors

**Trigger:** call `QueryRuntimeSceneTool` in a project without its inspection handler.

**Actual:** the tool auto-installs AiPreviewAgentInspect and resets Preview, then reports:

```
AiPreviewAgent handler was installed but didn't respond after the preview reset.
```

Compilation showed missing `UIKit.lspkg/...` and `InteractionKit.lspkg/...` imports in the package's Example/GuideDismissPanel and Example/ExampleCarousel scripts. The tool's suggested retry cannot fix these compile errors. Attempting `IPackageRegistry.selectVersionFromAssetLibrary` on that auto-installed package returned `Package is not registered in the Asset Library`.

**Recovery verified:** install explicit AiPreviewAgentInspect 2.0.1 through `InstallLensStudioPackage`, wire its AgentInspectScript using VirtualScene, remove the incompatible archive with AssetManager, rename the compatible archive. Runtime query and CaptureRuntimeView then succeed. AiPreviewAgentInteract 2.0.1 also compiles and drives buttons.

**Expected:** the auto-install should use compatible dependencies and register package provenance, and distinguish compiler failure from a slow Preview reload.

## 3. Additional reproducible tool behavior

- `VirtualScene` create without a temporary `id` created the SceneObject but silently omitted the requested ScriptComponent. Result included `idMapping: {"undefined": "..."}` and no errors. Explicit `_addComponents` fixed it. The tool schema presents `id` as optional; either require it or apply components without it.
- `PreviewPanelTool` screenshot reported success and a saved path when the parent output directory did not exist, but no file was created. Creating the directory first made the same call save successfully. Expected: create parents or report the write failure.
- Opening the LEAF panel reset the running Preview and interrupted an in-flight probe batch. This should be documented as a state-changing operation.

## Crash observation (cause not proven)

During a combined Utilities/SnapDecorators downgrade call, MCP disconnected with `error sending request for url (http://localhost:50040/mcp)` and a subsequent local process check found no Lens Studio process. Wadood relaunched Lens Studio. Performing the version changes one at a time after restart succeeded. This sequence is evidence of a crash/disconnect during the operation, not proof of its internal cause. Permissions had also been adjusted during the session; their causal role is unknown.

No credentials, tokens or raw provider response bodies are included in this report.
