# Run 6 font sources

Downloaded 2026-11-05 from the official Google Fonts repository using an authorized sandbox escalation. No account or paid service was used. Files are unchanged and include their complete SIL Open Font License 1.1 texts.

| Asset | Source | SHA-256 |
|---|---|---|
| `Assets/Art/Fonts/Anton-Regular.ttf` | https://github.com/google/fonts/blob/main/ofl/anton/Anton-Regular.ttf | `a4ba3a92350ebb031da0cb47630ac49eb265082ca1bc0450442f4a83ab947cab` |
| `Assets/Art/Fonts/CourierPrime-Regular.ttf` | https://github.com/google/fonts/blob/main/ofl/courierprime/CourierPrime-Regular.ttf | `72f793376f8e2841656bf21d77a5de010f2929bd6956a22ee848ad0c7eb978af` |
| `Assets/Art/Fonts/CourierPrime-Bold.ttf` | https://github.com/google/fonts/blob/main/ofl/courierprime/CourierPrime-Bold.ttf | `ff1f38786c849d1c41fa8e447960abdb2bd75fdfb0cfcdeb524fad65a5af3638` |

Anton: Copyright 2020 The Anton Project Authors. License: `Assets/Art/Fonts/anton-OFL.txt`.

Courier Prime: Copyright 2015 The Courier Prime Project Authors. License: `Assets/Art/Fonts/courierprime-OFL.txt`.

Font bytes: 314,856. License bytes: 8,887. Runtime wiring and measured angular cap height remain a separate A5 acceptance step.

Use Anton for 3–5 degree hero titles and Courier Prime Bold for 0.6–0.8 degree case labels. At distance d centimetres, target cap height is `2*d*tan(degrees*pi/360)` centimetres. The 0.5 degree minimum from design-03 is a lower limit, not the normal target. A font's em box is larger than its measured cap height, so set and verify actual rendered capitals at the intended viewing distance.
