// Savvy Admin design tokens that are independent of colour (role names kept from M3).
// Framer style: values from Framer's editor design system "Fresco", measured live
// (~/Desktop/MyClaudeProjects/framer/DESIGN_SYSTEM.md). Quiet, dense, neutral: 12px text,
// 30px controls, two weights (450 / 550), fills instead of borders, one accent (#0099FF).

// Corner radius scale (px), Fresco: checkbox 4, small 5, segment 6, controls 8, tooltip 10,
// nested rows 12, menus 13, cards 15, popovers / dialogs 18.
export const shape = {
  none: 0,
  xs: 5,
  sm: 8,
  md: 12,
  lg: 15,
  lgInc: 15,
  xl: 18,
  xlInc: 18,
  xxl: 18,
  full: 9999,
  // Named Fresco radii.
  checkbox: 4,
  segment: 6,
  tooltip: 10,
  menu: 13,
  card: 15,
  dialog: 18,
};

/** CSS radius from the shape scale, e.g. `radius("lg")` → "15px". */
export const radius = (k) => `${shape[k]}px`;

// Motion (Fresco): hover 80–120ms; menus and popovers fade with a 4px shift in 120ms.
export const motion = {
  spatialFast: "160ms cubic-bezier(0.2, 0, 0, 1)",
  spatial: "200ms cubic-bezier(0.2, 0, 0, 1)",
  effectsFast: "100ms ease-out",
  effects: "120ms ease-out",
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
};

// State-layer opacities.
export const state = { hover: 0.05, focus: 0.07, pressed: 0.1, dragged: 0.16, disabled: 0.4, disabledContainer: 0.05 };

// Elevation, as in Framer / the GUU admin (admin.css): what sits on the page is flat — cards and
// raised buttons get a 1px hairline, no drop shadow. What floats over it — menus, popovers,
// tooltips, dialogs, sheets — gets Framer's float shadow (--shadow-float: a soft 3px/6px drop plus a
// 1px edge). Indices kept so every caller still works:
// [0] none · [1] raised button · [2] card · [3] menu / popover / tooltip · [4] dialog / sheet
// [5] hovered card.
const LIGHT_LINE = "0 0 0 1px #EEEEEE";
const LIGHT_FLOAT = "0 3px 6px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.05)";
const DARK_LINE = "0 0 0 1px rgba(255,255,255,.08)";
const DARK_FLOAT = "0 3px 6px rgba(0,0,0,.08), inset 0 0 0 1px rgba(255,255,255,.07)";
const LIGHT_ELEVATION = ["none", LIGHT_LINE, LIGHT_LINE, LIGHT_FLOAT, LIGHT_FLOAT, LIGHT_LINE];
const DARK_ELEVATION = ["none", DARK_LINE, DARK_LINE, DARK_FLOAT, DARK_FLOAT, DARK_LINE];
export const elevationFor = (dark) => (dark ? DARK_ELEVATION : LIGHT_ELEVATION);
/** Light-mode elevation (kept for imports that don't know the mode). */
export const elevation = LIGHT_ELEVATION;

// Control details (GUU admin.css): the chosen segment pill (--shadow-segment), the slider knob
// (--shadow-knob), the switch tack (--shadow-tack), the checkbox ring, and the toast's drop
// (--toast-shadow). Primary buttons stay flat (--shadow-primary: none).
export const effectsFor = (dark) =>
  dark
    ? {
        primary: "none",
        segment: "inset 0 0 0 1px rgba(255,255,255,.03)",
        knob: "0 0 0 1px rgba(255,255,255,.1)",
        tack: "0 1px 1px rgba(0,0,0,.1), 0 2px 10px rgba(0,0,0,.05)",
        ring: "inset 0 0 0 1px rgba(255,255,255,.1)",
        toast: "0 8px 24px -8px rgba(0,0,0,.7), inset 0 0 0 1px rgba(255,255,255,.07)",
      }
    : {
        primary: "none",
        segment: "0 0 0 1px rgba(0,0,0,.04), 0 1px 0 rgba(0,0,0,.04), 0 2px 4px rgba(0,0,0,.08)",
        knob: "0 2px 4px rgba(0,0,0,.1), 0 1px 0 rgba(0,0,0,.05), 0 0 0 1px rgba(0,0,0,.03)",
        tack: "0 1px 1px rgba(0,0,0,.1), 0 2px 10px rgba(0,0,0,.05), 0 0 0 .5px rgba(0,0,0,.05)",
        ring: "inset 0 0 0 1px rgba(0,0,0,.1)",
        toast: "0 8px 24px -8px rgba(0,0,0,.35)",
      };

/** `base` with an `on` state layer of the given opacity painted over it. */
export const layer = (base, on, opacity) => `color-mix(in srgb, ${on} ${opacity * 100}%, ${base})`;

// Fresco sansSerif ("Inter Variable UI" in Framer); one face for everything. Stylistic Inter:
// single-storey a (cv11) and open digits (ss01), see INTER_FEATURES.
export const INTER_FEATURES = '"cv11", "ss01"';
export const FONT = '"InterVariable", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
export const FONT_DISPLAY = FONT;
export const FONT_MONO = '"JetBrains Mono", Menlo, monospace';

const t = (size, line, weight, extra = {}) => ({
  fontFamily: FONT,
  fontSize: `${size}px`,
  lineHeight: `${line}px`,
  fontWeight: weight,
  letterSpacing: "normal",
  ...extra,
});

// Fresco type: base 12/450 (every control, row and menu), baseLarge 13, caption 10, heading
// 16/550, display 20/550. Two weights only: 450 and 550. Sentence case everywhere.
// Role names are M3's so every page keeps its variant.
export const typeScale = {
  displayLarge: t(24, 32, 550),
  displayMedium: t(22, 30, 550),
  displaySmall: t(20, 28, 550),
  headlineLarge: t(20, 28, 550),
  headlineMedium: t(20, 28, 550),
  headlineSmall: t(16, 22, 550),
  titleLarge: t(16, 22, 550),
  titleMedium: t(13, 18, 550),
  titleSmall: t(12, 17, 550),
  bodyLarge: t(13, 18, 450),
  bodyMedium: t(12, 17, 450),
  bodySmall: t(12, 17, 450),
  labelLarge: t(12, 16, 550),
  labelMedium: t(12, 16, 450),
  labelSmall: t(10, 14, 550),
  // Section labels: Framer keeps them sentence case at the base size.
  overline: t(12, 16, 450, { textTransform: "none" }),
};
