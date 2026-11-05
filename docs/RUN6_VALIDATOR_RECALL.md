# Run 6 V3 recall — zero-cost saved-corpus replay

The candidate lowers holdout false rejection from **70.6% to 58.8%** while preserving rejection of every saved disallowed sample. This is a bounded improvement in a conservative lexical validator, not a claim of complete natural-language entailment or general attack immunity.

| Saved corpus | Allowed natural | Before rejected | After rejected | Disallowed adversarial accepted | All disallowed accepted |
|---|---:|---:|---:|---:|---:|
| Development, 2026-10-30 | 69 | 32 (46.4%) | 27 (39.1%) | 0 / 96 | 0 / 107 |
| Holdout, 2026-10-30 | 34 | 24 (70.6%) | 20 (58.8%) | 0 / 48 | 0 / 62 |

All nine newly admitted samples already had allowed judgments. Existing judgments were reused unchanged. The saved source corpora were not edited. The holdout was inspected during this repair, so it is regression evidence, not a new unseen evaluation.

## Change

- RoleGuard normalizes inward movement only when it includes a destination preposition; outward travel remains rejected.
- Perfect-aspect death statements retain their named subject and become equivalent to the existing dead-state claim. Negators are never stripped.
- Passive replies are normalized with participant order preserved; swapped participants remain rejected.
- Self-identification and intention synonyms use bounded lexical equivalence, independent of particular names or sentences.
- The capitalized-word check now uses the content gate's same closed equivalence map, allowing a cited verb inflection at the start of a sentence.

No fitted sentence allowlist, acceptance-ratio reduction, citation relaxation, model-judged runtime approval or truth-engine change was introduced. Remaining rejections include protocol-invalid citations, ambiguous shortened accounts, uncited interaction claims and more elaborate discourse. Canonical fallback remains available.

## Verification

55/55 tests pass across `performance.test.ts`, `polish-performance.test.ts` and new `role-normalization.test.ts` (9 new cases). Regressions cover outward movement, changed subjects, negators, passive-role swaps, possessors, foreign names, wrong rooms/times, missing citations and confession additions. Pure tests used the native Vitest config loader and a 120-second process timeout; no full suite or Lens compiler was invoked by this lane.

Reproduce the no-network replay with `node Tooling/node_modules/tsx/dist/cli.mjs Tooling/scripts/run6-validator-rescore.ts`. It never reads `.env`, calls an API or overwrites either saved corpus. It records source hashes and returns a failure exit code if any judged-disallowed sample is accepted. Baseline/candidate detail is in ignored `Tooling/results/run6-validator-{baseline,candidate}.json`; the baseline was recorded before source edits.

Runtime compilation/LEAF acceptance belongs to the main Lens lane. Final source edits: RoleGuard 2026-11-05 14:25:51 PKT; LineValidator 14:25:54 PKT. No further Assets writes after that point.

Cost: **$0 Anthropic, 0 ElevenLabs credits**. No new paid generation or judging.
