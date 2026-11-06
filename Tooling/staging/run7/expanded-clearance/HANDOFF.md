# Stopped at staging — expanded memory/story clearance

User requested wrap-up. **Not published, not compiled, not runtime-tested. Assets unchanged by this batch.** No additional work should start during wrap-up.

Staging completed under `Tooling/staging/run7/expanded-clearance/`. Future guarded publisher: `node Tooling/staging/run7/expanded-clearance/publish.mjs`. It checks six source hashes before writes and refuses to overwrite the new helper if present. Rebase if main modifies any source before resuming.

Proposed changes:

- New RoomscriptPanelClearance.ts calculates the lowest of all four actual transformed panel corners and raises the presentation panel only, to supportY+3cm. All parent scales/rotations are included. No object anchor changes.
- RoomscriptMemoryCardView.ts caches support height and repositions only its expanded child; refreshes retained expanded views and resets relative offsets before recomputing.
- RoomscriptEvidenceWalletUI.ts exposes setSupportHeight to the existing positioning owner.
- RoomscriptSpatialObjectionController.ts supplies actual selected object support height to wallet/memory views after its existing placement; refreshes once when the existing reveal-scale animation finishes. No new frame snapshots or graph lookups.
- RoomscriptStoryMoments.ts caches each admitted card's support height, raises its expanded child on actual opening, and pauses that card root's existing camera rotation/entrance animation while modal so it cannot undo the corrected world clearance. Close resumes its existing compact animation. Anchors and engine state remain untouched.
- RoomscriptMemoryCardLeafScenario.ts checks actual expanded memory/wallet corners above the current Preset kettle's measured table support, unchanged anchor, and existing knowledge/7-prop assertions. Adds capture=none/memory/wallet/both, default none; hold default10, clamped1..20 seconds. Emits MEMORY_EXPANDED_CAPTURE marker only for requested holds.
- RoomscriptStoryMomentsLeafScenario.ts checks actual expanded letter/voicemail corners against the admitted plan's support and unchanged room-binding audit. Existing beats, truth and replay assertions stay intact.

Main registry update needed on resume: `roomscript-memory-cards` parameters `{capture:"none",hold:"10"}`. Capture example `{capture:"both",hold:"10"}` adds at most20 seconds total at those settings, or40 seconds total with two20-second holds. Every individual hold is<=20 seconds. No registry change was made here.

Pending verification: Lens compile, strict memory-card gate at current Preset viewpoint, actual expanded-memory/wallet capture, Story gate and expanded story capture. Source-derived expected bug: height76cm memory at support+35 with scale1..2 extends3..41cm below support; height58cm story at support+16 extends13cm below support in horizontal view. These calculations motivated staging; they are not claimed visual verification.

Other current status supplied by main: reading-panel strict IK passed49.343s; correct/wrong/timeout closing passed63.117/65.455/117.404s before final title/pawn cleanup. Interrogation gate was still in flight when wrap-up arrived. Earlier published cable correction physical gate passed43.753s, seven-prop memory gate34.846s, Cast/proximity15.676s, point-accuse strict IK33.964s. Do not transfer those passes to this unpublished batch.
