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

/** Small strict-mode subset; every omitted constraint is still checked after generation. */
export function openAIResponseSchema(schema:Record<string,unknown>):Record<string,unknown> {
  const out:Record<string,unknown>={};
  for(const key of ["type","description","enum"])if(schema[key]!==undefined)out[key]=schema[key];
  if(schema.items)out.items=openAIResponseSchema(schema.items as Record<string,unknown>);
  if(schema.properties) {
    const properties:Record<string,unknown>={};
    for(const [key,value] of Object.entries(schema.properties as Record<string,Record<string,unknown>>))properties[key]=openAIResponseSchema(value);
    out.properties=properties;out.required=Object.keys(properties);out.additionalProperties=false;
  }
  return out;
}
