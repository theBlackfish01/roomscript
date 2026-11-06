# Refutation placement and ending cleanup

Staged only. Publish with `node Tooling/staging/run7/refutation-ending/publish.mjs`. Requires the already-staged reading-panel helper to be published first. Five current source hashes are checked before any write. No registry changes.

RefutationCard copied wallet's local position at construction, before later wallet movement. It retained the same buried crate-relative position. Clue now places that card once at the moment an engine-authorized private refutation completes, using the shared camera-relative/world-locked reading-panel helper (54 by 36 cm). No private card content or truth decision changes. Existing Clue gate now checks actual world scale, floor clearance and all Close-refutation button corners within the card, then uses its original real pinch to close.

Closing.showInvestigation now also calls Clue.showPawns(value). Accusation modal/reveal hides the pawn parents and therefore their child renders and interactions; cancel/reset restores them. Clue's regular cross/marker updates cannot re-enable a disabled pawn parent. The strict Point scenario checks all pawns hidden while choosing and restored after real Cancel. Closing tests check pawns hidden during modal and ending, no stale seal/cancel/question/verb controls, and the actual Details -> Back-to-stamp navigation.

Only the ending title's `Label` SceneObject is scaled .82. The row and 50x16 stamp image remain unchanged. Closing test measures the Text layout rectangle's transformed corners against the actual stamp ScreenTransform offsets; this covers both CASE CLOSED and the longer CASE UNPROVEN, not just one string. Existing correct/wrong/timeout engine assertions remain intact.

No compile/test/Lens calls during main's timeout gate. Required after publish: compile, Clue gate, strict Point gate for cancel restoration, and Closing correct/wrong/timeout with fresh stamp captures.

## Remaining popup audit (read-only; not patched here)

- Wallet and objection/memory root already reposition via SpatialObjection.placePanel, so no stale crate-position fix was applied to them. However, expanded memory is 76 cm high while placePanel adds only35 cm above the support and may scale1..2. At a horizontal panel orientation its lower edge is support+35-38*scale, i.e. 3..41 cm below support. That needs a targeted expanded-card clearance check before changing placement; the compact34 cm panel is different.
- Story letter/voicemail cards use room-relative support+16 cm, not the crate's stale local transform. The 58 cm expanded detail lower edge is support-13 cm in a horizontal view, and compact46 cm lower edge support-7 cm. This is another height-aware placement risk, distinct from the copied-wallet bug. Their root also rotates toward the camera each update; any future world-locked reading placement should move only the expanded child and avoid the root's animation overwrite.
- Opening card/tab now use the measured crate-surface layout and already have actual corner-clearance assertions. Suspect panels use Cast's world placement/scale. Toast/initial placement guide are intentionally camera-relative. Closing result/details inherit the newly raised Closing root and were not independently moved.

These residual card-clearance risks are source-derived, not claimed capture failures. No unrelated popups changed.
