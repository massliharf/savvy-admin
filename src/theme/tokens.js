// Savvy Admin design tokens that are independent of colour (role names kept from M3).

// Corner radius scale (px).
export const shape = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  // Savvy Admin stops at 16: cards, menus, dialogs and the shell all use it.
  lgInc: 16,
  xl: 16,
  xlInc: 16,
  xxl: 16,
  full: 9999,
};

/** CSS radius from the shape scale, e.g. `radius("lg")` → "16px". */
export const radius = (k) => `${shape[k]}px`;

// Motion: short, calm ease-outs; nothing overshoots.
export const motion = {
  spatialFast: "200ms cubic-bezier(0.2, 0, 0, 1)",
  spatial: "300ms cubic-bezier(0.2, 0, 0, 1)",
  effectsFast: "150ms cubic-bezier(0.31, 0.94, 0.34, 1.00)",
  effects: "200ms cubic-bezier(0.34, 0.80, 0.34, 1.00)",
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
};

// State-layer opacities.
export const state = { hover: 0.05, focus: 0.08, pressed: 0.1, dragged: 0.16, disabled: 0.38, disabledContainer: 0.12 };

// Elevation (Savvy Admin): cards and panels have none; floating bars use shadow-xs, menus and
// tooltips shadow-lg, dialogs and sheets shadow-xl (the same layered shadow, deeper).
const xs = "0 2px 5px rgba(55,73,87,.1)";
const sm = "0 0 2px rgba(18,18,18,.08), 0 7px 3px rgba(18,18,18,.02), 0 4px 2px rgba(18,18,18,.02), 0 0 8px rgba(18,18,18,.08), 0 2px 2px rgba(18,18,18,.04), 0 0 1px rgba(18,18,18,.08)";
const lg = "0 0 2px rgba(18,18,18,.08), 0 25px 10px rgba(18,18,18,.02), 0 14px 9px rgba(18,18,18,.02), 0 6px 6px rgba(18,18,18,.04), 0 2px 4px rgba(18,18,18,.08)";
const xl = "0 0 2px rgba(18,18,18,.08), 0 40px 16px rgba(18,18,18,.03), 0 22px 13px rgba(18,18,18,.03), 0 10px 10px rgba(18,18,18,.05), 0 3px 6px rgba(18,18,18,.08)";
export const elevation = ["none", xs, sm, lg, xl, xl];
/** `base` with an `on` state layer of the given opacity painted over it. */
export const layer = (base, on, opacity) => `color-mix(in srgb, ${on} ${opacity * 100}%, ${base})`;

// Klarheit is Savvy Admin's display face (page titles); Geist everything else.
export const FONT_DISPLAY = '"Klarheit", "Degular", "Geist", Inter, ui-sans-serif, system-ui, sans-serif';
export const FONT = '"Geist", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

const t = (size, line, weight, tracking = 0, extra = {}) => ({
  fontFamily: FONT,
  fontSize: `${size / 16}rem`,
  lineHeight: `${line / 16}rem`,
  fontWeight: weight,
  letterSpacing: tracking ? `${tracking / size}em` : 0,
  ...extra,
});

// A touch heavier than Savvy Admin's (body 450, UI 550, titles 600) so text doesn't read thin.
// Savvy Admin's small, dense scale: UI text is 12/500, body 14, headings 20–28 (Klarheit there;
// Geist 600 here, as the open alternative). Role names are M3's so every page keeps its variant.
export const typeScale = {
  displayLarge: t(36, 44, 600, -0.4),
  displayMedium: t(32, 40, 600, -0.3),
  displaySmall: t(28, 42, 600, -0.2),
  headlineLarge: t(24, 32, 600, -0.2),
  headlineMedium: t(22, 30, 600, -0.2),
  headlineSmall: t(20, 30, 600, -0.2),
  titleLarge: t(18, 26, 600, -0.1),
  titleMedium: t(15, 24, 600),
  titleSmall: t(13, 20, 600),
  bodyLarge: t(14, 22, 450),
  bodyMedium: t(13, 20, 450),
  bodySmall: t(12, 18, 450),
  labelLarge: t(12, 18, 550),
  labelMedium: t(12, 16, 550),
  labelSmall: t(10, 14, 550, 0.2),
  // Section labels: ~10px, 600, upper case (MODEL, PROMPT…).
  overline: t(10, 15, 600, 0.4, { textTransform: "uppercase" }),
};
