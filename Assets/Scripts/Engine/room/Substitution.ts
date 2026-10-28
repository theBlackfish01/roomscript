import {ObjectType, RoomObject, RoomScan, Vec3, Zone} from "../core/Types";
import {affordancesFor, compareIds, isWeapon, isWitness, OBJECT_TYPES, RoleRequest, WEAPON_TYPES} from "./Affordances";

export interface SubstitutionOptions {
  minZones?: number; minWeapons?: number; minWitnesses?: number;
  requiredTypes?: readonly ObjectType[];
  roles?: readonly RoleRequest[];
  /** Required only for a completely untagged room; must be supplied by the caller in cm. */
  fallbackAnchor?: Vec3;
}
export type RoomContents = Pick<RoomScan, "source" | "zones" | "objects">;
const labels: Record<ObjectType, string> = {
  cord: "evidence cord", blunt: "brass candlestick", sharp: "letter opener", poison: "sealed prop vial",
  heavy: "brass paperweight", light: "forensic lamp", clock: "case clock", door: "projected doorway",
  screen: "case recorder", mirror: "inspection mirror", plant: "potted fern", container: "evidence box",
  soft: "folded cloth", kettle: "prop kettle", cup: "enamel cup",
};

function minimum(value: number | undefined, fallback: number): number {
  if (value !== undefined && (!Number.isSafeInteger(value) || value < 0)) throw new Error("Room minimum must be a non-negative integer");
  const result = value === undefined ? fallback : Math.max(fallback, value);
  if (!Number.isSafeInteger(result) || result > 100) throw new Error("Room minimum must be an integer no greater than 100");
  return result;
}
function copyVector(value: Vec3): Vec3 {return [value[0], value[1], value[2]];}
function uniqueId(base: string, taken: Set<string>): string {
  let id = base; let suffix = 1;
  while (taken.has(id)) id = base + "_" + suffix++;
  taken.add(id); return id;
}

/** Returns fresh room contents; RoomModel.buildRoom normalizes and hashes the result. */
export function withSubstitutions(room: RoomScan, options: SubstitutionOptions = {}): RoomContents {
  const minZones = minimum(options.minZones, 3);
  const minWeapons = minimum(options.minWeapons, 3);
  const minWitnesses = minimum(options.minWitnesses, 2);
  const zones = room.zones.map(zone => ({...zone, anchor: copyVector(zone.anchor)})).sort((a, b) => compareIds(a.id, b.id));
  const objects = room.objects.map(object => ({...object, pos: copyVector(object.pos), affordances: object.affordances.slice(), ...(object.synonyms ? {synonyms: object.synonyms.slice()} : {})})).sort((a, b) => compareIds(a.id, b.id));
  const taken = new Set<string>(zones.map(zone => zone.id).concat(objects.map(object => object.id)));
  if (!zones.length) {
    const anchor = options.fallbackAnchor;
    if (!anchor || anchor.length !== 3 || !anchor.every(Number.isFinite)) throw new Error("An empty room needs fallbackAnchor in centimeters");
    zones.push({id: uniqueId("VZ1", taken), label: "case box area", clueName: "Study", anchor: copyVector(anchor)});
  }
  const base = zones[0].anchor;
  while (zones.length < minZones) {
    // Expand from the observed outer edge, rather than overwriting the room origin.
    const x = Math.max(...zones.map(zone => zone.anchor[0])) + 120;
    const n = zones.length + 1;
    zones.push({id: uniqueId("VZ" + n, taken), label: "projected evidence area " + n,
      clueName: "Annex " + n, anchor: [x, base[1], base[2]]});
  }
  zones.sort((a, b) => compareIds(a.id, b.id));

  const add = (type: ObjectType) => {
    const counts = new Map<string, number>();
    for (const zone of zones) counts.set(zone.id, objects.filter(object => object.zone === zone.id).length);
    const zone = zones.slice().sort((a, b) => (counts.get(a.id)! - counts.get(b.id)!) || compareIds(a.id, b.id))[0];
    const pos = propPosition(zone, objects);
    objects.push({id: uniqueId("V_" + type, taken), label: labels[type], type, zone: zone.id,
      pos, affordances: affordancesFor(type), origin: "substitution", virtual: true, confidence: 1});
  };
  const needed = new Map<ObjectType, number>();
  for (const type of options.requiredTypes ?? []) {
    if (!OBJECT_TYPES.includes(type)) throw new Error("Unknown required object type");
    needed.set(type, 1);
  }
  const roles = options.roles ?? [];
  const roleNames = new Set<string>();
  for (const request of roles) {
    if (!request.role.trim() || roleNames.has(request.role) || !OBJECT_TYPES.includes(request.type)) throw new Error("Invalid or duplicate role request");
    roleNames.add(request.role);
    const count = roles.filter(role => role.type === request.type).length;
    needed.set(request.type, Math.max(needed.get(request.type) ?? 0, count));
  }
  for (const type of [...needed.keys()].sort(compareIds)) {
    while (objects.filter(object => object.type === type).length < needed.get(type)!) add(type);
  }
  while (objects.filter(isWeapon).length < minWeapons) {
    const type = WEAPON_TYPES.find(candidate => !objects.some(object => object.type === candidate))
      ?? WEAPON_TYPES[objects.filter(isWeapon).length % WEAPON_TYPES.length];
    add(type);
  }
  const witnessTypes: ObjectType[] = ["light", "clock", "door", "cup", "kettle"];
  while (objects.filter(isWitness).length < minWitnesses) {
    add(witnessTypes.find(type => !objects.some(object => object.type === type)) ?? "clock");
  }
  return {source: room.source, zones, objects};
}

function propPosition(zone: Zone, objects: readonly RoomObject[]): Vec3 {
  // Small evidence-box props reserve 35 cm between centers, including existing props.
  for (let i = 0; i <= objects.length * 4 + 4; i++) {
    const pos: Vec3 = [zone.anchor[0] + 20 + (i % 5) * 40, zone.anchor[1] + 75, zone.anchor[2] - 20 - Math.floor(i / 5) * 40];
    if (objects.every(object => {
      const dx = object.pos[0] - pos[0], dy = object.pos[1] - pos[1], dz = object.pos[2] - pos[2];
      return dx * dx + dy * dy + dz * dz >= 35 * 35;
    })) return pos;
  }
  throw new Error("No free virtual prop position found");
}
