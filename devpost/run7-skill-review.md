# Run 7: plan-lens review and action list

## Provenance

On November 5, Codex applied the MIT [Devpost Learn skill pack](https://github.com/challengepost/learn-specs) to Roomscript's existing design at Wadood's explicit request. The skill, AR rules, Preview limits and brief template were read; answers came from Wadood's design decisions and Run 7 prompt. No fresh interview or approval is claimed. The earlier November 4 brief preceded the pack. The local installation is under `Tooling/skills/plan-lens` (initial `.agents/skills` installation disappeared across a Lens restart; cause unproven). The skill is development material, not a Lens runtime dependency.

The pack did not originate the murder-mystery idea, deterministic engine, voiced cast, physical objection, or the judges' R1–R10 recommendations. It formalised those decisions into five observable Preview criteria, exposed stale claims, and supplied the explicit post-build review below. [Updated brief](design-brief.md).

## After the build: judge it — baseline review

This is an evidence review at the start of Run 7, using Run 6's report and existing design/capture records. It is **not a new walk-around or a claim that current pixels were inspected**. Fresh Preview capture review belongs to the main Lens session; update this table as evidence arrives.

| Checklist item | Evidence and finding | Action in Run 7 / acceptance |
|---|---|---|
| 1. Does it work? | Run 6: 462/462 pure tests, strict new-cast bundle playback. Earlier-cast hero passed; replacement hero never dispatched. Terminal proof cannot certify the present Lens. | A2: strict replacement bundle and repaired hero after restart, then promote master. Final integrated suite remains a separate gate. |
| 2. Walk around it | Prior captures show prototype staging; Run 6 new actor images are offline composites. No fresh Run 7 walk-around evidence. | Capture each suspect and near/far object/suspect views in Evening Room; inspect face clearance, surfaces, targets and panel count. |
| 3a. Uses what I look at? | Current authored anchors do not demonstrate recognition. Distance-dependent questions and live casting are requested, not yet proven. | R2 nearest in-view suspect within about 1.5 m; R3 scan 3–5 viewpoints, at least five placements within about 25 cm, verified case and reviewed sweep. Record no-go if unmet. |
| 3b. Puts things where they belong? | Existing room binding is tested; boxes and new art wiring remain presentation risks. | Hide stand-in boxes in Director/film; labels attach to visible furniture; props rest on surfaces; no card across a face. |
| 3c. Body free / better than phone? | Carried statement-to-evidence objection is the distinctive spatial action. Menus and small chips can hide it. | Headline voiced suspects and physical objection; add pulled memory and lifted inspection with standard SIK paths. Do not equate mouse testing with real hand comfort. |
| 4a. In view and reachable? | Prior panel count and small controls remain risks; fresh angular check missing. | R1 one small world panel, three question chips plus More, at least about 2.5° target height. Crate HUD stays below faces. Peripheral toasts remain inside useful view and disappear. |
| 4b. Readable and quiet? | Brighter art/OFL fonts exist offline. Runtime styling/reveal is not visually accepted. | A3/R1 all pose captures; Anton/Courier Prime; icon + three words; one-line speaker subtitles; room marks and optional notebook; stamp + stars. |
| 5. Label what is known | Old brief mixed stale gate status with design intent. Physical hardware remains absent. | Separate logic proven from feel unproven and planned from implemented. Actual saved scan = recorded scan; authored fixture = authored anchors; live scan only after a real call. |
| 6. Design notes | The judges already supplied concrete R1–R10 direction. The pack turns it into observable acceptance rather than new scope. | Use the ordered work list below; test and capture after each meaningful Lens change. |
| 7. Submit | Prior video plan starts slowly, lacks continuous gameplay, assumes old provider/audio/counts and omits Dynamic. | R9/R10: gameplay in first 10s, audience by 0:20, uncut 60–90s, same room/new murder shot, 15s AI-voices/engine-truth explanation. Publication stays Wadood's final action. |

## Ordered work list used by this run

1. **Preserve the real baseline.** Commit user edits, pass A2 on the replacement cast, record strict outcomes and promote only after the gate.
2. **Prove or reject scanning.** Capture -> detect -> locate/merge -> compile -> sweep. Save measured evidence; no inferred 3D accuracy from nice 2D boxes. Preset replays a genuine saved scan only if one exists. Otherwise label authored anchors.
3. **Make the physical moment readable.** Wire the luminous cast; keep a single compact panel, three big questions, speaker-local subtitles and large carried slips. Review pixels in the actual room.
4. **Let distance replace menus.** Walk toward a suspect/object for its detail, step away for the room-level marks. Keep a Preview fallback that tests the same game action.
5. **Finish the product loop.** Contextual Wren, audio truth gates, story beats, reconstruction and distinct endings; naive route <=40 clicks. Separate current-cast and generated-case tests.
6. **Show what works honestly.** Preset carries the story; Dynamic needs three seeded LEAF verdicts before the video calls it a working capability. Capture an actual continuous opening-to-answer segment. Claims in README/Devpost must match the final run report.

## What the skill pack changed

- Replaced the old brief's seven broad evidence categories with five concrete Preview criteria and explicit validation boundaries.
- Tightened the visual contract from two panels to one small panel and added angular target sizing, distance rules, appearance/exit rules and out-of-view cues.
- Made the camera-recognition caution explicit and preserved Wadood's bounded spike as an experimental exception, with an authored fallback and honest fixture provenance.
- Corrected stale manual-only scope, November 7 freeze, old Vale blockage and voice/validator statistics by moving measured results to dated reports.
- Kept the template's Build notes and After the build checklist verbatim, so the owner can repeat the same review after each build.
- Added a claim-by-claim publication gate and continuous-gameplay shot, rather than implying a montage proves a complete run.

## Suggested Devpost answer: how the pack helped

We began Roomscript's design before installing the Devpost Learn pack. During Run 7 we used plan-lens to formalise our existing decisions and review the build against its AR and Preview rules. It made us turn a long feature list into observable checks: one compact panel, large questions near the person you're talking to, evidence on the furniture it concerns, and an authored fallback for unproven sensing. Its after-build checklist also made us separate tested logic from hardware feel and require an uncut gameplay segment. The judges' live feedback supplied the R1–R10 direction; the pack helped us make that direction testable.

## Current outcome

**R8 planning/review: complete. Runtime changes from findings: pending their individual gates.** This document records actions and criteria, not success of the scan, UI or final video. No paid model or audio requests were made by this documentation lane.

## A2 evidence update

After this baseline review, Run 7 A2 passed strict replacement-cast bundled playback in 11.836 s and the repaired hero in 169.471 s. Commit `b3f4144` preserves `Tooling/results/run7-a2-hero.json` and verification logs. Checklist item 1's baseline blocker is resolved; later Run 7 UI/casting/moment work still requires its own integrated gate and fresh capture review.

## Working scan and Dynamic evidence update — November 6

At `338b0db`, the pack's recognition caution has been acted on rather than silently discarded. Preset's **recorded scan** contains seven objects from three distinct CameraModule viewpoints, with retained raw images/JSON/poses and World Query placement evidence. The live Preview path uses three CameraModule frames, Tooling Claude detection and a file reply that reloads Preview before World Query and compilation. Strict `source=file` seeds 7/1041/2026 each reached a correct verdict, exact replay and zero binding errors using one completed live six-object scan. Three case seeds are not three fresh scans. This supports a working Preview Dynamic capability, with the reload and simulated-room limits explicit.

The pack did not invent the file transport or the two-mode design. Its contribution was the demand for observable sensing/placement/gameplay evidence, a stated fallback and a distinction between a recorded scan, authored mapping and live input. The chosen implementation meets those evidence boundaries without asserting a seamless device path. Dedicated art/UI/physical/ghost captures and the continuous voiced take remain pending; compilation is not visual acceptance. See [publication checklist](run7-publication-checklist.md).
