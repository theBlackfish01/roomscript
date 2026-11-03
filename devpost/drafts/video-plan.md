# Roomscript: 3-minute video plan (Preview-only)

Adapted from `docs/design/03-ar-staging-and-storyboard.md` §7 to **what is built** (PROGRESS and PREVIEW_TOUR, Oct 30) and to **no device**. Hard cap **2:50** (rules say under 3:00; leave margin for YouTube rounding).

**Changes from the storyboard:**
- **Dropped:**
  - the device shots 7, 13 and 19;
  - the twist/luminol (§4.5, not built);
  - bullet-time reenactment (only a simplified reconstruction exists);
  - "it reads your room" (placement is manual, with fixture markers);
  - motes and rain.
- **Shot 22 ("same case, two rooms") is replaced** by a terminal clip of the case compiler binding to two fixture rooms, which the engine does do.
- **Added:** a pitch beat (problem / who / why), required by the Presentation criterion, and a CLAD/MCP "how it was built" beat (Technical Implementation).

## Capture method

| Item | How |
|---|---|
| Lens footage | **OBS Studio** window capture of Lens Studio, cropped to the maximised Preview panel; 1920×1080 (or 1080×1080 cropped later), 60 fps, CQP/CRF about 18. Lens audio goes on a separate track (desktop audio, or OBS application-audio capture of Lens Studio). Hide the cursor where clicks aren't the point. Keep it where a "pinch" is the action, and add a click ring in the edit. |
| Preview setup | Interactive Preview, SPECS device, the authored Roomscript simulated room. **Film mode** (Run 1 adds it): hide debug, availability and diagnostic HUDs. Reset Preview before each shot. |
| Repeatable camera | Before each take, an agent sets the shot's start pose with the MCP **`MovePreviewCamera`**, using saved waypoints per shot (`docs/video/waypoints.json`). Do slow pans by hand (right-drag or WASD) or with keyframed MovePreviewCamera steps. Smooth them in the editor with gentle stabilisation or speed ramps. |
| Driving the action | Use **LEAF scenarios as a motion-control rig** where they're stable (opening, objection, clue, closing): start the OBS recording, then run the scenario, for clean and identical takes. Otherwise play by hand with the mouse, following PREVIEW_TOUR. Record 2–3 takes per shot. |
| Dialogue | **Stage mode** (authored answers and captions) for every take except **one live take**: Stage mode off, fresh RSG tokens, ask Vale "Whereabouts" 3–5 times and keep the best. **Afterwards, blank the tokens and run `strip-scene-tokens`.** |
| Build footage | Record a fresh 2–3 min session: a Codex or Claude Code terminal on the left, Lens Studio on the right. Have the agent do a small, real task, such as "nudge the kettle marker 5 cm via VirtualScene, recompile, run `roomscript-objection` LEAF, capture Preview". Also capture the Vitest run (`npm test`), the terminal solver (`npm run play -- --demo`) and the case compiler. |
| Stills | Export 3:2 stills for the Devpost gallery and the README GIF from the same footage. |
| Editor | DaVinci Resolve (free) or CapCut desktop. Burn in captions; YouTube auto-captions are optional. |

## Shot list (target 2:50)

**Tags:**
- `[P]` Preview footage; carries the persistent corner badge **"Lens Studio Preview · simulated room"**.
- `[A]` authored line (Stage mode).
- `[LIVE]` live AI.
- `[T]` terminal or screen capture.
- `⏩` time compressed.

| # | Time | Shot | Audio / VO | Src |
|---|---|---|---|---|
| 1 | 0:00–0:04 | Dark simulated room. **Three knocks**; the camera turns to the door, then back to the crate on the desk. | Knock SFX ×3 (`Knock.wav`), then silence. | P |
| 2 | 0:04–0:10 | Pinch the crate tab: TapeZip, lid, light floods, **chalk outline races across the floor**, the envelope rises. | Zip, CrateThud, ChalkScratch. **Title card overlay:** ROOMSCRIPT, "A murder mystery staged in your room." | P |
| 3 | 0:10–0:24 | **Pitch.** Slow push over the four suspects arriving (Qadir, Vale, Okafor, Pike). | **VO 1** (pitch, below). Music bed enters low. | P |
| 4 | 0:24–0:32 | **Placement.** Fixture markers and yellow brackets snap to the kettle, lamp and desk; *Place case*. (Cut this shot before 2 in chronology, or use it as a flashback; easiest is to keep it here as "how it maps".) | **VO 2.** Bracket clicks. | P |
| 5 | 0:32–0:44 | Select **Vale**. Ask *Your name* (steady), then *Your brooch*: **the tell fires, a gaze line flicks to the object**. Caption: *Learn her tell.* | Vale's line `[A]`, Tink and Shing. **VO 3.** | P |
| 6 | 0:44–0:58 | **LIVE exchange:** ask Vale *Whereabouts*. Her answer is spoken by the AI voice and captioned. Corner tag: **"Live AI: Gemini via Snap Remote Service Gateway · AI voice"**. Cut the wait and mark it ⏩ ("2.4 s"). | Her live line `[LIVE]`. **VO 4** (short, after the line). | P |
| 7 | 0:58–1:08 | **Objects remember.** Inspect the **kettle**: its memory card (cold, no whistle). Inspect the **lamp**. | Object SFX. **VO 5.** | P |
| 8 | 1:08–1:26 | **OBJECTION.** Open the wallet, take **E_KETTLE_COLD**, and drag the statement slip onto the kettle's memory card. **Yellow OBJECTION slams in, shards burst, the coral proof thread draws**, Vale falls back to her second account. | `Objection.wav`, Shing. Hold 1 s of silence before the slam. No VO; let it breathe. | P |
| 9 | 1:26–1:36 | Quick second objection ⏩: Okafor's reply (**C_OKAFOR_REPLY**) breaks Vale's second account. A 3-cut montage. | **VO 6.** | P |
| 10 | 1:36–1:50 | **Suggestion.** Drag Qadir's pawn into the **Study** with the **charger cable**. Dotted ghost, ratchet; **the sweep circles the suspects**; a private refutation card flips. | Ratchet, tick sweep, Chime. **VO 7.** | P |
| 11 | 1:50–2:10 | **Accusation.** *Accuse*: Vale / Study / charger cable → *File known proof* → **hold the seal**. Truth reconstruction, then the ending: deductions, rating, case seal. | Heartbeat-like silence, then the warm chord from `BackgroundMusic`. **VO 8.** | P |
| 12 | 2:10–2:26 | **Under the hood.** Animated architecture diagram (engine → fact sheet → LLM → validator → voice or line bank). Cut to the terminal: solver "1 solution", `npm test` **411 passed**, fuzz "1000 players". Then the compiler binding the case to two fixture rooms. | **VO 9.** | T |
| 13 | 2:26–2:42 | **How it was built.** Split screen: the agent terminal issuing `VirtualScene` / `RecompileTypeScriptTool` / `run_leaf_scenario` while Lens Studio updates; a LEAF scenario turns green ⏩; a quick scroll through `devpost/clad-log.md` and `git log` with tags. | **VO 10.** | T |
| 14 | 2:42–2:50 | **End card** (below). | Tick… tick, then a hard cut. | card |

**If integrated Preview is still unstable:** every shot above is a separate segment that matches a scenario that already passed on its own (opening, cast, clue, objection, closing, placement). Film per segment and reset between them. Don't claim a single continuous playthrough.

## Voiceover script (Wadood's own voice, about 240 words, calm, about 135 wpm)

- **VO 1 (0:11):** "AI can make a mystery endlessly replayable, but it also makes things up, and a mystery that contradicts itself isn't fair. Roomscript splits the job: an engine *proves* the case, and the AI only *plays* the suspects."
- **VO 2 (0:25):** "You place the case in your room. In the Lens Studio Preview this is a simulated room; the kettle, lamp and desk become the evidence."
- **VO 3 (0:34):** "Every suspect has a baseline, and a tell. Watch where Vale looks."
- **VO 4 (0:52):** "That answer was live AI. But it was only allowed to say what the engine handed it, and it was checked before she spoke."
- **VO 5 (1:00):** "Objects remember. The kettle never boiled."
- **VO 6 (1:27):** "Break one lie and she retreats to the next. A witness statement breaks that one."
- **VO 7 (1:38):** "Like Clue, you can test a theory. The other suspects refute it, privately."
- **VO 8 (1:52):** "When you're sure, accuse. The engine scores you against the shortest fully supported route."
- **VO 9 (2:11):** "Under the hood, truth is compiled, not generated. A solver proves one unique answer; the language model writes lines through seven validation gates, with authored fallbacks. Four hundred and eleven tests, a thousand simulated players, five thousand generated cases."
- **VO 10 (2:27):** "And it was built by coding agents: Codex and Claude Code, using Snap's CLAD skills and the Lens Studio MCP, with every step compiled, tested in Preview and committed."

Word count is about 245. Record it after the picture lock and trim lines to fit. Keep VO off the objection (shot 8).

## Title and end cards

- **Title (0:04–0:10 overlay):** **ROOMSCRIPT**, with "A murder mystery staged in your room · Snap Spectacles". Ivory, coral and yellow on black, matching the Lens palette.
- **End card (2:42–2:50):**
  - **ROOMSCRIPT**, "Same case. Your room."
  - github.com/TODO/roomscript · Built for *Learn AR with SPECS*
  - Lens Studio 5.23.2 · CLAD · Lens Studio MCP · Codex · Claude Code
  - small print: "Captured in Lens Studio Preview (simulated room). Not yet tested on Spectacles hardware. Most lines authored (Stage mode); the marked exchange is live AI. Voices are AI-generated. Music and SFX were generated with CLAD. Clue and L.A. Noire are trademarks of their owners; no affiliation."

## Music and sound
- **First choice: the Lens's own score and SFX** (`Assets/GeneratedSFX/BackgroundMusic.wav` plus 10 SFX). They are procedurally generated with CLAD build-music/build-sfx, original and sample-free. That means no licence or Content ID risk, they're on-theme, and they're part of the CLAD story.
- **Backup:** YouTube Audio Library (Studio → Audio Library). Pick a track with **no attribution required**, or credit it in the description. Avoid Pixabay/"free" tracks registered with Content ID.
- **Never use:** commercial noir or jazz tracks, L.A. Noire or Ace Attorney audio or "Objection!" samples, or film clips.
- **Mix:** VO at -14 to -16 LUFS integrated, music ducked about 12 dB under VO, SFX peaks at -3 dBFS. Export at -14 LUFS for YouTube.

## Honesty rules (non-negotiable)
1. A persistent **"Lens Studio Preview · simulated room"** badge on every Lens shot. No fake device footage, and no "on Spectacles" wording.
2. Tag the **live AI** exchange; every other line is authored (Stage mode), and the end card says so.
3. **⏩ tag** wherever waits or long actions are cut. Quote the real latency (text p50 2.4 s, first audio 5.1 s) in the Devpost text, not in a fake real-time shot.
4. Don't say "it reads/scans your room"; say "you place the case, and the kettle, lamp and desk become evidence".
5. Show only features that exist. No twist/luminol, bullet time, voice objection or multiplayer, except as "next" in the text.
6. Disclose the AI voices (OpenAI policy) in the end card and the description.

## YouTube upload checklist
- Title: "Roomscript: a murder mystery in your room (Snap Spectacles · Learn AR with SPECS)".
- Visibility **Public** (required). Not "made for kids". Duration under 3:00. Captions uploaded (.srt).
- Description: pitch, repo link, the honesty note, credits, music source if not in-Lens.
- Check for Content ID claims 1–2 h after upload (Sun), so there's time to swap the music.
