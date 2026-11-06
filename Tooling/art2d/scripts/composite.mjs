// Composite body + head layer per frame as the Lens would. node composite.mjs <Name> <dir out|out_rgba> <outPng> [--bg #hex] [--zoom] [--scale 1]
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ART = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [name, dir, outPng, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf("--" + k); return i >= 0 ? rest[i + 1] : d; };
const bg = opt("bg", "#808080"), zoom = rest.includes("--zoom");
const only = opt("frames", null);
const order = ["neutral", "speaking", "mouthopen", "rattled", "broken", "smug", "tell", "tableau", "standing", "staggering", "fallen"];

export async function composeFrame(name, dir, fr, g) {
  const [cw, ch] = g.canvas || [512, 1024];
  const comps = [{ input: path.join(ART, dir, name, g.body) }];
  if (g.head) {
    const [x, y, w, h] = g.headLayerRect;
    const W = Math.round(w * cw), H = Math.round(h * ch);
    const hl = await sharp(path.join(ART, dir, name, g.head)).resize(W, H, { kernel: "lanczos3" }).png().toBuffer();
    // clip to canvas
    let L = Math.round(x * cw), T = Math.round(y * ch);
    let img = sharp(hl);
    const cl = Math.max(0, -L), ct = Math.max(0, -T);
    if (cl || ct) { img = img.extract({ left: cl, top: ct, width: W - cl, height: H - ct }); L += cl; T += ct; }
    comps.push({ input: await img.png().toBuffer(), left: L, top: T });
  }
  return sharp({ create: { width: cw, height: ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comps).png().toBuffer();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const geom = JSON.parse(fs.readFileSync(path.join(ART, "out", `geom_${name}.json`), "utf8"));
  const frames = order.filter((f) => geom.frames[f] && (!only || only.split(",").includes(f)));
  const tiles = [];
  for (const fr of frames) {
    const g = geom.frames[fr];
    let buf = await composeFrame(name, dir, fr, g);
    const [cw, ch] = g.canvas || [512, 1024];
    if (zoom && g.head) {
      const [x, y, w, h] = g.headLayerRect;
      buf = await sharp(buf).extract({ left: Math.max(0, Math.round(x * cw)), top: Math.max(0, Math.round(y * ch)), width: Math.round(w * cw), height: Math.round(h * ch * 1.3) }).resize({ height: 500, kernel: "nearest" }).png().toBuffer();
    }
    const m = await sharp(buf).metadata();
    const flat = await sharp({ create: { width: m.width, height: m.height, channels: 3, background: bg } }).composite([{ input: buf }]).png().toBuffer();
    tiles.push({ buf: flat, w: m.width, h: m.height, label: fr });
  }
  const H = Math.max(...tiles.map((t) => t.h));
  const W = tiles.reduce((s, t) => s + t.w + 6, 6);
  const comps = []; let x = 6;
  for (const t of tiles) {
    comps.push({ input: t.buf, left: x, top: 30 });
    comps.push({ input: Buffer.from(`<svg width="${t.w}" height="26"><text x="4" y="19" font-family="Arial" font-size="18" fill="#ff0">${t.label}</text></svg>`), left: x, top: 2 });
    x += t.w + 6;
  }
  await sharp({ create: { width: W, height: H + 36, channels: 3, background: "#202020" } }).composite(comps).png().toFile(outPng);
  console.log(outPng);
}
