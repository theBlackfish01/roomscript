# Run 10 removal audit

Read-only audit of the current authored `Assets/Scene.scene` and flat `Assets/Scripts` adapters, 2026-11-08. No Assets edits or tests performed for this audit. The main agent is concurrently rewriting Main, Opening, Closing and Interrogation; this records the dependencies before that rewrite. UUIDs below are authored scene-object UUIDs, not runtime nodes or script assets. Scene changes must use VirtualScene, not hand-edited YAML.

## Minimum safe change set

The old flow is not isolated in its own scene subtree. Remove the old presenters only after replacing their resource wiring and interaction ownership. In particular:

1. **Reparent retained crate children first.** `RoomscriptCrate` contains `RoomscriptCast`, `RoomscriptClosing`, `RoomscriptQuestionUI` and `RoomscriptSubtitleUI`. Deleting the crate recursively without moving these destroys the new loop's cast, ending, typed questions and subtitles.
2. **Replace direct and transitive dependencies.** Main's old UI inputs, Cast's chip/verb layout code, NextGlow's lid Accuse token, CaseModes' crate/casting callbacks, and Closing/Opening's `clue.objection.tells` resource access all require edits before the retired classes can disappear.
3. **Replace Object/Show interaction ownership.** SpatialObjection currently owns all object pinch/pull targets, evidence dispatch and the crack/shatter. New Find and Show must supply one-pinch evidence discovery and the engine-authorized break effect before removing it.
4. **Rewrite StoryMoments, do not simply delete it.** Pike's attempted flight and recorder voicemail survive. Its letter/voicemail floating memory cards, blackout, UV material traversal and lid dependency leave the flow.
5. **Rewrite ObjectReplay, do not simply delete it.** Keep its ghost renderer, but start it on a successful broken statement, at the truth's place, for five seconds. It currently starts after every discovery, includes the kettle W14 hint, and writes narrator subtitles directly. These are incorrect for the new loop.
6. **Retain object/zone anchors.** Delete visible zone plaque children, not `RoomscriptZone_Z*`. Tape/storm/replay/closing still use room structure and O8/O10. Furniture can remain structural stage data without being interactable evidence.
7. **Remove retired LEAF imports/files along with registrations.** Lens compiles every TS asset, including unregistered scenarios; removing a registration alone does not remove obsolete imports or API accesses.

## Source dependency map

Names in this table have the `Roomscript` prefix and `.ts` suffix unless otherwise stated. Runtime helpers are plain classes instantiated by Main; they have no authored script-component node to delete.

| Retire/rewrite target | Current inbound production dependencies | Minimum replacement |
| --- | --- | --- |
| CaseBoard | Main, ClosingController | Remove Main construction, Closing board stamping; ending reads deterministic state directly. |
| BoardArt | CaseBoard only | Delete after CaseBoard; shared picture rendering for the new row should use the new row's own item view. |
| EvidenceThreads | Main only | Remove construction and associated runtime web. |
| HandMoments | Main only | Remove construction, UV/flashlight/palm gestures and its SpatialObjection dependency. |
| NotepadUI | Main, ClueController | Remove all Notebook/Wren-page routing; preserve any explicit Wren question path separately if wanted. |
| EvidenceWalletUI | Main, SpatialObjectionController | Found items come directly from engine knowledge into Show pictures. |
| CaseLidUI | Main, SpatialObjectionController, StoryMoments, NextGlow | Remove palm/lid HUD, counters and token actions; NextGlow targets row Accuse instead. |
| SpatialObjectionController | Main, ClueController, HandMoments | New physical Find targets; Show dispatches deterministic Object; reuse independent crack/shatter renderer if needed. |
| ClueController | OpeningController, ClosingController | Remove pawn/suggestion/refuter callbacks; wire flow, room, audio/materials directly. |
| CaseCrate | OpeningController | One physical case file replaces crate placement/pull ceremony. |
| CrateArt | OpeningController only | Delete with crate engraving/geometry. |
| CaseFiles | OpeningController | Replace two-file selection and drag with one case-file pinch. |
| DragInteraction | CaseFiles, ClueController, OpeningController, SpatialObjectionController | Delete after these users are gone; no main-flow holds or drags. |
| ChipBarUI | Main, InterrogationController | Remove build, events, paging/render/status calls and inputs; use ConversationRow. CastController also dereferences `flow.chips` without importing the type. |
| VerbBarUI | Main, InterrogationController | Remove Believe/Press/Object legacy buttons and render calls; CastController also dereferences `flow.verbs`. |
| CastingController | Main, CaseModes | Remove furniture-label presenter and blocked predicate. RoomScanner and deterministic generation may remain. |
| CaseModes | Scene component; several LEAFs | Rewrite for Another case, without opening.onBeat pull, casting.begin, or `opening.clue.objection.tells.audio`. Existing offline scan callbacks also call old opening.scanStatus/scanReady. |
| ZonePlaqueUI | Authored scene components only | Delete five place-name plaques and three old envelope labels; retain generic PanelUI for accusation cards. |
| MemoryCardView | EvidenceWalletUI, SpatialObjectionController, StoryMoments | Delete after StoryMoments removes floating memory-card presentation. |
| ArtLibrary | CaseBoard, SpatialObjectionController, StoryMoments | Delete only after all three are removed/rewritten; do not delete referenced shipped textures indiscriminately. |
| ReadingPanel | Main, ClueController, InterrogationController | **Keep** typed Ask your own review-panel placement. |
| QuestionUI | InterrogationController | **Keep**, reparent out of crate. |

Other production changes needed beyond the four main rewrites:

- **CastController:** remove `flow.chips`/`flow.verbs` placement and scale accesses; place only row and subtitles. Remove guest-point questioning and old body-selection accusation targets if who always comes from the row. Keep persistent actor registration and ConversationFocus hysteresis. Knee name tokens are an additional conversation action path; make their production behavior consistent with the sole-row rule (Preview-only if retained for staging).
- **NextGlow:** constructor currently requires CaseLidUI and lights `lid.tokenRoot("Accuse")`; replace with row token. Filter discovery hints to RUN10_FIND_OBJECTS, otherwise it leads the player to retired furniture. Its accuse condition expects filed deductions; align with the new readiness logic rather than requiring removed notebook filing.
- **RoomBinding:** preset initialization updates existing anchors only, while the audit requires all graph objects. Create O14/O15 anchors for the new papers. Render only playable item props, while retaining invisible structural furniture anchors. Keep O8 door and O10 window for tape and storm. New certificate sill position must be visually checked; it was a content-side candidate, not a measured surface.
- **TellVisual:** no direct old-UI import; keep its flow/room/audio/materials. Opening/Closing currently reach these resources through Clue/Objection; rewire directly. Its composure segments and gaze-line/tell visuals need deliberate visual acceptance, not accidental removal with Objection.
- **Main:** remove CaseBoard/EvidenceThreads/HandMoments construction; old notebook/wallet handlers, counters, old UI availability label and story-blackout hooks. Preserve storm, route samples, speech/subtitle wiring, typed input polling, Wren truth gate, replay and NextGlow with updated APIs.
- **StoryMoments:** remove floating letter and voicemail cards and modal UI; preserve flight and engine-gated recorder voicemail. A physical O13 letter already replaces letter reveal timing. Remove UV/blackout material mutation.
- **ObjectReplay:** currently direct `subtitles.set("NARRATOR", ...)` can overwrite an active voice; route any retained spoken/caption observation through the arbiter. Preserve its fact-gated ghost art.

## Authored scene deletion/reparent inventory

All listed nodes were enabled in the inspected scene. A node hidden at runtime is still authored and still creates its scripts/UI on start.

| Node | Scene-object UUID | Action |
| --- | --- | --- |
| RoomscriptCrate | `1bc54cfd-c533-40f8-a297-84ae8eed61f0` | Delete after retained children are moved. Includes CrateBase/Front/Back/Left/Right/bands/hinge/lid. |
| RoomscriptCaseLidUI | `0d29988b-7e2b-4c72-aacf-da4832dc4eb7` | Delete (under CrateLid). |
| RoomscriptChipBarUI | `bbb74de4-2534-424d-b245-2e2c924d3724` | Delete. |
| RoomscriptVerbBarUI | `14ef3211-0c6a-455e-b19e-6cd06e773699` | Delete. |
| RoomscriptNotepadUI | `8a98966c-4836-4e22-8bee-f6704f14f1d9` | Delete. |
| RoomscriptEvidenceWalletUI | `895cc2f2-76ad-4013-8240-95b34e8b21d7` | Delete. |
| RoomscriptObjection | `dbc63759-bab3-411d-9e4d-580f66f41398` | Delete after Find/Show replacement. |
| RoomscriptClue | `baa78423-0542-41dd-8dd2-21cf19720280` | Delete after rewiring resources and Closing. |
| RoomscriptCasting | `583fc991-47b7-45de-86f9-5c9c50a20361` | Delete. |
| RoomscriptCaseModes | `649b0889-82ca-40c3-adaa-fd1693bea4a4` | Rewrite/rebind for Another case, or delete if generation deliberately deferred. |
| RoomscriptQuestionUI | `4b709316-1eb6-43f0-bea0-0a83b0b1038f` | **Move out of crate, retain.** |
| RoomscriptSubtitleUI | `ed6e2173-fad5-491f-9670-d202a9854c02` | **Move out of crate, retain.** |
| RoomscriptCast | `48cf6a5f-91a5-4a5e-a8ed-557dabda1df6` | **Move out of crate, retain.** |
| RoomscriptClosing | `9bd0ec86-8f51-4c66-a96f-fd38de20c02b` | **Move out of crate, retain rewritten component.** |
| Study plaque | `356f3c3a-a0ee-4704-9301-026f50f0442d` | Delete child only; retain Zone_Z1. |
| Lounge plaque | `f07e27a4-a0f7-43c4-9e55-b5e8233535b4` | Delete child only; retain Zone_Z2. |
| Hall plaque | `e39bc86f-d634-4f2c-b50b-e01bcad19066` | Delete child only; retain Zone_Z3. |
| Kitchen plaque | `974267b9-b7c1-4d03-953b-a8e6cb5addc8` | Delete child only; retain Zone_Z4. |
| Conservatory plaque | `c7ceca32-5495-4169-ba13-8c79624a8ba5` | Delete child only; retain Zone_Z5. |
| Envelope WHO | `f8eff1ab-4e50-46f5-aef8-f84d81de5922` | Delete old label; inspect/reuse parent only if new seal needs its geometry. |
| Envelope WHERE | `142e37b8-b899-40dc-b1de-beaf92964cc2` | Delete old label. |
| Envelope WHAT | `af2fad00-6b61-47ca-97ec-233ccf0ad428` | Delete old label. |

Keep RoomscriptCaseRoom, actor nodes, RoomscriptTells, RoomscriptAudio, engine, interrogation, LLM client, RoomscriptTts, camera/player and PreviewRoom. In particular, RoomscriptSuspectSlot under RoomscriptAnchors is the fourth actor and owns RoomscriptTts; it is not an obsolete spare actor. Reparenting should preserve world transforms before new layout code takes ownership.

## Runtime-only nodes that disappear when their builders stop

- SpatialObjection: `RoomscriptStatementSlip`, `RoomscriptMemoryCard`, `ObjectionControls`, `RoomscriptObjectionStamp`, `RoomscriptObjectionPaths`, pull/lift photo targets. Their old object colliders must not compete with new Find colliders.
- Clue: `RoomscriptPawn_S*`, `RoomscriptChalk_Z*`, `RoomscriptZoneGrid_Z*`, `Chalk zone name`, `Chalk zone cross`, `RoomscriptWeaponGrid_O*`, `RoomscriptSuspectGrid_*`, `RoomscriptSuggestionGhost`, `RoomscriptRefutationBlade`, `RoomscriptRefutationCard`.
- Opening: `RoomscriptCaseFiles`, `RoomscriptLidLight`, Opening motes, fixture brackets, `RoomscriptPlacement`, `RoomscriptFloorCross`, `RoomscriptNearObject_O*` and PINCH + PULL prompts. **Keep/recreate `RoomscriptDoorTape`, Tape band A/B, `RoomscriptChalkBody`, Opening chalk strokes.** Narrator subtitle slot currently belongs to crate opening caption; provide a replacement before deleting crate.
- Casting: `RoomscriptScanMark_*`, Furniture/Role/Surface pin labels. `begin()` is already silenced in phase 1, but build still constructs markers; complete deletion removes that residual scene system.
- StoryMoments: `RoomscriptStory_letter`, `RoomscriptStory_voicemail`, Story compact/expanded, `RoomscriptUVMemory`, UV memory label.
- CaseLid: `RoomscriptPalmGroup` can detach with `setParent(null)` while tracked. A fresh Preview reload is required after removal; deleting the authored lid alone may leave the existing runtime palm root alive.
- Main helpers: board, web, flashlight and hand overlays have no authored node to remove; stop construction and reload Preview.

## LEAF retirement and migration

Retire these registrations **and their obsolete scenario source assets/metas**; Git retains historical behavior. Their required interaction is intentionally removed, so do not keep them red or rewrite them as meaningless passing stubs:

- `roomscript-run9-cancel-pull` / Run9CancelPullLeafScenario
- `roomscript-run8-dust` / Run8DustLeafScenario
- `roomscript-run8-present` / Run8PresentLeafScenario (lift/present gesture; new Show is covered by naive-player)
- `roomscript-casting-sweep` / CastingSweepLeafScenario
- `roomscript-memory-cards` / MemoryCardLeafScenario (board, crate file cards, wallet)
- `roomscript-physical-memory` / PhysicalMemoryLeafScenario
- `roomscript-point-accuse` / PointAccuseLeafScenario (body selection and old modal pawn behavior; who now comes from row)
- `roomscript-shell-navigation` / ShellLeafScenario
- `roomscript-shell-ik-reach` / ShellIKScenario
- `roomscript-objection` / ObjectionLeafScenario (pull-slip drag)
- `roomscript-clue` / ClueLeafScenario
- `roomscript-proximity` / ProximityLeafScenario (superseded by row-stability plus new row selection coverage)

Migrate these rather than delete their useful coverage:

| Registration | Required change |
| --- | --- |
| audio-overlap / row-stability | Keep green; migrate fixture setup, old UI checks and opening calls to new APIs. |
| naive-player | Entire one-pinch Find/Ask/Show/Accuse route, deterministic winning verdict, real action count. |
| opening | One case file, existing guests, Harlow then two narrator lines, tape/outline/rain; no crate pull. |
| closing | Row-selected who, chalk Where cards, picture With what cards, one seal pinch, reaction/tableau/stats/newspaper. |
| reading-panels | Retain typed-question panel clearance only; remove notebook and clue modal assumptions. |
| story-moments | Flight and recorder voicemail only; remove letter timer/cards and UV assertions. |
| run8-director | Rename/rewrite as Run10 Director using new captures; preserve capture tooling, replace old Question/Present/board/crate targets. |
| cast / staging | Preserve identity/actor geometry checks; remove wallet/chip/verb/crate/lid imports and assumptions. |
| next-glow | New find list and row Accuse token; no furniture suggestions. |
| generated-cases / generated-voices | New row, no sweep, physically grounded evidence; remove `opening.clue.objection` and chip accesses. |
| hero-demo / continuous-capture / production-study / polish-foundation | New opening and route APIs; several reach audio/flow through `opening.clue.objection`. |
| interrogation / live-interrogation / tells | Remove old chip/verb selector assumptions while keeping speech/truth/tell assertions. |
| room-scan-probe | Scanner audit can remain; remove CastingController visualization dependency. |

Other engine/AI/voice/binding/actor/probe scenarios can remain, but check common setup helpers for crate API accesses. Reconstruction-details should retain truthful frozen-murder coverage. Low-level probe IK remains a diagnostic, distinct from removed production drags.

## Recommended removal order and evidence

1. Land new Find/Show/Accuse APIs and new direct resource inputs. Update Main, Opening, Closing, Interrogation, Cast, NextGlow, StoryMoments, ObjectReplay, RoomBinding and CaseModes together to eliminate old runtime coupling.
2. Reparent retained crate children and wire new inputs using VirtualScene. Delete old authored UI/controller/plaque nodes. Preserve anchors and character art.
3. Migrate retained LEAF scenarios, remove retired registrations/imports/files, then delete unreferenced old adapter files and their `.meta` files. Re-scan **all** Assets TS, not just active components, for old type names and `flow.chips`, `flow.verbs`, `opening.clue`, `clue.objection`, `main.wallet`, `main.caseLid`, `main.caseBoard`, `main.hands`, `main.threads`.
4. Compile through Lens MCP; inspect missing references rather than masking them with optional chaining. Fresh Preview reload removes detached runtime leftovers.
5. Run new naive-player, row-stability and audio-overlap strict. Capture opening/row/Find/Show/accusation/tableau/newspaper and visually check the wearer checklist. Search runtime scene for retired node prefixes and competing interactables.
6. Delete now-unreferenced art/source helpers only after the all-Assets dependency scan. Keep pure Engine historical mechanisms/tape schema as required by tests; retiring presentation does not authorize deleting deterministic actions or rewriting old tape history.

No tests were run for this audit; the report is dependency evidence, not verification of the eventual rewrite.
