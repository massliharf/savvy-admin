import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "./Icon";

/**
 * Centered line icon + title + one line of description (Savvy Admin), with optional actions underneath.
 * `compact` is the smaller version used inside a section or card.
 */
export function EmptyState({ icon, title, description, children, compact = false }) {
  const { m3: c } = useTheme();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", py: compact ? 4 : 10, px: 2, gap: 0.5 }}>
      <Icon name={icon} size={compact ? 20 : 24} style={{ color: c.onSurfaceVariant, marginBottom: 8 }} />
      <Typography variant={compact ? "titleMedium" : "headlineSmall"} component={compact ? "h3" : "h2"}>
        {title}
      </Typography>
      {description && (
        <Typography variant="bodySmall" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {children && <Box sx={{ display: "flex", gap: 1, mt: 2 }}>{children}</Box>}
    </Box>
  );
}
