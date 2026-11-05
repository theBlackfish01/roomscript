# Takeaways from the organisers' live review (Nov 5)

Source: Wadood's transcript of the "SPECS Live Review: Inside the Judging Criteria" session on Thu Nov 5. The judge Jo and a co-host reviewed four entries: AfterShock (earthquake drill), Nexhold (climbing-wall guide), Skyhanger (planes and satellites overhead) and MWNP (a field-service assistant). This note lists what the judges reward, what they penalise, and what that means for Roomscript.

## What the judges said

**Design is "the most important" criterion.** It means a coherent, complete product, not a technical proof of concept.
- **"Do not create a website that lives in front of your face."** Every panel blocks the player's real view. Show only what's needed, as little text and as few buttons as possible.
- **Big buttons.** A pinch is detected by a camera, so tiny targets fail. MWNP was criticised for small buttons and a mouse clicking through dense menus.
- **Progressive disclosure:** show a detail only when the player asks for it, or when it matters at that moment.
- **Unobtrusive feedback.** Their models were Apple Fitness's corner pop-up and Supernatural's in-flow goals: a toast pops in at the edge and leaves. AfterShock's large score screen was called "a website on your face".
- **Augment reality; don't simulate it.** AfterShock was confusing because it built "a new room every time" instead of using your room. The judges will accept Preview simulation, since nobody has Specs, but they want "the right habit of mind": design for the real room.

**Nexhold got the most praise for a "galaxy brain" detail:** the interface changes with distance. Far from the wall it shows the whole route; up close, one ring and one word. The UI responds to what you're looking at, not to modes or settings.

**Physical, hands-free action** is what makes AR worth it: walking, grabbing, doing. Skyhanger's "pull the plane out of the sky and put it on your shelf" was the delight moment.

**Innovation is the judge's personal favourite:** original, "I didn't think of that". Creative use of what's unique to glasses: a camera that sees what you see, graphics drawn into your view, and free hands.

**AI and voice:** "Definitely curious to see more LLMs or voice models inside of some of these specs. **We haven't seen that yet.**" One audience member also suggested conversational AI as a hint giver.

**Onboarding:** contextual tooltips that appear while you act ("pinch, then drag") beat instructions up front. For guidance, "guide without leading": don't take away the fun of figuring it out.

**Friction:** Nexhold's manual height input and constant pinching before you could start was a minus. Calibrate automatically where you can.

**Audience:** "Who is it for?" came up for three of the four projects. State it.

**Presentation:**
- Under 3 minutes, on YouTube (public), with the demo in the first 10 seconds.
- An edited montage left Jo asking "what happens when I put it on, in what order?" She suggested including an **uncut, continuous stretch** of the real experience.

**Submission:**
- a public GitHub repo with the Lens project and the **`devpost/` folder the DevPost Learn skill pack creates** (they will check for it);
- a description covering what the lens does, who it's for, what you learned, and **how the skill pack helped**.

## What this means for Roomscript

**Where we're already strong** (lead with these):
- **The AI and voice angle the judges haven't seen yet:** suspects who answer in their own voices, but can't change the truth.
- **Physical interactions:**
  - pinch real objects to make them "remember";
  - carry a suspect's statement to the object that contradicts it (Spatial Objection);
  - drag a pawn into a zone of the room for a suggestion;
  - the reconstruction's ghosts walking through your own room.
- **Augmentation by design:** the case is cast onto your room's real objects, and the crime happened among your own furniture.

**Where we're at risk:**
1. **"A website on your face."** Panels, chips, the notebook grid, memory cards, the ending result card and subtitles can all add up to text in front of the player.
2. **Simulation, not augmentation.** The Preview stand-in boxes and virtual props floating over the Evening Room look like overlays, not like *that* room's objects.
3. **Mouse-and-menu footage.** Clicking small chips with a cursor reads exactly like MWNP.
4. **Unclear "what happens in what order"** if the video is only a fast montage.
5. **No stated audience.**
6. **The DevPost skill pack:** our `devpost/design-brief.md` was written by an agent from our own docs, not produced by the skill pack, and they will ask how it helped.

## Changes (folded into the Run 7 prompt)

**R1. UI diet.** Audit every screen against "a website on your face":
- At most one small, world-anchored panel at a time, never between the player and a speaker's face. The case HUD lives on the crate lid: look down to use it, look up and it's gone.
- **Three question chips at most,** big enough to pinch: at least about 2.5° tall, roughly 4–5 cm at 1 m. "More" reveals the next three (progressive disclosure).
- **Cards show an icon plus three words.** Details expand only on pinch.
- **Feedback as peripheral toasts** ("Deduction filed", "Hunch", "Credibility −1") that pop in at the edge for about 2 s and leave.
- **The ending is a stamp and stars**, not a results page. Details expand on request.
- **The Clue grid lives in the room** (design 03, wow #8). Zones dim and weapons get chalk crosses where they stand. The notebook panel is optional.
- **Subtitles:** one short line at the speaker, revealed word by word.

**R2. Interface by distance and proximity** (the Nexhold lesson):
- **Walk up to a suspect to question them.** The nearest suspect within about 1.5 m, and in view, becomes the active one. No suspect-picker menu. Step back and the questions fade.
- **Level of detail by distance:**
  - From the doorway: zone names, suspect silhouettes and the dim chalk marks on the room.
  - Near an object: its memory prompt.
  - Near a suspect: their questions.

**R3. Cast the case onto the real room** (augment, don't simulate; this replaces the Y1 crate page):
- **An opening "casting sweep."** After the crate opens, labels appear one by one on the Evening Room's actual furniture: "Your desk lamp: WITNESS. Your kettle: WITNESS. Your charger cable: THE WEAPON." It ends with "Tonight, this room is Harlow's study."
- **Anchor the hero case's objects to real furniture** visible in the Preview room. Remove the stand-in boxes from Director and film mode.
- **Virtual props sit on real surfaces,** and there should be few of them.

**R4. Live AI voice is a headline, not an extra** (Y2 promoted):
- A free question, typed in Preview (spoken on device), gets an in-character answer the live director chooses, voiced and labelled "live AI via Snap RSG".
- One clean take for the video.

**R5. Contextual tips, voiced by Wren.** One-line hints at the moment they're needed, then never again:
- "Pinch the kettle."
- "Carry her words to the kettle."
- "Drag a guest to a room to make a suggestion."

Hints ask, they don't tell ("What would the kettle say about tea?"). No up-front instructions screen.

**R6. Less friction.** In Preview and Director mode the case places itself automatically, and the opening runs straight into the first question within about 30 s.

**R7. Your route, replayed** (optional; the AfterShock replay idea was praised). Log the player's position about once a second and show their path as a faint ivory trail during the reconstruction, next to the truth: "You walked 23 m. You visited the kettle twice."

**R8. The DevPost skill pack, done properly:**
- Install `challengepost/learn-specs` project-locally.
- Run `plan-lens` to produce or validate `devpost/design-brief.md`, keeping an honest provenance note (planning began in docs/plan and docs/design; the skill pack was used to formalise it and check it against the AR rules).
- Run the brief's "After the build: judge it" checklist on the current build.
- Record what the skill pack changed. That's the "how it helped" answer for Devpost.

**R9. Video plan update** (`devpost/drafts/video-plan.md`):
- **0:00–0:10:** straight into gameplay: the objection slam, or a suspect answering in voice. No title card first.
- **By 0:20, one line on what it is and who it's for:** "A one-player murder mystery that casts your room as the crime scene, for anyone who loves Clue and detective games."
- **An uncut 45–60 s stretch:** from opening the crate to the first answer, labelled "uncut".
- **Show the hand interactions,** not a mouse cursor clicking menus.
- **Label honestly:** "Lens Studio Preview, simulated room; on Specs, your room."
- **The AI/voice beat,** plus a brief "truth engine vs. AI voice" explainer.
- **Link a full uncut playthrough** in the Devpost description.

**R10. Devpost description:**
- what it does, in one sentence;
- who it's for;
- what we learned (designing for a face, not a screen; LLM safety via a truth engine; agent-driven building with CLAD);
- how the skill pack helped (R8).


## Decisions with Wadood (Nov 5, night)

- **Room casting from the camera: GO.** It starts as a 2-hour spike with the authored hero mapping as fallback.
  - For the Preview demo, use **Claude Opus locally** for the vision step; it's the most capable model available.
  - The in-lens path for Specs stays Gemini through Snap's gateway, because the lens can't hold an Anthropic key.
  - Label it honestly in the video.
- **Voice:** prerecorded voices are fine for the demo. **Explore an ElevenLabs voice agent** that plays a suspect live, as a spike. Ship it only if it can be made truth-safe: facts come only from the engine.
- **The skill pack (R8) happens in the next run**, near the start.
- **Multiplayer:** decide on Fri Nov 6, based on Run 7's progress.
- **Feature freeze moves to Sun Nov 8 at 21:00 PKT.**
- **Video voiceover:** decide later.
- **Planning stance:** be ambitious. Agent runs are fast; quality matters more than finishing early. Note that a later monthly round may not accept code started in this round ("old ideas are fine but old code is not"); check before relying on it.
- **Also in scope:**
  - generated cases playable in your room;
  - physical delight moments (pull a memory out of an object, lift an object to inspect it, point to accuse);
  - a conversational Wren that only knows what you know;
  - voice tells;
  - your own route replayed at the end.
- **Two modes (Wadood, Nov 5 night):** Preset for the demo (the authored Harlow case, prerecorded voices and a saved room scan replayed, deterministic for filming), and Dynamic as a real capability (live scan, a new verified case every time, phrase-composed and live voices). Both are selectable from the crate. The video uses the Preset for the story plus a short "same room, new murder" Dynamic segment.
