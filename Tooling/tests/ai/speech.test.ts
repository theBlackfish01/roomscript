import {describe,it,expect} from "vitest";
import {splitSentences,prepareSpeech,audioBudgetMs} from "../../../Assets/Scripts/Engine/ai/Speech";
import {deferred,flush} from "./helpers";
describe("speech preparation",()=>{
  it.each([
    ["Dr. Okafor spoke to Mrs. Vale. Then she left.",["Dr. Okafor spoke to Mrs. Vale.","Then she left."]],
    ["It was 10.30 p.m. in the Hall. I waited.",["It was 10.30 p.m. in the Hall.","I waited."]],
    ["At 10.30 p.m. I waited. Did you? Yes!",["At 10.30 p.m. I waited.","Did you?","Yes!"]],
    ["Mr. J. Pike arrived at 9.15 a.m. today.",["Mr. J. Pike arrived at 9.15 a.m. today."]],
    ["No punctuation",["No punctuation"]],["",[]]
  ])("splits %s without breaking abbreviations",(line,expected)=>expect(splitSentences(line)).toEqual(expected));
  it("starts all sentence synthesis concurrently while retaining order and handling early rejections",async()=>{
    const first=deferred<string>(),second=deferred<string>(),started:string[]=[];
    const clips=prepareSpeech("First sentence. Second sentence.",sentence=>{started.push(sentence);return started.length===1?first.promise:second.promise;});
    await flush();expect(started).toEqual(["First sentence.","Second sentence."]);
    second.reject(new Error("offline"));await flush();first.resolve("audio1");
    expect(await clips[0].ready).toEqual({ok:true,track:"audio1"});expect(await clips[1].ready).toMatchObject({ok:false});
  });
  it("reserves only the remaining question budget for audio",()=>{
    expect(audioBudgetMs(1000,1000)).toBe(4000);expect(audioBudgetMs(1000,5000)).toBe(2500);
    expect(audioBudgetMs(1000,7499)).toBe(1);expect(audioBudgetMs(1000,7500)).toBe(0);
  });
  it("gives continuation synthesis its own budget after first-audio deadline",async()=>{
    const budgets:number[]=[];const clips=prepareSpeech("First sentence. Second sentence.",async(_,index)=>{const budget=audioBudgetMs(1000,7400,index);budgets.push(budget);return budget;});await flush();expect(budgets).toEqual([100,4000]);expect(await clips[1].ready).toEqual({ok:true,track:4000});expect(audioBudgetMs(1000,9000,1)).toBe(4000);
  });
});
