import { parseDocument, isMap, isSeq, isScalar } from "yaml";

const tokenNames = new Set(["snaptoken", "openaitoken", "googletoken"]);
const metadataSections = new Set(["ScriptInputsDefault", "ScriptTypes", "ScriptTypesDefault"]);

/** Locate only credential values, preserving Lens YAML tags and all unrelated bytes. */
export function sceneTokenFields(source) {
  const doc = parseDocument(source, { keepSourceTokens: true, uniqueKeys: false });
  if (doc.errors.length) throw new Error("Scene cannot be parsed safely; token scan refused.");
  const fields = [];
  function visit(node, path = []) {
    if (isMap(node)) {
      for (const pair of node.items) {
        const key = isScalar(pair.key) ? String(pair.key.value) : "";
        if (tokenNames.has(key.toLowerCase()) && !path.some(p => metadataSections.has(p))) {
          const value = pair.value;
          const empty = value == null || (isScalar(value) && (value.value == null || value.value === ""));
          fields.push({ key, empty, range: value?.range?.slice(0, 2), scalar: isScalar(value) });
        } else if (!metadataSections.has(key)) {
          visit(pair.value, [...path, key]);
        }
      }
    } else if (isSeq(node)) {
      for (const item of node.items) visit(item, path);
    }
  }
  visit(doc.contents);
  return fields;
}

export function stripSceneTokens(source) {
  const fields = sceneTokenFields(source).filter(field => !field.empty);
  if (fields.some(field => !field.scalar || !field.range)) {
    throw new Error("Unsupported credential value shape; refused to modify scene.");
  }
  let clean = source;
  for (const field of fields.sort((a, b) => b.range[0] - a.range[0])) {
    const valueText = source.slice(field.range[0], field.range[1]);
    const trailingNewline = valueText.match(/\r?\n$/)?.[0] ?? "";
    clean = clean.slice(0, field.range[0]) + '""' + trailingNewline + clean.slice(field.range[1]);
  }
  if (sceneTokenFields(clean).some(field => !field.empty)) {
    throw new Error("Token removal verification failed; refused to write scene.");
  }
  return { source: clean, count: fields.length };
}
