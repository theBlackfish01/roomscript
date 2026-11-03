# Roomscript R4 review: what a judge sees (visuals, staging, UX, Lens robustness)

Reviewer scope: visuals, staging, UX, Preview robustness, asset needs. The review was read-only; scratch work lives in `scratchpad/r4-lens/`. Lens Studio stayed closed and no MCP calls were made.
Evidence used:
- design 03, PREVIEW_TOUR, PROGRESS, decisions, the 10-29 review and Lens review;
- the third-pass commits `5923208..HEAD` (13 commits);
- all 20 captures from 10-29 and 10-30;
- `Assets/` inventory;
- the two most recent Lens Studio logs (`LensStudioLog-2026-10-28-23-32…`, `LensStudioLog-2026-10-29-23-23…`);
- all `Roomscript*.ts` presentation controllers;
- a scratch measurement of graph and state sizes (`r4-lens/size.ts`, run with Tooling's tsx; no repo writes).

---

## 1. Verdict

**The game logic is far ahead of the presentation.** A judge watching a <3-minute Preview video would currently see:
- a Lens Studio sample-UI layout of six or seven stacked grey UIKit cards;
- flat-coloured placeholder boxes on top of the photoreal "Evening Room";
- children's-book paper-doll suspects;
- a modest OBJECTION in the default sans font.

Several genuinely good beats exist and could look strong once dressed: the knocks and tape, the chalk outline drawing in, the shards, the cyan-dashed versus coral path tear, the sweep blade and the suspect walking to their true mark. Today they are drawn as 1–2 cm unlit strips and read as debug lines.

**Highest-leverage fixes, in order:**
1. **Restore a responsive Preview.** The stall is a per-process degradation that builds up over long Lens Studio sessions with hundreds of hot reloads (evidence below). Restarting fixes it. Also remove the per-frame deep copies.
2. **A "Director/Stage" presentation mode for the video.** It needs:
   - one panel at a time;
   - no stand-in boxes over the Evening Room;
   - no LEAF overlay;
   - a scripted camera;
   - auto-placement.
3. **Replace the actor art and the typography.** Use engraving-style bright line art on transparent backgrounds with real pose sets, plus three custom fonts.
4. **Make five hero moments big:** OBJECTION, gaze line, sweep, reconstruction freeze and CASE CLOSED. Each needs real VFX weight (glow quads, thick additive lines, scale, sound) instead of 1 cm strips.

Effort isn't the constraint (Codex), so all of these should be done before the Nov 9 video.

---

## 2. Preview stall: root-cause analysis

### Symptoms (from the logs)
- `JavaScript execution has timed out` at trivial sites:
  - `RoomscriptOpeningController.ts:17` (the UpdateEvent arrow), four times;
  - `beat()` → `trace.push` (01:37:34);
  - `RoomBinding.objectAnchor` (a `Map.get`) called from `TellVisual.update:69` (01:28:41).
- A tell logged `delayMs: 10651` at 01:28:23. The first update frame after `due` arrived about 10 s late, which means a whole-frame hitch.
- In the DEBUG interrogation run (01:07:42), `sleep(1500)` took 12 s and hover→trigger took 13.5 s. The assertion `Expected 5, Received 0` fired because the answer arrived 1 s *after* the scenario failed (`TTS|subtitle_fallback` at 01:08:52).

### Key evidence: a monotonic, per-process decay
The latency between the LEAF plugin logging `Running scenario` and Preview logging `RUNS:` grows steadily through each Lens Studio process and resets when Lens Studio is restarted.

| Session (one process) | Early | Middle | Late |
|---|---|---|---|
| 10-28 23:32 → 10-29 08:33 | 00:16: **0.2 s** | 00:58: 8.4 s · 01:12: 25 s | 02:45: 13.6 s · 02:47: **56.5 s** (4 JS timeouts) |
| 10-29 23:23 → 10-30 08:00 | 23:35: **0.2 s** | 00:24: 3.7 s (interrogation still PASSED, tell 319 ms) · 00:46: 9.6 s | 00:58: 15.8 s · 01:07: 48 s · 01:28: **88.6 s** (5 JS timeouts) |

- **Lens resets:** 357 (10-29 session) and 543 (10-28 session), driven by Codex file edits and hot recompiles; there are 8 "Lens has been reset more than 10 times in a row" warnings.
- **The lens itself starts fast** even in the degraded state. At 01:06:43–44 the lens reset, registered 21 scenarios, verified the solver and logged "production interrogation ready" in about 1.5 s. The slowness is in the frames and message pump *after* startup, so it isn't scene construction.
- **The heavy vitest batch was stopped** before the 01:37 hero-demo attempt (PROGRESS line 240), yet it still failed. CPU contention may have contributed earlier but isn't the persistent cause.
- **Tell delays went from about 310 ms (23:35) to about 950 ms (00:28, production study) to 10.6 s (01:28).** This tracks the same decay.

### Conclusion (confidence: high on the remedy, medium on the mechanism)
The stall is a **cumulative degradation of the Lens Studio Preview/LEAF process over long sessions with hundreds of hot-reload resets**: leaked resources and handlers, or GC pressure that grows with each reset. Its signature is stop-the-world pauses large enough to trip the JS watchdog in a `Map.get`. **Restarting Lens Studio restores normal speed:** both sessions began at a 0.2 s handshake. It isn't a logic bug in a Roomscript loop. No unbounded loop, recursion or per-frame scene creation was found in any `update()`.

### Our own per-frame waste (amplifies hitches; fix anyway)
The engine bridge deep-copies on every call: `caseGraph()` is `JSON.parse(JSON.stringify(graph))` at **34 KB**, and `snapshot()` copies state, which is 11 KB at the end of the hero route and grows with `log` and `events` (`events` alone is 5 KB). In node a graph copy costs 0.55 ms; Lens's JS VM is likely several times slower.

| Site | Frequency | Fix |
|---|---|---|
| `RoomscriptOpeningController.ts:61`: `engine.snapshot().verdict` | **Every frame** for the whole investigation (ready phase) | Cache the verdict from `engine.onState`. Move the clock tick onto `DelayedCallbackEvent` at 1 s. |
| `RoomscriptSpatialObjectionController.ts:38` and `:96`: `dropTarget()` and the hint label each call `caseGraph()` | **Every frame while dragging the slip** (two 34 KB copies per frame) | Cache the graph and anchor positions in `build()`. The graph is immutable after `initialize`. |
| `RoomscriptOpeningController.ts:59`: `caseGraph()` | Every frame for 2 s of the reveal | Precompute `items` once. |
| `RoomscriptClosingController.ts:52`: `caseGraph()` | Every frame of the wrong-verdict escape | Cache the culprit actor and door position in `beginReveal`. |
| Each `dispatch` | About 8–10 deep copies across listeners (Interrogation.render plus `choices()`, renderKnowledge, refreshWallet, TellVisual, four actors, Closing) | Bridge change: `graphRef()` returns one cached, `Object.freeze`d graph. `snapshot()` is memoised per `lastSeq` and returns a frozen object. Keep `snapshot()` for LEAF and tests. |

**Other robustness findings**
- `RoomscriptAudio.ts:25`/`:28`: a **single sfx and a single spatial AudioComponent**. Every `play`/`playAt` stops the previous one, and the ready-phase `ClockTick` (`Opening.ts:61`, every 1 s, same volume 0.45 as every other cue) **cuts the inspect chime, refutation chime, knock and chalk cues mid-sound**. The 1 Hz tick at full sfx volume is also fatiguing on video; design 03 says −28 dB.
  Fix: a pool of 4 spatial emitters (round-robin), 2 non-spatial channels, and a dedicated quiet tick emitter at about 0.08 volume. Keep the emitter-init-once rule from the 10-29 decision.
- `RoomscriptSpatialObjectionController.ts:114` (`path()`): clones a new material per segment (13 per objection) and never destroys them. `ClosingController.ts:47` clones once per reveal. Fix: two shared materials (cyan and coral).
- `RoomscriptInterrogationController.ts:46` and `:115`: "More questions" paging uses `choices[(page*3+i)%len]`, so the last page **repeats earlier chips** and nothing shows "page 2/3". Fix: no wrap-around, blank or hidden buttons beyond the end, and a "More (2/3)" label.
- `RoomscriptOpeningController.ts:30`: the placement panel is parented to the **camera** (head-locked), against design rule §6.5/3. That's acceptable in Preview but should be lazy-follow on device.
- `RoomscriptCaseCrate.ts`: the crate never *lands* (there's a thud sound but no drop animation). This is a cheap visual gap.
- `RoomscriptClosingController.ts:24`: holding the seal gives **no feedback** (no ring, no heartbeat, no fill). Users will click and nothing happens. Fix: a fill ring driven per frame by `heldAt` and a heartbeat cue, as design §4.6 specifies.
- **Shipping-scene debug objects are enabled:** `LEAF Plugin Bridge`, `LeafIndex` and `AiPreviewAgent Handler`. The LEAF overlay banner (`[13.5s][roomscript-clue] PASSED`) appears at the top of 10 of the captures. A recording or submission build must disable them. `RoomscriptGatewayCredentials` must stay blank.
- `PreviewRoom` stand-ins are enabled in the editor (`RoomscriptPreviewRoom.ts`):
  - **StandinDesk, StandinBed, StandinWindow (pure cyan), StandinDoor, Kettle, Lamp…** are flat unlit boxes;
  - they sit on top of the Evening Room's real furniture: a bright cyan rectangle, an orange slab over the sideboard, and a brown block;
  - they're the single most "placeholder" thing in every capture;
  - cyan also violates "cyan = alibi only".

---

## 3. Visual audit against design 03

The grade is how it would read in a Preview video today.

| Element | Design 03 intent | What the captures show | Grade | What would make it stunning |
|---|---|---|---|---|
| **Overall frame and composition** | Room is the star; one hero brightness at a time; text lives on things | 5–7 grey UIKit cards stacked in the lower-left (chips, verbs, subtitles, case lid, pawns, cast selector, WHO/WHERE/WHAT). Cards overlap (`l3-crate-view.png`: "MARGUERITE VALE" overlaps "Asking about", the WREN card clips "No witness…") | **D** | A "one panel at a time" stage manager. Card frames drawn as a thin brass or yellow rule with a 10% tint, no default BackPlate |
| **Preview room** | Simulated room matches Wadood's room; virtual props minimal | Placeholder boxes over a photoreal room; cyan window slab; orange "table" over the sideboard | **D** | Disable stand-ins in a Director mode. Anchor fixtures to the Evening Room's own furniture (sideboard = Study desk, lamp = desk lamp, window = Conservatory). Use yellow corner brackets and tents only, which is design §1.1's "casting as set dressing" |
| **Palette** | Coral = truth, cyan = alibi only, yellow = markers, brass = board, ivory = people | Cyan is used for the composure bezel (should be brass), Believe/Press/Object verb text, zone floor squares, weapon triangles, the sweep blade and the window stand-in. Coral is used for whole-card text | **C−** | Re-map per design §6.1. Cyan only on statements, cover paths and gaze glow |
| **Typography** | Heavy condensed for hero words, slab-serif plaques, mono case labels, ≥0.5° | One default UIKit sans everywhere. Fixture labels ("marble bookend") are tiny yellow text (`l4-placement.png`), well under 0.5°. Titles are fine | **C−** | Three OFL fonts (see §5). Hero words ≥3° |
| **Actors (all four)** | "Living engravings": bright face and hands, hatching, rim line, fade below the waist, glowing signature prop | Programmatic `System.Drawing` paper dolls (`tempAssetGen/gen_actor.ps1`): flat ivory fill, dark-brown outlines, cute closed-eye smile. Okafor's **black** bow tie is invisible on device. The three new suspects use one PNG for all four poses, so *rattled and broken change nothing*. Vale's four poses differ only by a few brow and eye pixels | **D** | Engraving line art: bright ivory lines on transparent, hatching density, rim line, fade at the waist, prop at 100%. Six poses per suspect, a blink frame and a mouth-open frame (§5) |
| **Composure bezel** | Brass arc behind the head, five segments, segments snap off with sparks | Thin cyan C-arc. Segments vanish | **C** | Brass engraved arc with tick marks. On a lost segment, the piece falls and sparks, with a clock-click |
| **Tell (prop flare)** | Four-point star flare at 100% brightness | A small cyan quad scaled 0.2–1 for 0.9 s | **C−** | Star-flare sprite (additive, 4 rays) plus a glow halo, 150 ms peak, one per prop type (brooch star, lighter flame, lens glare, glove flash) |
| **Gaze line** | White core, cyan glow, travels at 25 m/s, retracts *to* the object, glint ring and eye glyph on the tent | A dashed cyan quad strip that appears instantly for 0.9 s (`c6-gaze-diagnostic.jpg`) | **C** | A travelling head (0→1 over 80 ms). Core plus glow as two strips. A glint-ring sprite at the object. An eye glyph on the fixture tent for 10 s |
| **Crate and HUD** | Brass-cornered evidence crate, stencil, light floods up | A flat orange box with a mustard lid. The lid HUD is a grey card ("140m \| 5 pips \| 0 hunches"). Nine thin yellow "beam" lines | **D+** | A textured crate (wood plus brass corners plus a `CASE 1041 — HARLOW` stencil decal), a drop and land animation, a glow quad rising from the lid, motes |
| **Cards (memory, statement, refutation, wallet, notebook)** | Polaroids that develop (coral frame), cyan dashed slips, private card flip | Generic grey cards with small coral or cyan text and Previous/Next/Close buttons. The memory card scales up from 0.03 (a "develop" of sorts). The refutation card is plain | **C−** | Polaroid frame sprite with a line-art picture per evidence item, develop shader (fade from white to image), typewriter reveal. Statement slip as a cyan dashed-outline sprite |
| **Objection** | 40 cm heavy word, white core plus yellow, 3-frame shake, freeze, tear, shards, break | Yellow default-sans "OBJECTION" (bigger in `c7-yellow-stamp.png`, smaller in `c7-shards.png`), 30 flat cyan triangles, cyan-dashed and coral strips on the floor (`c7paths.jpg`), walk to mark | **B−** | Custom heavy condensed word (as a texture or font) with outline glow, a radial burst sprite behind, screen-space shake, world freeze (motes stop, actor freeze is already done), shards that are *slip-textured* pieces, a coral string that persists. This is the signature shot and deserves the most polish |
| **Sweep** | Waist-height blade circles the room, ticks per witness, stops at the refuter, chime | A cyan line rotating from the player for 2.4 s with ease-out (it *slows near the refuter*, which design says gives it away), then a plain card | **C+** | Blade as a bright fan sprite (fade at the edges), constant speed, tick ring flashes at each witness, glow rim on the refuter, card rises *from the refuter object* |
| **Opening** | Knocks → tape zip → crate lands → seal pull → light floods → chalk races → envelope rises → riffle → stamp → clock ticks | Knocks, two yellow line "tapes", thud (no landing), "PULL TO OPEN" grey pill, 9 beam lines, chalk outline built from 23 strips, a caption flicker "YOUR ROOM IS THE BOARD", and actors popping on with a chime | **C** | Hazard-stripe tape texture with a zip-across animation, crate drop, light-flood glow, chalk-textured outline drawn with a moving head, envelope with a wax seal sprite, a card riffle vortex (sprite cards), Polaroid-develop arrivals (fade 0→1 over 1.5 s plus a motif sting) |
| **Accusation** | Pawn into WHO, plaque flies to WHERE, tent flies to WHAT, hold seal (heartbeat), cards flip ✓ | A grey panel with cycling Who/Where/What buttons, "File known proof", and "Hold seal for 1 second" with no feedback | **D+** | Three-slot envelope UI: tap suspect, zone and object in the room (or a 4×5×5 picker grid), a seal sprite with a fill ring and heartbeat, three card flips with ✓ stamps |
| **Reconstruction** | Coral dust ghosts walk the night; bullet time at 22:41 with suspended beads; orbit | Eight-segment line silhouettes jumping between marks every 2 s with a panel caption | **D** | Point-cloud or particle ghosts (sprite-sheet "dust" figures), footpath trails, a slow-mo freeze at the murder slot with a hanging cup and beads, a camera orbit in Director mode |
| **Ending** | `CASE CLOSED` stamped on the lid, tape falls, guests leave, the room remembers | A grey card listing "CASE CLOSED / Holmes rating 1/3 / … / HARLOW-1041@r_27fe6e25 / Seal fc4da1ea" (`d3-ending.png`; the run also shows "par 90", now stale vs 85) | **D+** | A big `CASE CLOSED` stamp texture, a rating as three brass stars, "You: 145 min. Par: 85.", seal hash in small mono at the bottom, tape falls, a final tent glows by the cable |
| **Floor marks (zones, weapons)** | Brass zone borders that dim when eliminated; yellow tents with numerals | Cyan 56 cm squares and cyan triangles, nearly invisible at grazing angles; plaques are grey pills | **C−** | Brass borders at 0.3° width, numbered yellow A-frame tents (sprite or GLB), chalk X on eliminated ones |

**Wow-list status (§10):**
- **Partial:**
  - #1 Objection (B−);
  - #2 gaze (C);
  - #3 bullet time (D);
  - #4 opening (C);
  - #5 sweep (C+);
  - #6 tableau walk (B−);
  - #8 room crosses itself off (C, too subtle);
  - #10 lawyer-up (C+).
- **Absent:** #7 blackout and #9 AI casting. Leave them out.

---

## 4. UX walkthrough as a first-time judge (PREVIEW_TOUR)

1. **Placement:**
   - A head-locked card offers Floor up/down, Turn L/R and Place.
   - In Preview the floor is already correct, so this is pure friction.
   - The floor cross and the tiny yellow fixture labels are hard to see.
   - **Fix:** in the editor, auto-place and skip the step, with a "Begin case" button. Keep manual placement for the device only.
2. **Knocks and tab:**
   - "Listen at the door" appears on a card while the door is behind or off-frame, with no visual cue.
   - "PULL TO OPEN" is a grey pill: it gives no drag affordance, the pull threshold is 3 cm, and it snaps back.
   - A judge using a mouse will *click* it, and nothing happens.
   - **Fix:**
     - a pulsing yellow arrow;
     - accept a click as a pull in the editor;
     - make the door glow and tape appear in frame (turn the camera in Director mode).
3. **Reveal (13 s) and arrivals:**
   - Captions only.
   - The four actors pop on, all at once on the right side of the frame.
   - Nothing tells the player what to do next.
   - **Fix:** a single onboarding line ("Pinch a suspect to question them") with a pulsing ring on Vale.
4. **Meet the cast:**
   - Selection exists in two places: the name button above each actor, which sits **over the chest** in `interrogation-diagnostic.png` ("Vale" bar cuts the torso), and a duplicate selector row.
   - "Your brooch" makes sense only if you know the prop.
   - The tell lasts 0.9 s, is small and is cyan. **A judge will miss it.**
   - **Fix:**
     - a Rookie hint banner after the first tell: "Her brooch flared — that's her tell";
     - a longer, bigger flare;
     - the gaze line arrives with sound.
5. **The objection flow is the biggest UX trap.** It takes about seven actions:
   - inspect the kettle by clicking the fixture;
   - close the memory card;
   - choose Object;
   - open the wallet ("Choose memory");
   - Previous/Next to the right item;
   - "Use evidence";
   - drag the slip and release it "aligned with" the memory card.
   - The tour itself names IDs (`E_KETTLE_COLD`, `C_OKAFOR_REPLY`).
   - **Fix:**
     - after a lie, show the statement slip by the suspect;
     - **dragging it onto any inspected object or onto a memory card objects immediately**;
     - the wallet becomes a fan of 4–6 visible cards rather than a one-card carousel;
     - drop targets glow while dragging (currently only hint text changes).
6. **"More questions":**
   - "About Harlow" is hidden behind unlabelled paging that repeats chips.
   - **Fix:** a page indicator, or show all questions in a scrollable list of up to 8.
7. **Collecting proof:**
   - Seven inspections, each needing an open and close.
   - **Fix:**
     - memory cards auto-dismiss on the next inspect;
     - the notebook shows a "proof collected 5/8" progress line.
8. **Suggestion:**
   - Drag a 7×12 cm pawn "aligned with Study".
   - No zone highlights during the drag.
   - "Touch a possible weapon" points at tiny cyan triangles.
   - **Fix:**
     - zones light brass while hovering;
     - weapons get numbered yellow tents;
     - say "Suggest" on the case lid so the verb is discoverable.
9. **Accuse:**
   - Cycling buttons Who/Where/What need up to 4, 5 and 5 clicks.
   - "File known proof" is jargon.
   - The seal hold gives no feedback.
   - **Fix:**
     - a direct picker;
     - auto-file proof with a visible "4/4 deductions" count;
     - a fill ring.
10. **Ending:**
    - Hashes are the most prominent text.
    - **Fix:** a hero stamp and a rating, with the hash in small mono.

**Copy and voice:**
- "WREN" (the narrator) is never introduced. Use "NARRATOR" or a one-line intro.
- "pips" and "hunches" are unexplained on the lid.
- Subtitles wrap at 28 characters, which is fine.
- Panels hold too much text at once. Cap each panel at one title plus two lines, and move the rest behind a single "?" button.

**Button sizing:**
- Buttons are 4–8 cm tall at about 1.1–1.6 m, roughly 1.6–2.8°, which meets the 2° target for most of them. The 4 cm chip rows are about 1.5° and too small for real pinch.
- Text inside the "small" role at 64×scale passes in Preview.
- Fixture labels (8 cm row, small) are illegible beyond 1.5 m.

---

## 5. Asset inventory and needs list

### What exists (`Assets/`, excluding scripts)
- **Actor:**
  - `Vale-{neutral,listening,rattled,broken}.png` (512×1024 RGBA, about 44 KB each, procedural);
  - `Qadir/Okafor/Pike_512x1024.png`, one each, reused for all four poses (`Scene.scene` wires each actor's four texture slots to it);
  - SVG sources;
  - `RoomscriptPuppet.graphShader/.mat` (baseTex, stress, jaw via `appearance`);
  - `RoomscriptGaze.graphShader/.mat` (constant angular width);
  - `RoomscriptShatter.graphVfx` (its runtime asset is null, so it's unused and the 30 CPU shards are used instead).
- **Materials:** seven flat unlit `Roomscript{Brass,Coral,Cyan,Ivory,Slate,Wood,Yellow}.mat`, `unlit.graphShader`, `flat.graphShader`.
- **Audio:**
  - `GeneratedSFX/`: Knock, TapeZip, CrateThud, ClockTick, Tink, Shing, Objection, Ratchet, Chime, ChalkScratch (procedurally synthesised WAVs);
  - `BackgroundMusic.wav` (**4.35 MB raw WAV**).
  - Total audio is about 6.3 MB.
- **Render:** `Echopark.hdr` (1.5 MB, unused for unlit content; could drop).
- **Everything else is MeshBuilder geometry built at runtime:** crate, stand-ins, lines, shards, ghosts, pawns, chalk.
- There are **no fonts, no textures for cards, frames, icons or tents, no particles and no GLB models.**

### Needs list (P = priority for the video)

| # | Asset | Spec | Status | P |
|---|---|---|---|---|
| A1 | **Suspect pose sets ×4**: neutral, listening/speaking (mouth open), guarded/smug, rattled (doubled contour), broken (slumped, coral rim), lawyered (standing, turned) | 6 poses × 4 = 24 PNGs, 1024×2048 or 512×1024, **bright ivory line art and hatching on transparent**, face and hands brighter, fade to transparent below the waist, signature prop drawn separately | Placeholder (1 real-ish set) | **P0** |
| A2 | Blink and mouth overlays | Per suspect: eyes-closed and mouth-open layers (sprite atlas 4×1) | None | P1 |
| A3 | Prop flare sprites | Four-point star (brooch), flame (lighter), lens glare (2 ovals), glove flash; 256² additive, with a 4–8 frame sprite sheet each | Cyan quad | **P0** |
| A4 | Glow and line kit | Soft radial glow 256², line-glow gradient strip 256×32, glint ring 256², spark sprite 64² | None | **P0** |
| A5 | Hero word textures | OBJECTION!, LIAR!, CASE CLOSED, THE CULPRIT ESCAPED, SEALED: heavy condensed, yellow with a white core and outline glow, 2048×512 | Default font text | **P0** |
| A6 | Fonts | Heavy condensed (Anton or Bebas Neue, OFL), slab serif (Zilla Slab or Roboto Slab Bold), mono (IBM Plex Mono or JetBrains Mono Bold), humanist sans (Atkinson Hyperlegible or Inter). Lens Studio imports TTF/OTF as Font assets | None | **P0** |
| A7 | Card frames | Polaroid frame (coral), statement slip (cyan dashed outline), document (ivory), private refutation card (back and front), evidence wallet fan card: 9-slice-friendly 512² PNG outlines, **no filled bright panels** | Grey BackPlates | **P0** |
| A8 | Evidence illustrations ×13 | Line-art "memory" pictures for each object memory (kettle cold, lamp figure at desk, letter, voicemail waveform, bottle, bookend, latch, window, candlestick, knife, cable, recorder, clock): 512² ivory or coral line on transparent | None (text only) | P1 |
| A9 | Forensic tents | Numbered A-frame tents 1–13 (GLB, about 200 tris) or billboard sprites, plus chalk-X and eye-glyph variants | None | P1 |
| A10 | Corner brackets and zone plaque frames | Yellow bracket sprite; brass plaque frame for zone names | Line strips and grey pills | P1 |
| A11 | Crate | GLB: wood crate with brass corners, hinged lid as a separate node, stencil decal `CASE 1041 — HARLOW`, seal strip; baked unlit texture 1024² | Flat orange MeshBuilder box | **P0** |
| A12 | Envelope and seal | Brass-framed envelope with three slots (WHO/WHERE/WHAT), a wax seal sprite plus a crack sprite sheet, a fill-ring sprite | Grey buttons | P1 |
| A13 | Crime-scene tape | Hazard-stripe texture `CRIME SCENE — DO NOT CROSS` 1024×64, tileable | Two yellow lines | P1 |
| A14 | Chalk | Chalk stroke texture (grainy blue-white) for the outline and X marks | Flat strips | P1 |
| A15 | Pawns | Four 12 cm pawn GLBs or sprites with suspect initials and prop silhouettes | Grey card plus triangle | P2 |
| A16 | Composure bezel | Brass arc segment sprite or GLB with tick marks, plus a breaking-segment spark | Cyan arcs | P1 |
| A17 | Reconstruction ghosts | "Dust" figure sprite sheets per suspect (walking 8 frames, frozen pose), 75% scale; cup, beads and shatter sprite sheet; footprint decal | 8-line silhouettes | P1 |
| A18 | Particles | Motes (tiny warm dots), shard pieces textured from the slip, sweep-blade fan gradient, light-flood cone | 30 flat triangles | P1 |
| A19 | Clock | Empty clock outline with ghost hands (sprite) and a ratchet animation | Stand-in clock mesh | P2 |
| A20 | Title and end cards | ROOMSCRIPT logotype; "Clue meets L.A. Noire. In your room."; "Lens Studio Preview — simulated room" badge; end card "Same case. Your room." (1920×1080 for the edit, plus an in-world variant) | None | **P0** (video) |
| A21 | UI icons | Notebook, evidence, accuse, suggest, back, help: 128² line icons | Text buttons | P2 |
| S1 | Suspect motifs | 4 one-bar stings plus 4 loops (cello, bass, piano, celesta) in one key | None | P1 |
| S2 | Tells audio | Vale tink (exists), lighter snap, glint sine, leather creak | 1/4 | P1 |
| S3 | Cues | Rip (tab), pneumatic hiss, riffle, heavy stamp CHUNK, heartbeat, seal crack, paper rip, glass shatter, coin chime, breaker thunk, typewriter clack, pencil scribble, card flip | About half exist as generic synths | P1 |
| S4 | Ambience | Rain-on-glass loop, mains hum (banked sound), clock tick at a distinct low level | Music bed only | P2 |
| S5 | Narrator VO | "Nobody leaves.", case contract line, ending lines: TTS or recorded, cached | None (captions) | P1 for the video |
| S6 | Music | Replace the 4.35 MB WAV with compressed audio (MP3 or OGG if supported; verify) | Raw WAV | P2 (size) |

### Lens Studio 5.23 import constraints for the Three.js/headless-Chromium pipeline
Each point is labelled either as verified from a source or as inference to verify.
- **Lens size:** Spectacles allows **25 MB** per published lens (vs 8 MB on Snapchat) ([Snap publishing docs](https://developers.snap.com/spectacles/get-started/start-building/publishing-lens)). Current assets are about 8.5 MB, so there's headroom for about 15 MB of art. Compress audio and drop the unused `Echopark.hdr` (1.5 MB).
- **Textures:**
  - LS compresses PNGs on import; small textures are skipped ([optimization overview](https://developers.snap.com/lens-studio/publishing/optimization/overview)). Older Snap guidance budgets about 2–3 × 2048² or 5–6 × 1024² textures per lens (community; dated).
  - Keep sprites ≤2048 per side, prefer power-of-two (needed for mipmaps; *inference*), and pack sprite sheets in atlases ≤2048².
  - Export PNG RGBA with **premultiply-safe edges** (bleed colour into transparent pixels to avoid dark fringes; *inference*).
- **Additive-display colour rules (design 03 plus Snap UI guide):**
  - black and dark pixels are transparent;
  - alpha is effectively brightness;
  - avoid opacity gradients (banding);
  - author **bright-on-transparent** and never dark ink on a light fill (the current portraits break this);
  - no large filled bright areas.
  - **Preview does not emulate additive blending.** The captures show dark plates as visible grey boxes, so judge-facing art must look good in *both* modes: bright line art on transparent works in both.
- **Materials:**
  - use unlit materials with baked lighting (Snap guide);
  - for glow sprites, set BlendMode to Add or Screen on the material (the existing `.mat` files are Normal);
  - two-sided for billboards;
  - depth write off for transparent sprites.
- **GLB/glTF:**
  - LS imports FBX, OBJ and glTF/GLB. One older community report notes failed glTF imports where FBX worked ([community thread](https://community.snap.com/snapar/discussion/comment/3886)).
  - Recommend exporter settings: binary `.glb`, embedded PNG textures, **no Draco or meshopt compression**, no KHR material extensions beyond core PBR, ≤64k vertices per mesh (UInt16 indices; *inference*), Y-up, metres scaled to cm on import (LS uses cm; check the import scale).
  - On import, swap the PBR materials to the project's unlit graph.
  - Test one crate GLB end to end before batching.
- **Animated sprites:** use LS 2D animated textures or flipbook UVs in the puppet shader. A shader flipbook (atlas plus frame index in `appearance`) avoids per-frame JS texture swaps.
- **Fonts:** import TTF/OTF and assign via `Text.font`. Check the OFL licence and record it in NOTICE.

---

## 6. Preview-only video tooling
1. **Director mode** (a `RoomscriptDirector` component, editor-only, off by default). It:
   - disables the PreviewRoom stand-ins, `LEAF Plugin Bridge`, `LeafIndex`, `AiPreviewAgent Handler` and every debug overlay;
   - auto-places the case;
   - forces Stage mode;
   - exposes hotkeys or buttons to jump to beats (opening, Vale interview, objection, sweep, accusation, reconstruction, ending), each from a seeded state replayed through the authored hero tape actions.
2. **Cinematic camera.** Interactive Preview drives the camera through device tracking. Add a director rig that disables tracking (or parents the camera under an animated rig) and plays authored Catmull-Rom paths with eased "Steadicam" sway per shot. *This is unverified in 5.23: prototype it first. The fallback is smoothed manual WASD capture.*
3. **Clean recording build.** No LEAF banner, no `console.log` spam in view, and hidden credentials.
4. **Framing.** The Preview renders the Spectacles portrait aspect (about 0.92:1 in the captures). For 16:9, place the Preview capture centre and use the side gutters for title, caption and "Lens Studio Preview — simulated room" badges. Alternatively, record the editor window at 1440p and crop.
5. **Session hygiene for recording:**
   - restart Lens Studio;
   - pause Codex edits (no hot reloads);
   - no vitest running;
   - check the handshake: `roomscript-interrogation` should pass with a tell delay of about 300 ms;
   - then record within about 30 minutes.

---

## 7. Work packages for the next Codex pass

| WP | Goal | Files | Acceptance check |
|---|---|---|---|
| **W1 Perf hygiene** | Remove per-frame and per-drag deep copies | `RoomscriptEngineBridge.ts` (`graphRef()` frozen cache; `snapshot()` memoised per `lastSeq`), `RoomscriptOpeningController.ts:59,61`, `RoomscriptSpatialObjectionController.ts:38,96,114`, `RoomscriptClosingController.ts:52`, all `onState` listeners | Grep shows no `caseGraph()`/`snapshot()` inside any `update()` or `onDragUpdate`. Existing LEAF and vitest suites green. A new LEAF probe logs mean frame time over 600 frames in ready phase and during a slip drag, under 8 ms in fresh Preview |
| **W2 Fresh-process gate** | Prove the stall is per-process | Ops only: restart Lens Studio, then run `roomscript-interrogation`, `all-tells`, `hero-demo` | Run-to-RUNS handshake under 1 s, tell delay 300–400 ms, three strict passes, zero `TimeoutError` lines in the new log. Record the restart in PROGRESS |
| **W3 Audio mixer** | Stop cue cut-offs; quiet clock | `RoomscriptAudio.ts`, `RoomscriptOpeningController.ts:61` | A pool of 4 spatial and 2 non-spatial channels plus a dedicated tick at 0.08. LEAF: a refutation chime and a clock tick in the same frame both report `isPlaying` |
| **W4 Director mode and clean build** | Video-ready Preview | New `RoomscriptDirector.ts`, `Scene.scene` toggles, `RoomscriptOpeningController.ts` (editor auto-place, click-to-pull), `RoomscriptPreviewRoom.ts` (stand-ins off under Director) | One toggle hides the stand-ins, LEAF bridge and overlays. Beat hotkeys reach each of the 7 beats in under 5 s. A capture of each beat shows no LEAF banner and no box stand-ins |
| **W5 Cinematic camera** | Smooth scripted shots | New `RoomscriptCameraRig.ts` | A prototype path plays a 10 s orbit around Vale at 30+ fps in Preview. If tracking can't be overridden, document that and fall back |
| **W6 Stage manager and card system** | One panel at a time; no overlaps; design-03 palette | `RoomscriptPanelUI.ts` (frame style: thin brass or yellow rule, 10% tint, no BackPlate fill for passive cards), Chip/Verb/Subtitle/CaseLid/Wallet/Notebook UIs, `RoomscriptCastController.ts` (name tag above the head, not on the chest) | Captures of interrogation, objection and clue show at most 2 panels visible and no text overlap. Cyan appears only on statements, cover paths and gaze. The bezel is brass |
| **W7 Actor art v2** | Engraving-style suspects with real pose sets | `Assets/Actor/*` (24 pose PNGs plus blink and mouth atlases from the pipeline), `RoomscriptSuspectActor.ts` (pose map: guarded/lawyered, blink timer, mouth from amplitude), `RoomscriptPuppet.graphShader` (flipbook, rim line, waist fade) | Each suspect's 6 poses are visibly distinct in a 4×6 contact-sheet capture. No dark-ink-only features. The silhouette fades below the waist. The prop is the brightest pixel |
| **W8 Hero VFX pass** | Make the 5 money moments big | `RoomscriptSpatialObjectionController.ts` (word texture, burst glow, screen shake, textured shards, persistent coral string), `RoomscriptTellVisual.ts` (star flare, travelling gaze head, glint ring, eye glyph), `RoomscriptClueController.ts` (fan blade, constant speed, refuter glow), `RoomscriptClosingController.ts` (seal fill ring, heartbeat, three card flips, CASE CLOSED stamp), `RoomscriptOpeningController.ts` (crate drop, light flood, tape texture zip, chalk head) | A side-by-side capture of each moment against design 03 §4. Video-length timing matches the §4 tables within ±20% |
| **W9 Reconstruction v2** | Bullet-time money shot | `RoomscriptClosingController.ts`, new ghost sprite sheets | Coral dust ghosts walk 15-minute steps with trails. At the murder slot everything freezes 6–12 s with a hanging cup and beads; a pinch resumes; the cup shatters. Capture of the frozen frame |
| **W10 UX simplification** | A first-timer can finish without the tour | `RoomscriptInterrogationController.ts:46,115` (paging without wrap, "More 2/3"), objection drag-to-object directly from the slip, wallet as a 5-card fan, zone highlight on pawn drag, numbered tents, accusation picker, auto-close memory cards, onboarding hints (first tell, first lie, first objection), rename WREN → Narrator | A scripted LEAF "naive player" route completes the hero case using only visible affordances, in ≤40 clicks; the old tour route is about 70 |
| **W11 Fonts and typography** | Design §6.3 type scale | Import 3–4 OFL fonts; `applyTextRole` gets roles hero, plaque, label, caption with angular sizing | Fixture labels ≥0.6° at 1.5 m. Hero words ≥3°. Licences in NOTICE |
| **W12 Asset compression and size** | Stay well under 25 MB with new art | Convert `BackgroundMusic.wav` to compressed audio, remove `Echopark.hdr` if unused, atlas sprites | Project build size reported under 18 MB after the art lands |
| **W13 Ending card and copy** | Readable result | `RoomscriptClosingController.ts:44,54` | Shows a stamp, stars, "You: N min · Par: 85", deductions 4/4, and the seal in small mono. No stale "par 90" |

**Order:**
1. W2 and W1 first; nothing else can be verified without them.
2. Then W4 and W6 (video baseline), W7 and W8 (looks), W10 (flow).
3. W5, W9, W11–W13 in parallel as art arrives.

Freeze features by Nov 6, so Nov 7–9 go to recording.

---

## Sources
- [Snap: Spectacles publishing (25 MB lens limit)](https://developers.snap.com/spectacles/get-started/start-building/publishing-lens)
- [Lens Studio optimization overview (texture compression)](https://developers.snap.com/lens-studio/publishing/optimization/overview)
- [Spectacles FAQ: scripting](https://developers.snap.com/spectacles/support/spectacles-faq/scripting)
- [Snap community: glTF import failures](https://community.snap.com/snapar/discussion/comment/3886)
- [Lens Studio community: texture budget guidance (dated)](https://support.lensstudio.snapchat.com/hc/en-us/community/posts/360056891612/comments/360009194912)
- Design 03 §6 and §11 for the Snap UI and spatial-design rules it cites.
