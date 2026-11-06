# NOTICE lines for the Run 9 illustrated cast

The main session pastes these into `NOTICE`.

```
Illustrated characters (Assets/Art/... imported from Tooling/art2d/out/: Vale, Qadir, Okafor, Pike, Harlow)
  Generated with OpenAI gpt-image-2 via the OpenAI Images API (images/generations and images/edits),
  November 2026. Under OpenAI's Terms of Use, the user owns the output. Prompts, models, sizes,
  quality and token usage are recorded per request in Tooling/results/openai-images-ledger.json; per-frame
  choices are in Tooling/art2d/CHOICES.md and Tooling/art2d/ledger.json. No seeds (the API exposes none).
  Style reference: docs/art/2026-11-07-vale-style-reference.png (gpt-image-2, medium, 1024x1536).
  Post-processing (all local, no third-party art):
    - background removal: our own flood-fill cutout (Tooling/art2d/scripts/cutout.py; NumPy BSD-3-Clause,
      SciPy BSD-3-Clause, Pillow MIT-CMU (HPND))
    - resizing, compositing, PNG palette quantisation: sharp (Apache-2.0) with libvips (LGPL-2.1+) and
      libimagequant (GPL-3.0-or-later, used as a build tool only; no code from it ships in the lens)
    - palette repair: Tooling/art2d/scripts/palfix.py (ours)
```

If the rembg/BiRefNet route is used for any frame, add this line. So far it is not used:

```
    - rembg (MIT) with the BiRefNet model (MIT) for background removal of <frames>
```
