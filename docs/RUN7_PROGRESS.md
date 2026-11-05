# Run 7 live checkpoint

Latest checkpoint, Nov 6 02:15 PKT (supersedes older counts below):

- Master pushed through `338b0db`. Preset saved scan: seven real furniture detections from three viewpoints. Dynamic file handoff: six detected objects from one completed live request; strict end-to-end LEAF passed seeds 7/1041/2026 with exact graph/log replay and return to Preset. These are three seeds, not three separate paid scans.
- Latest offline suite: 504 tests in 57 files passed, plus pure Engine/Content/Tooling typecheck. No full suite runs concurrently with LEAF.
- Final planned Lens restart handshake 01:53:34 PKT; all three recovery restarts had already been used. Fresh strict bundled voices passed 14.204 s; proximity passed. Memory-card runtime assertions passed at 154.513 s, after its MCP150 deadline, so strict transport gate remains pending.
- Current Lens changes compile and refresh cleanly (02:13, first activity30ms). New native audio instrumentation observed `score.play:MainTheme` blocking3010ms and `cue.track:Knock`1519ms. Production clock now loops instead of reopening once per second; identical score requests are deduplicated. Playback regression and live AI gate pending; do not claim this resolves all latency.
- Actual 10-second Preview Perfetto trace:395 complete frames, ProcessFrame mean10.71ms, Render mean5.24ms; paired non-overlapping wall spans mean15.95ms, p90 20.30ms. Frame starts25.27ms apart (~39.6Hz). Track inclusive9.13ms/frame; no scheduler/GPU attribution. Target8ms is not met. Ignore the generic analyzer's pooled-slice FPS estimate.
- Project metadata rename verified through Editor API readback: **Roomscript**. RSG credentials are temporarily live for verification and MUST be blanked before the next commit.
- Costs: Claude7 calls estimated$0.081204; ElevenLabs2954 header-confirmed credits,304 voice clips+4 effects. No quota error. Voice-agent spike remains no-go for direct unverified generated speech.
- Automatic approval review rejected a public Cloudflare relay because it would forward camera/questions/responses through an additional intermediary. No tunnel started; the authorized local file handoff works. User permission remains unanswered; no dependent relay work proceeds.

## Verified packages

- R8: project-local MIT plan-lens installed; design-derived draft brief and current-build review recorded. No invented interview or physical walk-around. Review drives single-panel, three-chip, proximity, real scan and continuous-footage work.
- A2: fresh post-import strict bundled voices and repaired hero passed on the new cast. Hero 169.471 s, correct verdict and exact replay, zero network. `master` fast-forwarded and pushed to 7a8cf35. No m3 tag yet.
- Lane B pure engine: compact actual-room generated case policy, complete line/phrase banks, PlayerKnowledge-only Wren, route replay, terminal case identity/ending fixes. 29 focused tests and pure typecheck passed; authored-room seeds 7/1041/2026 reached correct verdict in 60 case-minutes and replayed exactly.
- Lane C assets: 273 voice clips (252 phrases, 14 casting lines, seven Wren tips), four effects; all inventories/decodes/timings verified. 2,129,649 audio bytes, 2,599 header-confirmed credits, no quota errors. Runtime wiring still pending. Direct ElevenLabs conversational stream is no-go: protocol/tool calls alone cannot enforce exact engine-approved performance; tested fail-closed gate documented, live microphone/WSS unverified.

## Camera spike in progress

- Actual CameraModule frames exported from three useful Evening Room viewpoints. Claude Opus strict JSON detects furniture; a revised prompt rejects framed art/rugs/records instead of forcing false types.
- Local HTTP blocked by Lens experimental-API requirement. Recovery restart 1/3 at 23:50:39 PKT; retry reproduced the security restriction. No raw HTTP to Lens MCP. Supported Editor API exposes no experimental setting; selected user-authorized offline capture/Tooling scan transport.
- Three strict room-scan probes passed. Seven actual objects have World Query hits. Speaker repeated hits differ ~2.4 cm, chair ~24 cm, coffee table ~20 cm; rejected record player's wall hit in favor of tabletop hit. Large furniture box centres sample different points on the same surface, not necessarily its geometric centre. Final visual placement and case compile are pending.
- The saved scan retains original JPEGs, poses, raw model JSON, boxes, hit normals and chosen observations. `Tooling/results/run7-room-scan/accepted-room.json` is the candidate fixture; do not call Dynamic live or the spike accepted yet.

## Remaining

Main: scan overlay/casting gate; live transport; Dynamic scene reset and three-seed LEAF; A3 five-pose art wiring; R1/R2 UI diet/proximity; physical actions; contextual Wren; audio and story beats; live answers; hero VFX, naive-player, S2 timing; integrated final gate/captures/continuous clip; size/NOTICE. Workers own active-case adapters and art binding preparation. No multiplayer.

Costs: Claude ledger in Tooling/results/run7-claude-ledger.json (token estimate, not invoice); ElevenLabs exact 2,599 credits as of v3. Budgets never block remaining development.

Run7 Dynamic checkpoint 01:38 PKT: strict single-seed source=file LEAF passed 7,1041,2026. These reuse the completed live camera reply, not three fresh paid scans. Six detected physical objects; all runs reached correct verdict, no room-binding errors, exact runtime replay and Preset reset. Exact-graph tapes: Tooling/results/run7-file-seed{7,1041,2026}.json. Case IDs RS-b1d95b61, RS-72d38772, RS-1a501b7e; replay harvest passed. Current runtime batch includes compact questions, physical pull/lift, narrative audio, route/ghost endings and new poses, but their visual and dedicated acceptance gates remain pending. Claude7calls estimated$0.081204, ElevenLabs2954confirmedcredits. RSGtokens generated into transient tool memory for next live gate; not wired into scene at this checkpoint.

Run7 02:34 PKT verified checkpoint: strict roomscript-actor-pose-capture passed105.966s,20distinct pose textures matched active native renderers without changing gameplay. Near-Vale capture exposed legacy marker/ring clutter and subtitle overflow; contextual marks, idle-ring removal, bounded panel text and lower question placement now compile/start clean36ms, fresh visual gate pending. Strict roomscript-live-ai-beat passed163.461s: Gemini director response selected bundled suspect performance(4pieces,no fallback), Wren chose valid knowledge-only option and actual liveTTS played(1attempt/1played/0fallback), unchangedtruth and exact replay. Tape Tooling/results/run7-live-ai-beat.json. Gateway tokens blanked throughVirtualScene andproject saved beforecommit. B1 letter/voicemail/flight/UV presentation wired;8focused pure tests in3files andpuretypecheck passed; B1visualgate pending. Metadata Roomscript persisted. Final integrated suite, continuousfilm,8mstarget and m3 remain pending.
