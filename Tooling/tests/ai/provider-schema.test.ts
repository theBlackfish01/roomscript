import {describe,it,expect} from "vitest";
import {geminiResponseSchema} from "../../../Assets/Scripts/Engine/ai/ProviderSchema";
describe("Gemini response schema compatibility",()=>{
  it("removes unsupported JSON Schema keywords without losing per-call enums or mutating input",()=>{
    const schema={type:"object",additionalProperties:false,required:["cites"],properties:{cites:{type:"array",uniqueItems:true,minItems:1,maxItems:2,items:{type:"string",enum:["a:claim"]}},line:{type:"string",maxLength:220}}};
    const result=geminiResponseSchema(schema) as any;
    expect(result).toEqual({type:"OBJECT",required:["cites"],properties:{cites:{type:"ARRAY",minItems:1,maxItems:2,items:{type:"STRING",enum:["a:claim"]}},line:{type:"STRING"}}});
    expect(schema.properties.cites.uniqueItems).toBe(true);
  });
});
