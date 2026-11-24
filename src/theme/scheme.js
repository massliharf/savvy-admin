import { argbFromHex, hexFromArgb, Hct, MaterialDynamicColors as C, SchemeTonalSpot } from "@material/material-color-utilities";

// The colour system, Framer style: Framer's editor tokens ("Fresco"), read live in light and
// dark (~/Desktop/MyClaudeProjects/framer/DESIGN_SYSTEM.md §1.2 and Appendix A). Each role
// below names the Fresco token it is.
//
// Shell: white panels (panelBackground) split by 1px dividers (panelDivider), never shadows.
// Controls are a 5% black fill (inputBackground / buttonBackground), 7% on hover; no borders.
// Selected rows are #F3F3F3 with #000 text (panelItemBackgroundActive); a chosen filter is the
// soft accent (tintDimmed + tint). One accent: #0099FF (tint), for primary actions, selection
// and active states only. Text: title #222, body #333, label #666, muted #999.
export const ACCENT = "#0099FF";
// Framer has a single accent, so the brand action uses it too.
export const BRAND = "#0099FF";
// App (category) colours: the icon is the colour, its tile 10% of it. Fresco's insert-panel
// accents (cyan, green, orange), its component purple and the tint.
export const CATEGORY = { violet: "#8855FF", blue: "#0099FF", green: "#00BB88", teal: "#28D4D4", rose: "#F24A58", sand: "#FF8822" };
export const CATEGORY_DARK = CATEGORY;

const NEUTRAL = {
  light: {
    // tint / buttonBackgroundPrimaryHover / Active
    primary: "#0099FF", primaryHover: "#0088FF", primaryActive: "#0077FF", onPrimary: "#FFFFFF", primaryText: "#0099FF",
    // tintDimmed. Text on a tint is a deeper step of the hue so it reads (≥ 4.5:1 on the 10% fill;
    // #0099FF on it is only 2.7:1); dots, icons and the fills themselves stay #0099FF.
    primaryContainer: "rgba(0,153,255,.1)", onPrimaryContainer: "#0070CC", inversePrimary: "#0099FF", inverseError: "#F55B5B",
    // secondary: the raised button (buttonWithDepthBackground / Text)
    secondary: "#FFFFFF", secondaryHover: "#FAFAFA", secondaryPressed: "#F3F3F3", onSecondary: "#222222",
    // where you are: panelItemBackgroundActive / panelItemTextActive
    secondaryContainer: "rgba(0,0,0,.047)", onSecondaryContainer: "#000000",
    // componentTint
    tertiary: "#8855FF", onTertiary: "#FFFFFF", tertiaryContainer: "rgba(136,85,255,.1)", onTertiaryContainer: "#8855FF",
    // buttonTextDestructive / buttonBackgroundDestructive
    error: "#F24A58", onError: "#FFFFFF", errorContainer: "rgba(242,74,88,.1)", onErrorContainer: "#CC2B3A",
    // Framer's dashboard / settings (as in the GUU admin the owner approved): a white page
    // (settingsContainerBackground), white cards with a #EEE hairline, no drop shadows.
    background: "#FFFFFF", onBackground: "#222222",
    surface: "#FFFFFF", onSurface: "#222222", surfaceVariant: "#F3F3F3", onSurfaceVariant: "#666666",
    // canvasBackground
    surfaceDim: "#EEEEEE", surfaceBright: "#FFFFFF",
    // Rows inside a white card: settingsEntryBackground (#0000000A on white).
    surfaceContainerLowest: "#FFFFFF", surfaceContainerLow: "#FCFCFC", surfaceContainer: "#F5F5F5",
    surfaceContainerHigh: "#F5F5F5", surfaceContainerHighest: "#EEEEEE", nested: "#FFFFFF",
    inverseSurface: "#222222", inverseOnSurface: "#FFFFFF",
    // panelIcon / panelDivider
    outline: "#888888", outlineVariant: "rgba(0,0,0,.067)", shadow: "#000000", scrim: "#000000", surfaceTint: "#0099FF",
    // settingsCardBackground
    surfaceCard: "#FFFFFF", surfaceCardInset: "#F5F5F5", surfaceCardHover: "#FAFAFA",
    // modalBackground / menuBackground / popoverBackground
    dialog: "#FFFFFF", overlay: "#FFFFFF", modal: "#FFFFFF", tooltip: "#FFFFFF",
    // panelTitle / menuText / inputPlaceholder
    textStrong: "#222222", textBody: "#333333", textMuted: "#767676", textPlaceholder: "#999999", textDisabled: "#BBBBBB",
    surface2: "#F3F3F3", surface3: "#EEEEEE", surface4: "#DDDDDD",
    brand: BRAND, onBrand: "#FFFFFF", brandContainer: "rgba(0,153,255,.1)", onBrandContainer: "#0099FF",
    brandBlue: "#0099FF",
    // buttonBackground / menuBackgroundActive / buttonBackgroundHover
    control: "rgba(0,0,0,.05)", hover: "rgba(0,0,0,.05)", pressed: "rgba(0,0,0,.07)",
    // panelDivider / swatchBorder
    border: "rgba(0,0,0,.067)", borderSubtle: "rgba(0,0,0,.05)", borderStrong: "rgba(0,0,0,.1)",
    outlineBorder: "rgba(0,0,0,.1)", outlineBorderHover: "rgba(0,0,0,.15)", outlineHover: "rgba(0,0,0,.05)",
    // focus outline (tint); inputBackground / inputBorderError
    focus: "#0099FF", field: "rgba(0,0,0,.05)", fieldHover: "rgba(0,0,0,.07)", fieldBorder: "transparent", fieldActive: "#0099FF", fieldError: "#F55B5B",
    disabledFill: "#F3F3F3",
    // toggleBackground (#EEE on a white panel; 10% black so it also reads on a #F5F5F5 row) /
    // sliderTrack
    track: "rgba(0,0,0,.1)", trackSelected: "#DDDDDD", sliderRest: "#DDDDDD",
    // modalBackdrop
    backdrop: "rgba(0,0,0,.4)",
    // buttonBackground / Hover; no line
    ctrl: "rgba(0,0,0,.05)", ctrlHover: "rgba(0,0,0,.07)", ctrlPressed: "rgba(0,0,0,.1)", ctrlBorder: "transparent", ctrlBorderHover: "transparent",
    // A chosen filter: the soft accent (pillTintBackground / tint).
    chosen: "rgba(0,153,255,.1)", chosenText: "#0070CC",
    // segmentedControlItemBackgroundSelected / its text
    // segmentIdle: an unselected option (Framer #999; #888 here so it reads on the 5% track).
    segment: "#FFFFFF", segmentText: "#0099FF", segmentIdle: "#888888",
    // Menu rows (GUU admin): hover #F2F2F2, the checkmark #444, separators #EEE.
    menuHover: "#F2F2F2", menuCheck: "#444444", menuSeparator: "#EEEEEE", chevron: "#BBBBBB",
    // checkboxBackground / pillText / selectionBackground / loaderPrimary
    checkbox: "#F5F5F5", pillText: "#777777", selection: "rgba(0,0,0,.1)", loader: "#F0F0F0", scrollbar: "#CCCCCC",
    // Framer card logic: a 1px #EEE hairline instead of a shadow (cards, raised buttons, tiles).
    cardBorder: "#EEEEEE", cardBorderHover: "#E0E0E0",
    // Toasts: a dark chip in both themes.
    toast: "#222222", onToast: "#FFFFFF",
  },
  dark: {
    primary: "#0099FF", primaryHover: "#0088FF", primaryActive: "#0077FF", onPrimary: "#FFFFFF", primaryText: "#0099FF",
    // tintTileBackground (tintDimmed /.06 is too faint to read as chosen)
    primaryContainer: "rgba(0,153,255,.15)", onPrimaryContainer: "#0099FF", inversePrimary: "#0099FF", inverseError: "#F55B5B",
    secondary: "#262626", secondaryHover: "#2E2E2E", secondaryPressed: "#333333", onSecondary: "#FFFFFF",
    secondaryContainer: "rgba(255,255,255,.07)", onSecondaryContainer: "#FFFFFF",
    tertiary: "#8855FF", onTertiary: "#FFFFFF", tertiaryContainer: "rgba(136,85,255,.08)", onTertiaryContainer: "#AA88FF",
    error: "#F24A58", onError: "#FFFFFF", errorContainer: "rgba(242,74,88,.15)", onErrorContainer: "#F24A58",
    // settingsContainerBackground #111; cards #111 with a white 8% hairline.
    background: "#111111", onBackground: "#FFFFFF",
    surface: "#111111", onSurface: "#FFFFFF", surfaceVariant: "#1F1F1F", onSurfaceVariant: "#CCCCCC",
    surfaceDim: "#171717", surfaceBright: "#2E2E2E",
    surfaceContainerLowest: "#111111", surfaceContainerLow: "#161616", surfaceContainer: "#1A1A1A",
    surfaceContainerHigh: "#1F1F1F", surfaceContainerHighest: "#262626", nested: "#111111",
    inverseSurface: "#FFFFFF", inverseOnSurface: "#111111",
    outline: "#999999", outlineVariant: "rgba(255,255,255,.07)", shadow: "#000000", scrim: "#000000", surfaceTint: "#0099FF",
    surfaceCard: "#111111", surfaceCardInset: "#1F1F1F", surfaceCardHover: "#161616",
    dialog: "#111111", overlay: "#242424", modal: "#1F1F1F", tooltip: "#242424",
    textStrong: "#FFFFFF", textBody: "#FFFFFF", textMuted: "#888888", textPlaceholder: "#999999", textDisabled: "#777777",
    surface2: "#262626", surface3: "#2E2E2E", surface4: "#444444",
    brand: BRAND, onBrand: "#FFFFFF", brandContainer: "rgba(0,153,255,.15)", onBrandContainer: "#0099FF",
    brandBlue: "#0099FF",
    control: "rgba(255,255,255,.06)", hover: "rgba(255,255,255,.06)", pressed: "rgba(255,255,255,.09)",
    border: "rgba(255,255,255,.07)", borderSubtle: "rgba(255,255,255,.05)", borderStrong: "rgba(255,255,255,.1)",
    outlineBorder: "rgba(255,255,255,.1)", outlineBorderHover: "rgba(255,255,255,.15)", outlineHover: "rgba(255,255,255,.05)",
    focus: "#0099FF", field: "rgba(255,255,255,.06)", fieldHover: "rgba(255,255,255,.09)", fieldBorder: "transparent", fieldActive: "#0099FF", fieldError: "#F55B5B",
    disabledFill: "#333333",
    track: "#444444", trackSelected: "#555555", sliderRest: "#2B2B2B",
    backdrop: "rgba(0,0,0,.7)",
    ctrl: "rgba(255,255,255,.06)", ctrlHover: "rgba(255,255,255,.09)", ctrlPressed: "rgba(255,255,255,.12)", ctrlBorder: "transparent", ctrlBorderHover: "transparent",
    chosen: "rgba(0,153,255,.15)", chosenText: "#0099FF",
    segment: "#3B3B3B", segmentText: "#FFFFFF", segmentIdle: "#999999",
    menuHover: "#2E2E2E", menuCheck: "#999999", menuSeparator: "#333333", chevron: "#666666",
    checkbox: "rgba(255,255,255,.08)", pillText: "#999999", selection: "rgba(255,255,255,.15)", loader: "#181818", scrollbar: "#555555",
    cardBorder: "rgba(255,255,255,.08)", cardBorderHover: "rgba(255,255,255,.14)",
    toast: "#2E2E2E", onToast: "#FFFFFF",
  },
};
// Success and warning (not M3 core roles), in the same four roles as a key colour:
// pillSuccess (#0B8 on #00BB881A) and warningTint (#EB9D28, dark #F5BC66). In light, text on the
// tints is a deeper step (≥ 4.5:1); in dark the base hue already reads on its tint.
const NEUTRAL_CUSTOM = {
  light: {
    success: { color: "#00BB88", onColor: "#FFFFFF", container: "rgba(0,187,136,.1)", onContainer: "#00805B" },
    warning: { color: "#EB9D28", onColor: "#FFFFFF", container: "rgba(235,157,40,.1)", onContainer: "#9E5F00" },
  },
  dark: {
    success: { color: "#00BB88", onColor: "#FFFFFF", container: "rgba(0,187,136,.12)", onContainer: "#00BB88" },
    warning: { color: "#F5BC66", onColor: "#111111", container: "rgba(245,188,102,.1)", onContainer: "#F5BC66" },
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
