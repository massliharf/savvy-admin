import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "./Icon";
import { IconTile } from "./IconTile";

/**
 * A number at a glance: label, value and an optional line of detail. `icon` adds a tile in `tone`;
 * `emphasized` fills the card with the accent container for the one number that needs action.
 * `detailTone="warning"` flags the detail line. With `onClick` it's a selectable card (a filter):
 * `selected` fills it with the secondary container.
 */
export function StatCard({ label, value, detail, detailTone, icon, tone = "secondary", emphasized = false, onClick, selected = false }) {
  const { m3: c, tokens } = useTheme();
  const layout = {
    p: { xs: 1.5, sm: 2 },
    display: "flex",
    flexDirection: { xs: "column", md: "row" },
    alignItems: { xs: "flex-start", md: "center" },
    justifyContent: "flex-start",
    gap: { xs: 1, md: 2 },
  };
  // Selected (a stat used as a filter) is Savvy Admin's chosen-filter surface-3; emphasized is the blue tint.
  const filled = selected ? { bgcolor: c.chosen, color: c.onSurface } : emphasized ? { bgcolor: c.primaryContainer, color: c.onPrimaryContainer, boxShadow: `inset 0 0 0 1px ${c.primary}40` } : {};
  const body = (
    <>
      {icon && <IconTile icon={icon} tone={tone} />}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="labelLarge" component="div" sx={{ color: emphasized || selected ? "inherit" : "text.secondary" }}>
          {label}
        </Typography>
        <Typography variant="headlineSmall" component="div">
          {value}
        </Typography>
        {detail && (
          <Typography variant="bodySmall" component="div" color={detailTone === "warning" ? "warning.main" : emphasized || selected ? "inherit" : "text.secondary"} sx={{ display: { xs: "none", sm: "block" } }}>
            {detail}
          </Typography>
        )}
      </Box>
      {selected && <Icon name="check" size={20} style={{ marginLeft: "auto", alignSelf: "flex-start" }} />}
    </>
  );
  if (!onClick) return <Card sx={{ ...layout, ...filled }}>{body}</Card>;
  return (
    <Card sx={{ ...filled, transition: `background-color ${tokens.motion.effects}` }}>
      <CardActionArea onClick={onClick} aria-pressed={selected} sx={{ ...layout, height: "100%" }}>
        {body}
      </CardActionArea>
    </Card>
  );
}
