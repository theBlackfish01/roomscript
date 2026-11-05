# E8 voice-agent spike — Run 7

**Decision: no-go for direct ElevenLabs Agent speech in the shipped Lens.** This is a protocol/API and truth-safety design spike, with executable adversarial gate tests. It is not a live Lens microphone/socket/playback certification and no agent has been created or paid conversation started.

The official [Agent WebSocket protocol](https://elevenlabs.io/docs/eleven-agents/api-reference/eleven-agents/websocket) provides text user messages, audio chunks, transcripts, response completion and client-tool exchanges. A text question therefore has a protocol-level Preview alternative to a microphone. Output audio format is negotiated (the example uses PCM16 at 16 kHz), so a Lens adapter would decode base64 PCM and enqueue frames using AudioOutputProvider; it must obey the returned sample rate rather than hard-code it.

[Client tools](https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools) can wait for an engine tool result and add it to the conversation context. They do not establish that the next generated words repeat the result exactly. Our inference: sending an engine fact through a tool is insufficient to enforce Roomscript's truth rule. Streaming the agent's audio immediately could reveal invented facts before validation, and later transcript correction cannot retract heard speech.

For private agents, the [documented authentication flow](https://elevenlabs.io/docs/eleven-agents/libraries/web-sockets) obtains a signed URL from a local server. The API key remains in Tooling; signed URLs are ephemeral credentials and must not enter the scene, fixtures, logs or git. No direct client key is needed.

CLAD's specs-websocket skill and the local Lens typings expose InternetModule WebSockets, MicrophoneAudioProvider PCM16 reads and AudioOutputProvider.enqueueAudioFrame. These establish available API shapes, not end-to-end operation in this Preview. The current specs-asr skill says Preview is supported; Roomscript's historical probe found no transcription in its simulation. A fresh runtime probe would need to resolve that discrepancy. The demo continues to use typed/chip questions and prerecorded voices.

## Safe architecture if resumed

1. The typed/ASR question becomes an engine Ask. The engine locks the current account, available performance IDs and sequence number.
2. A read-only `current_account` client tool returns only the already admitted account and opaque allowed performance IDs. No tool exposes hidden truth, fact mutation, objection result, tell flag, or verdict.
3. Log every model response as LlmOutput, including rejected results. Bind each response to request ID and engine sequence; cancel stale responses when the account changes.
4. Buffer the complete transcript. Ignore all provider audio. Reject partial, corrected, interrupted, stale or unsolicited turns and any words outside the exact selected performance.
5. On acceptance, play the engine-owned prerecorded/phrase performance ID. The tool request never directly triggers a truth action. On rejection or transport failure, play the authored fallback or show the complete admitted subtitle.

`voice-agent-gate.mjs` and its tests exercise this fail-closed boundary. They are tooling design artifacts, not wired Lens code. Discarding the agent's audio sacrifices its conversational streaming advantage, so shipping this now would duplicate the existing safer live-director path. A future strict custom-LLM endpoint could return only engine-owned text, but it still needs live interruption, stale-state and audio correspondence tests before release.

## Acceptance required before changing no-go

- Actual authenticated WSS handshake and one typed turn in Preview, with bounded deadlines and sanitized evidence.
- Microphone/ASR probe separately labelled from typed fallback; real-device comfort remains unverified.
- PCM sample rate, queue underflow/overflow, cancellation and output timing verified in Lens.
- Adversarial live questions and account changes cannot produce unapproved audible words.
- Replay preserves all model outputs and the same engine result offline.

No additional credit spend or Claude calls for E8 in this lane. Preserve audio priority for reusable phrases, casting narration and effects.
