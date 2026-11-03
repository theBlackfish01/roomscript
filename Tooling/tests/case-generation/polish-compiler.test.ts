import {it,expect} from "vitest";
import {compileCase} from "../../../Assets/Scripts/Engine/case/CaseCompiler";
import {getPitch} from "../../../Assets/Scripts/Content/PitchLibrary";
import {allRoomFixtures} from "../../../Assets/Scripts/Engine/room/RoomFixtures";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame} from "../../../Assets/Scripts/Engine/game/Reducer";
it("200 compiled cases set up without topic-name assumptions and price their route at >=60",()=>{const rooms=allRoomFixtures();let accepted=0;for(let seed=0;seed<200;seed++){const result=compileCase(seed,rooms[seed%rooms.length],getPitch(seed));if(!result.ok)continue;accepted++;const g=result.graph!;expect(g.solver!.minRouteMinutes).toBeGreaterThanOrEqual(60);const s=reduceGame(g,createGameState(g),{type:"SetupCase",origin:[0,0,0],forward:[0,0,-1],seq:1,by:"test"});expect(s.setupPose).not.toBeNull();for(const statement of g.statements){const own=g.cast.suspects.find(s=>s.id===statement.speaker)!;expect(statement.canonical).not.toContain(own.name)}}expect(accepted).toBeGreaterThanOrEqual(180)},60000);
