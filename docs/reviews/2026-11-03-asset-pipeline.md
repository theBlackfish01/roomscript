# R4 — Roomscript code-driven asset pipeline (design + working prototype)

Prepared 2026-11-03 for the final polish pass. Repo was read only (no writes, no git, no Lens MCP). Everything below lives in
`C:\Users\wadoo\AppData\Local\Temp\claude\C--Users-wadoo-Desktop-Me\7cb4f42e-0632-4ad2-b8a1-819501e2cfbb\scratchpad\r4-assets\`
(abbreviated `R4\` below).

**Result:** one command, `npm run art`, regenerates **all** of the following from JSON specs:

- 20 suspect portraits (4 suspects × 5 poses), plus 2× hi-res copies and preview pairs.
- 2 GLB props, a Polaroid evidence card and 2 motion clips (MP4 + alpha WebM).
- A contact sheet and a hashed manifest.

A full run takes about 2.5 min (motion included); portraits/props/cards alone take about 12 s. A second run was byte-identical: 67/67 PNG/GLB hashes matched.

---

## 1. Inventory: how the Lens build consumes art today

| Thing | Where | Contract / facts |
|---|---|---|
| Suspect actor | `Assets/Scripts/RoomscriptSuspectActor.ts` | Draws an **85 × 170 cm quad**. It has 4 Texture inputs, **`neutral`, `listening` (= speaking), `rattled`, `broken`**, swapped into `material.mainPass.baseTex` from engine composure/layer. Missing poses: the 3 newer actors reuse one portrait for all 4 slots (PROGRESS L2/L3). |
| Puppet shader | `Assets/Actor/RoomscriptPuppet.graphShader` | Custom code node, BlendMode Normal, no depth write, alpha discard < 0.02.<br>**Jaw warp window:** UV x 0.43–0.57, UV y 0.67–0.75 (y up). At 512 × 1024 that is x 220–292, y 256–338 from the top, so **the mouth must sit at about (256, 292)**.<br>**Stress rim:** samples alpha ±2.5 texels and draws ivory→amber→coral where `around > paper.a`. |
| Tell anchors | `RoomscriptTellVisual.ts` | Prop-flash positions in quad cm, which give the texture pixels each portrait must honour (@512 × 1024):<br>• glasses (0, 132) → **(256, 229)**<br>• brooch (14, 97) → **(340, 440)**<br>• lighter (16, 78) → **(352, 554)**<br>• glove (−16, 74) → **(160, 578)**<br>The composure ring is centred (0, 126) with r ≈ 24 cm, behind the head. |
| Current portraits | `Assets/Actor/*.png` | `Vale-{neutral,listening,rattled,broken}.png` comes from `tempAssetGen/gen_actor.ps1` (System.Drawing).<br>`{Qadir,Okafor,Pike}_512x1024.png` comes from `Tooling/scripts/draw-cast.mjs` (SVG). Each of those three has **one pose only**.<br>All of them use dark-brown ink on ivory, which loses its line work on an additive display. |
| Everything else | Scripts | The crate, Polaroids/cards, wallet, OBJECTION stamp, shards, paths, pawns and ghosts are **procedural MeshBuilder geometry + flat unlit colour materials + `Component.Text`**. No other textures, no GLBs, no flipbooks exist. `RoomscriptShatter.graphVfx` is not instantiable in Preview, so shards are MeshBuilder geometry. |
| Materials | `Assets/Materials/*.mat` | Unlit colour presets (Brass, Coral, Cyan, Ivory, Slate, Wood, Yellow). |
| Audio | `Assets/GeneratedSFX/` | 11 WAVs, imported via `AssetManager.findCopyOrImport` (c1 manifest). That is a precedent for importing generated files. |

**Art direction** (`docs/design/03-ar-staging-and-storyboard.md` §2.1, §6):

- **Palette:** Coral `#FF6B5A` truth/solid · Cyan `#3FE3FF` claim/dashed · Yellow `#FFD60A` markers/OBJECTION · Ivory `#FFF0D6` people · Brass `#E8B04A` board · Chalk `#EEF4FF` · Violet `#8F7CFF` UV.
- **Figure treatment:** face 80–100 % brightness; clothing as hatching at 35–60 %; bright contour; hatching thins to specks below the waist; signature prop at 100 %.
- **Rules:** no dark fills or large bright panels; alpha = brightness; no opacity-gradient tricks; heavy condensed hero type, slab plaques, bold mono captions.

## 2. Chosen pipeline and why

**Three.js r170 scenes, rendered in Playwright-driven headless Chromium on SwiftShader (CPU WebGL), to PNG / GLB / PNG frame sequences, then ffmpeg.**

- **Code-driven and deterministic.** All geometry is generated from JSON params plus a seeded PRNG. SwiftShader raster is CPU-deterministic. Fonts are local woff2 files. Verified: a second run gives identical SHA-256s.
- **One renderer for every asset class:**
  - 2D paper-theatre figures: `ShapeGeometry` + `SVGLoader.pointsToStroke`, with a custom "engraved light" shader.
  - Real 3D props: `LatheGeometry` → `GLTFExporter`.
  - Motion: frame-pure timelines.
- **Additive-correct by construction.** One shader (`web/lib/ink.js`) has four modes:
  - `skin`: high-key, baked shading.
  - `hatch`: line density = tone, crosshatch past a threshold, slight wobble, interior veil 10 %.
  - `solid`.
  - `dust`: speck stipple for past-tense ghosts and memories.

  A world-y speck fade dithers everything below the waist into dots (no alpha gradient). Glow comes only from props, via a layer-1 blur pass. Front-to-back depth occlusion gives true cut-out layering, so a sleeve hides the lapel behind it instead of stacking translucent hatching.
- **Each preview tile shows both looks:**
  - Left: Lens Preview, alpha over a dim room, which is what the judges' video shows.
  - Right: Spectacles, additive (`lighter`). Dark ink vanishes and bright lines stay.
- **No Blender required.** Lens imports glTF/GLB directly.
- **Tooling found on this machine:**
  - Playwright's bundled ffmpeg is a minimal build (no PNG decoder, no H.264), so it is not used.
  - The generator finds a full ffmpeg 7.1 (libx264, VP9 with alpha, ProRes) through the user's existing `imageio_ffmpeg` Python package (`python -c "import imageio_ffmpeg..."`). `FFMPEG=` overrides this.
  - Chromium 1248 ("Chrome for Testing") matches playwright-core 1.64.1.

Alternatives considered:

- **SVG-only (like draw-cast.mjs):** no 3D, GLB, depth occlusion or shader stipple.
- **Imagen:** the probe failed, and its output is non-deterministic and off-palette.
- **Blender:** not installed.
- **Lens-side MeshBuilder for everything:** costs runtime and Lens tool time, and gives no video assets.

## 3. Lens Studio 5.23 import constraints (from Snap docs + repo)

- **glTF/GLB:**
  - Drag into the Asset Browser.
  - Import options: "Convert meters to centimeters", "Import vertex color", "With Materials".
  - Supported extensions: `KHR_materials_unlit`, `KHR_texture_transform`, Draco, clearcoat/sheen/transmission.
  - If import fails, use the "Use Legacy Importer" fallback and check the Logger.
  - Keep each model under about 100k triangles (60k if skinned). Ours are 1.5–2.6k.
  - The docs don't name `.glb` explicitly. It is the binary form of glTF and is expected to work, but this needs an **import test** (see acceptance).
- **Textures:**
  - PNG when alpha is needed, JPG otherwise.
  - Compress, and prefer 512–1024 over 2048.
  - **2D Animation From Files** builds sprite sheets of at most 2048 × 2048 each and plays via `AnimatedTextureFileProvider.play(loops, offset)`. GIF import is also possible.
- **Budgets:**
  - Spectacles published Lens ≤ **25 MB** (Snapchat is 8 MB).
  - Lens RAM < **120 MB**.
  - A Spectacles preview image is required, ideally 3:4, plus an icon.
- **Repo rules:**
  - VirtualScene is the single scene writer; log CLAD use to `devpost/clad-log.md`.
  - Pin LS 5.23.2.
  - `requireAsset` was unreliable for the VFX asset, so prefer `@input Texture[]` wired through VirtualScene over runtime path lookups.
- **Our footprint:**
  - Portrait PNG ≈ 220–240 KB at 512 × 1024 (the speck dither inflates PNG). 16 contract poses ≈ 3.7 MB on disk.
  - Uncompressed RGBA ≈ 2 MB each in RAM, so 16 ≈ 32 MB before Lens compression.
  - Keep the `@2x` (1024 × 2048) files out of `Assets/`. Use one only for a hero close-up, if at all.

Sources: [glTF import](https://developers.snap.com/lens-studio/assets-pipeline/3d/importing-content/gltf-import) · [2D animation](https://developers.snap.com/lens-studio/assets-pipeline/2d/2d-animation) · [Texture optimization](https://developers.snap.com/lens-studio/publishing/optimization/texture-optimization) · [Spectacles publishing (25 MB)](https://developers.snap.com/spectacles/get-started/start-building/publishing-lens) · [3D export guide (tri budget)](https://developers.snap.com/lens-studio/assets-pipeline/3d/exporting-content/overview)

## 4. Style spec (encoded in `R4\specs\style.json`)

- **Portrait canvas:** rendered at 1024 × 2048, downsampled to 512 × 1024 RGBA with straight alpha. 1 px @512 = 0.166 cm on the 85 × 170 cm quad.
- **Anchors @2x (do not move without editing the Lens scripts):**
  - mouth (512, 584)
  - eye line y = 458 (glasses)
  - brooch (680, 880)
  - lighter (704, 1108)
  - glove (320, 1156)
- **Layers:**
  - Skin: ivory `#FFF0D6` → shade `#F2C998`, α 0.94.
  - Features: "cut" lines `#2A1D14`. They read as gaps on device and as ink in Preview.
  - Skin rim: amber `#FFB74A`.
  - Cloth: ivory hatching at α 0.8 over a 10 % veil. Tone/angle/crosshatch per outfit; dark suit = dense crosshatch (Pike).
  - Contour: ivory 7 px @2x.
  - Hair: amber hatching.
  - Prop: 100 % white/brass/yellow with blur glow.
  - Speck fade: y 1240 → 1720 @2x.
- **Paper theatre:**
  - Upper arms sit behind the torso flat. Forearms and hands go in front.
  - Poses use 2-bone IK with `bend: out|in|down`, `foreScale` (foreshortening), and `hidden: pocket|behind|all`.
  - Head: `tilt/dx/dy/turn`.
  - Face: `brow` (−1 angry … +1 worried), `browRaise[R]`, `eyes[R]` openness, `look`, `mouth` (one of soft, smile, flat, tight, frown, smirk, open_small, open, gasp, quiver), `sweat`, `stress`.
- **Past tense / memory:** `dust` mode (specks only, features vanish).
- **Cards:** 512 × 640 px:
  - Coral frame with a 12 % coral veil.
  - Dust memory photo, 448 px square.
  - Yellow time stamp.
  - Ivory Courier Prime caption, up to 3 lines (from case canonical text).
  - Coral holder line.
- **Video:** 1920 × 1080 at 30 fps. MP4 (H.264 over black = additive look) plus VP9-alpha WebM, with the PNG frames as the lossless master.
- **Fonts (all bundled via npm):**
  - Anton (OFL): hero words.
  - Alfa Slab One (OFL): titles/plaques.
  - Courier Prime (OFL): captions/labels.
  - Special Elite (Apache-2.0): typewriter.

## 5. Prototype: code and outputs

**Code**

| File | Purpose | Size |
|---|---|---|
| `R4\run.mjs` | Node runner: static server, Playwright, file writes, ffmpeg, manifest, contact sheet. Flags `--only portraits,props,cards,motion,sheet`, `--char vale`, `--out`. | ~110 lines |
| `R4\web\harness.html` | Import map + `@font-face` | |
| `R4\web\rs.js` | `window.RS` API | |
| `R4\web\lib\ink.js` | Shader + geometry + affine | |
| `R4\web\lib\puppet.js` | Parametric suspect rig | |
| `R4\web\lib\props.js` | Lathe props, baked vertex light, GLB export, thumbnail | |
| `R4\web\lib\card.js` | Polaroid | |
| `R4\web\lib\motion.js` | OBJECTION slam + title timelines | |
| `R4\web\lib\gl.js` | Renderer, glow composite, previews | |

**Specs:** `R4\specs\style.json` · `characters\{vale,qadir,okafor,pike}.json` · `props\{candlestick,mug}.json` · `cards\E_VALE_LAMP.json` · `motion\{objection-slam,title-card}.json`. Total ≈ 1,540 lines.

**Outputs** (`R4\out\`)

| What | Files | Notes |
|---|---|---|
| Portraits | `Art\Actors\{Vale,Qadir,Okafor,Pike}\<Name>-{neutral,listening,rattled,broken,smug}.png` (512 × 1024) + `hires\…@2x.png` | Previews in `Previews\Actors\*-preview.png` (Lens alpha vs Spectacles additive). |
| Props | `Art\Props\BrassCandlestick.glb` (85 KB, 2,560 tris), `ChippedMug.glb` (50 KB, 1,536 tris, visible rim chip) + `*-thumb.png` | Validated as glTF 2 with `KHR_materials_unlit` + COLOR_0. |
| Card | `Art\Cards\Card_E_VALE_LAMP.png` (512 × 640) | Plus `Previews\Cards\Card_E_VALE_LAMP-preview.png`. |
| Motion | `Motion\ObjectionSlam.mp4` (4.0 s, 2.2 MB), `ObjectionSlam-alpha.webm`, `TitleCard.mp4` (4.5 s), `TitleCard-alpha.webm`, `Motion\*\frames\####.png` | Slam: frozen rain, slam with smear trails, 3-frame shake, soft flash, ring, shards, chevron tape, cyan dashed claim tearing from the coral truth, dissolve to specks. Title: motes, ROOMSCRIPT condensing from specks, brass rule, subtitle, "CASE HARLOW / 1041". |
| Sheet + manifest | `contact-sheet.png`, `manifest.json` | Manifest records path, bytes, sha256 prefix and metadata. |

**Measured contract checks** (2× texture centroid ÷ 2 vs TellVisual target @512):

| Anchor | Measured | Target | Off by |
|---|---|---|---|
| Vale brooch | (340, 440) | (340, 440) | exact |
| Qadir lighter | (352, 555) | (352, 554) | ~1 px |
| Okafor glare | (251, 230) | (256, 229) | ~1 cm |
| Pike glove | (153, 585) | (160, 578) | ~1.6 cm |

Mouth window holds 167–189 dark mouth-line pixels in every suspect. The bottom 15 % of every portrait is fully transparent (furniture masking).

**Known prototype limits**

- IK is sensitive: an elbow-solution flip can move a hand ~10 cm. I tuned hand targets by measuring. Codex should add an `anchor` solve (iterate the hand target until the prop centroid sits on the anchor) and a test.
- Hands and faces are deliberately simple cartoon cut-outs, not illustration-grade. Faces are readable and expressive at 1.3 m, but a human art pass on the 4 specs (≈30 min each) would raise the quality.
- **Not yet verified in Lens:** GLB import behaviour (unlit + vertex colour), texture compression artefacts on the speck dither, and on-device brightness.

**One Lens shader change is recommended.** With a 10 % interior veil, the current rim test `edge = (around − paper.a)·3` also fires around every interior hatch line. Change it to fire only outside the silhouette, i.e. `edge = (1.0 − step(0.05, paper.a)) * clamp(around*3.0, 0.0, 1.0)`. As a fallback, set `interiorFillAlpha: 0` in style.json, which loses the faint Preview body.

## 6. Full asset list (production plan)

Paths: generator in `Tooling/art/`; Lens assets in `Assets/Art/…`; video/Devpost media in `devpost/media/` (outside Assets, so it doesn't count toward Lens size).

| # | Asset | Count | Size / format | Repo path | Spec source |
|---|---|---|---|---|---|
| A1 | Suspect poses (contract) | 4 × 4 = 16 | 512 × 1024 PNG | `Assets/Art/Actors/<Name>/<Name>-{neutral,listening,rattled,broken}.png` | `specs/characters/*.json` (done) |
| A2 | Optional extra poses: `smug` (wrong objection, §4.2), `walk` (stand-and-walk after a break) | 4–8 | 512 × 1024 PNG | same folder | Add pose + optional `@input smug` |
| A3 | Victim Edmund Harlow: chalk outline floor decal (rough chalk stroke) + dust ghost standing / falling | 1 + 2 | 1024 × 512 + 512 × 1024 PNG | `Assets/Art/Actors/Harlow/` | New `victim.json` (dust mode, chalk mode) |
| A4 | Suggestion ghosts (1:1 dotted ivory 60 % outline per suspect) | 4 | 512 × 1024 PNG | `Assets/Art/Ghosts/<Name>-suggestion.png` | New "outline-dots" render mode |
| A5 | Reconstruction dust ghosts (75 %): culprit in coral, others ivory; standing + mid-stride; Vale frozen mid-stride for bullet time | 4 × 2 + 1 | 512 × 1024 PNG | `Assets/Art/Ghosts/<Name>-dust-{stand,stride}.png` | dust mode (exists) |
| A6 | Pawn cameos (12 cm pawns, brass ring + bust) | 5 | 256 × 256 PNG | `Assets/Art/Pawns/` | Crop of A1 + brass ring |
| A7 | Pawn bodies | 1 | GLB lathe, ~1k tris | `Assets/Art/Props/Pawn.glb` | props spec |
| B1 | Evidence Polaroids, one per HeroCase evidence: E_VICTIM_LAMP, E_VICTIM_MUG, E_VALE_LAMP, E_KETTLE_COLD, E_CABLE, E_RECORDING, E_CLOCK_FOUND, E_TRUST_NOTE, E_LETTER, E_VOICEMAIL, E_UV_DRAG (violet), E_S1/S3/S4_ALIBI, E_O2–O5_LOCATION, E_S1–S4_BASELINE, E_S2_BASELINE_MUG | 23 | 512 × 640 PNG | `Assets/Art/Cards/Card_<EvidenceId>.png` | **Generate specs from `HeroCaseHarlow1041.ts`** (canonical caption, holder label, time) + a small scene table per holder type |
| B2 | Dossier cards (victim + 4 suspects: bust, name, persona line) + face-down back + "sealed" card | 7 | 512 × 640 PNG | `Assets/Art/Cards/` | Case cast |
| B3 | Private refutation card frame (coral, no text; Lens Text overlays) | 1 | 512 × 640 PNG | `Assets/Art/Cards/RefutationFrame.png` | |
| C1 | Virtual substitutions: O2 candlestick (done), O3 letter knife, O5 marble bookend, O7 evidence clock (hands as separate nodes), O12 dictation recorder | 5 | GLB unlit + vertex colour | `Assets/Art/Props/*.glb` | `specs/props` (lathe / extrude / box kinds) |
| C2 | Preview-room stand-ins matching Wadood's room (desk lamp, kettle, mug (done), medicine bottle, cable curve, sealed letter) | 6 | GLB | `Assets/Art/Props/` | For the simulated room / match cuts |
| C3 | Bullet-time cup beads + shard sprites | 2 | 128 px PNG | `Assets/Art/FX/` | |
| D1 | Icons: verbs (Ask, Press, Present, Object, Suggest, Accuse), tells (glint, still, glare, glove), composure / credibility pip, hunch | ~13 | 128 × 128 PNG | `Assets/Art/UI/Icons/` | New `icons.json` (stroke-only, palette by role) |
| D2 | Hazard chevron tape tile, forensic bracket, engraved plaque frame | 3 | 512 × 64 / 128 / 512 × 128 PNG | `Assets/Art/UI/` | |
| E1 | FX sprites: dust speck, spark, 4-point star flare, chalk grain tile, UV drag smear (violet), rain streak | 6 | 64–1024 PNG | `Assets/Art/FX/` | |
| E2 | OBJECTION word texture (white core + yellow edge, transparent) for the in-Lens slam (replaces the flat stamp) + LIAR! + CASE CLOSED | 3 | 1024 × 256 PNG | `Assets/Art/UI/Hero/` | Motion text helper |
| F1 | Flipbooks (2D Animation From Files, ≤ 2048 sheet): lighter flame loop 8 f, brooch flare 8 f, Polaroid develop 12 f (optional; a shader fade is cheaper) | 2–3 | 128–256 px frames | `Assets/Art/Flipbooks/<name>/####.png` | Motion runner `--still` frames |
| G1 | Video: title card (done), OBJECTION overlay (done), CASE CLOSED end card + credits ("Lens Studio 5.23.2 · CLAD"), suspect line-up (4 portraits developing), speck-wipe transition, honesty badges `Captured on Spectacles` / `Lens Studio Preview — simulated room` (lower-third, alpha) | 7 | 1920 × 1080 MP4 + alpha WebM | `devpost/media/video/` | `specs/motion/*.json` |
| H1 | Devpost thumbnail (3:2) and cover/gallery stills; Spectacles Lens preview image (3:4) + icon | 4 | PNG/JPG | `devpost/media/` | New `still` motion type (frame 0 of a composition). Check Devpost's current ratio when uploading. |

The Lens-side total for A–F is ≈ 70 PNG + 12 GLB, estimated at 12–16 MB before compression. That is within 25 MB if the @2x files stay out.

## 7. Work package for Codex

Goal: move the generator into the repo, mass-produce section 6, and wire the Lens-side assets through CLAD VirtualScene.

1. **Move.** Copy `R4\{run.mjs,web,specs,package.json}` to `Tooling/art/`, and `review.py` too if it is wanted.
   - Make it a separate package with its own `package.json`/lockfile (three 0.170.0, playwright-core ^1.64, @fontsource/{anton,courier-prime,alfa-slab-one,special-elite}). That keeps vitest/engine dependencies clean.
   - Default `--out ../../` mapping:
     - `out/Art/**` → `Assets/Art/**`
     - `Motion` → `devpost/media/video`
     - `Previews` / `contact-sheet` → `Tooling/art/out/`, gitignored.
   - Gitignore `Tooling/art/out/`, `Motion/*/frames/` and `node_modules`.
   - Run `check-secrets` (no credentials are involved).
2. **Case-driven card specs.** Add `Tooling/art/scripts/cards-from-case.ts`, which imports `Assets/Scripts/Content/HeroCaseHarlow1041.ts` via tsx and emits `specs/cards/*.json`:
   - caption = evidence `canonical`
   - holder label from `objects[].label`
   - time parsed from entities
   - scene from a holder-type table (lamp / mug / kettle / cable / recorder / clock / door / window / bed / letter / UV)

   No duplicated story text.
3. **Generator features to add.**
   - Pose `anchor` auto-solve for tell props, plus the test below.
   - Render modes `outline-dots` (A4) and chalk (A3).
   - Prop kinds `extrude` (knife, bookend) and `box` (recorder, crate hardware), with an optional clock hand node.
   - `icons.json`, the `still` composition type and flipbook export.
4. **Generate:** `cd Tooling/art && npm ci && npm run art`.
5. **Import and wire (VirtualScene, log each step in `devpost/clad-log.md`):**
   - Let Lens import `Assets/Art/**` (asset refresh / `AssetManager.findCopyOrImport` as for the SFX).
   - **Texture settings:** clamp, bilinear, mipmaps off for actors (matching the puppet material); compression on.
   - **Actors:** for each `RoomscriptSuspectActor` (Vale/S2, Qadir/S1, Okafor/S3, Pike/S4), set `neutral/listening/rattled/broken` to the four new textures. Remove the old `Assets/Actor/*_512x1024.png` and `Vale-*.png` only after the captures pass, and keep the SVG history in git.
   - **Shader:** apply the one-line puppet rim change (§5) in `RoomscriptPuppet.graphShader`, as a CLAD shader-graph edit.
   - **Cards:** add a small `RoomscriptArtRegistry.ts` with `@input` `Texture[] cards` + `string[] cardIds`. Order and IDs come from a generated `Assets/Scripts/Content/ArtManifest.ts` (emitted by the generator). Wire it into ClueController/EvidenceWallet so the Polaroid quad (9 × 11.25 cm, unlit, `baseTex`) shows the image above a holder, with Text kept for accessibility.
   - **GLB:** import with "Convert meters to centimeters" and "Import vertex color". If the imported material ignores vertex colour, assign a CLAD shader-graph unlit material that outputs `vertexColor`. Place the props at the hero object positions (O2 / O3 / O5 / O7 / O12) via RoomBinding anchors, replacing the PropMesh boxes for virtual substitutions.
   - **Video:** cut `devpost/media/video/*.mp4` into the edit, using screen/add blend over the Preview capture, or the alpha WebM.
6. **NOTICE.** Add:
   - three.js (MIT)
   - playwright-core (Apache-2.0, tool)
   - Anton, Alfa Slab One, Courier Prime (OFL-1.1)
   - Special Elite (Apache-2.0)
   - a note that the ffmpeg binary is a user-installed tool (imageio-ffmpeg, GPL/LGPL build) and is not shipped

   All portraits, props, cards and motion are original procedural art; no artist styles or characters are referenced.

**Acceptance checks**

1. `npm run art` exits 0 in under 5 min. A second run produces identical sha256 for every PNG/GLB in `manifest.json` (add `npm run art:verify`).
2. Contract test (vitest in `Tooling/art/tests`), for every A1 PNG:
   - 512 × 1024 RGBA
   - mouth window (x 220–292, y 256–338) contains ≥ 100 dark opaque pixels
   - tell-prop centroid within **12 px (≈ 2 cm)** of its TellVisual anchor
   - bottom 15 % alpha = 0
   - fraction of pixels with luminance × alpha > 0.5 ≤ 25 % (luminance budget)
3. Card test: every evidence ID in the hero case has `Card_<id>.png` at 512 × 640, with a caption ≤ 3 lines (the generator throws on overflow).
4. Lens:
   - compile/start clean
   - Logger free of import errors
   - LEAF `roomscript-cast` passes
   - Preview captures of each actor in all 4 poses at about 1.3 m, with the tell flash overlapping the drawn prop (brooch, lighter, glasses, glove), saved under `docs/captures/2026-11-0x-art-*.png`
   - a candlestick capture with correct scale (about 34 cm including the candle)
5. Budget: Lens package ≤ 25 MB, with a texture memory figure recorded in PROGRESS.md. No `@2x` files under `Assets/`.
6. Video: MP4s play in the editor at 1080p30, and both honesty badges exist.

## 8. Licences used in the prototype

| Package | Licence | Role |
|---|---|---|
| three 0.170.0 | MIT | Code |
| playwright-core 1.64.1 | Apache-2.0 | Tool |
| @fontsource/anton 5.3.0 | OFL-1.1 | Font |
| @fontsource/alfa-slab-one 5.3.0 | OFL-1.1 | Font |
| @fontsource/courier-prime 5.3.0 | OFL-1.1 | Font |
| @fontsource/special-elite 5.3.0 | Apache-2.0 | Font |
| Chromium 1248 | Playwright-managed | Tool |
| ffmpeg 7.1 (gyan essentials build, via the user's imageio-ffmpeg Python package) | GPL/LGPL | Tool only; not distributed |

No third-party textures, models or artwork were used. All designs are original and parametric.
