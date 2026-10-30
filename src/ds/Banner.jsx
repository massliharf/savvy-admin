import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "./Icon";

/**
 * Info or warning strip for something worth knowing on a page or in a form (where prices come
 * from, what can't be undone), with a leading icon and an optional `action` on the right.
 * `tone`: info — a clean card with the blue icon (Savvy Admin's banner; inside a card it takes the
 * block tone) | warning | error — their tinted containers.
 */
export function Banner({ tone = "info", icon, action, children }) {
  const { m3: c, palette, tokens } = useTheme();
  // Info is a quiet note: an icon and secondary text, no block. Only warnings and errors get a
  // filled block, so a block always means "look at this".
  if (tone === "info") {
    return (
      <Box role="note" sx={{ display: "flex", alignItems: "center", gap: 1, color: c.onSurfaceVariant }}>
        <Icon name={icon ?? "info"} size={16} style={{ flexShrink: 0 }} />
        <Typography variant="bodySmall" component="div" sx={{ flex: 1, minWidth: 0 }}>
          {children}
        </Typography>
        {action}
      </Box>
    );
  }
  const look = {
    info: { bgcolor: c.surfaceCard, color: c.onSurface, icon: c.onSurfaceVariant, ".MuiCard-root &, .MuiDrawer-paper &, .MuiDialog-paper &": { bgcolor: c.surfaceContainerHigh } },
    warning: { bgcolor: palette.warning.container, color: palette.warning.onContainer, icon: "inherit" },
    error: { bgcolor: c.errorContainer, color: c.onErrorContainer, icon: "inherit" },
  }[tone];
  const { icon: iconColor, ...surface } = look;
  return (
    <Box role={tone === "info" ? "note" : "alert"} sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2, py: 1.25, minHeight: 44, borderRadius: `${tokens.shape.md}px`, ...surface }}>
      <Icon name={icon ?? (tone === "info" ? "info" : "warning")} size={18} style={{ flexShrink: 0, color: iconColor }} />
      <Typography variant="bodyMedium" component="div" sx={{ flex: 1, minWidth: 0 }}>
        {children}
      </Typography>
      {action}
    </Box>
  );
}
