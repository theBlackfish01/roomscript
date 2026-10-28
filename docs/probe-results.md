# Probe results

2026-10-28 first build: **not measured**. MCP disconnected during gateway dependency repair before ProbeLab was built. No model or fallback decision has been made from missing measurements.

| Probe | Status | Result |
|---|---|---|
| P-a OpenAI strict JSON | not run | p50/p95 and adherence unknown |
| P-b Gemini response schema | not run | p50/p95 unknown |
| P-c OpenAI TTS | not run | latency/playback unknown |
| P-d built-in TTS | not run | Preview behavior unknown |
| P-e Imagen | not run | latency/refusals/display unknown |
| P-f four parallel chats | not run | throttling unknown |
| P-g camera stream | not run | source unknown |
| P-h Sync Kit | deferred to F | no sync package/probe yet |

Preflight confirmed LS 5.23.2, sign-in, Specs target, World tracking, SIK/UIKit, and SPECS 27 Interactive Preview. These are setup checks, not AI probe results.
