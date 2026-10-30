import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import { radius } from "../theme/tokens";

// Loading placeholders shaped like what they stand in for, so the page doesn't jump when data
// lands: a card grid of horizontal cards and a list of rows.

const line = (width, height = 12) => <Skeleton variant="rounded" width={width} height={height} sx={{ borderRadius: radius("xs") }} />;

/** A grid of horizontal cards (media on the left, title and two lines), like ShopCard. */
export function CardsSkeleton({ count = 6, media = 88, min = 320, label = "Loading" }) {
  return (
    <Box role="status" aria-label={label} sx={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`, gap: { xs: 1.5, sm: 2 } }}>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} sx={{ display: "flex", gap: 1.5, p: 1 }}>
          <Skeleton variant="rounded" width={media} height={media} sx={{ flexShrink: 0, borderRadius: radius("sm") }} />
          <Box sx={{ flex: 1, minWidth: 0, py: 0.5, display: "flex", flexDirection: "column", gap: 1 }}>
            {line("55%", 14)}
            {line("35%")}
            {line("25%")}
          </Box>
        </Card>
      ))}
    </Box>
  );
}

/**
 * Rows inside a card, like a table or list: an optional leading circle (avatar) or square
 * (thumbnail), two lines of text, and a trailing pill.
 */
export function RowsSkeleton({ count = 6, lead = "circle", height = 64, trailing = true, label = "Loading" }) {
  return (
    <Box role="status" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, minHeight: height, "&:not(:last-of-type)": { borderBottom: 1, borderColor: "divider" } }}>
          {lead && <Skeleton variant={lead === "circle" ? "circular" : "rounded"} width={32} height={32} sx={{ flexShrink: 0, borderRadius: lead === "circle" ? "50%" : radius("sm") }} />}
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.75 }}>
            {line(`${40 + ((i * 17) % 25)}%`, 13)}
            {line(`${22 + ((i * 11) % 15)}%`, 11)}
          </Box>
          {trailing && <Skeleton variant="rounded" width={64} height={22} sx={{ borderRadius: radius("full"), flexShrink: 0 }} />}
        </Box>
      ))}
    </Box>
  );
}
