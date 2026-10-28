# Roomscript: the sensory and spatial design (ideal version)

Prepared 2026-10-25 (Asia/Karachi) for the Snap "Learn AR with SPECS" hackathon. It is written from the point of view of a spatial/AR experience designer with an immersive-theatre and escape-room background.
Status: assistant proposal. Wadood has adopted none of it.
Builds on: `Research/SPECS round 4 research - 2026-10-25/Roomscript research.md`, especially §4 (redesign) and §6 (demo arc).
Search tools: built-in WebSearch and WebFetch, and the GitHub CLI. Exa, Tavily and Consensus were not used.

The hero case below (Harlow; suspects Vale, Imran, Okafor and Pike; truth = Vale, Study, cable) is **illustrative**. It shows the staging. The engine and generator decide real cases.

---

## 0. Design thesis: ten rules for staging a murder in someone's bedroom

Victorian theatre solved additive display 160 years ago. **Pepper's ghost** reflected a brightly lit actor onto angled glass in front of a dark stage. The ghost could only ever be *added light*: translucent, luminous, best against darkness. Spectacles is a Pepper's ghost you wear. Every rule below follows from that fact, plus a 51° window, open-ear speakers and a player who looks wherever they like.

1. **The room is the star.** Each layer of content covering the room makes it feel less like *their* room. Decorate sparingly: tape, chalk, tents, a few figures. Never reskin the walls.
2. **Light is the only paint, so brightness is the spotlight.** At any moment, the brightest thing in view is the thing that matters. Allow one hero brightness at a time.
3. **Imply darkness with line density, never with dark fill.** Engravers drew shadow with closely packed lines. Noir in light means hatching, not black.
4. **Bank light early so you can spend it later.** You can't dim the real room. Instead, add a little warm light from the first minute: lamp halos, rim lights, drifting motes. The blackout twist then *removes* it. Taking light away is the only "darkness" an additive display can make.
5. **Sound is the usher; silence is the blackout.** With a 51° field of view, every event outside the frame needs a sound that turns the head 300–500 ms before the visual lands. A *cut* to silence is a cue. A fade is only a mood.
6. **Beats wait for your eyes.** Choreography holds until the player's head is aimed at the next beat (about a ±12° cone for 300 ms). After 4 s it plays a stronger second cue. Immersive-theatre performers hold for the audience in the same way.
7. **Objects don't speak; they remember.** A talking kettle is a cartoon. A kettle that *replays* a sound, plus a Polaroid that develops above it, is forensic.
8. **The tell lives on the prop.** Micro-expressions vanish on an additive display, but an emissive prop doesn't: a brooch flare, a lighter flame, spectacle lenses glaring white, white gloves.
9. **Red string is earned.** Coral string appears only for proven links. A player's own hypotheses are dotted ivory "pencil".
10. **The past is made of dust; the present is made of light.** Suspects in the room now are solid, engraved light figures at 1:1 scale. The past (testimony, ribbon ghosts, the reenactment) is drawn as 75%-scale point clouds of drifting specks. The player always knows which tense they are looking at.

A diegetic frame holds the medium's flaws together. **The case box is a forensic projection kit, and the suspects are projections "on the record".** That explains why they glow and why they are slightly translucent. It also explains why the projection *glitches* when the record doesn't match the truth, which gives the film-flicker tell a reason to exist.

---

## 1. The opening: the lid comes off

### 1.1 Pre-show (before the clock starts, about 40–60 s)

Immersive theatre always has a threshold: Punchdrunk's lift speech, an escape room's briefing. Use one here to do the dull work (casting the room) and to fix the single biggest quality lever for additive AR: **a dimmer real room.**

1. **"Turn the lights down, detective. Harlow liked it dim."** A narrator line asks the player to lower the main light and keep one lamp on. A darker room makes every hologram look more solid. The lamp left on becomes *the* lamp in the case.
2. **Casting as set dressing.**
   - *On device (ideal):* "Look slowly around the room." Depth Cache, Gemini vision and cached depth map what Gemini sees into world positions. As the player looks around, forensic-yellow corner brackets snap onto real objects with a hard click. Each gets a typed label: `CORD — charger cable`, `BLUNT — desk lamp`, `VESSEL — mug`.
   - Zones are proposed from furniture: desk → **THE STUDY**, bed → **THE LOUNGE**, doorway → **THE HALL**, window → **THE CONSERVATORY**, shelf with kettle → **THE KITCHEN**. A brass plaque appears on each, and a thin brass border traces the zone's floor footprint like a room edge on a Clue board.
   - *Manual fallback (and the preview):* pinch a spot, then pick a name from a brass dial. Pinch an object, then pick a type.
3. **The board reveal.** Casting ends with one slow brass shimmer that runs round every zone border in sequence. Without anyone saying so, the player sees their room *as a Clue board*.
4. **Hidden setup.** The Director (§9) chooses:
   - the **chalk mark**: the largest free floor area near the room centre;
   - the **box surface**: the largest clear horizontal surface within 1.5 m of the player;
   - the **clock wall**: a wall point about 1.8 m high, visible from the centre;
   - the **door** for the tape;
   - each suspect's **mark** (§2.3).

   The writing pass runs in parallel. It writes the lines, the dossier copy, and narration that mentions the player's real objects; it also starts the Snap3D exhibit and the Lyria bed. The opening's 20 seconds of theatre cover part of that latency.
5. **The room settles.** Sparse warm motes begin drifting at head height, and a faint electrical hum fades in at the very edge of hearing. *This is banked light and banked sound.* Players won't notice either until they disappear (§4.5).

### 1.2 The first 20 seconds (beat sheet)

Every beat is gated on head aim. The times assume the player follows the cues; the trailer camera always does.

| t (s) | Visual | Sound | Why it works |
|---|---|---|---|
| 0.0 | The drifting motes **freeze** in mid-air. | The hum keeps going; the rain bed (§5) at the window drops out. **Near-silence.** | The world holds its breath. Stillness is the first cue. |
| 0.6 | Nothing. | **Three knocks on the player's real door**, spatialised at the door's position, with a wooden mid-range body. | A sound from a real place in *their* room. The head turns before anything has appeared. |
| 2.0 | **Crime-scene tape zips across the door frame** in two diagonals, flutters, and settles. Hazard chevrons; stencilled `CRIME SCENE — DO NOT CROSS`. | Two fast vinyl "zzzip-snap"s, left then right, then a flutter. Narrator, close and dry: *"Nobody leaves."* | The door becomes the boundary, and the stage entrance for the rest of the night. |
| 4.0 | Behind the player, **the case box lands** on the chosen table: a brass-cornered evidence crate stencilled `CASE 1041 — HARLOW`. Bright motes puff off the real table top, and a ripple ring runs across the surface. | A heavy **thud** with a 200–400 Hz body and a click transient, so it reads on open-ear speakers. The motes tick as they fall. | Weight. A premium box has heft, and sound sells weight better than visuals. |
| 6.0 | A forensic-yellow evidence seal wraps the lid. Its pull-tab breathes. **The player pinches and pulls it.** | A long, satisfying **tape rip**, panned with the hand. | The escape-room rule: the player opens the box. Taking part creates ownership. |
| 8.0 | **The lid lifts** on a slow hinge. Warm light floods *up* out of the box; this is the brightest the scene ever gets, like the glowing briefcase in *Pulp Fiction*. Dossier cards rise into a fan: the victim card first, then four suspect cards face-down. | A pneumatic hiss, then a single sustained low string note as the light rises. | Light coming from inside a box is the most premium thing an additive display can draw. |
| 10.0 | The victim card (`EDMUND HARLOW · found 10:41`) drops edge-first to the floor. Where it lands, **chalk races outward, drawing the outline** from near the player's feet to the room centre. | **Chalk scratching at floor level**, spatialised low and moving away from the player. | A sound at your feet makes you look down, and the line leads your eye to the body. |
| 13.0 | Above the outline's chest, **the envelope rises** to about 1.5 m: brass-framed, with three empty slots, WHO / WHERE / WITH WHAT. | A rising, glassy shimmer. | The iconic composition: **the answer floats above the body.** This is the poster image. |
| 14.5 | **The riffle.** All the cards whirl in a vortex round the envelope: suspect portraits; zone cards that read `THE STUDY (your desk)`; object cards drawn as line silhouettes of the player's real things. Three are pulled in face-down. | A real Clue-deck riffle, then three soft *thup*s as cards slot in. | The private hand of Clue, dealt from *your* room. |
| 16.5 | The wax seal drops and **stamps**. A ring of light pulses outward across the room once. | **CHUNK.** Then a hard cut to **total silence**, the hum included, for 1.2 s. | The lid comes off and the case seals in one beat. |
| 17.7 | On the chosen wall, a faint outline appears: **the clean patch where a clock used to hang.** Inside it, ghost hands point to 9:00. | **Tick. Tick. Tick.** From the empty spot. The hum returns. | The missing clock ticking from its absence. The night clock is now running. |
| 18.5 | Nothing new. | Narrator, intimate: *"Edmund Harlow died at 10:41. Four guests. One of them did it. At midnight, they walk."* | The contract in sixteen words. |

### 1.3 The next 40 seconds: the guests arrive

The four suspect cards fly from the fan, one at a time, each to that suspect's **mark** (§2.3). Each arrival has its own staging:

1. **The first suspect comes through the door, under the tape.** Vale ducks beneath the tape, a slow, elegant dip with a hand raised to the tape, and the tape flutters where she "touched" it. She crosses to her mark by the kettle on a gliding path, with a soft contact ring of light under her feet instead of a shadow. Her cello motif enters from the doorway and travels with her. *A visitor ducking under tape at your real door is the single most theatrical use of the room.*
2. **The other three "develop" at their marks** like Polaroids, from faint outline to full light in 1.5 s. Their dossier cards hang as empty frames that fold into **12 cm pawns**, which fly back to the box lid. Each arrival brings that suspect's motif sting from their position, so the player turns towards each one in turn.
3. **Each guest gets one introductory line**, written when the case loads. The line notices the player's real room, for example: *"Someone's left a charger cable on Harlow's desk. How careless."* That is the "it knows my room" moment, delivered as character rather than as UI.
4. **The tableau is complete.** Four figures stand or sit where they *claim* they were at 10:41 (§2.3). The player doesn't know that yet. The first interrogation teaches it.

### 1.4 Failure handling in the opening

- **The player never looks at the door:** after 4 s the knocks repeat, louder, and the tape plays regardless.
- **No free table surface:** the box lands on the floor and lifts to waist height on a beam of motes (it "rises from the floor"), which plays just as well.
- **Generation isn't finished when the seal stamps:** the narrator line plays from a template. The introductory lines can arrive late, because guests arrive at staggered times; that staggering *is* the latency buffer.
- **Snap3D exhibit not ready:** it doesn't appear in the opening at all. It is delivered later by "the lab" (§3.8).

---

## 2. Staging the suspects

### 2.1 How they look: lit engravings, not holograms

**Rejected:**
- *Photoreal 3D.* Dark clothes vanish, skin goes ghostly and uncanny, and the asset cost is huge.
- *Blue sci-fi wireframe.* It's a cliché, and it collides with cyan, which means "alibi".
- *Black silhouettes.* They are impossible on this display.

**Recommended: "living engravings".** Each figure is built in four layers:

| Layer | Treatment | Luminance |
|---|---|---|
| **Face and hands** | Solid, high-key, softly shaded in warm ivory, with baked light on an unlit material (per Snap's guidance). Eyes are large and bright, with a defined iris rim so gaze direction reads at 2 m. Brows are strong. | 80–100%: the brightest part of the figure |
| **Clothing** | Banknote-style **hatching** in ivory or amber lines. A dark suit is drawn as *dense* hatching, a pale dress as sparse hatching. Folds are line direction. | 35–60% |
| **Contour** | A continuous bright rim line, 0.15° wide. **This line carries stress** (§2.6). | 70% |
| **Below the waist** | The hatching thins into drifting specks by the knees. | Fades to 0 |

The fade below the waist does three jobs:
- the bottom of the 51° frame never cuts a hard edge across a body;
- there are no feet to ground convincingly without shadows;
- furniture can stand in for the lower body (§2.3).

**Signature prop.** Each suspect carries one prop at 100% brightness: brooch, lighter, spectacles or gloves. It identifies them across the room, and it **is their tell** (§2.4).

**Solo-build path at the same fidelity.** Use **Ace Attorney sprite grammar**: 2.5D "paper-theatre" puppets.
- Each is made of layered engraved cut-outs (head, eyes, mouth, torso, hands, prop) in 4–6 poses: neutral, guarded, smug, pressed, broken, lawyered-up.
- They blink, the mouth flaps to the TTS amplitude, and the eyes are a separate layer that follows the player's head.
- They billboard on the Y axis, so they always face the detective; in an interrogation that reads as character, not as a technical limit.
- Ace Attorney proved that a few big poses plus sound stingers carry enormous character. That is exactly the right fidelity for additive AR.
- Portraits can be generated with Imagen in a fixed engraving style, so new suspects for generated cases cost no art time.
- **Ideal-budget path:** stylised 3D figures with an engraving or hatch shader and a simple facial rig.

### 2.2 Scale and distance

| Use | Scale | Distance | Reason |
|---|---|---|---|
| Suspect in the room / interrogation | **1:1** | 0.9–2.0 m, set by personality (§2.5) | Eye contact only means something at life size. Stereo depth cues make a 75% adult sitting 1.3 m away read as a child, or as wrong. |
| Witness projections: testimony replays, ribbon ghosts, reenactment | **75%** point clouds | 1–4 m | Scale plus particles say *"this is memory, not presence"*. The existing 75% piece stays, reserved for the past tense. |
| Pawns on the box lid | 12 cm | At the box | The Clue tokens you carry to stage suggestions. |
| Suggestion ghost (a hypothesis) | 1:1, dotted ivory outline | In the named zone | A hypothesis is drawn in pencil. |

**Framing.** At 1.1 m the visible area is only about 53 × 77 cm (portrait, roughly 3:4; Snap's sizing guide). A seated suspect at 1.3–1.6 m therefore frames as a **film medium close-up**: head, shoulders, hands and prop. Design every tell to read inside that frame.

### 2.3 Where they wait: the tableau

**Each suspect waits at a mark in the zone where they *claim* to have been at 10:41.** The staging is their testimony.
- When an objection breaks a lie, **they stand and walk to where they really were**, and the room rearranges itself as the truth comes out.
- By the end, the room shows the true positions at 10:41. The final reenactment confirms it.

**Mark-selection rules for the Director**, using World Query and world mesh:

| Rule | Detail |
|---|---|
| Mark type comes from personality | **Seated** needs a horizontal surface 40–55 cm high (chair, bed edge, sofa, stool). **Leaning** needs a vertical surface beside a 70–110 cm edge (desk edge, windowsill, door frame). **Standing** needs 60 × 60 cm of free floor. |
| Use furniture as masking | Prefer marks *behind* real furniture (across the desk, behind the bed end). The figure is only drawn above the furniture line, so the real object seems to hide the legs. Theatre uses masking flats in the same way. |
| Dark backgrounds only | **Never stage a figure against a bright window or a lit wall.** Additive light over a bright background disappears. Prefer bookshelves, open doorways into dark halls, and dark furniture. On device, sample the camera's brightness behind each candidate mark and reject bright ones. The window is the rain's stage, not a suspect's. |
| Spacing | Marks at least 1.2 m apart, so two suspects never share the frame unless the scene wants it. At least 0.6 m from walls, because without occlusion a figure clipping into a real wall looks broken. |
| Leave the walkway | Keep the room centre and the chalk outline clear. People instinctively walk round a chalk outline, which is a free social no-go zone (useful in multiplayer). |
| Adapt to the player's posture | Seated face height is about 1.15 m and standing about 1.55 m. If the player sits (head below about 1.3 m), suspects at standing marks lean on something so their eye line drops. |

In the hero room:
- **Vale** sits on a stool by the kettle (claims the Kitchen).
- **Imran** sprawls on the bed edge (claims the Lounge: "I was asleep").
- **Dr Okafor** stands by the wall beside the window, coat on (claims the Conservatory: "getting air").
- **Pike** stands just inside the taped door, hands behind his back (claims the Hall: "I answered the door at 10:30").

### 2.4 Tells: whether, and what

The two jobs are split, so that reading the person *and* the room both matter.

- **The personal tell answers *whether*.**
  - It is one authored, multi-channel macro tell per suspect, fired on 100% of lies.
  - It is taught at the baseline: one true answer and one trivial lie.
  - It lives on the prop, with a matching sound in a layer the engine controls. **Never rely on TTS prosody for a tell**, because it isn't deterministic.
- **The gaze line answers *what*.**
  - At the moment the tell peaks, the suspect's eyes flick to **the real object the lie is about**.
  - A bright line snaps from their eyes to that object.
  - **You see it only if you were watching their face**, meaning head aim within about 12° of the face when the tell fired. The game calls it *"You catch her glance."*
  - If you were looking at the notepad, you still *hear* the audio half of the tell, and the statement is filed with a hollow "heard, not seen" marker. Press to make them repeat the claim, and watch this time.
  - That makes *looking at faces* the gameplay without adding a reflex verb, and it gives spatial audio a real job.

| Suspect | Prop | Visual tell (lie) | Audio tell (lie) | Why it reads on additive AR |
|---|---|---|---|---|
| **Celeste Vale**, composed and precise | Brooch | Her hand rises to the brooch, which flares as a four-point star for 150 ms | A tiny metallic *tink*, tuned to her cello motif's key, plus a breath before speaking | A star flare is the brightest pixel in the scene |
| **Imran Qadir**, charming and restless | Lighter | He flicks the lighter non-stop as an idle; on a lie it **snaps shut** and his hands go still | His walking-bass motif **stops dead** | A restless person going still is the most legible tell there is, and it's audible from across the room |
| **Dr Mara Okafor**, clinical and guarded | Spectacles | She pushes her glasses up and **both lenses white out** for half a second (anime glare), hiding her eyes | A thin high sine "glint" tone, and her line begins slightly *too early* | Two white ovals read at 3 m. Hidden eyes are a noir classic |
| **Mr Dorian Pike**, loyal and formal | White gloves | He **tugs his gloves**, a bright white flash of hands | A soft leather creak, and he says "sir" twice | White is the boldest colour on this display. White gloves might have been made for it |

**Generator rule.** Tells come from a library: glint, stillness, glare, gesture, ember (cigarette), ring-twist, watch-check, hat-brim. **Each suspect in a case must use a different channel**, so tells never blur together.

**Difficulty, later:** Rookie labels the tell; Detective is as described; Noir removes the gaze line and you rely on personal tells alone.

### 2.5 Personality in staging and sound

| | Vale | Imran | Okafor | Pike |
|---|---|---|---|---|
| **Mark** | Seated, still, legs crossed (not drawn) | Sprawled, then leaning, then pacing one step | Standing, coat on, near an exit | Standing, hands behind back |
| **Proxemics** | Makes *you* come to *her* (1.3 m) | Steps in too close when talking (0.9 m) | Keeps 2.0 m and won't come nearer | A respectful 1.5 m |
| **Idle** | Barely moves. Slow blinks | Lighter flicks, weight shifts | Checks her watch every 20 s | Straightens a cuff; perfectly still otherwise |
| **When you look away** | Waits in silence | *"Am I boring you, detective?"* | Checks her watch, conspicuously | Waits, then *"Sir?"* |
| **Under pressure** | Gets quieter and colder | Gets louder and closer | Gets clipped and threatens lawyers (lawyers up fastest) | Gets *more* formal |
| **Motif** | Solo cello, legato, low register | Upright bass walking line plus brushed snare | Muted piano, staccato, metronomic at 60 bpm and **locked to the clock tick** | Celesta waltz in 3/4, like a music box |
| **Voice treatment** | Low and measured, a touch of room | Close and warm, fast | Dry and precise | Soft, slightly distant |

The TTS voice comes from an archetype voice list. The Remote Service Gateway offers OpenAI TTS with "multiple voice options". Whether style instructions are exposed is unverified, so personality must not depend on them.

### 2.6 The composure bezel and stress

- **Placement fix.** The research put the composure ring "at the suspect's base", which is the floor and outside the frame when you look at a face. **Move it behind the head and shoulders**: a thin brass arc from about 8 o'clock to 4 o'clock, like a stiff collar or clock bezel, in **five segments**. It stays in frame whenever the face does.
- **Losing a segment.** A Press costs one segment. It snaps off with a mechanical clock-click and falls away as sparks.
- **Stress lives in the contour line.**
  - Composed: one smooth line.
  - Pressed: the line jitters slightly.
  - One segment left: the line **doubles** (two offset contours), the bezel turns jagged, and their motif speeds up and picks up a dissonant note.
  - Broken: the figure fractures, then reassembles lit by a coral rim. Truth replaces the lie.
- **Lawyering up**, after three presses without new evidence:
  1. The suspect stands and delivers their line (*"I'll be speaking to my solicitor"*).
  2. They walk to your real door and duck out under the tape.
  3. Their motif leaves through the doorway and fades.
  4. Their pawn on the box lid dims, with a small hourglass for 30 night-minutes.
  5. When the time is up: **a knock at the door**. They duck back in with composure reset to three segments: *"I've spoken to my solicitor. Ask your questions."*

### 2.7 Making the interrogation intimate

When you start an interview, by aiming at a suspect and pinching (or with a voice question on device):

- **Acoustic close-up.** Their voice stays spatialised at their mouth but switches to a dry, present, close-mic treatment. Room ambience ducks 6 dB, other motifs mute, and the rain falls to a whisper. **The room goes quiet and the voice moves into your ear.**
- **Light close-up.** Every other piece of content fades to 40%. The suspect's face gets a soft "key light" lift. Everything else becomes a backdrop.
- **Responsive eye contact.** Their eyes follow your head. When they look *away* from you, that's an event.
- **Body pressure (flavour, not a rule).** If you physically lean in more than 20 cm, they lean back. Imran leans *in* to match you.
- **Your lines are captions, not voices.** The player *is* the detective; voicing them in first person feels wrong. A chosen chip is typed out in forensic yellow as a caption that leaves your chest and drifts to the suspect, with a soft typewriter clack. On device you just speak.
- **The hidden verb: hold the silence.** Real interrogators use silence. After a lie, if you keep looking at the suspect and say nothing for about 6 s:
  - **anxious suspects** (Imran, Pike) fill it. They volunteer one pressed detail at no clock cost, once per suspect;
  - **composed suspects** (Vale, Okafor) hold your gaze. The audio drops to the tick alone, and nothing happens. *That* is information too.

  It costs real seconds, not night-minutes. L.A. Noire never had this; it's cheap (S); and it makes silence a gameplay tool.

---

## 3. Evidence, and the room as the board

### 3.1 Forensic tents

- **Form.** Numbered A-frame tents, 8 cm tall with 5 cm numerals, in forensic yellow with hazard chevrons along the base. Each sits on the real surface next to its object (World Query hit). At 3 m the numeral subtends about 1°, which is readable.
- **States:**
  - *Unexamined:* breathes slowly at 60–100% brightness.
  - *Examined:* solid at 80%.
  - *Has refuted something:* gains a coral stripe.
  - *Cleared:* flips to show a chalk **X** and drops to 30%.
  - *The object a lie glanced at:* a small eye glyph pulses on the tent for 10 s.
- **Pop-in.** New tents arrive with a spring and a bright *pop*. Their number ticks up like a deli counter.

### 3.2 Objects remember

1. **Pinch an object**, or aim at it and pinch on device, or click it in the preview.
2. Its tent glows, and the **object's memory plays as sound at the object**:
   - the kettle: *nothing*, a conspicuous silence where a whistle should be, with the caption `no whistle all night`;
   - the lamp: a switch click and one footstep on a wooden floor.
3. A **Polaroid develops** in mid-air above it over 2 s, from faint to full: a line silhouette at a time stamp (`10:41 — a figure at the desk, reaching left`).
4. *Optional delight:* shake your hand to develop it faster.
5. Pinch-drag the Polaroid into your evidence fan.

Objects always tell the truth. Their memories are the Clue refutation cards and the ammunition for objections.

### 3.3 Statements hang in the air

- Each claim a suspect makes becomes a **cyan slip**: a thin dashed outline with typed text, hanging beside their head for about 20 s.
- At most three are visible at once; older slips drift into the fan.
- **You can pull the words out of the air** by pinching the slip next to the suspect. That is more AR-native than L.A. Noire's menu notebook, and it is the first half of every objection.
- Lies carry a small tell icon (star, flame, lens or glove) once caught.

### 3.4 The evidence fan

- **Palm up opens a fan of cards** over the palm, like a hand of cards:
  - Polaroids (object memories): coral frames;
  - statement slips: cyan dashes;
  - documents: ivory;
  - voicemail cassettes: ivory, with a waveform.
- Pinch-drag a card out to use it. Fan the hand to scroll.
- **Preview fallback:** palm poses don't show convincingly in Lens Studio Preview. The same fan opens from a small brass "case wallet" that lazily follows at chest-left and is clicked open. Design every interaction so it also works by **pinch-ray** (targeting with a ray from the hand), which the preview simulates with the mouse.

### 3.5 No HUD: the box lid and the empty clock

- **The box lid is the board.** The open case box stays on its table as home base. Its lid carries:
  - the four pawns;
  - the compact Clue grid;
  - the credibility pips;
  - Hunches, as brass coins.

  **Glance behaviour:** aim at the box for 0.5 s from anywhere in the room, and the lid's grid lifts and scales towards you until it is readable (cap height about 0.8° at your distance). Look away and it settles back.
- **The night clock lives in the clock's absence.** The ghost hands inside the empty clock outline show the current night time.
  - Spending 15 minutes makes them sweep forward with a fast ratchet of ticks.
  - At 11:45 the outline flashes, and a second, faster tick joins the first.
  - At midnight: twelve chimes from the empty spot, and the guests walk out through the door.

### 3.6 The room crosses itself off

Clue's notepad grid lives on the lid, but **the big version is the room itself**. When a card is shown:
- an eliminated zone has its brass floor border dim from 70% to 15%, and a chalk strike runs through its plaque;
- an eliminated object has its tent flip to the chalk X and its brackets fade;
- an eliminated suspect gets a chalk X on their pawn, and their figure's rim cools to pale ivory. They can still be interviewed, because innocents still hold secrets.

By the endgame **only one zone border, one object and one suspect still glow.** The room has narrowed to the answer. That end state is a natural trailer shot (§7, shot 16).

### 3.7 Red string

- **Coral string means proven links only.** It appears when an objection lands (suspect ↔ evidence object) or when a refutation card links two elements.
- **Ivory dotted string** is the player's own hypothesis. Pinch two things to link them; there's no cost and no validation.
- **Physicality.** String hangs as a slightly sagging catenary from light-dot pins. When your head passes within 15 cm, it sways and **twangs**, a plucked note with pitch set by length. *Walk through your theory and it plays.*
- **Discipline.** Allow at most six coral strings; older ones fade to 30%. Spaghetti is the enemy.

### 3.8 How generated evidence arrives

| Type | Arrival | Look | Sound |
|---|---|---|---|
| **Letters** (LLM-written, critique-checked) | **Slides under your real door** and skims across the floor to your feet. Pinch it and it unfolds at 0.5–0.6 m, reading distance | **Never render paper as white.** Render *ink as light*: a paper outline, faint ruled lines and fibre specks, with handwriting in heavy luminous ivory. Words the engine later verifies recolour coral; disproven words recolour cyan | A paper slide, then a crisp unfold |
| **Voicemails** | Play *from an object*: an answering machine prop on the desk or, on device, the player's real phone if Depth Cache finds one | A ring-shaped waveform pulsing round the source, with word-by-word captions | Telephone band-pass (300–3400 Hz), tape hiss, the machine beep |
| **Photographs** | Develop above an object or drop out of a letter | Polaroid frame, line-art content | Shutter, then a soft developing hiss |
| **3D exhibits** (Snap3D, 8–90 s) | Requested when the case loads. If ready, they sit in the box. If late, **"the lab" knocks** and a bagged exhibit is placed on the box lid | **Always inside an evidence bag**: a transparent outline, a yellow label and a scan-line sheen. *The bag is a quality filter*: it excuses artefacts and unifies style. Render with an engraving or scan shader, never raw | A knock, a rustle, the label stamped |
| **Portraits** (Imagen) | Dossier cards | Fixed engraving style; fall back to a silhouette library | — |

**The rule for generation latency:** never wait on screen. If an asset is late, its delay is woven into the story ("the lab is still processing"), and the scene continues.

---

## 4. The big set-pieces, beat by beat

Times are from the trigger (t = 0). All of them obey the gate rule: if the beat's target is out of view, sound leads and the visual holds until it is seen, or for at most 2 s.

### 4.1 The tell and the gaze line (about 2.5 s)

Vale is asked by chip: *"Where were you at 10:41?"*

| t | Visual | Sound |
|---|---|---|
| 0.0 | Your caption types out and drifts to her. | Typewriter clacks. |
| 0.3 | She draws a breath; a slight shoulder rise. | **Breath intake**, part of the authored tell layer. |
| 0.6 | Her hand rises to her brooch, which **flares**: a four-point star, 150 ms. | *Tink*, tuned to her motif. |
| 0.75 | **The gaze line.** Her eyes flick right. A white-core line with a cyan glow launches from between her eyes and *travels* to the real desk lamp at about 25 m/s (2 m in 80 ms), holds for 250 ms, then **retracts towards the object, not back to her**. The last thing you see is light *arriving at the lamp*, which leaves a glint ring and an eye glyph on its tent. | A high, thin **"shing"** (a fingertip on a glass rim, 200 ms) **spatialised at the lamp**, so even if the lamp is out of frame you hear *where* she looked. |
| 1.1 | Back to you, composed. *"I was in the kitchen. Making tea."* Subtitle at her depth, below her chin; **"kitchen" in cyan**. | Her voice, close-mic. Her cello holds one note. |
| 2.5 | The statement slip appears beside her with a star icon. The lamp's tent keeps its eye glyph for 10 s. | — |

**Line spec:** constant angular width of 0.15° (about 3 mm at 1.2 m, 8 mm at 3 m). The white core is 1×; the cyan glow is 2.5× at 35%. If the target is off-frame, the visible part of the line points at the display edge, and the sound does the rest. **No HUD arrows.**

### 4.2 Spatial Objection (about 4.5 s for a correct one, 1.2 s for a wrong one)

You pull Vale's "kitchen" slip from the air and drag it onto the lamp's Polaroid, the lamp itself, or the kettle's memory.

| t | Visual | Sound |
|---|---|---|
| −1.0 (drag) | The slip trails a thin cyan thread back to her mouth (ownership). Valid drop targets pulse. Hovering over one makes the slip magnetise slightly towards it. | A **tension riser**: a soft string tremolo climbing in pitch while you hover. |
| 0.0 (release) | — | **Hard cut. Total silence**, 250 ms. The riser stops dead. |
| 0.25 | **The world freezes.** The rain on the window hangs as bright still streaks, the motes stop, and Vale freezes mid-blink. | Silence. |
| 0.4 | **OBJECTION!** A heavy condensed word, forensic yellow with a white core, about 40 cm wide, **slams** into space between you and her at 1.1 m, with a 3-frame shake and fragments flying off its edges. *On device, you shout it* (ASR keyword); in the preview, a recorded shout plays. | The shout, then a **brass stab**. |
| 0.9 | **The tear.** From the slip, a single braided line runs across the floor towards her 10:41 position, then **splits**: a **cyan dashed path** veers to the Kitchen (the claim) and a **solid coral path** runs to the desk and lamp (the truth). Sparks fly at the fork. | A **paper rip**, 600 ms, travelling with the fork. |
| 1.6 | The slip **cracks and shatters** into about 30 bright shards that fall and fade. The cyan path crumbles into falling dust. The coral path stays and becomes a **red string** from Vale to the lamp. | Glass crack, then a tinkling fall. |
| 2.0 | The world un-freezes. Three bezel segments snap off one by one. Her figure **glitches** (two-frame film skip, chromatic split), then her rim turns coral. | **Sound slams back in**: the rain resumes mid-drop, three clock-clicks, a low cello *sforzando*. |
| 2.6 | **The break.** Her pose shifts from upright to slumped. **Two seconds of nothing**: the tick only. | The tick. |
| 4.5 | *"Fine. I was at the desk. But he was already on the floor."* The coral true statement prints into the notepad. A brass **Hunch** coin flips into your palm (or wallet). | Voice softer, with more air. A coin chime. |
| +3 s | **The tableau updates.** She rises and glides from the kettle to the desk, her real 10:41 position. A **new tent pops** beside a newly relevant object, opening a new lead. | Her cello moves with her across the room. |

**A wrong objection, 1.2 s, with no freeze:** the slip *bounces* off the target with an elastic snap-back. One credibility pip on the lid cracks with a glass tick. The suspect gives a smug pose and their motif plays a mocking little turn. The topic stays open. Keep it fast: punish with a pip, not with time.

### 4.3 Suggestion and the refutation sweep (about 8–10 s)

You suggest *"Imran, in the Lounge, with the cable."*

| t | Visual | Sound |
|---|---|---|
| 0.0 | Pinch Imran's 12 cm pawn off the box lid and carry it. | A small wooden pick-up click. |
| 1.0 | Drop it in the Lounge zone. **The pawn grows into a 1:1 suggestion ghost**, a dotted ivory outline of Imran standing by the bed. Touch the cable's tent: a dotted ghost of the cable flies into the ghost's hand. | A soft pencil-sketch scribble. Narrator: *"Imran. The Lounge. The cable."* |
| 2.5 | The ghost hands in the empty clock outline **ratchet 15 minutes**. | Fifteen fast ticks, then a whirr. |
| 3.0 | **The sweep.** A thin horizontal blade of light at waist height leaves *you* and travels **clockwise round the real room**, about 0.6 s per witness. Each witness it touches responds: a tent dims with a dull no, or a suspect shakes their head (*"Can't help you"*). | One **tick** per witness on a slowly ascending scale, like a roulette ball's clicks, each spatialised at that witness. Steady pace (never slowing near the refuter, which would give it away). |
| ~6.0 | **The refuter.** The blade stops at the **mug**. A glow rim traces the real mug's bounding box, its tent flips up, and a **face-down card** rises. | A bright two-note **chime** at the mug. All ticks stop. |
| 6.8 | Pinch to flip it, privately: `10:30 — Imran in the Hall (the mug, on the hall table)`. | Card flip. |
| 7.5 | **The room crosses itself off** (§3.6): Imran's pawn gets a chalk X and his rim cools. The suggestion ghost disperses into ivory dust. | A chalk strike. |

**Nobody refutes?** The blade completes the full circle back to you, and nothing chimes. One beat of silence. Then the **envelope breathes in**: its three slots glow, and the three named cards slide a centimetre out (unreadable) and back. *A huge lead.* Low brass swell.

**A suspect refutes with a lie (the Liar! beat):**
1. Pike steps forward to refute: *"I was at the door all evening."*
2. His **gloves flash white**, with a leather creak.
3. A forensic-yellow **LIAR!** stamp hovers in front of him for 3 s.
4. Pinch it (or shout "Liar!" on device). It is an objection that uses the refutation as the statement, with the full §4.2 freeze if you also drop the right evidence.

### 4.4 The time ribbon and the reenactment

**The ribbon unspools from the missing clock.**
- Pinch the empty clock outline and **a ribbon of light unspools from it**, wrapping the room at waist height. Tick marks run from 9:00 to 12:00, with brass numerals every hour.
- **During play it is the archive.** Only facts you've established show as **solid 75% dust ghosts** at their positions. Unknown slots are *gaps* in the ribbon. **The ribbon fills in as you learn**, so progress becomes visible.
- Pinch-slide along it to scrub; the ghosts drift between their 15-minute positions.
- It re-spools into the clock when dismissed, so it is never permanent clutter.

**In the finale the full truth plays:**

| t | Visual | Sound |
|---|---|---|
| 0 | The ribbon unspools on its own and wraps the room. | A long, rising unspooling whirr. |
| 2 | Coral dust ghosts of all four suspects, plus Harlow, walk their true night in 15-minute steps, leaving faint footpath trails. The culprit's trail is coral; trails that contradict claims flash cyan where the claim was. | The confession monologue (§4.6) narrates. Each motif plays from its ghost, softly. |
| ~14 | **Bullet time at 10:41.** Every ghost decelerates to a stop. Vale is frozen mid-stride. **A cup** knocked from the desk edge hangs 30 cm above the floor, its liquid a crown of **suspended luminous beads**. Rain on the window freezes into streaks. | The rain pitches down into a low rumble, then **silence**. The clock tick stretches into one long, low bell. |
| 14 → | **Walk around the frozen moment.** The freeze holds until you pinch, or for 12 s. The ghosts are point clouds, so they look right from every angle. *This is the moment you film on device.* | Near-silence; a faint sustained harmonic. |
| +1 | Resume: the cup **shatters**, the culprit completes the stride, Harlow's ghost falls. | Shatter (sound plus bright sparks), then the tick returns at normal speed. |
| +4 | The ribbon **re-spools into the empty outline**, and **the clock reappears on the wall**, ticking and showing the *real current time*. | A clock chime, the first warm major chord of the night. |

### 4.5 The twist: the blackout and the luminol

**Trigger (Director).** At least one lie broken; solver progress between 45% and 70%; no line in progress (it waits for a natural pause). Foreshadow two night-minutes earlier: the rain swells, distant thunder comes from the window, and the lamp halo flickers once.

| t | Visual | Sound |
|---|---|---|
| 0.0 | **Lightning:** a bright vertical bloom anchored at the real window, plus a full-frame white flash at 25% for 2 frames. | A crackle at the window. |
| 0.3 | **The hum cuts**, a hard cut mid-cycle. At the same moment, **all the banked light stutters out**: on–off–on–off (80 ms each), then off. That includes lamp halos, motes, zone borders, rim lights and the box glow. Because the player's eyes adjusted to the extra light, the room now *looks* darker than a second ago. | The absence of the hum *is* the darkness. **Players notice a sound they never knew was there only when it stops.** |
| 1.2 | Thunder rolls from the window. | A delayed thunder roll, weighted to the mids so it reads on open-ear speakers. |
| 1.5 | **Only their eyes remain.** Each suspect is now just two bright points at eye height, scattered round the dark room. | Rain, and the clock tick, which sounds louder by contrast. |
| 3.0 | Pike's voice from the dark: *"The fuse box is in the hall, sir—"*. Your **palm lights up**: a UV torch, a violet core and a faint cone of specks from your hand (pinch-ray direction in the preview). | A soft electrical fizz as the torch starts. |
| 5–25 | **Sweep the room.** Wherever the cone passes, **coral luminol traces bloom** on real surfaces: **drag marks** from the Study to the chalk outline, a **handprint** on the desk edge, footprints. Each find pops a tent. | A chemical fizz and a coral shimmer per find. |
| ~30 | **Power returns.** A breaker *thunk*, then the hum swells back in, and the **lights cascade back zone by zone round the room**, like a house coming back on. | Thunk, rising hum, each zone a soft relay click. |
| 32 | **Something has changed.** Imran is now standing at the desk, startled, mid-reach: *"I— I was looking for the fuse box."* Narrator: *"The body was moved."* A new thread opens. | Imran's bass motif re-enters, rattled and out of tempo. |

**Twist library for generated cases.** Every twist reframes; none invalidates a fact the player has proven, and the solver checks that.
1. *The moved body*: luminol drag marks, as above.
2. *The stopped clock*: during the blackout the missing clock reappears in its outline **showing a different time**, so the time of death was staged and alibis need rechecking.
3. *The second note*: when the lights return, a note is tucked under the envelope's wax seal: *"You're looking at the wrong hour."*
4. *The missing token*: an object's tent is empty and its card is found in a suspect's hand ("someone took the cable"). Real objects can't move, but their roles can.
5. *Someone moved in the dark*: a suspect relocates during the blackout and must explain why.

**Safety.** No more than three flashes per second (the WCAG photosensitivity threshold). A "reduce flashes" toggle swaps lightning for a slow bloom.

### 4.6 The accusation and confession

| t | Visual | Sound |
|---|---|---|
| Approach | Within 1 m of the envelope, its three brass slots unfold. | A low organ-like drone fades in. |
| Place WHO | Pinch Vale's pawn from the lid and drop it in WHO. **Across the room, Vale turns her head to look at you.** She knows. | A heavy *clunk*. Her cello plays a single low note. |
| Place WHERE | Aim at the Study and pinch: **its plaque detaches and flies to you**, then slots into WHERE. Its floor border flares. | *Clunk.* |
| Place WITH WHAT | Aim at the cable and pinch: **its tent flies across the room** into WITH WHAT. The real cable's brackets pulse. | *Clunk.* |
| Commit | The wax seal glows: `ONE SHOT. BREAK THE SEAL?` **Hold pinch on the seal for 2 s.** A ring fills, and your **heartbeat** thumps, quickening slightly. | Heartbeat. |
| 0.0 | The seal **cracks**. | SNAP, then **everything cuts, including the clock tick.** *The only time in the game the clock stops: the clock stops for the truth.* |
| 1.5 | Card 1 slides out slowly, flips, and gets a coral ✓ stamp. | A single low piano note per card, with a heartbeat drum between cards, about 1.2 s apart. |
| 3.9 | Cards 2 and 3 follow, each ✓. | Each stamp is a heavier thud. |

**If correct:**
1. Vale's **outer contour peels away**: the cyan line sloughs off as falling specks, leaving her lit coral. *The cover story literally falls off her.*
2. She walks to the chalk outline and stands over it.
3. **The confession** (written when the case loads, 20–30 s, TTS) plays while the reenactment (§4.4) runs round the room.
4. Her motif reveals its "wrong note": the cello line resolves into a minor variation planted in her theme from the start.
5. **Curtain:**
   - the tape **un-snaps from the door** and falls (the boundary releases);
   - the suspects leave through the door one by one, *without* ducking: the night is over;
   - the case box lid closes with a deep thunk, and `CASE CLOSED` is stamped across it;
   - the Holmes rating rises from the lid: *"You: 7 questions. Holmes: 5."*
6. **Final image:** your ordinary room, the clock back on the wall, and one yellow tent beside your real charger cable for five seconds. Then it's gone. *The room remembers.*

**If wrong:**
1. Mismatched cards flip with a dull thud and a cyan crack.
2. **The real culprit smiles** and walks out through the door *straight through the tape*, which flutters. They got away, and the player feels it.
3. Then "here's what really happened": the full reenactment, narrated rather than confessed.

---

## 5. Sound design brief

### 5.1 The layers

| Layer | Content | Placement | Level (relative) |
|---|---|---|---|
| **Dialogue** | Suspect TTS, narrator | Suspects at their mouths; narrator close and dry, not spatialised (the "voice in your head") | 0 dB reference |
| **Tells** | Breath, tink, glint, creak, motif drop-outs | At the suspect or prop | −6 dB, always audible |
| **Cues** | Knocks, tape, box thud, chalk, the sweep's ticks, the gaze "shing", chimes | World-locked to their source | −3 to −10 dB |
| **Motifs** | One 4-bar loop and one 1-bar sting per suspect | At each suspect, distance-attenuated (min 0.5 m, max about 6 m) | −18 dB idle, −10 dB featured |
| **The clock** | The missing clock's tick | At the empty outline on the wall | −28 dB, constant |
| **Atmosphere** | Rain on glass (close detail) plus a diffuse rain bed; distant thunder | Rain on glass world-locked to the window; bed diffuse | −24 dB |
| **The hum** | Mains hum plus faint fridge-compressor tone | Diffuse | −34 dB, barely there (banked sound for the blackout) |
| **Score bed** | Per-case ambient bed, optionally Lyria-generated (§9) | Diffuse, low | −30 dB |

### 5.2 Spatial cue map: what turns the head

- **Door:** knocks (opening, lawyer-up returns, lab deliveries), the tape, guests arriving and leaving.
- **Window:** rain, lightning and thunder.
- **The player's feet:** the chalk scratch, letters sliding under the door towards them.
- **Each object:** its memory sound, the gaze line's "shing", refutation chimes, the sweep tick.
- **Each suspect:** their motif. When you can't see someone, you can still *hear where they are*.
- **The wall clock:** the tick, the ratchet, the midnight chimes.

### 5.3 The clock

- **Idle:** one tick per second from the empty spot, quiet, always there.
- **Spending time:** a fast ratchet of ticks (15 for 15 minutes) and a whirr.
- **Pressure:** at 11:45 a second, faster tick joins in (anxiety), and Okafor's metronomic piano audibly falls in step with it.
- **Midnight:** twelve chimes; the guests walk.
- **Bullet time:** the tick stretches into a long low bell.
- **The accusation:** the tick **stops**, the only time it ever does.
- **The epilogue:** the restored clock ticks on the wall, slightly warmer in tone.

### 5.4 Motifs as a system

- **All motifs share one key and tempo grid**, so with all four suspects audible they **layer into a single "house" chord**. Removing any one leaves a hole in the harmony, so you *hear* when someone has lawyered up.
- **Each motif carries a hidden variation.** The culprit's theme contains a "wrong note" that is revealed in the confession, and the generator assigns the planted variation to whoever is guilty. Attentive players may sense it on replays; it is never a solving clue.
- **Motifs are also tells** where the design wants: Imran's bass stopping dead. A motif drop-out reads from across the room.
- **Pressure modulates them:** low composure speeds the tempo and adds a dissonant note. Lawyering up sends the motif out through the door.

### 5.5 Silence as a tool

Five planned silences. Each is reached by **cutting** a sound, never by fading it.
1. **Before the knock**: the motes freeze and the rain drops out.
2. **The objection freeze**: 250 ms of nothing, then the shout.
3. **After a break**: two seconds with only the tick before the truth is spoken.
4. **The blackout**: the hum cuts. Darkness heard rather than seen.
5. **The seal breaks**: even the clock stops.

Plus the player-driven silence: **holding the silence** in an interrogation (§2.7).

The rule: keep the tick under every silence except the last. Then *removing the tick* is the biggest sound in the game.

### 5.6 Mixing for Spectacles

- **Open-ear speakers:** bass is weak. Every "heavy" sound needs mid-range body (200–400 Hz) and a transient. Test the thud, thunder and heartbeat on device at moderate volume.
- **Speakers leak to the room.** In multiplayer, **never voice private information.** Refutation cards are silent text plus a generic chime; the narrator never reads a private card aloud.
- **Two devices playing the same voice cause phasing.** See §8.1.
- **Distance attenuation:** use the AudioComponent's spatial distance effect (min about 0.5 m, max about 6 m), and the directivity effect for suspects (a mild cardioid, so voices are warmer when they face you).

---

## 6. Visual language for an additive display

### 6.1 Palette: "luminol, not noir"

| Role | Colour | Hex (starting point; tune on device) | Line style (never colour alone) |
|---|---|---|---|
| **Truth**: proven facts, red string, broken-lie rims | Coral | `#FF6B5A` | **Solid** |
| **Alibi / claim**: statements, cover-story paths, lie flicker glow | Cyan | `#3FE3FF` | **Dashed** |
| **Markers and UI**: tents, tape, brackets, captions, the OBJECTION word | Forensic yellow | `#FFD60A` | **Chevrons / hazard stripe** |
| **People and narration**: suspect faces, hands, subtitles | Warm ivory | `#FFF0D6` | Engraving |
| **The board layer**: envelope, plaques, zone borders, pawns, bezel | Brass | `#E8B04A` | **Ornamental / engraved only**; never placed next to yellow markers |
| **Hypotheses**: suggestion ghosts, pencil strings | Ivory at 60% | — | **Dotted** |
| **Chalk** | Blue-white | `#EEF4FF` + grain texture | Rough, broken stroke |
| **UV torch** (twist only) | Violet | `#8F7CFF` | Cone of specks |

Rules:
- **Coral and cyan are the only saturated pair.** Coral against cyan sits mostly on the blue–yellow axis that most colour-vision deficiencies preserve, but the solid/dashed line style is the real guarantee.
- **Avoid pure blue `#0000FF` for anything that must be read,** because it carries very little luminance and looks dim. Avoid pure red at small sizes for the same reason.
- **Alpha is brightness.** Snap's guidance says 50% alpha is half as bright. Use alpha only for hierarchy, never for "glass" effects.
- **Luminance budget:** apart from momentary flashes, no more than about 15% of the visible frame should be lit above 50% brightness. Hero brightness is reserved for one thing at a time.

### 6.2 Line weights (constant angular width for lines that span depth)

| Use | Angular width | ≈ at 0.5 m | ≈ at 1.5 m | ≈ at 3 m |
|---|---|---|---|---|
| Minimum anywhere | 0.12° | 1 mm | 3 mm | 6 mm |
| Contours, pencil strings | 0.15° | 1.3 mm | 4 mm | 8 mm |
| Hero lines: gaze line core, red string, ribbon edge | 0.2–0.25° | 2 mm | 5–6.5 mm | 10–13 mm |
| Floor paths (seen at grazing angles) | 0.3° | — | 8 mm | 16 mm |

Use a **screen-space (constant angular) width shader** for paths and strings that cross the room. World-space lines either vanish in the distance or bloat up close.

### 6.3 Typography in space

| Text | Face (suggested) | Cap height (angular) | At 0.5 m | At 1.5 m | At 3 m |
|---|---|---|---|---|---|
| Hero words (OBJECTION!, CASE CLOSED, LIAR!) | Heavy condensed grotesque, all caps | 3–5° | — | 8–13 cm | 16–26 cm |
| Titles, plaques (THE STUDY) | Engraved slab serif, *heavy*, wide tracking | 1.0–1.5° | — | 2.6–4 cm | 5–8 cm |
| Subtitles, captions | Bold humanist sans | 0.7–0.9° | — | 1.8–2.4 cm | — |
| Evidence labels, tents, Polaroid captions | Bold monospace ("case file") | 0.6–0.8° | 5–7 mm | 1.6–2 cm | 3–4 cm |
| Letters (handwriting) | Heavy script, read at 0.5–0.6 m only | 0.8° | 7 mm | — | — |
| **Absolute minimum** | — | **0.5°** | 4.4 mm | 1.3 cm | 2.6 cm |

Rules:
- **Text lives on things.** Labels attach to their object. **Subtitles sit at the speaker's depth**, just below the chin; putting them at a different depth forces a focus jump.
- **2D, billboarded on Y** (Snap recommends 2D shapes for text and icons). Bright text on a 10–15% tinted backplate at most. Never dark text on a light panel, and never large filled panels.
- Subtitles: at most two lines of about 38 characters. Floating labels: at most seven words.
- **No thin serifs or hairlines**, however noir they look. Thin strokes vanish.
- Typewriter reveals for case text, at about 40 characters per second, with soft clacks.

### 6.4 Motion

- **Motion leads attention** (Snap's guidance). Use one moving thing at a time in the central frame.
- **Ease out and settle:** everything lands with a slight overshoot (cards, tents, pawns), which gives weight.
- **No constant ambient motion in the periphery.** Bright motion at the edge of the frame pulls the eye. Motes drift slowly and sparsely, and stop during dialogue.
- **Big objects fade at their extremities** so the edge of the 51° window never slices a hard line through them.

### 6.5 What to avoid

1. Dark fills, shadows, black silhouettes or "dark smoke": they are invisible.
2. Large opaque bright panels: glare, a hidden room, power drain.
3. **Head-locked UI.** Use lazy-follow at most, for the wallet.
4. **Holograms against bright windows or lamps.**
5. Hard-edged objects bigger than the frame at their viewing distance.
6. Information that lives only on the floor, so the player must keep looking down. Floor content needs a sound cue and must be temporary.
7. Opacity gradients: Snap warns of artefacts.
8. Colour-only coding.
9. More than three full-frame flashes per second.
10. Particle storms everywhere: power, heat, clutter.
11. Text at a different depth from what it labels.
12. Re-skinning the room with wallpaper, virtual walls or fog volumes (see §10).

---

## 7. The three-minute video storyboard

**Honesty rules:**
- Every **device** shot carries a small `Captured on Spectacles` badge. Every **preview** shot is plainly the Lens Studio Preview (`Lens Studio Preview — simulated room`).
- **Build the simulated room to match Wadood's real room**: the same desk, bed, door, window, kettle, lamp and cable as simple meshes. Preview shots and device shots then *match-cut* on the same objects. Continuity editing makes the honest mix feel seamless.
- **Smooth the preview camera.** Script the Preview camera to move like a gentle Steadicam head. Real head shake comes from the device clips.
- **Inputs:** chips and mouse pinch-rays in the preview; voice only in device shots.

Target length: **2:58**.

| # | Time | Shot | Audio | Src |
|---|---|---|---|---|
| 1 | 0:00–0:03 | A dim simulated room at night. Motes drift, then **freeze**. | Rain cuts out, then **three knocks** at the door (behind right). | preview |
| 2 | 0:03–0:06 | Head whips to the door. **Tape zips across** in two diagonals. | Zip, snap. Narrator: *"Nobody leaves."* | preview |
| 3 | 0:06–0:10 | Thud behind; turn back. The crate lands on the desk, motes puff. Pinch-ray pulls the tab; rip. | Thud, rip. | preview |
| 4 | 0:10–0:14 | Lid lifts, light floods up, dossiers fan. The victim card drops and **chalk races across the floor**; the head tilts down to follow. | Hiss, string note, chalk scratch. | preview |
| 5 | 0:14–0:18 | The envelope rises above the outline. **The riffle vortex** (suspects, zones named after real furniture, the player's objects). Seal stamps. | Riffle, **CHUNK**, silence, **tick… tick**. | preview |
| 6 | 0:18–0:22 | Vale ducks under the tape. Three quick cuts: Imran's lighter on the bed, Okafor's glasses by the window wall, Pike's gloves at the door. **Title: ROOMSCRIPT. "Clue meets L.A. Noire. In your room."** | Four motif stings, one per cut. | preview |
| 7 | 0:22–0:30 | **Wadood's real room.** Looking around: yellow brackets snap onto the real charger cable (`CORD → THE ROPE`) and the real lamp; the desk becomes `THE STUDY`. | Bracket clicks. VO: *"It reads your room, and writes the case around it."* | **device** |
| 8 | 0:30–0:35 | Overview of the simulated room as a Clue board: zone borders, tents 1–5, suspects at marks, the envelope above the outline. Caption: *Every suspect stands where they claim they were.* | Four motifs layered into one chord. | preview |
| 9 | 0:35–0:47 | **Interrogation: Vale** by the kettle, medium close-up. Baseline chips: *"Did you know Harlow?"* steady. *"Is that your bottle?"* **brooch flares, gaze line flicks to the bottle.** Caption: *Learn her tell.* | Close-mic voice, tink, shing. | preview |
| 10 | 0:47–0:59 | *"Where were you at 10:41?"* "In the kitchen. Making tea." **Brooch flares, gaze line snaps to the desk lamp.** Hover over Press to show the preview line, then Press: *"The kettle was whistling, I heard nothing."* A bezel segment clicks off. | Shing at the lamp (panned left). | preview |
| 11 | 0:59–1:09 | **Objects remember.** Pinch the kettle: Polaroid `no whistle all night` (a conspicuous silence). Pinch the lamp: `10:41 — a figure at the desk`, with a switch click and a footstep. | Object memories. | preview |
| 12 | 1:09–1:22 | **OBJECTION.** Drag the cyan slip onto the lamp. The world freezes (rain streaks hang), the word slams in, **the cyan path tears from the coral one**, the slip shatters. The bezel snaps; Vale slumps: *"Fine. I was at the desk. He was already on the floor."* She walks to the desk; a red string links her to the lamp. | Silence, shout, brass, rip, shatter, sound slams back. | preview |
| 13 | 1:22–1:26 | **Wadood in his real room shouts "Objection!"** The word and the freeze fire. Caption: *On Spectacles, just shout it.* | Real voice. | **device** |
| 14 | 1:26–1:41 | **Suggestion.** Pinch Imran's pawn into the Lounge with the cable; the dotted ghost appears and the clock ratchets. **The sweep circles the room**, ticking past each witness, and stops at the **mug**. The private card flips: `10:30 — Imran in the Hall`. A chalk X lands on his pawn. | Ratchet, roulette ticks, chime. | preview |
| 15 | 1:41–1:59 | **The twist.** Lightning at the window, the hum cuts, the banked light stutters out, and **only eyes remain**. A UV hand-torch sweeps the floor: **coral drag marks** from the desk to the outline. Power thunks back; zones relight round the room; Imran is caught at the desk. Narrator: *"The body was moved."* | Thunder, silence, fizz, breaker, hum. | preview |
| 16 | 1:59–2:07 | **The room crosses itself off** (time-lapse): zone borders dim, tents flip to X, pawns get chalk marks, until only the Study, the cable and Vale still glow. | Chalk strikes in rhythm. | preview |
| 17 | 2:07–2:19 | **Accusation.** Pawn into WHO (Vale turns her head towards camera); the Study plaque flies into WHERE; the cable tent flies into WITH WHAT. Hold on the seal, heartbeat, **SNAP, and the clock stops.** ✓ ✓ ✓. | Clunks, heartbeat, total silence, three notes. | preview |
| 18 | 2:19–2:31 | **Reenactment.** The ribbon unspools from the empty clock spot; coral dust ghosts walk the night; **bullet time at 10:41**: Vale mid-stride, the cup frozen mid-fall in a crown of beads. The camera orbits the frozen moment. | Confession: *"He was going to sell the house…"* Rain pitches down into silence. | preview |
| 19 | 2:31–2:35 | **Wadood walks round the frozen moment in his real room.** | Low harmonic. | **device** |
| 20 | 2:35–2:41 | Resume: the cup shatters, the ribbon re-spools, **the clock reappears on the wall**, the tape falls, the guests leave, the lid stamps `CASE CLOSED`. *"You: 7 questions. Holmes: 5."* | Chime, warm chord. | preview |
| 21 | 2:41–2:53 | **Under the hood** (fast cuts, the confession audio carrying across as a bridge): the simulated night in 15-minute slots; the solver's "1 solution"; "lines written by AI, truth decided by the engine"; Claude Code/CLAD and the Lens Studio MCP placing the scene. | Confession tail, then a soft score. | screen capture |
| 22 | 2:53–2:58 | Split screen: **two Preview panels, two differently cast rooms, the same case code HARLOW-1041**, the tableau staged differently in each. End card: **"Same case. Your room."** | Tick… tick. Hard cut. | preview |

**If any device clip fails:**
- Shot 7 → manual casting in the preview.
- Shot 13 → a preview shout with the chip.
- Shot 19 → the preview orbit is extended.

**Optional replacement for shot 22:** a 4 s **two-person Sync Kit clip** (§8), if one exists.

**Never fake a device shot.** A badge on a real clip is worth more than a beautiful clip without one.

---

## 8. Multiplayer staging

### 8.1 Clue Night: two detectives in one room (Sync Kit, co-located)

**The shared stage.**
- Both detectives see the same tableau, the same envelope above the same chalk outline, and the same box on the same table. Only `seed + action log` syncs; each device computes the state.
- Each detective has a **badge ring** at their feet: a thin forensic-yellow ring with their initials, visible to the other wearer. The active player's ring brightens and gently rotates.
- **Holograms and people.** Bodies aren't in the world mesh, so a hologram behind your friend draws *over* them. Keep marks near the room's edges and the centre clear, and let the chalk outline's natural no-go zone hold people back.

**Turns and spotlight.** Turn order is clockwise round the real room, exactly like the refutation order. "Your turn" plays as a soft brass chime *from your own position* to the other player, so they hear whose turn it is from where it is.

**The refutation sweep passes over people.**
1. The blade circles the room, ticking past objects and suspects, and **pauses at the other detective**. The human player is now a refuting witness.
2. Their device asks: `Imran / Lounge / cable — you hold: LOUNGE. Show it?`
3. They pinch the card in their fan and **it flies face-down across the real room** from their hand to yours: a visible arc both players can see.
4. It flips **only on your device**. Theirs shows `shown to Wadood`.

Passing a glowing note across a real room is the best multiplayer image in the design.

**Interrogation with two people.**
- One detective questions at a time; the suspect turns to face them.
- The other detective can **watch the tell from the side**. Head aim within the cone counts, so the observer can catch the gaze line too. That is information the active player might miss while looking at their fan.
- **Audio:** two devices playing the same voice a few milliseconds apart cause phasing. **Let physics share the audio.** Only the active detective's device plays the suspect's voice at full; the observer's device ducks it by 12 dB and lets the active player's speakers carry it through the air. The open-ear "leak" becomes a feature.

**Private information.** Never voiced (speakers leak); silent text plus a generic chime only.

**Accusation.**
- One shot each.
- A wrong accusation cracks your badge. You stay in the game as a refuter only (the Clue rule), and your device **withholds the reenactment** until the game ends so nothing leaks.
- The first correct accusation wins. Both players watch the confession together, from different sides of the frozen moment.

**Co-op variant, "Partner read".** One detective asks and the other watches. A watcher who catches a tell pinches a **"Tell!"** marker, which lands on the asker's statement slip. It is two-person L.A. Noire, solving the real problem that one person can't watch a face and a notepad at once.

### 8.2 Party mode: one Specs, a room full of friends (later)

**The stage and the audience.**
- The Specs wearer is the performer. The Spectacles view is mirrored to the phone app, and from there to a TV, so the sofa sees what the detective sees. Mirroring through the Spectacles app is assumed and should be verified.
- **The sofa is the Lounge.** Friends literally sit in a zone, so suspects' marks avoid it.
- The detective interrogates holograms while the room heckles: *"She touched the brooch!"*

**The jury vote.** Before the one-shot accusation, the TV shows the three candidates and the room votes aloud. The detective can overrule the room, at their peril.

**Hidden accomplice.** This needs a web companion with a relay (WebSocket server or Snap Cloud alpha).
- One friend's phone secretly makes them the accomplice. Once per game they can make one refutation lie.
- The detective can shout "Liar!" at a friend, which uses the same LIAR! stamp, this time hovering over a real person's head.

**No-tech warm-up.** The detective reads suspect lines aloud and friends act out the tells. Silly, and it teaches the tells.

---

## 9. AI as the stage crew

The engine is the **script supervisor**: it keeps continuity and decides the truth. The AI is the **cast and crew**: it chooses *how* and *when* things are staged, never *what is true*.

| Crew role | What the AI does for the senses | When | Fallback |
|---|---|---|---|
| **Casting director** | Reads the room (Depth Cache on device), assigns object roles by type, picks suspect marks from personality plus the backlight check, picks the chalk, box, clock and door spots | Pre-show | Manual casting |
| **Playwright** | Truth-blind lines per claim, introductory lines that mention your real objects, letters, voicemail scripts, the confession monologue, narrator lines, all critique-checked | Case load, during the box opening | Template lines |
| **Props and costume** | Imagen engraving portraits; Snap3D exhibits in evidence bags; tell-prop assignment from the library | Case load (Snap3D may be late, so "the lab knocks") | Silhouette and prop library |
| **Composer** | A per-case score bed via Lyria (setting-specific: "1940s rain-soaked jazz", "Karachi monsoon night"), cached. Motifs stay authored stems, assigned by archetype | Case load | Authored bed |
| **Stage manager (live Director)** | Reads player state (time since progress, failed objections, clock left, where the player is looking) and pulls only **authored levers**:<br>• rain intensity<br>• motif density<br>• *a suspect steps forward*: "Detective, a word?"<br>• the narrator's Hunch whisper<br>• lab-delivery timing<br>• **the twist trigger window** | During play | Fixed pacing curve |
| **Interpreter** | Maps a free voice question to a closed topic, with a confirmation chip when confidence is low | During play (device) | Chips |

**What changes on every run (dynamism the player can *see*):**
- the staging (marks, the tableau, which furniture becomes which room);
- object roles;
- the tell set;
- the motifs and voices;
- the twist type from the library;
- the setting skin (costumes, sound bed, zone-name flavour). The palette stays fixed for readability;
- which suspect the Director sends forward when you're stuck;
- the daily seed.

**"Same case, my room"** re-stages one solution in every room. That is a pitchable demonstration that the staging is generated, not authored.

---

## 10. Top 10 wow moments, and three traps

Effort is for a solo builder with Claude Code/CLAD and the Lens Studio MCP, on top of the engine. S ≈ ½–1 day, M ≈ 1.5–2.5 days, L ≈ 3+ days.

| Rank | Moment | Why it wows | Effort | Preview? |
|---|---|---|---|---|
| 1 | **Spatial Objection**: freeze, the slam, cyan tearing from coral, the shatter, the break, and (on device) *shouting it* | The signature move; Ace Attorney's best feeling, made physical in your room | **M** | ✅ (shout on device) |
| 2 | **The gaze line**: a hologram's eyes flick to *your* real lamp, with a "shing" from where it sits | Fuses L.A. Noire's read with "objects testify"; impossible outside AR | **M** (S once objects are tagged) | ✅ |
| 3 | **Bullet-time walk-around at 10:41**: the culprit frozen mid-stride, the cup's liquid suspended as beads, and you walk round it | The money shot; physically circling a frozen moment in your own room | **M–L** (point-cloud ghosts and discrete poses keep it M) | ✅ orbit; device for the walk |
| 4 | **The opening**: knock at your real door, tape snaps, the box thuds, chalk races from your feet, the envelope seals above the body, the missing clock starts ticking | Twenty seconds that sell "premium boxed mystery" | **S–M** | ✅ |
| 5 | **The refutation sweep**: a roulette of light going round *your* room, stopping at *your* mug | Clue's private refutation made spatial; good tension for little cost | **M** | ✅ |
| 6 | **The tableau**: suspects wait where they claim they were; break a lie and they walk to where they really were | The room rearranges itself as the truth emerges; "the room is the board" made literal | **M** | ✅ |
| 7 | **Blackout and luminol**: lightning from your window, the hum cuts, the banked light dies, only eyes remain, a UV hand-torch reveals drag marks | The only darkness an additive display can make, used for the twist | **M** | ✅ |
| 8 | **The room crosses itself off** until one zone, one object and one suspect glow | The deduction made visible in physical space; a natural trailer shot | **S–M** | ✅ |
| 9 | **"It wrote the case around my charger cable"**: AI casting plus lines that mention your real things | Personal; proves the AI integration in one breath | **M** on device (Depth Cache); **S** for the room-aware lines | Device for auto-casting |
| 10 | **Lawyering up through your real door**: the suspect ducks out under the tape, then knocks 30 night-minutes later | The pressure rule made theatrical; it uses the door again, cheaply | **S** | ✅ |

**Honourable mentions:**
- *Hold the silence* (S): anxious suspects fill it.
- *Twanging red string* (S).
- *The clock reappearing on the wall at the end* (S).
- *Pulling words out of the air* (S).

**Suggested build order for wow per hour:** 4 → 2 → 1 → 8 → 5 → 3 → 6 → 10 → 7 → 9.
- The first four make a trailer on their own.
- 3 and 6 are the hardest to cut, because they carry the climax and "the room is the board".

### Three things that look cool but would hurt

1. **Photoreal or fully animated full-body 3D suspects.**
   - Dark clothing vanishes, skin looks ghostly, and the 51° frame crops them at the waist.
   - Walk cycles without shadows look like skating.
   - They swallow the build budget, and they make the tells *harder* to read.
   - Stylised engraved figures with prop tells read better and are cheaper.
2. **Live improvising LLM suspects, especially over Realtime or Live voice.**
   - Spectacular in a tweet, ruinous in play: early confessions, invented facts, latency, and a video that can't be reproduced.
   - Keep live AI to topic-mapping and filtered small talk; write the performance when the case loads.
3. **Re-skinning the room into a noir set**: virtual wallpaper, fog volumes, rain on every surface, a permanent waist-height ribbon, a big HUD.
   - Every layer lowers contrast, adds heat and power draw, and makes it less *your* room.
   - "My room is the board" only works if the player can still see their room.

**Also tempting and wrong:**
- generating Snap3D objects mid-scene (8–90 s of dead air);
- tells with random decoys in the hackathon build (L.A. Noire's best-known flaw);
- more than about six red strings;
- cyan used as a decorative colour.

---

## 11. Verification notes and sources

**Checked on 2026-10-25:**
- **Snap spatial design guide:** focus plane about 1 m; full display overlap at 1.1 m; the visible area at 1.1 m is about 53 × 77 cm, portrait, roughly 3:4.
- **Positioning & Sizing:** near field 35–60 cm, far field 60–160 cm; targets at least 2° and at least 1° apart; button sizes per distance.
- **Snap UI design guide:**
  - white is the boldest colour, alpha is proportional to luminosity, and pure black renders transparent;
  - use 2D shapes for text and icons, and prefer light text on dark;
  - use unlit materials with baked lighting, and avoid opacity gradients;
  - spatial audio can signal content outside the field of view.
- **Lens Studio audio:** AudioComponent spatial audio has distance and directivity effects and needs an AudioListener.
- **Remote Service Gateway:** OpenAI Chat (non-streaming), TTS ("multiple voice options"), Realtime; Gemini, Gemini Live, Imagen, **Lyria**; Snap-hosted DeepSeek and Snap3D. Lyria and Snap3D "may take significant time".
- **Depth Cache sample:** caches depth frames so Gemini's bounding-box centres can be projected to world positions after the delay. Spectacles and Lens Studio only. Tested in Preview with Interactive Preview (WASD plus mouse).
- **Spectacles-Sample** (via `gh`) includes Depth Cache, AI Playground, Voice Playback, Spatial Persistence, Spectacles Sync Kit and Tic Tac Toe, among others.

**Not verified (treat as assumptions):**
- **No developer API for lens tint.** Snap describes *automatic* dimming, and no tint API was found. The blackout must therefore be built from banked light, not tint.
- **Whether gateway TTS accepts style instructions.**
- **Lyria clip length and latency.**
- **The aspect ratio of Spectacles captures**, and mirroring to a TV via the phone app.
- **Battery and thermal budget.** Design a case for about 20 minutes and test particle and flash costs on device.

**Design references drawn on from general knowledge** (no new web sources): Pepper's ghost (Victorian stage illusion, 1860s); Punchdrunk's one-on-ones and pre-show thresholds; escape-room "player opens the box" and finale-ritual conventions; Ace Attorney's sprite and stinger grammar; engraving hatching as a way to draw tone with lines; the WCAG limit of three flashes per second.

**Sources:**
- [Snap: Introduction to spatial design](https://developers.snap.com/spectacles/best-practices/design-for-spectacles/introduction-to-spatial-design)
- [Snap: Positioning & sizing content](https://developers.snap.com/spectacles/best-practices/design-for-spectacles/positioning-sizing-content)
- [Snap: UI design](https://developers.snap.com/spectacles/best-practices/design-for-spectacles/ui-design)
- [Lens Studio: Playing audio](https://developers.snap.com/lens-studio/features/audio/playing-audio)
- [Lens Scripting API: DirectivityEffect](https://developers.snap.com/lens-studio/api/lens-scripting/classes/Built-In.DirectivityEffect.html)
- [Snap: Remote Service Gateway](https://developers.snap.com/spectacles/about-spectacles-features/apis/remoteservice-gateway?lang=en-US)
- [Snapchat/Spectacles-Sample: Depth Cache](https://github.com/Snapchat/Spectacles-Sample/tree/main/Depth%20Cache)
- [Snap: Lens Studio and Spectacles announcement (automatic dimming)](https://ar.snap.com/blog/lens-studio-and-spectacles)
- [Android: Color on glasses (additive display guidance, for comparison)](https://developer.android.com/design/ui/ai-glasses/guides/styles/color)
