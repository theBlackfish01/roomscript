# Dedicated casting sweep gate (staged)

No Assets writes or Lens calls by this lane. Main publishes after its import hold and compiles via MCP. No runtime/visual pass is claimed.

Staged files: `Tooling/staging/RoomscriptCastingController.ts`, `RoomscriptCastingSweepLeafScenario.ts`, and updated `RoomscriptAudio.ts`. Authoritative input hashes are in `run7-casting-sources.json`. The Audio patch preserves the score-start guard and live Wren implementation.

Register `RoomscriptCastingSweepLeafScenario` as `roomscript-casting-sweep` with `audit="true"`, `captureIndex="-1"`. Suggested MCP timeout300s; internal overall sweep wait bounds200wall-seconds /115simulation-seconds /7000frames, plus preparation45wall-seconds. Run from fresh Preview because it verifies the sweep does not start before the real crate pull.

Gate checks:

- Preset is the default, provenance is recorded scan, and no scan output is logged before pulling.
- Actual DefaultLeafInteractor drag of RoomscriptPullTab starts the sweep.
- All seven labels have unique IDs and separated positions matching the accepted furniture points plus the existing12cm vertical label offset. No WorldQuery accuracy beyond that accepted fixture is claimed.
- Only one mark enabled at a time; indices advance in order; all seven appear and then hide.
- Seven exact narrator lines and the final Harlow line exist in the bundled library; Audio's per-exact-line observation sees native isPlaying or advancing playhead. Counters alone do not pass.
- Each narration completes before the next label; no subtitle-only casting fallback passes.
- Raw ROOM_SCAN_PROBE responses are present once each as source=replay LlmOutput log actions with exact saved content/model. Case envelope/facts/statements and knowledge/verdict remain unchanged.

Director capture: `audit="false",captureIndex="0"` (through6) holds exactly one label for120seconds and prints CASTING_DIRECTOR_CAPTURE with `presentationOnly:true,sweepVerified:false`. The label itself reads DIRECTOR HOLD. This is staged visual inspection, not proof the sweep played. `audit=true,captureIndex=...` holds a label only after the full strict gate passes. Main still needs actual captures showing the furniture, readable label and absence of face overlap.

Production defects corrected in staging: missing Audio previously advanced every label immediately; narration false/subtitle fallbacks were ignored; hide did not cancel an in-flight sweep; final narration lacked a revision check. New fallback labels hold at least2.4seconds and report explicit fallback, while strict gate fails that fallback. hide/showAll/Director hold cancel obsolete visual sequencing. Optional chime failure cannot abort the whole visual fallback.

## Wren queue finding

askWren awaits narrateAdmittedWren, which previously appended behind every queued introductory narration/dialogue. Actual OpeningExchange is16.13seconds and ArrivalDialogue5.81seconds, with Listen/Nobody/casting/tip speech potentially queued as well. Suspect speech pauses narrator, so intro backlog can remain after the first live answer. The exact queue length during main's run is runtime-only evidence (`narrativeDiagnostics().queued`).

Safe staged change: explicit engine-admitted Wren answers enter the front of the pending queue. The currently playing line is allowed to finish, all gates are checked again, and essential dialogues are neither dropped nor canceled. This reduces queue backlog without interrupting or falsifying a confession/voicemail beat. It does not guarantee a30-second first answer under the measured native audio stalls.
