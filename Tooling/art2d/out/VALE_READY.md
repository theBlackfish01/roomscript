# Vale: ready (2026-11-06 21:36 UTC)

**Complete.** Files are in `Tooling/art2d/out/Vale/`. The contact sheet is `docs/captures/2026-11-07-run9-contact-vale.png`.

- **Height:** 170 cm on the shared scale (976 px = 170 cm, 5.741 px/cm, baseline y=1016).
- **Total size:** 0.814 MB.

| Frame | Body layer | Head layer (512x512) | Canvas |
|---|---|---|---|
| neutral | `Vale-neutral.png` (73 KB) | `Vale-neutral-head.png` (47 KB) | 512x1024 |
| speaking | `Vale-neutral.png` (73 KB) **shared** | `Vale-speaking-head.png` (49 KB) | 512x1024 |
| mouthopen | `Vale-neutral.png` (73 KB) **shared** | `Vale-mouthopen-head.png` (47 KB) | 512x1024 |
| rattled | `Vale-rattled.png` (74 KB) | `Vale-rattled-head.png` (47 KB) | 512x1024 |
| smug | `Vale-smug.png` (74 KB) | `Vale-smug-head.png` (47 KB) | 512x1024 |
| tell | `Vale-tell.png` (76 KB) | `Vale-tell-head.png` (47 KB) | 512x1024 |
| broken | `Vale-broken.png` (75 KB) | `Vale-broken-head.png` (50 KB) | 512x1024 |
| tableau | `Vale-tableau.png` (80 KB) | `Vale-tableau-head.png` (47 KB) | 768x1024 |

To draw a frame, draw the body, then the head layer on top at `headLayerRect`. The head layer's lower part feathers into the body. A `headLayerRect.y` below 0 means the head layer extends above the body canvas, so let that quad overhang. Frames marked **shared** reuse the neutral body; only the head swaps (lip flap).

## Anchors

Normalised 0..1, origin at the top left of the frame canvas. `rightHand` and `leftHand` are the character's own. The source of truth is `Tooling/art2d/out/anchors.json`.

| Frame | headLayerRect | faceBox | eyes | mouthBox | tellProp | rightHand | leftHand | feet | from |
|---|---|---|---|---|---|---|---|---|---|
| neutral | x 0.2893 y 0.0114 w 0.4196 h 0.2097 | x 0.4348 y 0.0757 w 0.1585 h 0.0922 | (0.514, 0.114) | x 0.4894 y 0.1354 w 0.0623 h 0.0156 | (0.6296, 0.2633) | (0.5413, 0.4372) | (0.5972, 0.447) | (0.5, 0.9922) | neutral |
| speaking | x 0.2893 y 0.0114 w 0.4196 h 0.2097 | x 0.4348 y 0.0757 w 0.1585 h 0.0922 | (0.514, 0.114) | x 0.4894 y 0.1354 w 0.0623 h 0.0156 | (0.6296, 0.2633) | (0.5413, 0.4372) | (0.5972, 0.447) | (0.5, 0.9922) | neutral |
| mouthopen | x 0.2893 y 0.0114 w 0.4196 h 0.2097 | x 0.4348 y 0.0757 w 0.1585 h 0.0922 | (0.514, 0.114) | x 0.4894 y 0.1354 w 0.0623 h 0.0156 | (0.6296, 0.2633) | (0.5413, 0.4372) | (0.5972, 0.447) | (0.5, 0.9922) | neutral |
| rattled | x 0.2893 y 0.0114 w 0.4196 h 0.2097 | x 0.4348 y 0.0757 w 0.1585 h 0.0922 | (0.514, 0.114) | x 0.4894 y 0.1354 w 0.0623 h 0.0156 | (0.6296, 0.2633) | (0.5413, 0.4372) | (0.5972, 0.447) | (0.5, 0.9922) | neutral |
| smug | x 0.2893 y 0.0114 w 0.4196 h 0.2097 | x 0.4348 y 0.0757 w 0.1585 h 0.0922 | (0.514, 0.114) | x 0.4894 y 0.1354 w 0.0623 h 0.0156 | (0.6296, 0.2633) | (0.5413, 0.4372) | (0.5972, 0.447) | (0.5, 0.9922) | neutral |
| tell | x 0.2893 y 0.0114 w 0.4196 h 0.2097 | x 0.4348 y 0.0744 w 0.1585 h 0.0922 | (0.5127, 0.1127) | x 0.492 y 0.1367 w 0.0572 h 0.0143 | (0.6322, 0.2613) | (0.3374, 0.5703) | (0.6816, 0.2685) | (0.5, 0.9922) | tell |
| broken | x 0.2893 y 0.0504 w 0.4196 h 0.2097 | x 0.4517 y 0.1283 w 0.1754 h 0.0876 | (0.5465, 0.1679) | x 0.5192 y 0.1919 w 0.0572 h 0.0117 | (0.6283, 0.2776) | (0.501, 0.4853) | (0.592, 0.4885) | (0.5, 0.9922) | broken |
| tableau | x 0.3596 y 0.0114 w 0.2797 h 0.2097 | x 0.4565 y 0.0744 w 0.1056 h 0.0935 | (0.5094, 0.1114) | x 0.4964 y 0.136 w 0.0416 h 0.0143 | (0.5882, 0.2587) | (0.3111, 0.275) | (0.7293, 0.2782) | (0.5, 0.9922) | tableau |

**Notes:**
- **First delivery** was about 02:00 PKT. This version adds full anchor tables. Anchor values are unchanged, except that `feet` is now the normaliser pivot (0.5, 0.9922).
- **Base:** the style reference itself (gpt-image-2, medium). The other frames are gpt-image-2 edits from it; input fidelity is high automatically.
- **Picks:** speaking c1, mouthopen c1, tell c1 (eyes cut hard to the side; her left hand pinches the brass brooch; the right arm hangs), rattled c1, broken c1 (the head layer is offset down to cover her bowed head), smug c2, tableau c1.
- **Tableau** is on a **768x1024** canvas at the same px/cm, with feet at x=0.5. The cable is drawn in the image, taut between her fists, with frayed ends dangling. `rightHand`/`leftHand` are her fists, where any 3D cable or thread attaches.
- **Lip flap:** keep the neutral body and swap only the head (neutral, speaking, mouthopen). The speaking and mouthopen heads are registered to the neutral body.
- **Sharpness:** the head layer is a 1.58x Lanczos upscale of the native generation plus a light unsharp mask. If the face still reads soft at 1.4 m, say so: a higher-resolution regeneration (custom sizes up to 2048x3072) is possible.
