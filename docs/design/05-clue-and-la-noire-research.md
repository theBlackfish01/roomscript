# Roomscript research: Clue meets L.A. Noire, in your room

Research date: 2026-10-25 (Asia/Karachi). Prepared for the Snap "Learn AR with SPECS" hackathon, which closes on 2026-11-10.
Status: assistant research and proposal. Wadood has adopted none of it yet.
Search tools: built-in WebSearch and WebFetch, and the GitHub CLI. Exa, Tavily and Consensus were not used.

Wadood's references, as confirmed through the coordinator on Oct 25:
- **Interrogation game: L.A. Noire.** This is the main reference for the interrogation core.
- **Board game: Clue (Cluedo).** Other investigation games are secondary references.
- He would also like a **multiplayer option**.

---

## 0. Bottom line

1. **What L.A. Noire teaches.** The faces were not the real lesson. What mattered was making *the read* the gameplay. The game then lost players because its buttons didn't say what they would do, and because the tells were unreliable. An AR version should keep the read and make it deterministic and learnable:
   - **Tells:** each suspect gets one signature tell. You learn it from a baseline question, and it always fires on a lie.
   - **Verbs:** the three choices say exactly what they do: **Believe / Press / Object**. You can preview the detective's line before committing.
   - **Lies and guilt are separate.** Innocent suspects lie too, about their own secret, so a tell tells you *that* someone is lying, not *who killed*.
2. **What Clue teaches.** Clue's lasting idea is the **private refutation**: information reaches you one card at a time from someone else's hand. In Roomscript your **real objects become the other players**. Stage a suggestion such as "Vale, at the desk, with the cable". Then, going clockwise round your room, the first object or suspect that can disprove it shows you one card. Objects always tell the truth. Suspects may lie when they refute, which ties straight back to the L.A. Noire tells.
3. **The LLM decides nothing.** Use the LLM when the case is written and the engine during play:
   - When a case loads, one LLM call per suspect writes every line that suspect can say, followed by a critique pass.
   - During play, the LLM only maps a free-form question to a topic the engine already knows. Buttons skip that step entirely.
   - This one decision deals with four problems at once: gateway latency, hallucinated facts, the "LLM suspects confess on question two" failure, and the need for a deterministic preview video.
4. **Scope.** Cut the line-of-sight objection. Merge the time ribbon into the final reenactment. Hand-check one hero case for the demo, and treat the generator as proof that the system scales.
5. **Multiplayer.** Leave it out of the core game.
   - **Stretch goal:** "Clue Night", two detectives in one room on Spectacles Sync Kit. Only the seed and the player actions need syncing, because every device runs the same deterministic engine. It is showable as two Lens Studio Preview panels side by side.
   - **Later:** a party mode in which friends hold their Clue cards on phones, with an optional hidden accomplice.
   - The **daily case code** is a nearly free "same case, your room" duel, and can ship either way.

---

## 1. The games Wadood means

### 1.1 Before he confirmed (kept for the record)

From his wording, my ranking had been:
- **Board game:** (1) Clue/Cluedo, because it is the board game everyone knows and he said "the board game"; (2) Chronicles of Crime; (3) Sherlock Holmes Consulting Detective or Detective: A Modern Crime Board Game; (4) Hunt A Killer and Unsolved Case Files, which are the "more expensive", premium physical-evidence boxes.
- **Interrogation game:** (1) L.A. Noire, the most famous game built around interrogation; (2) the October 2026 Roblox hit "Interrogation [AI🔎]", where you literally "just ask a bunch of questions"; (3) *Interrogation: You Will Be Deceived*.

Both confirmations match my first picks. The Roblox game is still worth knowing, because it is the current viral version of free questioning (§1.5).

### 1.2 L.A. Noire: the main interrogation reference

**Facts.**
- Released in 2011 by Team Bondi, published by Rockstar Games.
- Shipped 4 million units in its first month and 7.5 million by September 2017.
- Metacritic: 89 on PS3 and Xbox 360.
- Remastered in 2017 for PS4, Xbox One and Switch.
- *L.A. Noire: The VR Case Files* (seven cases) followed on 15 December 2017.

Source: Wikipedia.

**MotionScan.**
- Built by Depth Analysis, Team Bondi's sister company.
- The head rig used 32 cameras in stereo pairs and assembled a full 3D head from 16 patches.
- Raw data ran at about 1 GB/s and was compressed to roughly 1 KB/s in the game.
- Over 400 actors were captured.
- Only three heads could talk at once, so silent characters were rendered facing away from the camera.

Sources: MCV/Develop, Wikipedia.

#### How the system works

1. **The investigation fills the notebook.**
   - Cole Phelps searches a scene. A musical chime and controller rumble signal nearby clues, and the music resolves when the last clue is found.
   - Clues, people and places are logged automatically in the **notebook**, which has People, Places and Clues tabs.
   - Each interviewee's questions come from the notebook, so you can only ask about what you have found.
2. **A question gets an answer, which you must judge.**
   - You pick a question and watch the MotionScan performance.
   - Then you choose one of three responses:

| Original (2011) | Remaster (2017) | What it does |
|---|---|---|
| **Truth** | **Good Cop** | Accept the statement, or coax it gently |
| **Doubt** | **Bad Cop** | Push back without evidence. Cole often explodes at this point (see below) |
| **Lie** | **Accuse** | Call it a lie and **select a piece of evidence from the notebook that proves it** |

3. **Evidence backs the accusation.**
   - Choosing Lie or Accuse opens the evidence list. You must pick the specific item the designers intended.
   - The right item gets a confession or new information. The wrong item counts as a failed question.
   - Players report that you can back out of a Lie to Doubt at no cost.
   - Critics note that "which evidence counts" follows the game's own internal logic, which doesn't always match what a player would reasonably expect (CGMagazine, Push Square).
4. **Feedback and scoring.**
   - A right answer plays a positive sting and marks the question correct. A wrong one plays a negative sting and marks it failed.
   - The game shows visual and audio cues and scores each interview as it ends (Giant Bomb user review).
   - The case ends with a **five-star rating** built from the investigation, the interrogations, and driving or property damage.
   - On the Homicide desk you choose which of two suspects to charge. Charging the "wrong" one lowers the rating.
5. **A missed question doesn't end the case.**
   - The case continues on rails.
   - A failed question closes that line of inquiry for good, with no backtracking. That can lose information or a lead, but the case always moves on to an arrest.
   - Push Square calls this "opens and closes paths". Gamecritics says one slipped finger can sabotage a case, because there are no manual saves.
   - Critics also complain of a "lack of significant penalty" (GameZone) and say the interrogations feel "passive" (OXM).
6. **Intuition points.**
   - You earn one per rank-up and can hold up to five.
   - You can spend one to:
     - **Remove an Answer** in an interrogation,
     - **Ask the Community**, which shows the percentage of other Social Club players who picked each answer, or
     - **Show All Clues** at a crime scene.

   Sources: Wikipedia, Prima eGuide.
7. **Face-reading tells.**
   - The intended reading: liars break eye contact, fidget, smirk or swallow, while truthful characters hold your gaze.
   - The performances are real actors captured whole, so there is no explicit tell system underneath. The tell is simply whatever the actor did.

#### The Doubt problem and the rename

- **Where it came from:** during scripting the choices were **Coax / Force / Lie**, and the dialogue was recorded for "Force" (Destructoid, Shacknews).
- **What went wrong:**
  - "Force" was renamed "Doubt" late in development.
  - Players meant mild scepticism, but Cole would berate, threaten or even insinuate a murder charge.
  - Director Brendan McNamara reportedly said the actor went "a little bit psycho" on some questions.
  - It became a long-running joke: "a source of much surprise and many a joke" (Shacknews).
- **The fix:** the 2017 remaster renamed the choices **Good Cop / Bad Cop / Accuse** so the labels matched what Cole actually does (Windows Central, GameRevolution, Destructoid).
- **Why the fix fell short:**
  - Kotaku argued that "good cop" and "bad cop" are too broad: good cop could mean believing *or* just being friendly, and bad cop could mean anything from grumpiness to threats of violence.
  - Kotaku proposed **Believe / Doubt / Accuse**, or **hovering over an option to preview Cole's exact line**.
  - Slant noted that every question still had exactly one correct reaction.

#### What critics and players praised

- The faces, which were praised almost universally. Steve Boxer called them "more convincing facial animation than we have ever seen in a game."
- The interrogations themselves. Game Informer called them "the most compelling aspect of L.A. Noire", and IGN and Giant Bomb compared them to dialogue-heavy RPGs and Mass Effect.
- The tension of watching a face, and the feeling of being a detective, with no meters on the HUD (Significant Bits).

#### What frustrated them

- **Tells were unreadable.**
  - Edge said that despite the technology it was often impossible to tell a guilty smirk from a Mona Lisa smile.
  - Actors over-performed shiftiness, so honest people often looked guilty.
  - The tells were never consistent from one character to the next.
- **The choices were vague and sometimes illogical** (Edge). Players failed because they couldn't express their reasoning through three buttons, not because their reasoning was wrong (Significant Bits).
- **Only one answer was right, and the evidence was a guessing game.** You had to guess which item the designer wanted.
- **No backtracking.** Choosing Truth could close a topic you wanted to dig into.
- **Penalties were weak.** The case continued anyway, and some players felt forced to charge a suspect the evidence didn't support (GameSpot user review).
- **Investigations felt like an Easter-egg hunt**, with the music cue handing you the clues (Game Informer).

#### What an AR, LLM-driven version should keep and fix

| L.A. Noire | Keep | Fix in Roomscript |
|---|---|---|
| Watching the face is the gameplay | ✅ The read | Tells are **authored and deterministic**: one signature tell per suspect, taught by a **baseline** question, firing on 100% of lies. They are drawn big enough for additive AR (see §4.6) |
| Truth/Doubt/Lie → Good Cop/Bad Cop/Accuse | Three verbs | **Believe / Press / Object.** Press asks for specifics and never accuses. Object needs evidence. **Hovering shows the exact line** before you commit |
| Lie needs evidence from the notebook | ✅ | Evidence is **pulled from your real objects** and dragged onto the statement (Spatial Objection). The **case graph** decides whether it fits, so several valid proofs are accepted |
| Notebook generates the questions | ✅ | The notepad generates **question chips**, which double as the button fallback. Free voice questions map onto the same topics |
| A failed question closes the topic forever | ❌ | Nothing closes. The cost is **time**: 15 minutes of the night per question, with suspects leaving at midnight. A wrong objection costs a **credibility pip** |
| Weak penalty, case on rails | Partly | Real stakes (pips, clock, a one-shot accusation) but **no soft-locks**. The solver guarantees every critical fact can be reached by at least two routes |
| Intuition points | ✅ | **Hunches**, earned by correct objections. Spend one to highlight which statement is a lie, to strike a zone or object from the grid, or, later, to "Ask the city" (the share of daily-case players who believed a statement) |
| Five-star case rating | ✅ | A "Holmes rating" that compares your clock use to the solver's minimum route, plus pips remaining |

### 1.3 Clue (Cluedo): the board-game reference

**Facts.**
- Devised by Anthony E. Pratt during the Second World War and patented in 1947.
- Launched in 1949 by Waddingtons in the UK, and by Parker Brothers in the US as *Clue*.
- Widely quoted as having sold about 150 million copies. This is attributed to a 2023 Hasbro release I couldn't verify; country counts in the sources conflict.

Sources: Wikipedia, coopboardgames.com.

#### Core structure, and how each piece carries into AR

| Clue element | Rule | Roomscript translation |
|---|---|---|
| **The envelope** | One suspect, one weapon and one room are secretly put in the envelope: 6×6×9 = 324 combinations | A sealed holographic envelope floats at the centre of your room with three slots: **WHO / WHERE / WITH WHAT**. Proposed scale: 4 suspects × 5 zones × 5 objects = 100 combinations |
| **Rooms** | 9 rooms on the board; corner rooms have secret passages | Your real room is split into **4–6 zones** you tag at setup, each given a Clue-style name: desk → Study, bed → Lounge, doorway → Hall, window → Conservatory |
| **Weapons** | Candlestick, knife, lead pipe, revolver, rope, wrench | **Your real objects**, tagged by type: cord (charger cable = the rope), blunt (lamp, mug), sharp (scissors), poison (a bottle), heavy (books). The generator assigns roles by type, so any room works |
| **Suggestion** | You must be *in* the room. Name a suspect and a weapon; their tokens move into the room | Grab a suspect's miniature from the table and drop it in a zone with an object token: "Vale, in the Study, with the cable." It costs 15 minutes of the night |
| **Refutation** | Clockwise, the first player who can disprove it **privately shows one card** | Clockwise round your room, the first **object or suspect** that can disprove it shows you **one card**. For example, the kettle glows: "Vale was beside me from 10:30 to 10:45." This is "objects testify" turned into a rule. **Objects never lie; suspects may.** If nobody refutes, that is a big lead, just as in Clue |
| **Detective notepad** | A grid of every card for tracking eliminations | A palm-up notepad (or floating clipboard) holding the **Clue grid**, which crosses itself off automatically when a card is shown, as in Marmalade's Clue app. A **Statements** tab collects each suspect's claims with tell markers, and is the ammunition for objections |
| **One-shot accusation** | Check the envelope; if wrong you are out of the game but still refute for others | Walk to the envelope and place the suspect, zone and object. **One shot on the daily case.** A wrong accusation still plays the true reenactment, so you learn the answer |
| **Dice and movement** | Movement is random | Replaced by **the clock**. Each question or suggestion costs 15 minutes, and suspects leave at midnight. This is the anti-brute-force layer (see §2) |

#### What the variants and digital versions added

These are worth borrowing from.

- **Clue Master Detective (1988):**
  - 10 suspects, 8 weapons (adding poison and a horseshoe), 12 rooms, up to 10 players.
  - *Lesson:* scale is a dial. Keep it small for a 51° field of view and a three-minute demo.
- **Cluedo: Discover the Secrets (2008):**
  - Intrigue cards: Keepers give one-off powers; Clocks eliminate the player who draws the eighth one, in which case the murderer "strikes".
  - Accusations can only be made from the central room.
  - *Lesson:* a shared doom clock, and accusing from a single place (our floating envelope).
- **2016 update:** Dr. Orchid replaced Mrs. White.
- **2023 relaunch:**
  - New cast with backstories: Chef White, Mayor Green, Solicitor Peacock, and victim Boddy Black.
  - Every character now has a motive to kill Boddy.
  - Special **Clue cards** give advantages, for example forcing "the guiltiest-looking player" to reveal a card (Wargamer, Hasbro release).
  - *Lesson:* motive-rich suspects. This fits the means/motive/opportunity engine.
- **Clue: Treachery at Tudor Mansion (2022–23):**
  - A co-operative, one-time "escape and solve" game: you move to numbered spots and draw puzzle, clue, narrative, item and overlay cards. Hints are at the back of the booklet.
  - *Lesson:* overlay cards that reveal hidden information when laid on something. In AR, an "object memory" overlay on your real item does the same job.
- **Clue Escape: The Illusionist's Club:**
  - Another one-time solve. The board is built room by room as you unlock it.
  - *Lesson:* reveal your room's zones progressively ("the Study is now open").
- **Clue Conspiracy (2023):**
  - A secret-role game for 4–10 players. The Friends try to keep Mr. Coral alive and work out the who/where/what; the Conspiracy sabotages them and sets traps.
  - Optional companion web app.
  - *Lesson:* a template for a later hidden-role mode.
- **Clue Liars Edition (2021):**
  - Each turn you play an Investigation card that forces you to tell the truth or to lie. Anyone may slap the Liar button.
  - Caught lying, you give up an Evidence card. A wrong call costs the caller a card.
  - *Lesson:* **suspects can lie when they refute, and you call "Liar!"**, which is where L.A. Noire's tells meet Clue's refutation.
- **Marmalade's Clue/Cluedo: The Classic Mystery Game (2016 mobile, 2018 Steam and Switch):**
  - AI opponents, cross-platform online play, paid theme packs.
  - A review complained the notes sheets were cramped.
- **Marmalade's Clue (2023/24):**
  - *Classic Mode*; a quicker *Clue Cards* mode, said to roughly halve game length; and the exclusive *Ultimate Detective* mode, where everyone answers suggestions **simultaneously and in secret** and you "interrogate suspects directly".
  - New crime scenes: Polar Research Station, Black Adder Resort and others.
  - Dealt cards are crossed off automatically. App Store rating 4.8 from about 4.1K ratings.
  - *Lesson:* the official digital Clue is already moving towards interrogation, which supports "Clue meets L.A. Noire".

**Where Clue falls short, and what fills the gap.** Clue has no interrogation depth, no narrative, and no reason for a refutation to exist; a card is just a card. Roomscript fills those gaps with:
- L.A. Noire's interrogation;
- Chronicles of Crime's rule of asking anyone about anything, plus its clock;
- Ace Attorney's present-evidence-against-testimony;
- MuSR-style means/motive/opportunity, so every refutation card is a *fact from a simulated night*, not an arbitrary deal.

### 1.4 Secondary investigation board games

These fill the gaps Clue leaves.

- **Chronicles of Crime** (Lucky Duck Games, 2018). Every person, item and place has a QR code.
  - **To question someone, you scan an item or person card while talking to them.** You can ask anyone about anything.
  - An in-app clock charges about 5 minutes per interview and 20 per trip, and *even an irrelevant scan advances time*. Faster solves score higher.
  - Time of day opens and closes access to locations and characters.
  - VR scenes: you get about 40–45 seconds to look at a 3D crime scene and describe it to your team, who match the description to evidence categories.
  - Criticisms: scanning becomes tedious; evidence cards lack specificity.
  - **Steal:** "ask anyone about any object" (pinch an object while a suspect is active = ask about it), the time cost on every query, and time-of-day gating.
- **Sherlock Holmes Consulting Detective** (1981; Space Cowboys reprint).
  - You read leads from a London directory and map, answer quiz questions at the end, and **compare the number of leads you used to Holmes's**.
  - **Steal:** the "Holmes rating" against the solver's minimum route.
- **Detective: A Modern Crime Board Game** (Portal Games). Leads cost hours from a limited budget, and the Antares online database lets you look up records.
  - **Steal:** the time budget as stakes, and a searchable archive (which could be the time ribbon).
- **Hunt A Killer / Unsolved Case Files.** Premium boxes of physical documents and props.
  - **What replaces this in AR:** your room *is* the box. Evidence cards are pulled from your objects; there are holographic dossiers, a chalk outline on your floor, and tape across your door.
- **MicroMacro: Crime City** (Spiel des Jahres 2021). A giant illustrated map where you trace a crime across moments in time.
  - **Steal:** the time ribbon as a visual search ("find Vale at 10:30").
- **Deception: Murder in Hong Kong.**
  - One player is secretly the Murderer and picks one Means and one Key Evidence from their own face-up cards.
  - The Forensic Scientist knows the answer but can only hint with scene tiles.
  - Each investigator has **one badge, a single accusation**.
  - Optional Accomplice and Witness roles.
  - **Steal:** for the later hidden-role multiplayer mode.

### 1.5 Secondary interrogation and deduction video games

| Game | Core mechanic | Steal |
|---|---|---|
| **Ace Attorney** | Cross-examination: **Press** any statement for detail, **Present** evidence at the contradictory line; a penalty bar punishes wrong presentations. Psyche-Locks show resistance as chains that break with each correct piece of evidence | Press/Present maps directly onto Press/Object. Visible resistance appears as the composure ring |
| **Danganronpa** | Nonstop Debate: statements float through space and you **shoot Truth Bullets** at weak points | Statements as floating cards in your room that you throw evidence at. This is an AR-native mechanic |
| **Interrogation: You Will Be Deceived** (2019) | Choose questions and approach (empathy, guile, intimidation); fear and openness meters (heart rate, pupils); suspects resist harder as you close in | Approach and tone as a risk dial (pressure versus lawyering up) |
| **Her Story / Telling Lies** | Keyword search of a video database that **shows only the first five results** | A natural anti-brute-force limit |
| **The Case of the Golden Idol** | Word-bank fill-in deduction; confirms a section **only when two or fewer fields are wrong** | Confirming in batches prevents trial and error |
| **Return of the Obra Dinn** | Fates confirmed **three at a time** | Same principle |
| **Shadows of Doubt** | A simulated city where citizens have real schedules; clues are traces of what actually happened | Validates the truth-first simulation |
| **Roblox "Interrogation [AI🔎]"** (J BOIS, Aug 2026) | Type any question to an AI suspect; **10 questions** to get a confession; "push too hard and they shut down, go too easy and they keep lying"; 6 cases plus a daily case; custom cases. Third-party tracker figures: **5.9M visits, 152K favourites, peak 9K concurrent players (Oct 2026)** | The current viral version of free questioning. Steal: a hard question budget, shutting down when overpressed, the daily case |
| **Roblox "AI Interrogation"** (TrueTalk AI) | 10 tries, 6 base cases plus a daily case. A fan wiki's strategy: lock in the timeline, quote earlier answers back, keep two tries for the final push | Free questioning rewards timeline-locking; the notepad should support it |
| **Uncover the Smoking Gun** (KRAFTON/ReLU, 2024, GPT robots) | Free typed questioning plus point-and-click evidence; Steam rating "Very Positive" (about 360–420 reviews in two snapshots). Reviewers: "The detective dynamics are basic, but work well"; **suspects often misread questions**, so the reviewer avoided interrogating | Free text needs a robust intent layer, otherwise players give up on it |
| **Vaudeville** (Bumblebee, 2023, Inworld voices) | Free voice and text questioning in a 1920s town | Cautionary: **inconsistent facts** (the police chief and coroner give different names and each insists), looping, repeated stalling, emotionless voices, API outages during a big stream, and a large Inworld bill (KeenGamer, the developer's pre-mortem). Reviews split down the middle |
| **Dead Meat** (Meaning Machine) | Ask a suspect anything by voice or keyboard; "author-led machine learning" with a professionally written script; "read her mind"; a countdown clock and limited interrogation tools | Authored truth with free language is the right pairing |
| **Doki Doki AI Interrogation** (2024, ChatGPT) | Interrogate an AI suspect whose "emotional circuit" raises its heart rate until it confesses; 81% positive of 488 reviews | A visible rising pressure signal |
| **The Last Question** (browser) | Hidden Pressure, Trust and Consistency meters; score = number of messages needed to crack the suspect; leaderboard | Score on efficiency |
| **AI Alibis** (open source, see §3) | Claude suspects; each response goes through critique, then refinement | The guardrail pattern |
| **NVIDIA/Inworld Covert Protocol** (GDC 2024) | A detective "social engineering" demo using GPT-3.5, ElevenLabs, Riva ASR and Audio2Face | A tech showcase rather than a design lesson |

---

## 2. Mechanics worth stealing, organised by problem

**How suspects are pressured.**
- L.A. Noire uses accusation backed by evidence.
- Interrogation: YWBD uses approach meters; Roblox uses "press too hard and they shut down"; Doki Doki uses a heartbeat.
- **Roomscript:** a visible **composure ring**.
  - Press costs a segment.
  - A correct objection drops several segments and makes the suspect break: the lie is replaced by the truth, plus a new lead.
  - Pressing three times without evidence makes the suspect **lawyer up**, leaving for 30 minutes of the night.
  - The engine owns all of this state; the LLM only voices it.

**How evidence is presented.**
- Ace Attorney presents evidence at a statement; Danganronpa fires bullets at weak points; L.A. Noire picks evidence from the notebook; Chronicles of Crime scans a card at a person.
- **Roomscript:** pinch a real object to pull out an **evidence card** (an object memory, shown as a Polaroid of a silhouette at a time). Then **drag it onto the statement card**, or the reverse.

**Keeping free questioning fair.**
1. Every fact needed to solve the case is reachable through **chips** generated from the notepad, so voice is optional.
2. A free question is only mapped onto a **closed topic set**: time slot, person, object, zone, motive or relationship.
3. Questions the engine can't place get an in-character deflection. These still cost five minutes, to discourage spam.
4. Never let the LLM invent facts. Lines are written when the case loads and checked against the claim.

**How contradictions are caught.** The engine decides: statement claim C conflicts with fact F in the graph. **Never let an LLM judge this.**
- The Turnabout LLM benchmark (Ace Attorney and Danganronpa contradictions) reports that **no LLM exceeded 40% accuracy** at choosing the contradicting evidence–testimony pair at the time it was written.
- The whodunit-voice repo uses an LLM "judge" for accusations. Avoid that.

**Preventing brute force.**
- The clock: 15 minutes per question or suggestion, as in Chronicles of Crime.
- Hard budgets, as in Roblox's 10 questions.
- Pips for wrong objections, like Ace Attorney's penalty bar.
- One-shot accusations, as in Clue and Deception.
- Batch confirmation, as in Golden Idol and Obra Dinn, for an optional "file a theory" step.
- A Holmes-rating score on efficiency.

**Notebook and deduction board.**
- Clue's grid with automatic crossing-off (Marmalade).
- L.A. Noire's notebook generating questions.
- A Statements tab with tell icons; quoting earlier answers is how players beat AI suspects.
- A timeline lane per suspect: the time ribbon in miniature.

**Accusation and scoring.**
- A one-shot envelope, then a reenactment of the true night.
- Stars from clock efficiency against the solver's minimum route, pips left, and objections landed.
- AI Alibis' end quiz (who, why, how) is a good optional "case report" for extra stars.

### What AI-interrogation players praised and what frustrated them

- **Praised:**
  - Asking anything feels natural (KeenGamer on Vaudeville, Smoking Gun reviews).
  - Conversations vary between playthroughs.
  - A sceptical 404 Media writer came away convinced, after a demo, that LLMs can be fun and additive in games (Verbal Verdict).
- **Frustrations, and the matching fix:**
  - **Suspects confess too easily.** A Devpost write-up for "The Deposition" reportedly found that LLMs "want to confess", with early suspects folding on question two. The page returned 403 to me, so this comes from a search summary. Prompt rules didn't help; what worked was structure: a concrete secret, a motive with a real cost, and **one explicit breaking condition**.
    → Roomscript's suspects never decide to confess. The engine breaks them only on a correct objection.
  - **Hallucinated or inconsistent facts:** Vaudeville's chief and coroner giving different names; robots inventing details about evidence.
    → Pre-written claim lines plus a critique pass. The live model never sees the truth.
  - **Misread questions** (Smoking Gun).
    → A closed topic set, a confirmation chip ("Asking about: the lamp at 10:41?"), and buttons.
  - **Aimlessness:** "questioning to nowhere", being gated on unknowable lines.
    → The notepad always shows open leads; Hunches as hints.
  - **Latency and stalling:** Vaudeville's NPCs repeating the question back.
    → Lines written in advance; at most one short LLM call per question to map it to a topic; a "thinking" idle animation.
  - **Cost and outages** (Vaudeville pre-mortem).
    → Cache the daily case, and fall back to buttons if the gateway fails.

---

## 3. GitHub repos

**Licence rule:** code may only be copied from MIT, Apache or BSD repositories. GPL, AGPL, "other" and unlicensed repos are inspiration only. Stars and dates come from `gh` on 2026-10-25; "last activity" is the last push.

| Repo | ★ | Licence | Last push | What to borrow |
|---|---|---|---|---|
| [Snapchat/Spectacles-Sample](https://github.com/Snapchat/Spectacles-Sample) | 191 | **MIT** (+ Specs Developer Terms and Lens Studio licence) | 2026-04 | **The most important repo.** *AI Playground* (Remote Service Gateway for OpenAI and Gemini, including **OpenAI Realtime and Gemini Live over WebSocket**). *Depth Cache* (ASR → Gemini vision → bounding boxes → 3D world positions, for auto-tagging real objects). *Tic Tac Toe* and *Think Out Loud* (Sync Kit patterns: SyncEntity, StorageProperty, networked events, tested with two Preview panels). *Spectacles Mobile Kit*, *Snap Cloud*, *Voice Playback*, *Spatial Persistence*, *Custom Locations* |
| [ironman5366/ai-murder-mystery-hackathon](https://github.com/ironman5366/ai-murder-mystery-hackathon) ("AI Alibis") | 248 | **MIT** | 2024-07 | The **critique → refine** pass. Each character has a "violation" principle; a critique prompt returns `NONE!` or quote/critique/principles; a refiner then makes minimal edits consistent with that character's story. Also a helper character who searches locations, and a multiple-choice end quiz. Caveat: every character's prompt includes the global story, so it is *not* truth-blind. Don't copy that part |
| [eliotjlee/holmes](https://github.com/eliotjlee/holmes) | 28 | **MIT** | 2023-10 | Almost exactly Roomscript's engine shape: JSON-schema plot generation, a **timeline in 15-minute steps**, each suspect's actions per timestamp, and a **memory stream per suspect** (truth-blind agents via RAG). Borrow the schema ideas, not LangChain |
| [Zayne-sprague/MuSR](https://github.com/Zayne-sprague/MuSR) (paper arXiv:2310.16049) | 58 | **MIT** | 2024-08 | The source of the **means/motive/opportunity** pattern: the murderer has all three; the innocent has two plus a **suspicious fact** that has "no impact" on the answer. Also reasoning-tree expansion and keyword validators that block shortcuts (for example, "motive" can't appear in a low-level deduction) |
| [JF10R/OpenAlibi](https://github.com/JF10R/OpenAlibi) | 0 | **MIT** | 2026-08 | Deterministic seeded generation; a **solver that rejects cases with zero or more than one solution**; **testimonies chosen by information gain** from a spatial constraint language; room-aware object placement. Small but exactly the right idea for "same case, my room" |
| [corinnaj/mysterious-murder](https://github.com/corinnaj/mysterious-murder) | 12 | **MIT** | 2023-01 | A murder emerges from a simulation of actors (Ceptre-style linear logic plus MCTS actors). A truth-first simulation reference |
| [williamjxj/whodunit-voice](https://github.com/williamjxj/whodunit-voice) | 2 | **MIT** | 2026-08 | A voice interrogation loop in the browser: per-suspect voices, **emotion badges (calm → uneasy → irritable → cracking) with more tics under pressure**, recommended questions, hints that cost points, accusations that cite evidence. Avoid its LLM judge and hidden-keyword unlocks |
| [lowlydba/clue-sheet](https://github.com/lowlydba/clue-sheet) | 11 | **MIT** | 2026-10 | Detective-sheet UI patterns for the notepad grid |
| [google/werewolf_arena](https://github.com/google/werewolf_arena) | 48 | **Apache-2.0** | 2024-07 | Hidden-role LLM deception with turn and debate structure, for a later hidden-role mode |
| [a16z-infra/ai-town](https://github.com/a16z-infra/ai-town) | 10.7k | **MIT** | 2026-08 | Agent memory and conversation patterns. Overkill here; reference only |
| [joonspk-research/generative_agents](https://github.com/joonspk-research/generative_agents) | 22.3k | **Apache-2.0** | 2026-10 | Memory stream and reflection. Overkill; background reading |
| [NUKnightLab/sql-mysteries](https://github.com/NUKnightLab/sql-mysteries) | 2.2k | **MIT** | 2026-10 | The "query an archive" format (Detective: Modern Crime's Antares) |
| [zharry29/turnabout_llm](https://github.com/zharry29/turnabout_llm) | 13 | **Other (NOASSERTION): inspiration only** | 2025-09 | An Ace Attorney and Danganronpa evidence-versus-testimony dataset and the "<40% accuracy" finding. Use the *idea* to test your own contradiction graph |
| [gregstoll/cluesolver](https://github.com/gregstoll/cluesolver) | 28 | **None: inspiration only** | 2023-10 | Constraint deduction for a Clue game in progress (an auto-inferring notepad) |
| [SocialDeductionLLM/SocialDeductionLLM](https://github.com/SocialDeductionLLM/SocialDeductionLLM) | 43 | **GPL-3.0: inspiration only** | 2026-01 | Training LLMs for social deduction (multi-agent RL). Research context only |
| [jun0wanan/WhodunitBench](https://github.com/jun0wanan/WhodunitBench-Murder_Mystery_Games), [metareflection/llm-mysteries](https://github.com/metareflection/llm-mysteries) | 5, 7 | **None: inspiration only** | 2025 | Benchmarks of LLM reasoning on murder mysteries |

**Consistency techniques across these repos:**
1. **Truth-blind slices** (Holmes's per-suspect memory streams).
2. **Fact sheets of atomic claims.**
3. **A critique → refine guardrail** (AI Alibis).
4. **Solver uniqueness checks and information-gain clue selection** (OpenAlibi).
5. **MMO scaffolds with red-herring suspicious facts** (MuSR).
6. **A deterministic contradiction graph instead of an LLM judge** (Turnabout's finding).

**Voice pipelines:**
- On Spectacles, the **ASR module is device-only** ("This API is only available on Spectacles"). It supports 40+ languages, has HighAccuracy/Balanced/HighSpeed modes, and partial results through `isFinal`.
- So the laptop-preview video must show chips or typed input for questions.
- The Remote Service Gateway lists **OpenAI Chat Completions, TTS and Realtime; Gemini and Gemini Live; Imagen; Lyria; Snap-hosted DeepSeek-R1; Snap3D**.
- AI Playground notes that it runs in Lens Studio Preview set to "Spectacles (2024)". So LLM and TTS calls can appear in the preview; ASR can't.
- *Correction to the working assumption:* streaming **Realtime and Live APIs do exist** on the gateway over WebSocket. I would still not use them for suspects, because they would break determinism. They are only worth trying if the parse-question-to-topic step proves too slow.

---

## 4. Redesigned Roomscript: "Clue meets L.A. Noire, in your room"

**One-line pitch:** *Your room is the board, your things are the weapons, and every suspect is lying about something. Read their faces, ask them anything, and prove it with the objects around you.*

### 4.1 How the case file arrives in your room (the "deluxe edition box")

1. **The box lands.** A glowing evidence box thuds onto your nearest table. The lid opens and dossiers fan out: four suspect cards with portraits, the victim card and a case summary.
2. **The scene is drawn.**
   - An animated **chalk outline** draws itself on your floor. Bright chalk lines are perfect for additive displays.
   - **Crime-scene tape** stretches across your doorway.
   - Numbered **evidence tents** pop up beside each object you tagged.
3. **Cast the room** (about 30 seconds).
   - Pinch 4–6 spots and pick a zone name for each from a Clue-style list.
   - Pinch 3–6 objects and pick a type for each (cord, blunt, sharp, poison, heavy).
   - *On-device enhancement:* the Depth Cache pattern (Gemini vision → 3D positions) proposes tags automatically. It can't be shown in the preview; the manual tagging is the fallback.
4. **The envelope seals.** It floats at the centre of the room with WHO / WHERE / WITH WHAT slots. The narrator, using TTS, delivers the line: *"Mr. Harlow was found at 10:41. Four guests. Midnight, they walk."*

**What replaces Hunt A Killer's physical evidence:**
- Your real objects, each holding **evidence cards** (object memories);
- holographic dossiers;
- the time ribbon as the archive.

The premium feel comes from the staging, not from paper.

### 4.2 The interrogation core: L.A. Noire, fixed

**Staging.** One suspect at a time, sitting in an "interrogation chair". The suspect is a half-length figure about 1.2–1.5 m away, which keeps them inside the 51° field of view. The rest wait as small hologram pawns on the table, which are also the Clue suggestion tokens.

**The loop:**
1. **Ask.**
   - *Voice*, pinching the mic (device), or *chip*, a tap on a notepad-generated question such as "Where were you at 10:41?", "Ask about the lamp", "Ask about Vale".
   - You can also pinch a real object while a suspect is active, which asks about that object, as in Chronicles of Crime.
2. **Map the question to a topic.**
   - Chips skip this step.
   - Voice text goes to one short LLM call with the closed topic list, which returns a topic ID and a confidence score. If confidence is low, a confirmation chip appears ("Asking about: the lamp at 10:41?").
3. **The engine answers.**
   - It looks up `(suspect, topic)` → **claim**: a truth, a lie (from the cover story), or a deflection.
   - Lies exist only where the suspect is hiding something. The culprit hides the murder; innocents hide their suspicious fact.
4. **Performance.**
   - The line written for that claim when the case loaded plays immediately through TTS (pre-rendered audio can be cached), with subtitles.
   - If the claim is a lie, **the suspect's tell fires** (§4.6).
5. **Respond.** Three verbs, by voice or button, each showing a **preview of the detective's exact line on hover**:
   - **Believe**: file the claim in the notepad. Free.
   - **Press**: "Walk me through it. What did you see?" Costs 15 minutes. Returns a **checkable detail** (a "pressed" claim, for example "the kettle was whistling") and drops one composure segment. A lie under pressure shows its tell again.
   - **Object!**: choose evidence (an object memory, another suspect's statement, or a ghost on the time ribbon) and drag it onto the statement. **The graph decides.**
     - *Right:* the suspect breaks, the true claim replaces the lie, you get a Hunch, and a new lead opens.
     - *Wrong:* you lose a credibility pip and the suspect is smug, but the topic **stays open**.
6. **Shutdown.** Three Presses on the same suspect without new evidence, and the suspect **lawyers up**: they leave the chair for 30 minutes of the night. This is the Roblox "push too hard" rule as a deterministic state.

**Missed questions.** Nothing closes permanently; the clock is the only cost. The solver guarantees each critical fact can be reached by at least two independent routes, following Justin Alexander's "Three Clue Rule" from tabletop design. So no single bad call soft-locks the case. That gives L.A. Noire's continuity with real stakes.

**Hunches** (intuition points), earned by correct objections:
- **"Which line smells?"** highlights one lie in the Statements tab, but not which evidence breaks it.
- **"Strike one"** removes a zone or object from the grid.
- **"Ask the city"** (later; needs a backend) shows the percentage of daily-case players who believed a statement. This is Social Club reborn.

### 4.3 The Clue layer: suggestions, refutations, the one-shot accusation

- **Stage a suggestion.** Drag a suspect pawn into a zone and touch an object token: "Vale, in the Study, with the cable." It costs 15 minutes.
- **Refutation round.**
  - Witnesses are checked **clockwise round your actual room, starting from you**.
  - The first that can disprove the suggestion lights up and shows **one card** privately.
    - **Objects always tell the truth.** For example, the cable: "Untouched since 9:00."
    - **Suspects may lie when they refute**, if the truth would expose their own secret. Their tell fires, and you can call **"Liar!"**, which is an objection using the refutation as the statement (Liars Edition).
- **Nobody refutes?** A huge lead: at least one of the three named cards must be in the envelope. The grid shows this.
- **The notepad crosses itself off** when a card is shown. The Statements tab is separate and fed by interrogation.
- **Accusation.**
  - At the envelope, slot in suspect, zone and object.
  - **One shot on the daily case**; practice cases allow retries at a pip cost.
  - The envelope opens, and a **reenactment of the true night** plays across your room: the time ribbon unrolls, the ghosts walk their 15-minute paths, and **bullet time** freezes at 10:41.
  - A right or wrong verdict, then the Holmes rating.

### 4.4 Engine and AI architecture (the important part)

1. **Simulation.**
   - 12 slots from 9:00 to midnight. Each actor has a zone, an action and objects touched per slot. One slot contains the murder (10:41).
   - Culprit: means, motive and opportunity. Innocents: two of those plus one suspicious fact (MuSR).
2. **Dealing the cards.**
   - Each non-envelope element (suspect, zone, object) needs **at least two refuters**: object memories, plus what suspects saw.
   - The witnesses holding them are the "players" in the refutation round.
3. **Claims table.**
   - For each suspect × topic, a truth claim, or a cover-story lie if the slot touches their secret.
   - Each lie has at least one breaking piece of evidence in the graph, and ideally two.
   - "Pressed" claims add checkable details.
4. **Solver.**
   - Confirms the solution is unique given every reachable card and claim.
   - Computes the **minimum-cost route**, for the Holmes rating and to prove the case can be solved before midnight.
   - Rejects the seed otherwise, as OpenAlibi does.
   - Optional: choose which facts to show by information gain.
5. **Writing pass when the case loads** (LLM, roughly four calls in parallel during the box animation):
   - "In Vale's voice, write one line for each of these 14 claims, 3 deflections, 2 break lines and 1 lawyer-up line."
   - **Each suspect's prompt holds only that suspect's slice**: truth-blind.
   - Then a **critique pass**, AI Alibis style: reject any line that introduces a name, time, place or object not in its claim. Regenerate once; otherwise fall back to a template line.
   - For the demo and the daily case, cache the output.
6. **During play:** the LLM is optional. One call maps a voice question to a topic; chips need none.
   - Optional "small talk" uses a live LLM with persona only. Its output is filtered: if it mentions any entity from the case, it is swapped for a canned deflection.
7. **Determinism.** Seed, actions and state make every run replayable. That gives a reliable demo video, free multiplayer sync (§5), and the daily case.

Why this beats LLM-driven suspects for this hackathon:
- It removes most per-question latency, which matters because the gateway is non-streaming.
- Suspects can't confess early or invent facts.
- The preview video is reproducible.
- It still delivers "ask anything", AI-authored performances and voices.

### 4.5 Fairness and solvability guarantees

These go on a slide.
- **A unique solution.** The solver checks it.
- **Every critical fact has at least two routes** (Three Clue Rule).
- **Every lie can be broken by evidence that exists in your room.**
- **Every fact you need can be reached with buttons**; voice is optional.
- **The LLM never decides truth, a contradiction or a verdict.**
- **Tells are learnable, and teach "lying", not "guilty".**
- **The same seed gives the same case**, with roles mapped onto any room by object type.

### 4.6 Readable tells on additive AR

**Constraints.**
- The display adds light: black is transparent and there are no dark fills.
- The field of view is 51°, and a face at about 1.3 m is small.
- Subtle MotionScan-style micro-expressions would not read. Tells must be **macro, emissive and shaped**, never colour alone.

**The tell library.** Each suspect gets one signature tell, plus one stress tell under pressure:
- **Gaze snap.** On a lie, a faint bright gaze line flicks from the suspect's eyes to **the real object in your room that the lie is about**. This is the signature move: "objects testify" and the L.A. Noire read in one gesture. It points your attention without telling you which evidence breaks the lie.
- **Film flicker.** A two-frame skip or glitch in the hologram, like a damaged reel.
- **Hand to collar**, or another gesture tell, made big and slow.
- **Voice hesitation.** Lie lines are written with a hesitation marker ("I—I was in the kitchen"), controlled by the engine.
- **Composure ring.** A thin bright arc at the suspect's base. Segments drop with Press and objections; it turns jagged under pressure.

**The baseline step** (tutorial, and the first question in every interview):
- One question the suspect answers truthfully and one about a trivial lie, scripted.
- "Watch her eyes": the tell is taught explicitly.
- This fixes Edge's guilty-smirk-or-Mona-Lisa problem.

**Difficulty dial (later).** Rookie shows tells with a label; Detective shows the tell only; Noir has 80% reliable tells plus decoy fidgets. **For the hackathon, ship 100% reliable tells.** That avoids repeating L.A. Noire's best-known criticism, and the deduction challenge stays intact because innocents lie too.

**Art direction: "noir in light".**
- Warm amber and white line art, ink-wash suspects with emissive rim light, and film grain as sparse bright specks.
- Yellow tape and chalk; cyan only for tells and objection effects.
- Keep important UI within the central roughly 40°.

### 4.7 Wow features, with honest feasibility notes

The window is about 16 days, solo, with Claude Code/CLAD and the Lens Studio MCP.

| # | Feature | Wow | Build | Shows in preview? |
|---|---|---|---|---|
| 1 | **The box lands; chalk outline on your floor; tape across your door; evidence tents** | High, the first five seconds | Easy, ~1 day | ✅ |
| 2 | **Cast your room**: zones and objects become the Clue board | High: "my room is the board" | Medium, ~1.5 days (manual tags) | ✅ with a simulated room; automatic vision tagging is device-only ❌ |
| 3 | **Floating sealed envelope + one-shot accusation** | Medium-high | Easy, ~0.5–1 day | ✅ |
| 4 | **Stage a suggestion → clockwise refutation by your objects** | High, and the Clue hook | Medium, ~2 days, deterministic | ✅ |
| 5 | **Ask anything** (voice + chips) with lines written when the case loads | High, and the L.A. Noire hook | Medium-hard, ~3 days including the writing and critique passes | ✅ chips, LLM and TTS; ASR on device only |
| 6 | **Readable tells**: gaze line to your real object, flicker, hesitation, baseline | Very high: a new idea | Medium, ~1.5 days | ✅ |
| 7 | **Believe / Press / Object with line preview; composure ring; lawyering up** | Medium-high: fixes Doubt | Medium, ~1.5 days | ✅ |
| 8 | **Spatial Objection**: drag a statement onto an object, ghost or testimony | Very high: the signature move | Medium, ~1.5 days | ✅ by mouse drag |
| 9 | **Notepad grid that crosses itself off, plus a Statements tab** | Medium | Medium, ~1.5 days; palm attachment may be fiddly in preview, so use a floating clipboard as fallback | ✅ |
| 10 | **Reenactment**: time ribbon plus bullet time at 10:41 | Very high: the money shot | Medium-hard, ~2 days (discrete slot poses and a path line, not full animation) | ✅ |
| 11 | **Liar! on suspect refutations** | Medium: links Clue and Noire | Easy once #4–#8 exist, ~0.5 day | ✅ |
| 12 | **Holmes rating + daily case code** | Medium | Easy, ~0.5 day (solver already computes the minimum route) | ✅ |
| S1 | Automatic vision casting of objects (Depth Cache pattern) | High on device | 1–2 days | ❌ preview |
| S2 | Clue Night: two detectives in one room (§5) | High | 3–4 days | ⚠️ split-screen Preview panels |
| ✂️ | Line-of-sight objection | — | Cut: geometry-heavy, hard to show | — |

**Honest total.** Items #1–#12 plus the engine is about 20 days of work, which is over budget. **The MVP for Nov 10:** #1, #2 (manual), #3, #4, #5, #6, #7, #8, #9 (clipboard), #10 (simplified), #12. Do #11 only if ahead of schedule. **Hand-check one hero case** (a fixed seed) for the video, so generator bugs can't sink the demo.

### 4.8 Keep or cut from the existing Roomscript plan

**Keep:**
- The truth-first engine and solver: the core.
- Objects testify: now the Clue refuters and the evidence cards.
- Spatial Objection: now L.A. Noire's Accuse with evidence.
- The five pips and 15 minutes per question.
- Suspects leaving at midnight.
- Truth-blind suspects.
- The daily seeded "same case, my room".

**Merge:** the time ribbon becomes the reenactment and archive, rather than a constant waist-height presence. Bullet time at 10:41 stays as the climax.

**Cut:**
- The line-of-sight objection.
- Live LLM generation of facts during play.
- Any LLM judging.
- More than four suspects.

### 4.9 Proposed 16-day schedule

This is a proposal; Wadood's available time is unknown.

| Days | Work |
|---|---|
| Oct 26–28 | Engine in pure TypeScript, tested in Node with Claude: simulation, dealing, claims table, solver, seeds. Hero case written and checked |
| Oct 29–30 | Lens Studio scene via MCP: box, chalk, tape, envelope, zone and object tagging |
| Oct 31–Nov 2 | Interrogation: chips, topic-mapping call, writing and critique pass, TTS, verbs, composure, tells |
| Nov 3–4 | Clue layer: suggestions, clockwise refutation, notepad grid, Statements tab |
| Nov 5–6 | Spatial Objection, accusation, reenactment with bullet time |
| Nov 7–8 | Polish, button fallbacks, failure handling (gateway down → canned lines), Holmes rating, case code |
| Nov 9–10 | Capture the video (preview plus any on-device clips), Devpost write-up, CLAD/MCP evidence |

---

## 5. Multiplayer modes

**Sync Kit facts** (Snap docs and samples):
- Spectacles Sync Kit provides SessionController, SyncEntity, StorageProperty, Networked Events and an Instantiator.
- **In Lens Studio you can open extra Preview panels, and each simulates a different user in the session.** The Tic Tac Toe sample is tested exactly this way.
- One developer can test with **one Spectacles plus Lens Studio** by sharing a Session ID; "Colocated for Solo Development" allows the mapping flow with one person.
- Colocated mapping must first be done on Spectacles, unless a Custom Location is used. Newer Sync Kit versions colocate faster by looking at a participant who has already joined.
- **Phones can't join a Spectacles Connected Lens.** Mobile Kit is a separate BLE link between a native iOS/Android app and a Lens. It needs a one-time bond through the Spectacles App on the same phone, so it is effectively one companion phone per Specs.
- Snap Cloud (Supabase Postgres, Realtime, Edge Functions) is in **alpha**, and access is by application.

**Key technical point.** Roomscript's engine is deterministic, so multiplayer only needs to sync `seed + ordered action log`. Each device recomputes the state itself. Private cards are drawn only on the intended device; that trust model is fine for a party game.

| Mode | Fun | Solo build cost in about 2 weeks | Preview-video showable? | Verdict |
|---|---|---|---|---|
| **Co-located "Clue Night"**: 2–4 Specs in one room, competing detectives, each also holding a few cards that join the refutation chain alongside objects | **High**: this is literally Clue, and you watch your friend's suspect lie | **Medium-high, 3–4 days** on top of the core: seed and action-log sync, turn order, private card reveals, notepad per player, colocation flow from the Sync Kit prefab | **⚠️ Partly**: two Preview panels side by side show private cards and live refutation, but not "same physical room". One on-device clip would help | **Stretch goal for the hackathon**, only if the core is locked by about Nov 5 |
| **Asymmetric, phones**: the Specs wearer is the detective; friends on phones hold Clue cards or play suspects | High at parties; phones playing suspects swaps the LLM for human acting, which is fun but a different game | **High**: Mobile Kit needs native apps and only one bonded phone; a web companion needs a relay (WebSocket server or Snap Cloud alpha) plus a web UI | ✅ Very showable (screen-record the phone beside the preview) | **Later**, as a "party mode" with a web companion |
| **Hidden role**: one player is secretly the culprit or accomplice (Deception, Clue Conspiracy) | Very high with 4+ people | High: private roles, balance, needs several devices or phones | ❌ Hard | **Later**, as a variant of party mode, e.g. "one of you is the accomplice who may lie on refutations" |
| **Remote same-seed**: each player stages the daily case in their own room, racing or co-operating | Medium as an async duel; high if racing live | **Low** for async (share the case code, compare Holmes ratings; leaderboard if Snap Cloud access is granted); high for live remote | ✅ Two Preview panels with **differently cast rooms, same case**, which also proves the room-adaptation claim | **Ship regardless** as a "multiplayer-lite" bonus: it is essentially the daily seed |
| **Co-op roles**: forensics (sees the ribbon and object memories) and interrogator (sees tells) | High: a Chronicles of Crime VR-style "describe what you see" dynamic | Medium-high on two Specs; high with a phone | ⚠️ Same as Clue Night | **Later**, as a mode inside Clue Night once sync exists |

**Recommendation.**
- **Hackathon:** single-player core plus the free case-code duel.
- **Stretch, only if the core is done by about Nov 5:** **Clue Night** for two detectives in one room, via Sync Kit, shown as split-screen Preview panels.
- **Later:** a **party mode** with phone companions holding cards (web relay or Snap Cloud), plus an optional **hidden accomplice**.
- Don't let multiplayer endanger the "complete, coherent product" judging criterion.

---

## 6. The strongest three-minute demo arc (my opinion)

**Thesis:** show *one* full case loop in which every Clue rule and every L.A. Noire rule appears exactly once, ending on the reenactment. Use the laptop preview with chips (ASR is device-only). Add a 5–10 second on-device voice clip if one can be captured.

| Time | Beat |
|---|---|
| 0:00–0:12 | **Hook.** Black frame, with the voiceover: "Clue, but the board is your room. L.A. Noire, but you can ask anything." The box thuds onto the desk, the chalk outline draws itself on the floor, and tape snaps across the door |
| 0:12–0:30 | **Cast the room.** Desk → Study, bed → Lounge, door → Hall. The charger cable is tagged as cord and becomes "the rope". The envelope seals: WHO / WHERE / WITH WHAT. The notepad grid appears |
| 0:30–1:15 | **Interrogation.** Vale sits in the chair. Baseline: "Did you know Harlow?" (truth, steady) and "Do you like his wine?" (a trivial lie, **gaze line flicks to the bottle**). The caption reads "Learn her tell." Then: "Where were you at 10:41?" "In the kitchen, making tea." **The gaze line snaps to your desk lamp.** Hover over Press to see the line preview, then Press: "The kettle was whistling, I didn't hear a thing." The composure ring drops |
| 1:15–1:45 | **Objects testify → Objection.** Pinch the kettle: an evidence card appears, "Cold all night." Pinch the lamp: "Someone stood at the desk at 10:41." **Drag her statement onto the lamp. OBJECTION!** The graph confirms, her hologram glitches, and the ring shatters: "Fine. I was at the desk, but he was already on the floor." A new lead and a Hunch |
| 1:45–2:15 | **Clue suggestion.** Drag Imran's pawn into the Lounge with the cable. Clockwise, the mug lights up and privately shows a card: "Imran was in the Hall at 10:30." The grid crosses itself off. The clock reads 11:30. Optional: Imran refutes with a lie, his tell fires, and you call **"Liar!"** |
| 2:15–2:45 | **One-shot accusation.** At the envelope: Vale, Study, cable. The ribbon unrolls round the room, the ghosts walk the night, **bullet time at 10:41**, and the envelope opens: correct. Holmes rating: "You: 7 questions. Holmes: 5." |
| 2:45–3:00 | **Under the hood** (fast cuts): the night simulated in 15-minute steps, a unique solution guaranteed by the solver, truth-blind suspects, "the LLM never decides the truth", CLAD and Lens Studio MCP footage. End card: "Same case, your room. Case code: HARLOW-1041" |

The suggestion beat is the most cuttable if time runs short, but cutting it loses the Clue hook Wadood asked for. Trim the casting beat instead.

---

## 7. Risks and things to verify

- **ASR in preview:** the docs say ASR is only available on Spectacles, so plan the video around chips.
- **TTS and Remote Service Gateway in preview:** AI Playground says it works in Preview with "Spectacles (2024)" simulation. Verify TTS audio specifically.
- **Palm-attached UI in preview:** hand simulation is limited; keep a floating clipboard fallback.
- **Gateway latency and outages:** lines are written when the case loads and cached for the hero case; templates are the fallback.
- **Generator bugs:** use a hand-checked hero case for the video, with the generator shown as a second case or a montage.
- **Room size:** support 3–6 zones; the generator adapts by object type.
- **Additive visibility in bright rooms:** test the chalk, tape and tell colours on device if possible.
- **Multiplayer:** colocation mapping must happen on device first; a single developer can test with one Specs plus Preview, but only through the Session ID workflow.
- **Claims not personally verified:**
  - "The Deposition" (Devpost returned 403).
  - Roblox figures come from a third-party tracker.
  - The 150 million Clue sales figure is unverified.
  - The original Coax/Force wording comes via Destructoid and Shacknews, not Rockstar.

---

## Sources

**L.A. Noire**
- [Wikipedia: L.A. Noire](https://en.wikipedia.org/wiki/L.A._Noire)
- [Windows Central: remaster clarifies interrogation options](https://windowscentral.com/la-noire-changes-interrogation-techniques-remaster)
- [Destructoid: remaster changes button prompts](https://destructoid.com/?p=208008)
- [GameRevolution: interrogation choices will finally make sense](https://www.gamerevolution.com/news/355725-la-noire-interrogation-choices-will-finally-make-sense-remaster)
- [Kotaku: the remaster's dialogue system isn't specific enough](https://kotaku.com/the-l-a-noire-remasters-new-dialogue-system-isnt-speci-1820520119)
- [Slant review of the remaster](https://www.slantmagazine.com/games/review/l-a-noire-remastered)
- [Significant Bits: L.A. Noire's interrogation system](https://significant-bits.com/l-a-noires-interrogation-system/)
- [Shacknews: 10 years later](https://www.shacknews.com/article/124403/la-noire-10-years-later-changing-the-face-of-the-game)
- [MCV/Develop: the art of lying](https://mcvuk.com/development-news/the-art-of-lying-la-noire/)
- [Prima eGuide: intuition](https://primagames.com/eguides/la-noire-2017-remaster/basics/intuition-rank)
- [Push Square review](https://www.pushsquare.com/reviews/ps3/la_noire)
- [Gamecritics review](https://gamecritics.com/daniel-weissenberger/l-a-noire-review)
- [CGMagazine review](https://www.cgmagonline.com/review/game/la-noire/)

**Clue**
- [Wikipedia: Cluedo](https://en.wikipedia.org/wiki/Cluedo)
- [Clue statistics (sales claim)](https://coopboardgames.com/statistics/clue-cluedo/)
- [Wargamer: 2023 relaunch](https://www.wargamer.com/clue/new-version)
- [Hasbro relaunch press release](https://hasbro.gcs-web.com/node/35311)
- [Hasbro: Clue Conspiracy](https://shop.hasbro.com/product/clue-conspiracy-board-game-secret-role-games-for-4-10-players-mystery-games-ages-14-plus/35EAEE40-3D99-4E58-A1A6-D1C667D35721)
- [Room Escape Artist: Treachery at Tudor Mansion](https://roomescapeartist.com/2023/08/25/hasbro-clue-treachery-tudor-mansion-escape-game-review/)
- [Co-op Gestalt: Treachery at Tudor Mansion](https://coopgestalt.com/2022/10/29/a-mini-review-of-clue-treachery-at-tudor-mansion-an-escape-and-solve-mystery-game)
- [Hasbro: Clue Escape: The Illusionist's Club](https://shop.hasbro.com/en-us/product/clue-escape-the-illusionist-s-club-board-game-1-time-solve-escape-room-games-mystery-games-ages-10-plus/382658C0-7070-4586-AB60-6F5DFE00D8FB)
- [Clue Liars Edition rules](https://rulespal.com/clue-liars-edition/rulebook)
- [Wikipedia: Clue mobile games](https://en.wikipedia.org/wiki/Clue_(mobile_games))
- [App Store: Clue (Marmalade)](https://apps.apple.com/us/app/clue/id6447357776)
- [Pure Nintendo review](https://purenintendo.com/review-clue-mystery-game-switch/)

**Other investigation games**
- [Board Game Quest: Chronicles of Crime](https://boardgamequest.com/chronicles-of-crime-review)
- [Meeple Mountain: Chronicles of Crime](https://meeplemountain.com/reviews/chronicles-of-crime)
- [ICv2: VR meets board game in Chronicles of Crime](https://icv2.com/articles/news/view/40214/vr-meets-board-game-chronicles-crime)
- [Prima: Interrogation: You Will Be Deceived review](https://primagames.com/featured/interrogation-you-will-be-deceived-review-question-everything)
- [Worthplaying: Interrogation review](https://www.worthplaying.com/article/2020/1/17/reviews/117694-pc-review-interrogation-you-will-be-deceived/)

**AI interrogation games**
- [RoWatcher: Interrogation [AI]](https://rowatcher.com/games/10764239797/interrogation-ai)
- [AI Interrogation wiki](https://www.ai-interrogation.wiki/)
- [The Last Question](https://thelastquestion.io/blog/ai-interrogation-game)
- [Gamecritics: Uncover the Smoking Gun](https://gamecritics.com/david-bakker/uncover-the-smoking-gun-review/)
- [Steam: Uncover the Smoking Gun](https://store.steampowered.com/app/2492290)
- [KeenGamer: Vaudeville preview](https://www.keengamer.com/articles/previews/vaudeville-preview-the-ai-questioning-to-nowhere/)
- [Game Developer: Vaudeville pre-mortem](https://www.gamedeveloper.com/press-release/vaudeville-a-pre-mortem)
- [Dead Meat press release](https://gamespress.westeu-v2.propressroom.com/fr/Get-creative-in-DEAD-MEAT-the-detective-game-where-you-can-ask-suspect)
- [Steam: Doki Doki AI Interrogation](https://store.steampowered.com/app/2844700)
- [404 Media: Verbal Verdict](https://www.404media.co/a-small-steam-game-shows-how-llms-could-kill-the-dialogue-tree/)
- [NVIDIA: Covert Protocol](https://www.nvidia.com/en-au/geforce/news/nvidia-ace-gdc-gtc-2024-ai-character-game-and-app-demo-videos/)
- [Devpost: The Deposition (returned 403; known only from a search summary)](https://devpost.com/software/the-deposition)

**Research**
- [MuSR paper (arXiv:2310.16049)](https://arxiv.org/abs/2310.16049)
- Justin Alexander, "Three Clue Rule", *The Alexandrian*

**Snap developer docs**
- [Building Connected Lenses](https://developers.snap.com/spectacles/about-spectacles-features/connected-lenses/building-connected-lenses)
- [Sync Kit release notes](https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-sync-kit/release-notes)
- [Sync Kit getting started](https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-sync-kit/getting-started)
- [Mobile Kit getting started](https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-mobile-kit/getting-started)
- [Remote Service Gateway](https://developers.snap.com/spectacles/about-spectacles-features/apis/remoteservice-gateway?lang=en-US)
- [ASR module](https://developers.snap.com/spectacles/about-spectacles-features/apis/asr-module)
- [Supabase: Snap launches Snap Cloud](https://supabase.com/blog/snap-launches-snap-cloud)
- [Snap Cloud overview](https://developers.snap.com/spectacles/about-spectacles-features/snap-cloud/overview)

**GitHub:** the repositories are listed with links in §3.
