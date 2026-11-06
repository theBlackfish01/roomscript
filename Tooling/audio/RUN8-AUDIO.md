# Run 8 audio (object UI and wow moments)

Generated on 2026-11-06 by `Tooling/audio/run8-audio.mjs` for the object-based UI in [docs/WEARER_UX_2026-11-06.md](../../docs/WEARER_UX_2026-11-06.md). The machine-readable list is [`run8-audio-manifest.json`](run8-audio-manifest.json). The full per-file record (request ids, parameters, peak and RMS) is in `run8-audio-state.json`.

**Credits:** 735 credits, all taken from `character-cost` response headers (no estimates), in ledger segment `run8-2026-11-06` (allowance 5,000).
- 691 credits went into shipped files.
- 44 credits went into 3 discarded takes: `run8:sfx:Magnifier`, `run8:sfx:DoorKnock3`, `run8:WREN:W2`.

The ledger total is now 91732. No quota errors occurred, and nothing is missing.

## Files

Durations are measured after the silence trim. Loudness is integrated LUFS from ffmpeg loudnorm. Effects shorter than 0.5 s read low because loudness gating barely registers them.

| id | file | kind | dur s | LUFS | credits | intended use / trigger |
|---|---|---|---|---|---|---|
| FolderLift | `Assets/Audio/Run8/FolderLift.mp3` | effect | 0.546 | -25.95 | 12 | Opening: pinch + lift a case file off the crate |
| FolderOpen | `Assets/Audio/Run8/FolderOpen.mp3` | effect | 1.275 | -25.04 | 18 | Opening: pull the folder open to start Preset/Dynamic |
| Magnifier | `Assets/Audio/Run8/Magnifier.mp3` | effect | 0.962 | -23.79 | 15 | Opening: CAST THIS ROOM folder (Dynamic) magnifier |
| CrateHum | `Assets/Audio/Run8/CrateHum.mp3` | effect (loop) | 3 | -26.04 | 36 | Crate placement: glowing outline carried in hand (loop) |
| CrateLand | `Assets/Audio/Run8/CrateLand.mp3` | effect | 1.179 | -23.45 | 18 | Crate placement: crate locks onto a surface |
| LandingRing | `Assets/Audio/Run8/LandingRing.mp3` | effect | 1.394 | -25.5 | 18 | Crate placement: landing ring appears on detected table/floor |
| ThunderNear | `Assets/Audio/Run8/ThunderNear.mp3` | effect | 3.326 | -23.56 | 42 | Wow 2: storm at the real window (spatial, at window) |
| LightningCrack | `Assets/Audio/Run8/LightningCrack.mp3` | effect | 1 | -25.52 | 12 | Wow 2: lightning flash reveals the ghost silhouette |
| TapeStretch | `Assets/Audio/Run8/TapeStretch.mp3` | effect | 1.127 | -24.53 | 18 | Wow 2: tape across the real doorway ("Nobody leaves") |
| ChalkCircle | `Assets/Audio/Run8/ChalkCircle.mp3` | effect | 1.439 | -24.76 | 18 | Zone names drawn as chalk circles on the floor; chalk outline |
| PinPhoto | `Assets/Audio/Run8/PinPhoto.mp3` | effect | 0.448 | -23.45 | 10 | Wall board: memory photo pins itself |
| RedString | `Assets/Audio/Run8/RedString.mp3` | effect | 1.202 | -26.55 | 15 | Wow 4: red string connects evidence |
| WaxSealPress | `Assets/Audio/Run8/WaxSealPress.mp3` | effect | 1.098 | -27.75 | 18 | Accuse: hold pinch on the wax seal to commit |
| SpotlightOn | `Assets/Audio/Run8/SpotlightOn.mp3` | effect | 1.476 | -23.39 | 24 | Accuse: spotlight beam from finger to suspect |
| GhostWhoosh | `Assets/Audio/Run8/GhostWhoosh.mp3` | effect | 0.79 | -27.55 | 18 | Wow 3: ghost vignette appears at an object |
| ReplayRewind | `Assets/Audio/Run8/ReplayRewind.mp3` | effect | 1.48 | -23.44 | 18 | Wow 3: pulled memory blooms into a replay |
| DustBrush | `Assets/Audio/Run8/DustBrush.mp3` | effect | 0.8 | -24.52 | 18 | Wow 9: wave hand over a surface to dust for prints |
| PrintReveal | `Assets/Audio/Run8/PrintReveal.mp3` | effect | 0.417 | -28.75 | 12 | Wow 9: fingerprint glows |
| NewspaperUnfold | `Assets/Audio/Run8/NewspaperUnfold.mp3` | effect | 1.327 | -23.64 | 18 | Ending (wow 8): Morning Edition appears in your hands |
| LensCrack | `Assets/Audio/Run8/LensCrack.mp3` | effect | 0.524 | -29.99 | 8 | Credibility -1: crack in the lens icon on the palm notebook |
| PalmOpen | `Assets/Audio/Run8/PalmOpen.mp3` | effect | 0.617 | -24.78 | 10 | Palm notebook appears when the left palm turns up |
| DoorKnock3 | `Assets/Audio/Run8/DoorKnock3.mp3` | effect | 0.7 | -23.5 | 24 | Wow 7: knock from the real door (spatial, at doorway) |
| W1 | `Assets/Audio/Run8/Wren_W1_OverHere.mp3` | wren | 0.962 | -16.22 | 10 | "Over here." — Wow 7: whisper from behind the player (spatial) |
| W2 | `Assets/Audio/Run8/Wren_W2_BehindYou.mp3` | wren | 1.162 | -16.42 | 11 | "Behind you." — Wow 7: whisper from behind (spatial) |
| W3 | `Assets/Audio/Run8/Wren_W3_HoldPhoto.mp3` | wren | 1.246 | -17.78 | 16 | "Hold the photo up to her." — Hint: present a memory photo to a suspect |
| W4 | `Assets/Audio/Run8/Wren_W4_PointGuest.mp3` | wren | 2.32 | -16.76 | 23 | "Point at another guest to ask about them." — Hint: point at a suspect to ask about them |
| W5 | `Assets/Audio/Run8/Wren_W5_PalmNotebook.mp3` | wren | 2.868 | -16.43 | 22 | "Turn your left palm up. Your notebook." — Hint: first palm-notebook prompt |
| W6 | `Assets/Audio/Run8/Wren_W6_CarryWords.mp3` | wren | 2.882 | -17.57 | 28 | "Carry her words to the thing that proves her wrong." — Hint: objection by carrying a statement to evidence |
| W7 | `Assets/Audio/Run8/Wren_W7_SetCase.mp3` | wren | 1.947 | -16.68 | 17 | "Set the case down on a table." — Crate placement prompt |
| W8 | `Assets/Audio/Run8/Wren_W8_PickFile.mp3` | wren | 2.088 | -16.99 | 16 | "Pick a file. Pull it open." — Opening: two case files prompt |
| W9 | `Assets/Audio/Run8/Wren_W9_PointAccuse.mp3` | wren | 1.682 | -16.41 | 17 | "Point at the one you accuse." — Accuse: point at a suspect |
| W10 | `Assets/Audio/Run8/Wren_W10_PressSeal.mp3` | wren | 2.323 | -17.73 | 15 | "Press the seal. Hold it." — Accuse: wax seal commit |
| W11 | `Assets/Audio/Run8/Wren_W11_SweepLight.mp3` | wren | 2.021 | -18.11 | 18 | "Sweep the floor with the light." — Wow 6: UV flashlight dark beat |
| W12 | `Assets/Audio/Run8/Wren_W12_DustPrints.mp3` | wren | 2.54 | -17.99 | 23 | "Wave your hand over it. Dust for prints." — Wow 9: dusting prompt |
| W13 | `Assets/Audio/Run8/Wren_W13_ReadBoard.mp3` | wren | 2.618 | -16.42 | 26 | "The board's on the wall. Walk over and read it." — Wall board introduction |
| W14 | `Assets/Audio/Run8/Wren_W14_WatchKettle.mp3` | wren | 2.402 | -17.22 | 18 | "Watch the kettle. It remembers." — Wow 3: kettle replay at 22:30 |
| N2 | `Assets/Audio/Run8/Narrator_N2_TenThirty.mp3` | narrator | 2.837 | -18.37 | 20 | "Ten thirty. The moment it happened." — Wow 3: replay title card at 22:30 |
| N3 | `Assets/Audio/Run8/Narrator_N3_MorningEdition.mp3` | narrator | 1.086 | -16.6 | 11 | "Morning edition." — Ending (wow 8): newspaper appears |
| StampThump | `Assets/Audio/Sfx/Stamp.mp3` | effect | 1 | -20.8 | 0 (reused) | Deduction filed / CASE CLOSED stamp lands on the wall board — Existing prompt: heavy rubber stamp on paper with a wooden thump. |
| RainGlass | `Assets/Audio/Sfx/Rain.mp3` | effect (loop) | 12 | -21.93 | 0 (reused) | Wow 2: rain on the real window (spatial loop) — Existing 12 s loop: rain tapping an old window, interior. |
| UVHum | `Assets/Audio/Sfx/UvHum.mp3` | effect (loop) | 6 | -23.74 | 0 (reused) | Wow 6: UV flashlight cone in the palm (loop) — Existing 6 s UV lamp hum loop; no switch-on click inside the loop (a click would repeat). |
| ThunderFar | `Assets/Audio/Sfx/Thunder.mp3` | effect | 4 | -21.84 | 0 (reused) | Wow 2: distant thunder at the window (spatial) — Existing 4 s distant rolling peal. |
| N1 | `Assets/Audio/Voice/NARRATOR/6f365e05e85d15d5fc83.mp3` | narrator | 0.862 | -23.45 | 0 (reused) | "Nobody leaves." — Tape across the doorway: "Nobody leaves." — Existing NARRATOR steady take. |
| N4 | `Assets/Audio/Run7/NARRATOR/427d5abd057174156e45.mp3` | narrator | 1.92 | -16.47 | 0 (reused) | "Same room. New murder." — Replay / new seed: "Same room. New murder." — Existing Run 7 NARRATOR take. |

## Generation parameters

### Effects

- **API:** `POST /v1/sound-generation?output_format=mp3_44100_128`
- **Request body:** `{text, duration_seconds, loop, model_id:"eleven_text_to_sound_v2", prompt_influence:0.5}`
- **Prompts:** every prompt ends with "No music, no voice."
- **Loops:** CrateHum was requested with `loop:true`. Prompts and durations for each file are in `run8-audio.mjs`.

### Wren and the Narrator

- **API:** `POST /v1/text-to-speech/{voiceId}/with-timestamps?output_format=mp3_44100_128`
- **Voices** (from `cast.json`): Wren `jNpgKgWPoh3vfj5CBSyr`, Narrator `UeBBciydI2n3MwV18MHO`.
- **Settings:** the same as the Run 7 Wren and Narrator lines (`run7-render.mjs`): `model_id:"eleven_v3"`, text `"[calm] " + line`, `voice_settings:{stability:1, similarity_boost:0.75, use_speaker_boost:true}`, `seed:1041`.
- **Whispers (W1, W2) differ on purpose:** text `"[whispers] " + line` and `stability:0.5`. Robust stability (1.0) mostly ignores v3 audio tags.
  - W2 uses `seed:1042`. The 1041 take was only half whispered.
  - Whispering was checked by voiced-frame fraction (low zero-crossing frames): W1 is 0.11 and W2 is 0.18, against 0.54–0.70 for normal Wren lines.

### Post-processing

The bundled `Tooling/audio/out/bin/ffmpeg.exe` does the post-processing.

1. **Trim silence** at the head and tail at −50 dB. Loops are not trimmed.
2. **Two-pass linear loudnorm:**
   - effects: I −23 LUFS, TP −3, LRA 11;
   - voice: I −16 LUFS, TP −1.5, LRA 11.

   These targets match the existing files: `Assets/Audio/Sfx` sits at about −21 to −25 LUFS and the Run 7 Wren lines at −16.
3. **Quiet transients:** if the true-peak cap leaves an effect more than 3 dB under target, the full gain is applied, then a 1 ms `alimiter` at the TP ceiling.
4. **Encode:** mono, 24 kHz, 32 kbps MP3, the same as the existing `Assets/Audio` effects.

### Manual edits

- **DoorKnock3:** the take had five knocks 170 ms apart. Knocks 1–2 were spliced to the last knock and its natural room tail, which gives three knocks in 0.70 s.
- **W2:** cropped at 1.3 s with an 80 ms fade, to remove 1 s of silence and a stray breath blip.

### Verification

Every file decodes with ffmpeg to PCM. Every file is non-silent:
- the quietest RMS is -34.6 dBFS;
- every peak is ≤ 0 dBFS.

Onsets were checked for DoorKnock3, which has three. Envelopes were checked for the short effects. Nothing was audition-tested by ear.

## Reused existing assets (no credits)

- **StampThump** is `Sfx/Stamp.mp3` (the same brief).
- **RainGlass** is `Sfx/Rain.mp3` (a 12 s window-rain loop, better than a 4 s one).
- **UVHum** is `Sfx/UvHum.mp3` (a 6 s loop). A switch-on click inside a loop would repeat. If a click is wanted, play `Sfx/PowerUp.mp3` or `Run8/SpotlightOn.mp3` once first.
- **ThunderFar** is `Sfx/Thunder.mp3` (a distant rolling peal), paired with the new ThunderNear.
- **N1** "Nobody leaves." is `Voice/NARRATOR/6f365e05e85d15d5fc83.mp3`. It is the same narrator voice, but about −23 LUFS, so it plays about 7 dB quieter than the other narrator lines. Boost it about 2× in the AudioComponent.
- **N4** "Same room. New murder." is `Run7/NARRATOR/427d5abd057174156e45.mp3`.

## Notes for wiring

- **Loops:** CrateHum, RainGlass and UVHum. MP3 encoder padding can leave a tiny gap at the loop seam. The existing Rain and UvHum loops have the same limit.
- **Spatial placement** (WEARER_UX, wow 7 and "spatial sound is half of AR"):
  - ThunderNear, ThunderFar, RainGlass and LightningCrack at the window;
  - DoorKnock3 and TapeStretch at the real doorway;
  - W1 and W2 placed behind the wearer.
- **Re-running:** `node Tooling/audio/run8-audio.mjs` uses `Tooling/audio/out/cache`. A re-run costs nothing unless a prompt, text or setting changes.
