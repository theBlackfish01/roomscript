# Pike: ready (2026-11-06 21:28 UTC)

**Complete.** Files are in `Tooling/art2d/out/Pike/`. The contact sheet is `docs/captures/2026-11-07-run9-contact-pike.png`.

- **Height:** 176 cm on the shared scale (976 px = 170 cm, 5.741 px/cm, baseline y=1016).
- **Total size:** 0.825 MB.

| Frame | Body layer | Head layer (512x512) | Canvas |
|---|---|---|---|
| neutral | `Pike-neutral.png` (103 KB) | `Pike-neutral-head.png` (44 KB) | 512x1024 |
| speaking | `Pike-neutral.png` (103 KB) **shared** | `Pike-speaking-head.png` (43 KB) | 512x1024 |
| mouthopen | `Pike-neutral.png` (103 KB) **shared** | `Pike-mouthopen-head.png` (43 KB) | 512x1024 |
| tell | `Pike-tell.png` (104 KB) | `Pike-tell-head.png` (44 KB) | 512x1024 |
| rattled | `Pike-rattled.png` (105 KB) | `Pike-rattled-head.png` (44 KB) | 512x1024 |
| broken | `Pike-broken.png` (106 KB) | `Pike-broken-head.png` (61 KB) | 512x1024 |
| smug | `Pike-smug.png` (103 KB) | `Pike-smug-head.png` (43 KB) | 512x1024 |

To draw a frame, draw the body, then the head layer on top at `headLayerRect`. The head layer's lower part feathers into the body. A `headLayerRect.y` below 0 means the head layer extends above the body canvas, so let that quad overhang. Frames marked **shared** reuse the neutral body; only the head swaps (lip flap).

## Anchors

Normalised 0..1, origin at the top left of the frame canvas. `rightHand` and `leftHand` are the character's own. The source of truth is `Tooling/art2d/out/anchors.json`.

| Frame | headLayerRect | faceBox | eyes | mouthBox | tellProp | rightHand | leftHand | feet | from |
|---|---|---|---|---|---|---|---|---|---|
| neutral | x 0.2707 y -0.0235 w 0.4343 h 0.2171 | x 0.432 y 0.0336 w 0.1291 h 0.0995 | (0.4885, 0.0699) | x 0.4724 y 0.0981 w 0.0565 h 0.0134 | (0.6203, 0.414) | (0.4508, 0.4106) | (0.5759, 0.4395) | (0.5, 0.9922) | neutral |
| speaking | x 0.2707 y -0.0235 w 0.4343 h 0.2171 | x 0.432 y 0.0336 w 0.1291 h 0.0995 | (0.4885, 0.0699) | x 0.4724 y 0.0981 w 0.0565 h 0.0134 | (0.6203, 0.414) | (0.4508, 0.4106) | (0.5759, 0.4395) | (0.5, 0.9922) | neutral |
| mouthopen | x 0.2707 y -0.0235 w 0.4343 h 0.2171 | x 0.432 y 0.0336 w 0.1291 h 0.0995 | (0.4885, 0.0699) | x 0.4724 y 0.0981 w 0.0565 h 0.0134 | (0.6203, 0.414) | (0.4508, 0.4106) | (0.5759, 0.4395) | (0.5, 0.9922) | neutral |
| tell | x 0.2707 y -0.0235 w 0.4343 h 0.2171 | x 0.4253 y 0.0457 w 0.1398 h 0.0833 | (0.4898, 0.0733) | x 0.467 y 0.1049 w 0.0565 h 0.0121 | (0.5988, 0.4301) | (0.5087, 0.4133) | (0.6324, 0.4409) | (0.5, 0.9922) | tell |
| rattled | x 0.2707 y -0.0235 w 0.4343 h 0.2171 | x 0.432 y 0.0336 w 0.1291 h 0.0995 | (0.4885, 0.0699) | x 0.4724 y 0.0981 w 0.0565 h 0.0134 | (0.6203, 0.414) | (0.4508, 0.4106) | (0.5759, 0.4395) | (0.5, 0.9922) | neutral |
| broken | x 0.2707 y 0.037 w 0.4343 h 0.2171 | x 0.4199 y 0.1122 w 0.1452 h 0.0773 | (0.4898, 0.1344) | x 0.471 y 0.1633 w 0.0538 h 0.0108 | (0.5988, 0.4402) | (0.4307, 0.457) | (0.5544, 0.463) | (0.5, 0.9922) | broken |
| smug | x 0.2707 y -0.0235 w 0.4343 h 0.2171 | x 0.432 y 0.0336 w 0.1291 h 0.0995 | (0.4885, 0.0699) | x 0.4724 y 0.0981 w 0.0565 h 0.0134 | (0.6203, 0.414) | (0.4508, 0.4106) | (0.5759, 0.4395) | (0.5, 0.9922) | neutral |

**Notes:** The base is candidate c2 of 3: a pale grey three-piece with ivory gloves and shoes, and a brittle, nervous face. Picks: speaking c1 and mouthopen c1 (a matched pair: same brows, so the eyes don't flicker during the lip flap), tell c1 (he tugs his left glove cuff with his gloved right hand and glances aside up-left), rattled c1, broken c2 (head bowed; the head layer is offset down to cover it), smug c2. tellProp is the left glove cuff. Identity is consistent across all frames.
