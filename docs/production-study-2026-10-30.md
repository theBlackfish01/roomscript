# Production performer study, 30 October 2026

Three strict LEAF batches completed in Preview, ten calls each, after the prompt explicitly required changed word order or shortening. The final study contains 28 live calls and two forced-offline calls, with **zero audio cache hits**. All raw model outputs are action-log events in the saved [report](../Tooling/results/production-study-2026-10-30.json).

| Measurement | Result |
|---|---:|
| Text p50 / p95, 28 live calls | 2442 / 4434 ms |
| First audio p50 / p95, 18 audible calls | 5143 / 5886 ms |
| Audible / subtitle-only | 18 / 12 |
| Audible first sentence beyond 6500 ms | 0 |
| Live model answer / authored fallback | 27 / 1 |
| Questions with a validator rejection | 1/28 (3.57%) |
| Changed wording among accepted model answers | 9/27 (33.33%) |
| During-precache calls with audio | 3/10 |
| Forced-offline calls | 2/2 authored answer, subtitles |

The rejected line was "I heard Harlow respond to Vale after she went into the Study." Manual comparison shows a faithful paraphrase: the observed false-rejection rate was therefore 1/28 (3.57%) in this narrow production corpus. A closed synonym fix and two regressions now accept it while still rejecting reversed participants. This fix was made **after** the timing measurement; the report preserves the actual measured fallback and latency. Rescoring both saved Claude corpora after the fix leaves their reported rates unchanged. No general false-rejection improvement is inferred from this one case.

Audio success is only 18/28 (64.29%) for live calls. The p95 excludes subtitle-only cases and is not a 95% spoken-answer success claim. Precache contention is particularly costly. Most outputs still repeat the canonical account, despite the stronger prompt; 9/27 paraphrases is an improvement over 4/28 in the [initial diagnostic](../Tooling/results/production-study-2026-10-30-initial.json), but expression remains limited.

These are performer calls across four canonical suspect/topic contexts and eight question phrasings, with one charged Ask per context per batch; they are not thirty investigation actions in one 180-minute case. Cold-start means the first call of a fresh Preview run, not a cold gateway server. Each call clears the speech cache; the middle batch deliberately starts precaching. The two offline calls use the same production pipeline with the transport disabled. The whole study ran twice after an earlier asset-reload interruption; only the latest completed samples form the final report.

Strict `roomscript-speech-budget` also passed: actual two-sentence synthesis/playback, authored voice, cached offline speech, uncached subtitle fallback, deadline and cancellation. Pure regression verifies continuation synthesis gets an independent four-second budget while the first sentence keeps the 6.5-second absolute budget.

The local Anthropic study's **$1.0996298** estimate is separate: [validator report](validator-study-2026-10-30.md). Snap gateway billing is not exposed by these tools, so no monetary total is claimed for gateway requests.
