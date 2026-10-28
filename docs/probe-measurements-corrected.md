# Probe measurements

Latencies are milliseconds from successful samples only. Percentiles use nearest rank: sorted[ceil(p × N) − 1]. A dash means no successful samples.

Selection: all selected lines; input byte offset 1809777. Repeated samples and repeated completed batches are counted, never deduplicated.

Done markers count observed protocol markers; they do not prove that every expected sample completed, especially after resets.

| Probe / model | Samples | Success | Failure | p50 ms | p95 ms | Done markers | Success details | Failure details |
|---|---:|---:|---:|---:|---:|---:|---|---|
| P-e | 20 | 0 | 20 | — | — | 1 | — | configuration_not_supported: 5; rate_limit: 15 |
| P-f | 20 | 13 | 7 | 3043 | 5294 | 1 | 4_schema_valid;gpt-4o-mini: 13 | rate_limit: 7 |
| P-g | 20 | 20 | 0 | 273 | 284 | 1 | frames=5;1392x1590: 1; frames=7;1392x1590: 2; frames=8;1392x1590: 17 | — |

Malformed protocol lines skipped: 0. Other non-empty log lines ignored: 55.

Only allowlisted probe/model identifiers and diagnostic codes are retained. Unrecognized detail text is counted as redacted_detail; raw log text, exception messages and credentials are never copied.
