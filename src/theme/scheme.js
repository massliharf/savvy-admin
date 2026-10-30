import { argbFromHex, hexFromArgb, Hct, MaterialDynamicColors as C, SchemeTonalSpot } from "@material/material-color-utilities";

// The colour system: Savvy Admin's own tokens, measured live in its app (light and dark); see
// /design-system.md. Each role below names the Savvy Admin token it is.
//
// Shell: background = panel-0 (ground); the workspace, rail, dialogs, sheets and menus are white
// panels (panel-4); cards and rows inside them are grey blocks; what sits inside a block is white
// again (nested).
// Interaction is one ladder for every family: -0 rest, -1 hover, -2 pressed / selected
// (control = default-0, hover = ghost-1, pressed = ghost-2). Where you are (rail, menus, section
// nav) is ghost-2 with ink text; a chosen filter is surface-3; the one accent is primary-0 blue.
// Light and dark are tuned to the same separations (a control or status fill stands apart from
// its surface by about the same ratio in both). Lines appear only where Savvy Admin has them (design-system.md §5): border = alpha-1, borderSubtle
// = alpha-0, borderStrong = alpha-2 (hover, focus outline).
export const ACCENT = "#3F59E4";
export const BRAND = "#FF57AE";
// Savvy Admin's app (category) colours: the icon is the colour, its tile 10% of it.
export const CATEGORY = { violet: "#8566DC", blue: "#4F69F2", green: "#17CB8D", teal: "#00CDC6", rose: "#CC7E80", sand: "#B39581" };
export const CATEGORY_DARK = { violet: "#9C82E5", blue: "#6F8BF7", green: "#3CD39F", teal: "#29D4CF", rose: "#CC7E80", sand: "#B39581" };

const NEUTRAL = {
  // Savvy Admin's tokens exactly (design-system.md §2). Shell: panel-0 ground, panel-2
  // workspace, panel-4 white panels (rail, cards, sheets, dialogs, menus); surface-1 blocks inside
  // a panel; a panel again inside a block (nested). Lines only where Savvy Admin draws them (§5).
  light: {
    // Contrast pass: Savvy Admin blue a step deeper so white text and blue text pass 4.5:1.
    primary: "#3F59E4", primaryHover: "#2F47D0", onPrimary: "#FFFFFF", primaryText: "#3F59E4",
    primaryContainer: "#CCD6FB", onPrimaryContainer: "#2B3FAE", inversePrimary: "#90ABFA", inverseError: "#F66951",
    // secondary: the inverted button (black in light)
    secondary: "#1A1A1A", secondaryHover: "#424242", secondaryPressed: "#616161", onSecondary: "#FFFFFF",
    // ghost-2: where you are
    secondaryContainer: "rgba(115,115,115,.22)", onSecondaryContainer: "#141414",
    tertiary: "#8566DC", onTertiary: "#FFFFFF", tertiaryContainer: "rgba(133,102,220,.1)", onTertiaryContainer: "#5A3DB0",
    error: "#BF371F", onError: "#FFFFFF", errorContainer: "#F9C7BE", onErrorContainer: "#8D1B07",
    background: "#E8E8E8", onBackground: "#141414",
    surface: "#F2F2F2", onSurface: "#141414", surfaceVariant: "#E6E6E6", onSurfaceVariant: "#4D4D4D",
    surfaceDim: "#E3E3E3", surfaceBright: "#FFFFFF",
    surfaceContainerLowest: "#FFFFFF", surfaceContainerLow: "#FCFCFC", surfaceContainer: "#F5F5F5",
    surfaceContainerHigh: "#F0F0F0", surfaceContainerHighest: "#E3E3E3", nested: "#FFFFFF",
    inverseSurface: "#1A1A1A", inverseOnSurface: "#F5F5F5",
    outline: "#5E5E5E", outlineVariant: "rgba(16,16,16,.14)", shadow: "#121212", scrim: "#1A1A1A", surfaceTint: "#506BF2",
    surfaceCard: "#FFFFFF", surfaceCardInset: "#F0F0F0",
    dialog: "#FFFFFF", overlay: "#FFFFFF", modal: "#FFFFFF",
    textStrong: "#262626", textBody: "#333333", textMuted: "#5E5E5E",
    surface2: "#E6E6E6", surface3: "#D9D9D9", surface4: "#C7C7C7",
    brand: BRAND, onBrand: "#0F0F0F", brandContainer: "rgba(255,88,174,.15)", onBrandContainer: "#FF57AE",
    brandBlue: "#1CB0F6",
    // default-0 / ghost-1 / ghost-2
    control: "rgba(115,115,115,.12)", hover: "rgba(115,115,115,.18)", pressed: "rgba(115,115,115,.24)",
    // alpha-1 / alpha-0 / alpha-2; outline-border-0 / -1
    border: "rgba(16,16,16,.14)", borderSubtle: "rgba(16,16,16,.08)", borderStrong: "rgba(16,16,16,.3)",
    outlineBorder: "rgba(16,16,16,.2)", outlineBorderHover: "rgba(16,16,16,.3)", outlineHover: "rgba(16,16,16,.1)",
    // focus outline alpha-2; form-0 / form-border-0 / -active / -error
    focus: "rgba(16,16,16,.3)", field: "rgba(115,115,115,.16)", fieldHover: "rgba(115,115,115,.22)", fieldBorder: "transparent", fieldActive: "#0F0F0F", fieldError: "#F66951",
    disabledFill: "#E3E3E3",
    track: "rgba(115,115,115,.2)", trackSelected: "#D9D9D9",
    backdrop: "rgba(26,26,26,.8)",
    // Filled controls (select, chips, stepper, grey buttons) are default-0 with no line.
    ctrl: "rgba(115,115,115,.2)", ctrlHover: "rgba(115,115,115,.26)", ctrlPressed: "rgba(115,115,115,.32)", ctrlBorder: "transparent", ctrlBorderHover: "transparent",
    // A chosen filter / segment: surface-3.
    chosen: "#D4D4D4",
    // The chosen option of a segmented control: a white pill on the grey track.
    segment: "#FFFFFF",
    cardBorder: "transparent",
  },
  dark: {
    primary: "#4A64EC", primaryHover: "#3F59E4", onPrimary: "#FFFFFF", primaryText: "#90ABFA",
    primaryContainer: "rgba(144,171,250,.2)", onPrimaryContainer: "#C7D4FD", inversePrimary: "#506BF2", inverseError: "#F66951",
    secondary: "#F5F5F5", secondaryHover: "#E3E3E3", secondaryPressed: "#DBDBDB", onSecondary: "#1A1A1A",
    secondaryContainer: "rgba(255,255,255,.2)", onSecondaryContainer: "#FAFAFA",
    tertiary: "#9C82E5", onTertiary: "#1E1240", tertiaryContainer: "rgba(156,130,229,.1)", onTertiaryContainer: "#C9B9F5",
    error: "#F66951", onError: "#1A1A1A", errorContainer: "rgba(246,105,81,.24)", onErrorContainer: "#F9C7BE",
    background: "#050505", onBackground: "#FAFAFA",
    surface: "#121212", onSurface: "#FAFAFA", surfaceVariant: "#2B2B2B", onSurfaceVariant: "#C2C2C2",
    surfaceDim: "#101010", surfaceBright: "#363636",
    surfaceContainerLowest: "#1F1F1F", surfaceContainerLow: "#242424", surfaceContainer: "#242424",
    surfaceContainerHigh: "#2A2A2A", surfaceContainerHighest: "#333333", nested: "#1F1F1F",
    inverseSurface: "#F5F5F5", inverseOnSurface: "#1A1A1A",
    outline: "#999999", outlineVariant: "rgba(255,255,255,.14)", shadow: "#000000", scrim: "#1A1A1A", surfaceTint: "#506BF2",
    surfaceCard: "#1F1F1F", surfaceCardInset: "#2A2A2A",
    dialog: "#1F1F1F", overlay: "#262626", modal: "#262626",
    textStrong: "#EDEDED", textBody: "#D6D6D6", textMuted: "#999999",
    surface2: "#333333", surface3: "#424242", surface4: "#525252",
    brand: BRAND, onBrand: "#0F0F0F", brandContainer: "rgba(255,88,174,.15)", onBrandContainer: "#FF57AE",
    brandBlue: "#1CB0F6",
    control: "rgba(255,255,255,.09)", hover: "rgba(255,255,255,.14)", pressed: "rgba(255,255,255,.2)",
    border: "rgba(255,255,255,.14)", borderSubtle: "rgba(255,255,255,.08)", borderStrong: "rgba(255,255,255,.3)",
    outlineBorder: "rgba(255,255,255,.2)", outlineBorderHover: "rgba(255,255,255,.3)", outlineHover: "rgba(255,255,255,.1)",
    focus: "rgba(255,255,255,.3)", field: "rgba(255,255,255,.07)", fieldHover: "rgba(255,255,255,.11)", fieldBorder: "transparent", fieldActive: "#FFFFFF", fieldError: "#F66951",
    disabledFill: "#363636",
    track: "rgba(255,255,255,.09)", trackSelected: "#454545",
    backdrop: "rgba(26,26,26,.8)",
    ctrl: "rgba(255,255,255,.09)", ctrlHover: "rgba(255,255,255,.14)", ctrlPressed: "rgba(255,255,255,.2)", ctrlBorder: "transparent", ctrlBorderHover: "transparent",
    chosen: "#4A4A4A",
    segment: "#4A4A4A",
    cardBorder: "transparent",
  },
};
// Success and warning (not M3 core roles), in the same four roles as a key colour.
const NEUTRAL_CUSTOM = {
  light: {
    success: { color: "#0F7A55", onColor: "#FFFFFF", container: "#DCF7EC", onContainer: "#06402C" },
    warning: { color: "#8A5200", onColor: "#FFFFFF", container: "#FDDA9E", onContainer: "#3B2200" },
  },
  dark: {
    success: { color: "#5FD9AA", onColor: "#06402C", container: "#0E3D2D", onContainer: "#C6F5E2" },
    warning: { color: "#FFBE6B", onColor: "#3B2200", container: "#4A2F05", onContainer: "#FFE2BD" },
  },
};

const ROLES = [
  "primary", "onPrimary", "primaryContainer", "onPrimaryContainer", "inversePrimary",
  "primaryFixed", "primaryFixedDim", "onPrimaryFixed", "onPrimaryFixedVariant",
  "secondary", "onSecondary", "secondaryContainer", "onSecondaryContainer",
  "secondaryFixed", "secondaryFixedDim", "onSecondaryFixed", "onSecondaryFixedVariant",
  "tertiary", "onTertiary", "tertiaryContainer", "onTertiaryContainer",
  "tertiaryFixed", "tertiaryFixedDim", "onTertiaryFixed", "onTertiaryFixedVariant",
  "error", "onError", "errorContainer", "onErrorContainer",
  "background", "onBackground",
  "surface", "onSurface", "surfaceVariant", "onSurfaceVariant",
  "surfaceDim", "surfaceBright",
  "surfaceContainerLowest", "surfaceContainerLow", "surfaceContainer",
  "surfaceContainerHigh", "surfaceContainerHighest",
  "inverseSurface", "inverseOnSurface",
  "outline", "outlineVariant", "shadow", "scrim", "surfaceTint",
];

const cache = new Map();

/** Returns `{ [role]: "#rrggbb", success: {...}, warning: {...} }` for light or dark. */
export function buildScheme(isDark) {
  const key = String(isDark);
  if (cache.has(key)) return cache.get(key);
  // The *Fixed roles (barely used) come from a scheme generated from the accent.
  const base = new SchemeTonalSpot(Hct.fromInt(argbFromHex(ACCENT)), isDark, 0);
  const roles = {};
  for (const role of ROLES) roles[role] = hexFromArgb(C[role].getArgb(base));
  const mode = isDark ? "dark" : "light";
  Object.assign(roles, NEUTRAL[mode], NEUTRAL_CUSTOM[mode]);
  cache.set(key, roles);
  return roles;
}
