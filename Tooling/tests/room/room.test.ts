import {describe, it, expect} from "vitest";
import {buildRoom, normalizeRoom, roomIdentity, RoomInput} from "../../../Assets/Scripts/Engine/room/RoomModel";
import {affordancesFor, bindRoles, isWeapon, isWitness, OBJECT_TYPES, RoleRequest, supportsRole, WEAPON_TYPES} from "../../../Assets/Scripts/Engine/room/Affordances";
import {getRoomFixture, getRawRoomFixture, ROOM_FIXTURE_NAMES} from "../../../Assets/Scripts/Engine/room/RoomFixtures";
import {RoomObject, Vec3} from "../../../Assets/Scripts/Engine/core/Types";

const roles: RoleRequest[] = [
  {role: "WEAPON_CORD", type: "cord"}, {role: "WEAPON_BLUNT", type: "blunt"}, {role: "WEAPON_SHARP", type: "sharp"},
  {role: "WITNESS_LIGHT", type: "light"}, {role: "WITNESS_CLOCK", type: "clock"},
];

describe("typed room affordances", () => {
  it("derives roles for every supported type and returns independent arrays", () => {
    for (const type of OBJECT_TYPES) expect(affordancesFor(type).length).toBeGreaterThan(0);
    expect(WEAPON_TYPES.filter(type => isWeapon({type}))).toHaveLength(5);
    for (const type of ["light", "clock", "door", "screen", "mirror", "plant", "kettle", "cup"] as const) expect(isWitness({type})).toBe(true);
    expect(isWeapon({type: "light"})).toBe(false);
    expect(supportsRole({type: "container"}, "hiding:container")).toBe(true);
    const copy = affordancesFor("cord"); copy.push("invented");
    expect(affordancesFor("cord")).toEqual(["weapon:strangle"]);
  });
  it("overwrites untrusted affordances so vision cannot invent weapon roles", () => {
    const input = getRawRoomFixture("dorm");
    input.objects[1].affordances = ["weapon:poison", "truth:culprit"];
    const lamp = normalizeRoom(input).objects.find(object => object.type === "light")!;
    expect(lamp.affordances).toEqual(["witness:sight", "witness:presence"]);
  });
});

describe("room fixtures and substitution", () => {
  it.each(ROOM_FIXTURE_NAMES)("binds the same typed roles in %s and meets every minimum", name => {
    const room = getRoomFixture(name, {roles});
    expect(room.zones.length).toBeGreaterThanOrEqual(3);
    expect(room.objects.filter(isWeapon).length).toBeGreaterThanOrEqual(3);
    expect(room.objects.filter(isWitness).length).toBeGreaterThanOrEqual(2);
    const bound = bindRoles(room, roles);
    expect(bound.missing).toEqual([]);
    expect(new Set(Object.values(bound.bindings)).size).toBe(roles.length);
    for (const role of roles) expect(room.objects.find(object => object.id === bound.bindings[role.role])!.type).toBe(role.type);
    for (const object of room.objects) {
      expect(room.zones.some(zone => zone.id === object.zone)).toBe(true);
      if (object.origin === "substitution") expect(object.virtual).toBe(true);
      expect(object.pos.every(Number.isFinite)).toBe(true);
    }
  });
  it("fills a minimal room with exactly enough honest props and reserves spacing", () => {
    const room = getRoomFixture("minimal");
    expect(room.zones).toHaveLength(3);
    expect(room.objects).toHaveLength(5);
    expect(room.objects.every(object => object.virtual && object.origin === "substitution")).toBe(true);
    for (let i = 0; i < room.objects.length; i++) for (let j = i + 1; j < room.objects.length; j++) {
      const distance = room.objects[i].pos.reduce((sum, x, axis) => sum + (x - room.objects[j].pos[axis]) ** 2, 0);
      expect(distance).toBeGreaterThanOrEqual(35 ** 2);
    }
    expect(room.zones.every(zone => zone.anchor[2] === -150)).toBe(true);
  });
  it("supplies five hero weapon types without changing authored fixture IDs", () => {
    const room = getRoomFixture("wadood-room", {minZones: 5, minWeapons: 5, requiredTypes: WEAPON_TYPES});
    expect(room.zones.map(zone => zone.id)).toEqual(["Z1", "Z2", "Z3", "Z4", "Z5"]);
    expect(room.objects.filter(isWeapon)).toHaveLength(5);
    expect(new Set(room.objects.filter(isWeapon).map(object => object.type))).toEqual(new Set(WEAPON_TYPES));
    expect(room.objects.find(object => object.id === "O1")!.label).toBe("charger cable");
    expect(room.objects.find(object => object.id === "O4")!.type).toBe("light");
  });
  it("is idempotent and never mutates observations, vectors, synonyms or fixtures", () => {
    const input = getRawRoomFixture("dorm");
    input.objects[0].synonyms = ["lead"];
    const snapshot = JSON.stringify(input);
    const room = buildRoom(input, {roles});
    expect(buildRoom(room, {roles})).toEqual(room);
    room.zones[0].anchor[0] = 999;
    room.objects.find(object => object.id === "O1")!.synonyms!.push("changed");
    expect(JSON.stringify(input)).toBe(snapshot);
    expect(getRawRoomFixture("dorm").zones[0].anchor[0]).toBe(-100);
  });
  it("avoids collisions with observed IDs and existing props", () => {
    const input = getRawRoomFixture("minimal");
    input.zones[0].id = "VZ2";
    input.objects = [{id: "V_cord", label: "lamp", type: "light", zone: "VZ2", pos: [50, 75, -170]}];
    const room = buildRoom(input);
    const ids = room.zones.map(zone => zone.id).concat(room.objects.map(object => object.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(room.objects.some(object => object.id === "V_cord_1" && object.type === "cord")).toBe(true);
    for (const object of room.objects.filter(item => item.virtual)) {
      expect(object.pos.reduce((sum, x, axis) => sum + (x - input.objects[0].pos[axis]) ** 2, 0)).toBeGreaterThanOrEqual(35 ** 2);
    }
  });
  it("requires an explicit placement anchor when no room observations exist", () => {
    const empty: RoomInput = {source: "manual", zones: [], objects: []};
    expect(() => buildRoom(empty)).toThrow("fallbackAnchor");
    const room = buildRoom(empty, {fallbackAnchor: [240, 20, -400]});
    expect(room.zones[0].anchor).toEqual([240, 20, -400]);
    expect(room.objects.every(object => object.pos[1] === 95)).toBe(true);
  });
  it("supplies distinct objects for repeated same-type role requests", () => {
    const requests: RoleRequest[] = [{role: "lampA", type: "light"}, {role: "lampB", type: "light"}, {role: "lampC", type: "light"}];
    const room = getRoomFixture("minimal", {roles: requests});
    const bindings = bindRoles(room, requests);
    expect(bindings.missing).toEqual([]);
    expect(new Set(Object.values(bindings.bindings)).size).toBe(3);
  });
});

describe("layout-independent room identity", () => {
  it.each(ROOM_FIXTURE_NAMES)("ignores translations, layout and observation order for %s", name => {
    const input = getRawRoomFixture(name);
    const original = buildRoom(input, {roles});
    const rearranged: RoomInput = {
      source: "manual",
      zones: input.zones.slice().reverse().map((zone, i) => ({...zone, label: "renamed furniture", anchor: [i * 230 + 10, 3, 490 - i * 100] as Vec3})),
      objects: input.objects.slice().reverse().map((object, i) => ({...object, label: "renamed prop", pos: [i * 50, 90, 600] as Vec3})),
    };
    const moved = buildRoom(rearranged, {roles: roles.slice().reverse()});
    expect(moved.roomId).toBe(original.roomId);
    expect(bindRoles(moved, roles)).toEqual(bindRoles(original, roles));
    expect(moved.zones[0].anchor).not.toEqual(original.zones[0].anchor);
  });
  it("changes when typed inventory or object-zone membership changes", () => {
    const input = getRawRoomFixture("wadood-room");
    const original = normalizeRoom(input);
    const changed = getRawRoomFixture("wadood-room");
    changed.objects[0].type = "heavy";
    expect(normalizeRoom(changed).roomId).not.toBe(original.roomId);
    const moved = getRawRoomFixture("wadood-room");
    moved.objects[0].zone = "Z2";
    expect(normalizeRoom(moved).roomId).not.toBe(original.roomId);
  });
  it("ignores object IDs but includes empty zones and multiplicity", () => {
    const input = getRawRoomFixture("wadood-room");
    const room = normalizeRoom(input);
    input.objects[0].id = "different-object-id";
    expect(normalizeRoom(input).roomId).toBe(room.roomId);
    input.zones = [...input.zones, {id: "Z6", label: "corner", clueName: "Annex", anchor: [99, 0, 99]}];
    expect(normalizeRoom(input).roomId).not.toBe(room.roomId);
    const duplicate = getRawRoomFixture("wadood-room");
    duplicate.objects = [...duplicate.objects, {...duplicate.objects[0], id: "other-cord"}];
    expect(normalizeRoom(duplicate).roomId).not.toBe(room.roomId);
  });
});

describe("deterministic role binding", () => {
  const roomWithLights = () => {
    const room = getRoomFixture("dorm");
    const lamp = room.objects.find(object => object.type === "light")!;
    room.objects = [
      {...lamp, id: "L1", confidence: 0.6, zone: "Z1"},
      {...lamp, id: "L2", confidence: 0.9, zone: "Z1"},
      {...lamp, id: "L3", confidence: 0.9, zone: "Z2"},
    ];
    return room;
  };
  it("prefers confidence, distributes ties across zones, and is order-stable", () => {
    const room = roomWithLights();
    const requests: RoleRequest[] = [{role: "A", type: "light"}, {role: "B", type: "light"}, {role: "C", type: "light"}];
    expect(bindRoles(room, requests).bindings).toEqual({A: "L2", B: "L3", C: "L1"});
    room.objects.reverse();
    expect(bindRoles(room, requests.slice().reverse()).bindings).toEqual({A: "L2", B: "L3", C: "L1"});
  });
  it("honors a preferred zone and reports missing roles instead of casting the wrong type", () => {
    const room = roomWithLights();
    const result = bindRoles(room, [{role: "A", type: "light", preferredZone: "Z2"}, {role: "B", type: "poison"}]);
    expect(result).toEqual({bindings: {A: "L3"}, missing: ["B"]});
  });
  it("handles ordinary strings that match prototype property names safely", () => {
    const room = roomWithLights();
    room.objects[1].zone = "__proto__";
    const result = bindRoles(room, [{role: "__proto__", type: "light"}]);
    expect(Object.keys(result.bindings)).toEqual(["__proto__"]);
    expect(result.bindings["__proto__"]).toBe("L2");
  });
});

describe("room boundary validation", () => {
  it("rejects duplicate IDs, unknown zones, invalid coordinates and confidence", () => {
    const duplicate = getRawRoomFixture("dorm"); duplicate.objects[0].id = "Z1";
    expect(() => normalizeRoom(duplicate)).toThrow("Duplicate");
    const badZone = getRawRoomFixture("dorm"); badZone.objects[0].zone = "missing";
    expect(() => normalizeRoom(badZone)).toThrow("unknown zone");
    const badPosition = getRawRoomFixture("dorm"); badPosition.objects[0].pos[0] = Infinity;
    expect(() => normalizeRoom(badPosition)).toThrow("centimeter");
    const badConfidence = getRawRoomFixture("dorm"); badConfidence.objects[0].confidence = 1.5;
    expect(() => normalizeRoom(badConfidence)).toThrow("Confidence");
    expect(() => roomIdentity({zones: [], objects: [{zone: "missing", type: "cord"} as RoomObject]})).toThrow("unknown zone");
  });
  it("rejects invalid minima and duplicate role requests", () => {
    expect(() => getRoomFixture("minimal", {minWeapons: Infinity})).toThrow();
    expect(() => getRoomFixture("minimal", {minWeapons: 1.5})).toThrow();
    expect(() => getRoomFixture("minimal", {minZones: 101})).toThrow();
    const duplicates: RoleRequest[] = [{role: "same", type: "cord"}, {role: "same", type: "light"}];
    expect(() => getRoomFixture("minimal", {roles: duplicates})).toThrow("duplicate");
    expect(() => bindRoles(getRoomFixture("dorm"), duplicates)).toThrow("duplicate");
  });
});
