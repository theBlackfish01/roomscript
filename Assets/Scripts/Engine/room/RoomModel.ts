import {hashHex} from "../core/Hash";
import {canonicalJson} from "../core/CanonicalJson";
import {Origin, RoomObject, RoomScan, Vec3, Zone} from "../core/Types";
import {affordancesFor, compareIds, OBJECT_TYPES} from "./Affordances";
import {SubstitutionOptions, withSubstitutions} from "./Substitution";

export type RoomObjectInput = Omit<RoomObject, "affordances" | "origin"> & {affordances?: string[]; origin?: Origin};
export interface RoomInput {source: Origin; zones: readonly Zone[]; objects: readonly RoomObjectInput[]; schema?: 1; roomId?: string;}
const origins: readonly Origin[] = ["vision", "manual", "simulated", "fixture", "substitution"];

function text(value: string, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("Invalid room " + field);
  return value.trim();
}
function vector(value: Vec3, field: string): Vec3 {
  if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) throw new Error("Invalid centimeter vector for " + field);
  return [value[0], value[1], value[2]];
}

/** Logical identity ignores labels, IDs of objects, confidence, origin, and all coordinates. */
export function roomIdentity(room: Pick<RoomScan, "zones" | "objects">): string {
  const zones = room.zones.slice().sort((a, b) => compareIds(a.id, b.id));
  const indices = new Map(zones.map((zone, index) => [zone.id, index]));
  const signature = room.objects.map(object => {
    const index = indices.get(object.zone);
    if (index === undefined) throw new Error("Object refers to an unknown zone");
    return [object.type, index] as [string, number];
  }).sort((a, b) => compareIds(a[0], b[0]) || a[1] - b[1]);
  return "r_" + hashHex(canonicalJson({zones: zones.length, objects: signature}));
}

/** Validates observations and derives every affordance from the trusted type table. */
export function normalizeRoom(input: RoomInput): RoomScan {
  if (!origins.includes(input.source) || (input.schema !== undefined && input.schema !== 1)) throw new Error("Invalid room schema or source");
  const ids = new Set<string>();
  const id = (value: string): string => {
    const result = text(value, "ID");
    if (ids.has(result)) throw new Error("Duplicate room ID: " + result);
    ids.add(result); return result;
  };
  const zones = input.zones.map(zone => ({id: id(zone.id), label: text(zone.label, "zone label"),
    clueName: text(zone.clueName, "zone name"), anchor: vector(zone.anchor, zone.id)})).sort((a, b) => compareIds(a.id, b.id));
  const zoneIds = new Set(zones.map(zone => zone.id));
  const objects: RoomObject[] = input.objects.map(object => {
    if (!OBJECT_TYPES.includes(object.type)) throw new Error("Invalid room object type");
    const zone = text(object.zone, "object zone");
    if (!zoneIds.has(zone)) throw new Error("Object refers to an unknown zone: " + zone);
    const origin = object.origin ?? input.source;
    if (!origins.includes(origin)) throw new Error("Invalid room object origin");
    if (object.confidence !== undefined && (!Number.isFinite(object.confidence) || object.confidence < 0 || object.confidence > 1)) throw new Error("Confidence must be between zero and one");
    if (object.virtual !== undefined && typeof object.virtual !== "boolean") throw new Error("Invalid virtual object flag");
    const result: RoomObject = {id: id(object.id), label: text(object.label, "object label"), type: object.type,
      zone, pos: vector(object.pos, object.id), affordances: affordancesFor(object.type), origin};
    if (object.confidence !== undefined) result.confidence = object.confidence;
    if (object.virtual !== undefined) result.virtual = object.virtual;
    if (origin === "substitution") result.virtual = true;
    if (object.synonyms) result.synonyms = [...new Set(object.synonyms.map(value => text(value, "synonym")))].sort(compareIds);
    return result;
  }).sort((a, b) => compareIds(a.id, b.id));
  const room: RoomScan = {schema: 1, roomId: "", source: input.source, zones, objects};
  room.roomId = roomIdentity(room);
  return room;
}

export function buildRoom(input: RoomInput, options: SubstitutionOptions = {}): RoomScan {
  return normalizeRoom(withSubstitutions(normalizeRoom(input), options));
}
