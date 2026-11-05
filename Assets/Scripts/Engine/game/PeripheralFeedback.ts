import {GameEvent} from "../core/Types";
/** One small toast per admitted action; raw model output and old events never qualify. */
export function peripheralFeedback(events:readonly GameEvent[],seq:number):string|null {
  const types=new Set(events.filter(event=>event.seq===seq).map(event=>event.type));
  if(types.has("objectionCorrect"))return "Account refuted";
  if(types.has("argumentSupported"))return "Deduction certified";
  if(types.has("evidence"))return "Memory collected";
  return null;
}
