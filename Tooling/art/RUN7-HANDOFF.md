# Run 7 art wiring handoff

No costume rerender is needed. All **98 Run 6 asset hashes pass**, including 20 portraits, 12 suspect ghosts, two Harlow poses, 23 evidence cards and six props. The source PNG/GLB bytes remain 5,961,439. This lane inspected bindings and prepared them; main owns Lens compilation, VirtualScene application and capture acceptance.

## Bind five poses first

`run7-actor-bindings.json` is the exact VirtualScene `apply` payload for the four existing actor component UUIDs. It assigns all 20 `@asset:Art/Actors/...` textures. Regenerate from a fresh VirtualScene read with `node Tooling/art/scripts/run7-bindings.mjs` if scene component IDs change. It only reads scene JSON and writes Tooling handoffs.

1. Compile `RoomscriptSuspectActor.ts` through Lens MCP, then apply that JSON and save. A new `smug` input was initially declared mandatory and triggered a Preview `Input smug was not provided` failure before binding. Main was notified immediately and owns recovery. The verified optional declaration is `@input @allowUndefined @hint(...) smug:Texture;`, matching the local Leaf BitmojiCharacter material input example. Apply that decorator or bind all four actors before restart. A null texture already falls back to neutral.
2. Re-read VirtualScene and confirm the 20 input values. In the inspected pre-change snapshot, Vale used four named pose textures, but Qadir/Okafor/Pike assigned the same old `*_512x1024` texture to all four inputs. A filename's existence did not prove runtime wiring.
3. The actor now caches the latest engine state, uses a 1.8-second smug reaction only after its engine-emitted `objectionWrong`, and gives broken/rattled posture priority. `capturePose('neutral'|'listening'|'rattled'|'broken'|'smug', seconds)` is a bounded presentation-only Director hook. It changes no tell, account or fact. Use it to capture all five poses for each suspect; leave it expired before gameplay verification.
4. Main must verify compile and the reaction in Preview. No TypeScript/Node compilation of Lens code was attempted by this lane. The optional-input failure is explicit evidence that source inspection alone is insufficient.

The actor quad is 85 x 170 cm, bottom anchored, and already clones its puppet material. Keep the same dimensions because the tell anchors depend on them. `run7-artassetmanifest.json` gives each pixel anchor and its converted local-centimeter position. Mouth/blink strips exist but the current shader animates the portrait mouth window directly; do not claim the strips are wired or retain them solely for that claim.

## Cards and pulled memories

`run7-artassetmanifest.json.cards` lists all 23 Preset evidence IDs, exact image paths and cited fact IDs. A card can appear only after the engine admits that evidence; opening a wallet must never reveal the full art inventory. `RoomscriptEvidenceWalletUI` currently renders text only. Main's progressive card adapter should choose the selected ID from its observed entries and add an Image with the matching texture.

The authored card images contain HARLOW-1041 captions. Dynamic must not reuse their baked facts. Use `Run7/MemoryPhoto.png` as an empty frame, the matching role icon, and the engine's current evidence text. Collapsed: icon plus at most three words. Expanded on pinch: the admitted memory and time. The pulled photograph stays attached to the hand during the pull and settles into the wallet; its geometry does not grant knowledge or resolve an objection.

Keep a selected card near its object/speaker and outside the face. At 150 cm, a 2.5-degree target is about 6.55 cm tall; the clickable parent should meet that size even if the decorative icon is smaller.

## Reconstruction ghosts

Current `RoomscriptClosingController.beginReveal` creates generic `worldLines` silhouettes. Replace each of those visuals with one bottom-anchored 85 x 170 cm textured quad under the existing ghost SceneObject; preserve its current 0.75 scale, engine positions and enabled gate. Use a cloned unlit alpha material exposing `baseTex`/`baseColor`, depth test on and depth write off; verify its actual exposed properties before applying. The current puppet shader does not expose generic `baseColor`, so it is not a drop-in tint material.

The manifest supplies exact ghost paths by stable S1-S4 slot:

- Preset claims: `{Name}-claim.png`; truth/correction/freeze: `{Name}-truth.png`; a permitted suggestion: `{Name}-suggestion.png`.
- Dynamic: use the neutral ivory actor portrait with cyan/coral/ivory runtime tint. The authored Vale truth ghost is already coral and cannot correctly represent a different Dynamic culprit. Only the accepted post-verdict engine envelope may choose culprit tint.
- Victim: Harlow standing for a standing reconstruction beat and falling only for the engine's murder freeze. Harlow's old costume represents the victim role in Dynamic; do not print an authored victim name over a generated one.

`reconstructionBeats` returns no sealed truth until `correct` or `wrong`; timeout alone must not show these ghosts. Follow beat positions rather than inventing travel. The own-route trail is a separate faint cyan view of accepted `RouteReplay` samples; it is never the truth path.

VirtualScene can wire newly added scalar Texture inputs on the closing component after MCP compilation, just as the actor payload does. Runtime-created ghost quads have no persistent editor IDs, so an editor-only material assignment to them would not survive reset. Main must add the Texture inputs/registry and create those quads in its closing adapter. This lane did not modify Closing.

## Props on real surfaces

The manifest includes each imported prefab's primary UUID, physical height and `instanceScale: [1,1,1]`. All six `.glb.meta` files already have `ConvertMetersToCentimeters: true`: **do not multiply the instance by 100 again**.

| Preset object | Prefab | Height |
| --- | --- | ---: |
| O2 | BrassCandlestick.glb | 34 cm |
| O9 | ChippedMug.glb | 9.2 cm |
| O12 | DictationRecorder.glb | 8.7 cm |
| O7 | EvidenceClock.glb | 19 cm |
| O3 | LetterKnife.glb | 32 cm |
| O5 | MarbleBookend.glb | 17.8 cm |

For an authored editor anchor, instantiate through VirtualScene `_prefab: '@id:<primaryAssetId>'`, parent to the freshly read anchor UUID and use scale one. Calculate the support offset from the accepted surface and prefab bounds; no arbitrary origin placement. For runtime `room.objectAnchor(id)` anchors, wire an ObjectPrefab input through VirtualScene and instantiate under the returned anchor in the room adapter. A root-level editor prop cannot follow a later accepted scan by itself.

Only instantiate a prop when it is part of that graph and is explicitly virtual. Real scanned furniture is not replaced by a GLB. Director/film mode hides stand-in boxes, not actual simulated furniture. Inspectable mug/cable lift visuals should temporarily reparent a visual clone, leaving the engine object identity and anchor unchanged. The clock's authored decorative dial is 22:30; runtime truth controls any consequential time display.

## Compression and residency

The audit records actual import metadata per file. Existing PNGs use `PerformanceCompressionSettings`, level `Medium`, mipmap false. Preserve alpha; do not flatten luminous artwork onto black. Editor API types verified in `Support/editor.d.ts:4663` expose `PerformanceCompressionSettings.create(scene)`, `.level = Editor.Assets.TextureCompressionLevel.Medium` and `.mipmap`. Apply through the main Lens tool workflow and re-read metadata; do not hand-edit `.meta` files.

Try mipmaps on world-space portraits/ghosts if distant outlines shimmer. They add memory, so compare a near face and a distant silhouette before retaining them. Small UI icons and one-line text frames can keep mipmaps off. Do not claim a particular ASTC block size: this project metadata exposes a quality level, and actual GPU format/residency still requires measurement.

All PNGs decode to **108,724,224 RGBA bytes (103.69 MiB)**; 20 portraits alone decode to **40 MiB**. Source disk size is not GPU residency or exported Lens size. Five bound pose inputs per actor may keep all 20 textures reachable; hidden SceneObjects are not proof of unloaded textures. Avoid an eager registry that imports every card, ghost, atlas and video frame. Retain one visible card, instantiate reconstruction visuals only at verdict, and release presentation references on teardown; then measure actual profiler residency. Compression is the first step, not a measured memory result.

## Small new presentation assets

Ten transparent sprites are staged under `Tooling/art/out/run7/Assets/Art/Run7` (38,324 bytes): CastingTag, ToastTick, MemoryPhoto, VerdictStamp, RouteTrail, RoleWitness, RoleWeapon, RoleHiding, RoleTimekeeper and More. The first three frames were visually inspected locally. All ten decode as RGBA at their intended dimensions. Their source is `scripts/run7-presentation.mjs`; they use the existing original native vector renderer, no image provider, Chromium or heavy rerender.

Frames deliberately carry no names, claims or verdict. Add runtime Anton titles, Courier Prime Bold short labels and the shared design palette. Four role icons cover all detected object types through the compiler role mapping; an icon never asserts that an object committed a crime. The trail texture is optional: use actual line geometry for the accepted route.

Main released imports after recovery 2/3; the ten sprites were published additively to `Assets/Art/Run7` and byte-checked against staging. Actor.smug now has the verified `@allowUndefined` decorator. Main reported all 20 pose bindings applied and clean startup after the recovery; pose captures remain main-session acceptance. No scene or Lens tools were called by this lane. Added provider cost: $0.

## Main-session acceptance

Capture each actor's five poses, a collapsed/expanded admitted card, pulled memory, lifted prop, casting role on real furniture, one peripheral toast, claims-to-truth ghosts, route beside truth, correct/wrong/timeout stamps and stars. Confirm no ghost appears at timeout before accusation, Dynamic uses its actual culprit tint, and the clock reflects engine time. Run the targeted actor/closing/naive-player LEAF checks after a clean restart. This handoff does not mark those captures or tests passed.
