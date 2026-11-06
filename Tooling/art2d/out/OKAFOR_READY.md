# Okafor: ready (2026-11-06 21:46 UTC)

**Complete.** Files are in `Tooling/art2d/out/Okafor/`. The contact sheet is `docs/captures/2026-11-07-run9-contact-okafor.png`.

- **Height:** 167 cm on the shared scale (976 px = 170 cm, 5.741 px/cm, baseline y=1016).
- **Total size:** 0.652 MB.

| Frame | Body layer | Head layer (512x512) | Canvas |
|---|---|---|---|
| neutral | `Okafor-neutral.png` (81 KB) | `Okafor-neutral-head.png` (39 KB) | 512x1024 |
| mouthopen | `Okafor-neutral.png` (81 KB) **shared** | `Okafor-mouthopen-head.png` (39 KB) | 512x1024 |
| tell | `Okafor-tell.png` (78 KB) | `Okafor-tell-head.png` (40 KB) | 512x1024 |
| speaking | `Okafor-neutral.png` (81 KB) **shared** | `Okafor-speaking-head.png` (39 KB) | 512x1024 |
| smug | `Okafor-smug.png` (80 KB) | `Okafor-smug-head.png` (38 KB) | 512x1024 |
| rattled | `Okafor-rattled.png` (79 KB) | `Okafor-rattled-head.png` (38 KB) | 512x1024 |
| broken | `Okafor-broken.png` (75 KB) | `Okafor-broken-head.png` (43 KB) | 512x1024 |

To draw a frame, draw the body, then the head layer on top at `headLayerRect`. The head layer's lower part feathers into the body. A `headLayerRect.y` below 0 means the head layer extends above the body canvas, so let that quad overhang. Frames marked **shared** reuse the neutral body; only the head swaps (lip flap).

## Anchors

Normalised 0..1, origin at the top left of the frame canvas. `rightHand` and `leftHand` are the character's own. The source of truth is `Tooling/art2d/out/anchors.json`.

| Frame | headLayerRect | faceBox | eyes | mouthBox | tellProp | rightHand | leftHand | feet | from |
|---|---|---|---|---|---|---|---|---|---|
| neutral | x 0.3374 y 0.0286 w 0.4121 h 0.2061 | x 0.4632 y 0.0916 w 0.1643 h 0.0886 | (0.5518, 0.1224) | x 0.5223 y 0.1481 w 0.0667 h 0.0141 | (0.5518, 0.1211) | (0.5326, 0.4402) | (0.625, 0.4582) | (0.5, 0.9922) | neutral |
| mouthopen | x 0.3374 y 0.0286 w 0.4121 h 0.2061 | x 0.4632 y 0.0916 w 0.1643 h 0.0886 | (0.5518, 0.1224) | x 0.5223 y 0.1481 w 0.0667 h 0.0141 | (0.5518, 0.1211) | (0.5326, 0.4402) | (0.625, 0.4582) | (0.5, 0.9922) | neutral |
| tell | x 0.3374 y 0.0286 w 0.4121 h 0.2061 | x 0.4658 y 0.0999 w 0.154 h 0.0828 | (0.5454, 0.132) | x 0.5261 y 0.159 w 0.0616 h 0.0128 | (0.5313, 0.1404) | (0.503, 0.1699) | (0.6044, 0.4428) | (0.5, 0.9922) | tell |
| speaking | x 0.3374 y 0.0286 w 0.4121 h 0.2061 | x 0.4632 y 0.0916 w 0.1643 h 0.0886 | (0.5518, 0.1224) | x 0.5223 y 0.1481 w 0.0667 h 0.0141 | (0.5518, 0.1211) | (0.5326, 0.4402) | (0.625, 0.4582) | (0.5, 0.9922) | neutral |
| smug | x 0.3374 y 0.0286 w 0.4121 h 0.2061 | x 0.4632 y 0.0916 w 0.1643 h 0.0886 | (0.5518, 0.1224) | x 0.5223 y 0.1481 w 0.0667 h 0.0141 | (0.5518, 0.1211) | (0.5326, 0.4402) | (0.625, 0.4582) | (0.5, 0.9922) | neutral |
| rattled | x 0.3374 y 0.0286 w 0.4121 h 0.2061 | x 0.4632 y 0.0916 w 0.1643 h 0.0886 | (0.5518, 0.1224) | x 0.5223 y 0.1481 w 0.0667 h 0.0141 | (0.5518, 0.1211) | (0.5326, 0.4402) | (0.625, 0.4582) | (0.5, 0.9922) | neutral |
| broken | x 0.3374 y 0.08 w 0.4121 h 0.2061 | x 0.5018 y 0.1526 w 0.1412 h 0.0758 | (0.589, 0.1866) | x 0.5634 y 0.2104 w 0.0513 h 0.0103 | (0.5878, 0.186) | (0.5403, 0.4723) | (0.6044, 0.4781) | (0.5, 0.9922) | broken |

**Notes:**
- **Base:** c1 of 3: composed and precise, with thin metal glasses, a teal scarf and the strongest cyan rim.
- **Picks:** speaking c1, mouthopen c2, rattled c1 (c2 drifted wider and older), broken c2 (bowed, but the face stays readable; the head layer is offset down), smug c2, tell c1.
  - tell is candidate c2 of its request (raw/Okafor-tell-c2.png): she pushes the glasses up at the bridge with one finger, jaw set.
- **Anchors:** `tellProp` is her glasses (bridge). In tell, `rightHand` is the hand at her glasses.
