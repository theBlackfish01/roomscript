# Run 10 LEAF retirement and migration

2026-11-08. Source changes only; no Lens runs or tests performed by this worker. Retired source and meta assets removed as well as LeafIndex imports/registrations, so removed APIs cannot leave unregistered compile failures. Git preserves historical tests.

## Removed files

- `Assets/Scripts/RoomscriptRun9CancelPullLeafScenario.ts`
- `Assets/Scripts/RoomscriptRun9CancelPullLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptRun8DustLeafScenario.ts`
- `Assets/Scripts/RoomscriptRun8DustLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptRun8PresentLeafScenario.ts`
- `Assets/Scripts/RoomscriptRun8PresentLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptCastingSweepLeafScenario.ts`
- `Assets/Scripts/RoomscriptCastingSweepLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptMemoryCardLeafScenario.ts`
- `Assets/Scripts/RoomscriptMemoryCardLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptPhysicalMemoryLeafScenario.ts`
- `Assets/Scripts/RoomscriptPhysicalMemoryLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptPointAccuseLeafScenario.ts`
- `Assets/Scripts/RoomscriptPointAccuseLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptShellLeafScenario.ts`
- `Assets/Scripts/RoomscriptShellLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptShellIKScenario.ts`
- `Assets/Scripts/RoomscriptShellIKScenario.ts.meta`
- `Assets/Scripts/RoomscriptObjectionLeafScenario.ts`
- `Assets/Scripts/RoomscriptObjectionLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptClueLeafScenario.ts`
- `Assets/Scripts/RoomscriptClueLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptProximityLeafScenario.ts`
- `Assets/Scripts/RoomscriptProximityLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptGeneratedCaseLeafScenario.ts`
- `Assets/Scripts/RoomscriptGeneratedCaseLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptGeneratedVoiceLeafScenario.ts`
- `Assets/Scripts/RoomscriptGeneratedVoiceLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptHeroDemoLeafScenario.ts`
- `Assets/Scripts/RoomscriptHeroDemoLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptReconstructionDetailsLeafScenario.ts`
- `Assets/Scripts/RoomscriptReconstructionDetailsLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptReadingPanelLeafScenario.ts`
- `Assets/Scripts/RoomscriptReadingPanelLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptPolishLeafScenario.ts`
- `Assets/Scripts/RoomscriptPolishLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptStoryMomentsLeafScenario.ts`
- `Assets/Scripts/RoomscriptStoryMomentsLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptStagingLeafScenario.ts`
- `Assets/Scripts/RoomscriptStagingLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptAllTellsLeafScenario.ts`
- `Assets/Scripts/RoomscriptAllTellsLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptRoomScanLeafScenario.ts`
- `Assets/Scripts/RoomscriptRoomScanLeafScenario.ts.meta`
- `Assets/Scripts/RoomscriptRun8DirectorLeafScenario.ts`
- `Assets/Scripts/RoomscriptRun8DirectorLeafScenario.ts.meta`

## Replacement coverage

- `roomscript-naive-player`: full voiced one-pinch route from physical case file to newspaper. Uses real SIK trigger controls only, derives answer from collected knowledge, records interaction count and complete action tape, samples caption ownership, audits start/end order and native overlap/early-end metrics. Nine-minute deadline.
- `roomscript-run10-director`: opening, row, ask, answer, find, show, where, weapon, freeze and newspaper capture staging, muted. Uses the same physical controls and knowledge-derived solution. Freeze capture must occur while production freeze exists; no engine truth bypass or synthetic scene.
- Existing audio-overlap, row-stability and interrogation retained.
- Tells, Cast, Opening, Closing, NextGlow and ContinuousCapture migrated to redesigned APIs and controls. BundledVoice now asks the natural alibi topic instead of a removed baseline. LiveAiBeat retains typed suspect performance, truth independence and replay checks; its removed Main.askWren path is gone.

## Why retired

Old pull/drag/memory/board/palm/Clue/UV/casting/body-accuse/shell scenarios require deliberately removed features. Old HeroDemo, reconstruction, ReadingPanel and Polish asserted removed scene structure; the new route/Director plus typed-question interrogation replace their applicable coverage. Old AllTells included baseline lies no longer offered; Tells now checks real account lies and deflection. Generated-case/voice/room-scan Lens scenarios are retired while generated cases remain deferred behind Another case; pure engine generation tests remain unchanged. Old Staging used crate-local UI and permanent zone plaques; new row/opening captures replace those checks.

## Assumptions requiring strict Preview verification

- Find targets remain named `RoomscriptObject_O*` (the actual production anchors); row controls are `Ask`, `Ask where@22:30`, `Show`, `Show O*`, `Accuse`. Guest names `Question S*` substitute for scripted walking in this interaction-only route.
- Closing names: `Where Z*`, `Weapon O*`, `Break seal`, `Another case`; its public diagnostics expose picked who/where/what. Driver pinches `More items` to reach paginated Show/Weapon pictures and includes those in the interaction count. Director uses `holdAtBeat("freeze", hold+5)` for a stable frozen-murder capture.
- New Opening has phase file then ready, control Open case file.
- Naive route is a scripted discoverability test, not evidence of a human first-minute study. First answer seconds and actual pinch count are logged, not assumed.
- Native audio/caption assertions need a fresh full Preview run; source inspection is not acceptance.

## Source-only final check

All remaining LEAF/Scenario local imports resolve after deleting retired assets. This is a filesystem dependency check, not a TypeScript compile or test run. No Lens tools or test runners used by this worker during the main agent's compile/capture work.
