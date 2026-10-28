/** Gemini's responseSchema is a schema subset. Omitted constraints remain enforced by LineValidator. */
export function geminiResponseSchema(schema:Record<string,unknown>):Record<string,unknown>&{type:string} {
  if(typeof schema.type!=="string")throw new Error("Schema type required");
  const out:Record<string,unknown>&{type:string}={type:schema.type.toUpperCase()};
  const supported=["type","format","description","nullable","enum","minItems","maxItems","minimum","maximum","required","propertyOrdering"];
  for(const key of supported)if(schema[key]!==undefined)out[key]=key==="type"&&typeof schema[key]==="string"?(schema[key] as string).toUpperCase():schema[key];
  if(schema.items)out.items=geminiResponseSchema(schema.items as Record<string,unknown>);
  if(schema.properties){const properties:Record<string,unknown>={};for(const key of Object.keys(schema.properties as object))properties[key]=geminiResponseSchema((schema.properties as Record<string,Record<string,unknown>>)[key]);out.properties=properties;}
  return out;
}
