# Probe results — 2026-10-28

Lens Studio 5.23.2.26081320, SPECS 27 Preview, RSG 2.0.1. Each provider/model has 20 attempts. Successful-only p50/p95 use nearest rank; failures are not fast successes.

| Probe | Success / attempts | p50 / p95 ms | Finding |
|---|---:|---:|---|
| P-a gpt-4.1-nano strict JSON | 0/20 | — | Not found |
| P-a gpt-4o-mini strict JSON | 8/20 | 1766 / 2051 | All successes match schema; 12 rate limits |
| P-b gemini-2.5-flash responseSchema | 20/20 | 1743 / 2361 | Exact schema and content checks pass |
| P-b gemini-2.0-flash responseSchema | 0/20 | — | Publisher model unavailable or project lacks access |
| P-c gpt-4o-mini-tts, onyx, acting instructions | 20/20 | 2217 / 3205 | Audio asset loaded; AudioComponent reports playing |
| P-d built-in TTS | unsupported | — | Deprecated TextToSpeechModule declares no synthesis methods; 20 capability records, not remote calls |
| P-e imagen-3.0-generate-002 | 0/20 | — | Exact package example: 5 configuration-not-supported errors, then 15 rate limits |
| P-f four simultaneous gpt-4o-mini calls | 13/20 batches | 3043 / 5294 | 7 batches rate limited; every sibling settled before next batch, 2s inter-batch gap |
| P-g Default_Color stream | 20/20 | 273 / 284 | Simulated Evening Room visible; includes intentional 250ms observation window |
| P-h Sync Kit | deferred | — | Stage F gate |

Evidence: [initial measurements](probe-measurements-initial.md), [corrected measurements](probe-measurements-corrected.md). Initial E/F are diagnostic-only: E used a different parameter set; F could return before rejected batch siblings settled. Corrected E/F replace them. Earlier interrupted A and local material-failure G attempts are excluded. Source log baselines: 1623625 and 1809777 bytes respectively.

Camera capture: [frame 1](captures/2026-10-28-a4-camera-fixed.png), [frame 2](captures/2026-10-28-a4-camera-frame2.png). The stream contains the environment, not the AR UI, suitable for simulated-room vision input. Speech evidence is runtime playback state and audio asset loading, not human listening quality. No image was produced, so Imagen texture quality is unverified.

The simple strict-schema prompt is an API capability probe, not the gameplay validator acceptance test. Stage B/C must separately validate real suspect answers against current-layer fact sheets.
