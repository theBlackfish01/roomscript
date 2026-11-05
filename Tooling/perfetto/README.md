# Run 7 performance capture and analysis

Prepared offline for S2. No measured performance claim exists until a real Preview trace is captured and analyzed. The product target is **8 ms**; the upstream analyzer's 16.67 ms frame budget is a separate reference.

## Capture (main Lens session only)

1. Confirm the Preview MCP connection with `ListAllPanels` after imports and startup settle.
2. Execute the exact static contents of `capture-start.ts.txt` through `ExecuteEditorCode`. It schedules a 10-second profiling session and returns immediately. It only enumerates Preview panels and invokes the profiling API; it does not click, focus or automate the GUI.
3. After 10 seconds, execute `capture-status.ts.txt`. The scheduled callback finishes each session. If capture must be canceled, execute `capture-cleanup.ts.txt`.
4. Analyze the returned `.pftrace` path, one trace at a time. Do not run a full test suite or art render concurrently.

`Support/editor.d.ts` omits this API. The canonical CLAD capture skill uses `preview.profiling.startTrace(new Editor.Path(path))`, `activeTraceSession`, and session `finish()`. The installed Lens Studio native executable contains these adjacent export names; offsets are recorded in `native-api-evidence.json`. This corroborates the canonical recipe, but the runtime capability guard remains necessary. No Editor API call has been made by this worker.

## Local analyzer

Python 3.13.18 and all packages are installed only under ignored `Tooling/bin/perfetto/`. `requirements-lock.txt` pins the resolved package versions. Perfetto's native processor is v59.1, downloaded from its release manifest and checked against SHA-256 `3acc5aca1c764541033a82ba3bb0a47524b5c3c0aa194eea8d9a7b0cdb346bdc`. The wrappers explicitly pass its local path, preventing the package's default user-profile cache download. `check_setup.py` passed the import and binary hash checks on Nov 6; this does not exercise a real trace or start a processor process.

From the repository root (replace `<trace.pftrace>` with the exact captured filename):

```powershell
node Tooling/scripts/run-bounded.mjs 120 Tooling/bin/perfetto/venv/Scripts/python.exe -u Tooling/perfetto/run_analysis.py '<trace.pftrace>'
```

Save the JSON report under `Tooling/results/performance/`. Start with this phase-one summary. Resolve expensive script component IDs to scene names through main's Lens MCP session before attributing costs. Only if the summary leaves a specific question unanswered, use the optional SQL server:

```powershell
node Tooling/scripts/run-bounded.mjs 120 Tooling/bin/perfetto/venv/Scripts/python.exe -u Tooling/perfetto/run_trace_server.py '<trace.pftrace>'
```

Wait for `Ready.` on stderr, then send bounded SQL through stdin per `sql-recipes.md`. Do not open a browser. A 120-second wrapper bounds either process; use explicit teardown after queries.

Dependency tooling: uv 0.13.7, downloaded from official astral-sh/uv releases. Future uv commands must set `--cache-dir Tooling/bin/perfetto/cache`, `UV_PYTHON_INSTALL_DIR`, and `UV_PYTHON_BIN_DIR` to the corresponding project-local folders; these settings are not global or persistent. Install Python using `--no-bin --no-registry --no-config`. Do not install globally or change PATH.

## Provenance

`analyze_lens_trace.py`, `trace_server.py`, `requirements-perfetto.txt`, and `sql-recipes.md` are unchanged copies of the installed `ls-clad:perfetto-trace-analysis` skill's scripts/resources. The Python files retain their upstream Apache-2.0 headers. The three capture snippets derive from `ls-clad:specs-capture-perf-trace`, with only project path, prefix, duration, and state-key constants set for Roomscript. `project_processor.py` and the two `run_*.py` adapters are project code. Include the CLAD Apache-2.0 attribution in the final NOTICE audit.
