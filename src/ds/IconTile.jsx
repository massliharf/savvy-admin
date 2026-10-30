import Box from "@mui/material/Box";
import { alpha, useTheme } from "@mui/material/styles";
import { CATEGORY, CATEGORY_DARK } from "../theme/scheme";
import { shape } from "../theme/tokens";
import { Icon } from "./Icon";

/** Corner radius for a square tile, avatar or image of `size` px (Savvy Admin: 6 small, 8 up to 48, then 12, 16). */
export const cornerFor = (size) => (size <= 28 ? 6 : size <= 48 ? shape.sm : size <= 72 ? shape.md : shape.lg);

/**
 * Rounded square with an icon (or an image, or a short `label` such as a number) on a container
 * colour. `tone` is a colour role family (primary, tertiary, error, success; secondary and surface are
 * the neutral grey tile, since the blue tint means "where you are") or
 * a category colour (violet, blue, green, teal, rose, sand): the icon in it on a 10% tile.
 */
export function IconTile({ icon, label, tone = "secondary", size = 40, src, fill = false, sx }) {
  const { m3: c, palette } = useTheme();
  const cap = tone[0].toUpperCase() + tone.slice(1);
  const dark = palette.mode === "dark";
  // Savvy Admin's app tiles: the icon in the category colour on a 10% tile of it; neutral tiles are
  // the "Stock" tile (ink at 10%, ink icon).
  const cat = CATEGORY[tone] && (dark ? CATEGORY_DARK[tone] : CATEGORY[tone]);
  const colors = cat ? { bg: alpha(cat, 0.1), fg: cat } : tone === "surface" || tone === "secondary" ? { bg: dark ? "rgba(250,250,250,.1)" : "rgba(16,16,16,.1)", fg: c.onSurface } : tone === "success" ? { bg: c.success.container, fg: c.success.onContainer } : { bg: c[`${tone}Container`], fg: c[`on${cap}Container`] };
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: `${cornerFor(size)}px`,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        overflow: "hidden",
        bgcolor: colors.bg,
        color: colors.fg,
        typography: "labelLarge",
        ...sx,
      }}
    >
      {src ? (
        <Box component="img" src={src} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : label != null ? (
        label
      ) : (
        <Icon name={icon} size={Math.max(16, Math.round(size * 0.45))} fill={fill} />
      )}
    </Box>
  );
}
