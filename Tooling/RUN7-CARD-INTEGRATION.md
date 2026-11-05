# Progressive card and capture batch

Published after main released imports; Assets held again for main compilation. No Lens MCP or scene writes by this lane. Source-level API checks are complete; runtime and visual acceptance remain pending.

## Cards and physical visuals

`RoomscriptMemoryCardView` owns a single collapsed/expanded presentation. The collapsed view contains a role icon and at most three title words; the expanded view contains the admitted art and complete engine caption. Wallet and memory controllers share it. Only one presentation is enabled at a time. Existing `Close memory`, `Use evidence`, previous/next and close-wallet controls remain. New pinch targets are `Expand memory` and `Expand evidence`.

`RoomscriptSpatialObjectionController` resolves every card through current PlayerKnowledge. Preset maps to its Run6 evidence artwork; Dynamic uses the blank MemoryPhoto frame. Known statements use their canonical observed account, never an authored evidence image. Cards are positioned relative to the associated object, face the player when opened, and move laterally away from suspect faces. Distance adjusts panel scale within a bounded range. Main must inspect actual typography, clutter, overlap and target size in Preview; source calculations alone do not establish visual quality.

Wallet refresh preserves the selected ID and expanded reading state when a routine engine state notification arrives. Opening a card or switching entries starts collapsed. This prevents route-sampling notifications from repeatedly closing an expanded card. `roomscript-memory-cards` exercises this regression and the unseen-evidence / generated-case artwork boundaries.

Pulling displays the published MemoryPhoto sprite. A lift uses a clone of `RoomscriptPropVisual_<objectId>` when RoomBinding supplies one, temporarily hides the original visual, and restores it on release/cancel/reset. It never moves the logical object anchor or its collider. If no prop exists, the existing icon/photo lift remains. Main's six-prop integration supplies the mug; the cable currently uses the fallback until a cable visual is provided. Physical admission thresholds, counters and engine events are unchanged. Spatial modals set `flow.controlsBlocked` so proximity cannot reopen question chips over evidence.

The A7 scenario now genuinely pinches `Expand evidence` before reading the cold-kettle card. Its forty-action hard cap remains. Continuous capture expands the kettle memory before holding it for readability.

## New registrations

| ID | Parameters / purpose |
| --- | --- |
| `roomscript-actor-pose-capture` | `suspect=S2`, `pose=neutral`, `audit=true`; twenty bound/displayed textures checked, selected pose held20seconds. Subsequent screenshots may use `audit=false`. |
| `roomscript-continuous-capture` | `seconds=5`, `input=default`, `source=capture`; five-second native probe first. Full take: `seconds=70`; strict visible-hand attempt: `input=ik`. |
| `roomscript-memory-cards` | No parameters; admitted art and progressive-state regression. |
| `roomscript-polish-foundation` | Existing ID, revised native clock evidence and bounded frame sample. |
| `roomscript-live-ai-beat` | Engine lane scenario, no parameters. |
| `roomscript-point-accuse` | Engine lane strict-IK scenario, no parameters. |
| `roomscript-proximity` | Main lane scenario, no parameters. |

See `RUN7-NATIVE-CAPTURE.md` for native-video limitations and local recovery commands, and `art/RUN7-RUNTIME-STAGING.md` for exact prop types/bounds. Publishing a recorder scenario does not establish that a video was recorded, extracted, contained the simulated room, or had audio.

## Validation responsibilities

Main compiles the whole batch through Lens MCP and runs card, physical-memory, A7, S2 and pose checks. No Node compiler was used on Lens code. Local native-file discovery and the six GLB metadata/bounds audits passed earlier; audio costs remain2,954 ElevenLabs credits and zero Claude spend in this lane. All newly referenced images already existed in Assets; no extra image generation or paid calls occurred in this batch.
