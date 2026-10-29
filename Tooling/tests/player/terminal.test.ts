import {describe,expect,it} from "vitest";
import {runDemo,TerminalPlayer} from "../../scripts/play";
import {replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";

describe("terminal player",()=>{
  it("solves the hero through typed questions, teaching and murder breaks, evidence and argument",()=>{
    const {player,lines}=runDemo();
    expect(player.state.verdict).toBe("correct");
    expect(player.state.suspects.S2.layer).toBe(2);
    expect(player.state.arguments).toHaveLength(4);
    expect(player.state.elapsedMinutes).toBe(145);
    expect(lines.some(line=>line.startsWith("TELL Marguerite Vale"))).toBe(true);
    expect(lines.filter(line=>line.startsWith("OBJECTION SUSTAINED"))).toHaveLength(3);
    expect(lines.some(line=>line.includes("Remaining hypotheses: 1"))).toBe(true);
    expect(lines.some(line=>line.includes("I killed Edmund Harlow"))).toBe(true);
    expect(lines.some(line=>line.startsWith("REJECTED"))).toBe(false);
    expect(replayGame(player.graph,player.state.log)).toEqual(player.state);
  });
  it("prints public chips and observed notebook content without hidden accounts",()=>{
    const player=new TerminalPlayer();
    expect(player.execute("notebook").lines).toEqual(["Your notebook is empty."]);
    expect(player.execute("chips S2").lines.some(line=>line.includes("where@22:30"))).toBe(true);
    const publicText=[...player.execute("cast").lines,...player.execute("arguments").lines,...player.execute("chips S2").lines].join(" ");
    expect(publicText).not.toContain("forged trust");
    expect(publicText).not.toContain("cable was in my hands");
    player.execute("ask s2 where were you?");
    expect(player.execute("notebook").lines.join(" ")).toContain("C_VALE_ALIBI_0");
    expect(player.execute("notebook").lines.join(" ")).not.toContain("C_VALE_ALIBI_2");
  });
  it("uses keyword fallback, keeps malformed commands inert and accepts comma-separated evidence",()=>{
    const player=new TerminalPlayer();
    player.execute("pinch");player.execute("ask S99 hello");player.execute("unknown");
    expect(player.state.log).toHaveLength(0);
    expect(player.execute("ask S2 what is your favourite tune?").lines.join(" ")).toContain("outside my account");
    expect(player.state.elapsedMinutes).toBe(5);
    player.execute("chip S2 where@22:30");player.execute("pinch O6");player.execute("pinch O11");
    player.execute("object S2 C_VALE_ALIBI_0 E_VALE_LAMP,E_KETTLE_COLD");
    expect(player.state.suspects.S2.layer).toBe(0);
    expect(player.state.pips).toBe(4);
    player.execute("object S2 C_VALE_ALIBI_0 E_KETTLE_COLD");
    expect(player.state.suspects.S2.layer).toBe(1);
  });
  it("prints truthful tells only from reducer events and never confesses after a wrong verdict",()=>{
    const player=new TerminalPlayer();
    expect(player.execute("ask S2 what is your name?").lines.some(line=>line.startsWith("TELL"))).toBe(false);
    expect(player.execute("ask S2 where were you?").lines.some(line=>line.startsWith("TELL"))).toBe(true);
    expect(player.execute("accuse S1 Z1 O1").lines.join(" ")).not.toContain("I killed");
    expect(player.state.verdict).toBe("wrong");
    expect(player.execute("quit").quit).toBe(true);
  });
});
