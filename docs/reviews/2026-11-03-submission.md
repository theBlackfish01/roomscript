# Roomscript — submission, publication and presentation review (reviewer 4)

Prepared Tue 2026-11-03 (PKT). Repo reviewed read-only at `<project>`, HEAD `c343bb8` (49 commits, Oct 28 19:55 → Oct 30 01:42 PKT; tags `m0-probe`, `m1-terminal`, `m2-slice`; nothing committed since Oct 30). There are five modified tracked files and untracked `docs/REVIEW_2026-10-28.md`, `docs/REVIEW_2026-10-29.md` and `docs/reviews/`.

Drafts in `<local-development-path>`:
- `README-draft.md`: a judge-facing README for the repo root.
- `devpost-description-draft.md`: the Devpost form fields and the story text.
- `video-plan.md`: the shot list with timings, the capture method, the VO script, cards, music and the honesty rules.
- `clad-log-and-how-built.md`: the rewritten CLAD-log structure and the "How it was built" section.
- `history-scan.txt` and `allpaths.txt`: the raw output of the git-history audit. No secret values appear.

---

## 0. Source caveat (read first)

**The Devpost pages returned HTTP 403 to the built-in WebFetch** (`/`, `/rules`, `/resources`, `/updates`). I re-verified requirements in three other ways, all using built-in WebSearch/WebFetch only (no Exa, Tavily or Consensus):
- search-engine extracts of the official page;
- the official skill pack the page points to (`github.com/challengepost/learn-specs`): its README, `skills/plan-lens/SKILL.md` and `templates/design-brief-template.md`;
- other entrants' public repos.

**I could not read these, so Wadood should open them in his own browser (about 10 minutes, by Thu):**
- the full `/rules` text: video music and copyright, third-party IP, open-source and licence clause, judging weights and tie-break, post-deadline edits;
- the `/resources` Quick Start;
- `/updates` and any FAQ;
- the "Enter a submission" form, for its custom questions and required "Built with" tags.

Treat everything below marked **[unverified]** as unconfirmed until he has seen it.

## 1. Rules and requirements checklist

| # | Requirement (source) | Status for Roomscript |
|---|---|---|
| 1 | **New project started in the submission period, Oct 15 → Nov 9 2026.** "Old ideas are fine but old code is not." (official page via search) | **Done.** Project created Oct 26 (LS 5.24.1) and recreated Oct 28 (LS 5.23.2); first commit Oct 28. Adapted code is CLAD Apache-2.0 templates, credited in NOTICE. |
| 2 | **Built by a coding agent in Lens Studio through CLAD and the Lens Studio MCP.** (page; skill pack) | **Done, with strong evidence** (§3). Gap: the evidence is scattered and the log is disordered. |
| 3 | **Runs in Lens Studio Preview; Specs not required.** (page) | **Partly.** Every stage passed separately in Preview: opening, cast, clue, objection, ending and placement LEAF. The **integrated hero run is not verified**: on Oct 30 `roomscript-hero-demo`/`all-tells`/`interrogation` hit JavaScript execution timeouts (PROGRESS "Needs Wadood"). **This is the #1 risk to the video.** |
| 4 | **Demo video: public on YouTube, shows the Lens working, under 3 minutes.** (page; brief template) **Reviewers won't clone or run projects; the video must show it working end to end.** (page, new emphasis) | **Missing.** Plan in `video-plan.md`, target 2:50. |
| 5 | **Public repo (GitHub/GitLab/Bitbucket) with the Lens Studio project files *and the `devpost/` folder*.** (page; skill-pack README: "publish the Lens project folder, with `devpost/` inside it") | **Missing (not yet public).** Repo root = Lens project, so the structure is right. History is clean (§2). |
| 6 | **The `devpost/` planning folder.** The skill pack's `plan-lens` writes **`devpost/design-brief.md`** (sections: one spatial moment, why glasses, product/overlay, where things live, hands/input, when things show, done criteria, out of scope, risks, build notes, "After the build: judge it"). | **Gap.** `devpost/` holds only `clad-log.md`. The real planning lives in `docs/plan/` and `docs/design/` (Oct 25–27). **Add `devpost/design-brief.md`**, labelled honestly with its provenance (see §3.4), plus a `devpost/README.md` index. |
| 7 | **Short description:** what the Lens does, who it's for, what you learned. (page) | **Missing.** Draft in `devpost-description-draft.md`. |
| 8 | Eligibility: above the age of majority; all countries except the standard exceptions. (page) | Presumably OK (Pakistan). **[verify on /rules]** |
| 9 | Deadline **Nov 9 2026, 5:00 pm EST = Tue Nov 10, 03:00 PKT**. (page) | Plan to submit Mon Nov 9 by 21:00 PKT. |
| 10 | Judging: **Design** (complete, coherent product, not a tech demo); **Technical Implementation** (build quality and use of CLAD, Lens Studio and the MCP); **Innovation/Idea**; **Presentation** (video shows it working end to end; pitch covers problem, audience and why it matters; easy to follow). Equal weights per earlier research. **[weights unverified]** | Write-up and video are structured against these four (see the drafts). |
| 11 | Live sessions: Oct 29 build session (recorded); **Thu Nov 5, 12 pm ET = 22:00 PKT, "SPECS Live Review: Inside the Judging Criteria"**. | The Nov 5 session is a judging-criteria review. It may not be a per-project review (§5). |
| 12 | Brief template's "After the build" list:<br>• which LEAF tests passed and which criteria lack tests;<br>• walk around in Interactive Preview;<br>• "would a phone do just as well?";<br>• comfort;<br>• **label "logic proven" vs "feel unproven"**. | Use this exact vocabulary in the README and Devpost. Judges wrote it. |
| 13 | Preview limits (skill pack): AI and voice "need a stand-in (button or hard-coded answer)"; real-object recognition and live camera vision can't be shown. | **Aligned.** Stage mode (authored answers plus captions), topic chips, and manual placement with fixture markers. Say so explicitly. It is a strength, not a weakness. |
| 14 | Prizes: $2,500 (1st $1,250, 2nd $750, 3rd $500). Every eligible entry gets a Devpost Learn badge and a Discord role. | — |
| 15 | Music, copyright, trademarks, required tags, form questions | **[unverified, 403]**. Assume the Devpost norm: no copyrighted music, no third-party marks or logos without permission. |

**New since earlier research:**
- (a) Reviewers explicitly won't run the project.
- (b) The planning artefact the organisers expect is specifically `devpost/design-brief.md` from `plan-lens`.
- (c) Their "logic proven / feel unproven" labelling convention.
- (d) Repo hosting may be GitHub, GitLab or Bitbucket.
- (e) The Nov 5 session is a criteria walkthrough.

## 2. Going public safely

### 2.1 Secret audit of the entire history: clean
I scanned **all 888 blobs reachable from every ref** (`history-scan.txt`):
[Historical authorization-header reference redacted for publication.]
- generic `api_key=`;
- scene token fields;
- local paths, e-mails and phone numbers.

Results:
- **Zero real secrets in history.** The only token-shaped hits are synthetic fixtures (`"synthetic"`, `"opaque…"`) in `Tooling/tests/tooling/secrets.test.ts` and `harvest-tape.test.ts`.
- **All 17 historical versions of `Assets/Scene.scene`** were checked with the repo's own YAML-aware `sceneTokenFields`: `snapToken`/`openAIToken`/`googleToken` are **empty in every version**, and the first commit has no token fields. The A2 pre-commit guard predates the first token generation, and every clad-log entry records "blanked before commit".
- **Never committed:** `.mcp.json`, `.cursor/mcp.json`, `.codex/config.toml`, `.claude/settings.local.json`, `ls-live-instance.json`, `Tooling/.env`, `spk_debug_key.pem` (present in the working tree, correctly ignored), `.virtual-scene.json`. All are covered by `.gitignore`, and `git check-ignore` confirms it.
- **Committed and fine:** `.claude/settings.json`. It only enables `ls-clad@ls-extensions`, which is good CLAD evidence.
- **Low-sensitivity personal data in history (permanent unless rewritten):**
  - Author `wadood <wadood2003@gmail.com>` on all 49 commits.
  - Windows username paths `<local-development-path>` in:
    - `docs/PROGRESS.md` l.95 (the Lens log path);
    - `docs/PAUSE_HANDOFF_2026-10-28.md` l.37 and l.195;
    - `docs/plan/human-plan-2026-10-26.md` l.68 and l.653;
    - `tempAssetGen/gen_music_roomscript.js` and `gen_sfx_roomscript.js` l.2–3 (absolute `require` of `<local-development-path>`).
  - `docs/FIRST_PASS.md` says Wadood "works a day job".
  - `docs/design/01-…md` links to his private vault (`Research/SPECS round 4 research…`, "round 3 dossier"). These are broken links in public.
  - None of this is dangerous. Fix the working-tree copies in the publication commit.
- **Still to do before every future commit:** gateway tokens are generated into the scene for live runs. The hook catches them, but **run `strip-scene-tokens` and `check-secrets` once more right before the public push**. After going public, enable **GitHub secret scanning plus push protection**.
- **Uncommitted files:**
  - `docs/reviews/*`, `docs/REVIEW_*.md`: scanned, no secret patterns. They're good process evidence; commit them.
  - `AGENTS.md` rule 11: names `ANTHROPIC_API_KEY` but no value. Fine.

### 2.2 Size and LFS
- Loose objects come to 24.9 MiB. LFS holds 19 files and 6.5 MB: actor PNGs, 11 WAVs and `Assets/Image.png`. `.lspkg` archives are deliberately stored as plain blobs (decision 2026-10-28); the largest blob is 1.9 MB. No problem for GitHub.
- **Action:**
  - push LFS objects (`git lfs push --all origin`);
  - turn on GitHub repo setting **"Include Git LFS objects in archives"**, otherwise judges who use "Download ZIP" get pointer files instead of audio and portraits;
  - the `.githooks/pre-push` LFS hook requires git-lfs on PATH.

### 2.3 Licences and NOTICE
- **No `LICENSE` file at the root.** Add one. MIT or Apache-2.0 for project code; Apache-2.0 matches the CLAD-derived files. State that the licence covers project-authored code and assets only.
- **NOTICE is incomplete.** Add the following:
  1. **Bundled Snap packages.** `Packages/*.lspkg` (SpectaclesInteractionKit, SpectaclesUIKit, Leaf, RemoteServiceGateway, Utilities, SnapDecorators, Motion, Icons, AiPreviewAgentInspect/Interact) and `Plugins/…/RemoteServiceGatewayToken` and `IconAtlas`.
     - These are © Snap Inc., from the Lens Studio Asset Library, under the Lens Studio / Specs developer terms. They are not covered by the project licence and are included so the project opens.
     - None of the archives contains a licence file. Snap's own public `Spectacles-Sample` repo is MIT and other entrants commit `.lspkg` files, so **redistribution in a public repo is standard practice and low risk**. Snap is the hackathon host.
     - Alternative: strip `Packages/` and document re-installation. **Not recommended**: the project would no longer open as is.
  2. **`Assets/Render/Echopark.hdr`**: Lens Studio template environment map. The 10-28 review suggested removing it, and unused Icons/Motion, if they're confirmed unused.
  3. **Cast portraits** Qadir/Okafor/Pike, from `Tooling/scripts/draw-cast.mjs`, original. NOTICE mentions only Vale's `gen_actor.ps1`.
  4. **Runtime AI services, not redistributed:**
     - Gemini 2.5 Flash and gpt-4o-mini (fallback) through Snap's Remote Service Gateway;
     - OpenAI gpt-4o-mini-tts voices. **Disclose that voices are AI-generated**, as OpenAI's usage policy requires;
     - Anthropic Claude (Opus/Haiku), used only for the local validator red-team in `Tooling/` and not shipped.
  5. **Dev-only npm dependencies** (vitest, tsx, typescript, yaml, @anthropic-ai/sdk; MIT/Apache-2.0). Not redistributed.
  6. **Trademarks:** "Clue/Cluedo" (Hasbro) and "L.A. Noire" (Take-Two/Rockstar) appear only as comparative references. Add a no-affiliation line, and keep their logos, footage and music out of the video.
- No fonts, 3D models or third-party audio are committed. SFX and music are procedural, from CLAD build-sfx/build-music. This is clean and doubles as a CLAD story.

### 2.4 Cleanup before publishing (publication commit, ~1 h of agent time)
- **Add:** root `README.md` (draft provided), `LICENSE`, completed NOTICE, `devpost/design-brief.md`, `devpost/README.md`, rewritten `devpost/clad-log.md` (keep the original as `devpost/clad-log-raw.md`), and a hero GIF in `docs/media/`.
- **Commit the untracked review files.** Move the process documents (FIRST_PASS, KICKOFF_PROMPT, PAUSE_HANDOFF, REVIEW_*, reviews/) under `docs/process/`, or just index them in `docs/README.md`. They are evidence of human-directed agent orchestration, so keep them rather than delete them.
- **`tempAssetGen/`:** rename to `Tooling/asset-gen/` and replace absolute paths with an env var (`CLAD_SKILLS_DIR`) plus a comment. Or keep the name and redact the paths.
- **Probe artefacts** (`RoomscriptProbeLab*`, `ProbeBatch`, `Probe*Scenario`, `RoomscriptProbeImage.mat`, `Assets/Image.png`): keep them as Stage-A evidence. Make sure their scene objects are disabled and the README labels them "A-stage provider probes".
- **Strip private-vault links** in `docs/design/01…` and replace "works a day job" with neutral wording. Optional.
- **`docs/PROGRESS.md`:** prepend a dated "Submission state" block (what's verified, what's pending), so judges don't misread the internal "Needs Wadood" lists as broken.
- **Tag** `v1.0-submission` and push the tags (`m0-probe`, `m1-terminal`, `m2-slice` tell the staged story).

### 2.5 Recommendation: publish the real history as-is (no squash)
- The history is **secret-clean**, and its 49 package-sized commits with milestone tags, all within Oct 28–30, are **the strongest proof of agentic, verified, incremental building**. Squashing destroys exactly what the "Technical Implementation" criterion rewards.
- `docs/PROGRESS.md` and the clad-log cite commit hashes, so a rewrite (`filter-repo` for e-mail or paths) would break those references.
- The only argument for rewriting is hiding the Gmail address and the `wadoo` username. Both are low risk, and the e-mail is likely on his Devpost/GitHub profile anyway.
- **Procedure:**
  1. publication commit;
  2. re-run the history scan and `check-secrets`;
  3. create the GitHub repo **private**, then push `master`, tags and LFS;
  4. enable push protection and LFS-in-archives;
  5. check in an incognito window after making it public: README renders, the GIF plays, ZIP includes the WAVs;
  6. flip to **public on Sun Nov 8**.
- If Wadood does want the e-mail hidden, use `git filter-repo --mailmap` to a GitHub noreply address *and* update the hashes cited in docs. That costs about 1 hour and adds risk; I don't recommend it.

## 3. CLAD evidence

### 3.1 What exists (stronger than most entries)
- **`devpost/clad-log.md`:** about 55 entries naming CLAD skills and MCP tools, with outcomes.
  - **Skills cited:**
    - live-lens-tester ×11, VirtualScene-driven scene construction, script-author ×6;
    - specs-ai-remote-service ×5, editor-api ×5, specs-build-ui ×4, scene-construction ×4;
    - interaction-recipes ×3, specs-audio ×3, materials ×3, lens-studio-router/field-notes ×3;
    - shader-graph, vfx-graph, mesh-builder-scripting, build-sfx/build-music, specs-camera, specs-keyboard, specs-leaf-run-in-preview, package-toolkit, preview-inspection.
  - **MCP tools cited:**
    - VirtualScene ×33, RecompileTypeScriptTool ×20, RunAndCollectLogs ×19;
    - ExecuteEditorCode ×16, PreviewPanelTool ×6, CaptureRuntimeViewTool ×4, ListAllPanels ×4, PreviewInteractTool ×3;
    - MovePreviewCamera, run_leaf_scenario, QueryRuntimeSceneTool, ListInstalledPackagesTool, SearchLensStudioAssetLibrary, InstallLensStudioPackage, ConvertSvgToTexture.
- **21 LEAF scenario scripts** in `Assets/Scripts/*LeafScenario.ts` / `*IKScenario.ts`, using a strict `fail-fast` policy.
- **34 Preview captures** in `docs/captures/`.
- **`docs/mcp-bug-report.md`:** a real Lens Studio MCP bug. `InstallLensStudioPackage` picked RSG 4.0.0 for LS 5.25, which broke a 5.23.2 project, and failed without rolling back. Great "we pushed the tooling" material.
- **`docs/decisions.md`:** dated decisions with alternatives considered.
- **Git history and tags.**
- **`.claude/settings.json`:** project-scope `ls-clad` install.
- **`tempAssetGen/*.js`:** calls CLAD's build-sfx/build-music tools directly.
- **NOTICE** crediting adapted CLAD templates.
- **Two independent review rounds, eight reports** (`docs/reviews/`, uncommitted).
- **Studies with real numbers:**
  - production performer study: 28 live calls; text p50/p95 2442/4434 ms; first audio p50 5143 ms; 18/28 audible;
  - validator red-team: 0/96 attacks accepted after fixes; holdout false-rejection 18/34;
  - **411/411 Vitest in 37 files**, 1000 fuzzed players / 29,487 actions, 5,000 generated cases.

### 3.2 Weaknesses
1. **The log is disordered.**
   - Entries run 10-28 21:02 → 20:53 → 20:49 → … → 19:40, and then the template header ("Evidence for the judging criterion…") appears at line 17, mid-file.
   - Setup entries (10-26/27) sit at lines 29–31.
   - Formats are mixed (`·`, `|`, `—`, `###`), and spaces are missing ("and41", "passed23.170s", "to0.9s").
   - The file is now valid UTF-8 (repaired 10-30). The earlier invalid-UTF-8 finding is resolved.
2. **No at-a-glance summary.** A judge can't see in 30 s what was agent-built and how it was verified.
3. **Agent identity is blurred.** Most building was **Codex running CLAD procedures inline** (CLAD skills read as procedures, not spawned typed CLAD agents; FIRST_PASS §1b). Claude Code was used for design, reviews and planning. Say this plainly. It is legitimate, because CLAD supports Codex.
4. **No visual of the agent at work.** There are no screenshots or video of a Codex/Claude session issuing MCP calls next to Lens Studio.
5. **Planning docs aren't where the organisers look** (`devpost/`).
6. **The verification boundary** (stage-wise LEAF green, integrated run blocked) is honest, but buried.

### 3.3 Proposed rewritten `devpost/clad-log.md` (full skeleton in `clad-log-and-how-built.md`)
1. **Header.**
   - Toolchain: Lens Studio 5.23.2.26081320; the ls-clad plugin (record its version/commit); Lens Studio MCP; agents (Codex as main builder with parallel generic workers; Claude Code for design and reviews; model names); install commands.
   - Rules of engagement: MCP-only edits, commit per verified package, tokens blanked before every commit.
2. **At a glance:**
   - counts table: commits, LEAF scenarios, captures, Vitest, studies;
   - CLAD skills × uses, with one example each;
   - MCP tools × uses.
3. **Timeline by stage** A (setup and probes) → B (truth engine) → C (interrogation slice) → D (whole case) → E/L/AI polish. One uniform row per package: `date time PKT | package | agent | CLAD skills | MCP tools | verification (tests/LEAF) | evidence (commit, capture)`.
4. **Human in the loop:** what Wadood decided (scope, pauses, permissions, reviews, version pin, credentials).
5. **Where the tools fought back:**
   - RSG version mismatch;
   - Immutable→Mutable install error;
   - MCP transport drop;
   - native VFX null → CPU shards;
   - JS execution timeouts;
   - approval timeouts;
   - links to `mcp-bug-report.md`.
6. **Verification boundary:** logic proven vs feel unproven.
7. **Raw log** preserved verbatim in `devpost/clad-log-raw.md`.

Codex can generate sections 2–3 overnight from the existing log plus `git log`. Wadood reviews it in about 10 minutes.

### 3.4 `devpost/design-brief.md`: two honest options
- **(a) Preferred: run `plan-lens` once (20–30 min of Wadood's time).** Install with `npx skills add challengepost/learn-specs --all -y`, project-local, and answer from the existing design. Add a header: "Produced Nov 4 with the official skill pack *after* the build, from our original planning in `docs/plan/` and `docs/design/` (Oct 25–27). It was not the build input." Bonus: the skill checks the design against the organisers' AR rules.
- **(b) Have the agent fill the template sections from `docs/design` and `docs/plan`**, with the same provenance header.

Either way, also fill in "After the build: judge it":
- the LEAF pass list, and the criteria without tests;
- the walk-around notes;
- "would a phone do as well?";
- "logic proven / feel unproven".

### 3.5 What the video and write-up must show for "Technical Implementation"
- **About 15–20 s of real screen capture** of an agent session driving Lens Studio: a Codex/Claude Code terminal issuing `VirtualScene` / `RecompileTypeScriptTool` / `run_leaf_scenario`, with Lens Studio updating next to it. Record a fresh short session on Nov 6 (for example, the agent placing a fixture marker or running the `roomscript-objection` LEAF scenario) rather than reconstructing old ones.
- A LEAF scenario running green in Preview (fast-forwarded and labelled).
- The architecture beat: "the LLM writes lines; the engine decides truth" (diagram), plus the solver's "1 unique solution" and the test counts.
- The write-up's "How we built it":
  - the stage plan;
  - CLAD skills and MCP tools;
  - verification discipline (LEAF strict, captures reviewed, studies);
  - the MCP bug report;
  - the honest limits.

## 4. Presentation

### 4.1 README
There is **no root README**. `docs/README.md` is an internal doc index and `Tooling/README.md` covers tooling. Draft in `README-draft.md`:
- hero GIF (the objection shatter, about 6 s);
- 30-second pitch;
- the video link;
- "Why glasses";
- what you can do;
- **the "Truth is compiled, not generated" architecture diagram** (Mermaid);
- verification numbers, with "logic proven / feel unproven";
- run in Preview: LS 5.23.2, Stage mode needs no keys, the 10-minute tour;
- optional live mode;
- run the tests;
- how it was built (CLAD/MCP);
- repo map;
- known limitations;
- credits and licence.

### 4.2 Devpost description
In `devpost-description-draft.md`:
- name;
- tagline (under 200 chars);
- the standard Devpost sections (Inspiration / What it does / How we built it / Challenges / Accomplishments / What we learned / What's next), mapped to the four criteria;
- "Built with" tags;
- gallery plan (3:2 thumbnails).

The four criteria map as follows:
- **Design:** the complete loop from opening to verdict.
- **Implementation:** CLAD/MCP, LEAF and the studies.
- **Idea:** truth engine plus spatial deduction.
- **Presentation:** problem, audience, why it matters.

### 4.3 Video (full plan in `video-plan.md`)
- Preview-only adaptation of storyboard §7, **target 2:50 hard cap**. The device shots (7, 13, 19) are dropped. The twist/luminol (§4.5), bullet-time reenactment and room-reading shots are **not built**, so they are dropped too. "It reads your room" becomes manual placement and fixture markers.
- **Structure:**
  - hook (0:00–0:10);
  - pitch: problem, audience (0:10–0:24);
  - place and open the case (0:24–0:44);
  - cast and tells (0:44–1:10), including **one labelled live-AI exchange**;
  - objects remember, then OBJECTION (1:10–1:42);
  - suggestion sweep (1:42–1:56);
  - accuse, reconstruction, verdict (1:56–2:18);
  - under the hood: truth vs LLM, solver, tests (2:18–2:34);
  - how it was built: CLAD and MCP (2:34–2:46);
  - end card (2:46–2:50).
- **Capture:**
  - OBS window capture of a maximised Lens Studio Preview at 1080p60, with game audio on its own track;
  - repeatable camera framings set per shot with the MCP `MovePreviewCamera` (by an agent between takes);
  - takes driven by LEAF scenarios where they're stable, otherwise by hand with the mouse;
  - Stage mode for reliability, plus one live-gateway take (fresh tokens, blanked afterwards).
- **Music:** the Lens's own CLAD-generated `BackgroundMusic.wav` and SFX. No licensing risk, and it's on-theme. Backup: YouTube Audio Library (check the attribution flag).
- **Honesty:**
  - a persistent "Lens Studio Preview · simulated room" badge;
  - "authored line" and "live AI" tags;
  - a "time compressed" tag on cuts;
  - an end-card line: "Not yet tested on Spectacles hardware";
  - an AI-voice disclosure.
- **Never say:** "it reads your room", "works on Specs", "every answer is AI".

## 5. Project Review / "SPECS Live Review: Inside the Judging Criteria", Thu Nov 5, 22:00 PKT
- **Nature:** probably a criteria walkthrough with Q&A, not a per-project review. Bring questions; have a showable asset ready in case they review projects.
- **Have ready by 21:30:**
  - a one-line pitch;
  - an unlisted 45–60 s rough clip (opening, objection and verdict, from Wed's test capture) or 3 stills;
  - the private repo URL ready to share privately if asked.
- **Ask, in priority order (aim for 2–3):**
  1. "Our Lens uses live AI (Gemini via Remote Service Gateway). For reliability the video mostly uses an offline Stage mode with authored lines, plus one clearly labelled live exchange. Is that what you want to see, or should more of the video be live?"
  2. "For 'use of CLAD and the MCP', what evidence do judges actually look at? A `devpost/clad-log`, commit history, LEAF tests, or on-screen agent footage? And how much of the 3 minutes should go to the build process?"
  3. "Our planning predates the plan-lens skill pack (our own design docs and plan). Is a retroactive `devpost/design-brief.md` plus our original docs acceptable?"
  4. "Most building was Codex running CLAD procedures, with Claude Code for design and reviews. Is any agent equally valid?"
  5. "Is committing Snap's `.lspkg` packages in a public repo fine?"
  6. "Any rules on music, or on referencing Clue / L.A. Noire in the tagline?"
- **Listen for:** how they weigh polish vs ambition, whether Preview-only limitations are penalised, and any must-have video elements.
- **Afterwards:** update the shot list and write-up within 30 minutes, while it's fresh.

## 6. Calendar (proposal; Wadood's evenings are the constraint, Codex runs overnight)

| Day (PKT) | Wadood (time) | Overnight agent run |
|---|---|---|
| **Tue Nov 3** | 20 min: read `/rules`, `/resources`, `/updates` and the submission form; note music, IP, tags and questions. Decide the licence (MIT/Apache-2.0). | **Run 1, stabilise and package:**<br>• fix the Preview JS execution timeouts;<br>• get strict `all-tells`, `interrogation` and `hero-demo` green;<br>• harvest the real Preview hero tape;<br>• add a "film mode" toggle that hides debug and availability HUDs and adds an optional Preview badge.<br>**Packaging in parallel (separate worker):**<br>• README, LICENSE, NOTICE;<br>• `devpost/README`;<br>• clad-log rewrite, preserving the raw log;<br>• PROGRESS "submission state";<br>• redact local paths;<br>• Mermaid diagram. |
| **Wed Nov 4** | 60–90 min:<br>• walk the 10-minute tour in Preview;<br>• run a test OBS capture of 2 shots;<br>• run `plan-lens` (20–30 min) **or** approve the agent-filled brief;<br>• list visible bugs.<br>**Feature freeze tonight.** Officially drop Stage E/F (Clue Night's own gate was "core green by Nov 4"). | **Run 2, polish only:**<br>• fix the listed bugs;<br>• readability and staging tweaks for the shots;<br>• camera waypoint presets per shot (MovePreviewCamera);<br>• render the "under the hood" assets: diagram, solver terminal capture, test-run capture. |
| **Thu Nov 5** | Before 21:30: rough clip and questions. **22:00 Live Review.** Afterwards: 30 min to update the plan and write-up. | **Run 3, fixes only** from the session feedback and the walk-through. No new features. |
| **Fri Nov 6** | **Capture night (2–3 h):**<br>• all Preview shots, 2–3 takes each;<br>• one live-AI take, with tokens blanked afterwards;<br>• a 2–3 min screen recording of an agent session driving Lens via MCP;<br>• a LEAF run.<br>Record a VO scratch track. | Optional: create the GitHub repo **private**, push with LFS, verify the ZIP. Draft the Devpost text from the drafts. |
| **Sat Nov 7** | **Edit (3–4 h):**<br>• assembly cut to 2:50;<br>• final VO, music bed, captions, title and end cards;<br>• v1 export.<br>Fill the Devpost form and **save it as a draft**. | Agent: README GIF from the footage; final docs pass; secret re-scan. |
| **Sun Nov 8** | Fresh-eyes review of v1 → v2 (cut anything over 2:50; check the honesty tags). Upload to YouTube **public** (or unlisted until Mon). **Make the repo public**, then check it in incognito. Tag `v1.0-submission`. | Code frozen. Agent does a link check of README and Devpost text only. |
| **Mon Nov 9** | Evening: final read; make sure the video is public and under 3:00 and the repo is public; **submit by 21:00 PKT**, leaving 6 h of buffer. Screenshot the confirmation. | — |

**Gates:**
- If the integrated Preview run is still timing out by **Wed night**, film segment by segment, using the separately passing scenarios (opening / cast / clue / objection / closing) with cuts, and say so.
- Do not spend Thursday or Friday chasing the integration.
- No code changes after Sat noon except a show-stopper.
