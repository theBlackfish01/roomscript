# Roomscript production art

Original luminous engraving on transparency, generated from code. Four distinct suspect silhouettes, five poses each, a separate Harlow ghost, proof cards derived from the actual case, six GLB props, sprites, mouth/blink atlases and video motion graphics. Assets are ready for Lens import; this package does **not** claim they are wired or verified in Preview.

## Run

Requires Node 22, Windows PowerShell/System.Drawing, the existing `Tooling/node_modules/tsx` install for the pure case-content import, and a local ffmpeg executable for videos. No browser, network or credentials are used. Set `FFMPEG` or use the already installed `Tooling/audio/out/bin/ffmpeg.exe`. No executable is redistributed.

```powershell
cd Tooling/art
npm run art          # assets + four 1080p30 videos + contracts
npm run art:assets   # PNG/GLB only; about 12 seconds on this workstation
npm run art:verify   # regenerate every PNG/GLB and compare all SHA-256 hashes
npm test            # independent PNG pixel and GLB binary checks
```

All spawned processes have explicit timeouts of at most nine minutes. Production does not require npm dependencies of its own. The original Three.js/Chromium prototype is preserved under `prototype/`. Its dependencies could not be installed in the Run 5 sandbox (registry EACCES and npm-cache EPERM), so production uses an equivalent deterministic native raster stage rather than requesting interactive approval.

## Outputs and contract

- `Assets/Art/Actors/`: 512 x 1024 RGBA portraits; 512 x 64 four-frame mouth/blink strips; Harlow standing/falling.
- `Assets/Art/Ghosts/`: claim cyan, truth coral for Vale/ivory for innocents, faint suggestion ghosts. Visibility must be gated by engine knowledge at runtime.
- `Assets/Art/Cards/`: all 23 evidence Polaroids. Captions and cited fact IDs come directly from `HeroCaseHarlow1041.ts`. No hidden-fact illustration is inferred from the envelope.
- `Assets/Art/Props/`: meters, glTF 2 binary, `KHR_materials_unlit`. Candlestick is 34 cm tall. Import with meters-to-centimeters conversion. Clock hands are separately named; the illustrative dial is 22:30, and runtime truth must control its use.
- `Assets/Art/UI/`, `FX/`: three hero words, thirteen icons, card/tape/bracket assets, UV/blackout/reconstruction sprites.
- `manifest.json`: every file, complete SHA-256, byte size, semantic IDs and anchors. `generated/ArtManifest.ts` is a pure handoff mapping for the Lens art registry.
- `devpost/media/video/`: Title, Objection, EndCard, UnderTheHood, all 1920 x 1080 at 30 fps, H.264. These are edit graphics, **not captured gameplay**.
- `docs/captures/2026-11-04-art-*`: before, iteration 1 and final contact sheets. These are **offline generated sheets, not Lens captures**.

The v2 mouth contract deliberately replaces the prototype's dark opaque mouth with visible luminous strokes in the same shader window; dark ink would disappear on additive display. Tests independently decode the PNG bytes and check RGBA dimensions, mouth-window coverage, tell centroid within 12 px of the existing TellVisual anchor, transparent bottom 15%, and bright-pixel fraction no greater than 25%. Tests also check evidence caption preservation, glTF geometry, complete pose/atlas sets and hashes. Determinism is measured with a complete second render, not a source-only assertion. Deterministic bytes are scoped to this Windows/System.Drawing renderer and font environment.

## Art review and limits

First review: clothing and hair were distinct, but faces and upright poses were too alike. The final iteration uses Vale's raised chin, narrow eyes and level mouth; Qadir's broad jaw, asymmetric grin, loose slanted shoulders and dropped hand; Okafor's square jaw, shorter nose and still coat/bag; Pike's tilted narrow head, angular frown, raised greatcoat shoulders and glove tug. Head angles and free hands change across poses while tell props remain pinned to runtime anchors. Harlow has a separate older head, waistcoat and pocket-watch silhouette.

Remaining A2 work: ship actual OFL display/typewriter font files (network retrieval was unavailable), further human taste review and any Lens-driven revisions. The original monoline hero alphabet is code-authored, with no external font dependency. Card and sheet text is rasterized with the existing Windows Courier New; its font file is **not** copied or bundled. Runtime typography still needs A5. No imported art is silently removed.

Remaining A3: import, wire and inspect in Lens, including material rim behavior, gamma/brightness, tell overlap, sprite timing, GLB scale, and pose-sheet Preview capture. Mouth/blink strips are authored assets, not evidence of animation already wired. Original assets remain intact for rollback.

## Provenance and licenses

Production vector art, glyph paths, native raster wrapper, PNG decoder and glTF writer are original Roomscript code, MIT. No downloaded model, texture or third-party code is used in production. Node, Windows/System.Drawing and local ffmpeg are build tools, not shipped in the Lens. The historical prototype uses three.js (MIT), Playwright (Apache-2.0), Anton/Alfa Slab One/Courier Prime (OFL), and Special Elite (Apache-2.0); see its package and the repository NOTICE. Those fonts are not yet production font assets.
