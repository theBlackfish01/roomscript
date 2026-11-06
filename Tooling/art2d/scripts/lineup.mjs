// node lineup.mjs -> docs/captures/2026-11-07-run9-cast-lineup.png (neutral/standing of each, same px/cm, with 10 cm height ticks)
import sharp from 'sharp'; import fs from 'node:fs';
import { composeFrame } from './composite.mjs';
const cast = ['Vale', 'Qadir', 'Okafor', 'Pike', 'Harlow'].filter((n) => fs.existsSync(`out/geom_${n}.json`));
const K = 0.75, PXCM = 976 / 170 * K, TOP = 60, CH = Math.round(1024 * K), CW = Math.round(512 * K);
const W = 90 + cast.length * (CW + 10), H = TOP + CH + 20;
const comps = [];
let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><text x="10" y="36" font-family="Arial" font-size="26" fill="#eee">Run 9 cast line-up: neutral frames, same px/cm (5.74 px/cm at 1:1), baseline = floor</text>`;
const base = TOP + 1016 * K;
for (let cm = 0; cm <= 180; cm += 10) { const y = base - cm * PXCM; svg += `<line x1="60" y1="${y}" x2="${W}" y2="${y}" stroke="#fff" stroke-opacity="${cm % 50 ? 0.08 : 0.25}"/><text x="8" y="${y + 5}" font-family="Arial" font-size="14" fill="#aaa">${cm} cm</text>`; }
svg += '</svg>';
comps.push({ input: Buffer.from(svg), left: 0, top: 0 });
let x = 80;
for (const n of cast) {
  const g = JSON.parse(fs.readFileSync(`out/geom_${n}.json`));
  const fr = g.frames.neutral ? 'neutral' : 'standing';
  const buf = await sharp(await composeFrame(n, 'out', fr, g.frames[fr])).resize(CW, CH).png().toBuffer();
  comps.push({ input: buf, left: x, top: TOP });
  comps.push({ input: Buffer.from(`<svg width="${CW}" height="30"><text x="${CW / 2}" y="22" text-anchor="middle" font-family="Arial" font-size="20" fill="#ffd34d">${n} (${g.height_cm} cm)</text></svg>`), left: x, top: H - 30 });
  x += CW + 10;
}
const out = '../../docs/captures/2026-11-07-run9-cast-lineup.png';
await sharp({ create: { width: W, height: H + 10, channels: 3, background: '#5a5a5a' } }).composite(comps).png({ palette: true, quality: 90, effort: 8 }).toFile(out);
console.log(out);
