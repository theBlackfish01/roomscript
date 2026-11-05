# Roomscript R4: the reconstruction ("bullet-time" ending): current state, ideal design, storyboard, assets and Codex package

Reviewer: R4-recon. 2026-11-03 (PKT). The repo was read-only; there were no git writes and no Lens Studio MCP use.

**Mockup frames:** Three.js stand-in room, rendered in headless Chromium at 1600×900. Each frame carries a "DIRECTION MOCKUP · not a Lens capture" badge.

| Frame | Path | Beat |
|---|---|---|
| A | `<local-development-path>` | 0:05 The Accounts: the dial at the crate; cyan claim ghosts stand where each suspect *said* they were |
| B | `...\r4-recon\frames\recon-B.png` | 0:12 Correction: the tea slip burns at the cold kettle; Vale's record streams as cyan→coral dust to her certified Study mark; Okafor is already corrected |
| C | `...\r4-recon\frames\recon-C.png` | 0:18 Bullet time at 22:30: mug frozen mid-fall in a bead crown, the cable in Vale's hands, fact-bound tags, frozen rain and motes, orbit path |
| D | `...\r4-recon\frames\recon-D.png` | 0:33 Tableau: certified marks, coral string to proof, a deduction ledger from `state.arguments`, CASE CLOSED |
| E | `...\r4-recon\frames\recon-E.png` | Wrong-accusation variant: the accused's secret clears him; the real culprit walks out through the tape |

Source files: `...\r4-recon\mockup.html` (scene) and `...\r4-recon\render.mjs` (renderer). To rerender: `node render.mjs A,B,C,D,E`. The coordinates are the hero case's real cm values.

---

## 1. What the reconstruction does today (commit d698ee4, unchanged since)

**Engine**: `Assets/Scripts/Engine/game/Closing.ts → reconstruction(graph, state)`
- Returns `[]` unless `state.verdict` is `"correct"` or `"wrong"`. A test enforces this at timeout as well, which is good.
- For each of the 12 slots (`21:00 … 23:45`), and for each suspect and the victim, it finds a `truth && pred==="at"` fact for that slot. It places the person at `[zone.anchor.x, 0, zone.anchor.z + 55]`.
- `prior` carries positions forward. `murder` is `index === graph.murderSlot`.
- The caption is either "The room at HH:MM" or "Vale killed Harlow in the Study with the charger cable."

**Lens**: `RoomscriptClosingController.beginReveal/update`
- It hides the investigation UI and keeps the closing panel, whose title/body show the frame caption.
- It builds **4 identical ivory 8-point polyline "bell" silhouettes**: `lightMaterial`, alpha 0.8, 1.5 cm stroke, 0.75 scale ≈ 109 cm tall, parented to the room.
- There is **no Harlow ghost**, the culprit is drawn like everyone else, and nothing moves between frames: the silhouettes teleport.
- Timing is **2 s per frame × 12 = 24 s, +1 s**. A `ClockTick` plays per frame and `Objection` plays at the murder frame; music is silenced. Then the result card appears (CASE CLOSED / THE CULPRIT ESCAPED, rating, deductions, minutes, case ID, seal) with a `Chime`.
- **Wrong verdict:** the real culprit's 1:1 actor lerps to the door latch O8 over 4 s and is disabled, at the same time as the reconstruction. The accused's secret is not revealed.
- **Timeout:** the panel reopens as "TIME IS UP — ONE ACCUSATION". There is no reveal until a verdict exists.
- **Camera:** none. It is first-person only. There is no capture of the reconstruction itself. `docs/captures/2026-10-30-d3-ending.png` shows only the result card, and it still says "par 90"; the current par is 85.

**Effect on the hero case**
- Hero facts have `at` entries **only at slot 6 (22:30)**, for V, S1–S4.
- **Frames 0–5 (the first 12 s) show an empty room** under "RECONSTRUCTION / 21:00…22:15".
- Frame 6 shows the four silhouettes and the murder caption.
- **Frames 7–11 repeat the slot-6 positions** for 22:45–23:45.

**Limits and defects**
1. Twelve seconds of nothing, then 10 s of a static repeat. It is neither a reenactment nor bullet time.
2. **Minor truth-rule leak:** carrying positions forward places people at 22:45–23:45 without any fact. Generated cases are unaffected, because `Simulator` emits `F_AT_<actor>_<slot>` for every slot.
3. **Mark collisions:**
   - The victim's certified mark equals Vale's: Z1 + 55 = (80, 0, −125).
   - The hero's claims are a permutation of the truths:

     | Suspect | Claimed zone | True zone |
     |---|---|---|
     | Vale | Kitchen | Study |
     | Okafor | Conservatory | Kitchen |
     | Pike | Hall | Conservatory |
     | Imran | Lounge | Hall |

   - So claim ghosts and truth ghosts land on the same spots unless they are offset.
4. There is no tense language (claim vs. certified), no evidence binding, no deduction ledger, no culprit emphasis and no Harlow.
5. Persistent 1:1 actors stay visible (the d3 capture shows them) and compete with the ghosts.
6. `RoomscriptAudio` has one SFX voice and one spatial voice. Each `play()` stops the previous sound, so cues cannot overlap and there is no loop support.
7. **Label mismatch:**
   - The staging doc says "bullet time at 10:41".
   - Engine truth: the murder slot is 22:30, inside the 22:30–22:45 window, and **22:41 is when the body was found** (`F_BODY_FOUND`).
   - The freeze must be labelled **22:30**. 22:41 is the clock alarm afterwards.

---

## 2. Ideal reconstruction (feasible in Lens Studio 5.23 Preview, additive-honest)

### 2.1 Principles
- **Three tenses, each visibly distinct:**

  | Tense | Source | Style |
  |---|---|---|
  | **Claimed** | `stance:"cover"` statements and their `truth:false` facts | Cyan, dashed, `?` head, "SAID" framing |
  | **Certified** | `truth:true` facts | Coral for the culprit, ivory for innocents; solid rim, engraved hatch |
  | **Presentational** | — | Dust transitions, offsets and easing. These never carry a time, zone or object claim. |

  The ghosts **do not walk** a route between a claimed mark and a true mark, because no fact says they did. They **dissolve into specks at the claim, and the record re-forms at the certified mark**.
- **Every lit element cites engine IDs:** ghost positions, tags, slips, ledger rows and narration. A pure engine function produces a beat list with `cites`, and tests check the cites. The LLM decides nothing.
- **75% past-tense paper cut-outs**, matching staging §2.2: engraved ivory hatch, a bright rim, the prop at 100%, fading to specks below the waist. The 1:1 present-tense actors fade out at the blackout.
- **Blackout is subtraction, not a dark overlay.** Turn off UI, fixture brackets and labels, fade the actors to dust, cut the music and the clock tick. Do **not** add a dark fullscreen quad in Preview: it would misrepresent the device. The Preview "evening room" is already dim.
- **Freeze = stop billboarding.** During bullet time, lock each cut-out's yaw and keep the 3D speck volume around it. An orbit then shows parallax, and the frozen sprites read as paper theatre held in time.

### 2.2 Engine data (hero, cm, floor-local; the player is at the origin facing −Z)

**Marks**

| Suspect | Claimed mark (`refuterMarks`) | Certified mark (slot 6) |
|---|---|---|
| Qadir | (−160, 0, −65) Lounge | (170, 0, 95) Hall |
| Vale | (180, 0, −195) Kitchen | (80, 0, −125) Study |
| Okafor | (−120, 0, −225) Conservatory | (180, 0, −195) Kitchen |
| Pike | (170, 0, 95) Hall | (−120, 0, −225) Conservatory |

**Presentational offsets (proposed)**
- Per-suspect lateral `dx`: Qadir −28, Vale −38, Okafor +28, Pike −20.
- Harlow at a desk-front offset of (65, 0, −160), so he never overlaps Vale.

**Freeze props**
- Mug O9 falls from (65, 84, −180) and freezes at about 40% of the fall.
- The real cable O1 at (95, 75.5, −190) gets a bracket. The ghost Vale holds a *ghost copy* of the cable as a coral line.
- Lamp O6 at (110, 109, −210).
- Recorder O12 at (65, 79, −200) shows a frozen waveform.
- After the resume, clock O7 at (170, 145, 40) rings for 22:41.

**Freeze cites (all slot-6 truths)**
- `F_VALE_STUDY` and `E_VALE_LAMP`
- `F_VICTIM_STUDY_LAMP`
- `F_VICTIM_STUDY_MUG` (Harlow's sleeve knocks the mug)
- `F_VALE_CABLE` and `F_CABLE_CONTACT`
- `F_REPLY_AFTER_ARRIVAL` / `F_RECORDER_ORDER` (he was alive when she arrived)

**Resume cites:** `F_BODY_MOVED` (chair → floor, drawn as a coral UV drag to the chalk) and `F_BODY_FOUND` (22:41).

**Slips**

| Who | Statement | Burns at (`about`) | Burned by (breakers) |
|---|---|---|---|
| Vale | `C_VALE_ALIBI_0` | Kettle O11 | `E_KETTLE_COLD` or `E_VALE_LAMP` |
| Vale | `C_VALE_ALIBI_1` | Recorder O12 | `E_RECORDING` / `E_VOICEMAIL` / `C_OKAFOR_REPLY` |
| Innocents | `C_Sx_ALIBI_0` | O8 / O11 / O10 | Their own breakers |

If the player never broke a slip, it still burns after the verdict, but dimmer and tagged "never challenged". The source is `state.notebook[].broken`.

**Ledger**
- Each `requiredDeduction` lights the holders of the **route the player filed**, from `state.arguments[].refs`:

  | Deduction | Lights |
  |---|---|
  | OPPORTUNITY | O6 |
  | MEANS | O1 |
  | ALIBI | O11 or O6 |
  | MOTIVE | O13, Pike, or the Z2 letter |

- An unfiled deduction shows a hollow ivory "not argued" and a dotted pencil string to its cheapest support. That is truthful, because everything is revealed after the verdict.

**Generated cases:** `F_AT_*` exists for every slot, so the same director can walk the full night slot by slot using dust hops. The hero compresses the night into 22:30. Do **not** add new hero slot facts this week: they would change solver and tests for little gain.

### 2.3 Variants
- **Correct:** the full sequence, Vale's rim coral, a CASE CLOSED stamp and a warm resolve.
- **Wrong, wrong person:**
  1. The cards flip: WHO ✗ with a cyan dashed crack; WHERE/WHAT ✓ or ✗ from the envelope.
  2. The accused's **secret surfaces** (`F_<accused>_SECRET` canonical, e.g. "Imran stole his debt note before the murder") with "He did not kill Harlow."
  3. The real culprit's actor walks out **through the tape** (existing code); the tape flutters, one strand torn.
  4. "Here's what really happened": the same reconstruction, narrated rather than confessed.
  5. The ledger shows what was missed, and the stamp is THE CULPRIT ESCAPED.
- **Wrong, right person, wrong room or weapon:** no secret and no escape. The failed card(s) crack, and the stamp reads THE CASE COLLAPSED (or reuse ESCAPED).
- **Timeout:** clock O7's hands race to 23:45 and stop; the existing TIME IS UP panel appears. There is **no** reconstruction until the one permitted accusation produces a verdict. That boundary is test-enforced and must stay.

### 2.4 Optional narration ("Wren", authored and validated, voiced by TTS)
Each line is a template filled from graph names, with `cites`. A test checks that the line's entities are a subset of the cited facts' entities, and that claim lines cite `truth:false` facts only under a "said" framing.

| # | Beat | Line | Cites |
|---|---|---|---|
| N0 | Blackout | "Seal broken. Here is the night as the room recorded it." | — |
| N1 | Claims | "Four accounts. Four rooms. Not one of them true." | `X_VALE_KITCHEN`, `X_S1_ALIBI`, `X_S3_ALIBI`, `X_S4_ALIBI` |
| N2 | Qadir | "Imran Qadir said the Lounge. The door latch kept him in the Hall." | `X_S1_ALIBI`, `F_S1_ALIBI_OBJECT` |
| N3 | Okafor | "Dr. Okafor said the Conservatory. The kettle kept her in the Kitchen." | `X_S3_ALIBI`, `F_S3_ALIBI_OBJECT` |
| N4 | Pike | "Jonah Pike said the Hall. The window held him in the Conservatory." | `X_S4_ALIBI`, `F_S4_ALIBI_OBJECT` |
| N5 | Vale | "Marguerite Vale said she was making tea. The kettle never warmed." | `X_VALE_KITCHEN`, `F_KETTLE_COLD` |
| N6 | Approach | "Twenty-two thirty. The Study. Harlow answered her. He was alive when she arrived." | `F_VALE_STUDY`, `F_RECORDER_ORDER` |
| N7 | Freeze | "The mug left the desk. The cable was in her hands." | `F_VICTIM_STUDY_MUG`, `F_VALE_CABLE` |
| N8 | Resume | "She moved him from the chair to the floor. The alarm came at 22:41." | `F_BODY_MOVED`, `F_BODY_FOUND` |
| N9 | Motive | "He meant to expose the trust accounts she forged." | `F_VALE_MOTIVE` |
| N10 | Correct | "Marguerite Vale. The Study. The charger cable. Case closed." | envelope |
| W1 | Wrong | "{Accused} {secret}. Not a killer." | `F_<id>_SECRET` |
| W2 | Wrong | "The killer walked out through your door." | envelope |

**Delivery**
- Pre-render the lines to WAV once, through the existing TTS gateway. The credentials are blank, so **Wadood must run it**.
- Bundle the WAVs as assets, because D6 says there is no offline spoken dialogue. Captions are always the fallback.
- An LLM paraphrase stays off by default. If it is enabled, it must pass the existing validator using only the cited entities, or the authored line plays.

---

## 3. Beat-by-beat storyboard

### 3.1 Full sequence (correct verdict), 36 s; capture mode can hold the freeze up to 20 s

| t (s) | Beat | Visual (engine source) | Preview camera | Sound |
|---|---|---|---|---|
| 0.0–1.5 | **SEAL / BLACKOUT** | The seal cracks. UI, brackets, labels, motes and the clock tick all cut (staged stutter: on-off-on-off at 80 ms, then off). The 1:1 actors sift into specks. | Locked at the player's eye, framing the crate | `SealSnap`, then hard **silence** (music and tick cut mid-cycle) |
| 1.5–4.0 | **DIAL** | A brass ring unfolds above the crate: 12 ticks from `graph.slots`, the murder slot in coral. The needle spins back to 21:00, then forward and decelerates (frame A). | Slow push-in on the crate (or still) | `Unspool_whirr` rising |
| 4.0–8.0 | **THE ACCOUNTS** | Four cyan dashed claim ghosts appear at `refuterMarks`, each with its cover slip (`C_*_ALIBI_0`) above (frame A). Unheard claims are dimmer. | Pan left→right across the room (the in-AR head turn) | Four motif plinks, soft and spatial at each claim. N1. |
| 8.0–14.0 | **CORRECTIONS** | Each innocent in clockwise order: the breaker object's bracket flares (O8 / O11 / O10), the slip burns, the claim ghost dissolves into cyan specks, the dust arcs (turning coral or ivory), and the ghost re-forms at the certified mark with "✓ ZONE". Vale goes last: her tea slip burns at the kettle and her dust streams to the Study (frame B). The needle reaches 22:30. | Follow the dust arcs; end facing the Study | `DustSwish` ×4 (pitch-stepped), `SlipBurn` crackle, `Tink` at each object. N2–N5 (or captions). |
| 14.0–16.0 | **APPROACH** | Harlow re-forms (ivory) at the desk. The recorder waveform pulses ("he answered her"). The "already dead" slip burns at the recorder. | Dolly toward the desk | Rain swells, then pitches down. Tick slows. N6. |
| 16.0–24.0 | **BULLET TIME 22:30** | timeScale eases to 0 over 0.6 s. The mug is held mid-fall with a bead crown, the coral cable is between Vale's hands, motes and rain streaks freeze, and fact tags fade in: LAMP / MUG / CABLE / RECORDER (frame C). Billboarding is locked. Title: "22:30 · THE STUDY · TIME HELD". | **Orbit**: 100–120° arc, radius about 1.3 m around the Study anchor, 8 s, ease in-out; or a manual orbit (§5.4) | The clock tick stretches into a long low bell, then **near-silence** and the `FreezeHarmonic` loop. N7 at the midpoint. |
| 24.0–27.0 | **RESUME** | timeScale back to 1. The mug drops and shatters (C7 shards recoloured ivory), Harlow's ghost slides chair → chalk along a coral UV drag (`F_BODY_MOVED`), the chalk relights, and clock O7 rings for **22:41**. | Hold wide on the desk | `MugShatter`, then the tick returns at 1×, then `ClockAlarm`. N8. |
| 27.0–31.0 | **LEDGER** | Four rows stamp in turn over the crate. Each filed row lights its proof object and a coral string from Vale. An unfiled row is hollow "not argued" with a dotted pencil string (frame D). Motive row: N9. | Pull back to the crate | `StampThud` ×4, heartbeat between rows |
| 31.0–34.0 | **TABLEAU and STAMP** | All ghosts stand at their certified marks: innocents at 40%, Vale's rim at full coral, the culprit's cello motif plays its "wrong note". **CASE CLOSED** slams onto the crate lid with case ID and seal. The tape unsnaps from the door. | Static wide, the hero shot | `CaseClosed_thud`, `Resolve_chord` (first warm major). N10. |
| 34.0–36.0 | **EPILOGUE** | The ghosts sift away. One yellow tent remains beside the *real* charger cable for 2 s. Then the existing result card (rating, minutes, par, seal) appears. | Hold | Room tone. `Chime` on the result card. |

**Wrong variant (about 40 s):**
1. 0–1.5: seal and blackout.
2. 1.5–3.5: card ladder, WHO cyan crack.
3. 3.5–7: the accused's secret slip and ghost (W1), while the real culprit walks out through the tape (existing 4 s escape plus flutter).
4. 7 → the reconstruction from DIAL, narrated, with the ledger showing what was missed and the stamp THE CULPRIT ESCAPED.

**Timeout prelude:** add 2 s (clock O7 races to 23:45 and stops), then the existing panel and the verdict paths.

### 3.2 Video cut, 12 s (shot 18 of the 3-minute storyboard)

| t | Shot |
|---|---|
| 0.0–1.0 | Seal snaps, hard silence, the room's added light dies (cut on the snap) |
| 1.0–2.5 | Dial at the crate whips to 22:30, coral tick flares |
| 2.5–5.0 | Vale's tea slip burns at the kettle; her dust arcs to the Study and re-forms in coral (frame B) |
| 5.0–10.0 | **Bullet-time orbit** (frame C): mug beads, cable, tags; bell then silence. Narration N7 optional. |
| 10.0–11.0 | Resume: the mug shatters, the clock rings 22:41 |
| 11.0–12.0 | CASE CLOSED stamp on the crate, warm chord. Hard cut. |

Badge throughout: `Lens Studio Preview — simulated room`. Device clip 19 (walking around the freeze) stays Wadood's own. **Never fake it.**

---

## 4. Asset list (for the Three.js/headless pipeline)

All PNGs are sRGB. Each comes as straight-alpha RGBA plus a `-add` variant on black for an additive (Add) blend. The art follows the palette: coral #FF6B5A, cyan #3FE3FF, yellow #FFD60A, ivory #FFF0D6, brass #E8B04A, chalk #EEF4FF.

| # | Asset | Format / size | Count | Notes |
|---|---|---|---|---|
| A1 | Ghost cut-outs | PNG 512×1024, ≤350 KB | 9 | Vale ×3: stand, cable-freeze (arms forward, hands lit, no cable baked), over-outline. Harlow ×2: stand, sleeve-sweep (freeze). Qadir, Okafor, Pike stand ×1 each, props baked at 100% (lighter flame, glasses glare, white gloves). Claim silhouette ×1: dashed rim, `?` head, white so it can be tinted cyan. Engraving hatch on the torso, fading to specks by the knees. Neutral faces (no smile), matching the existing puppet line style. Pivot at bottom centre. |
| A2 | Dissolve noise | PNG 256×256 grayscale | 1 | Threshold mask for sift-to-dust |
| A3 | Speck and bead atlas | PNG 256×256, 4×4 cells | 1 | Soft dot, highlighted bead, ember, chalk fleck |
| A4 | Time dial | PNG 1024² ring (12 ticks, no text); PNG 64×512 needle; PNG 256² coral slot arc | 3 | Labels stay Lens Text from `graph.slots` |
| A5 | Statement slip | 9-slice PNG 512×256 cyan dashed frame; burn mask PNG 512×256; ember strip PNG 1024×128 (8 frames) | 3 | Text stays Lens Text from the statement canonical |
| A6 | Stamps | PNG 1024×448 ×3: CASE CLOSED, THE CULPRIT ESCAPED (cracked), TIME IS UP | 3 | Rough ink and chevron border. The seal and case ID are Lens Text. |
| A7 | Ledger glyphs | PNG 256² ×3: coral ✓ stamp, ivory hollow ○, cyan ✗ crack | 3 | |
| A8 | Path strips (if not using `gazeMaterial`) | PNG 256×32 tileable ×3: coral solid core, cyan dash, ivory dot | 3 | |
| A9 | GLB: `mug_frozen.glb` | ≤500 tris, pivot at base centre, UV for an unlit rim | 1 | Proportions of the scene's `StandinMug` |
| A10 | GLB: `mug_shards.glb` | 8 shards, ≤300 tris total | 1 | Or reuse the C7 CPU shards |
| A11 | Audio (WAV 48 kHz 16-bit **mono**, about −16 LUFS, peak −1 dBFS) | `SealSnap` 0.4 s, `Unspool_whirr` 2 s, `DustSwish` ×3 at 0.6 s, `SlipBurn` 1.2 s, `TickStretch_bell` 3 s, `FreezeHarmonic` 6 s seamless loop, `MugShatter` 0.8 s, `ClockAlarm` 1.5 s, `StampThud` 0.5 s, `CaseClosed_thud` 0.8 s, `Resolve_chord` 3 s, `Vale_cello_wrongnote` 2.5 s, `TapeFlutter` 1 s, `DoorCreak` 1.2 s | 16 | Synthesised the same way as the existing CLAD SFX. Nothing downloaded. |
| A12 | Narration WAVs | N0–N10, W1 template ×3 accused, W2 | ≈15 | Needs gateway credentials, so Wadood runs it |
| A13 | Video motion graphics (ffmpeg) | 1920×1080: badge PNG 600×80; "22:30 · THE STUDY" lower-third (5 s, alpha MOV or PNG sequence); "THE RECONSTRUCTION" title (2 s); "Truth decided by the engine" end card (3 s) | 4 | For the edit only, never composited onto device shots |
| A14 | Optional turntable | 36-frame PNG sequence of the freeze composition from the mockup scene | 1 | Devpost / "under the hood" |

**Pipeline tip:** `mockup.html` already draws A1-style ghosts procedurally (`ghostTex()`), plus the dial, slips, stamp and specks. It can be lifted directly into the asset pipeline as canvas exporters.

---

## 5. Codex work package

### 5.1 Tiering (deadline Nov 9; Preview has recently been slow)

| Tier | Effort | Scope |
|---|---|---|
| **T1 (must, ≈1 day)** | | Engine beat list and tests; blackout; claim → certified dust corrections; freeze with mug beads, cable and tags; capture hold; CASE CLOSED stamp; wrong variant reusing the escape |
| **T2 (≈0.5–1 day)** | | Dial, slip burn, ledger, narration captions and WAVs, audio pool |
| **T3 (if time)** | | Scripted Preview camera; diorama turntable; "right person, wrong card" variant |

### 5.2 Files

**New engine file: `Assets/Scripts/Engine/game/Reenactment.ts`** (pure)
- Signature:
  ```ts
  export function reenactmentScript(graph:CaseGraph, state:GameState, staging:ReenactStaging): ReenactBeat[]
  ```
- `ReenactBeat` fields: `{kind, t, dur, who?, at?:Vec3, from?:Vec3, to?:Vec3, object?, statement?, deduction?, cites:Id[], caption?, line?}`.
- `kind` is one of: `blackout | dial | claim | correction | approach | freeze | resume | ledger | tableau | stamp | secret | escape | epilogue`.
- Returns `[]` unless the verdict is correct or wrong.
- Claims come from `refuterMarks` and the layer-0 `where@` statements. Certified marks come from truth `at` facts at `murderSlot`, using the `provenMark` formula.
- Generated cases: a slot walk from `F_AT_*`. The **carry-forward is removed**: no position is emitted for a slot without a fact.

**Fix in `Assets/Scripts/Engine/game/Closing.ts`**
- Remove the carry-forward, or make `reconstruction()` a thin adapter over the new script.
- Keep the existing test semantics.

**New content file: `Assets/Scripts/Content/HeroReenactment.ts`**
- Presentational staging only: per-suspect `dx`, Harlow's desk offset, the mug fall fraction, beat durations, and narration templates with cites.
- **It must not modify `HeroCaseHarlow1041`**, so the graph and hashes stay unchanged.

**New test: `Tooling/tests/game/reenactment.test.ts`**
1. `[]` for null verdict and for timeout.
2. Every `cites` resolves to a fact, statement or evidence ID. Non-claim beats cite only `truth:true` facts. Claim beats cite only `stance:"cover"` statements.
3. Certified ghost zones equal the `at` facts at the murder slot.
4. No ghost position in a slot without a fact.
5. Freeze cites ⊇ {`F_VALE_STUDY`, `F_VALE_CABLE`, `F_VICTIM_STUDY_MUG`, `F_RECORDER_ORDER`}.
6. Ledger beats equal `state.arguments`: filed vs. unfiled.
7. Wrong verdict: a `secret` beat for the accused citing `F_<id>_SECRET`, plus an `escape` beat. Right person with a wrong card: no secret.
8. Narration entities ⊆ the cited facts' entities.
9. Total duration 30–40 s; freeze ≥ 6 s.
10. Deterministic: identical JSON for identical input.
11. Generated fixture: 12 slot hops, all cited.

**New Lens script: `Assets/Scripts/RoomscriptReenactmentDirector.ts`**
- Timeline driver, using frame-time `getDeltaTime`, never sleeps.
- Owns `ReconClock {t, timeScale}`. The freeze eases timeScale to 0.
- Inputs: `captureHold` (s, default 0; capture mode 20), `captureAt` (beat kind for LEAF), `narration` (bool).
- `diagnostics()` returns: `phase, beatIndex, t, frozen, visibleGhosts{id→pos}, tags[], ledger[], stamp`.

**New Lens script: `Assets/Scripts/RoomscriptGhostCutout.ts`**
- A MeshBuilder quad like `RoomscriptSuspectActor`, with an unlit material using the Add blend.
- Params: rim tint, opacity, dissolve threshold (A2), `billboard` toggle (off during the freeze).

**New Lens script: `Assets/Scripts/RoomscriptDust.ts`**
- One MeshBuilder mesh, so one draw call, with ≤600 deterministic quads.
- Modes: arc stream (claim → certified), mug bead crown, ambient motes, sift.
- Positions advance by `ReconClock` and freeze at timeScale 0.

**New Lens script: `Assets/Scripts/RoomscriptTimeDial.ts`** (T2)
- A4 sprites at the crate, with Text labels from `graph.slots`.

**Refactor C7 shards into `Assets/Scripts/RoomscriptShards.ts`**
- Move `buildShards` from `RoomscriptSpatialObjectionController.ts` into a shared helper, so the objection and the mug shatter both use it. Retint per use.

**New Lens script: `Assets/Scripts/RoomscriptCaptureDirector.ts`** (T3, editor only)
- Guarded by `global.deviceInfoSystem.isEditor()` and `captureMode`.
- During the freeze it disables the Camera Object's `DeviceTracking` and drives the transform along a Catmull-Rom path (pivot at the Study anchor, radius 130 cm, 110°, 8 s).
- **Spike this for 20 min first.** The Preview's simulated-room backdrop may be tied to device tracking and fail to follow a scripted camera. If it fails, use §5.4 manual orbit.

**Edits to existing Lens scripts**
- **`RoomscriptClosingController.ts`:** replace the silhouette and frame code with the director. Keep the panel → result flow and `diagnostics()`. Hide the 1:1 actors at the blackout, except the escaping culprit in the wrong variant.
- **`RoomscriptAudio.ts`:** add the A11 clips, a 3-voice spatial pool and `playLoop`/`stopLoop`.
- **`RoomscriptClosingLeafScenario.ts` and `RoomscriptLeafIndex.ts`:** new assertions (§5.3) and a `capture` arg.
- **`Assets/Scene.scene`** (via Lens Studio): add the director object and wire its inputs (`clue`, `cast`, the room binding, `tells.audio`, `lightMaterial`, `gazeMaterial`, the A1–A10 assets).

### 5.3 LEAF acceptance (`roomscript-closing`, modes correct / wrong / timeout, plus `capture`)
1. **Before the verdict:** zero reenactment objects are enabled. In timeout mode there is none until the final accusation.
2. **Correct verdict:** the phase history equals blackout → dial → claims → corrections → approach → freeze → resume → ledger → tableau → stamp → ending. Total 30–40 s ± 0.5 s.
3. **At the freeze:**
   - `frozen === true`.
   - The mug and bead positions are unchanged across a 1 s wait.
   - The 4 suspect ghosts and Harlow are visible.
   - Room-local ghost positions equal the certified marks plus offsets within 1 cm.
   - Vale's tint is coral.
4. Every visible tag ID maps to a cited fact in the beat list.
5. The ledger diagnostic equals `state.arguments`; unfiled rows are hollow.
6. **Wrong verdict:** the secret beat is shown for the accused, the culprit actor is disabled after the escape, and the stamp is the ESCAPED variant.
7. The result still contains "Holmes rating". A second `Accuse` leaves the verdict unchanged (existing check).
8. **Budget:** ≤600 dust quads, ≤14 Text components, ≤12 new RenderMeshVisuals. Log Preview frame time p95, labelled as Preview, not a device claim.
9. **Capture mode:** `captureAt="freeze"` holds and the screenshot is saved to `docs/captures/2026-11-0X-recon-{claims,correction,freeze,tableau,wrong}.png`.

### 5.4 Capture instructions (Lens Studio 5.23.2 Preview)
1. Relaunch Lens Studio and keep it in the foreground. Recent Preview stalls are logged in PROGRESS.
2. Use the existing simulated room. Run `roomscript-closing` with `mode=correct, capture=on, captureHold=20`.
3. Start the recorder at the seal hold.
4. **Orbit during the freeze:**
   - If the T3 spike works, use the scripted path.
   - Otherwise orbit manually with Preview navigation for about 10 s, slowly, about 110°. Stabilise it in post: export 60 fps, then use ffmpeg `deshake`, or slow to 0.5× with `minterpolate`.
5. Record the wrong variant with `mode=wrong`.
6. Cut the 12 s version per §3.2 and add the A13 badge.
7. Wadood records device shot 19 himself.

---

## 6. Notes, risks and connections
- **Additive honesty:** the mockups use additive blending to imitate Specs. The Lens Preview alpha-blends its panels. Avoid filled panels in the reconstruction so Preview and device match.
- **Palette violation:** the scene's window stand-in is bright cyan (see the c7, l3 and l4 captures). Cyan means alibi or claim, so recolour it to dim blue-grey, or the claim ghosts lose their meaning near the window.
- **Dial placement:** frame A shows the dial can cover a claim slip by the window. Mount the dial low over the crate lid, tilted about 30° toward the player.
- **Billboards in an orbit:** freezing the yaw is the right call. Plain Y-billboards would spin with the camera and kill the "frozen moment".
- **Hero claims are a permutation of the truths:** the offsets are required, and the Okafor/Vale swap at the Kitchen is a nice visual beat if staged with Okafor last.
- **Sensitive content:** the freeze shows the cable *in Vale's hands*, not at Harlow's neck. That is truthful to `F_VALE_CABLE`, and tasteful for judges.
- **Effort, solo plus agents:** T1 about 1 day, T2 about 0.5–1 day, assets in parallel via the pipeline reviewer.
