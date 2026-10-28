# Roomscript tooling

Run `npm ci` then `npm test` in this folder. Tests import the pure TypeScript engine directly from `Assets/Scripts/Engine/` and content from `Assets/Scripts/Content/`. This tooling never compiles Lens components: use the Lens Studio recompilation MCP tool for those.

From the project root, enable the tracked hook with `git config core.hooksPath .githooks`. The hook runs `node Tooling/scripts/check-secrets.mjs` against staged blob contents. It fails closed if Git or a scene parser fails, and never prints credential values.

Before staging a scene with gateway credentials, run `node Tooling/scripts/strip-scene-tokens.mjs` from any directory. It defaults to `Assets/Scene.scene`; extra arguments are project-relative scene paths. It blanks the three gateway credential fields while preserving all unrelated text, tags, comments and line endings. It refuses unexpected value shapes. Then stage the cleaned scene again. Lens Studio may save the credentials back, so always let the commit hook check the final index. Regenerate credentials in Lens Studio after committing when needed.

The guard detects authorization scheme prefixes even without a credential, PEM blocks, non-empty gateway fields in scenes, and forbidden secret/local filenames. Spell the header prefix as `Bearer\x20` in documentation to avoid matching it literally. Lens `ScriptInputsDefault` and `ScriptTypes` metadata are not credential values.

## Probe measurements

From the project root, run `node Tooling/scripts/probe-results.mjs probe.log docs/probe-measurements.md`. Omit the output filename to print Markdown. The input must contain plain log lines, including optional timestamp or Logger prefixes, with `PROBE|name|ms|true/false|detail` and `PROBE_DONE|name` records.

Successful samples alone determine p50/p95, using nearest rank (`ceil(p * N) - 1` in a sorted zero-based array). Failure-only groups show no latency percentile. Both success and failure diagnostic counts are included. Completed batches and duplicated samples remain counted by default; a done marker is not a completeness assertion.

Use `--start-marker PROBE_READY` to select lines after the **last** occurrence of a marker, or `--from-byte 12345` to select a saved byte offset. An offset in the middle of a line discards that partial line. Both filters can be combined; the marker is then found within the byte-selected suffix. Missing markers and invalid offsets fail rather than silently selecting a different batch.

The report retains only known P-a through P-h identifiers, explicitly allowlisted model IDs and safe diagnostic codes. Unknown detail text becomes `redacted_detail`; unknown model names and malformed protocol records are skipped and counted. Add new probe models and safe codes to the allowlists when extending ProbeLab. Raw log content, input paths, exception text, start-marker text, and credentials are never copied to the report.
