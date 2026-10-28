import {GameState} from "../core/Types";
export const SLOT_MINUTES = 15;
export function advanceClock(state: GameState, cost: number): void {
  if (!Number.isFinite(cost) || cost < 0) throw new Error("Invalid clock cost");
  state.elapsedMinutes = Math.min(state.clockMinutes, state.elapsedMinutes + cost);
  if (state.elapsedMinutes >= state.clockMinutes && state.verdict === null) state.verdict = "timeout";
}
export function remainingMinutes(state: GameState): number {return Math.max(0,state.clockMinutes-state.elapsedMinutes);}
