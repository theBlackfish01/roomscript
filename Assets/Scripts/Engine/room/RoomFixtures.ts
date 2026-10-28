import {ObjectType, Vec3, Zone, RoomScan} from "../core/Types";
import {buildRoom, RoomInput, RoomObjectInput} from "./RoomModel";
import {SubstitutionOptions} from "./Substitution";

export const ROOM_FIXTURE_NAMES = ["wadood-room", "dorm", "studio", "office", "minimal"] as const;
export type RoomFixtureName = typeof ROOM_FIXTURE_NAMES[number];
function zone(id: string, label: string, clueName: string, anchor: Vec3): Zone {return {id, label, clueName, anchor};}
function object(id: string, label: string, type: ObjectType, area: string, pos: Vec3): RoomObjectInput {
  return {id, label, type, zone: area, pos, origin: "fixture", confidence: 1};
}

/** Returns fresh raw observations; fixtures are centimeter-scale design stand-ins, not a measured room scan. */
export function getRawRoomFixture(name: RoomFixtureName): RoomInput {
  switch (name) {
    case "wadood-room": return {source: "fixture", zones: [
      zone("Z1", "desk", "Study", [80, 0, -180]), zone("Z2", "bed", "Lounge", [-160, 0, -120]),
      zone("Z3", "door", "Hall", [170, 0, 40]), zone("Z4", "window wall", "Conservatory", [-120, 0, -280]),
      zone("Z5", "kettle shelf", "Kitchen", [180, 0, -250]),
    ], objects: [
      object("O1", "charger cable", "cord", "Z1", [95, 75, -190]),
      object("O2", "mug", "cup", "Z3", [150, 80, 20]),
      object("O3", "bottle", "poison", "Z1", [55, 75, -180]),
      object("O4", "desk lamp", "light", "Z1", [110, 105, -210]),
      object("O5", "kettle", "kettle", "Z5", [175, 90, -265]),
      object("O6", "door", "door", "Z3", [190, 110, 70]),
    ]};
    case "dorm": return {source: "fixture", zones: [
      zone("Z1", "study desk", "Study", [-100, 0, -150]), zone("Z2", "bunk", "Lounge", [100, 0, -170]), zone("Z3", "entry", "Hall", [0, 0, 100]),
    ], objects: [
      object("O1", "charging lead", "cord", "Z1", [-110, 75, -150]), object("O2", "desk light", "light", "Z1", [-70, 95, -170]),
      object("O3", "alarm clock", "clock", "Z2", [85, 85, -160]), object("O4", "water cup", "cup", "Z2", [130, 85, -175]),
    ]};
    case "studio": return {source: "fixture", zones: [
      zone("Z1", "workbench", "Study", [140, 0, -150]), zone("Z2", "sofa", "Lounge", [-140, 0, -180]), zone("Z3", "entry alcove", "Hall", [-100, 0, 80]),
    ], objects: [
      object("O1", "audio cable", "cord", "Z1", [150, 85, -140]), object("O2", "paperweight", "heavy", "Z1", [115, 85, -170]),
      object("O3", "floor lamp", "light", "Z2", [-190, 140, -200]), object("O4", "wall clock", "clock", "Z3", [-110, 170, 100]),
      object("O5", "cushion", "soft", "Z2", [-130, 55, -165]),
    ]};
    case "office": return {source: "fixture", zones: [
      zone("Z1", "executive desk", "Study", [0, 0, -240]), zone("Z2", "meeting table", "Lounge", [190, 0, -120]),
      zone("Z3", "entry", "Hall", [-160, 0, 90]), zone("Z4", "plant corner", "Conservatory", [-190, 0, -230]),
    ], objects: [
      object("O1", "network cable", "cord", "Z1", [-30, 80, -225]), object("O2", "letter opener", "sharp", "Z1", [30, 80, -240]),
      object("O3", "award", "blunt", "Z2", [170, 80, -100]), object("O4", "monitor", "screen", "Z1", [10, 110, -270]),
      object("O5", "fern", "plant", "Z4", [-185, 70, -245]), object("O6", "water glass", "cup", "Z2", [220, 80, -140]),
    ]};
    case "minimal": return {source: "fixture", zones: [zone("Z1", "small table", "Study", [30, 0, -150])], objects: []};
    default: throw new Error("Unknown room fixture");
  }
}

export function getRoomFixture(name: RoomFixtureName, options: SubstitutionOptions = {}): RoomScan {
  return buildRoom(getRawRoomFixture(name), options);
}
export function allRoomFixtures(options: SubstitutionOptions = {}): RoomScan[] {
  return ROOM_FIXTURE_NAMES.map(name => getRoomFixture(name, options));
}
