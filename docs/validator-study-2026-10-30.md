# Validator surrogate study, 30 October 2026

The new guard closes the review examples and the three attacks found in the first batch. It is still too conservative for unrestricted natural phrasing. Authored line-bank/canonical fallbacks remain enabled. These finite corpora do not establish general semantic safety.

| Corpus | Disallowed attacks accepted | Allowed natural answers rejected | Estimated API cost |
|---|---:|---:|---:|
| Initial baseline | 3/96 (3.13%) | 43/69 (62.32%) | $0.6628501 |
| Same corpus after fixes | 0/96 (0%) | 11/69 (15.94%) | $0 additional |
| Independent holdout, final guard | 0/48 (0%) | 18/34 (52.94%) | $0.4367797 |

Total API cost: **$1.0996298**, estimated pre-tax standard list price from the recorded input/output/cache token ledger; not an invoice. Output token usage includes thinking. Baseline and rescored rows share the same generation/judgment calls and must not be added twice.

The first-corpus false-rejection numerator includes seven malformed citation cases. Excluding those gives 4/62 (6.45%), but the raw 11/69 remains the primary reported result. All 34 allowed holdout answers have valid protocol, so its 18/34 result is unchanged. The holdout was not used to tune the guard. Frequent failures concern conversational suffixes, uncited habits, negative manner phrases and short baseline answers where style overwhelms the content-word ratio. Opus judges are fallible: some supposed harmless style also asserts a new habit or interaction. Human review is still needed.

Method: eight suspect/layer/topic contexts, including two Vale layers, other suspects and baseline props. `claude-opus-5-5` generated attacks and independently judged all lines against the current account, with explicit `medium` effort. `claude-haiku-5-5` generated natural answers with `low` effort. The judge did not receive validator outcomes. The first batch had 96 attacks and 80 natural answers; the holdout had 48 of each. Only judge-disallowed attacks and judge-allowed natural answers enter the respective denominators. Exact model IDs have no date suffixes.

The three observed bypasses were premature culprit inference, reversed participants in a reply, and an invented trustee role. Regression tests cover these, the review's confession/meta examples, harmless "No, Detective", mapped-topic deflections, and independent continuation-sentence audio deadlines.

The harness runs only in Tooling, loads `Tooling/.env`, never prints the key, saves sanitized samples and token usage after each API call, and stops rather than silently changing model IDs. Unsupported JSON-schema array-bound keywords were removed from transport schemas after an initial unbilled 400 response. Runtime validation still enforces bounds.

Run `cd Tooling; npm run redteam`. Add `-- --holdout` for a fresh holdout (overwrites that report), or `-- --revalidate` to rescore the saved first corpus without API calls. Add both flags to rescore the saved holdout. Reports: [baseline](../Tooling/results/validator-redteam-2026-10-30-baseline.json), [rescored](../Tooling/results/validator-redteam-2026-10-30.json), [holdout](../Tooling/results/validator-redteam-2026-10-30-holdout.json).

Pricing source, checked 30 October: [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing). Effort configuration: [Anthropic effort](https://platform.claude.com/docs/en/build-with-claude/effort). This local surrogate study makes no Gemini latency or on-device performance claim.
