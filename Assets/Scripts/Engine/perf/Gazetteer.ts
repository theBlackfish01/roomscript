import {CaseGraph} from "../core/Types";

export interface GazetteerEntry {id: string; aliases: string[]; kind: "person" | "zone" | "object";}
export interface EntityMention {ids: string[]; text: string; start: number; end: number;}
export interface TimeMention {value: string; start: number; end: number;}
const objectAliases: Record<string, string[]> = {
  cord: ["cord", "cable", "rope", "lead"], blunt: ["candlestick"], sharp: ["letter opener"],
  poison: ["bottle", "vial"], heavy: ["paperweight"], light: ["lamp", "light"],
  clock: ["clock"], door: ["door", "doorway"], screen: ["screen", "monitor"], mirror: ["mirror"],
  plant: ["plant", "fern"], container: ["box", "container"], soft: ["cloth", "cushion"], kettle: ["kettle"], cup: ["cup", "mug", "glass"],
};
const ones = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const tens = ["", "", "twenty", "thirty", "forty", "fifty"];
const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "today", "yesterday", "tomorrow"];
export function normalizedWords(text: string): string {
  return normalizedText(text).toLowerCase()
    .replace(/\b(i|you|we|they)'ve\b/g,"$1 have").replace(/\bi'm\b/g,"i am")
    .replace(/\b(i|you|he|she|we|they)'d\b/g,"$1 would").replace(/\b(i|you|he|she|we|they)'ll\b/g,"$1 will")
    .replace(/\b(he|she|it|that|there)'s\b/g,"$1 is").replace(/\b(you|we|they)'re\b/g,"$1 are")
    .replace(/\bwon't\b/g,"will not").replace(/\bcan't\b/g,"can not").replace(/n't\b/g," not");
}
/** Validate and speak this same display form; never pass the unnormalized input to audio. */
export function normalizedText(text: string): string {
  return text.normalize("NFKC").replace(/\p{Cf}/gu, "").replace(/[’‘]/g,"'").replace(/[‐‑–—]/g,"-").replace(/\s+/g," ").trim();
}
function numberWords(n: number): string {return n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");}
function escaped(text: string): string {return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");}
function boundary(text: string, start: number, end: number): boolean {
  return (start === 0 || !/[a-z0-9_]/.test(text[start - 1])) && (end === text.length || !/[a-z0-9_]/.test(text[end]));
}

export function buildGazetteer(graph: CaseGraph): GazetteerEntry[] {
  const entries: GazetteerEntry[] = [];
  const add = (id: string, aliases: string[], kind: GazetteerEntry["kind"]) => {
    entries.push({id, kind, aliases: [...new Set([id, ...aliases].map(normalizedWords).filter(Boolean))]});
  };
  const names = (name: string) => name.split(/[\s.-]+/).filter(part => part.length >= 3 && !/^(mr|mrs|miss|dr|doctor)$/i.test(part));
  add(graph.cast.victim.id, [graph.cast.victim.name, ...names(graph.cast.victim.name)], "person");
  for (const person of graph.cast.suspects) add(person.id, [person.name, ...person.nicknames, ...names(person.name)], "person");
  for (const zone of graph.room.zones) add(zone.id, [zone.label, zone.clueName, "the " + zone.clueName], "zone");
  for (const object of graph.room.objects) add(object.id, [object.label, ...(object.synonyms ?? []), ...(objectAliases[object.type] ?? [])], "object");
  return entries;
}

/** Longest match wins: 'desk lamp' is the prop rather than a second mention of the desk zone. */
export function findEntities(text: string, entries: readonly GazetteerEntry[]): EntityMention[] {
  const normalized = normalizedWords(text);
  const aliases = new Map<string, string[]>();
  for (const entry of entries) for (const alias of entry.aliases) aliases.set(alias, [...new Set((aliases.get(alias) ?? []).concat([entry.id]))]);
  const found: EntityMention[] = [];
  for (const [alias, ids] of [...aliases.entries()].sort((a, b) => b[0].length - a[0].length || (a[0] < b[0] ? -1 : 1))) {
    let position = normalized.indexOf(alias);
    while (position !== -1) {
      const end = position + alias.length;
      if (boundary(normalized, position, end) && !found.some(hit => position < hit.end && end > hit.start)) found.push({ids: ids.slice(), text: alias, start: position, end});
      position = normalized.indexOf(alias, position + 1);
    }
  }
  return found.sort((a, b) => a.start - b.start);
}

function timeValue(hour: number, minute: number, meridiem: string = ""): string {
  if (hour > 23 || minute > 59 || hour < 0 || minute < 0) return "invalid_time";
  const marker = meridiem.replace(/\./g, "").toLowerCase();
  if (marker && (hour < 1 || hour > 12)) return "invalid_time";
  if (marker === "am") hour %= 12;
  else if (marker === "pm") hour = hour % 12 + 12;
  else if (hour >= 1 && hour <= 11) hour += 12; // The case takes place at night.
  else if (hour === 12) hour = 0;
  return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
}

/** Recognizes unknown numeric/spoken times as well as the canonical case slots. */
export function findTimes(text: string): TimeMention[] {
  const normalized = normalizedWords(text);
  const result: TimeMention[] = [];
  const add = (value: string, start: number, end: number) => {
    if (boundary(normalized, start, end) && !result.some(hit => start < hit.end && end > hit.start)) result.push({value, start, end});
  };
  const numeric = /\b(\d{1,2})[:.h](\d{2})(?:\s*(a\.?m\.?|p\.?m\.?))?/g;
  let match: RegExpExecArray | null;
  while ((match = numeric.exec(normalized))) add(timeValue(Number(match[1]), Number(match[2]), match[3]), match.index, numeric.lastIndex);
  const hourOnly = /\b(\d{1,2})\s*(a\.?m\.?|p\.?m\.?)\b/g;
  while ((match = hourOnly.exec(normalized))) add(timeValue(Number(match[1]), 0, match[2]), match.index, hourOnly.lastIndex);
  // Twelve hour spoken forms are sufficient for authored night dialogue; 24h forms are numeric.
  for (let hour = 1; hour <= 12; hour++) {
    const name = ones[hour];
    const patterns: {phrase: string; h: number; m: number}[] = [
      {phrase: name + "ish", h: hour, m: 0},
      {phrase: name + " o'clock", h: hour, m: 0},
      {phrase: "half past " + name, h: hour, m: 30}, {phrase: "quarter past " + name, h: hour, m: 15},
      {phrase: "quarter to " + name, h: hour === 1 ? 12 : hour - 1, m: 45},
    ];
    for (let minute = 1; minute < 60; minute++) patterns.push({phrase: name + " " + numberWords(minute), h: hour, m: minute});
    patterns.sort((a, b) => b.phrase.length - a.phrase.length);
    for (const pattern of patterns) {
      const regex = new RegExp(escaped(pattern.phrase).replace(/ /g, "[ -]") + "(?:[ ](a\\.?m\\.?|p\\.?m\\.?))?", "g");
      while ((match = regex.exec(normalized))) add(timeValue(pattern.h, pattern.m, match[1]), match.index, regex.lastIndex);
    }
    const spokenHour = new RegExp("\\b" + name + "[ ](a\\.?m\\.?|p\\.?m\\.?)", "g");
    while ((match = spokenHour.exec(normalized))) add(timeValue(hour, 0, match[1]), match.index, spokenHour.lastIndex);
  }
  for (const pair of [{phrase: "midnight", value: "00:00"}, {phrase: "noon", value: "12:00"}]) {
    let index = normalized.indexOf(pair.phrase);
    while (index !== -1) {add(pair.value, index, index + pair.phrase.length); index = normalized.indexOf(pair.phrase, index + 1);}
  }
  return result.sort((a, b) => a.start - b.start);
}

export function findNumbersAndDays(text: string): string[] {
  let normalized = normalizedWords(text);
  for (const time of findTimes(normalized).slice().reverse()) normalized = normalized.slice(0, time.start) + " ".repeat(time.end - time.start) + normalized.slice(time.end);
  const found = new Set<string>();
  const numeric = /\b\d+(?:\.\d+)?\b/g;
  let match: RegExpExecArray | null;
  while ((match = numeric.exec(normalized))) found.add("number:" + Number(match[0]));
  for (let n = 59; n >= 0; n--) {
    const regex = new RegExp("\\b" + escaped(numberWords(n)).replace(/ /g, "[ -]") + "\\b", "g");
    normalized = normalized.replace(regex, value => {found.add("number:" + n); return " ".repeat(value.length);});
  }
  for (const day of weekdays) if (new RegExp("\\b" + day + "\\b").test(normalized)) found.add("day:" + day);
  return [...found].sort();
}
