# A3 and S2 staging handoff

No Assets, scene, RoomBinding or Cast changes were made in this batch. Main must import/compile through MCP when its current gate releases writes. This is a source and geometry audit, not a runtime pass.

## S2 playback regression

`Tooling/staging/RoomscriptPolishLeafScenario.ts` replaces the late one-frame `tick.isPlaying()` assertion. It keeps immutable-snapshot checks and tests both independently routed audio components. It records cue/tick start generation, positive decoded duration, synchronous native playback, and up to sixty bounded follow-up samples for two seconds. The explicit tick generation must show `isPlaying()` or an advancing native position **while the spatial chime is playing**. A counter increment alone cannot pass, and a later automatic clock generation cannot substitute for the explicit tick. It logs a late stopped tick separately. Frame profiling retains a 600-frame goal, with a ninety-second cap and at least sixty actual frames; it reports the actual sample count and never claims the 8 ms target was met merely because the test completed.

## Twenty actor poses

`Tooling/staging/RoomscriptActorPoseCaptureLeafScenario.ts` registers as `roomscript-actor-pose-capture`. Config keys:

- `suspect`: S1, S2, S3 or S4 (default S2).
- `pose`: neutral, listening, rattled, broken or smug (default neutral).
- `audit`: default checks all twenty bindings and displayed textures; use string `false` for subsequent screenshot-only calls after the initial full audit passes.

The audit requires five non-null, distinct native textures per actor and verifies each renderer's actual `baseTex` with `ScriptObject.isSame` (Support/StudioLib.d.ts). It compares gameplay knowledge, suspects, verdict, minutes, arguments and active statement before/after; routine route-sampling log entries may advance. It finishes immediately after applying the chosen pose with a twenty-second presentation-only hold, leaving time for main's next Preview screenshot call. No frame capture, focus move, scene editing or engine dispatch occurs inside the scenario. Director framing stays main-owned. A neutral/rattled label alone is not sufficient: texture identity is also asserted.

## Six runtime props

`Tooling/staging/RoomscriptArtLibrary.ts` proposes explicit static prefab imports and a Preset-only object lookup. `Tooling/art/run7-runtime-props.json` adds exact GLB identity-node accessor bounds and centimetre footprints to the existing prefab UUID manifest. `scripts/run7-runtime-art.mjs` regenerated these outputs and rejected transformed nodes rather than silently miscomputing bounds. All six actual bounds start at Y=0; import metadata already converts metres to centimetres. Use instance scale one and the accepted `PRESET_EVENING_SUPPORTS` surface coordinates.

All six local GLBs have `PrimaryAsset` equal to their `ImportedAssetIds.Scene`; `AssetDataMap.Scene` resolves to `ObjectPrefabAssetData`. The JSON records the exact data UUID for each. Therefore the imported primary is an ObjectPrefab, while a runtime/downloaded `GltfAsset` uses the separate `tryInstantiate(parent,material)` API (`Support/StudioLib.d.ts:15766`). A fresh runtime restart exposed that the documented static `ObjectPrefab.getTypeName()` was unavailable. Main corrected the runtime registry to require a callable instance `instantiate` function; the generator/staging copy now match it byte-for-byte. No guessed subasset path is necessary. The six actual instantiated renderer checks in `Tooling/staging/run7-six-props-regression.txt` remain the required runtime proof; metadata and a type declaration alone are insufficient.

Main's RoomBinding integration point is after object anchors are positioned. For each applicable Preset object, instantiate the matching `ObjectPrefab` under `objectAnchor(id)`, name its visual `RoomscriptPropVisual_<id>`, set local scale one, and retain the instance in the case teardown list. On a case change, destroy old instances before creating replacements, including authored-anchor children: clearing only dynamically created anchor roots would leak repeated Preset props. A lifted visual must be separate from the logical anchor.

| Object | Upright footprint cm | Placement |
| --- | --- | --- |
| O2 candlestick | 12 × 12 | Bottom origin, no Y offset |
| O9 mug | 11.54 × 8.6 | Bottom origin; fictional Preset visual proxy |
| O12 recorder | 22 × 14 | Bottom origin, no Y offset |
| O7 clock | 18 × 7.05 | Bottom origin, dial faces camera |
| O3 letter knife | 2.5 × 2.4, 32 tall | Lay flat: rotate Z +90°, local offset `[16,1.25,0]`; resulting surface footprint about32 × 2.4 |
| O5 bookend | 16.6 × 11 | Bottom origin, no Y offset |

O9 is marked `fixture` in the original case although the accepted room scan did not detect a mug. Its art is an explicitly fictional Preset proxy on the console, not a claimed vision detection. The registry intentionally rejects Dynamic cases, so an arbitrary new `O2` identity never receives a candlestick. Main may instead preserve a real mug when one is explicitly observed. Do not replace detected furniture with props.

## Progressive card textures

The staged art library also maps all23 existing evidence textures. `admittedCard(graph,state,id)` returns null unless the ID is already in PlayerKnowledge; it provides at most three title words, current engine caption, and the authored image only for HARLOW-1041. Dynamic always gets the blank MemoryPhoto frame and its own admitted text. A fact-bearing authored card must never be a collapsed preview of uncollected evidence.

Suggested wallet/memory integration: keep one cloned `RoomscriptProbeImage.mat` and one Image under the existing expanded card. On selection, update `baseTex`, set full engine caption and show the image only after expansion. Collapsed target: role icon plus three-word title, minimum6.6cm tall at150cm. Pinch expands; Close returns to the room. Destroy/clear the expanded visual on case reset and when closing. Statement entries without an evidence image remain text plus the blank frame. Clone materials rather than recoloring a shared suspect material.

These are static requireAsset references. Delayed instantiation or a switch statement does **not** prove lazy GPU loading. Current imported texture settings are Medium performance compression, mipmaps off. Measure residency and Lens export after integration; do not infer GPU footprint from the2.39MB audio or5.96MB original art source sizes. The existing art handoff has full decoded-memory estimates and exposed compression API references.

## Validation and remaining gate

The generator read six GLBs, validated identity transforms, derived exact POSITION bounds, and emitted six prefab/23card references. No Node TypeScript compiler was used on Lens code. Main still must compile both scenarios and the optional art adapter, execute the clock/pose tests, instantiate props and cards, and capture near/far layouts. No listening or rendering success is claimed by this staging lane.
