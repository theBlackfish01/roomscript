import {expect,it} from "vitest";
import {fuzzCases,fuzzCasesAsync} from "../../scripts/fuzz-cases";
const seedsPerFixture=process.env.ROOMSCRIPT_FULL_FUZZ==="1"?1000:40;
it("accepts at least 90 percent of seeds independently on each of five fixtures",async()=>{
  const report=await fuzzCasesAsync(seedsPerFixture);
  expect(report.total).toBe(seedsPerFixture*5);
  for(const fixture of Object.values(report.fixtures))expect(fixture.accepted/fixture.total).toBeGreaterThanOrEqual(.9);
  expect(report.maxAttempts).toBeLessThanOrEqual(50);
  expect(report.distinctEnvelopes).toBeGreaterThan(30);
  expect(report.livePitchAcceptance).toBe("not_measured");
  console.info("Case compiler acceptance",report);
// The default gate runs 200 cases. test:fuzz retains the full 5000-case proof.
},process.env.ROOMSCRIPT_FULL_FUZZ==="1"?600000:60000);
it("batch yielding preserves all deterministic results",async()=>{
  const sync=fuzzCases(4),asyncResult=await fuzzCasesAsync(4,2);
  const logical=({maxMs,p95Ms,over300ms,...rest}:typeof sync)=>rest;
  expect(logical(asyncResult)).toEqual(logical(sync));
});
