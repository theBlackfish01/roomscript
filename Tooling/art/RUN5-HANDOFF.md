# Run 5 art handoff — 2026-11-04

**A1 artifact package complete. A2 partial. A3 not wired.** No Lens API or scene mutation was performed in this lane. No browser or computer-use was opened. Provider cost: **$0**.

## Verified artifacts

- 98 PNG/GLB assets, **3,472,641 bytes / 3.31 MiB** under `Assets/Art/`.
- 20 suspect poses (four suspects x five), 12 claim/truth/suggestion ghosts, 8 four-frame mouth/blink atlases, two separately drawn Harlow ghost poses.
- 23 evidence cards drawn from the actual hero graph, six original GLB props (candlestick, letter knife, bookend, clock, recorder, chipped mug), three hero words, 13 icons and eleven frames/tiles/FX assets.
- Four 1920 x 1080, 30 fps H.264 video graphics; **783,096 bytes total**. Title 4 s; Objection 3 s; EndCard 4 s; UnderTheHood 5 s. Each decoded completely through ffmpeg with no errors. Contact frame review passed. No gameplay is represented by these graphics.
- `node Tooling/art/scripts/verify.mjs`: **26/26 contracts pass**, then a full repeat found **98/98 identical SHA-256 hashes**. The contracts independently decode pixel data and GLB binary data rather than trusting generator metadata.
- Tell centroid maximum measured error **3.802 px** (limit 12 px). Bright alpha-weighted pixel fraction **2.008%–2.267%** (limit 25%). All mouth windows and fully transparent bottom 15% pass. Neutral silhouette profiles are measurably distinct; root visually reviewed the final thumbnail sheet.
- `git diff --check -- Tooling/art`: clean (only repository LF/CRLF notices).

The 20 portrait files alone decode to 40 MiB before Lens compression. **All** generated PNGs together decode to **108,724,224 bytes / 103.69 MiB**. This is an asset inventory, not runtime memory or a built-Lens size. Import selectively, use compression and avoid retaining every ghost/card in memory simultaneously; A9 still needs an actual build/runtime measurement.

## Review these files

- `docs/captures/2026-11-04-art-before.jpg` — historical prototype sheet copied intact for comparison.
- `docs/captures/2026-11-04-art-iteration1-thumbnails.png` and `...-iteration1-poses.png` — first iteration retained before the stronger face/silhouette correction.
- `docs/captures/2026-11-04-art-after-thumbnails.png` — final cast lineup.
- `docs/captures/2026-11-04-art-after-poses.png` — final four-by-five pose sheet.
- `docs/captures/2026-11-04-art-motion-contact.png` — representative frames from the four edit graphics.
- `devpost/media/video/{Title,Objection,EndCard,UnderTheHood}.mp4` — silent edit-ready motion graphics.

Every sheet above is an **offline generated art sheet, not a Lens Preview capture**.

## Wiring handoff

The precise generated data path is **`Tooling/art/generated/ArtManifest.ts`**. It exports `ROOMSCRIPT_ART` with actor IDs/poses/anchors/atlas frames, evidence IDs/fact citations, object IDs/GLB paths/scales and hero word paths. This is intentionally outside `Assets/Scripts` until the Lens integration is ready. `Tooling/art/manifest.json` carries the full inventory and per-file hashes.

Use VirtualScene to set actor inputs and future registry Texture arrays in the manifest order. Preserve existing actor textures until the Lens see-and-fix loop passes. Keep the existing tell anchors: Vale (340,440), Qadir (352,554), Okafor (256,229), Pike (160,578). GLBs use meters; enable the centimeters conversion, and validate KHR_materials_unlit appearance. Clock hand nodes are separate; runtime truth controls whether the illustrative 22:30 dial is appropriate. Ghost visibility remains strictly gated by engine-certified knowledge.

Mouth/blink atlases are authored assets only. They are not evidence that jaw or blink animation is already wired. A3 needs compile/start, cast LEAF, pose/tell captures, GLB scale review and the puppet rim shader fix. Main reports MCP runtime refresh was blocked, so these remain pending.

## Remaining A2 limits

- Actual OFL display/typewriter font files are not installed or shipped. The native fallback rasterizes card labels with installed Courier New; no system font file is copied. Hero words use an original procedural monoline alphabet. Runtime A5 fonts remain pending.
- Video outputs are opaque H.264 over the dark art backdrop; alpha WebM masters were not generated. Lossless original frames are in ignored `Tooling/art/out/motion/`.
- Human taste review and Lens gamma/additive-brightness review remain pending. The final faces are materially distinct after root critique: Vale lifted chin/level mouth; Qadir broader jaw/asymmetric grin/relaxed hand; Okafor square face/short nose; Pike narrow tilted head/scowl/hunched shoulders/glove tug. Harlow is separately drawn with receding temples, waistcoat and pocket watch.

## Blockers and preservation

The prototype npm install failed with registry EACCES and npm-cache EPERM. Production therefore uses dependency-free Node plus native System.Drawing; no network request or package installation is required to render it. The original `prototype/` remains intact, with its original code license changed to MIT under the owner's instruction; third-party package licenses are unchanged.

Automatic approval review rejected recursive cleanup of the temporary duplicate `Tooling/art/web/` and `Tooling/art/specs/` copies as potentially irreversible. They remain untouched and untracked, are **unused by production**, and should be excluded from the art package commit. No retry, permission bypass or GUI approval was attempted. Parent reported Git index writes blocked independently, so this lane made no commit or push.

For a later selective commit include `Assets/Art/`, `Tooling/art/{README.md,RUN5-HANDOFF.md,package.json,package-lock.json,run.mjs,manifest.json,verification.json,lib,scripts,tests,generated}`, prototype package license changes, the six art sheets and `devpost/media/video/`. Exclude `Tooling/art/{web,specs,out,node_modules}` and all frame sequences.
