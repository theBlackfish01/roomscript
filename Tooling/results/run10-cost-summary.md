# Run 10 audio cost and import handoff

Checked November 8, 2026, 02:09 PKT. No additional generation was performed for this check.

**ElevenLabs: 609 credits actually charged**, confirmed by `character-cost` response headers across 25 requests. No estimated charges or unresolved reservations remain. This includes one rejected certificate take and its replacement. Two individual Vale dialogue clips reused already-paid Run 6 responses and incurred no new charge.

The latest increment is **52 credits** for four cast-specific recordings of **That proves nothing.** Earlier Run 10 requests total 557 credits. The 609 total is one cumulative expense, not an amount to add again after merging the worker ledger. No USD conversion is claimed. This worker used **$0 OpenAI images** and **$0 Claude API**; that does not audit unrelated main-session activity.

Authoritative worker ledger: `Tooling/audio/run10-elevenlabs-ledger.json`. The main session owns the merge into `Tooling/results/elevenlabs-ledger.json`, `NOTICE`, asset imports and commits. Merge ledger entries by unique request `id` to avoid duplicate accounting.

## Staged output

- JSON inventory: `Tooling/audio/run10-voice-manifest.json` — **26 clips**.
- Lens manifest: `Tooling/audio/out/run10/Assets/Scripts/Content/Run10VoiceManifest.ts` — **26 entries**, `RUN10_VOICE_MANIFEST`.
- Lens asset imports: `Tooling/audio/out/run10/Assets/Scripts/RoomscriptRun10VoiceAssets.ts` — **26 ordered imports**, `ROOMScriptRun10VoiceAssets`.
- Audio size: **316,626 bytes**, mono 24 kHz MP3.
- Offline validation: `Tooling/audio/run10-verification.json` — **26/26 passed**.
- Wording check: **36/36 passed**, including 10 retained lines.

The four additional files to import are:

| Staged file | Lens destination |
| --- | --- |
| `Tooling/audio/out/run10/Assets/Audio/Run10/S1/D10_DISMISS_S1.mp3` | `Assets/Audio/Run10/S1/D10_DISMISS_S1.mp3` |
| `Tooling/audio/out/run10/Assets/Audio/Run10/S2/D10_DISMISS_S2.mp3` | `Assets/Audio/Run10/S2/D10_DISMISS_S2.mp3` |
| `Tooling/audio/out/run10/Assets/Audio/Run10/S3/D10_DISMISS_S3.mp3` | `Assets/Audio/Run10/S3/D10_DISMISS_S3.mp3` |
| `Tooling/audio/out/run10/Assets/Audio/Run10/S4/D10_DISMISS_S4.mp3` | `Assets/Audio/Run10/S4/D10_DISMISS_S4.mp3` |

Publish the two staged TypeScript exports with that import batch so manifest indices and asset imports remain in the same order. Lookup keys are `S1|steady|That proves nothing.` through `S4|steady|That proves nothing.`

## Read-only integration review

`Tooling/audio/run10-integration-text-audit.json` records the check. The opening IDs, seven Find observation IDs, dismissal literal and all three ending/timeout literals match the staged script and manifest exactly. **No text mismatches found.**

At this checkpoint, the runtime manifest still contains **22 clips**; the four dismissal IDs are the only staged entries absent there. The runtime importer likewise ends at D10_ESCAPE. This is a pending import, not a wording mismatch. The opening and Find paths read text directly from the manifest.

Preview playback, subtitle layout, speech overlap and end-of-line completion are not established by this file audit. They remain part of the main session's audio-overlap LEAF and visual verification.
