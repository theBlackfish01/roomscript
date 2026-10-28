import {hashHex} from "../core/Hash";

/** Stable opaque performer IDs. Raw graph IDs remain private to the engine. */
export function performanceRef(kind: "a" | "p" | "h" | "m", id: string): string {
  const key=kind+":"+id;
  return "r"+hashHex(key)+hashHex("roomscript-ref:"+key);
}
