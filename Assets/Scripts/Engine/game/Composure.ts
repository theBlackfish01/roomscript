import {SuspectState} from "../core/Types";
export function isLawyered(suspect: SuspectState, elapsed: number): boolean {return elapsed < suspect.lawyeredUntil;}
export function emptyPress(suspect: SuspectState, elapsedAfterCost: number): boolean {
  suspect.composure = Math.max(0, suspect.composure - 1);
  suspect.emptyPresses++;
  if (suspect.emptyPresses < 3) return false;
  suspect.lawyeredUntil = elapsedAfterCost + 30;
  suspect.emptyPresses = 0;
  return true;
}
export function newEvidence(suspect: SuspectState): void {suspect.emptyPresses = 0;}
