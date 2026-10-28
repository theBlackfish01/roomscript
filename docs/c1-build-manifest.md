# C1 scene bootstrap

CLAD specs-experience-builder loaded inline once under FIRST_PASS §1b. Tier: mechanics-driven. Existing preflight/init trusted; scene refreshed. Phase tracking: setup complete; assets in progress; scripts, structure, compilation, wiring, audit and captures pending.

Theme: paper theatre and forensic light; coral truth, cyan claims, yellow markers, ivory people, brass board, chalk text. Preview furniture is explicitly requested stand-in geometry, not final generated art. Authored semantic roots retain all placement controls. The articulated case crate uses procedural MeshBuilder geometry; its separate lid can open. No AI-generated mesh is promised by this bootstrap.

| Surface | Dimensions cm | Position cm | Contract |
|---|---|---|---|
| PreviewRoom | full room | root (0,-160,0) | Wadood fixture floor coordinates, editor-only |
| Case crate |46×12×28| (0,-49,-110) | body and separate hinge/lid |
| CaseLidUI |46×11| (0,26,-110) | clock/pips/Hunches; notebook/wallet toggles |
| ChipBarUI |46×18| (0,-10,-110) | active person/topic and question chips |
| VerbBarUI |46×13| (0,-29,-110) | claim preview + Believe/Press/Object |
| NotepadUI |46×54| (0,0,-105) | hidden modal; grid/statements + close |
| EvidenceWalletUI |46×54| (0,0,-105) | hidden modal; evidence list + close |
| Interrogation mark |20×0.5×20| (30,-159,-160) | future actor target |

Dialogs replace chips/verbs while open. Main only validates references, builds passive UI and wires shell navigation. Game logic stays in Engine and a later bridge.

Audio manifest: Knock, TapeZip, CrateThud, ClockTick, Tink, Shing, Objection, Ratchet, Chime, ChalkScratch, BackgroundMusic. SFX are CLAD build-sfx presets/customized textures; low noir jazz bed uses CLAD build-music, piano and soft bass, no foreground melody. Inspector volumes and a diagnostic cue control make every generated cue auditable before gameplay wiring.

UI labels: ROOMSCRIPT; HARLOW-1041; 180 min; Pips 5; Hunches 0; Notebook; Evidence; Marguerite Vale; Where were you?; Your name; About the brooch; Ask anything; Believe; Press; Object; WHO / WHERE / WITH WHAT; Statements; Close; No evidence collected. Dynamic claim text wraps within the preview slot.

Placement verification must measure the UI, crate, stand-in desk/bed/door/window and mark; review two captures for lid motion. Runtime editor gate verified against StudioLib.d.ts deviceInfoSystem.isEditor(). Physical Specs remains unverified.

## Verified completion, 2026-10-28 21:43 PKT

All phases complete. Two bootstrap applies created55 authored objects and7 materials, then wired183 properties; targeted See-and-fix edits increased chip/verb panel heights, moved the crate left to avoid UI overlap, and turned envelope labels toward the viewer. Crate is now(-65,-49,-140); chip panel46x22 at(0,-7,-110), verbs46x14. Modal navigation hides the underlying HUD/chips/verbs.

- RecompileTypeScriptTool succeeds; no Lens runtime exceptions after the first-play audio fix. Known LEAF editor reset warning remains.
- LEAF roomscript-shell-navigation and roomscript-shell-ik-reach pass with diagnostic policy **fail-fast**. Navigation checks actual hand dispatch, modal exclusivity, editor gate, mesh/material availability, ten distinct cue playbacks, lid motion and label facing.
- Runtime bounds: caseHUD x[-23,23],y[18.5,33.5]; chips y[-18,4]; verbs y[-36,-22]. Four cm separates chip and verb surfaces. Crate x[-88,-42] does not overlap UI x[-23,23]. Desk minY=-160,maxY=-85; bed minY=-160; door minY=-160. Runtime meshes require QueryRuntimeSceneTool bounds; editor GetBoundingBox sees only authored root stubs.
- All11 WAVs imported through AssetManager.findCopyOrImport. FFmpeg peak checks are -0.4dB for every asset, with music played at0.10 volume. Playback state is verified; subjective listening quality remains for Wadood.
- Captures: c1-shells-fixed, c1-notebook, c1-crate-front and c1-crate-isometric in docs/captures. Initial c1-shells records the corrected layout defect. Two crate angles plus LEAF rotation assertions verify the articulated object.
- Static audit: no UIKit/Text in non-UI runtime controllers; all required WAVs/materials wired; music loops; no generated icons promised. Stand-ins deliberately remain simple geometry as requested; no final actor/art promised at C1.

Backend manifest: meshes=[] (procedural stand-in/component geometry); sfx=[Knock,TapeZip,CrateThud,ClockTick,Tink,Shing,Objection,Ratchet,Chime,ChalkScratch,BackgroundMusic]; icons=[]; ui_modules=[RoomscriptCaseLidUI,RoomscriptChipBarUI,RoomscriptVerbBarUI,RoomscriptNotepadUI,RoomscriptEvidenceWalletUI,RoomscriptZonePlaqueUI]; scripts=[RoomscriptMain,RoomscriptPanelUI,RoomscriptAudio,RoomscriptPreviewRoom,RoomscriptPropMesh,RoomscriptCaseCrate]; backend_deviations=[]; self_caused_limitations=[]; external_limitations=[physical Specs unverified].
