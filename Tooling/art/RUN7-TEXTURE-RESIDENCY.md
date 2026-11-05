# A3 texture compression and residency audit

Read-only Nov 6 audit: `node Tooling/art/scripts/run7-texture-audit.mjs`. All 20 current actor PNGs, their import metadata, cached VirtualScene inputs and saved-scene asset references were checked. No image render, Assets write, import or Lens call.

| Verified property | All 20 suspect poses |
| --- | --- |
| Dimensions / channels | 512 × 1024, RGBA PNG (color type 6) |
| Importer | FileTextureImporter |
| Compression | PerformanceCompressionSettings, Medium |
| Mipmaps | false |
| Bindings | 20 distinct UUIDs match their exact named pose textures |
| PNG bytes | 3,741,330 (3.57 MiB) |
| Decoded RGBA base images | 41,943,040 bytes (40 MiB) |

No missing compression setting was found, so no speculative metadata patch is staged. Exact UUIDs, file hashes, paths and per-pose settings are in `run7-texture-audit.json`. Cached scene evidence does not substitute for main's native 20-pose render audit.

The current actor component holds all five Texture inputs per actor and its cloned material holds the selected baseTex. Four visible selected portraits correspond to 8 MiB uncompressed; all referenced poses correspond to 40 MiB. Enabling only one pose does not prove the other four unload. Medium compression is an import setting, not a measured GPU format or residency figure. Whole art PNGs total 103.69 MiB decoded, despite the much smaller source files.

Cards and ghosts are also retained by static requireAsset registries. The UI only enables one card, and ghosts only instantiate after the verdict, which limits visuals/draws but does not prove asset unloading. The module-level references remain reachable. An eager preload of extra blink/mouth atlases would add memory without a current visual benefit; do not add it.

Recommended A3 acceptance targets:

- Preserve the existing 512 × 1024 facial/tell detail and alpha for this build. Do not halve resolution or select High compression without near-face and far-silhouette comparison.
- Keep current portrait source total below 4 MiB (passes), and original complete PNG/GLB art source below 6 MiB (5,961,439 bytes, passes). These are source budgets only.
- Measure actual texture memory once before and once after the all-pose audit, then after returning to neutral. A useful initial budget is at most 16 MiB for the 20 GPU-compressed portraits. This is a proposed budget, not an observed result or guaranteed format.
- At 40 MiB base RGBA residency, consider platform compression/export settings first. Mipmaps would add roughly one third (about 13.33 MiB uncompressed for all20); enable only after far-edge shimmer is observed and memory measured.
- The separate final lens export target remains under 18 MB. PNG bytes and decoded texture memory cannot establish exported package size; runtime and export checks remain pending.

Local Editor API confirms PerformanceCompressionSettings.mipmap and inherited SizeCompressionSettings.level; TextureCompressionLevel supports Low/Medium/High. Any future import change belongs through the main Lens/VirtualScene workflow with metadata re-read, not direct .meta editing.
