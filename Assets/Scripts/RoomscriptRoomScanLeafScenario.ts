import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptRoomScanner} from "./RoomscriptRoomScanner";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {ROOM_SCAN_PROBE} from "./Content/RoomScanProbe";
import {RoomscriptCastingController} from "./RoomscriptCastingController";
import {RoomscriptCaseModes} from "./RoomscriptCaseModes";
import {EVENING_ROOM_SCAN} from "./Content/EveningRoomScan";
/** Real CameraModule and loopback capture probe; no detection/placement accuracy claim. */
@component export class RoomscriptRoomScanLeafScenario extends Scenario {
  async run(config?:ScenarioConfig):Promise<void>{
    await sleep(1000);
    const scanner=findSceneObjectByName("RoomscriptRoomScanner").getComponent(RoomscriptRoomScanner.getTypeName()) as RoomscriptRoomScanner;
    const view=Number(config?.get("view")||"-1");
    if(view===12){const modes=findSceneObjectByName("RoomscriptCaseModes").getComponent(RoomscriptCaseModes.getTypeName()) as RoomscriptCaseModes,engine=modes.opening.cast.flow.engine,original=scanner.locateResponse;expect(engine.configureDynamic(7,EVENING_ROOM_SCAN).ok).toBe(true);scanner.locateResponse=async result=>({...result,located:[]});try{expect(await modes.fromFileReply(1041)).toBe(false);expect(engine.mode()).toBe("preset");expect(modes.diagnostics().scanKind).toBe("recorded scan");expect(modes.diagnostics().busy).toBe(false);console.log("ROOM_SCAN_FALLBACK_CHECK|preset_restored");}finally{scanner.locateResponse=original;}return;}
    if(view===11){let tops=0;for(const x of [.25,.5,.75])for(const y of [.39,.405,.42,.435]){const hit=await scanner.locate(new vec2(x,y));if(hit&&hit.normal[1]>.8)tops++;console.log("ROOM_SCAN_SUPPORT|"+JSON.stringify({uv:[x,y],hit}));}expect(tops>=2).toBe(true);return;}
    if(view===10){const modes=findSceneObjectByName("RoomscriptCaseModes").getComponent(RoomscriptCaseModes.getTypeName()) as RoomscriptCaseModes;const id=await modes.requestOfflineScan(7);expect(id.startsWith("live-")).toBe(true);console.log("ROOM_SCAN_REQUESTED|"+id);return;}
    if(view===9){findSceneObjectByName("Roomscript").enabled=false;findSceneObjectByName("RoomscriptPlacement").enabled=false;const casting=findSceneObjectByName("RoomscriptCasting").getComponent(RoomscriptCastingController.getTypeName()) as RoomscriptCastingController;casting.showAll();expect(casting.diagnostics().objects).toBe(7);for(const uv of [[.1,.65],[.15,.8],[.8,.8],[.9,.9]])console.log("ROOM_SCAN_FLOOR|"+JSON.stringify({uv,hit:await scanner.locate(new vec2(uv[0],uv[1]))}));await sleep(1000);return;}
    if(view<0){const result=await scanner.capture(false);expect(result.logged).toBe(true);const hit=await scanner.locate(new vec2(.5,.65));console.log("ROOM_SCAN_HIT_PROBE|"+JSON.stringify(hit));return;}
    const input=ROOM_SCAN_PROBE[view];expect(!!input).toBe(true);
    const located=[];
    for(const object of input.response.objects){const b=object.box,hit=await scanner.locate(new vec2((b[0]+b[2])/2,(b[1]+b[3])/2));located.push({...object,hit});}
    console.log("ROOM_SCAN_LOCATED|"+JSON.stringify({id:input.response.id,view,located}));
    expect(located.filter(o=>o.hit).length>=4).toBe(true);
  }
}
