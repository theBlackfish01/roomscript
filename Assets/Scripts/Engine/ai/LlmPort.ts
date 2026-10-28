/** Platform-neutral request boundary. Credentials belong only inside the Lens gateway adapter. */
export interface LlmMessage {role: "system" | "user" | "assistant"; content: string;}
export interface LlmRequest {
  provider: "openai" | "gemini";
  model: string;
  promptVersion: string;
  messages: LlmMessage[];
  schema?: Record<string, unknown>;
  temperature?: number;
}
export interface LlmResponse {content: string; model?: string;}
export interface LlmPort {complete(request: LlmRequest, cancellation?: CancellationToken): Promise<LlmResponse>;}
export type LlmErrorCode = "cancelled" | "timeout" | "rate_limit" | "unauthenticated" | "unavailable" | "invalid_response" | "tape_miss" | "unsafe_tape";
export class LlmError extends Error {
  readonly code: LlmErrorCode;
  readonly retryAfterMs?: number;
  constructor(code: LlmErrorCode, retryAfterMs?: number) {
    super(code); this.name = "LlmError"; this.code = code;
    if (retryAfterMs !== undefined) this.retryAfterMs = retryAfterMs;
  }
}
export interface CancellationToken {
  readonly cancelled: boolean;
  onCancel(listener: () => void): () => void;
  throwIfCancelled(): void;
}
export class CancellationSource {
  private stopped = false;
  private listeners = new Set<() => void>();
  readonly token: CancellationToken;
  constructor() {
    const owner = this;
    this.token = {
      get cancelled() {return owner.stopped;},
      onCancel(listener) {
        if (owner.stopped) {listener(); return () => {};}
        owner.listeners.add(listener); return () => {owner.listeners.delete(listener);};
      },
      throwIfCancelled() {if (owner.stopped) throw new LlmError("cancelled");},
    };
  }
  cancel(): void {
    if (this.stopped) return;
    this.stopped = true;
    const listeners = [...this.listeners]; this.listeners.clear();
    for (const listener of listeners) {try {listener();} catch { /* Cancellation still reaches remaining transports. */ }}
  }
}
/** Injected by the Lens component or test harness; no engine-owned real clock or timer. */
export interface ClockPort {nowMs(): number; after(delayMs: number, callback: () => void): () => void;}
export interface LlmOutputEvent {
  type: "LlmOutput"; key: string; occurrence: number; source: "live" | "replay" | "hero";
  response: LlmResponse; latencyMs: number; at: number;
}
