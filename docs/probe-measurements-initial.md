# Probe measurements

Latencies are milliseconds from successful samples only. Percentiles use nearest rank: sorted[ceil(p × N) − 1]. A dash means no successful samples.

Selection: all selected lines; input byte offset 1623625. Repeated samples and repeated completed batches are counted, never deduplicated.

Done markers count observed protocol markers; they do not prove that every expected sample completed, especially after resets.

| Probe / model | Samples | Success | Failure | p50 ms | p95 ms | Done markers | Success details | Failure details |
|---|---:|---:|---:|---:|---:|---:|---|---|
| P-a:gpt-4.1-nano | 20 | 0 | 20 | — | — | 1 | — | not_found: 20 |
| P-a:gpt-4o-mini | 20 | 8 | 12 | 1766 | 2051 | 1 | schema_valid: 8 | rate_limit: 12 |
| P-b:gemini-2.0-flash | 20 | 0 | 20 | — | — | 1 | — | not_found: 20 |
| P-b:gemini-2.5-flash | 20 | 20 | 0 | 1743 | 2361 | 1 | schema_valid: 20 | — |
| P-c | 20 | 20 | 0 | 2217 | 3205 | 1 | audio_loaded;playing=true: 20 | — |
| P-d | 20 | 0 | 20 | — | — | 1 | — | unsupported_api: 20 |
| P-e | 20 | 0 | 20 | — | — | 1 | — | rate_limit: 9; request_failed: 11 |
| P-f | 20 | 6 | 14 | 1993 | 2741 | 1 | 4_schema_valid;gpt-4o-mini: 6 | rate_limit: 14 |

Malformed protocol lines skipped: 0. Other non-empty log lines ignored: 116.

Only allowlisted probe/model identifiers and diagnostic codes are retained. Unrecognized detail text is counted as redacted_detail; raw log text, exception messages and credentials are never copied.
