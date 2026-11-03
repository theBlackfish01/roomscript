// Shared WebGL + 2D canvas helpers.
import * as THREE from "three";

let renderer;
export function getRenderer(w, h) {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: true});
    renderer.setPixelRatio(1); renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // no conversion: shader colours are display values
    document.body.appendChild(renderer.domElement);
  }
  renderer.setSize(w, h, false); renderer.setClearColor(0x000000, 0);
  return renderer;
}
export function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
export function orthoDesign(w, h) { const cam = new THREE.OrthographicCamera(0, w, 0, -h, 0.1, 500); cam.position.z = 200; return cam; }

// Render a scene twice (all layers, then glow layer 1), blur the glow and composite underneath.
export function renderWithGlow(scene, cam, w, h, glowPx, glowAlpha = 0.85) {
  const r = getRenderer(w, h);
  cam.layers.set(0); r.render(scene, cam);
  const full = canvas(w, h); full.getContext("2d").drawImage(r.domElement, 0, 0);
  cam.layers.set(1); r.render(scene, cam); cam.layers.set(0);
  const out = canvas(w, h), o = out.getContext("2d");
  if (glowPx > 0) {
    o.filter = `blur(${glowPx}px)`; o.globalAlpha = glowAlpha; o.drawImage(r.domElement, 0, 0);
    o.filter = `blur(${glowPx*2.6}px)`; o.globalAlpha = glowAlpha*0.6; o.drawImage(r.domElement, 0, 0);
    o.filter = "none"; o.globalAlpha = 1;
  }
  o.drawImage(full, 0, 0);
  return out;
}
export function downsample(src, w, h) { const c = canvas(w, h), x = c.getContext("2d"); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high"; x.drawImage(src, 0, 0, w, h); return c; }

// Dim simulated room used only for preview tiles: left = Lens Preview (alpha over room), right = Spectacles (additive).
export function roomBackdrop(w, h) {
  const c = canvas(w, h), x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#2b2622"); g.addColorStop(0.7, "#1d1916"); g.addColorStop(1, "#151210"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.fillStyle = "#3a332c"; for (let i = 0; i < 6; i++) x.fillRect(w*0.06 + i*w*0.15, h*0.62, w*0.11, h*0.3); // bookshelf-ish blocks
  x.fillStyle = "#4a4038"; x.fillRect(0, h*0.6, w, h*0.02);
  return c;
}
export function previewPair(img, label) {
  const w = img.width, h = img.height, c = canvas(w*2 + 24, h + 44), x = c.getContext("2d");
  x.fillStyle = "#0c0b0a"; x.fillRect(0, 0, c.width, c.height);
  for (const [i, mode] of [[0, "source-over"], [1, "lighter"]]) {
    const ox = i*(w + 24); x.drawImage(roomBackdrop(w, h), ox, 0);
    x.globalCompositeOperation = mode; x.drawImage(img, ox, 0); x.globalCompositeOperation = "source-over";
    x.fillStyle = "#FFF0D6"; x.font = "700 18px 'Courier Prime'"; x.fillText(i ? "SPECTACLES (additive)" : "LENS PREVIEW (alpha)", ox + 8, h + 28);
  }
  if (label) { x.fillStyle = "#FFD60A"; x.font = "700 18px 'Courier Prime'"; x.textAlign = "right"; x.fillText(label, c.width - 8, h + 28); }
  return c;
}

