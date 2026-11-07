import {describe,it,expect} from "vitest";
import {existsSync} from "node:fs";
import {resolve} from "node:path";
import {roomArtKey,weaponArtKey} from "../../../Assets/Scripts/Content/BoardArt";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {applyPresetEveningRoom} from "../../../Assets/Scripts/Content/PresetEveningRoom";
// Run 9 (Wadood's review): every room and weapon card of the hero case carries a picture.
describe("case board card pictures",()=>{
  it("covers every hero room and weapon, and the files exist",()=>{
    const g=applyPresetEveningRoom(createHeroCase());
    const keys=[...g.room.zones.map(z=>roomArtKey(z.clueName)),...g.weapons.map(id=>weaponArtKey(g.room.objects.find(o=>o.id===id)!.type))];
    expect(keys.every(k=>!!k)).toBe(true);
    for(const k of keys)expect(existsSync(resolve("../Assets/Art/Board",k+".jpg")),k!).toBe(true);
  });
  it("gives unknown names no picture",()=>{expect(roomArtKey("Ballroom")).toBeNull();expect(weaponArtKey("spoon")).toBeNull();});
});
