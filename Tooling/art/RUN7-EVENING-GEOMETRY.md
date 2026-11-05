# Evening Room source geometry check

Read-only, bounded Nov 6 check; no Lens calls, network, Assets writes or GUI.

Installed source bundle:
`C:/Program Files/Snap Inc/Lens Studio/Plugins/Es_InputInteractive.bundle/Scenes/Evening Room`

Inventory: `scene.scn` (94,601 bytes, native binary), 54 native `.mesh` files, three JSON metadata/checksum files, 16 JPG textures and platform shader artifacts. No glTF, GLB, FBX, OBJ or editable JSON scene is present. `metainfo.json` describes lens/package metadata; `checksum.json` maps artifact paths to checksums, not geometry transforms.

Potential furniture mesh names include `curbstone.mesh` (22,135 bytes), `curbstone1.mesh` (61,213 bytes), and multiple `shelf*.mesh` files. These names do not establish which component is the visible media console. Both scene and mesh headers use the native binary serialization rather than a supported interchange format. Even a vertex-bound guess would omit the scene's world transforms.

Decision: stop offline decoding here. No console tabletop height or footprint is claimed. Main should use actual World Query view11 surface hits, accepting upward-facing normals on the console's exposed top and checking multiple separated points for its extents. The existing centre hit y=-149.5186 is a front-face measurement; the record-player hit y=-135.444 is a different object's top. Neither independently measures the console support surface. Preserve measured floor y=-176 and make any conversion to floor-local centimeters explicit.
