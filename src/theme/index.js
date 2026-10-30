import { alpha, createTheme } from "@mui/material/styles";
import { buildScheme } from "./scheme";
import { elevation, FONT, motion, shape, state, typeScale } from "./tokens";
import { componentOverrides } from "./components";

export { ACCENT, BRAND, CATEGORY } from "./scheme";
export { shape, motion, elevation, state, typeScale, layer } from "./tokens";

export function createAppTheme({ dark }) {
  const c = buildScheme(dark);

  const theme = createTheme({
    palette: {
      mode: dark ? "dark" : "light",
      primary: { main: c.primary, contrastText: c.onPrimary, container: c.primaryContainer, onContainer: c.onPrimaryContainer },
      secondary: { main: c.secondary, contrastText: c.onSecondary, container: c.secondaryContainer, onContainer: c.onSecondaryContainer },
      tertiary: { main: c.tertiary, contrastText: c.onTertiary, container: c.tertiaryContainer, onContainer: c.onTertiaryContainer },
      error: { main: c.error, contrastText: c.onError, container: c.errorContainer, onContainer: c.onErrorContainer },
      success: { main: c.success.color, contrastText: c.success.onColor, container: c.success.container, onContainer: c.success.onContainer },
      warning: { main: c.warning.color, contrastText: c.warning.onColor, container: c.warning.container, onContainer: c.warning.onContainer },
      info: { main: c.primary, contrastText: c.onPrimary, container: c.primaryContainer, onContainer: c.onPrimaryContainer },
      text: { primary: c.onSurface, secondary: c.onSurfaceVariant, disabled: alpha(c.onSurface, state.disabled) },
      divider: c.border,
      background: { default: c.surface, paper: c.overlay },
      action: {
        active: c.onSurfaceVariant,
        // Neutral washes from the scheme, the same on every surface.
        hover: c.hover,
        hoverOpacity: state.hover,
        selected: c.pressed,
        selectedOpacity: state.focus,
        focus: c.pressed,
        focusOpacity: state.focus,
        disabled: alpha(c.onSurface, state.disabled),
        disabledBackground: alpha(c.onSurface, state.disabledContainer),
        disabledOpacity: state.disabled,
        activatedOpacity: state.pressed,
      },
    },
    shape: { borderRadius: 4 },
    shadows: [elevation[0], elevation[1], elevation[2], elevation[3], ...Array(21).fill(elevation[4])],
    typography: {
      fontFamily: FONT,
      ...typeScale,
      h1: typeScale.displaySmall,
      h2: typeScale.headlineLarge,
      h3: typeScale.headlineMedium,
      h4: typeScale.headlineSmall,
      h5: typeScale.titleLarge,
      h6: typeScale.titleMedium,
      subtitle1: typeScale.titleMedium,
      subtitle2: typeScale.titleSmall,
      body1: typeScale.bodyLarge,
      body2: typeScale.bodyMedium,
      caption: typeScale.bodySmall,
      overline: typeScale.overline,
      button: { ...typeScale.labelLarge, textTransform: "none" },
    },
    transitions: { easing: { easeInOut: motion.emphasized, easeOut: motion.emphasized } },
  });

  theme.m3 = c;
  theme.tokens = { shape, motion, elevation, state };
  theme.components = componentOverrides(theme);
  return theme;
}
