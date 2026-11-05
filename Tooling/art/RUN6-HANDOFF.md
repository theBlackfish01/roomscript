# Run 6 art handoff — 2026-11-05

Offline art preparation complete; A3/A5 runtime acceptance remains with the Lens lane. No Lens API or GUI automation was used. Cost: $0.

- 20 suspect poses now use 1.85x structural strokes in brighter ivory with a two-ring soft halo, larger faces, new shoulder/spine postures, head tilts and expressions. Neck joins and Okafor's glasses follow the head correctly while tell anchors stay fixed. Lower outlines fade out before the garment edge.
- Twelve claim/truth/suggestion ghosts use the updated poses. Harlow's two original ghost poses have matching heavier luminous outlines.
- Full renderer exported 98 PNG/GLB assets, **5,961,439 bytes**. Second full regeneration matched **98/98 hashes**. **27/27 independent contracts passed**, including new shoulder-contrast and stroke-core checks.
- Bright core coverage is **4.096%–5.378%** (Run 5 was 2.008%–2.267%). Tell-centroid max error **5.010 px**, below the unchanged 12 px limit. Mouth windows and transparent bottom 15% all pass.
- Anton Regular and Courier Prime Regular/Bold plus their OFL licenses are supplied. Sources/hashes and angular targets: `FONTS.md`. Cards and review sheets now rasterize from the private Courier Prime family. Font and license bytes total **323,743**, separate from the PNG/GLB manifest.

## Inspect

`docs/captures/2026-11-05-art-after-poses.png` and `2026-11-05-art-after-thumbnails.png`; then `2026-11-05-art-room-{Vale,Qadir,Okafor,Pike}.png` for all five poses over the photoreal room.

The room composites are explicitly labelled **offline composites**, using the camera-frame inset from `docs/captures/2026-10-28-a4-camera-fixed.png`. They are neither new Preview captures nor evidence of runtime wiring. All four sheets were visually inspected; the structural lines and faces read over the room. Native additive blending and device optics still require Lens/device verification. Historical Nov 4 sheets are preserved.

## Select and wire

`generated/ArtManifest.ts` retains existing IDs, file paths and tell anchors. PNGs remain 512x1024 and normalized anchors remain valid. Existing `.meta` files were not replaced. Use compressed textures, retain only selected visible poses/cards/ghosts and measure actual residency: the 20 uncompressed portraits alone still decode to 40 MiB, all PNGs 103.69 MiB. Source disk size is not runtime residency or exported Lens size. A3 should reference active assets rather than eagerly retaining the entire inventory. Do not activate ghost content beyond the engine's knowledge gate.

`node run.mjs --stage` now renders under ignored `Tooling/art/out/run6` during LEAF windows. Publish with `node run.mjs` only when the Lens test owner permits asset changes. `node scripts/composite.mjs` regenerates review sheets. `node scripts/verify.mjs` does the bounded deterministic repeat plus contracts.

Duplicate audit: repository text references to `Tooling/art/web` and `Tooling/art/specs` are only documentation about cleanup. Production imports `lib/` and `scripts/`; the retained prototype resolves its own `prototype/web` and `prototype/specs`. The duplicate tracked copies are unused and can be removed by the authorized `git rm` without touching the retained prototype.
