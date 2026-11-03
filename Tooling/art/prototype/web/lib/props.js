// Procedural evidence props -> unlit, vertex-coloured GLB (KHR_materials_unlit + COLOR_0), plus a PNG thumbnail.
// Light is baked into vertex colours (key light + engraved highlight bands) because Spectacles is additive:
// shadowed faces should go dark (= transparent), lit edges bright.
import * as THREE from "three";
import {GLTFExporter} from "three/addons/exporters/GLTFExporter.js";
import {getRenderer, canvas} from "./gl.js";

const KEY = new THREE.Vector3(-0.55, 0.75, 0.55).normalize();
function bake(geo, hex, bands = [], opt = {}) {
  geo.computeVertexNormals();
  const base = new THREE.Color(hex), pos = geo.attributes.position, nor = geo.attributes.normal, cols = new Float32Array(pos.count*3);
  const n = new THREE.Vector3(), c = new THREE.Color(), hi = new THREE.Color("#FFFFFF");
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(nor, i);
    const y = pos.getY(i), lam = Math.max(0, n.dot(KEY)), side = 1 - Math.abs(n.y);
    let k = (opt.floor ?? 0.18) + 0.82*Math.pow(lam, 0.8);
    const band = bands.reduce((m, b) => Math.max(m, 1 - Math.min(1, Math.abs(y - b)/0.0035)), 0);
    c.copy(base).multiplyScalar(k).lerp(hi, Math.pow(lam, 12)*0.85 + band*0.55*side);
    cols.set([Math.min(1, c.r), Math.min(1, c.g), Math.min(1, c.b)], i*3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  return geo;
}
const unlit = () => new THREE.MeshBasicMaterial({vertexColors: true});

export function buildProp(spec, style) {
  const P = style.palette, g = new THREE.Group(); g.name = spec.file;
  const prof = spec.profile.map(([r, y]) => new THREE.Vector2(r, y));
  const lathe = new THREE.LatheGeometry(prof, spec.segments || 48);
  if (spec.chip) { // notch the rim
    const pos = lathe.attributes.position, top = Math.max(...spec.profile.map(p => p[1]));
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i), a = Math.atan2(z, x)*180/Math.PI;
      const da = Math.abs(((a - spec.chip.angle + 540)%360) - 180);
      if (y > top - 0.008 && da < spec.chip.width/2) { const t = 1 - da/(spec.chip.width/2); pos.setY(i, y - spec.chip.depth*Math.sqrt(t)); }
    }
  }
  const body = new THREE.Mesh(bake(lathe, P[spec.color] || spec.color, spec.bands), unlit()); body.name = spec.file + "_Body"; g.add(body);
  if (spec.handle) {
    const h = spec.handle, tor = new THREE.TorusGeometry(h.R, h.r, 12, 28, Math.PI*1.15);
    tor.rotateZ(-Math.PI*0.575); tor.translate(Math.max(...spec.profile.map(p => p[0])) + h.R*0.55, h.y, 0);
    const m = new THREE.Mesh(bake(tor, P[h.color] || h.color), unlit()); m.name = spec.file + "_Handle"; g.add(m);
  }
  const topY = Math.max(...spec.profile.map(p => p[1]));
  if (spec.candle) {
    const c = new THREE.CylinderGeometry(spec.candle.r*0.92, spec.candle.r, spec.candle.h, 24, 3); c.translate(0, topY + spec.candle.h/2, 0);
    const m = new THREE.Mesh(bake(c, P[spec.candle.color], [], {floor: 0.35}), unlit()); m.name = spec.file + "_Candle"; g.add(m);
    if (spec.flame) {
      const fp = [[0, 0], [0.006, 0.006], [0.0075, 0.014], [0.005, 0.024], [0.0, spec.flame.h]].map(([r, y]) => new THREE.Vector2(r, y));
      const f = new THREE.LatheGeometry(fp, 16); f.translate(0, topY + spec.candle.h + 0.003, 0);
      const cols = new Float32Array(f.attributes.position.count*3), y0 = new THREE.Color(P[spec.flame.color]), w = new THREE.Color("#FFFFFF");
      for (let i = 0; i < f.attributes.position.count; i++) { const t = (f.attributes.position.getY(i) - topY - spec.candle.h)/spec.flame.h; const cc = w.clone().lerp(y0, Math.min(1, t*1.6)); cols.set([cc.r, cc.g, cc.b], i*3); }
      f.setAttribute("color", new THREE.BufferAttribute(cols, 3));
      const m = new THREE.Mesh(f, unlit()); m.name = spec.file + "_Flame"; g.add(m);
    }
  }
  return g;
}

export async function exportGLB(group) {
  const exporter = new GLTFExporter();
  const buf = await exporter.parseAsync(group, {binary: true, onlyVisible: true});
  let tris = 0; group.traverse(o => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count)/3; });
  const box = new THREE.Box3().setFromObject(group);
  const bytes = new Uint8Array(buf); let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return {glb: btoa(bin), triangles: Math.round(tris), heightM: +(box.max.y - box.min.y).toFixed(3)};
}

export function renderPropThumb(group, spec, style, size = 512) {
  const r = getRenderer(size, size), scene = new THREE.Scene(); const g = group.clone(); scene.add(g);
  const box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3()), h = box.max.y - box.min.y;
  g.rotation.y = spec.thumbYaw ?? 0.5;
  const rad = box.getBoundingSphere(new THREE.Sphere()).radius, dist = rad/Math.sin(14*Math.PI/180)*1.08;
  const cam = new THREE.PerspectiveCamera(28, 1, 0.01, 10); cam.position.set(c.x, c.y + dist*0.32, c.z + dist*0.95); cam.lookAt(c.x, c.y, c.z);
  r.render(scene, cam);
  const out = canvas(size, size), x = out.getContext("2d");
  x.filter = "blur(10px)"; x.globalAlpha = 0.5; x.drawImage(r.domElement, 0, 0); x.filter = "none"; x.globalAlpha = 1; x.drawImage(r.domElement, 0, 0);
  x.fillStyle = style.palette.yellow; x.font = "700 22px 'Courier Prime'"; x.fillText(`${spec.object} · ${spec.label.toUpperCase()}`, 16, size - 18);
  return out.toDataURL("image/png");
}
