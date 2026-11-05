// Shared "engraved light" rendering primitives: one ShaderMaterial with four modes and 2D geometry helpers.
// Design space is y-down pixels (1024x2048 for portraits); Three space is y-up, so V(x,y) = (x,-y).
import * as THREE from "three";
import {SVGLoader} from "three/addons/loaders/SVGLoader.js";
THREE.ColorManagement.enabled = false; // palette hex values are authored display (sRGB) values, written straight to PNG

export const V = (x, y) => new THREE.Vector2(x, -y);
export const col = hex => new THREE.Color(hex);

const vert = `
varying vec2 vLocal; varying vec2 vWorld;
void main(){ vLocal = position.xy; vec4 w = modelMatrix*vec4(position,1.0); vWorld = w.xy; gl_Position = projectionMatrix*viewMatrix*w; }`;
const frag = `
uniform float uMode, uLineAlpha, uFillAlpha, uTone, uToneGrad, uSpacing, uAngle, uCross, uSeed, uPx, uDust, uSpeck;
uniform vec3 uColor, uShadow; uniform vec2 uFade, uLight, uCenter, uSize;
varying vec2 vLocal; varying vec2 vWorld;
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float lines(vec2 q, float ang, float sp, float tone, float wobble){
  float c = cos(ang), s = sin(ang);
  vec2 p = vec2(c*q.x + s*q.y, -s*q.x + c*q.y);
  float wob = sin(p.x*0.011/uPx + uSeed)*sp*wobble;
  float d = abs(fract((p.y + wob)/sp) - 0.5)*sp;
  float hw = tone*sp*0.5;
  float aa = 0.6*uPx;
  return 1.0 - smoothstep(hw - aa, hw + aa, d);
}
void main(){
  float ydown = -vWorld.y;
  float fade = smoothstep(uFade.x, uFade.y, ydown);
  float mask = 1.0;
  if (fade > 0.0) {
    vec2 g = gl_FragCoord.xy/(uSpeck*uPx); vec2 ci = floor(g);
    float h = hash(ci + uSeed*0.37);
    float dotm = 1.0 - smoothstep(0.22, 0.42, length(fract(g) - 0.5));
    mask = mix(1.0, dotm*step(fade, h*0.98), smoothstep(0.0, 0.18, fade));
  }
  vec2 rel = (vLocal - uCenter)/max(uSize, vec2(1.0));
  float shade = clamp(dot(rel, uLight)*0.5 + 0.5, 0.0, 1.0);
  vec3 c = uColor; float a = uFillAlpha;
  if (uMode < 0.5) {
    a = uFillAlpha;
  } else if (uMode < 1.5) {
    float tone = clamp(uTone + uToneGrad*(shade - 0.5), 0.06, 0.92);
    float cov = lines(vWorld, uAngle, uSpacing*uPx, tone, 0.28);
    if (uCross > 0.0 && tone > uCross) cov = max(cov, lines(vWorld, uAngle + 1.1, uSpacing*uPx*1.15, (tone - uCross)*1.4, 0.2));
    a = max(uFillAlpha*(1.0 - smoothstep(0.0, 0.3, fade)), cov*uLineAlpha);
  } else if (uMode < 2.5) {
    c = mix(uColor, uShadow, smoothstep(0.42, 1.0, shade)*0.9);
    a = uFillAlpha;
  } else {
    vec2 g = gl_FragCoord.xy/(uDust*uPx); vec2 ci = floor(g);
    float hh = hash(ci + uSeed);
    vec2 off = vec2(hash(ci + 3.1), hash(ci + 7.7))*0.5 + 0.25;
    float dens = clamp(uTone + uToneGrad*(shade - 0.5), 0.0, 1.0);
    a = step(hh, dens)*(1.0 - smoothstep(0.14, 0.26, length(fract(g) - off)))*uLineAlpha;
    a = max(a, uFillAlpha);
  }
  a *= mask;
  if (a < 0.004) discard;
  gl_FragColor = vec4(c, a);
}`;

// mode: "solid" | "hatch" | "skin" | "dust"
export function inkMat(o = {}) {
  const m = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, transparent: true, depthTest: true, depthWrite: true,
    blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide,
    uniforms: {
      uMode: {value: {solid: 0, hatch: 1, skin: 2, dust: 3}[o.mode || "solid"]},
      uColor: {value: col(o.color || "#FFF0D6")}, uShadow: {value: col(o.shadow || o.color || "#F2C998")},
      uLineAlpha: {value: o.lineAlpha ?? 0.8}, uFillAlpha: {value: o.fillAlpha ?? 1},
      uTone: {value: o.tone ?? 0.4}, uToneGrad: {value: o.toneGrad ?? 0.35}, uSpacing: {value: o.spacing ?? 11},
      uAngle: {value: (o.angle ?? 70)*Math.PI/180}, uCross: {value: o.cross ?? 0}, uSeed: {value: o.seed ?? 1.7},
      uPx: {value: o.px ?? 1}, uDust: {value: o.dust ?? 5}, uSpeck: {value: o.speck ?? 5},
      uFade: {value: new THREE.Vector2(...(o.fade || [1e6, 1e6 + 1]))}, uLight: {value: new THREE.Vector2(...(o.light || [0.75, -0.6]))},
      uCenter: {value: new THREE.Vector2(0, 0)}, uSize: {value: new THREE.Vector2(100, 100)},
    },
  });
  return m;
}

// Catmull-Rom (centripetal) sampling of design-space points. Repeat a point to make a corner.
export function smooth(list, closed = true, per = 10) {
  if (list.length < 3) return list.map(p => V(p[0], p[1]));
  const c = new THREE.CatmullRomCurve3(list.map(p => new THREE.Vector3(p[0], -p[1], 0)), closed, "centripetal");
  return c.getPoints(Math.max(16, list.length*per)).map(p => new THREE.Vector2(p.x, p.y));
}
export const poly = list => list.map(p => V(p[0], p[1]));

function bbox(points) {
  const b = new THREE.Box2().setFromPoints(points); const c = new THREE.Vector2(), s = new THREE.Vector2();
  b.getCenter(c); b.getSize(s); return {c, s};
}

export class Canvas2D {
  constructor() { this.items = []; }
  // fill a closed outline (Vector2 list, three space)
  fill(points, mat, z) {
    const shape = new THREE.Shape(points); const g = new THREE.ShapeGeometry(shape, 1);
    const {c, s} = bbox(points); mat.uniforms.uCenter.value.copy(c); mat.uniforms.uSize.value.set(s.x*0.5, s.y*0.5);
    return this.add(new THREE.Mesh(g, mat), z);
  }
  stroke(points, width, mat, z, closed = false, cap = "round") {
    const pts = closed ? [...points, points[0].clone()] : points;
    const style = SVGLoader.getStrokeStyle(width, "#fff", "round", cap, 4);
    const g = SVGLoader.pointsToStroke(pts, style, 6, 0.01);
    if (!g) return null;
    const {c, s} = bbox(points); mat.uniforms.uCenter.value.copy(c); mat.uniforms.uSize.value.set(Math.max(1, s.x*0.5), Math.max(1, s.y*0.5));
    return this.add(new THREE.Mesh(g, mat), z);
  }
  circle(cx, cy, r, mat, z, seg = 40) {
    const pts = []; for (let i = 0; i < seg; i++) { const a = i/seg*Math.PI*2; pts.push(V(cx + Math.cos(a)*r, cy + Math.sin(a)*r)); }
    return this.fill(pts, mat, z);
  }
  add(mesh, z) { mesh.position.z = z*0.01; mesh.renderOrder = -z; mesh.userData.z = z; this.items.push(mesh); return mesh; }
  group() { const g = new THREE.Group(); this.items.forEach(m => g.add(m)); return g; }
}

// 2D affine in design space (y-down). Positive degrees = clockwise on screen.
export class Affine {
  constructor(m = [1, 0, 0, 1, 0, 0]) { this.m = m; }
  static rot(deg, px, py) { const r = deg*Math.PI/180, c = Math.cos(r), s = Math.sin(r); return new Affine([c, s, -s, c, px - c*px + s*py, py - s*px - c*py]); }
  static move(dx, dy) { return new Affine([1, 0, 0, 1, dx, dy]); }
  then(o) { const [a, b, c, d, e, f] = this.m, [A, B, C, D, E, F] = o.m; return new Affine([A*a + C*b, B*a + D*b, A*c + C*d, B*c + D*d, A*e + C*f + E, B*e + D*f + F]); }
  p(pt) { const [a, b, c, d, e, f] = this.m; return [a*pt[0] + c*pt[1] + e, b*pt[0] + d*pt[1] + f]; }
  ps(list) { return list.map(p => this.p(p)); }
  angle() { return Math.atan2(this.m[1], this.m[0])*180/Math.PI; }
}

export function seeded(seed) { let s = seed >>> 0 || 1; return () => ((s = (s*1664525 + 1013904223) >>> 0) / 4294967296); }
