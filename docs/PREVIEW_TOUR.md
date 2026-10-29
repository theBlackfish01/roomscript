# Ten-minute Preview tour

The saved scene starts in **Stage mode**: authored answers, captions and bundled cues, with no gateway credentials required. Keep Lens Studio in the foreground. Reset Preview to restart the case. The complete combined tour is **not yet integration-verified**: the latest session suffered JavaScript execution timeouts. Earlier opening, cast, clue, objection and ending scenarios passed separately.

1. **0:00–1:00 — Place the case.** Face the crate. Use the floor up/down and rotation controls to align the fixture markers, then **Place case**. Wait for the knocks and pull the crate's tab. Watch the light, chalk outline, envelope and four arrivals. Investigation begins after the opening.
2. **1:00–2:00 — Meet the cast.** Select Qadir, Vale, Okafor and Pike using their actor buttons or the crate selector. Ask **Your name** for each. Select Vale and ask **Your brooch**, then **Whereabouts**. Compare the quiet truthful answer with the authored lie tell. Answers and evidence appear by the crate, away from faces.
3. **2:00–3:00 — Break the first alibi.** Inspect the **kettle** fixture. Close its memory card, keep Vale's whereabouts statement active, and use **Object** to present **E_KETTLE_COLD** from the wallet. Pinch the statement slip and release it aligned with the memory card. Watch the yellow objection, shards and coral proof thread. Vale advances to her second account.
4. **3:00–4:30 — Present a witness statement.** Select Okafor, use **More questions** until **About Harlow** appears, and ask it. Return to Vale and ask **Whereabouts** again. Open the objection wallet, choose Okafor's reply (**C_OKAFOR_REPLY**) and drop the slip onto its memory card. This breaks the second account. The new pagination is compiled but awaits a clean UI test.
5. **4:30–6:30 — Collect the proof.** Inspect the candlestick, letter knife, medicine bottle, marble bookend, desk lamp, door latch and window glass. The kettle was already inspected. Close each memory card before the next. These eight holders provide the unique-solution route. The lamp and heard alibi support the alibi deduction; the objections supply additional argument evidence.
6. **6:30–7:30 — Try a suggestion.** Drop Qadir's pawn aligned with **Study**, then choose the **charger cable**. Watch the ordered suspect sweep and refutation card; close the refutation. A suggestion nobody refutes reports uncertainty and does not reveal the sealed answer by animation.
7. **7:30–9:00 — Accuse.** Choose **Accuse**, set **Vale / Study / charger cable**, then **File known proof**. Hold the seal for at least one second. Watch the simplified truth reconstruction, ending, deduction count, rating and case seal. A wrong accusation is final. At the night limit, the game offers one final accusation.
8. **9:00–10:00 — Review or reset.** The guided route values interrogation over the fastest score. Reset for another run. Live dialogue needs Stage mode disabled and fresh gateway credentials; offline captions are the reliable saved configuration.

## Reproducible offline evidence

From `Tooling/`, `npm run play -- --demo` runs the authored terminal route. `npx tsx scripts/build-hero-tape.ts` regenerates `results/hero-authored-tape-2026-10-30.json`. This is an honest terminal action tape, **not a completed Preview capture or fabricated model output**. Its golden replay test verifies the case seal, state hash `1ff9cf13`, all four deductions, both Vale layers, three correct objections, a refutation and the correct verdict: 145 case-minutes, rating 2/3, fully supported par 85.

After Preview is responsive, run strict `roomscript-all-tells`, `roomscript-interrogation` and `roomscript-hero-demo`. The hero scenario exercises the actual opening, questions, drops and closing, but selects its witness wallet item through the wallet controller. Only after it passes should `scripts/harvest-hero-demo.ts <Lens-log-path>` create the separate Preview tape.

## Physical Specs checks

Check floor alignment, additive-display readability, spatial audio, comfortable ray drops, keyboard/ASR and performance. The Preview room is simulated; placement uses manual calibration and visible fixture markers. No automatic room scan or physical-device verification is claimed.
