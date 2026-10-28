import {ObjectType, RoomObject, RoomScan} from "../core/Types";

export const OBJECT_TYPES: readonly ObjectType[] = ["cord", "blunt", "sharp", "poison", "heavy", "light", "clock", "door", "screen", "mirror", "plant", "container", "soft", "kettle", "cup"];
export const WEAPON_TYPES: readonly ObjectType[] = ["cord", "blunt", "sharp", "poison", "heavy"];
const affordances: Record<ObjectType, readonly string[]> = {
  cord: ["weapon:strangle"], blunt: ["weapon:blunt"], sharp: ["weapon:sharp"],
  poison: ["weapon:poison"], heavy: ["weapon:heavy"],
  light: ["witness:sight", "witness:presence"], clock: ["witness:time"],
  door: ["witness:passage"], screen: ["witness:record"], mirror: ["witness:reflection"],
  plant: ["witness:state"], container: ["hiding:container"], soft: ["hiding:soft"],
  kettle: ["witness:state"], cup: ["witness:state"],
};

export function affordancesFor(type: ObjectType): string[] {
  if (!OBJECT_TYPES.includes(type)) throw new Error("Unknown object type: " + type);
  return affordances[type].slice();
}
export function isWeapon(object: Pick<RoomObject, "type">): boolean {return WEAPON_TYPES.includes(object.type);}
export function isWitness(object: Pick<RoomObject, "type">): boolean {return affordancesFor(object.type).some(role => role.indexOf("witness:") === 0);}
export function supportsRole(object: Pick<RoomObject, "type">, role: string): boolean {return affordancesFor(object.type).includes(role);}

export interface RoleRequest {role: string; type: ObjectType; preferredZone?: string;}
export interface RoleBindings {bindings: Record<string, string>; missing: string[];}

/** One object per role: confidence first, then zone spread, then stable ID. No layout-based tie breaks. */
export function bindRoles(room: RoomScan, requests: readonly RoleRequest[]): RoleBindings {
  const result: RoleBindings = {bindings: {}, missing: []};
  const used = new Set<string>();
  const zoneUse = new Map<string, number>();
  const roleNames = new Set<string>();
  for (const request of requests) {
    if (!request.role.trim() || roleNames.has(request.role) || !OBJECT_TYPES.includes(request.type)) throw new Error("Invalid or duplicate role request");
    roleNames.add(request.role);
  }
  // Sorting prevents request iteration order from changing the logical binding.
  for (const request of requests.slice().sort((a, b) => compareIds(a.role, b.role))) {
    const candidates = room.objects.filter(object => object.type === request.type && !used.has(object.id));
    candidates.sort((a, b) => {
      const preferred = Number(b.zone === request.preferredZone) - Number(a.zone === request.preferredZone);
      return preferred || (b.confidence ?? 1) - (a.confidence ?? 1)
        || (zoneUse.get(a.zone) ?? 0) - (zoneUse.get(b.zone) ?? 0) || compareIds(a.id, b.id);
    });
    const object = candidates[0];
    if (!object) {result.missing.push(request.role); continue;}
    // Avoid inherited property setters for role names such as __proto__.
    Object.defineProperty(result.bindings, request.role, {value: object.id, enumerable: true, writable: true, configurable: true});
    used.add(object.id);
    zoneUse.set(object.zone, (zoneUse.get(object.zone) ?? 0) + 1);
  }
  return result;
}

/** Code-unit order is independent of locale and host ICU versions. */
export function compareIds(a: string, b: string): number {return a < b ? -1 : a > b ? 1 : 0;}
