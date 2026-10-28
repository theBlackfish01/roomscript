---
type: design
status: proposal
date: 2026-10-26
---

# Roomscript: the ideal version, in depth

**Why this note exists.** Late on Oct 25, Wadood said he is heavily favouring Roomscript and "most likely" going with it. The final decision comes after the boards are updated. He asked for a detailed expansion covering:
- the features;
- the maximum wow factor;
- the maximum integration of AI into gameplay;
- a very dynamic experience every time.

**Sources.** This note reconciles four assistant research and design reports, kept in full in `Research/SPECS round 4 research - 2026-10-25/`:
- [Roomscript research](../design/05-clue-and-la-noire-research.md): the Clue and L.A. Noire mechanics, repos and multiplayer.
- [AI gameplay design](../design/04-ai-gameplay.md).
- [AR staging and wow design](../design/03-ar-staging-and-storyboard.md).
- [Architecture and build plan](../design/02-architecture.md).

Context: SPECS hackathon - round 3 dossier - 2026-10-25. Everything here is assistant proposal; nothing is adopted. The hero case (victim Harlow; suspects Vale, Imran, Okafor and Pike; answer Vale, Study, cable) is illustrative.

---

## 1. The pitch

**"Clue meets L.A. Noire, in your room."**
- Your room is the board.
- Your things are the weapons.
- Every suspect is lying about something.
- Read their faces, ask them anything, and prove it with the objects around you.

**Second line, for judges:** "The rival's case is written once. Ours is written by your room, every night, and it can prove it played fair."

**The experience in one paragraph.** You put on the Spectacles and the AI reads your room. Then there are three knocks on your real door, tape zips across it ("Nobody leaves"), and a forensic case box thuds onto your desk. Chalk draws a body on your floor, and a sealed WHO / WHERE / WITH WHAT envelope rises above it. Four suspects arrive and stand where they *claim* they were when Mr Harlow died, around your actual furniture. You question them out loud. Each one answers live, in character, and differently every time, but every fact they state has been checked by the engine before you hear it. When someone lies, their tell fires and their eyes flick to the real object in your room that the lie is about. You pinch your lamp to see what it "remembers", drag the suspect's statement onto it, and shout **"Objection!"**. The room freezes, the lie tears away from the truth, and the suspect walks to where they really were. You make Clue-style suggestions, which your own objects quietly disprove. A storm knocks the "power" out, and a UV torch reveals that the body was moved. Then you seal your accusation and argue your case. Finally the night replays through your room in bullet time, and you can walk round the frozen moment of the murder.

## 2. The design charter: the rules that make it safe to go all-in on AI

1. **The AI owns everything you feel; the engine owns everything you can prove.** The AI writes, casts, voices, directs, coaches and reports. A deterministic TypeScript engine and solver decide every fact, lie, tell, contradiction, refutation and verdict.
2. **Truth is compiled, not generated.** The AI pitches a story; a compiler and solver prove it can exist and is fair, or send structured errors back for repair.
3. **The truth is sealed.** It is fixed before your first question, and a short hash is shown at the start and checked at the reveal. That proves the culprit never moved.
4. **The card is the claim.** What a suspect *says* is flavour. The claim card the engine prints is the testimony. Only cards can be objected to, filed or used in an argument.
5. **Suspects can't leak what they don't hold.** A suspect's live prompt holds only their *current cover story*, never the secret behind it. An AI that "wants to confess" has nothing to confess. The next layer of the story enters the prompt only after the engine breaks them.
6. **Every live line cites fact IDs, and code checks it before you hear it.** A line that names an unknown person, place, time or object, confesses, or breaks character is rejected. It gets one retry, then falls back to a pre-written line.
7. **Tells mean "lying", not "guilty".** Innocents lie about their own secrets. Tells are deterministic, learnable and fire on every lie.
8. **Every deduction has at least two routes, and every lie can be broken in any order of discovery.** Nothing closes for good; the clock is the cost.
9. **Twists come from the truth.** The director plays only beats that were dealt and validated when the case was sealed. Tampering *creates* evidence ("wiped at 11:15") rather than destroying it.
10. **Light is the only paint.** Black is transparent on Spectacles. Darkness can only be made by taking away light that was added earlier.

## 3. A session, start to finish (15–20 minutes)

### 3.1 Pre-show: the room is read (40–70 s, hiding generation)
- The narrator asks you to dim the lights ("Harlow liked it dim"). A darker room is the biggest single quality improvement on an additive display.
- **AI casting:**
  - Gemini reads a frame of your room: the camera stream, or a photo in preview.
  - Yellow brackets snap onto real objects, each tagged by what it could be used for: cord, blunt, sharp, poison, heavy, light source, timekeeper.
  - Brass plaques name your furniture zones (desk → THE STUDY, bed → THE LOUNGE, door → THE HALL), and a shimmer runs round each zone border so the room reads as a Clue board.
  - Manual tagging is always available. A missing object type gets a virtual stand-in prop.
- **Story hooks from your room:** a guitar makes the victim a pianist; a plant gives you a gardener suspect.
- **Meanwhile, the AI author writes the case** and the compiler and solver validate it, running 2–3 drafts in parallel.

### 3.2 The opening: the lid comes off (about 20 s)
1. Drifting motes freeze and the rain cuts out.
2. Three knocks come from **your real door**, and tape zips across it.
3. Behind you, the crate thuds onto your desk.
4. You pull the seal tab, the lid lifts, and light floods upward.
5. The victim card drops and chalk races across your floor to draw the outline.
6. **The envelope rises above the body.** This is the poster image.
7. A card riffle shows the suspects, *your* furniture zones and *your* objects. The wax seal stamps.
8. Silence. Then **the missing clock starts ticking from its empty outline on your wall.**

**The guests arrive.** The first ducks under the door tape, and the other three "develop" like Polaroids. Each gets a line about your actual room.

### 3.3 The tableau
Suspects wait at full size where they *claim* they were at 10:41: Vale by the kettle, Imran on the bed, Okafor by the window wall, Pike at the door. When you break a lie, the suspect walks to where they really were. The room itself shows how far you've got.

### 3.4 Investigating: objects remember
- Forensic tents stand beside each tagged object.
- **Pinch an object** and it plays a sound from the night (a switch click, a footstep) while a Polaroid develops: "10:41: a figure at the desk."
- Objects don't talk. They remember.
- Evidence goes into a palm-up evidence fan, with a floating wallet as the fallback in preview.

### 3.5 Interrogation: L.A. Noire, fixed (see §5)
- Ask anything by voice (on device) or by chip/typing (preview).
- Read the tell.
- Then **Believe / Press / Object**, with the detective's exact line previewed.

### 3.6 Suggestions: Clue, with your objects as the other players (see §6)
- Drag a suspect pawn into a zone with an object token.
- A light blade sweeps clockwise round your room and stops at the first object or suspect that can disprove you. It shows you one card privately.

### 3.7 Between interrogations: gossip
Waiting suspects are pawns huddled on your desk. Lean in within about 0.6 m and you overhear them: "don't mention the window." That gives you an *Overheard* card. Allies who learn what you showed their friend change their story before you arrive.

### 3.8 The director's beats
Chosen from beats dealt when the case was sealed:
- a letter slides under your real door;
- a voicemail plays from an object;
- a suspect tries to leave;
- tampering ("the glass was wiped at 11:15");
- a new witness;
- in long cases, a second crime.

**The signature twist is the blackout:**
1. Lightning at your real window, then the hum cuts.
2. All the "banked" light stutters out and only the suspects' eyes remain.
3. A UV torch in your hand reveals coral drag marks: the body was moved.
4. Power returns zone by zone, and one suspect has moved.

### 3.9 The partner: Wren
A truth-blind detective partner who knows only your notebook. Wren:
- recalls testimony;
- checks your theories against what you've found;
- notices tells you missed;
- runs errands.

Wren has a bias: Wren believes the first liar. That makes Wren wrong in characterful ways, but only between theories your evidence still allows, so Wren never contradicts the truth. Wren also doubles as the tutorial voice and the video narrator.

### 3.10 The room crosses itself off
- Zone borders dim, tents flip to X, and pawns get chalk marks until only one zone, one object and one suspect still glow.
- The time ribbon fills in round the room as facts are proven.
- Red string (coral, capped at six strands) links only *proven* connections.

### 3.11 Accusation, closing argument, confession
1. **Place the cards.** You place the suspect, zone and object in the envelope, and the accused turns to look at you.
2. **Break the seal.** You hold to break it, and the clock stops. It is the only time it ever does.
3. **The verdict.** The envelope decides it: a ladder of ✓ stamps.
4. **The closing argument.** You argue your case aloud, or by placing cards on a case board. The AI breaks it into claims, and the engine checks them against the deductions the solution requires.
5. **The defence.** The culprit's lawyer attacks up to two gaps, and you answer with a Spatial Objection.
6. **The ending, by tier:**
   - a full confession built from *your* argument;
   - a defiant "lucky guess" if you named the right person on thin evidence;
   - if you were wrong, the innocent's secret is revealed and the real culprit walks out through the tape.

### 3.12 Reenactment and epilogue
- **The reenactment:**
  - The ribbon unspools from the empty clock, and dust ghosts walk the night.
  - **Bullet time at 10:41** freezes Vale mid-stride and the cup mid-fall in a crown of beads. You can walk round the frozen moment.
  - Then the cup shatters, **the missing clock reappears on your wall showing the real time**, the tape falls and the guests leave.
- **The epilogue:**
  - **The Morning Edition** newspaper quotes your own words and best moments.
  - **The case file** shows your route against Holmes's ("You: 7 questions. Holmes: 5."), what you missed and the lie you believed.
  - The **hash check** confirms the truth never changed.
  - You get a **share code**.

## 4. AI in every layer

| AI role | What the AI does | What the engine owns | Fallback |
|---|---|---|---|
| **Caster** | Reads your room from a camera frame or photo: object boxes, affordances, zones, story hooks | Which roles an object may play (by type); stand-ins for missing types | Manual tagging |
| **Author** | Writes premise, cast, relationships, secrets, motives and story beats as strict JSON, using type-based role slots | Plans the 15-minute night itself; compiles the case; solver checks; repair diagnostics | Authored pitch library; hero case |
| **Suspects** | Answer any question live in character, with personality, emotion, memory of how you treated them, hearsay and improvised replacement lies once a lie is broken | Which claim applies; whether it is a lie; tells; breaking; composure; what each suspect knows | One retry → pre-written line pack → chips |
| **Gossip** | Voices the whisper beat and hearsay references | Who learns what: allies get revealed evidence and how you treated them; rivals get attitude only; nothing you don't already know can spread | Skip the beat |
| **Director** | Chooses the dramatically best beat from those currently eligible | Which beats exist and stay fair (pre-validated at sealing); a utility-score rule in ranked daily mode | Utility-score rule |
| **Partner (Wren)** | Banter, recall, theory checks, hints, tell spotting, a characterful bias | Wren sees only your notebook; theories are computed from what you know | Canned partner lines |
| **Evidence writer** | Letters, diary pages, texts and voicemails in character; Imagen portraits; Snap3D exhibits in evidence bags | The evidence card comes from the fact ID, not the prose; photos are rendered from the simulation, never image-generated | Template documents |
| **Defence attorney** | Cross-examines the gaps in your argument | Which gaps exist, phrased neutrally; the verdict comes from the envelope | Card-based argument |
| **Editor** | Writes the Morning Edition and the case-file story | The facts and your action log | Template paper |
| **Composer** (to verify) | A Lyria score bed that follows tension | Tension curve | Authored stems |
| **Nemesis** (later) | "The Playwright" profiles your habits across cases, briefs the Author and taunts you | Every validator check still applies | — |

**What the AI is never allowed to do:**
- decide a fact, contradiction or verdict;
- move the culprit to fit your suspicion;
- let a jailbreak win the case;
- put a fact in a generated image or mesh;
- cast people, photos, religious items, medication, children's things or documents from your room;
- clone a real voice.

## 5. The interrogation room (L.A. Noire layer)

**Staging.**
- One suspect at a time, at full size, 0.9–2.0 m away depending on personality, with furniture hiding the lower body.
- They are drawn as "living engravings": lit ivory face and hands, clothing as banknote-style hatching, and a rim line that carries stress.
- Never stage a figure against a bright window.

**Asking.**
- Voice on device, with a mic pinch.
- Chips generated from your notebook ("Where were you at 10:41?", "Ask about the lamp").
- Typed free questions in preview.
- Pinching a real object while a suspect is active asks about that object.

The interpreted topic appears as a chip ("Asking about: the lamp at 10:41"), so you can see when the AI misread you and fix it.

**The live answer.** One AI call does intent and answer together, under a strict schema:
- **Input:** a fact sheet holding the suspect's persona, the shared public facts, their current cover story, their memory of you and any hearsay.
- **Output:** `{topic, cites[], line, emotion}`.
- **Validation:** the validator checks every name, place, object and time against the cited fact IDs.
- **Hiding the wait:** the question is echoed back, the detective's chip line plays, a filler is chosen by emotion, and TTS is split by sentence.
- **Speed:** likely follow-ups are pre-generated while you watch, so common answers start in about 150 ms. A miss takes 1.5–3.5 s (estimates to measure on Oct 26).

**Tells: "whether" and "what".**
- **Each suspect's prop tell says *whether* they're lying:** Vale's brooch flares with a *tink*; Imran's lighter snaps shut and his walking bass stops; Okafor's glasses glare white; Pike tugs his white gloves.
- **The gaze line says *what* the lie is about.** A bright line flicks from their eyes to the real object, with a "shing" placed at the object. You only see it if you were watching their face; otherwise you hear only the audio half.
- **A baseline question teaches each tell explicitly** ("Watch her brooch"). That fixes L.A. Noire's best-known complaint, that a guilty smirk and a Mona Lisa smile looked the same.

**The three verbs, each with the detective's exact line previewed:**
- **Believe:** file the claim card. Free.
- **Press:** "Walk me through it." Costs 15 minutes of the night. Returns a checkable detail and drops one composure segment. A lie under pressure shows its tell again.
- **Object!:** drag evidence (an object memory, another suspect's card, an overheard card or a ghost on the ribbon) onto the claim. The graph decides.
  - *Right:* the suspect breaks and you get a Hunch.
  - *Wrong:* it bounces off in 1.2 s and costs a credibility pip, but the topic stays open.

**Lie ladders.**
- The culprit has three rungs: cover story → fallback lie → partial truth → confession. Innocents have two.
- After a correct objection, the suspect *improvises* the next lie live, from the next pre-validated layer. Their gaze flicks again, and you go back in.

**Breaking points.**
- Evidence works on anyone.
- Pressure works on anxious suspects.
- Empathy works on innocents only: "kindness clears innocents; evidence convicts".
- The culprit carries a decoy secret, so kindness can't be used as a guilt detector.

**Composure and shutdown.**
- A composure ring sits behind the suspect's head and shoulders, where it stays in frame.
- Press three times without new evidence and the suspect **lawyers up**: they walk out through your real door and knock to come back 30 night-minutes later.
- **"Hold the silence"** is a hidden verb: anxious suspects fill the silence, composed ones stare back.

**Hunches**, earned by correct objections, can be spent to:
- highlight one lie in your Statements tab;
- strike a zone or object from the grid;
- (later, online) see what share of daily-case players believed a statement.

## 6. Your room is the board (Clue layer)

- **The envelope:** WHO / WHERE / WITH WHAT, with 4 suspects × 5 zones × 5 objects, about 100 combinations.
- **Zones and weapons:**
  - your furniture zones get Clue-style names;
  - your objects are tagged by type (charger cable = THE ROPE);
  - the generator assigns roles by type, so any room works, and the same seed can be staged in any room.
- **Suggestion:**
  1. Drag a suspect's pawn into a zone and touch an object token. A dotted "ghost" of the scene appears and the clock ratchets forward 15 minutes.
  2. The **refutation sweep** circles your room clockwise from you, ticking past each witness like a roulette wheel. It stops at the first object or suspect that can disprove the suggestion, which privately shows you one card.
     - Objects never lie.
     - Suspects may lie when they refute, if the truth would expose their own secret. Their tell fires, and you can call **"LIAR!"** (from Clue Liars Edition).
  3. **If nobody can refute,** the envelope "breathes in". That is a huge lead.
- **The notepad** is the Clue grid. It crosses itself off as cards are shown, and the room mirrors it. A Statements tab collects claim cards with tell markers, ready to use in objections.
- **One shot at the accusation** on the daily case. Practice cases allow retries at a pip cost.

**Stakes and anti-brute-force:**
- each question or suggestion costs 15 minutes of the night, and suspects leave at midnight;
- five credibility pips;
- one-shot accusation;
- the Holmes rating compares your route with the solver's minimum route;
- unplaceable questions get an in-character deflection that still costs 5 minutes.

## 7. Never the same case twice

| Dial | Variation |
|---|---|
| **Your room** | Different objects and zones mean different weapons, witnesses and story hooks. The same seed is staged differently in each room |
| **Setting and genre** | A country house, a 1940s jazz club, a polar station, a wedding, or a premise you speak aloud. The same engine re-skins them all |
| **Cast** | New names, relationships, secrets, motives, voices and Imagen portraits |
| **Crime type** | Murder, theft (the missing brass clock), sabotage, or a survived poisoning where the victim can be interviewed |
| **Twist structure** (7 templates) | Staged weapon, time-of-death shift, accomplice pair, a secret passage through your real door or window, the body moved, a double alibi, a false confession |
| **Director beats** | Which beats are dealt and when they fire, following your pace |
| **Live performance** | Different words every playthrough, the same claim cards |
| **Difficulty** | Number of suspects, lie-ladder depth, red herrings, clock length; tells stay 100% reliable in the base game |
| **Daily case** | One validated skeleton a day, mapped onto each player's room by object type; "same case, your room" and a per-seed leaderboard |
| **Meta (later)** | Recurring characters who remember you; a detective rank; the Nemesis, who learns your habits and reveals at the end which one it exploited |

## 8. Staging and sound (the AR experience)

- **The fiction holding it together:** the case box is a **forensic projection kit**. That explains the glow, the translucency, and why a projection glitches when someone lies.
- **The ten staging rules:**
  - brightness is the spotlight, one focal point at a time;
  - imply darkness with dense hatching, never fill;
  - bank light early and spend it later;
  - sound guides your head and silence is the blackout (hard cuts, not fades);
  - beats wait for your head to turn, with a stronger second cue after 4 s;
  - objects remember rather than talk;
  - the tell lives on an emissive prop;
  - red string only for proven links;
  - the past drawn as 75% dust, the present as 1:1 light;
  - no HUD (the box lid is the board, and the empty clock outline is the night clock).
- **Palette, "luminol, not noir"**, with line styles so colour is never the only signal:
  - coral `#FF6B5A`, solid: truth;
  - cyan `#3FE3FF`, dashed: alibi and claim;
  - forensic yellow `#FFD60A`, chevrons: markers and UI;
  - warm ivory `#FFF0D6`, engraving: people;
  - brass `#E8B04A`, engraved: the board layer;
  - chalk blue-white `#EEF4FF`;
  - UV violet `#8F7CFF`: twist only.
- **Luminance budget:** at most about 15% of the frame lit bright.
- **Text in space:**
  - heavy condensed caps for OBJECTION / LIAR / CASE CLOSED;
  - an engraved slab serif for plaques;
  - monospace for evidence labels;
  - minimum cap height about 0.5°.
- **The clock** is the sound of the case:
  - it ratchets forward with each question;
  - it double-ticks at 11:45;
  - it chimes at midnight;
  - its bell stretches in bullet time;
  - it stops only when you break the seal.
- **Suspect motifs** share one key, so the four make a "house" chord, which loses a note when someone lawyers up.
- **Five planned silences.**
- **Private information is never spoken aloud.** That matters for multiplayer.

## 9. Multiplayer

| Mode | What it is | When |
|---|---|---|
| **Same-case duel** | Share the case code; race or compare Holmes ratings in your own rooms | **Ships regardless.** It is just the daily seed |
| **Clue Night** | 2–4 detectives in one room via Sync Kit. The sweep pauses at the other detective, who flings a face-down card across the real room that opens only on the recipient's device. You can watch your friend's suspect lie from the side. The observing device turns the suspect's voice down 12 dB to avoid echo | **Stretch,** only if every must-have is green by the night of Nov 6. Shown as two Preview panels |
| **Party mode** | One Specs wearer, friends on the sofa (the sofa becomes the Lounge); the view mirrors to a TV, the room votes before the accusation, and the AI is the game master | Later |
| **Hidden accomplice** | One human is secretly in on it. The AI coaches them privately, they get lie tokens, and their own face is the tell | Later, and the strongest post-hackathon mode |
| **AI rival detectives** | AI detectives race you on the same case | Later |

**Technical note.** The engine is deterministic, so multiplayer syncs only the seed plus an ordered action log. AI calls run on the host and are broadcast as events. Sync Kit limits: 100 KB per message, 350 messages per 5 s, no replay for late joiners.

## 10. Architecture in brief

- **Truth layer:** `RoomModel` (scan or tags), then the `CaseGraph` (compiled, immutable), then the `Solver`. The solver checks:
  - a unique solution;
  - two routes per eliminated card;
  - every lie breakable;
  - no single-clue shortcut;
  - harmless red herrings;
  - minimum route at most 60% of the clock;
  - solvable with and without each twist.
- **Generation layer:**
  - An LLM pitch with role slots (Gemini Flash starts at t=0, in parallel with casting) feeds the compiler.
  - The compiler re-samples the timeline up to 50 times before asking the LLM to repair. Repair prompts return JSON Patches limited to the paths with errors, at most twice; after that, the authored pitch library takes over.
  - Line packs are pre-written per suspect and critiqued, as the safety net.
- **Performance layer:**
  - live answers via chat with a strict JSON schema whose enums come from that suspect's fact sheet;
  - a deterministic `LineValidator`, shared by live lines, gossip, partner lines and letters;
  - tells fired by the graph.
- **Direction layer:**
  - a director choosing from an enum of eligible pre-validated beats;
  - a partner that sees only your notebook;
  - a defence attorney; generated evidence.
- **Determinism:**
  - named PRNG substreams and an event-sourced reducer;
  - every AI output is recorded as an event;
  - tape modes LIVE / RECORD / REPLAY / HERO.
- **Degradation ladder:** L3 live → L2 cached → L1 buttons → L0 offline hero case, automatic per call. There is also a hidden "stage mode".
- **Budget:** about 190–210 gateway calls per 15–20-minute session (roughly US$0.20–0.50 at public rates; the gateway's own pricing is undocumented). The binding risks are rate limits and latency, so speculative calls are dropped first.

**Where the designers disagreed, and my call:**
- **Realtime voice suspects** (the AI designer) versus "live improvising suspects hurt" (the AR designer). The architecture designer settled it.
  - Mic input doesn't stream in Lens Studio Preview, and Realtime speaks before anything can be validated.
  - So **live answers come from chat plus TTS, validated before you hear them.** That keeps "different every time" without ever letting an unchecked line through.
  - Realtime survives only as a device-only stretch for Wren's banter.
- **"Objects testify" (voices) versus "objects remember" (sound plus Polaroid).** Go with *remember*: it is clearer, cheaper and avoids talking kettles.
- **Time ribbon.** It is not always visible at waist height. It fills in as facts are proven, and becomes the reenactment.
- **Composure ring** moves from the suspect's base to behind the head, where it stays in frame.

## 11. What goes into the hackathon build

**Must-have (the coherent product):**
1. Engine, compiler and solver; hero case HARLOW-1041 plus seeded generation.
2. Casting: manual tagging plus substitution (vision scan as a should-have).
3. The opening ritual: knocks, tape, crate, chalk, envelope, clock.
4. The tableau.
5. Interrogation:
   - chips and typed questions;
   - **live validated answers** with line-pack fallback and OpenAI TTS;
   - the latency-hiding stack;
   - prop tell plus gaze line;
   - Believe / Press / Object with line preview;
   - composure and lawyering up.
6. Objects remember, with the evidence fan or wallet.
7. Spatial Objection with the lie-layer swap and the suspect walking to their true mark.
8. Suggestion with the clockwise refutation sweep, plus the notepad grid that crosses itself off.
9. Envelope accusation, plus a simplified reenactment with bullet time at 10:41.
10. The LLM pitch → compile → repair loop, shown through a visible "Case Compiler" overlay.
11. Tape record/replay, the degradation ladder, tests and the CLAD log.

**Should-have (maximum AI that's still safe):**
- a lie ladder of 2–3 rungs;
- Wren (notebook-only; tutorial and narrator);
- the director with 3 beat types, including the letter under the door and a voicemail;
- the blackout-and-luminol twist;
- gossip with the whisper beat;
- closing argument (case board plus typed text) with the defence cross-exam;
- Imagen portraits;
- the vision scan in preview;
- the Morning Edition;
- the Holmes rating and daily case code.

**Stretch:**
- Clue Night;
- "LIAR!" refutations;
- a Snap3D exhibit in an evidence bag;
- a Lyria score;
- on-device voice questions and a spoken closing;
- a Depth Cache device scan;
- Realtime banter for Wren.

**Later:**
- the Nemesis;
- recurring characters;
- party mode;
- the hidden accomplice;
- "Ask the city";
- the full twist library.

**Honest budget.** The AI designer's top five plus the core is about 19–20 days of work against about 15 remaining. The tiers above assume agents do most of the typing, and Wadood's available hours are unknown. Treat the plan as a proposal.

## 12. Build plan (proposal; Oct 26 – Nov 9)

| Date | Goal | Done when |
|---|---|---|
| **Mon Oct 26** | **Gateway probe lens** built with CLAD and recorded: chat with strict JSON schema, Gemini responseSchema, TTS, Imagen, each fired 20× with p50/p95. Engine skeleton (PRNG, room fixtures, solver on a hand-made 4×5×5 graph). `LineValidator` with adversarial tests | Latency table recorded; solver passes; "does the gateway work in Preview?" answered |
| Tue Oct 27 | Simulator, dealer, statement builder, compiler from an authored hero pitch; fuzz 1,000 seeds | ≥90% of seeds valid, each under 300 ms |
| Wed Oct 28 | **Live interrogation slice:** fact sheet → schema → validator → TTS → placeholder actor; fallback; latency hiding; tape record | Chip → spoken validated answer; p50 miss ≤3.5 s; network-off works |
| Thu Oct 29 | Scene via CLAD/MCP: chair, actor, gaze-line tell, composure, verbs, notepad v0. **Live Build 21:00 PKT:** ask about rate limits, TTS and camera in preview, and whether publishing is required | One interrogation playable in preview |
| **Fri Oct 30** | Generation loop plus the Case Compiler overlay. **Kill-or-continue checkpoint** (below) | — |
| Sat Oct 31 | Clue layer: pawns, clockwise refutation, grid | Full suggestion loop |
| Sun Nov 1 | Spatial Objection, lie-layer swap, pips, lawyering up, evidence from object pinches | Objection loop |
| Mon Nov 2 | Casting: tagger, substitution, vision scan in preview; envelope accusation | Two rooms produce the same seed's case |
| Tue Nov 3 | Memory, gossip and whisper beat; speculative cache; portraits | Gossip references earlier treatment |
| Wed Nov 4 | Reenactment with bullet time; verdict and Holmes rating; director beats with letter and voicemail | Whole case playable end to end |
| **Thu Nov 5** | **Feature lock (morning).** Test suite and bug bash. **Project Review 22:00 PKT** with a 90 s rough cut | No must-have open |
| Fri Nov 6 | Should-haves: Wren, closing argument, the blackout twist, polish | Green or cut |
| Sat Nov 7 | **Stretch gate:** Clue Night only if everything is green; otherwise freeze the hero tape and polish | Hero tape frozen |
| Sun Nov 8 | **Video day 1:** hero take, one seed in two rooms, three-seed montage, a typed weird question answered live, CLAD/MCP footage, device clips if possible | All shots done |
| Mon Nov 9 | **Video day 2:** edit, VO, captions with the honesty note, Devpost write-up, repo public with licences; **submit around 20:00 PKT** | Submitted, with 7 hours to spare |

**Kill-or-continue, Oct 30 evening.** Continue if at least 3 of these 4 gates pass:
- **Engine:** ≥90% of seeds valid. *If it fails:* shrink to the hero case plus 3 authored pitches.
- **Live answers:** validated speech in preview, p50 miss ≤3.5 s, reject rate ≤10%. *If it fails:* retreat to pre-written lines plus live intent mapping. Roomscript stays viable.
- **Generation:** ≥80% of pitches compile within 2 repairs. *If it fails:* authored pitches become primary.
- **Scene:** one interrogation with a tell playable. *If it fails:* use cards instead of figures.

If the engine and live answers both fail, reconsider. Switching to Foreman that late costs about four days.

## 13. The three-minute video (condensed from a 22-shot storyboard)

| Time | Beat | Source |
|---|---|---|
| 0:00–0:22 | Motes freeze, three knocks, tape, crate, chalk, envelope, clock tick; suspects arrive; title "Clue meets L.A. Noire. In your room." | Preview |
| 0:22–0:30 | Wadood's real room: brackets snap onto the real cable ("CORD → THE ROPE") and lamp; "It reads your room, and writes the case around it." | **Device** |
| 0:30–0:59 | Tableau overview; Vale's baseline teaches the brooch tell; "Where were you at 10:41?"; the gaze line snaps to the lamp; Press, with the line previewed | Preview |
| 0:59–1:22 | Objects remember (kettle, lamp); **OBJECTION**: freeze, tear, shatter; Vale walks to the desk | Preview |
| 1:22–1:26 | Wadood shouts "Objection!" in his real room | **Device** |
| 1:26–1:41 | Suggestion: the sweep circles the room and stops at the mug; a private card; a chalk X | Preview |
| 1:41–1:59 | Blackout: only eyes remain; the UV torch shows drag marks; power returns and Imran has moved | Preview |
| 1:59–2:19 | The room crosses itself off; accusation; the seal breaks and the clock stops; ✓ ✓ ✓ | Preview |
| 2:19–2:35 | Reenactment: bullet time at 10:41, the cup frozen in beads; Wadood walks round the moment | Preview + **device** |
| 2:35–2:41 | The clock reappears on the wall; tape falls; CASE CLOSED; "You: 7 questions. Holmes: 5." | Preview |
| 2:41–2:53 | Under the hood: the night in 15-minute slots, "1 solution", "lines by AI, truth by the engine", CLAD and Lens Studio MCP placing the scene, plus the hash check | Screen capture |
| 2:53–2:58 | Two Preview panels: two rooms, same case code HARLOW-1041. "Same case. Your room." | Preview |

**Honesty rules:**
- Badge every device shot "Captured on Spectacles".
- Build the simulated room to match Wadood's real room, so preview and device shots match-cut.
- Disclose replayed takes on screen.
- Never fake a device shot.
- Every device shot has a preview fallback.

## 14. Open questions to verify first

1. Do the gateway's chat, TTS and Imagen calls work in **Preview**, and at what p50/p95 latency? Does it accept strict JSON schema? What are the rate limits? (The probe answers all of these on Oct 26.)
2. What does the camera stream show in Preview: the simulated room, or a webcam?
3. Does the built-in TTS run in Preview alongside the gateway?
4. Is a Specs device available for the three device shots?
5. Does the hackathon require a published lens? Ask at Live Build on Oct 29. Camera plus internet appears publishable in SPECS 27 under "Transparent Permission", but older docs conflict.
6. How many hours a day Wadood can give it. Unknown, so every schedule here is a proposal.
