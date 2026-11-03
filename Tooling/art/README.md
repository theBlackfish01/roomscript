# Roomscript art pipeline

Offline, deterministic, code-driven art for Roomscript. Three.js scenes render in headless Chromium through Playwright, and come out as transparent PNG portraits, cards and icons, GLB props (via `GLTFExporter`) and frame sequences that ffmpeg turns into MP4/WebM motion graphics.

- `prototype/` is the working prototype from the 2026-11-03 review. See `docs/reviews/2026-11-03-asset-pipeline.md` for the design, Lens Studio import limits, style spec, full asset list and Codex work package. Its first-pass portraits proved the pipeline, but the look needs the "Art direction v2" in `docs/REVIEW_2026-11-03.md`.
- `recon-mockup/` is the reconstruction direction mockup: a Three.js stand-in room, not a Lens capture. See `docs/reviews/2026-11-03-reconstruction.md`. Its renderer currently hard-codes a local Playwright Chromium path; take it from `PLAYWRIGHT_CHROMIUM` or `playwright-core` instead.

Run the prototype: `cd prototype && npm install && npm run art`. Outputs go to `prototype/out/`, which is gitignored. ffmpeg comes from the `FFMPEG` env var, `python -c "import imageio_ffmpeg"` or `PATH`. Nothing here uses credentials.
