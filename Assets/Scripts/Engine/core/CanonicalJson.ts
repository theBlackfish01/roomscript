/** Sorted object keys, ordered arrays, finite JSON values only; fail closed on unsupported data. */
export function canonicalJson(value: unknown): string {
  const ancestors = new Set<object>();
  const encode = (entry: unknown): string => {
    if (entry === null) return "null";
    if (typeof entry === "string" || typeof entry === "boolean") return JSON.stringify(entry);
    if (typeof entry === "number") {
      if (!Number.isFinite(entry)) throw new Error("Canonical JSON requires finite numbers");
      return JSON.stringify(entry);
    }
    if (typeof entry !== "object") throw new Error("Unsupported canonical JSON value");
    if (ancestors.has(entry)) throw new Error("Cyclic canonical JSON value");
    ancestors.add(entry);
    try {
      if (Array.isArray(entry)) {
        for (let i = 0; i < entry.length; i++) if (!(i in entry)) throw new Error("Sparse JSON array");
        return "[" + entry.map(encode).join(",") + "]";
      }
      const prototype = Object.getPrototypeOf(entry);
      if (prototype !== Object.prototype && prototype !== null) throw new Error("Canonical JSON requires plain objects");
      const record = entry as Record<string, unknown>;
      return "{" + Object.keys(record).sort().map(key => JSON.stringify(key) + ":" + encode(record[key])).join(",") + "}";
    } finally {ancestors.delete(entry);}
  };
  return encode(value);
}
