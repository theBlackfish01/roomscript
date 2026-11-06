// Prompt library + job writer. usage: node jobs.mjs <Character> <frame> [--base raw/x.png] [--n 2] [--quality medium] [--tag t]
// prints the job file path.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ART = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const STYLE = (accent) => `Style: stylized, not photorealistic: modern graphic-novel noir character art, like concept art for an animated mystery film. Bold simplified shapes, slightly elongated elegant proportions, clean confident ink outlines, flat colour blocks with soft cel shading, light warm palette, subtle ${accent} rim light. Plain flat light-grey background, no props, no text.`;
const FULL = "full body, standing facing the viewer, head to shoes visible, centred, feet near the bottom edge";

export const CAST = {
  Vale: { accent: "coral", pron: "her",
    brief: "Marguerite Vale, an immaculate trustee in her late 50s, silver-blonde sculpted updo, cream skirt suit, coral silk blouse, a small brass brooch at the lapel, pearl earrings, very upright posture",
    tell: "her eyes cut sharply sideways to her left (a quick evasive glance) and one hand raised to touch the brass brooch at her lapel; the other arm relaxed" },
  Qadir: { accent: "brass", pron: "his",
    brief: "Imran Qadir, a charming debtor in his early 30s, Pakistani-British, neat short dark beard, short dark hair, camel overcoat over a light shirt, loosened tie, dark trousers, brown shoes, a small brass lighter in one hand",
    tell: "he holds the brass lighter up at chest height in his right hand, its lid flicked open; his charming smile is gone, his face guarded and tense" },
  Okafor: { accent: "cyan", pron: "her",
    brief: "Dr. Ada Okafor, a physician in her mid 40s, Black British, close-cropped natural hair, thin metal-rimmed glasses, light grey tailored trousers, white blouse, a teal scarf, low heeled shoes, composed and precise",
    tell: "she pushes her thin metal glasses up her nose with one finger, jaw set firmly, eyes hard" },
  Pike: { accent: "ivory and silver", pron: "his",
    brief: "Jonah Pike, a brittle art dealer in his early 40s, slim, slicked-back hair, pale grey three-piece suit, ivory leather gloves, a pocket square, polished shoes, a nervous refined air",
    tell: "he tugs at the cuff of one ivory glove with the other gloved hand, glancing aside nervously" },
  Harlow: { accent: "pale ghost-cyan", pron: "his",
    brief: "Edmund Harlow, a wealthy man in his mid 60s, bald on top with a short fringe of grey hair at the sides, a neat grey moustache, round glasses, a bow tie, a waistcoat with a pocket-watch chain, shirt sleeves, dark trousers, a dignified but tired face" },
};

const SAME = "Same character, same outfit, same proportions, same framing, same art style and background; change only: ";
const KEEP = " Keep everything else identical: hair, face shape, clothing, colours, accessories, body pose, and the figure's exact position and size in the frame (head and feet in the same place).";
export const FRAMES = {
  speaking: (c) => `${SAME}the mouth slightly open mid-word, as if speaking, with an engaged expression.${KEEP}`,
  mouthopen: (c) => `${SAME}the mouth more open, as if pronouncing an open vowel mid-sentence (for lip-sync), the same engaged expression.${KEEP}`,
  rattled: (c) => `${SAME}a worried, rattled expression: brow tense and drawn together, eyes uneasy, a slight lean back. Same pose otherwise.${KEEP}`,
  broken: (c) => `${SAME}crushed and defeated: shoulders sunk, head lowered, eyes cast down, composure gone. Same clothing, still standing in the same spot with the feet in the same place.${KEEP}`,
  smug: (c) => `${SAME}a self-satisfied half-smile, chin raised slightly, eyes knowing.${KEEP}`,
  tell: (c) => `${SAME}${CAST[c].tell}.${KEEP}`,
  tableau: (c) => `${SAME}both hands holding a dark electrical cable pulled taut horizontally in front of her at chest height, fists apart at shoulder width, an intense, cold, determined face. The cable is the only prop.${KEEP}`,
  staggering: (c) => `${SAME}he staggers backwards in shock, stumbling, both arms raised in front of him defensively, face shocked and afraid, body tilting back. Feet still near the bottom of the frame.`,
  fallen: (c) => `Same character, same outfit, same art style and plain flat light-grey background; now he lies on his back on the floor, seen from the front-side, full length horizontal across the frame, eyes closed, arms loose at his sides, glasses askew. Whole body visible from head to shoes, nothing cropped. No floor texture, no shadow pool, no props.`,
};

export function basePrompt(c) {
  const ref = c === "Vale" ? "" : "A new character in exactly the same art style as the reference image: ";
  return `${ref}${CAST[c].brief}, ${FULL}. ${STYLE(CAST[c].accent)}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [c, frame, ...rest] = process.argv.slice(2);
  const opt = (k, d) => { const i = rest.indexOf("--" + k); return i >= 0 ? rest[i + 1] : d; };
  const n = +opt("n", 1), quality = opt("quality", "medium"), tag = opt("tag", "");
  let job;
  if (frame === "base") {
    job = { endpoint: c === "Vale" ? "gen" : "edit", images: c === "Vale" ? [] : ["raw/Vale-ref.png"], prompt: basePrompt(c),
      size: "1024x1536", quality, n, out: `raw/${c}-base${tag}.png`, character: c, frame: "base", purpose: `${c} base candidate` };
  } else {
    const base = opt("base", `raw/${c}-base.png`);
    job = { endpoint: "edit", images: [base], prompt: FRAMES[frame](c), size: frame === "fallen" ? "1536x1024" : opt("size", "1024x1536"),
      quality, n, out: `raw/${c}-${frame}${tag}.png`, character: c, frame, purpose: `${c} ${frame} frame from base` };
  }
  const p = path.join(ART, "prompts", `${c}-${frame}${tag}.json`);
  fs.writeFileSync(p, JSON.stringify(job, null, 2));
  console.log(p);
}
