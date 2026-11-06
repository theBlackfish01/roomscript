# Harlow: ready (2026-11-06 21:32 UTC)

**Complete.** Files are in `Tooling/art2d/out/Harlow/`. The contact sheet is `docs/captures/2026-11-07-run9-contact-harlow.png`.

- **Height:** 172 cm on the shared scale (976 px = 170 cm, 5.741 px/cm, baseline y=1016).
- **Total size:** 0.403 MB.

| Frame | Body layer | Head layer (512x512) | Canvas |
|---|---|---|---|
| standing | `Harlow-standing.png` (96 KB) | `Harlow-standing-head.png` (49 KB) | 512x1024 |
| staggering | `Harlow-staggering.png` (108 KB) | `Harlow-staggering-head.png` (66 KB) | 512x1024 |
| fallen | `Harlow-fallen.png` (94 KB) | - | 1024x512 |

To draw a frame, draw the body, then the head layer on top at `headLayerRect`. The head layer's lower part feathers into the body. A `headLayerRect.y` below 0 means the head layer extends above the body canvas, so let that quad overhang. Frames marked **shared** reuse the neutral body; only the head swaps (lip flap).

## Anchors

Normalised 0..1, origin at the top left of the frame canvas. `rightHand` and `leftHand` are the character's own. The source of truth is `Tooling/art2d/out/anchors.json`.

| Frame | headLayerRect | faceBox | eyes | mouthBox | tellProp | rightHand | leftHand | feet | from |
|---|---|---|---|---|---|---|---|---|---|
| standing | x 0.317 y 0 w 0.3854 h 0.1925 | x 0.4273 y 0.0422 w 0.177 h 0.1122 | (0.5144, 0.0905) | x 0.4736 y 0.119 w 0.0899 h 0.015 | (0.5144, 0.0905) | (0.3034, 0.4537) | (0.7214, 0.4537) | (0.5, 0.9922) | standing |
| staggering | x 0.4709 y 0.0415 w 0.3854 h 0.1925 | x 0.5757 y 0.0646 w 0.1907 h 0.1361 | (0.6574, 0.1041) | x 0.6207 y 0.1449 w 0.0654 h 0.0218 | (0.6574, 0.1041) | (0.2325, 0.1973) | (0.7664, 0.2878) | (0.5, 0.9922) | staggering |
| fallen | - | x 0.0221 y 0.4329 w 0.1348 h 0.237 | (0.0824, 0.5223) | x 0.1108 y 0.484 w 0.0284 h 0.0426 | (0.1009, 0.4641) | (0.4322, 0.8983) | (0.1995, 0.6188) | (0.9644, 0.7082) | fallen |

**Notes:**
- **Base:** c2 of 3, then lightened by one edit (dove-grey trousers, tan shoes, light-c2) so that nothing reads dark-on-dark on the additive display.
- **staggering** is c1. It is placed by the feet on the same baseline and px/cm. The head layer follows the head, which is offset to the right.
- **fallen** is c2 on a **1024x512** canvas at the same px/cm (172 cm spans about 990 px). The lowest point is on y=504. It has no head layer, because it is seen from a distance on the floor.
  - The generator's soft floor shadow was removed (neutral-grey pixels outside the ink outline); a tiny patch remains under the hair.
  - `leftHand` on fallen is hidden behind the body, so treat it as an estimate.
- **Ghost use:** apply the ghost material (tint, alpha) to these same textures; the palette is light, so a cyan tint reads well.
- **tellProp:** his glasses (Harlow has no tell).
