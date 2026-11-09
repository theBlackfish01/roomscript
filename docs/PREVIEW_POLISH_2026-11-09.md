# Preview dialogue and controls polish ? Nov 9

Wadood's follow-up requested intact final words, easier Ask / Show / Accuse selection, fewer repeated opening phrases, and clearer story context. This build is tested and demoed only in Lens Studio Preview.

## Changes

- Added 0.6 seconds of silence to 916 bundled speech clips (915 MP3 and one PCM WAV), encoded from preserved original sources. All 916 decode to silence throughout their last 0.35 seconds. Existing music and cue durations are untouched. Full native playback completion still owns the speech channel; caption alignment is not a stop timer.
- Kept the verified 44.1 kHz stereo 128 kbps MP3 format. Referenced MP3 assets total 56,082,992 bytes; this Preview build does not claim a device-size/export acceptance result.
- Person click bounds now include the head and full figure. Preview focus can acquire the looked-at person from five metres, with time-qualified exit at 6.5 metres. Device proximity defaults are unchanged. Manual focus lasts three seconds; an open choice menu retains its selected person until dismissed.
- Increased action buttons from 11?6 to 13?8 cm. The row stays visible and disabled during speech, with subtitles unsuppressed. Show remains unavailable before evidence is found. Existing UIKit controls and release-safe cached menus are retained.
- First answers to new subjects use the validated direct authored line bank. Repeat questions can use existing performance takes, preferring an opener absent from the suspect's last three admitted lines before mood matching. No case fact or recorded sentence is rewritten.
- Re-recorded only N10_OPEN_1 and N10_OPEN_2 with the existing narrator. The introduction establishes Harlow's death and the goal: killer, room, weapon. Exact wording is in SCRIPT_2026-11-08.md. ElevenLabs charged 74 credits, recorded from character-cost headers in both ledgers. Ask choices now display concise topic labels rather than shrinking full questions; the alibi time and Harlow's voice are clearer.

## Verification

- Complete Node suite: 665 tests passed in 88 files, including new focus, direct-answer, opener and speech-tail regressions.
- Lens TypeScript compilation and startup: passed, no runtime errors.
- Clean Lens restart: graceful close, project/sign-in confirmed at approximately 22:07 PKT; one restart in this polish run.
- LEAF row stability: passed, acquisition at 400 cm, no jitter toggles, Ask retained beyond normal exit, head covered by click bounds.
- LEAF audio overlap: passed with real item interactions during speech, deferred selection, shared captions and queued Show / Ask.
- Native voice timing: all 26 Run 10 clips passed; four-suspect bundled-voice test passed.
- Visual review: row, Ask and Show captured through CLAD and inspected. Final Ask labels are readable, button/menu geometry stays below the face, and Show displays the collected items. The earlier long-question screenshot documents the corrected small-text issue.
- Captures: docs/captures/preview-polish-row-wide.png, preview-polish-ask.png (before label fix), preview-polish-ask-final.png, preview-polish-show.png. Earlier baseline: 2026-11-08-run10-row-final.jpg.

## Limits

A silent tail protects the native playback boundary; it cannot repair a syllable already absent from a source recording. No such source-specific case has been isolated. Native timing and waveform checks do not replace Wadood listening to the final demo on his speakers. Existing local scene edits are excluded from the source/audio commit.

Final typed interrogation LEAF passed after the concise-label change. Final runtime refresh had no errors; Preview reset and paused, project saved.
