// node onbg.mjs out.png "#hex" [--crop x,y,w,h] [--h 700] cut1.png cut2.png ...
import sharp from "sharp";
import path from "node:path";
const a = process.argv.slice(2);
const out = a.shift(), bg = a.shift();
let crop = null, H = 700;
for (let i = 0; i < a.length; ) {
  if (a[i] === "--crop") { crop = a[i + 1].split(",").map(Number); a.splice(i, 2); }
  else if (a[i] === "--h") { H = +a[i + 1]; a.splice(i, 2); } else i++;
}
const tiles = [];
for (const f of a) {
  const m0 = await sharp(f).metadata();
  const flat = await sharp({ create: { width: m0.width, height: m0.height, channels: 4, background: bg } }).composite([{ input: f }]).png().toBuffer();
  let img = sharp(flat);
  if (crop) img = img.extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[3] });
  const buf = await img.resize({ height: H, kernel: crop ? "nearest" : "lanczos3" }).png().toBuffer();
  const m = await sharp(buf).metadata();
  tiles.push({ buf, w: m.width, label: path.basename(f, ".png") });
}
const W = tiles.reduce((s, t) => s + t.w + 8, 8);
const comps = []; let x = 8;
for (const t of tiles) {
  comps.push({ input: t.buf, left: x, top: 30 });
  comps.push({ input: Buffer.from(`<svg width="${t.w}" height="26"><text x="4" y="19" font-family="Arial" font-size="16" fill="#ff0">${t.label}</text></svg>`), left: x, top: 2 });
  x += t.w + 8;
}
await sharp({ create: { width: W, height: H + 38, channels: 3, background: "#222" } }).composite(comps).png().toFile(out);
console.log(out);
