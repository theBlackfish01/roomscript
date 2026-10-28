# Roomscript tooling

Run `npm ci` then `npm test` in this folder. Tests import the pure TypeScript engine directly from `Assets/Scripts/Engine/` and content from `Assets/Scripts/Content/`. This tooling never compiles Lens components: use the Lens Studio recompilation MCP tool for those.

From the project root, enable the tracked hook with `git config core.hooksPath .githooks`. The hook runs `node Tooling/scripts/check-secrets.mjs` against staged blob contents. It fails closed if Git or a scene parser fails, and never prints credential values.

Before staging a scene with gateway credentials, run `node Tooling/scripts/strip-scene-tokens.mjs` from any directory. It defaults to `Assets/Scene.scene`; extra arguments are project-relative scene paths. It blanks the three gateway credential fields while preserving all unrelated text, tags, comments and line endings. It refuses unexpected value shapes. Then stage the cleaned scene again. Lens Studio may save the credentials back, so always let the commit hook check the final index. Regenerate credentials in Lens Studio after committing when needed.

The guard detects authorization scheme prefixes even without a credential, PEM blocks, non-empty gateway fields in scenes, and forbidden secret/local filenames. Spell the header prefix as `Bearer\x20` in documentation to avoid matching it literally. Lens `ScriptInputsDefault` and `ScriptTypes` metadata are not credential values.
