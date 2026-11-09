---
status: approved
---

# Design brief: Roomscript

<!-- Written with the Devpost Learn plan-lens skill from Wadood's design decisions. It was revised after his own playthrough (Nov 7) for the final "find, ask, catch" build. Values he didn't choose are marked (default). -->

## The one spatial moment
Vale says she was in the kitchen making tea at 22:30. You walk over to the kettle in your room and it's stone cold. You turn back, show it to her, and her story cracks. Her ghost walks back to the study, where she really was.

## Why it belongs on glasses
- **Uses:** draws in the world; leaves your body free.
- **Why it's better than the phone or laptop version:**
  - The four suspects stand life-size in your own room.
  - You walk up to them to talk, and you walk to the evidence to find it.
  - When a lie breaks, the truth replays at the spot where it happened.

  On a laptop the same case would be menus and a list of clues. On glasses the room is the crime scene, and walking around it is the investigation.

## Product or overlay
- **Type:** product. A one-player detective game staged in your room.
- **What the real version would sense:** the room's surfaces and free floor, to place the suspects, the evidence and the chalk outline.
- **Stand-in for the preview:** the Evening Room preview with hand-placed positions for the case, *The Harlow Trust*. No recognition is claimed.

## Where things live
- **Where the user is looking during the main task:** at the suspect they're talking to (head and shoulders at about 1.4 m), and down at the item they've found on a surface.
- **Suspects:** life-size illustrated figures standing on free floor. Conversation distance is 1.3–1.5 m; full figures read at 2.5–3 m (default).
- **The row (Ask · Show · Accuse):**
  - three medium buttons at chest height to the suspect's right, never over a face;
  - it appears within 2 m when you face the suspect;
  - it hides beyond 2.6 m, or after 1 s turned more than 70° away (default).
- **Subtitles:** two short rows below the speaker's face.
- **Evidence:** each item sits on a real surface in its part of the house.
  - the kettle and Okafor's medicine bottle in the kitchen;
  - Harlow's recorder and the charger cable on the study desk;
  - Harlow's letter in the lounge;
  - Imran's torn debt note by the hall door;
  - Pike's forged certificate by the window.
- **Case file:** one folder on the nearest table.
- **The crime scene:**
  - tape across the real doorway;
  - a chalk outline on free floor where Harlow fell;
  - rain and lightning on the real window.
- **Ghost replay:** real scale, at the place it happened, about 5 seconds.
- **Ending:** the frozen murder at 22:30, which you walk around. Then the morning newspaper in your hands at about 60 cm.

## Hands and input
- **Open the case:** one pinch on the case file.
- **Find an item:** one pinch on it. The detective says one short observation ("Stone cold. Nobody made tea tonight.").
- **Talk:** walk up to a suspect, pinch Ask, then one of up to four questions, or "Ask your own…" to type a question.
- **Show:** pinch Show, then the picture of an item you've found.
- **Accuse:** pinch Accuse (who is the suspect you're facing), then a place, then a weapon, then one pinch on the wax seal.
- No drags, holds or palm menus.
- Targets are big and highlight when aimed at.
- **Voice:** none. Every question is a button; "Ask your own…" uses the keyboard.

## When things show
- **The row:** shows when you're near a suspect and facing them. It hides while anyone is speaking and comes back when the line ends.
- **Ask, Show and Accuse choices:** each opens in the row's place and closes after a choice. Show stays dimmed until you've found something.
- **Place names:** only during the accusation's "Where?" step.
- **Speech:** one voice at a time, and a line that starts always finishes.
- **If you're stuck:**
  - after 12 seconds idle, the next useful thing glows;
  - after 25 seconds, Wren, your partner, whispers a question from behind you. She never gives instructions.
- **Out of view:** each suspect's voice comes from where they stand, and Wren's from behind you.

## Done criteria
Each one can be checked in Lens Studio's preview.
1. Pinch the case file, walk to Vale and ask where she was at 22:30. Her full answer plays, with subtitles under her face.
2. Pinch the kettle, then show it to Vale. Her account changes, and her ghost appears in the study.
3. Using only pinches, accuse Vale in the study with the charger cable. The frozen murder plays, then the newspaper appears in your hands.
4. In a full play, no two voices overlap and no line is cut off.
5. Walking at the edge of a suspect's range never makes the row flicker.

## Out of scope
- Voice commands and speech recognition (not available in the preview).
- Building a new case from a scan of your room. This version plays one hand-placed case.
- Multiplayer.
- Recognizing real objects; recording, identifying or following people.

## Risks and open questions
- **Feel unproven:**
  - comfort over a 15-minute case;
  - real hand tracking;
  - how bright the illustrated cast reads on an additive display;
  - spatial audio through open-ear speakers.
- **"Ask your own…" answers live** through Snap's gateway when it's available. Otherwise a typed question gets the recorded answer for its closest topic.
- **The preview room has no occlusion,** so the chalk outline can draw over furniture standing in front of it.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources

## How we judged the final build (Nov 8)
We used the checklist above on the final build (tag `run10-loop`).

- **Does it work? Logic proven.** All five done criteria have LEAF tests, and they pass in the preview:
  - an automated first-time player solves the case in 25 pinches with no drags;
  - a full voiced play logged 17 lines, with no overlaps and none cut short;
  - the row didn't toggle once in 40 crossings of its boundary.
- **Walk around it:** seven views were captured and checked in Interactive Preview: the opening, Vale with the row, Show, a caught lie with its ghost, the accusation, the frozen murder and the newspaper.
- **The three questions:**
  - it puts the suspects, the evidence and the replays in your space where they belong;
  - it leaves your hands free and your eyes up while you walk between people;
  - it doesn't use what you're looking at. The camera isn't part of this version.
  - On a phone, the lists would survive. The walking, the life-size cast and the replay at the real spot would not.
- **Comfort:** faces stay clear, and only one text layer is visible in any direction. Feel is unproven until it's worn.
- **Design notes that changed the build:**
  - one voice at a time;
  - one steady row instead of two button sets;
  - evidence that someone in the story touched, instead of furniture that "remembers";
  - a narrator who sets the mood instead of explaining the controls.
