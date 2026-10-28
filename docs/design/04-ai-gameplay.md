# Roomscript: the AI-native design (ideal version)

Prepared 2026-10-25 (Asia/Karachi) for Wadood's "Learn AR with SPECS" entry. This is an assistant design proposal; Wadood has adopted none of it. It builds on [Roomscript research](../design/05-clue-and-la-noire-research.md) and the Roomscript sections of the round 3 dossier. Search: built-in WebFetch/WebSearch and `gh` only. Exa, Tavily and Consensus were not used.

Effort scale for a solo builder working with Claude Code, at **ideal-version scope**:
- **S** = up to 2 days
- **M** = 3–5 days
- **L** = 6 days or more

Thin-slice hackathon estimates are given separately in §12.

---

## 0. Thesis: players *feel* the AI and *prove* with the engine

The previous research was right about one thing and too timid about another.

**Right:** an LLM must never own truth.
- Vaudeville's chief and coroner gave two different names and each insisted.
- LLM suspects "want to confess" on question two.
- In the Turnabout benchmark, models stayed under 40% at picking contradictions.

All three failures happen when the model *owns facts* or *judges facts*.

**Too timid:** the research then drew the wrong conclusion and kept the AI to writing a script at case load and classifying questions during play. That makes the AI a voice actor reading cue cards. It also produces only *texture* dynamism (different wording), which players see through in ten minutes. Vaudeville didn't fail because its AI was live. It failed because its AI was *sovereign*.

**My rule:** give the AI everything the player *feels* and the engine everything the player can *prove*.

| The AI owns (live, generative, different every run) | The engine owns (deterministic, sealed, checkable) |
|---|---|
| The premise, cast, relationships, motives, secrets, voices and documents | The true night (12 slots of 15 minutes), the envelope, means/motive/opportunity |
| How a suspect answers, their mood, what they volunteer, grudges, gossip | *What* a suspect may claim; whether it's a lie; when they break |
| Which pre-dealt director beat fires, and when | Which beats exist, and proof that each keeps the case solvable |
| The partner's opinions, banter, and characterful mistakes | The partner's knowledge, limited to what *you* have seen |
| Parsing your closing argument; the confession; the newspaper | The verdict; whether the argument covers the required deductions |

Dynamism has to come from **structure**, not just texture:
- a different case from your room;
- lies that shift with what you have discovered;
- suspects who talk behind your back;
- a director who plays a different hand;
- a nemesis who studies you.

Texture (voice, wit, improvisation) makes it feel alive. Structure makes it *play* differently.

### The Fair-Play Charter (put this on a slide)

1. **Sealed truth.** The true night, the envelope, every lie ladder and the director's beat deck are fixed before your first question. A short hash ("Envelope sealed · #A41F") is displayed at that point and verified at the reveal. This is commit–reveal: proof that the AI didn't move the culprit.
2. **Testimony only through the engine.** A suspect may say anything, but only a **printed claim card** counts as testimony. Objections, the notepad and the solver use only cards.
3. **Computed judgements.** Contradictions, breaks and verdicts are computed from the case graph. No model ever judges them.
4. **Dealt beats only.** Every twist the director can play was dealt at sealing and validated in advance.
5. **Redundant routes.** Every required deduction has at least two routes. Every lie has a reachable breaker, in *every* order of discovery.
6. **Readable tells.** Tells are deterministic, taught with a baseline, and mean "lying", not "guilty".
7. **Opinion is labelled.** The AI can be wrong only where it is visibly giving an opinion (the partner, the nemesis's taunts) or in flavour that doesn't count as testimony.
8. **Full disclosure.** Everything is revealed at the end: the full true night, every secret and the hash check.

---

## 1. Architecture: one truth kernel, six AI roles

```
                 ┌──────────── SEALED BEFORE QUESTION 1 (hash shown) ────────────┐
 room scan  ───► │  AUTHOR (LLM, slow)  ──proposes──►  TRUTH KERNEL (pure TS)    │
 genre dial ───► │  premise · cast ·        ◄──diagnostics──  plan night ·       │
 nemesis brief ► │  secrets · beats · prose   repair loop     solver · validator │
                 │                                            lie ladders · deck │
                 └────────────────────────────────────────────────────────────────┘
                        │ onion slices · public canon · beat deck · persona cards
      ┌─────────────────┼──────────────────┬───────────────────┬─────────────────┐
  THE CAST          THE DIRECTOR       THE PARTNER          THE EDITOR      THE NEMESIS
  (OpenAI Realtime, (chat; plays        (Gemini Live;        (chat + TTS;    (meta; writes
  streaming voice,  only dealt beats)   truth-blind; biased  docs, confession, next case's
  tool calls)                           partial solver)      newspaper)      brief)
      │ testify() / elaborate() / volunteer()
      ▼
  CLAIM CARDS ──► notepad · objection (graph-checked) · solver · partner
```

### Verified platform facts behind this design (checked 2026-10-25)

- **Realtime and Live support function calls.** Snap's own `Spectacles-Sample/AI Playground` opens `gpt-4o-mini-realtime-preview` over the Remote Service Gateway with `tools` in `session.update`, handles `function_call` items, and returns `function_call_output`. `GeminiAssistant.ts` does the same with Gemini Live `function_declarations`. The gateway documentation says the only Live model supported is `models/gemini-2.0-flash-live-preview-04-09`.
- **What the gateway's TypeScript types expose:**
  - Realtime `instructions`, `tools`, `tool_choice`, `input_audio_transcription` and 11 voices;
  - Chat `response_format: json_schema`;
  - TTS models `tts-1`, `tts-1-hd` and `gpt-4o-mini-tts`, with an `instructions` field for direction.

  Exposed in the types is not the same as tested through the gateway, so verify these.
- **Ordinary chat completions don't stream.** Realtime and Live are the streaming paths.
- **Snap3D is staged.** It returns `image`, then `base_mesh`, then `refined_mesh`, and also accepts `image_b64` input. Use those stages as the on-screen loading bar.
- **ASR is device-only, but the preview has a microphone toggle.** Whether that mic feeds Realtime audio input in the preview is **unverified**. **Test it on Oct 26.** If it works, the preview video can show live voice questioning even though the ASR module can't. If not, preview questions arrive as chips or typed text sent to Realtime as text, with replies still in streamed audio.

### The Cast tool contract (the heart of grounded live suspects)

A suspect session receives:
- a persona card;
- the **public canon** (names, roles, house layout, weather, the time the body was found);
- **its current onion layer** (§3.3);
- its emotional state.

It does *not* receive the true night, the envelope or its own deeper secret. Its tools:

```ts
testify(topic: TopicEnum)        // whereabouts@slot | saw@slot | person:x | object:o | zone:z | relationship:x | motive | alibi
  → { cardId, claim:{subj,pred,obj,slot}, stance:"calm"|"evasive"|"nervous"|"defiant",
      hesitate:boolean, mayMention:[entity...] }      // the engine prints the card; the tell fires if the claim is a lie
elaborate(cardId)                // Press: returns the pressed, checkable detail
opinion(person)                  // relationship-based attitude; non-factual, with a whitelist of mentionable facts
volunteer()                      // returns a fact only if the rapport threshold is met, else null
small_talk()                     // tells the model the question is off-case; answer in persona and name no case entities
note_tone(tone)                  // the model tags the detective's tone: polite|rude|threat|empathic|flattery|bluff
```

**`TopicEnum` is generated per case.** The tool schema *is* the closed topic set, so topic mapping comes for free with the live call. That removes the separate classifier step and a whole subsystem from the research MVP.

### The fact firewall

Realtime emits transcript deltas alongside the audio. A cheap matcher runs over the transcript against the **closed case lexicon**: about 5 people, 5 zones, 5 objects, 12 time slots and a few nouns specific to the case.
- Any case entity that is neither in that turn's tool payload nor in the public canon marks the utterance **[unrecorded]**. It is greyed in the subtitles and never carded.
- The next turn's instructions then require a natural self-correction ("…no, forgive me, I misspoke").
- Every violation is logged so the prompts can be tuned.

Because suspects are truth-blind and get their knowledge in layers, the worst a model can do is *invent* a fact, never *leak* the solution. Players learn the contract quickly: **if it didn't print, it isn't testimony.**

### Degradation ladder

Every tier keeps the truth kernel intact:
1. Realtime voice;
2. chat completion plus TTS (2–4 s, masked by a "thinking" animation);
3. cached lines from the case-load writing pass (the research's conservative design, now the **safety net**);
4. text-only chips.

Once a case is sealed it stays fully playable with no AI calls at all.

---

## 2. Feature 1: a case generated from *your* room, every time

### 2.1 Reading the room
**What it is.**
- **Device:** Gemini vision on camera frames, using the Depth Cache pattern (vision → bounding boxes → 3D world positions).
- **Preview:** honest input from a **still photo of a real room**.

The output is objects with labels, 3D positions and **affordances**:

| Affordance | Examples |
|---|---|
| cord | cable, belt |
| blunt | lamp, mug, trophy |
| sharp | scissors, letter-opener |
| poison-vessel | bottle, cup |
| heavy | books, dumbbell |
| container | box, drawer |
| light-witness | lamp, screen |
| time-witness | clock, phone, oven |
| reflector | mirror |
| passage | door, window |

It also proposes 4–6 zones and **room hooks**, for example "guitar, plants, stacked books, gym mat".

**Why it's a wow.** It notices your guitar and the victim becomes a session pianist whose stolen song is a motive. *The room shapes the story, not just the props.*

**How AI is used.** Vision tags objects and suggests zones. The LLM proposes affordances and hooks. You confirm with a pinch, or correct the tags; manual tagging is the fallback.

**Fairness and safety.**
- Geometry is deterministic. Witness coverage ("the lamp can see the desk zone") comes from simple angle and distance tests on *your real layout*, so your furniture really decides who could have seen what.
- A **sensitivity filter** never casts people, faces, photos of people, religious items, medication, children's things or legible private documents. Nothing in the room is OCR'd.
- Camera access with internet needs the permission prompt or Extended Permissions for Experimental APIs. That is acceptable for the demo; check what publishing would require.

**Effort:** M. (Device vision is S on top of the Depth Cache sample; the photo route for the preview is S.)

### 2.2 The Author invents the case
**What it is.** The Author receives:
- the room inventory and hooks;
- the genre dial;
- the difficulty;
- a seed;
- optionally the Nemesis's brief.

It returns a strict JSON case draft (via `json_schema`) containing:
- **premise:** setting, era, the occasion ("the reading of a will", "a gallery opening");
- **victim:** persona, plus room hooks woven in;
- **cast of 3–5:**
  - archetype, voice brief, three sample lines;
  - a relationship graph across family, money, romance, rivalry, debt and blackmail;
  - a motive (real or apparent);
  - **a secret** (a suspicious fact: affair, debt, theft, hidden identity, a past crime);
  - a *want* (what they want from you tonight) and a *fear*;
- **crime type and twist template** (§2.4);
- **beats:** about 6–10 key story moments ("21:30 Vale argues with Harlow in the Study"; "22:15 Imran pockets the bottle in the Kitchen");
- **public canon:** weather, a power cut, who found the body.

**The engine then plans the night.** It fills every actor × slot with a zone, an action and objects touched, so that the beats are realised. LLMs are poor at keeping five actors consistent across twelve slots; planners are excellent at it. The AI writes *why* and the key moments; the engine writes *where everyone was every 15 minutes*.

**Effort:** L (schema, prompts, planner).

### 2.3 Generate → validate → repair
The validator returns *structured diagnostics*, not pass or fail.

| Check | Rule |
|---|---|
| V1 | Exactly one WHO/WHERE/WITH WHAT is consistent with all reachable evidence |
| V2 | Means/motive/opportunity: the culprit has all three; each innocent has exactly two plus a suspicious fact (MuSR) |
| V3 | Three-clue rule: each required deduction has ≥2 independent routes (≥3 on Rookie) |
| V4 | Every lie rung has a reachable breaker **in every order of discovery** (the state space is small enough to enumerate) |
| V5 | No shortcut: no single card or claim removes more than about 40% of the remaining solution space (an information-gain cap) |
| V6 | Clock: the solver's minimum route ≤ the budget minus slack for the difficulty |
| V7 | Every non-envelope card has ≥2 refuters among objects and suspects |
| V8 | Beat-deck closure: after each director beat, and each pair of beats, V1–V6 still hold |
| V9 | Lexical hygiene: all names in the lexicon; suspects' names phonetically distinct (so ASR and TTS don't blur "Vale" and "Val") |
| V10 | Sensitivity and content rating for the genre |
| V11 | Difficulty metrics (solver depth, lie count, red herrings) inside the target band |

**Repair operators:** deterministic first, LLM second.
- R1: add a witness sighting from an object with line of sight.
- R2: shift an innocent's action by one slot, which adds or removes opportunity.
- R3: add or remove an object memory.
- R4: swap the weapon for another object with the same affordance.
- R5: pair two innocents into a mutual alibi, or split one.
- R6: add a document that carries a fact, giving a second route.
- R7 (LLM): rewrite a motive, secret or relationship using the diagnostics ("Imran has all three of means, motive and opportunity; give him an alibi witness or remove his motive").
- R8 (LLM): re-pitch the premise after repeated failure.

**The loop.**
1. Run **2–3 candidate drafts in parallel.**
2. For each, run up to three deterministic repair passes and two LLM passes.
3. The first valid candidate wins.
4. Fallback: a curated skeleton re-skinned by the LLM, so the cast, voices and premise are still new.

**Latency budget.** About 45–60 s of ritual hides it: casting the room, the box thudding onto the table, the chalk outline drawing itself, the tape snapping across the door, the envelope sealing.

| Stage | Time |
|---|---|
| Vision | 5–10 s |
| Author | 10–20 s |
| Validation | < 1 s locally |
| Repairs | 0–15 s |
| Writing pass (personas, documents, portraits) | 10–30 s in parallel |
| Snap3D | 8–90 s, arriving progressively (§6) |

The baseline interview can begin before every document is ready.

**Why it's a wow, and a pitch weapon.** Put the casting on screen: objects light up as they're cast, the solver's checkmarks tick ("unique solution ✓ · every lie breakable ✓ · solvable by midnight ✓"), and the envelope seals with its hash.

For the CLAD criterion: Claude Code builds a **case fuzzer** in Node that generates hundreds of cases offline and charts the validity rate and the number of repair passes needed. Show the *measured* figures; don't predict them now.

**Effort:** L.

### 2.4 What varies from run to run

| Axis | Options | Driven by |
|---|---|---|
| Setting and genre | Noir 1947 manor; Victorian séance; 1970s disco; cyberpunk tower; orbital station; drawing-room comedy; a spoken premise ("a heist where the houseplant is the witness") | Genre dial, room hooks, player's words |
| Cast | 3–5 suspects with generated relationships, secrets, wants and fears; recurring characters (§9) | Author, Nemesis |
| Crime type | Murder; theft (the missing brass clock); **survived poisoning** (the victim can be interviewed as an unreliable witness); sabotage; blackmail; disappearance (the victim may be alive) | Author, rank |
| Twist template | (a) straight whodunit<br>(b) accomplice pair (a bonus fourth slot)<br>(c) staged weapon (the cable is a decoy; it was the bottle)<br>(d) time-of-death shift (the 10:41 crash was staged; the murder happened at 10:11, so every 10:41 alibi is irrelevant)<br>(e) the victim's frame-up (evidence planted before death)<br>(f) two crimes, two culprits (the obvious thief isn't the killer)<br>(g) secret passage (your real door and window are linked, Clue's corner passages) | Author picks; the engine has a validator rule per template |
| Difficulty | Suspects; lie-ladder depth (1–3 rungs); refuter redundancy; red herrings; clock slack; tell clarity (labelled / plain / 80% on Noir); partner competence; how aggressive the director is | Rank, Director |
| The director's hand | Which beats are dealt, and which fire | Director (§4) |

---

## 3. Feature 2: living suspects

### 3.1 Live, grounded questioning
**What it is.**
- Ask anything: voice on device, chips or typed text in the preview.
- The suspect answers in **streamed voice within about a second**, in character, and improvises freely on anything off the case ("What's your favourite cereal?").
- Every factual answer comes through `testify()`, so a claim card materialises *as they speak* and the tell fires if it's a lie.

**Why it's a wow.** The rival entry has one fixed line per suspect. Here, ask the same question twice and you get **different words and the same card**. Put that side by side in the video.

**How AI is used.**
- One Realtime session at a time, for the suspect in the chair. It opens while they walk to the chair, which hides the connection time.
- The engine rewrites the session `instructions` after every turn with the current state: composure, rapport, layer and memory summary.
- **Memory lives in the engine, not the socket.** It survives reconnects and can be inspected.

**Fairness.**
- The tool schema enforces the closed topic set.
- The card's header shows the parsed question ("Q: whereabouts · 10:41"). "That's not what I asked" re-asks for free.
- Chips skip the parse entirely.
- The clock is charged per **testimony topic**, not per utterance. Small talk costs 5 minutes and is capped.

**Effort:** L.

### 3.2 Memory of how you treated them
**What it is.** `note_tone()` feeds per-suspect **rapport** (−3…+3) and **fear** (0…3), with caps.
- High rapport: `volunteer()` returns one gossip or side-plot fact for free.
- Rudeness: composure falls faster, but they lawyer up sooner.
- Threats: the lawyer arrives early.
- They *remember*: "Last time you called me a liar, detective. Ask nicely."

**Why it's a wow.** Your manner has consequences that you can hear, without becoming a hidden morality meter.

**How AI is used.** The model judges tone, which is subjective and bounded. The engine applies deterministic deltas, and the voice performance reflects the state.

**Fairness.**
- Tone affects **cost and willingness, never truth**.
- Every fact that can be volunteered is also reachable another way (V3).
- In ranked daily mode, tone deltas use a fixed rubric and volunteering is capped.

**Effort:** S.

### 3.3 Onion disclosure (why they can't confess too early)
**What it is.** The performer is like a method actor given script pages only as the scene requires. The engine holds every secret as a **lie ladder**; the model sees only its current rung.

| Rung | Content |
|---|---|
| R0 | Cover story |
| R1 | Fallback lie: admits the periphery, covers the core |
| R2 | Partial truth. An innocent reveals their secret, which clears them; the culprit admits presence and denies the act |
| R3 | Confession (culprit only, at the accusation) |

**Why it's a wow.** The "LLM suspects fold on question two" failure becomes impossible: they literally don't know what they'd confess. Players can try jailbreaks; there's nothing to extract.

**Effort:** M, folded into §3.6.

### 3.4 Relationships and grudges
**What it is.** The Author's relationship graph (ally, rival, lover, debtor, blackmailer) shapes:
- what `opinion()` returns;
- who covers for whom, through a **mutual-alibi lie pair** where breaking one breaks both;
- who throws whom under the bus when cornered.

A rival you've pressed hard may volunteer a *true* fact about another suspect to deflect.

**Fairness.** Opinions are labelled as opinion. Volunteered facts come from the engine and are pre-validated.

**Effort:** S–M.

### 3.5 Gossip and eavesdropping between interrogations
**What it is.**
- The suspects you aren't questioning wait as **pawns huddled on your real table**.
- After each interrogation the engine runs a **gossip tick**, a deterministic flow of information along the relationship graph:
  - Allies learn which topics you asked about and which evidence you showed.
  - Rivals learn only "you went hard on Vale".
  - Conspirators coordinate.
- The Editor LLM writes 2–4 whispered lines per event, rendered as TTS while you walk back.
- **Lean in.** Bring your head within about 0.6 m of the huddle and the whispers become audible, with subtitles: *"…she knows about the lamp. Don't mention the window."* An **Overheard** card prints.

**Why it's a wow.** It's the most AR-native moment in the design: you physically eavesdrop at your own desk. Suspects really do talk behind your back, and it changes what happens next.

**How AI is used.** The LLM phrases the whispers. Their *payload* (who told whom what) comes from the engine.

**Fairness.**
- Gossip events are deterministic given your actions, so the daily case stays comparable.
- An Overheard card is true about *what was said*. It works as an objection breaker against collusion ("You two agreed on that story"), and that breaker is pre-validated.

**Effort:** M.

### 3.6 Lies that adapt to what you've discovered
**What it is.** Each lie ladder is a small state machine. Transitions:
- **objection with a breaker** (any rung);
- **gossip awareness:** if a suspect learns you hold the R0 breaker, they **shift to R1 before you arrive**, so your old evidence no longer works;
- **pressure:** composure reaches 0 *and* you hold a supporting card;
- **empathy:** innocents only, with a prerequisite topic unlocked and rapport ≥2.

The culprit also has a **secondary, red-herring secret** that empathy *can* break, so kindness can't be used as a guilt oracle.

**Why it's a wow.** After an objection, the suspect **improvises a new lie that addresses your evidence**: "Fine. I was at the desk, but only to fetch his reading glasses." The gaze line flicks again, this time to the glasses case. The judges watch the AI adapt live, and it's still fair.

**How AI is used.** The new rung's factual payload arrives as a tool result, and the model performs the climb-down in persona: rage, tears, cold formality.

**Fairness.** V4 enumerates every order of transitions and proves each rung has a reachable breaker. **Kindness clears innocents; evidence convicts the guilty.**

**Effort:** M.

### 3.7 Breaking points
**What it is.** Three kinds of break:
- **evidence:** an objection lands;
- **pressure:** composure reaches 0 with support;
- **empathy:** innocents only.

Composure at 0 triggers a "crack" performance directed by the persona card. Three presses without evidence summon a **generated lawyer cameo** ("My client has nothing further"), and the suspect is gone for 30 minutes of the night.

**Fairness.** Break conditions are engine state. The LLM performs the break; it never decides one.

**Effort:** S.

### 3.8 Distinct voices and personalities
**What it is.**
- The Cast uses the 11 Realtime voices. The Partner runs on **Gemini Live**, a different voice family, which also gives redundancy if one provider fails.
- Casting assigns voices to spread gender, age and timbre.
- Persona cards carry verbal tics ("Vale ends lines with *darling*"; "Imran answers questions with questions"), era idiom and three anchor lines.
- **Imagen portraits** go on the dossier cards; they carry no facts, so image generation is safe here.
- **Snap3D figurine pawns** (§6).

**Fairness.** The public canon is shared across all sessions, so nobody disagrees about names, layout or weather. That is Vaudeville's bug, fixed by construction.

**Effort:** S–M.

---

## 4. Feature 3: the AI director

**What it is.** A showrunner that watches a state vector:
- the clock and real minutes elapsed;
- **coverage** of the required deductions;
- time since your last progress;
- your mistake streak and pips;
- the gossip state.

It steers a target tension curve: a midpoint turn at about 45% of the clock, then a climax near the accusation. It plays beats only from the **deck dealt at sealing**:

| Beat | Fair version |
|---|---|
| **Second crime** | Only in the deck if V8 passes. The second victim's knowledge survives in a last voicemail or diary, and the new time of death *narrows* who had opportunity |
| **Flight** | A suspect walks toward your real door. Intercept them with a pinch-hold (15 min) or let them go (their remaining testimony becomes a letter left behind). **Innocents can flee too**, over their own secret, so flight is never proof |
| **Tampering if you're slow** | The culprit wipes an object you haven't examined. Its memory now reads "wiped at 11:15", which *creates* evidence: who was free at 11:15? Rule: **the director may move evidence, never delete the last route** |
| **New witness** | A late arrival (cab driver, neighbour) with a fresh slice. The rubber band for stuck players |
| **Revelation** | A letter slides under *your real door*, or the victim's phone rings on your desk: the will, a telegram |
| **Mercy** | If you're fixated on an innocent's red herring, that innocent volunteers their secret |

**Why it's dynamic.** Two players with the same seed get different nights, and the room itself acts: your door, your desk.

**How AI is used.**
- **Casual mode:** the LLM chooses among eligible beats and writes the framing, with a reason logged.
- **Ranked daily mode:** a deterministic utility function chooses, so everyone faces the same rules, and the LLM only phrases.

**Hints.** The director decides when the partner *offers* help, using the solver's frontier of unmet deductions. It never forces help on you.

**Fairness.**
- Every beat is pre-dealt and pre-validated.
- Every intervention is shown in the case file ("Director: new witness at 11:00").

**Effort:** M for the framework and three beats; L for the full deck.

---

## 5. Feature 4: the partner (a Watson who can be wrong)

**What it is.** A recurring voiced companion. Proposed name: **Wren**. Wren:
- **recalls** anything said ("What did Imran say about the window?");
- **reasons aloud** about your theory;
- **disagrees** with you;
- offers a **hint ladder** (nudge → pointer → explicit, costing Hunches);
- notices tells in the tutorial ("Did you see her eyes go to the bottle?");
- runs **errands**: "check the kettle while I take Vale", which costs clock time but runs in parallel.

**How AI is used, and why the mistakes are fair.**
- Wren is truth-blind. Its knowledge is exactly your cards.
- The engine runs a **partial solver** over your knowledge, returning every hypothesis still consistent with what you've found.
- Wren's opinion is that set filtered through a **persona bias**:
  - **First-liar:** "She lied about the wine; she lies about murder." Wren embodies the exact fallacy the tell system teaches against, so being proved wrong *is* the lesson.
  - **Motive-first:** always the heir.
  - **Gentry-trusting:** won't suspect the Colonel.
  - **Object fundamentalist:** trusts only things, never people.
- When your evidence settles the answer, Wren converges on the truth. Wren is wrong only where the evidence genuinely allows ambiguity, so its mistakes are human-shaped and consistent.
- Wren pushes back on your accusation only when it **contradicts facts you already hold** (the engine checks this). Otherwise its doubt is opinion and labelled as such.

**Tools (Gemini Live):** `recall(query)`, `theories()`, `check_theory(who, where, what, because[])`, `hint(level)`, `comment(cardId)`.

**Why it's a wow.** It's the most *social* use of AI in the game: you argue with someone who reasons, concedes, sulks and remembers ("You trusted the vicar last time too"). For the video, Wren is the diegetic narrator and tutorial.

**Fairness.** Wren can't know the truth and never misstates an established fact. Its errors are labelled as opinion.

**I refuse** to make the partner secretly the culprit in default play. That would poison the hint channel. Offer it only as an explicit opt-in Nemesis-arc twist.

**Effort:** M.

---

## 6. Feature 5: generated evidence

| Evidence | How it's made | Fairness |
|---|---|---|
| **Letters, diary pages, telegrams, texts** | A *document spec*: `{type, author, recipient, date, mustCarry:[factId], mayCarry:[persona colour], mustNotMention:[all other entities]}`. The Editor writes it in the author's voice, on aged paper with handwriting fonts. A burnt letter's readable fragments are exactly the facts | Lexicon check plus a critic pass (a false alarm just means regenerating). **The evidence card is created from the fact ID, not the prose**, and the fact phrase glows, so the prose can't mislead |
| **Voicemails** | TTS in the **victim's assigned voice**: "Harlow, 10:32: *If anything happens to me…*". `gpt-4o-mini-tts` instructions give a breathless delivery, with room-tone sound effects | Script from the spec; audio pre-rendered at case load |
| **Receipts and tickets** | Deterministic templates, with item names written by the LLM | Fact fields are engine values |
| **Photos** | **Rendered, not generated.** A virtual camera at the object's real position in your room renders the reenactment ghost at slot T over the stand-in layout. On device, with camera permission, it can composite over a real frame: a Polaroid of *your* desk with a figure at 10:41 | Pixels come from the simulation. Imagen/DALL-E is used **only** for flavour (portraits, the victim's painting), never to carry a fact |
| **Snap3D hero object** | The stolen clock, the poisoned chalice, the victim's trophy, unique to each case. The `image` → `base_mesh` → `refined_mesh` stages play as a Polaroid developing, then a wireframe, then the solid object in the evidence box | The mesh carries no facts; its object-memory card does. Placeholder if it takes over 90 s |
| **Snap3D figurine pawns** | "Cartoonish full-body figurine of a 1940s jazz pianist in a white dinner jacket". The Clue pieces are made for your case | Flavour only, with fallback pawns |
| **Object memories** | Engine facts phrased in an "object voice" ("Cold. Untouched. 9:00 to midnight.") | Content is deterministic |

Documents can also **arrive as director beats**, physically: under your door, on your desk.

**Effort:** M for documents, voicemails and portraits; S for the Snap3D hero object and pawns (the Snap sample includes `Snap3DInteractableFactory`); M for rendered photos.

---

## 7. Feature 6: the accusation and closing argument

**What it is.**
1. **One-shot envelope.** Place WHO / WHERE / WITH WHAT. The **verdict is computed and final**.
2. **"Make your case."** Before the envelope opens, argue it: aloud on device, or by stringing 3–5 evidence cards to the three slots on a red-string board in the preview.
   - The LLM parses your speech into `{claim → deduction node, cited cardIds}`.
   - It is shown back as correctable chips ("I heard: motive = inheritance · alibi broken by the kettle").
3. **Cross-examination.**
   - The engine checks the argument against the solution graph's **required deductions** for the accused: means link, presence at the time, motive, the broken alibi, and the twist node.
   - For each gap, the **culprit's lawyer** (a live generated persona) attacks: "You say she touched the cable. Prove it."
   - You answer with a Spatial Objection, which is graph-checked. Up to three challenges.
4. **Endings by tier:**
   - **Right person, airtight case:** a **live confession**. The culprit, now with full truth unlocked because the game is over, answers *your* argument point by point. The confession is generated **per timeline slot**, so the narration lines up with the ghosts walking your room into **bullet time at 10:41**.
   - **Right person, holes in the argument:** the culprit is **defiant**: "Lucky guess, detective." They're arrested, but the headline reads "…walks free pending trial."
   - **Wrong person:** the accused protests, and *their* secret finally comes out. Then the true reenactment plays and the real culprit gloats.

**Why it's a wow.** It turns Clue's dry card flip into an Ace Attorney finale in your living room, and the confession is a performance built from your words.

**How AI is used.** The LLM parses the argument (classification is fine for LLMs), voices the defence and the confession, and directs the reenactment narration.

**Fairness.** The envelope alone decides win or loss. Argument quality changes only the ending tier and rank points. The parse is shown and correctable, and a full button path exists.

**Effort:** M for parse, coverage, challenges and the segmented confession; the reenactment is shared with the core.

---

## 8. Feature 7: endings and the epilogue

- **The Morning Edition.** A newspaper unfolds on your table.
  - **Story-sifting** scores the action log for drama: the objection that broke Vale, the moment you shouted at Imran, a wrong accusation, director beats.
  - The Editor writes a headline, the lead story and two sidebars from the top moments, **quoting your own spoken words** where available.
  - Front-page photo: the bullet-time render of your room.
  - A classified ad jokes about an object in your room.
- **Case file.**
  - Your path drawn over the solution graph against **Holmes's minimum route**.
  - **What you missed:** the innocents' secrets you never uncovered, each a one-line side-plot reveal ("Imran was skimming the gallery's takings"); **the lie you believed**; the clue you never touched.
  - Director interventions; the hash check (✓ envelope unchanged since 9:00).
- **Suspect epilogues.** One line each, shaped by rapport: "Imran sends a thank-you note. He's paid the money back."
- **Share.** A case code (skeleton plus seed), plus a postcard render. *"Same case, your room."*

**Why it matters.** It's the "Wrapped" moment people screenshot, and the full reveal closes the trust loop.

**Effort:** S for the newspaper and case file once the action log exists; M with rendered photos.

---

## 9. Feature 8: replay and meta

- **Daily case.**
  - One **skeleton** per day for everyone, generated offline with the same pipeline (Claude Code plus the fuzzer) and fetched as static JSON or bundled in packs.
  - It is mapped onto each room by affordance.
  - Performances, gossip phrasing and casual-mode director framing are live.
  - Leaderboards need a backend; Snap Cloud is in alpha, by application. Otherwise compare share codes.
  - **Effort:** S–M.
- **Recurring characters.**
  - A persistent "city" of about 30 people with local memory files. Last week's suspect is this week's witness and *remembers you*: "You accused me last time. I was innocent."
  - Carried-over rapport gives small, capped modifiers.
  - Unresolved side plots become the next case's motives.
  - **Effort:** M.
- **Detective rank.** Rookie → Detective → Inspector → Chief. Ranks unlock tell dials (labelled, plain, 80%), genres, crime types, twist templates and new partner personalities. **Effort:** S.
- **The Nemesis ("the Playwright").**
  - A Moriarty who *writes your cases*. It builds a **habit profile** from your logs:
    - first-accused bias;
    - whether you believe first statements;
    - over-pressing;
    - neglecting objects;
    - dependence on the partner;
    - never checking innocents' secrets;
    - being kind to charming suspects.
  - It then writes a **brief** for the Author: "culprit with the weakest apparent motive"; "critical route through the object type you ignore"; "a charming culprit".
  - It leaves a calling card at sealing ("I know you trust your first instinct, detective") and taunting voicemails as director beats.
  - **At the end it reveals which habit it exploited.** After about five cases, a Nemesis case puts the Playwright among the suspects.
  - **Fairness:** the brief only changes generation parameters. Every case must still pass V1–V11. The taunts are opinions, never facts.
  - **Effort:** M (profile plus brief), L (with the arc).

---

## 10. Feature 9: how multiplayer changes with AI

| Mode | What AI adds | Fairness | Effort |
|---|---|---|---|
| **Clue Night** (2–4 Specs, co-located) | Shared live suspects who **play detectives against each other** ("Your colleague promised me immunity"); gossip includes what *each* detective did; per-detective lie ladders; optionally the tell is shown only on the interrogator's device | Same sealed truth; sync `seed + action log`; private cards on the intended device only | L |
| **Party mode with an AI game master** | One Specs wearer sees ghosts and tells; phone players hold refutation cards and documents; the AI GM narrates, deals, paces, voices suspects and runs refutations. Asymmetric information forces people to talk | The engine adjudicates everything; the GM only performs | L (web companion and relay) |
| **Hidden human accomplice, coached by AI** | One phone player is secretly the accomplice. The AI coach whispers privately: misdirection *consistent with public facts* (so it can be checked), when to spend one of two **lie tokens** on a refutation, and live advice ("They're onto the kettle; push the window"). Detectives get one "call the accomplice" badge (Deception). **The human's face is the tell**: L.A. Noire with your friend | The engine logs every accomplice lie; the coach can't create facts; full reveal at the end | L |
| **AI rival detectives** | Solo players get Clue's AI opponents with personalities: ghost detectives in your room who make suggestions, steal leads and trash-talk. Solver-driven with a bias, voiced by the LLM | Rivals see only their own cards | M |
| **Remote ghost race** | Same daily case, different rooms; your friend's detective ghost appears at whichever suspect they're questioning | Same skeleton | M–L (backend) |
| **Co-op roles** | Forensics (ribbon and objects) and interrogator (tells); the partner relays between them | Same truth | L |

**My pick:** the **hidden accomplice with an AI coach** is the best multiplayer idea here. The AI's role is genuinely new (a private strategist for a human liar), and the tell system turns onto real faces. It belongs after the hackathon.

---

## 11. Effort summary (ideal version)

| Feature | Effort |
|---|---|
| Room reading and casting (photo route + device vision) | M |
| Author + planner + generate/validate/repair + variation templates | L |
| Live grounded suspects (Realtime + tools + firewall + cards) | L |
| Tone memory · relationships · breaking points | S · S–M · S |
| Onion disclosure + adaptive lie ladders | M |
| Gossip and eavesdropping | M |
| Voices, personas, portraits | S–M |
| Director (framework + 3 beats / full deck) | M / L |
| Partner with biased partial solver | M |
| Generated documents and voicemails / rendered photos / Snap3D hero and pawns | M / M / S |
| Closing argument + cross-examination + segmented confession | M |
| Morning Edition + case file + hash check | S |
| Daily skeletons · recurring cast · rank · Nemesis | S–M · M · S · M–L |
| Multiplayer modes | M to L each |

---

## 12. Opinionated ranking

### Top 10 for the ideal version
1. **Live grounded suspects**: Realtime voice, tool-call testimony, claim cards, fact firewall, onion disclosure. *This is the game.*
2. **A case cast from your room** by generate → validate → repair, with room hooks shaping the story and the sealed hash.
3. **Adaptive lie ladders and breaking points**: suspects improvise new, fair lies after an objection; kindness clears innocents, evidence convicts.
4. **Gossip and eavesdropping**: lean in to overhear the pawns on your desk; alliances, warnings, collusion cards.
5. **Wren, the biased-but-fair partner**: reasons, disagrees, is characterfully wrong, and teaches "lying ≠ guilty" by getting it wrong.
6. **Closing argument and live confession** over bullet time, including the "right person, weak case" defiant ending.
7. **The director's dealt beat deck**: tampering *creates* evidence, flight isn't proof, the letter arrives under your real door.
8. **Generated in-character evidence**: the victim's voicemail, rendered Polaroids of your room, a Snap3D hero object and figurine pawns.
9. **The Morning Edition and case file**, quoting your words, revealing what you missed, verifying the hash, with a share code.
10. **The Nemesis**, who learns your habits and writes your next case, with recurring characters who remember you.

Next after these: the hidden accomplice with an AI coach.

### The 5 that must be in the hackathon build
This assumes the research's deterministic core: envelope, refutation round, clipboard notepad, objection, reenactment.

| # | Must-have | Thin slice for Nov 10 | Days |
|---|---|---|---|
| 1 | **Live grounded suspects** | Realtime with `testify`/`elaborate`/`small_talk`; claim cards; gaze-line tell + one more; composure and lawyering up; two onion layers. Chips or typed text in the preview (mic if the Oct 26 test passes); cached lines as the fallback. **This replaces the research MVP's writing pass + TTS caching + topic classifier, so it isn't net-new work** | 3–4 |
| 2 | **A case cast from your room** | Gemini on a still photo of a real room; one crime family (murder) with two twist templates (straight, staged weapon); LLM-invented cast, relationships, secrets and motives; planner; V1–V7 + V9; R1–R6 + one LLM repair; two parallel candidates; casting shown on screen; sealed hash. **A hand-checked hero seed for the main take**, plus a live-generated second case as proof | 5 (shares the engine with the core) |
| 3 | **Adaptive lie ladder** | Culprit 3 rungs, innocents 2; an objection advances the rung and the suspect voices the new lie live. Stretch: one gossip-driven pre-emptive shift with an overhearable whisper | 2 |
| 4 | **Wren, the partner** | Gemini Live voice; `recall`, `theories` (first-liar bias), `check_theory`, `hint`. Doubles as the tutorial and the video's narrator | 1.5 |
| 5 | **Closing argument → confession → Morning Edition** | Argument from 3 cards (preview) or speech (device); coverage check; up to 2 lawyer challenges; slot-segmented live confession over bullet time; a newspaper from one LLM call on a template | 2.5 |

**Honest budget.** With the Clue core (about 4–5 days with its minimum suggestion round and grid), staging via MCP (2 days) and the video and write-up (1.5 days), the total is **about 19–20 days against about 15**.

It fits only if these are cut:
- "Liar!" on refutations;
- the palm notepad (use the clipboard);
- device vision;
- the gossip stretch;
- rendered photos;
- Snap3D (a cheap bonus only if it is reliable on the first try).

**Two kill rules:**
- If **Realtime + tools isn't working in the preview by Oct 28**, drop to chat + TTS with cached hero-case lines.
- If **generation isn't valid end to end by Nov 1**, ship the hero case plus two curated skeletons that the LLM re-skins. That keeps cast, voices and premise different every run, just not the structure.

**Changes to the demo arc:**
- Add "same question, different words, same card" side by side.
- Show the suspect's improvised second lie with the gaze line flicking again.
- Show Wren being wrong ("she lied about the wine…").
- End on the hash check ✓ and a two-second cut to a **second room with a different case**.

**Pitch line:** *"The rival's case is written once. Ours is written by your room, every night, and it can prove it played fair."*

---

## 13. What I'd refuse to do, and why

1. **A culprit that shifts to fit the player.** No case where the culprit is decided late, or changes to match whoever you suspect. It's the most common "AI mystery" trap. It destroys the one-shot accusation, the daily case and any reason to reason. The hash exists to prove we never do it.
2. **Any LLM as judge** of contradictions, breaks, verdicts, or whether your argument was "good enough" to win. The Turnabout evidence is clear, and fairness can't depend on a sampling temperature.
3. **Jailbreak-to-win.** Talking a model into confessing is prompt injection, not detection. The onion design leaves nothing to extract, and the engine owns every break.
4. **Probabilistic or model-chosen tells by default.** L.A. Noire's best-known flaw. The 80% Noir dial is an opt-in for veterans only.
5. **Generated images or meshes as fact-bearing evidence.** Imagen can't be trusted to show where the cable lay. Facts come from renders, cards and specs.
6. **Casting people or private things from the room.** No faces, roommates, photos of people, religious items, medication, children's belongings or legible documents. No OCR of personal paper. No room frames uploaded without the permission prompt. **No cloning real people's voices.**
7. **A partner who is secretly the culprit** in default play. It would poison the hint channel; opt-in Nemesis arc only.
8. **Sprawl.** No more than 5 suspects in a 51° field of view, no open-world city during a case, no unbounded generation. Small casts make deep characters.
9. **Faking it, either way.** No claiming pure-LLM magic while hiding the engine; the engine is the selling point. No passing off a fully scripted video as live; label the hero seed honestly.
10. **Darkness as design.** Black is transparent. No horror built on dark rooms; noir is drawn in light.
11. **Free, infinite questioning.** The clock stays. Without a cost, the best strategy is to ask everything, which isn't detection.

---

## Sources checked for this design

- [Snap: Remote Service Gateway](https://developers.snap.com/spectacles/about-spectacles-features/apis/remoteservice-gateway?lang=en-US): services list; chat completions non-streaming; Gemini Live model restriction; Snap3D may need extended response times; sensitive-data permission note.
- [Snapchat/Spectacles-Sample](https://github.com/Snapchat/Spectacles-Sample) (MIT):
  - `AI Playground/Assets/Scripts/OpenAIAssistant.ts`: `gpt-4o-mini-realtime-preview`, `tools` in `session.update`, `function_call` handling, voice `coral`.
  - `GeminiAssistant.ts`: Live `function_declarations`, `toolCall`, voice `Puck`.
  - The AI Playground README: Realtime and Live over WebSocket; run Preview as "Spectacles (2024)".
  - `Agentic Playground/Context/remote-service-gateway.md`: Snap3D `image` / `base_mesh` / `refined_mesh` stages and `image_b64` input.
- The Remote Service Gateway package's `OpenAITypes.ts`, already in this scratchpad from an earlier pass: Realtime `instructions`/`tools`/`tool_choice` and 11 voices; chat `json_schema`; TTS `gpt-4o-mini-tts` with `instructions`. Typed, not tested.
- [Lens Studio: previewing your Lens](https://developers.snap.com/lens-studio/lens-studio-workflow/previewing-your-lens) and the [Audio Analyzer docs](https://developers.snap.com/lens-studio/features/audio/audio-templates/audio-analyzer): the preview has a microphone toggle. Not tested with Realtime.
- Background evidence (Vaudeville, The Deposition, Turnabout, MuSR, OpenAlibi, AI Alibis, the Three Clue Rule) as cited in the Roomscript research note.
