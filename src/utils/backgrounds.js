// Colour and gradient backgrounds (Library presets, picked like images). A background is saved as
// an image URL either way: a preset is drawn as a square SVG, so a stream, the app and the bake
// use it like an uploaded image. The mock server and the dashboard share this file.

/** The live game host avatar background is square. */
export const AVATAR_BACKGROUND_SIZE = 1024;

const HEX = /^#[0-9A-Fa-f]{6}$/;
export const isHex = (v) => HEX.test(v ?? "");

/**
 * A preset: { id, name, kind: "color" | "gradient", colors: ["#RRGGBB", "#RRGGBB"?], angle } —
 * `angle` in degrees, 180 = top to bottom (CSS's meaning).
 */
export function backgroundCss(p) {
  if (!p) return "transparent";
  return p.kind === "gradient" ? `linear-gradient(${p.angle ?? 180}deg, ${p.colors[0]}, ${p.colors[1] ?? p.colors[0]})` : p.colors[0];
}

/** The preset as a square image URL (SVG). */
export function backgroundUrl(p, size = AVATAR_BACKGROUND_SIZE) {
  let fill = p.colors[0];
  let defs = "";
  if (p.kind === "gradient") {
    // CSS angle → SVG gradient line: 180° runs top to bottom, 90° left to right.
    const a = (((p.angle ?? 180) - 90) * Math.PI) / 180;
    const x = Math.cos(a) / 2;
    const y = Math.sin(a) / 2;
    const f = (n) => (0.5 + n).toFixed(3);
    defs = `<defs><linearGradient id="g" x1="${f(-x)}" y1="${f(-y)}" x2="${f(x)}" y2="${f(y)}"><stop offset="0" stop-color="${p.colors[0]}"/><stop offset="1" stop-color="${p.colors[1] ?? p.colors[0]}"/></linearGradient></defs>`;
    fill = "url(#g)";
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${defs}<rect width="${size}" height="${size}" fill="${fill}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** A preset in a line: "#1556F0" or "#FF8A65 → #D81B60". */
export const backgroundLine = (p) => (p.kind === "gradient" ? `${p.colors[0]} → ${p.colors[1]}` : p.colors[0]);

const color = (id, name, hex) => ({ id: `bg-${id}`, name, kind: "color", colors: [hex], angle: 180, builtIn: true });
const gradient = (id, name, from, to, angle = 180) => ({ id: `bg-${id}`, name, kind: "gradient", colors: [from, to], angle, builtIn: true });
/** The presets every dashboard starts with; more (custom) are added from any background picker. */
export const seedBackgroundPresets = () => [
  gradient("savvy-blue", "Savvy blue", "#1D9BF4", "#04112A"),
  gradient("night", "Night", "#7C5CFF", "#120A3A"),
  gradient("sunset", "Sunset", "#FF8A65", "#D81B60", 135),
  gradient("ocean", "Ocean", "#4FC3F7", "#3949AB", 135),
  gradient("mint", "Mint", "#AED581", "#00897B", 135),
  gradient("gold", "Gold", "#FFD54F", "#F4511E", 135),
  color("blue", "Blue", "#1556F0"),
  color("purple", "Purple", "#7444E0"),
  color("green", "Green", "#146C2E"),
  color("red", "Red", "#B3261E"),
  color("black", "Black", "#111318"),
  color("white", "White", "#F5F5F7"),
];
/** The default live game host avatar background (Savvy blue). */
export const DEFAULT_AVATAR_BACKGROUND = () => backgroundUrl(seedBackgroundPresets()[0]);
