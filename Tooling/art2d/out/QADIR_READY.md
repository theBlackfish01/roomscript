# Qadir: ready (2026-11-06 21:44 UTC)

**Complete.** Files are in `Tooling/art2d/out/Qadir/`. The contact sheet is `docs/captures/2026-11-07-run9-contact-qadir.png`.

- **Height:** 175 cm on the shared scale (976 px = 170 cm, 5.741 px/cm, baseline y=1016).
- **Total size:** 0.969 MB.

| Frame | Body layer | Head layer (512x512) | Canvas |
|---|---|---|---|
| neutral | `Qadir-neutral.png` (129 KB) | `Qadir-neutral-head.png` (48 KB) | 512x1024 |
| speaking | `Qadir-neutral.png` (129 KB) **shared** | `Qadir-speaking-head.png` (49 KB) | 512x1024 |
| mouthopen | `Qadir-neutral.png` (129 KB) **shared** | `Qadir-mouthopen-head.png` (49 KB) | 512x1024 |
| rattled | `Qadir-rattled.png` (131 KB) | `Qadir-rattled-head.png` (49 KB) | 512x1024 |
| broken | `Qadir-broken.png` (128 KB) | `Qadir-broken-head.png` (58 KB) | 512x1024 |
| smug | `Qadir-smug.png` (127 KB) | `Qadir-smug-head.png` (46 KB) | 512x1024 |
| tell | `Qadir-tell.png` (129 KB) | `Qadir-tell-head.png` (49 KB) | 512x1024 |

To draw a frame, draw the body, then the head layer on top at `headLayerRect`. The head layer's lower part feathers into the body. A `headLayerRect.y` below 0 means the head layer extends above the body canvas, so let that quad overhang. Frames marked **shared** reuse the neutral body; only the head swaps (lip flap).

## Anchors

Normalised 0..1, origin at the top left of the frame canvas. `rightHand` and `leftHand` are the character's own. The source of truth is `Tooling/art2d/out/anchors.json`.

| Frame | headLayerRect | faceBox | eyes | mouthBox | tellProp | rightHand | leftHand | feet | from |
|---|---|---|---|---|---|---|---|---|---|
| neutral | x 0.2954 y -0.0179 w 0.4315 h 0.2157 | x 0.4396 y 0.0455 w 0.1591 h 0.0977 | (0.5138, 0.0798) | x 0.4949 y 0.1068 w 0.0674 h 0.0135 | (0.3817, 0.2605) | (0.3871, 0.278) | (0.7377, 0.4734) | (0.5, 0.9922) | neutral |
| speaking | x 0.2954 y -0.0179 w 0.4315 h 0.2157 | x 0.4396 y 0.0455 w 0.1591 h 0.0977 | (0.5138, 0.0798) | x 0.4949 y 0.1068 w 0.0674 h 0.0135 | (0.3817, 0.2605) | (0.3871, 0.278) | (0.7377, 0.4734) | (0.5, 0.9922) | neutral |
| mouthopen | x 0.2954 y -0.0179 w 0.4315 h 0.2157 | x 0.4396 y 0.0455 w 0.1591 h 0.0977 | (0.5138, 0.0798) | x 0.4949 y 0.1068 w 0.0674 h 0.0135 | (0.3817, 0.2605) | (0.3871, 0.278) | (0.7377, 0.4734) | (0.5, 0.9922) | neutral |
| rattled | x 0.2954 y -0.0179 w 0.4315 h 0.2157 | x 0.4396 y 0.0455 w 0.1591 h 0.0977 | (0.5138, 0.0798) | x 0.4949 y 0.1068 w 0.0674 h 0.0135 | (0.3817, 0.2605) | (0.3871, 0.278) | (0.7377, 0.4734) | (0.5, 0.9922) | neutral |
| broken | x 0.2954 y 0.0293 w 0.4315 h 0.2157 | x 0.4329 y 0.1196 w 0.1578 h 0.0788 | (0.5179, 0.1432) | x 0.503 y 0.1796 w 0.062 h 0.0121 | (0.3938, 0.2995) | (0.3884, 0.3272) | (0.739, 0.4734) | (0.5, 0.9922) | broken |
| smug | x 0.2954 y -0.0179 w 0.4315 h 0.2157 | x 0.4396 y 0.0455 w 0.1591 h 0.0977 | (0.5138, 0.0798) | x 0.4949 y 0.1068 w 0.0674 h 0.0135 | (0.3817, 0.2605) | (0.3871, 0.278) | (0.7377, 0.4734) | (0.5, 0.9922) | neutral |
| tell | x 0.2954 y -0.0179 w 0.4315 h 0.2157 | x 0.4396 y 0.0455 w 0.1591 h 0.0977 | (0.5179, 0.0812) | x 0.4976 y 0.1095 w 0.062 h 0.0121 | (0.3331, 0.2038) | (0.3237, 0.2362) | (0.7377, 0.4734) | (0.5, 0.9922) | tell |

**Notes:**
- **Base:** c2 of 3, the charming one with the brass lighter held up. His trousers were lightened to warm stone by one edit (light-c1), so nothing reads dark-on-dark on the additive display.
- **Picks:** speaking c1, mouthopen c2, rattled c2, broken c1 (head bowed, lighter lowered; the head layer is offset down), smug c2 (chin up, eyes half-closed), tell c1 (the lighter flicked open with a small flame, his smile gone).
- **Anchors:** `tellProp` is the brass lighter; in tell it is the open lighter, with the flame just above it. `rightHand` holds the lighter, and `leftHand` is in his coat pocket.
- **Floor shadow:** the generator's shadow under his shoes was removed by the cutout (`--shadow-y0`).
- **Head layer:** `headLayerRect.y` is slightly negative (he is 175 cm), so let the head quad overhang the body canvas by about 2%.
