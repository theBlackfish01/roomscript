import {it,expect} from "vitest";
import {Degradation} from "../../../Assets/Scripts/Engine/ai/Degradation";
it("keeps isolated slow calls live but switches to prepared dialogue after three consecutive timeouts",()=>{
  const d=new Degradation();d.failure("timeout");d.failure("timeout");expect(d.level).toBe(3);d.success();d.failure("timeout");d.failure("timeout");expect(d.level).toBe(3);d.failure("timeout");expect(d.level).toBe(2);expect(d.preferAuthored).toBe(false);
});
it("rate limits choose prepared dialogue and an unreachable gateway leaves buttons available",()=>{
  const d=new Degradation();d.failure("rate_limit");expect(d.level).toBe(2);d.failure("unavailable");d.failure("unavailable");d.failure("unavailable");expect(d.level).toBe(1);expect(d.label).toBe("Prepared questions / captions");
});
it("stage mode and a boot without either provider choose the offline hero immediately",()=>{
  for(const d of [new Degradation(true,true),new Degradation(false,false)]){expect(d.level).toBe(0);expect(d.preferAuthored).toBe(true);d.success();expect(d.level).toBe(0);}
});
it("one provider authentication failure alone does not disable the other provider",()=>{
  const d=new Degradation();d.failure("unauthenticated");expect(d.level).toBe(3);d.offline();expect(d.level).toBe(0);
});
