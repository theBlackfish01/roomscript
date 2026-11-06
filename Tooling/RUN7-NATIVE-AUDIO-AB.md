# Native short-audio A/B probe (staged)

Measured `audioTrack` and `play()` calls take roughly 0.5–7 seconds in the current Preview. Same-track assignment caching helps by removing repeated setters; it does not explain or remove native play stalls. The VideoRecorder Sink Writer media-type warning is evidence about the movie writer, not proof that imported MP3 audio causes the delay.

Local `Audio.PlaybackMode` documentation distinguishes LowPower (saves Specs power, introduces latency) from LowLatency (immediate feedback, more power). It promises no Windows-specific behavior or second-scale latency bound. Existing short cues correctly use LowLatency. FileAudioTrackProvider exposes duration/position/frame reads, with no preload or output-device selection API. The project owns 11 fixed presentation players, up to 3 ambient players and 1 TTS player; no unbounded creation was found. OS audio memory is not attributed by these declarations.

One controlled comparison is ready: the shipped 1-second CastingChime MP3 versus a PCM16 WAV decoded from the same bytes, preserving 24 kHz mono and amplitude. The staged WAV is 48,078 bytes. It costs no provider credits and does not replace any asset. Lens's importer could transform both source formats, so this compares source containers, not necessarily distinct native output codecs.

`RoomscriptNativeAudioProfileLeafScenario` creates one additional owned player after tab/ready speech settles, without muting or changing production channels. It logs wall times for component creation, mode, volume, spatial setup, initial track binding, playback and stop; two trials distinguish first binding from retained-track replay. Native `isPlaying` or advancing position is mandatory; counters never substitute. Duration and bounded observation samples are reported. Cleanup destroys only the test root.

Each local LEAF invocation uses a 90-second overall budget and checks before native operations, reserving cleanup time. A synchronous native call or halted frame delivery cannot be preempted by JavaScript; overruns fail the final bound. No process/OS-service/device manipulation is involved.

After main releases imports, run `node Tooling/scripts/run7-publish-audio-profile.mjs --imports-allowed`; it guards registry/source MP3/PCM hashes and publishes only scenario, registry and the additive PCM fixture. Registered ID: `roomscript-native-audio-profile`, defaults `format=mp3,mode=low-latency`. Compare mp3/low-latency, wav/low-latency, then mp3/low-power and wav/low-power, one bounded local run each. Repeat the baseline if a difference appears; session warming/order effects are not a codec result. No tests or Lens tools ran during the ongoing main LEAF gate.

Do not convert all audio or change production playback mode without repeatable native timings and strict playback passes. This probe does not establish the 30-second first-answer or 8 ms frame-time targets.
