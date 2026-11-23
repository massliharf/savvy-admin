import Box from "@mui/material/Box";
import { alpha, keyframes, useTheme } from "@mui/material/styles";
import { radius } from "../theme/tokens";
import { Icon } from "./Icon";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: .35; }
`;

/**
 * Small pill. `tone`: neutral (outlined, so it reads on any surface) | primary | success | warning |
 * error | live; `live` is the strong red
 * "on air" look with a pulsing dot. `on` tints it from a surface's content colour instead (for
 * pills on coloured cards). `leading` (e.g. an 18px avatar) sits flush at the start; `icon` (a
 * Material Symbol name) sits inside the pill's padding, like the text.
 */
export function Pill({ tone = "neutral", on, leading, icon, children }) {
  const { m3: c, palette } = useTheme();
  const [bg, fg] = on ? [alpha(on, 0.12), on] : {
    // Savvy Admin badges: soft fills, no line. Neutral is the meta-chip grey (surface-2).
    neutral: [c.surface2, c.onSurface],
    // Informational blue ("Default", "Upcoming"): the info tint, never the solid "chosen" blue.
    primary: [c.primaryContainer, c.onPrimaryContainer],
    success: [palette.success.container, palette.success.onContainer],
    warning: [palette.warning.container, palette.warning.onContainer],
    error: [c.errorContainer, c.onErrorContainer],
    live: [c.error, c.onError],
  }[tone];
  return (
    <Box
      component="span"
      sx={{ display: "inline-flex", alignItems: "center", gap: icon ? 0.5 : 0.75, height: 20, pl: leading ? 0.25 : icon ? 0.75 : 1, pr: 1, maxWidth: "100%", borderRadius: radius("full"), bgcolor: bg, border: "none", boxSizing: "border-box", color: fg, typography: "labelMedium", whiteSpace: "nowrap", flexShrink: 0 }}
    >
      {tone === "live" && <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "currentColor", animation: `${pulse} 1.6s ease-in-out infinite` }} />}
      {leading}
      {icon && <Icon name={icon} size={14} />}
      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        {children}
      </Box>
    </Box>
  );
}
