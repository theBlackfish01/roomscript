import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptRoomBinding} from "./RoomscriptRoomBinding";

/** Check real authored transforms and device-visible content independently of Preview furniture. */
@component export class RoomscriptBindingLeafScenario extends Scenario {
  async run():Promise<void> {
    await sleep(1500);
    const root=findSceneObjectByName("RoomscriptCaseRoom"),preview=findSceneObjectByName("PreviewRoom");
    const binding=root.getComponent(RoomscriptRoomBinding.getTypeName()) as RoomscriptRoomBinding;
    expect(binding.audit().length).toBe(0);const graph=binding.engine.caseGraph();
    const before=root.getTransform().getLocalPosition(),wasEnabled=preview.enabled;
    try {
      root.getTransform().setLocalPosition(before.add(new vec3(21,5,-13)));
      expect(binding.audit().length).toBe(0);
      preview.enabled=false;
      for(const object of graph.room.objects) {
        const anchor=binding.objectAnchor(object.id);expect(anchor.enabled).toBe(true);expect(anchor.getParent().name).toBe("RoomscriptCaseRoom");
        if(object.virtual)expect(anchor.getChildrenCount()).toBeGreaterThan(0);
      }
      for(const zone of graph.room.zones) {
        const anchor=binding.zoneAnchor(zone.id);expect(anchor.enabled).toBe(true);expect(anchor.getChildrenCount()).toBeGreaterThan(0);
      }
      const cable=binding.objectAnchor("O1"),old=cable.getTransform().getLocalPosition();
      cable.getTransform().setLocalPosition(old.add(new vec3(1,0,0)));expect(binding.audit().indexOf("position O1")>=0).toBe(true);cable.getTransform().setLocalPosition(old);
    } finally {root.getTransform().setLocalPosition(before);preview.enabled=wasEnabled;}
    expect(binding.audit().length).toBe(0);console.log("BINDING_CHECK|13_objects|5_zones|5_virtual_props|device_visible|translated_root|drift_detected");
  }
}
