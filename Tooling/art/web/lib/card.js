// Object-memory Polaroid: coral frame (truth), dust-rendered memory photo (past tense = specks), yellow time marker,
// ivory monospace caption from the case's canonical evidence text.
import * as THREE from "three";
import {buildPuppet} from "./puppet.js";
import {inkMat, smooth, poly, V, Canvas2D} from "./ink.js";
import {getRenderer, canvas, orthoDesign, previewPair} from "./gl.js";

function wrap(x, text, maxW) {
  const words = text.split(/\s+/), lines = []; let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}

function memoryScene(spec, chars, style, S) {
  const P = style.palette, scene = new THREE.Scene(), k = new Canvas2D(), px = S/448;
  const dust = (color, tone, cell = 3.2, extra = {}) => inkMat({mode: "dust", color, tone, toneGrad: 0.25, lineAlpha: 1, fillAlpha: 0, dust: cell, px, seed: 3.3, ...extra});
  for (const f of spec.scene.furniture || []) {
    if (f.type === "desk") { const x0 = f.x*S - 0.3*S, x1 = f.x*S + 0.3*S, y = f.y*S;
      k.fill(poly([[x0, y], [x1, y], [x1 + 0.03*S, y + 0.05*S], [x0 - 0.03*S, y + 0.05*S]]), dust(P.ivory, 0.75), 5);
      for (const lx of [x0 + 0.02*S, x1 - 0.04*S]) k.fill(poly([[lx, y + 0.05*S], [lx + 0.02*S, y + 0.05*S], [lx + 0.02*S, S], [lx, S]]), dust(P.ivory, 0.45), 5); }
    if (f.type === "mug") { const x = f.x*S, y = f.y*S; k.fill(poly([[x - 14*px, y - 30*px], [x + 14*px, y - 30*px], [x + 12*px, y], [x - 12*px, y]]), dust(P.ivory, 0.9, 2.4), 6); }
  }
  if (spec.scene.light?.type === "lamp") {
    const lx = spec.scene.light.x*S, ly = spec.scene.light.y*S;
    const shade = smooth([[lx - 0.07*S, ly], [lx - 0.04*S, ly - 0.06*S], [lx + 0.04*S, ly - 0.06*S], [lx + 0.07*S, ly], [lx + 0.07*S, ly]], true, 6);
    k.fill(shade, inkMat({mode: "solid", color: P.yellow, fillAlpha: 1, px}), 8);
    k.stroke(poly([[lx, ly - 0.06*S], [lx - 0.01*S, ly - 0.16*S], [lx + 0.04*S, ly - 0.2*S]]), 5*px, inkMat({mode: "solid", color: P.yellow, fillAlpha: 1, px}), 8);
    k.fill(poly([[lx - 0.065*S, ly + 2], [lx + 0.065*S, ly + 2], [lx + 0.32*S, S*0.98], [lx - 0.42*S, S*0.98]]), dust(P.yellow, 0.16, 3, {toneGrad: -0.2}), 2);
  }
  scene.add(k.group());
  const fig = spec.scene.figure;
  if (fig) {
    const ch = chars[fig.suspect], s = fig.scale*S/1024;
    const pk = buildPuppet(ch, fig.pose, style, {px: 1, dust: {color: P[fig.color] || fig.color, cell: fig.cell ?? 4.2, alpha: 1}, fade: [1e6, 1e6 + 1]});
    // fade in card space is applied after the group transform, so pass a card-space fade
    const g = pk.group(); const top = fig.top*S;
    g.scale.set(fig.mirror ? -s : s, s, 1); g.position.set(fig.x*S - (fig.mirror ? -512 : 512)*s, -top + 150*s, 0);
    g.traverse(o => { if (o.material?.uniforms) o.material.uniforms.uFade.value.set(top + (fig.fadeFrom ?? 1100)*s - 150*s, top + (fig.fadeTo ?? 1500)*s - 150*s); });
    scene.add(g);
  }
  return scene;
}

export async function renderCard(spec, chars, style) {
  const P = style.palette, [W, H] = style.card.size, ph = 448, S = ph*2;
  const r = getRenderer(S, S); r.render(memoryScene(spec, chars, style, S), orthoDesign(S, S));
  const photo = canvas(ph, ph); photo.getContext("2d").drawImage(r.domElement, 0, 0, ph, ph);
  const c = canvas(W, H), x = c.getContext("2d"), m = 32;
  const rr = (X, Y, w, h, rad) => { x.beginPath(); x.roundRect(X, Y, w, h, rad); };
  x.fillStyle = P.coral; x.globalAlpha = 0.12; rr(6, 6, W - 12, H - 12, 14); x.fill(); x.globalAlpha = 1;
  x.drawImage(photo, m, m);
  x.strokeStyle = P.coral; x.lineWidth = 5; rr(6, 6, W - 12, H - 12, 14); x.stroke();
  x.lineWidth = 2.5; x.strokeRect(m, m, ph, ph);
  // corner ticks on the photo, like a forensic print
  x.strokeStyle = P.ivory; x.lineWidth = 3; for (const [cx, cy, dx, dy] of [[m + 8, m + 8, 1, 1], [m + ph - 8, m + 8, -1, 1], [m + 8, m + ph - 8, 1, -1], [m + ph - 8, m + ph - 8, -1, -1]]) { x.beginPath(); x.moveTo(cx, cy + dy*18); x.lineTo(cx, cy); x.lineTo(cx + dx*18, cy); x.stroke(); }
  x.fillStyle = P.yellow; x.font = "700 30px 'Courier Prime'"; x.textAlign = "right"; x.fillText(spec.time, m + ph - 16, m + 40); x.textAlign = "left";
  x.fillStyle = P.ivory; x.font = style.card.captionFont;
  wrap(x, spec.caption, W - 2*m).slice(0, 3).forEach((l, i) => x.fillText(l, m, m + ph + 34 + i*28));
  x.fillStyle = P.coral; x.font = style.card.labelFont; x.fillText(`${spec.holder} · ${spec.holderLabel.toUpperCase()} REMEMBERS`, m, H - 20);
  return {png: c.toDataURL("image/png"), preview: previewPair(c, spec.evidence).toDataURL("image/png")};
}
