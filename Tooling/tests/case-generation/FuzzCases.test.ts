import {expect,it} from "vitest";
import {fuzzCases,fuzzCasesAsync} from "../../scripts/fuzz-cases";
it("accepts at least 90 percent of 1000 seeds independently on each of five fixtures",async()=>{
  const report=await fuzzCasesAsync(1000);
  expect(report.total).toBe(5000);
  for(const fixture of Object.values(report.fixtures))expect(fixture.accepted/fixture.total).toBeGreaterThanOrEqual(.9);
  expect(report.maxAttempts).toBeLessThanOrEqual(50);
  expect(report.distinctEnvelopes).toBeGreaterThan(30);
  expect(report.livePitchAcceptance).toBe("not_measured");
  console.info("Case compiler acceptance",report);
// Weighted routes do more search than the former zero-cost shortcut. Preserve all
// 5000 seeds and performance measurements; allow the full batch four minutes.
},240000);
it("batch yielding preserves all deterministic results",async()=>{
  const sync=fuzzCases(4),asyncResult=await fuzzCasesAsync(4,2);
  const logical=({maxMs,p95Ms,over300ms,...rest}:typeof sync)=>rest;
  expect(logical(asyncResult)).toEqual(logical(sync));
});
