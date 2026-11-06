// node contact.mjs <Name>  -> docs/captures/2026-11-07-run9-contact-<name>.png  (row 1 mid-grey, row 2 near-black; body+head composited)
import sharp from 'sharp'; import fs from 'node:fs';
import { composeFrame } from './composite.mjs';
const name = process.argv[2];
const geom = JSON.parse(fs.readFileSync(`out/geom_${name}.json`));
const order = ['neutral', 'speaking', 'mouthopen', 'rattled', 'broken', 'smug', 'tell', 'tableau', 'standing', 'staggering', 'fallen'];
const K = 0.6, ROWH = Math.round(1024 * K), LBL = 30, PAD = 10;
const frames = order.filter((f) => geom.frames[f]);
const tiles = [];
for (const fr of frames) {
  const g = geom.frames[fr];
  const [cw, ch] = g.canvas || [512, 1024];
  const buf = await sharp(await composeFrame(name, 'out', fr, g)).resize(Math.round(cw * K), Math.round(ch * K), { kernel: 'lanczos3' }).png().toBuffer();
  tiles.push({ fr, buf, w: Math.round(cw * K), h: Math.round(ch * K) });
}
const W = tiles.reduce((s, t) => s + t.w + PAD, PAD);
const H = 50 + 2 * (ROWH + LBL + PAD);
const comps = [{ input: Buffer.from(`<svg width="${W}" height="50"><text x="${PAD}" y="34" font-family="Arial" font-size="26" fill="#eee">${name}: Run 9 frames, body+head composited. Top mid-grey, bottom near-black</text></svg>`), left: 0, top: 0 }];
for (const [ri, bg] of [[0, '#7a7a7a'], [1, '#0a0a0a']]) {
  const y0 = 50 + ri * (ROWH + LBL + PAD);
  let x = PAD;
  for (const t of tiles) {
    const panel = await sharp({ create: { width: t.w, height: ROWH, channels: 3, background: bg } }).composite([{ input: t.buf, left: 0, top: ROWH - t.h }]).png().toBuffer();
    comps.push({ input: panel, left: x, top: y0 + LBL });
    comps.push({ input: Buffer.from(`<svg width="${t.w}" height="${LBL}"><text x="4" y="22" font-family="Arial" font-size="20" fill="#ffd34d">${t.fr}</text></svg>`), left: x, top: y0 });
    x += t.w + PAD;
  }
}
const out = `../../docs/captures/2026-11-07-run9-contact-${name.toLowerCase()}.png`;
await sharp({ create: { width: W, height: H, channels: 3, background: '#262626' } }).composite(comps).png({ palette: true, quality: 90, effort: 8, compressionLevel: 9 }).toFile(out);
console.log(out, (fs.statSync(out).size / 1024).toFixed(0) + 'KB');
