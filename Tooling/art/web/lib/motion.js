// Frame-deterministic motion graphics. motionFrame(f) renders frame f of the clip described by a motion spec;
// every element is a pure function of t, so any frame can be re-rendered in isolation.
import * as THREE from "three";
import {SVGLoader} from "three/addons/loaders/SVGLoader.js";
import {inkMat, V, smooth, seeded} from "./ink.js";
import {buildPuppet} from "./puppet.js";
import {getRenderer, canvas, orthoDesign, renderWithGlow} from "./gl.js";

let st = null;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a)/(b - a));
const easeOut = x => 1 - Math.pow(1 - x, 3), easeIn = x => x*x*x;
const backOut = (x, s = 2.2) => 1 + (s + 1)*Math.pow(x - 1, 3) + s*Math.pow(x - 1, 2);

function mat(color, a = 1) { const m = inkMat({mode: "solid", color, fillAlpha: a}); m.depthTest = false; m.depthWrite = false; return m; }
function strokeMesh(points, width, m, order, glow = false) {
  const g = SVGLoader.pointsToStroke(points, SVGLoader.getStrokeStyle(width, "#fff", "round", "round", 4), 6, 0.01);
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = order; if (glow) mesh.layers.enable(1); return mesh;
}
function textTexture(text, font, fill, stroke, strokeW, w, h, glowCol) {
  const c = canvas(w, h), x = c.getContext("2d"); x.font = font; x.textAlign = "center"; x.textBaseline = "middle";
  x.lineJoin = "round"; x.strokeStyle = stroke; x.lineWidth = strokeW; x.strokeText(text, w/2, h/2 + 6);
  x.lineWidth = strokeW*0.45; x.strokeStyle = glowCol || stroke; x.fillStyle = fill; x.fillText(text, w/2, h/2 + 6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.premultiplyAlpha = false; return t;
}
function dissolvePlane(tex, w, h, order) {
  const m = new THREE.ShaderMaterial({transparent: true, depthTest: false, depthWrite: false,
    uniforms: {map: {value: tex}, uAlpha: {value: 1}, uDissolve: {value: 0}, uCell: {value: 7}},
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: `uniform sampler2D map; uniform float uAlpha, uDissolve, uCell; varying vec2 vUv;
      float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
      void main(){ vec4 c = texture2D(map, vUv); float a = c.a*uAlpha;
        if (uDissolve > 0.0) { vec2 g = gl_FragCoord.xy/uCell; float h = hash(floor(g)); float dotm = 1.0 - smoothstep(0.25, 0.45, length(fract(g) - 0.5));
          a *= mix(1.0, dotm, smoothstep(0.0, 0.2, uDissolve))*step(uDissolve, h); }
        if (a < 0.004) discard; gl_FragColor = vec4(c.rgb, a); }`,
    blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor});
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); mesh.renderOrder = order; return mesh;
}

export async function motionInit(spec, style, chars) {
  const P = style.palette, W = spec.width, H = spec.height, rnd = seeded(spec.seed || 1041);
  const scene = new THREE.Scene(), root = new THREE.Group(); scene.add(root);
  st = {spec, style, scene, root, W, H, cam: orthoDesign(W, H), P, items: {}};
  if (spec.type === "objection") initObjection(st, rnd, chars);
  if (spec.type === "title") initTitle(st, rnd, chars);
}
export function motionFrame(f) {
  const t = f/st.spec.fps;
  (st.spec.type === "objection" ? frameObjection : frameTitle)(st, t);
  const out = renderWithGlow(st.scene, st.cam, st.W, st.H, 12, 0.9);
  return out.toDataURL("image/png");
}

// ---------------- OBJECTION! slam (storyboard 4.2) ----------------
function initObjection(s, rnd) {
  const {P, W, H, root} = s, it = s.items;
  it.rain = []; for (let i = 0; i < 90; i++) { const x = rnd()*W, y = rnd()*H, l = 30 + rnd()*60; const m = strokeMesh([V(0, 0), V(-4, l)], 2.2, mat(P.cyan, 0.32 + rnd()*0.25), 1); m.userData = {x, y, v: 900 + rnd()*500}; root.add(m); it.rain.push(m); }
  // claim (cyan, dashed) and truth (coral, solid) paths across the floor of the frame
  const path = k => smooth([[-40, 900 + k], [420, 860 + k*1.4], [960, 905 + k], [1500, 850 + k*1.2], [1960, 890 + k]], false, 30);
  it.coral = strokeMesh(path(0), 7, mat(P.coral, 0.75), 3, true); root.add(it.coral);
  const cy = path(-34); it.dashes = [];
  for (let i = 0; i + 6 < cy.length; i += 11) { const pts = cy.slice(i, i + 7); const cx = pts[3].x, cyy = pts[3].y; const g = strokeMesh(pts.map(p => new THREE.Vector2(p.x - cx, p.y - cyy)), 6, mat(P.cyan, 0.9), 4); g.position.set(cx, cyy, 0); g.userData = {cx, cy: cyy, r: rnd()}; root.add(g); it.dashes.push(g); }
  // the word
  const tex = textTexture("OBJECTION!", "300px Anton", "#FFFFFF", P.yellow, 34, 1600, 420);
  it.word = dissolvePlane(tex, 1600, 420, 20); it.word.layers.enable(1); root.add(it.word);
  it.trails = [0, 1, 2].map(i => { const m = dissolvePlane(tex, 1600, 420, 19 - i); root.add(m); return m; });
  // chevron bands
  it.bands = [-1, 1].map(sg => { const g = new THREE.Group(); for (let i = 0; i < 26; i++) { const x = i*92; const ch = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([V(x, 0), V(x + 40, 0), V(x + 70, 22), V(x + 40, 44), V(x, 44), V(x + 30, 22)])), mat(P.yellow, 0.95)); ch.renderOrder = 15; g.add(ch); } g.userData.sg = sg; root.add(g); return g; });
  // shockwave ring + shards
  it.ring = new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 96), mat(P.yellow, 1)); it.ring.renderOrder = 18; it.ring.layers.enable(1); root.add(it.ring);
  { const c = canvas(256, 256), x = c.getContext("2d"), g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, "rgba(255,246,208,1)"); g.addColorStop(0.35, "rgba(255,214,10,0.45)"); g.addColorStop(1, "rgba(255,214,10,0)"); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.NoColorSpace; it.flash = dissolvePlane(tx, 2, 2, 2); root.add(it.flash); }
  it.shards = []; for (let i = 0; i < 46; i++) {
    const a = rnd()*Math.PI*2, sz = 14 + rnd()*34, sh = new THREE.Shape([V(0, -sz), V(sz*0.5, sz*0.6), V(-sz*0.6, sz*0.3)]);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), mat(rnd() < 0.35 ? "#FFFFFF" : P.yellow, 1)); m.renderOrder = 21; m.layers.enable(1);
    const ex = Math.cos(a)*(560 + rnd()*120), ey = Math.sin(a)*(150 + rnd()*60);
    m.userData = {x0: 960 + ex, y0: 470 + ey, vx: Math.cos(a)*(700 + rnd()*900), vy: Math.sin(a)*(500 + rnd()*700) - 250, spin: (rnd() - 0.5)*14};
    root.add(m); it.shards.push(m);
  }
}
function frameObjection(s, t) {
  const {it} = {it: s.items}, W = s.W, H = s.H;
  const T0 = 0.6, TI = 0.72; // slam start / impact
  const frozen = t > 0.45 && t < 3.35, rainT = t < 0.45 ? t : t < 3.35 ? 0.45 : 0.45 + (t - 3.35);
  for (const r of it.rain) { const u = r.userData; r.position.set(u.x, -((u.y + u.v*rainT)%(H + 120)) + 60, 0); r.material.uniforms.uFillAlpha.value = (frozen ? 0.55 : 0.4)*(1 - seg(t, 3.6, 4.0)*0.6); }
  // impact shake: three frames
  const sh = t >= TI && t < TI + 0.1 ? [[18, -10], [-14, 12], [8, -6]][Math.min(2, Math.floor((t - TI)*30))] : [0, 0];
  s.root.position.set(sh[0], -sh[1], 0);
  // word slam
  const w = it.word, wy = -470;
  const k = t < T0 ? 0 : t < TI ? easeIn(seg(t, T0, TI)) : 1;
  const sc = t < TI ? 2.6 - 1.66*k : 0.94 + 0.06*backOut(seg(t, TI, TI + 0.25)) + 0.008*Math.sin((t - TI)*5);
  w.visible = t >= T0; w.scale.setScalar(sc*0.82); w.rotation.z = (t < TI ? -9 + 5*k : -4)*Math.PI/180; w.position.set(960, wy, 0);
  w.material.uniforms.uAlpha.value = t < TI ? 0.25 + 0.75*k : 1;
  w.material.uniforms.uDissolve.value = seg(t, 3.35, 3.95); w.position.y = wy + 60*easeIn(seg(t, 3.35, 3.95));
  it.trails.forEach((m, i) => { const on = t >= T0 && t < TI + 0.06; m.visible = on; m.scale.setScalar((sc + 0.22*(i + 1)*(1 - k*0.6))*0.82); m.rotation.z = w.rotation.z; m.position.set(960, wy, 0); m.material.uniforms.uAlpha.value = 0.22/(i + 1); });
  // flash + ring
  const ft = seg(t, TI, TI + 0.18); it.flash.visible = t >= TI && ft < 1; it.flash.scale.setScalar(260 + 900*easeOut(ft)); it.flash.position.set(960, wy, 0); it.flash.material.uniforms.uAlpha.value = 0.8*(1 - ft);
  const rt = seg(t, TI, TI + 0.55); it.ring.visible = t >= TI && rt < 1; it.ring.scale.setScalar(240 + 1100*easeOut(rt)); it.ring.position.set(960, wy, 0); it.ring.material.uniforms.uFillAlpha.value = 1 - rt;
  // chevrons
  it.bands.forEach(b => { const sg = b.userData.sg, inn = easeOut(seg(t, TI, TI + 0.22)), out = easeIn(seg(t, 3.2, 3.5)); b.position.set(sg*(-W*(1 - inn)) + sg*W*out - 40, wy + sg*200 + 22, 0); b.visible = t >= TI; });
  // shards
  for (const m of it.shards) { const u = m.userData, d = Math.max(0, t - TI), tt = d*(1 - Math.min(0.6, d*0.25)); m.visible = t >= TI && d < 1.6; m.position.set(u.x0 + u.vx*tt, -(u.y0 + u.vy*tt + 380*d*d), 0); m.rotation.z = u.spin*d; m.material.uniforms.uFillAlpha.value = 1 - seg(d, 0.8, 1.6); }
  // the cyan claim tears away from the coral truth
  const tr = easeOut(seg(t, 1.05, 2.3));
  for (const d of it.dashes) { const u = d.userData, side = u.cx < 960 ? -1 : 1, near = 1 - Math.min(1, Math.abs(u.cx - 960)/960);
    d.position.set(u.cx + side*tr*(120 + 260*near), u.cy - tr*(60 + 220*near*u.r), 0); d.rotation.z = side*tr*(0.3 + 0.9*u.r)*near;
    d.material.uniforms.uFillAlpha.value = 0.9*(1 - seg(t, 1.6 + u.r*0.5, 2.6 + u.r*0.4)); }
  it.coral.material.uniforms.uFillAlpha.value = 0.75 + 0.25*seg(t, 1.2, 1.8);
  it.coral.scale.y = 1;
}

// ---------------- Title card ----------------
function initTitle(s, rnd, chars) {
  const {P, root, W, H} = s, it = s.items;
  it.title = dissolvePlane(textTexture("ROOMSCRIPT", "220px 'Alfa Slab One'", P.ivory, P.brass, 10, 1700, 330), 1700, 330, 10); it.title.layers.enable(1); root.add(it.title);
  it.sub = dissolvePlane(textTexture("A MURDER IN YOUR ROOM", "700 54px 'Courier Prime'", P.ivory, P.ivory, 1, 1400, 90), 1400, 90, 11); root.add(it.sub);
  it.case = dissolvePlane(textTexture("CASE HARLOW / 1041", "700 40px 'Courier Prime'", P.yellow, P.yellow, 1, 900, 70), 900, 70, 11); root.add(it.case);
  it.motes = []; for (let i = 0; i < 160; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(1.6 + rnd()*2.2, 8), mat(rnd() < 0.15 ? P.amber : P.ivory, 0.3 + rnd()*0.5)); m.userData = {x: rnd()*W, y: rnd()*H, vx: (rnd() - 0.5)*14, vy: -6 - rnd()*14, ph: rnd()*6}; m.renderOrder = 1; root.add(m); it.motes.push(m); }
  it.rule = strokeMesh([V(560, 0), V(1360, 0)], 4, mat(P.brass, 1), 9, true); root.add(it.rule);
}
function frameTitle(s, t) {
  const it = s.items;
  for (const m of it.motes) { const u = m.userData; m.position.set(u.x + u.vx*t, -(u.y + u.vy*t), 0); m.material.uniforms.uFillAlpha.value = 0.25 + 0.25*Math.sin(t*1.3 + u.ph); }
  const a = seg(t, 0.4, 1.6);
  it.title.position.set(960, -470, 0); it.title.material.uniforms.uDissolve.value = 1 - easeOut(a); it.title.scale.setScalar(1.06 - 0.06*easeOut(seg(t, 0.4, 3.2)));
  it.rule.position.set(0, -610, 0); it.rule.scale.x = 1; it.rule.visible = t > 1.2; it.rule.material.uniforms.uFillAlpha.value = seg(t, 1.2, 1.6);
  it.sub.position.set(960, -670, 0); it.sub.material.uniforms.uAlpha.value = seg(t, 1.6, 2.2);
  it.case.position.set(960, -760, 0); it.case.material.uniforms.uAlpha.value = seg(t, 2.2, 2.6);
  const out = seg(t, s.spec.seconds - 0.7, s.spec.seconds);
  for (const m of [it.title, it.sub, it.case]) if (out > 0) m.material.uniforms.uDissolve.value = Math.max(m.material.uniforms.uDissolve.value, out);
}
