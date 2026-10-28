/** FNV-1a over UTF-8, independent of platform encoders. */
export function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  const byte = (value: number) => {hash = Math.imul(hash ^ value, 0x01000193) >>> 0;};
  for (const char of text) {
    const cp = char.codePointAt(0)!;
    if (cp < 0x80) byte(cp);
    else if (cp < 0x800) {byte(0xc0 | cp >>> 6); byte(0x80 | cp & 63);}
    else if (cp < 0x10000) {byte(0xe0 | cp >>> 12); byte(0x80 | cp >>> 6 & 63); byte(0x80 | cp & 63);}
    else {byte(0xf0 | cp >>> 18); byte(0x80 | cp >>> 12 & 63); byte(0x80 | cp >>> 6 & 63); byte(0x80 | cp & 63);}
  }
  return hash;
}
export function hashHex(text: string): string {return fnv1a(text).toString(16).padStart(8, "0");}
