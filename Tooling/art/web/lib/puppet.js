// Parametric paper-theatre suspect: layered cut-outs (hair, head, torso, lapels, sleeves, hands, prop) drawn as
// "engraved light": high-key shaded skin, ivory hatching for cloth, bright contour, 100%-bright signature prop,
// hatching that crumbles to specks below the waist. Everything is derived from a character JSON + a pose JSON.
import {inkMat, smooth, poly, V, Canvas2D, Affine} from "./ink.js";

const DEF_POSE = {
  lean: 0, shoulderDrop: 0,
  head: {tilt: 0, dx: 0, dy: 0, turn: 0},
  face: {brow: 0, browRaise: 0, browRaiseR: null, eyes: 0.85, look: [0, 0], mouth: "soft", sweat: false, stress: false, blush: false},
  armL: {hand: [392, 1330], grip: "open"}, armR: {hand: [632, 1330], grip: "open"},
  prop: {}
};
const merge = (a, b) => { if (!b) return a; const o = Array.isArray(a) ? [...a] : {...a}; for (const k of Object.keys(b)) o[k] = b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && a && typeof a[k] === "object" ? merge(a[k], b[k]) : b[k]; return o; };

export function buildPuppet(spec, poseName, style, opt = {}) {
  const P = style.palette, S = style.portrait, px = opt.px ?? 1;
  const pose = merge(merge(DEF_POSE, spec.poseDefaults || {}), spec.poses[poseName] || {});
  const B = merge({shoulderW: 205, waistW: 150, hemW: 190, headW: 250, jawW: 170, chinW: 70, headTop: 268, chin: 684, neckW: 84, vY: 1000, armScale: 1}, spec.build);
  const fade = opt.fade ?? S.fade;
  const seed = (spec.seed ?? 7) + 0.1;
  const k = new Canvas2D();
  const dust = opt.dust;
  const dm = (role, extra = {}) => inkMat({mode: "dust", color: dust.color, tone: {skin: 0.8, cloth: 0.38, line: 0.95, hair: 0.55, prop: 1}[role] ?? 0.5, toneGrad: 0.3, lineAlpha: dust.alpha ?? 1, fillAlpha: 0, dust: dust.cell ?? 4.5, px, fade, seed, ...extra});
  const M = {
    skin: () => dust ? dm("skin") : inkMat({mode: "skin", color: P.ivory, shadow: P.skinShade, fillAlpha: S.skinAlpha, px, fade, seed}),
    cloth: (o = {}) => dust ? dm("cloth") : inkMat({mode: "hatch", color: o.color || P.ivory, lineAlpha: S.lineAlpha, fillAlpha: S.interiorFillAlpha, tone: o.tone ?? 0.35, toneGrad: o.toneGrad ?? 0.5, angle: o.angle ?? 70, cross: o.cross ?? 0, spacing: o.spacing ?? S.hatchSpacing, px, fade, seed: seed + (o.seedOff || 0)}),
    line: (c = P.ivory, a = 0.92) => dust ? dm("line") : inkMat({mode: "solid", color: c, fillAlpha: a, px, fade, seed}),
    cut: (a = 1) => dust ? dm("line", {tone: 0.0}) : inkMat({mode: "solid", color: P.cut, fillAlpha: a, px, fade, seed}),
    glow: (c, a = 1) => dust ? dm("prop") : inkMat({mode: "solid", color: c, fillAlpha: a, px, fade: [1e6, 1e6 + 1], seed}),
  };
  const glow = m => { if (m && !dust) m.layers.enable(1); return m; };
  const CW = S.contourPx, FW = S.featurePx;
  const outfit = spec.outfit || {}, hair = spec.hair || {}, face = spec.face || {}, F = pose.face, H = pose.head;

  // ---------- transforms ----------
  const Tt = Affine.rot(pose.lean, 512, 1500);
  const Th = Affine.rot(H.tilt, 512, 700).then(Affine.move(H.dx, H.dy)).then(Tt);
  const tq = (T, list) => T.ps(list);
  const tAng = Tt.angle(), hAng = Th.angle();

  // ---------- torso ----------
  const SW = B.shoulderW, WW = B.waistW, HW = B.hemW, sd = pose.shoulderDrop, shY = 790 + sd;
  const torso = [[512 - 46, 738], [512 - SW + 52, 760 + sd], [512 - SW, 812 + sd], [512 - SW, 812 + sd], [512 - SW + 12, 1010], [512 - WW, 1235], [512 - HW + (outfit.peplum ? -18 : 6), 1430], [512 - HW, 2000], [512 - HW, 2000],
    [512 + HW, 2000], [512 + HW, 2000], [512 + HW - (outfit.peplum ? -18 : 6), 1430], [512 + WW, 1235], [512 + SW - 12, 1010], [512 + SW, 812 + sd], [512 + SW, 812 + sd], [512 + SW - 52, 760 + sd], [512 + 46, 738]];
  const clothA = outfit.hatchAngle ?? 72;
  const tp = smooth(tq(Tt, torso), true, 8);
  k.fill(tp, M.cloth({tone: outfit.tone ?? 0.36, angle: clothA + tAng, cross: outfit.cross ?? 0, spacing: outfit.spacing}), 3);
  k.stroke(tp, CW, M.line(P.ivory, 0.9), 3.2, true);

  // neck
  const nw = B.neckW/2;
  const neck = smooth(tq(Th, [[512 - nw, 600], [512 - nw + 4, 700], [512 - nw - 6, 770], [512 + nw + 6, 770], [512 + nw - 4, 700], [512 + nw, 600]]), true, 6);
  k.fill(neck, M.skin(), 4);
  k.stroke(smooth(tq(Th, [[512 - nw + 2, 640], [512 - nw + 4, 700], [512 - nw - 4, 760]]), false, 6), FW*0.8, M.line(P.amber, 0.9), 4.1);
  k.stroke(smooth(tq(Th, [[512 + nw - 2, 640], [512 + nw - 4, 700], [512 + nw + 4, 760]]), false, 6), FW*0.8, M.line(P.amber, 0.9), 4.1);

  // neckline / shirt / lapels
  const vY = B.vY, lap = outfit.lapel || "notch";
  const V0 = tq(Tt, [[512 - 48, 738], [512 + 48, 738], [512 + 6, vY], [512 - 6, vY]]);
  if (outfit.neckline === "skin") k.fill(poly(V0), M.skin(), 5);
  else if (outfit.neckline !== "none") k.fill(poly(V0), M.cloth({tone: 0.32, angle: 90 + tAng, spacing: 6, toneGrad: 0.2, seedOff: 2}), 5);
  if (lap !== "none") {
    for (const s of [-1, 1]) {
      const X = x => 512 + s*(x - 512)*-1; // mirror helper: authored on viewer-left, s=-1 keeps, s=1 mirrors
      const pts = lap === "shawl"
        ? [[X(466), 736], [X(452), 734], [X(512 - SW*0.5), 770], [X(512 - SW*0.47), 850], [X(474), 925], [X(506), vY], [X(506), vY]]
        : lap === "peak"
          ? [[X(466), 736], [X(512 - SW*0.56), 772], [X(512 - SW*0.66), 860], [X(512 - SW*0.86), 848], [X(512 - SW*0.6), 912], [X(506), vY]]
          : [[X(466), 736], [X(512 - SW*0.56), 772], [X(512 - SW*0.6), 858], [X(512 - SW*0.75), 870], [X(512 - SW*0.56), 916], [X(506), vY]];
      const lp = lap === "shawl" ? smooth(tq(Tt, pts), true, 8) : poly(tq(Tt, pts));
      k.fill(lp, M.cloth({tone: (outfit.tone ?? 0.36)*0.75, angle: clothA - 55*s + tAng, spacing: (outfit.spacing ?? S.hatchSpacing)*0.9, seedOff: 3}), 6);
      k.stroke(lp, CW*0.85, M.line(P.ivory, 0.95), 6.1, true);
    }
  }
  if (outfit.collar === "open") for (const s of [-1, 1]) {
    const c = poly(tq(Tt, [[512 + s*20, 742], [512 + s*58, 728], [512 + s*80, 790], [512 + s*30, 800]]));
    k.fill(c, M.line(P.ivory, 0.75), 6.5); k.stroke(c, FW*0.8, M.line(P.ivory, 1), 6.6, true);
  }
  if (outfit.collar === "stand") for (const s of [-1, 1]) {
    const c = smooth(tq(Tt, [[512 + s*50, 700], [512 + s*86, 690], [512 + s*112, 770], [512 + s*60, 790], [512 + s*50, 760]]), true, 6);
    k.fill(c, M.cloth({tone: 0.3, angle: 20*s + tAng, seedOff: 5}), 6.5); k.stroke(c, CW*0.8, M.line(P.ivory, 0.95), 6.6, true);
  }
  if (outfit.tie === "bow") {
    const bw = tq(Tt, [[512, 756], [470, 736], [462, 764], [470, 790], [512, 770], [554, 790], [562, 764], [554, 736]]);
    k.fill(poly(bw), M.cloth({tone: 0.7, angle: 0 + tAng, spacing: 7, seedOff: 7}), 7); k.stroke(poly(bw), FW, M.line(P.ivory, 1), 7.1, true);
    k.circle(...Tt.p([512, 764]), 11, M.line(P.ivory, 1), 7.2);
  } else if (outfit.tie === "long") {
    const tie = tq(Tt, [[500, 750], [524, 750], [530, 790], [540, vY - 40], [512, vY + 10], [484, vY - 40], [494, 790]]);
    k.fill(poly(tie), M.cloth({tone: 0.6, angle: 45 + tAng, spacing: 8, seedOff: 7}), 5.5); k.stroke(poly(tie), FW*0.8, M.line(P.ivory, 1), 5.6, true);
  }
  // seam, buttons, belt, pocket
  k.stroke(poly(tq(Tt, [[512, vY], [512, 2000]])), FW*0.8, M.line(P.ivory, 0.85), 6);
  for (let i = 0; i < (outfit.buttons ?? 2); i++) { const b = Tt.p([526, vY + 50 + i*110]); k.circle(b[0], b[1], 9, M.line(P.ivory, 0.95), 6.2); }
  if (outfit.belt) k.stroke(smooth(tq(Tt, [[512 - WW + 6, 1228], [512, 1244], [512 + WW - 6, 1228]]), false, 8), 12, M.line(P.ivory, 0.9), 6.3);
  if (outfit.pocketSquare) { const ps = poly(tq(Tt, [[628, 900], [690, 900], [672, 862], [652, 874], [640, 858]])); k.fill(ps, M.line(P.ivory, 0.85), 6.4); k.stroke(poly(tq(Tt, [[612, 902], [706, 902]])), FW, M.line(P.ivory, 0.95), 6.5); }
  if (outfit.pearls) {
    const pr = smooth(tq(Tt, [[460, 748], [478, 820], [512, 850], [546, 820], [564, 748]]), false, 10);
    for (let i = 0; i <= 11; i++) { const p = pr[Math.round(i/11*(pr.length - 1))]; k.circle(p.x, -p.y, 10.5, M.line("#FFFFFF", 1), 5.8); }
  }

  // ---------- head ----------
  const hw = B.headW/2, jw = B.jawW/2, cw = B.chinW/2, top = B.headTop, chin = B.chin;
  const faceOutline = [[512, top], [512 + hw*0.72, top + 18], [512 + hw, top + 110], [512 + hw, top + 190], [512 + jw + 10, chin - 90], [512 + cw + 8, chin - 18], [512, chin], [512 - cw - 8, chin - 18], [512 - jw - 10, chin - 90], [512 - hw, top + 190], [512 - hw, top + 110], [512 - hw*0.72, top + 18]];
  const fo = smooth(tq(Th, faceOutline), true, 8);
  // hair back
  const hairTone = hair.tone ?? 0.62, hairCol = hair.color === "amber" ? P.amber : P.ivory;
  const hairMat = (o = {}) => M.cloth({color: hairCol, tone: hairTone, angle: (hair.angle ?? 105) + hAng, spacing: hair.spacing ?? 8, seedOff: 11, toneGrad: 0.6, ...o});
  const hairShapes = HAIR[hair.style || "slick_back"]({hw, top, chin});
  if (hairShapes.back) { const hb = smooth(tq(Th, hairShapes.back), true, 8); k.fill(hb, hairMat({tone: hairTone*0.85}), 2.5); k.stroke(hb, CW*0.8, M.line(hairCol, 0.9), 2.6, true); }
  // ears
  for (const s of [-1, 1]) {
    const e = smooth(tq(Th, [[512 + s*(hw - 6), 440], [512 + s*(hw + 20), 430], [512 + s*(hw + 26), 480], [512 + s*(hw + 12), 528], [512 + s*(hw - 6), 520]]), true, 6);
    k.fill(e, M.skin(), 9); k.stroke(e, FW*0.8, M.line(P.amber, 0.95), 9.1, true);
  }
  k.fill(fo, M.skin(), 10);
  k.stroke(fo, FW*0.9, M.line(P.amber, 0.95), 10.1, true);

  // features
  const t = H.turn || 0, fx = x => x + t*18, cut = M.cut;
  const eyeY = 458;
  for (const s of [-1, 1]) {
    const ex = fx(512 + s*62), w = 38, o = Math.max(0, Math.min(1.15, (s === 1 && F.eyesR != null) ? F.eyesR : F.eyes)), look = F.look || [0, 0];
    const raise = (s === 1 && F.browRaiseR != null) ? F.browRaiseR : F.browRaise;
    const by = eyeY - 50 - raise*16, inner = by - F.brow*16, outer = by + F.brow*5 - (face.browArch ?? 6);
    const brow = smooth(tq(Th, [[ex - s*36, inner + 2], [ex - s*6, Math.min(inner, outer) - (face.browArch ?? 6)], [ex + s*30, outer + 4], [ex + s*42, outer + 12]]), false, 8);
    k.stroke(brow, face.browW ?? 9, cut(), 20);
    if (o < 0.08) {
      k.stroke(smooth(tq(Th, [[ex - w, eyeY], [ex, eyeY + 10], [ex + w, eyeY]]), false, 8), FW, cut(), 20);
      if (face.lashes) k.stroke(poly(tq(Th, [[ex + s*w, eyeY], [ex + s*(w + 12), eyeY + 6]])), FW*0.7, cut(), 20);
      continue;
    }
    const up = smooth(tq(Th, [[ex - s*w, eyeY + 3], [ex - s*w*0.35, eyeY - 21*o - 3], [ex + s*w*0.45, eyeY - 20*o - 3], [ex + s*w, eyeY - 3]]), false, 8);
    const lo = smooth(tq(Th, [[ex - s*w*0.75, eyeY + 6], [ex, eyeY + 10*o + 6], [ex + s*w*0.85, eyeY + 1]]), false, 8);
    const ir = [ex + look[0]*13, eyeY - 3 + look[1]*6 + (1 - Math.min(1, o))*5];
    const irw = Th.p(ir);
    k.circle(irw[0], irw[1], 15, cut(), 17);
    const cl = Th.p([ir[0] - 5, ir[1] - 5]); k.circle(cl[0], cl[1], 4.5, M.line("#FFFFFF", 1), 19);
    if (o < 0.9) { // upper lid covers the iris top
      const lid = [...tq(Th, [[ex - s*w - 4, eyeY + 3], [ex - s*w*0.35, eyeY - 21*o - 3], [ex + s*w*0.45, eyeY - 20*o - 3], [ex + s*w + 4, eyeY - 3]]), ...tq(Th, [[ex + s*w + 4, eyeY - 40], [ex - s*w - 4, eyeY - 40]])];
      k.fill(smooth(lid, true, 6), M.skin(), 18);
    }
    k.stroke(up, FW + 2, cut(), 20);
    k.stroke(lo, FW*0.55, cut(0.85), 20);
    if (face.lashes) for (const j of [0, 1]) k.stroke(poly(tq(Th, [[ex + s*(w - 6 - j*12), eyeY - 6 - 14*o - j*4], [ex + s*(w + 6 - j*10), eyeY - 14 - 18*o - j*4]])), FW*0.6, cut(), 20);
    if (face.bags) k.stroke(smooth(tq(Th, [[ex - s*w*0.5, eyeY + 22], [ex, eyeY + 28], [ex + s*w*0.6, eyeY + 20]]), false, 6), FW*0.45, cut(0.6), 20);
  }
  // nose
  const nx = 512 + t*26, nl = face.noseLen ?? 1;
  k.stroke(smooth(tq(Th, [[nx + 4, 470], [nx - 6, 470 + 46*nl], [nx - 14, 478 + 60*nl], [nx + 2, 486 + 62*nl], [nx + 14, 482 + 60*nl]]), false, 8), FW*0.8, cut(), 20);
  // mouth (centre must stay at the jaw-shader window: x 440..584, y 512..676 @2x)
  const mx = 512 + t*16, my = 584, mw = face.mouthW ?? 44;
  const mouth = MOUTH[F.mouth] || MOUTH.soft;
  for (const seg of mouth(mx, my, mw)) {
    if (seg.fill) { const f = smooth(tq(Th, seg.fill), true, 8); k.fill(f, cut(), 20); }
    else k.stroke(smooth(tq(Th, seg.line), false, 8), seg.w ?? FW, cut(seg.a ?? 1), 20);
  }
  if (face.lips) k.stroke(smooth(tq(Th, [[mx - mw*0.45, my + 22], [mx, my + 27], [mx + mw*0.45, my + 22]]), false, 6), FW*0.55, cut(0.55), 20);
  if (face.mustache) { const m = smooth(tq(Th, [[mx - 50, my - 6], [mx - 22, my - 24], [mx, my - 18], [mx + 22, my - 24], [mx + 50, my - 6], [mx + 28, my - 12], [mx, my - 9], [mx - 28, my - 12]]), true, 6); k.fill(m, hairMat({tone: 0.75, angle: 90 + hAng}), 21); k.stroke(m, FW*0.6, M.line(hairCol, 0.9), 21.1, true); }
  if (face.stubble && !dust) { const st = smooth(tq(Th, [[512 - jw - 4, 560], [512 - cw, chin - 20], [512, chin - 4], [512 + cw, chin - 20], [512 + jw + 4, 560], [512 + 30, 640], [512 - 30, 640]]), true, 6); k.fill(st, inkMat({mode: "dust", color: P.cut, tone: 0.32, toneGrad: 0, lineAlpha: 0.55, fillAlpha: 0, dust: 7, px, fade, seed: seed + 4}), 19.5); }
  if (face.lines) for (const s of [-1, 1]) k.stroke(smooth(tq(Th, [[nx + s*34, 520], [nx + s*52, 566], [mx + s*(mw + 10), my + 18]]), false, 6), FW*0.5, cut(0.55), 20);
  if (face.mole) { const m = Th.p(face.mole); k.circle(m[0], m[1], 5, cut(), 20); }
  // hair front & hat
  if (hairShapes.front) { const hf = smooth(tq(Th, hairShapes.front), true, 8); k.fill(hf, hairMat(), 22); k.stroke(hf, CW*0.85, M.line(hairCol, 0.95), 22.1, true);
    for (const st of hairShapes.strands || []) k.stroke(smooth(tq(Th, st), false, 8), FW*0.75, M.line(hairCol, 0.95), 22.2); }
  if (hairShapes.bun) { const [bx, byy, br] = hairShapes.bun; const c = Th.p([bx, byy]); const m = k.circle(c[0], c[1], br, hairMat({angle: 30 + hAng}), 1.5); const ring = []; for (let i = 0; i <= 40; i++) { const a = i/40*Math.PI*2; ring.push(V(c[0] + Math.cos(a)*br, c[1] + Math.sin(a)*br)); } k.stroke(ring, CW*0.85, M.line(hairCol, 0.95), 1.6); k.stroke(smooth(tq(Th, [[bx - br*0.6, byy + 10], [bx - 10, byy - br*0.5], [bx + br*0.55, byy - 4], [bx + 4, byy + br*0.45]]), false, 6), FW*0.8, M.line(hairCol, 0.95), 1.7); }
  if (spec.hat) {
    const ht = HAT[spec.hat.style]({top});
    const brim = smooth(tq(Th, ht.brim), true, 8), crown = smooth(tq(Th, ht.crown), true, 8), band = smooth(tq(Th, ht.band), true, 6);
    k.fill(crown, M.cloth({tone: spec.hat.tone ?? 0.5, angle: 100 + hAng, spacing: 9, seedOff: 13}), 24); k.stroke(crown, CW*0.85, M.line(P.ivory, 0.95), 24.1, true);
    k.fill(band, M.line(P.amber, 0.85), 24.2);
    k.fill(brim, M.cloth({tone: (spec.hat.tone ?? 0.5)*0.8, angle: 10 + hAng, spacing: 9, seedOff: 14}), 25); k.stroke(brim, CW*0.85, M.line(P.ivory, 0.95), 25.1, true);
  }
  if (F.sweat) { const d = smooth(tq(Th, [[652, 360], [644, 392], [652, 404], [662, 392]]), true, 8); k.fill(d, M.line("#FFFFFF", 0.95), 26); }
  if (F.stress) for (const [a, b] of [[[700, 300], [736, 270]], [[716, 352], [760, 342]], [[690, 250], [708, 214]]]) k.stroke(poly(tq(Th, [a, b])), FW, M.line(P.ivory, 1), 26);
  if (F.blush) for (const s of [-1, 1]) for (let j = 0; j < 3; j++) k.stroke(poly(tq(Th, [[512 + s*(70 + j*12), 528], [512 + s*(62 + j*12), 544]])), FW*0.5, inkMat({mode: "solid", color: "#E9895A", fillAlpha: 0.9, px, fade, seed}), 20);

  // ---------- props on the head ----------
  if (spec.prop?.type === "glasses") {
    const glare = pose.prop.glare;
    for (const s of [-1, 1]) {
      const ex = fx(512 + s*62), r = [[ex - 44, 436], [ex, 428], [ex + 44, 436], [ex + 46, 466], [ex + 30, 494], [ex, 498], [ex - 30, 494], [ex - 46, 466]];
      const g = smooth(tq(Th, r), true, 6);
      if (glare) glow(k.fill(g, M.glow("#FFFFFF", 0.97), 27));
      glow(k.stroke(g, FW + 1, M.glow("#FFFFFF", 1), 27.5, true));
    }
    k.stroke(smooth(tq(Th, [[fx(512 - 16), 446], [fx(512), 438], [fx(512 + 16), 446]]), false, 6), FW, M.glow("#FFFFFF", 1), 27.5);
    for (const s of [-1, 1]) k.stroke(poly(tq(Th, [[fx(512 + s*108), 444], [512 + s*(hw + 6), 452]])), FW, M.glow("#FFFFFF", 1), 27.5);
  }

  // ---------- arms & hands ----------
  const shL = Tt.p([512 - SW + 34, shY + 18]), shR = Tt.p([512 + SW - 34, shY + 18]);
  const ua = 300*B.armScale, fa = 268*B.armScale;
  for (const side of ["L", "R"]) {
    const arm = pose["arm" + side], s = side === "L" ? -1 : 1, sh = side === "L" ? shL : shR;
    const z0 = arm.z ?? (side === "L" ? 30 : 32);
    const zu = arm.upperZ ?? 2.8; // paper-theatre: upper arm sits behind the torso flat unless the pose brings it forward
    if (arm.hidden === "all") continue;
    if (arm.hidden === "behind") { // hand behind the back: upper arm runs down the side, forearm hidden behind the torso flat
      const el = [sh[0] + s*6, sh[1] + ua*0.92]; limb(k, sh, el, 90, 76, zu, M, clothA, s, outfit, CW); continue; }
    const [el, wr] = ik(sh, arm.hand, ua, fa*(arm.foreScale ?? 1), s, arm.bend);
    limb(k, sh, el, 90, 80, zu, M, clothA, s, outfit, CW);
    limb(k, el, wr, 80, 64, z0 + 1, M, clothA, s, outfit, CW);
    if (arm.hidden === "pocket") { const d = norm(sub(wr, el)), n = [-d[1], d[0]]; k.stroke(poly([add(wr, mul(n, 46)), add(wr, mul(n, -46))]), CW, M.line(P.ivory, 0.95), z0 + 1.5); continue; }
    if (outfit.cuffs) { const d = norm(sub(wr, el)), n = [-d[1], d[0]], c = add(wr, mul(d, -14)); k.stroke(poly([add(c, mul(n, 34)), add(c, mul(n, -34))]), 12, M.line(P.ivory, 0.95), z0 + 1.5); }
    const gloved = spec.prop?.type === "gloves";
    hand(k, wr, norm(sub(wr, el)), s*(arm.thumb ?? 1), arm.grip, gloved ? M.glow("#FFFFFF", 1) : M.skin(), gloved, z0 + 2, M, P, FW, glow);
    if (spec.prop?.type === "lighter" && side === (spec.prop.hand || "R") && arm.grip !== "none" && pose.prop.lighter !== false) lighter(k, wr, norm(sub(wr, el)), pose.prop.flame, z0 + 3, M, P, glow, FW);
  }
  // ---------- brooch ----------
  if (spec.prop?.type === "brooch") {
    const [bx, by] = Tt.p(S.anchors2x.brooch);
    const ring = []; for (let i = 0; i < 48; i++) { const a = i/48*Math.PI*2; ring.push(V(bx + Math.cos(a)*24, by + Math.sin(a)*30)); }
    glow(k.fill(ring, M.glow(P.brass, 0.95), 28)); glow(k.stroke(ring, FW, M.glow("#FFFFFF", 1), 28.2, true));
    glow(k.circle(bx, by, 11, M.glow("#FFFFFF", 1), 28.3));
    const star = pose.prop.flare ?? 0.35, L = 26 + 70*star;
    for (const [dx, dy, l] of [[1, 0, L], [0, 1, L], [-1, 0, L], [0, -1, L], [0.7, 0.7, L*0.35], [-0.7, 0.7, L*0.35], [0.7, -0.7, L*0.35], [-0.7, -0.7, L*0.35]]) {
      glow(k.fill([V(bx + dx*l, by + dy*l), V(bx - dy*4, by + dx*4), V(bx + dy*4, by - dx*4)], M.glow("#FFFFFF", 1), 28.4));
    }
  }
  return k;
}

// ---------- helpers ----------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, s) => [a[0]*s, a[1]*s];
const len = a => Math.hypot(a[0], a[1]), norm = a => { const l = len(a) || 1; return [a[0]/l, a[1]/l]; };
function ik(S, T, a, b, s, bend) {
  let d = sub(T, S), L = Math.min(Math.max(len(d), Math.abs(a - b) + 2), a + b - 2); const u = norm(d);
  const cosA = (a*a + L*L - b*b)/(2*a*L), A = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const cands = [-1, 1].map(sg => { const c = Math.cos(A*sg), sn = Math.sin(A*sg); return add(S, mul([u[0]*c - u[1]*sn, u[0]*sn + u[1]*c], a)); });
  const out = bend === "in" ? -1 : 1; // prefer elbow away from body centre ("down" = lowest elbow)
  const e = bend === "down" ? cands.sort((p, q) => q[1] - p[1])[0] : cands.sort((p, q) => out*(Math.abs(q[0] - 512) - Math.abs(p[0] - 512)))[0];
  return [e, add(S, mul(u, L))];
}
function limb(k, A, B, wa, wb, z, M, clothA, s, outfit, CW) {
  const d = norm(sub(B, A)), n = [-d[1], d[0]];
  const cap = []; for (let i = 0; i <= 12; i++) { const a = i/12*Math.PI; cap.push(add(B, add(mul(n, Math.cos(a)*wb/2), mul(d, Math.sin(a)*wb/2*0.6)))); }
  const capA = []; for (let i = 0; i <= 12; i++) { const a = i/12*Math.PI; capA.push(add(A, add(mul(n, -Math.cos(a)*wa/2), mul(d, -Math.sin(a)*wa/2*0.6)))); }
  const outline = [...cap, ...capA].map(p => V(p[0], p[1]));
  const ang = Math.atan2(d[1], d[0])*180/Math.PI;
  k.fill(outline, M.cloth({tone: (outfit.tone ?? 0.36)*0.85, angle: ang + 14*s, spacing: outfit.spacing, seedOff: z}), z);
  k.stroke(outline, CW*0.85, M.line(undefined, 0.92), z + 0.1, true);
}
function hand(k, W, d, s, grip = "open", mat, gloved, z, M, P, FW, glow) {
  const n = [-d[1]*s, d[0]*s];
  const L = grip === "fist" ? 62 : 92, wdt = 36;
  const at = (al, ac) => add(W, add(mul(d, al), mul(n, ac)));
  const shapeA = grip === "fist"
    ? [[-6, -wdt], [30, -wdt - 4], [L, -wdt + 6], [L + 10, 0], [L, wdt - 2], [30, wdt + 4], [-6, wdt]]
    : [[-6, -wdt + 2], [40, -wdt - 2], [L - 6, -wdt + 4], [L + 8, -14], [L + 10, 4], [L, wdt - 8], [62, wdt - 2], [56, wdt + 10], [44, wdt + 26], [30, wdt + 22], [26, wdt + 4], [-6, wdt - 2]];
  const pts = shapeA.map(([a, c]) => at(a, c));
  const ol = smooth(pts, true, 6);
  const m = k.fill(ol, mat, z); if (gloved) glow(m);
  k.stroke(ol, FW*0.9, gloved ? M.cut(0.9) : M.line(P.amber, 0.95), z + 0.1, true);
  for (const c of grip === "fist" ? [-14, 2, 18] : [-16, -2, 12]) k.stroke([at(grip === "fist" ? L - 18 : L - 30, c), at(grip === "fist" ? L + 2 : L + 2, c*0.8)].map(p => V(p[0], p[1])), FW*0.55, M.cut(0.8), z + 0.2);
  if (gloved) k.stroke([at(8, -wdt + 2), at(8, wdt - 2)].map(p => V(p[0], p[1])), FW*0.8, M.cut(0.9), z + 0.2);
}
function lighter(k, W, d, flame, z, M, P, glow, FW) {
  const n = [-d[1], d[0]], c = add(W, mul(d, 62));
  const body = [[-14, -20], [14, -20], [14, 22], [-14, 22]].map(([x, y]) => add(c, [x, y]));
  glow(k.fill(body.map(p => V(p[0], p[1])), M.glow(P.brass, 1), z)); k.stroke(body.map(p => V(p[0], p[1])), FW*0.6, M.glow("#FFFFFF", 1), z + 0.1, true);
  if (flame) { const f = smooth([[c[0], c[1] - 24], [c[0] - 12, c[1] - 46], [c[0] - 2, c[1] - 84], [c[0] + 12, c[1] - 48]], true, 8); glow(k.fill(f, M.glow(P.yellow, 1), z + 0.3)); glow(k.fill(smooth([[c[0], c[1] - 28], [c[0] - 5, c[1] - 44], [c[0], c[1] - 62], [c[0] + 5, c[1] - 44]], true, 6), M.glow("#FFFFFF", 1), z + 0.4)); }
}
const MOUTH = {
  soft: (x, y, w) => [{line: [[x - w, y - 2], [x, y + 6], [x + w, y - 3]]}],
  smile: (x, y, w) => [{line: [[x - w, y - 8], [x - w*0.4, y + 6], [x + w*0.4, y + 6], [x + w, y - 8]]}, {line: [[x - w - 6, y - 12], [x - w + 2, y - 4]], w: 4}],
  flat: (x, y, w) => [{line: [[x - w*0.9, y + 1], [x, y + 3], [x + w*0.9, y + 1]]}],
  tight: (x, y, w) => [{line: [[x - w*0.62, y + 2], [x, y], [x + w*0.62, y + 2]], w: 7}, {line: [[x - w*0.66, y - 6], [x - w*0.7, y + 8]], w: 3.5}, {line: [[x + w*0.66, y - 6], [x + w*0.7, y + 8]], w: 3.5}],
  frown: (x, y, w) => [{line: [[x - w, y + 10], [x - w*0.4, y - 2], [x + w*0.4, y - 2], [x + w, y + 10]]}],
  smirk: (x, y, w) => [{line: [[x - w*0.8, y + 3], [x, y + 4], [x + w*0.7, y - 4], [x + w*1.05, y - 14]]}, {line: [[x + w*1.02, y - 18], [x + w*1.12, y - 8]], w: 4}],
  open_small: (x, y, w) => [{fill: [[x - w*0.5, y - 2], [x, y - 7], [x + w*0.5, y - 2], [x + w*0.3, y + 12], [x, y + 15], [x - w*0.3, y + 12]]}],
  open: (x, y, w) => [{fill: [[x - w*0.75, y - 4], [x, y - 10], [x + w*0.75, y - 4], [x + w*0.45, y + 20], [x, y + 26], [x - w*0.45, y + 20]]}],
  gasp: (x, y, w) => [{fill: [[x - w*0.4, y - 6], [x, y - 12], [x + w*0.4, y - 6], [x + w*0.36, y + 18], [x, y + 26], [x - w*0.36, y + 18]]}],
  quiver: (x, y, w) => [{line: [[x - w*0.9, y + 8], [x - w*0.5, y + 2], [x - w*0.15, y + 6], [x + w*0.2, y + 1], [x + w*0.55, y + 6], [x + w*0.9, y + 10]], w: 6}],
};
const HAIR = {
  waves_updo: () => ({
    back: [[372, 600], [346, 470], [352, 350], [392, 262], [470, 212], [560, 208], [640, 240], [684, 330], [690, 460], [664, 600], [624, 640], [600, 600], [606, 560], [420, 560], [426, 600], [404, 640]],
    front: [[384, 450], [372, 360], [398, 290], [452, 248], [530, 236], [604, 252], [644, 300], [656, 370], [648, 450], [632, 452], [624, 380], [600, 336], [560, 352], [520, 326], [476, 346], [436, 332], [408, 372], [398, 452]],
    strands: [[[404, 300], [452, 276], [520, 268], [588, 290]], [[420, 320], [470, 300], [530, 300]], [[600, 270], [636, 320], [642, 400]], [[392, 360], [386, 420]]],
  }),
  bun: () => ({
    back: [[378, 500], [372, 380], [404, 290], [470, 256], [556, 256], [622, 290], [652, 380], [646, 500]],
    front: [[386, 446], [380, 360], [410, 295], [470, 262], [512, 258], [556, 262], [612, 292], [642, 360], [640, 446], [626, 410], [608, 336], [560, 306], [516, 300], [464, 304], [420, 336], [402, 410]],
    strands: [[[512, 262], [474, 290], [430, 340]], [[512, 262], [552, 290], [598, 336]]],
    bun: [512, 214, 64],
  }),
  slick_back: () => ({
    back: [[380, 470], [376, 360], [406, 280], [470, 244], [556, 242], [624, 276], [650, 360], [646, 470]],
    front: [[386, 432], [382, 350], [410, 288], [470, 250], [544, 246], [612, 270], [642, 336], [644, 424], [628, 392], [604, 330], [540, 306], [462, 314], [424, 346], [404, 400]],
    strands: [[[462, 312], [496, 270], [560, 254], [612, 272]], [[440, 330], [470, 288], [520, 266]], [[540, 306], [590, 294], [628, 330]]],
  }),
  short_crop: () => ({
    back: [[380, 470], [378, 360], [408, 286], [470, 252], [556, 250], [622, 284], [648, 360], [644, 470]],
    front: [[386, 440], [384, 352], [414, 294], [470, 262], [544, 258], [606, 284], [638, 344], [640, 432], [624, 400], [602, 344], [570, 330], [552, 350], [520, 326], [480, 344], [448, 330], [420, 360], [404, 410]],
    strands: [[[470, 300], [500, 280]], [[560, 300], [590, 296]]],
  }),
};
const HAT = {
  fedora: () => ({
    crown: [[402, 330], [404, 268], [420, 210], [470, 184], [512, 200], [556, 184], [606, 210], [622, 268], [624, 330]],
    band: [[404, 300], [622, 300], [624, 334], [402, 334]],
    brim: [[318, 352], [380, 322], [512, 316], [650, 322], [712, 344], [704, 362], [646, 352], [512, 350], [380, 356], [326, 370]],
  }),
};
