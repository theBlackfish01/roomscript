// Browser-side entry: window.RS.{portrait, prop, card, motionInit, motionFrame, sheet}. Called by run.mjs via Playwright.
import * as THREE from "three";
import {buildPuppet} from "./lib/puppet.js";
import {buildProp, exportGLB, renderPropThumb} from "./lib/props.js";
import {renderCard} from "./lib/card.js";
import {motionInit, motionFrame} from "./lib/motion.js";
import {getRenderer, canvas, orthoDesign, renderWithGlow, downsample, roomBackdrop, previewPair} from "./lib/gl.js";

async function portrait(spec, pose, style) {
  const [W, H] = style.portrait.renderSize, [w, h] = style.portrait.outputSize;
  const k = buildPuppet(spec, pose, style, {px: W/1024});
  const scene = new THREE.Scene(); scene.add(k.group());
  const x2 = renderWithGlow(scene, orthoDesign(W, H), W, H, style.portrait.glowPx);
  scene.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
  const x1 = downsample(x2, w, h);
  return {x2: x2.toDataURL("image/png"), x1: x1.toDataURL("image/png"), preview: previewPair(x1, `${spec.file} / ${pose}`).toDataURL("image/png")};
}

async function sheet(tiles, stills, style) {
  const load = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = "/out/" + src; });
  const imgs = await Promise.all(tiles.map(load)), mimgs = await Promise.all(stills.map(load));
  const ports = imgs.filter((_, i) => /Actors/.test(tiles[i])), others = imgs.filter((_, i) => !/Actors/.test(tiles[i]));
  const cols = 6, tw = 256, th = 512, pad = 14;
  const prow = Math.ceil(ports.length/cols), mw = (cols*(tw + pad) - pad - 3*pad)/4, mh = mw*9/16;
  const W = cols*(tw + pad) + pad, H = 70 + prow*(th + pad) + 340 + (mimgs.length ? mh + 60 : 0);
  const c = canvas(W, H), x = c.getContext("2d");
  x.fillStyle = "#0d0c0b"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#FFD60A"; x.font = "44px Anton"; x.fillText("ROOMSCRIPT — GENERATED ART CONTACT SHEET", pad, 52);
  x.font = "700 16px 'Courier Prime'"; x.fillStyle = "#FFF0D6"; x.textAlign = "right"; x.fillText("over a dim simulated room, alpha-composited like Lens Preview", W - pad, 50); x.textAlign = "left";
  const room = roomBackdrop(tw, th);
  ports.forEach((im, i) => { const cx = pad + (i%cols)*(tw + pad), cy = 70 + Math.floor(i/cols)*(th + pad); x.drawImage(room, cx, cy); x.drawImage(im, cx, cy, tw, th);
    x.fillStyle = "#FFF0D6"; x.font = "700 14px 'Courier Prime'"; x.fillText(tiles[tiles.indexOf(tiles.filter(t => /Actors/.test(t))[i])].split("/").pop().replace(".png", ""), cx + 6, cy + th - 8); });
  let oy = 70 + prow*(th + pad), ox = pad;
  for (const im of others) { const s = Math.min(320/im.height, 1.4), ww = im.width*s, hh = im.height*s; const r = roomBackdrop(ww, hh); x.drawImage(r, ox, oy); x.drawImage(im, ox, oy, ww, hh); ox += ww + pad; }
  oy += 340;
  mimgs.forEach((im, i) => { x.drawImage(im, pad + i*(mw + pad), oy, mw, mh); x.strokeStyle = "#3a332c"; x.strokeRect(pad + i*(mw + pad), oy, mw, mh); });
  if (mimgs.length) { x.fillStyle = "#FFF0D6"; x.font = "700 14px 'Courier Prime'"; x.fillText("motion frames (over black = additive look)", pad, oy + mh + 24); }
  return c.toDataURL("image/png");
}

await document.fonts.load("44px Anton"); await document.fonts.load("700 20px 'Courier Prime'"); await document.fonts.load("400 20px 'Courier Prime'");
await document.fonts.load("40px 'Alfa Slab One'"); await document.fonts.load("30px 'Special Elite'");
window.RS = {portrait, sheet, motionInit, motionFrame,
  prop: async (spec, style) => { const g = buildProp(spec, style); const glb = await exportGLB(g); return {...glb, thumb: renderPropThumb(g, spec, style)}; },
  card: async (spec, chars, style) => renderCard(spec, chars, style),
  ready: true};
