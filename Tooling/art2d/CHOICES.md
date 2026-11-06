# Run 9 art choices (Tooling/art2d)

The model is `gpt-image-2` throughout: quality medium, 1024x1536, edits endpoint. Input fidelity is always high for gpt-image-2, so the `input_fidelity` parameter is omitted (the API rejects changing it). The prompts are in `scripts/jobs.mjs`. The exact text of every request is in `Tooling/results/openai-images-ledger.json`.

## Pipeline decisions

- **Cutout: flood fill from the border on the flat grey background** (`scripts/cutout.py`) rather than rembg/BiRefNet.
  - The images have a continuous dark ink outline on a flat grey ground, so the fill stops cleanly at the line.
  - Enclosed gaps, for example between an arm and the body, are removed when they are large and match the background colour.
  - Edge colour is bled in from the nearest solid pixel (the ink), which removes the 1–2 px light-grey halo the generator paints just outside the outline. That halo would glow on the additive display.
  - rembg was not needed. Only about 1.4 GB of RAM was free alongside Lens Studio.
- **Quantisation:** sharp/libimagequant (256 colours, dither 1.0), then `scripts/palfix.py`.
  - libimagequant dropped small-area colours: Vale's brass brooch turned copper.
  - palfix merges the 40 closest palette pairs, then adds 40 colours clustered from the pixels with the largest blurred error. The brass comes back, and the files get smaller.
- **Layers:**
  - A 512x1024 body, plus a 512x512 head layer cropped from the full-resolution cutout: a square of 22% of the figure's height, upscaled about 1.58x with Lanczos and a light unsharp mask. Its lower 28% feathers into the body.
  - speaking and mouthopen share the neutral body, so the lip flap swaps only the head. Their head layers are registered to neutral (translation search), and the seam was checked at 3x.
  - Every other frame has its own body, registered to neutral on the legs and feet so the feet never jump.

## Vale

- **base:** the style reference itself, `docs/art/2026-11-07-vale-style-reference.png`. It is the agreed look; no fresh candidate was needed.
- **speaking:** c1. The mouth is just parted and the face engaged; c2 is very close, with the mouth slightly wider. c1 gives a cleaner flap against mouthopen.
- **mouthopen:** c1. Clearly more open than speaking, with the same expression; c2 was too close to speaking.
- **tell:** c1. Her eyes cut hard sideways and her left hand pinches the brass brooch, while the right arm hangs. c2 had a weaker eye cut.
- **rattled:** c1. Wide eyes and a raised, knitted brow, which reads at room distance; c2 was more subtle.
- **broken:** c1. Head bowed, eyes down; it keeps her slim face, where c2 drifted rounder and older.
- **smug:** c2. A clearer closed-mouth half-smile with the chin up; c1 was close to neutral.
- **tableau:** c1. The taut cable is held at chest height between her fists, with frayed ends dangling inside the frame, and her face is cold and intense. In c2 the cable ran off the image edges.
  - The tableau gets a wider 768x1024 canvas at the same px/cm.

## Qadir

- **base:** c2 of 3. It is the most charming of the three, and holds the brass lighter up at chest height, which reads as a signature prop. c1 and c3 were close in look, but their lighter was less visible.
  - All three had dark charcoal trousers, which read dark-on-dark on the additive display. One edit lightened them to warm stone with tan shoes (light-c1 chosen; light-c2 was greyer and closer to the background).
- **speaking:** c1.
- **mouthopen:** c2, clearly more open than speaking.
- **rattled:** c2, with a stronger knitted brow.
- **broken:** c1, slumped and looking down at the lowered lighter.
- **smug:** c2, chin up and eyes half-closed.
- **tell:** c1. The lighter is flicked open with a small flame, and the smile is gone. c2 kept the lighter closed.

## Okafor

- **base:** c1 of 3, composed and precise, with the clearest teal/cyan accent and elongated, Vale-like elegance.
- **speaking:** c1, a modest opening.
- **mouthopen:** c2, clearly open. The two make a lip-flap pair.
- **rattled:** c1. c2 drifted wider and older in the face.
- **broken:** c2. In c1 her head bows so low that the face disappears.
- **smug:** c2, a clearer knowing half-smile.
- **tell:** c2, one finger at the bridge pushing the glasses up, jaw set. In c1 the finger poked at the lens.

## Pike

- **base:** c2 of 3. Pale grey three-piece suit, ivory gloves and ivory shoes, an ivory-and-silver accent, and a brittle, long-faced, nervous look. c1 had dark shoes; c3 looked too young and bland.
- **speaking:** c1, and **mouthopen:** c1. They are a matched pair: the same raised brows, with only the mouth different, so his eyes don't flicker during the lip flap.
- **tell:** c1, tugging the left glove cuff and glancing aside up-left. c2 had a weaker glance.
- **rattled:** c1, wide frightened eyes.
- **broken:** c2, a sadder face that reads at a distance.
- **smug:** c2.

## Harlow

- **brief:** made more recognisable from the old card: grey side fringe, moustache, round glasses, bow tie, waistcoat with a watch chain.
- **base:** c2 of 3, the most dignified and tired face, then lightened by one edit to dove-grey trousers and tan shoes (light-c2, warmer than c1).
- **staggering:** c1, a big backward stagger with both palms up, and the scale preserved. c2 was similar but more cramped.
- **fallen:** c2 (1536x1024), long and flat, full length, eyes closed, glasses askew. c1 was more foreshortened.
  - The generator painted a soft grey cast shadow, removed by the cutout with `--shadow-x0 170`: neutral low-chroma pixels outside the ink outline count as background.

## Fixes found during review

- **Floor shadows under the shoes** (Qadir, Harlow): removed with `--shadow-y0`, which treats neutral grey pixels below that line as background.
- **API reliability:** about 1 in 8 requests hung with no response. Two got a Cloudflare 520. `oai.mjs` now has a watchdog (4–12 min) and retries up to 3 times on 5xx or network errors. A retried request is billed only once it succeeds.
