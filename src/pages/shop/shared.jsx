// Shared bits for the Shop section: sparks amount, reorder arrows, list rows, inline visibility,
// and the read-only overview parts of the item sheets.
import { useState } from "react";
import { useUpdate } from "@refinedev/core";
import { Link } from "react-router";
import Box from "@mui/material/Box";
import CardActionArea from "@mui/material/CardActionArea";
import Card from "@mui/material/Card";
import ButtonBase from "@mui/material/ButtonBase";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { cornerFor } from "../../ds/IconTile";
import { shape } from "../../theme/tokens";
import { useNotify } from "../../shell/notifications";
import { CardCorner } from "../../ds/CardCorner";

export function Sparks({ value, variant = "bodyMedium", iconSize = 16 }) {
  const { m3: c } = useTheme();
  return (
    <Typography variant={variant} component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
      <Icon name="auto_awesome" size={iconSize} style={{ color: c.tertiary }} />
      {Number(value ?? 0).toLocaleString()}
    </Typography>
  );
}

const stop = (e) => e.stopPropagation();

/**
 * Moves a row to another place. The backend swaps a row with whichever one holds the sort slot it
 * is given, so a move of several places is a run of swaps with the next neighbour, replayed on a
 * local copy of the order. `toValues(row, sortOrder)` builds the request body for this resource.
 */
export function useReorder({ resource, dataProviderName, rows, toValues }) {
  const notify = useNotify();
  const { mutateAsync } = useUpdate();
  const [moving, setMoving] = useState(null);
  const moveTo = async (from, to) => {
    if (from === to || !rows[from] || !rows[to]) return;
    const order = rows.map((r) => ({ ...r }));
    const dir = to > from ? 1 : -1;
    setMoving(order[from].id);
    try {
      for (let i = from; i !== to; i += dir) {
        const row = order[i];
        const next = order[i + dir];
        const target = next.sortOrder !== row.sortOrder ? next.sortOrder : row.sortOrder + dir;
        await mutateAsync({ resource, dataProviderName, id: row.id, values: toValues(row, target), successNotification: false, invalidates: i + dir === to ? ["list"] : [] });
        [next.sortOrder, row.sortOrder] = [row.sortOrder, target];
        [order[i], order[i + dir]] = [next, row];
      }
    } catch {
      notify("Couldn't change the order", { variant: "error" });
    } finally {
      setMoving(null);
    }
  };
  return { moving, moveTo };
}



/** Inline "shown in the Shop" switch for a list row. */
export function VisibilitySwitch({ checked, disabled, onChange, label }) {
  return (
    <Tooltip title={checked ? "Shown in the Shop" : "Hidden from the Shop"}>
      <Box onClick={stop} onMouseDown={stop} sx={{ display: "flex", alignItems: "center" }}>
        <Switch checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} inputProps={{ "aria-label": `Show ${label} in the Shop` }} />
      </Box>
    </Tooltip>
  );
}

/** Clickable list row with consistent padding, hover and dividers. */
export { useDragSort } from "../../ds/DragSort";

export function ListRow({ onClick, children, columns, sortable }) {
  const { m3: c } = useTheme();
  const { sx: dragSx, ...dragProps } = sortable ?? {};
  return (
    <ButtonBase
      component="div"
      onClick={onClick}
      {...dragProps}
      sx={{
        ...dragSx,
        display: "grid",
        gridTemplateColumns: columns,
        alignItems: "center",
        columnGap: 2,
        width: "100%",
        px: 2,
        py: 1.5,
        textAlign: "left",
        "&:hover": { bgcolor: "action.hover" },
        "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: -2 },
        "&:not(:last-of-type)": { borderBottom: `1px solid ${c.outlineVariant}` },
      }}
    >
      {children}
    </ButtonBase>
  );
}

// Cards / list switch: the one in the design system (also used by Streams).
export { ViewToggle } from "../../ds/ViewToggle";

/** Grid the cards sit in: compact horizontal cards, two or three across. */
export function CardGrid({ children, min = 320, className }) {
  return <Box className={className} sx={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`, gap: { xs: 1.5, sm: 2 } }}>{children}</Box>;
}

const MEDIA = 88;

/**
 * An item as a compact horizontal card: an 88px picture (wider for `aspect` other than square;
 * `media` replaces it), then the title, details and pills. The top-right corner holds (packs) the
 * shop switch and the drag grip, on the title's line. The same card for swag, packs, hosts,
 * sponsors and game modes.
 */
export function ShopCard({ image, icon, media, aspect = "1 / 1", title, meta, pills, end, reorder, onOpen, sortable }) {
  const { m3: c, tokens } = useTheme();
  const { sx: dragSx, ...dragProps } = sortable ?? {};
  const [w, h] = aspect.split("/").map(Number);
  const mediaWidth = Math.round((MEDIA * w) / h);
  const inset = 8;
  // Room on the right of the text for the corner controls.
  const corner = (end ? 40 : 0) + (reorder ? 32 : 0);
  return (
    // The whole card is the click target, so its hover covers all of it (cards in a row share a height).
    // Every card is exactly as tall as its picture plus the inset, so cards in a grid line up
    // whatever their text; extra lines are clipped rather than stretching the row.
    <Card {...dragProps} sx={{ position: "relative", height: MEDIA + inset * 2, ...dragSx }}>
      <CardActionArea onClick={onOpen} sx={{ height: "100%", overflow: "hidden", display: "flex", alignItems: "stretch", justifyContent: "flex-start", gap: 2, p: `${inset}px`, pr: `${12 + corner}px` }}>
        <Box sx={{ width: mediaWidth, height: MEDIA, flexShrink: 0, borderRadius: `${tokens.shape.lg - inset}px`, overflow: "hidden", bgcolor: c.surfaceContainerHigh }}>
          {media ?? <Thumb src={image} size="100%" radius={0} icon={icon} />}
        </Box>
        {/* Lines never squash: each shows whole or not at all (the card clips below its picture). */}
        <Box sx={{ flex: 1, minWidth: 0, py: 0.5, display: "flex", flexDirection: "column", gap: 0.5, "& > *": { flexShrink: 0 } }}>
          <Typography variant="titleMedium" component="h3" noWrap>
            {title}
          </Typography>
          {meta}
          {pills && <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: "auto", pt: 0.5 }}>{pills}</Box>}
        </Box>
      </CardActionArea>
      {(end || reorder) && (
        <CardCorner>
          {end}
          {reorder}
        </CardCorner>
      )}
    </Card>
  );
}

export function Thumb({ src, size = 48, icon = "image", radius }) {
  const { m3: c } = useTheme();
  const [broken, setBroken] = useState(false);
  const px = typeof size === "number";
  return (
    <Box sx={{ width: size, height: size, borderRadius: radius ?? (px ? `${cornerFor(size)}px` : `${shape.lg}px`), overflow: "hidden", flexShrink: 0, bgcolor: c.surfaceCardInset, color: c.onSurfaceVariant, display: "grid", placeItems: "center" }}>
      {src && !broken ? <Box component="img" src={src} alt="" onError={() => setBroken(true)} sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon name={icon} size={px ? Math.round(size / 2) : 40} />}
    </Box>
  );
}

/** Titled group in a read-only detail sheet; `action` sits at the right of the title. */
export function SheetSection({ title, action, children }) {
  // Savvy Admin panel section: an upper-case label over its controls; sections after the first are
  // set off by a hairline.
  return (
    <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1.5, "section + &": { borderTop: 1, borderColor: "divider", pt: 2.5 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 20 }}>
        <Typography variant="overline" component="h3" color="text.secondary" sx={{ flex: 1 }}>
          {title}
        </Typography>
        {action}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>{children}</Box>
    </Box>
  );
}

/** Label / value line in a detail sheet. */
export function InfoRow({ label, children, mono = false }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "120px minmax(0, 1fr)", columnGap: 2, alignItems: "baseline" }}>
      <Typography variant="bodySmall" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="bodyMedium" component="div" sx={{ minWidth: 0, overflowWrap: "anywhere", ...(mono ? { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" } : {}) }}>
        {children ?? "—"}
      </Typography>
    </Box>
  );
}

/** Overview / Edit tabs at the top of a Shop item's sheet (new items only have Edit). */
export function SheetTabs({ value, onChange }) {
  return (
    <Tabs value={value} onChange={(_, v) => onChange(v)} sx={{ mx: -3, mt: -1.5, px: 1.5, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
      <Tab value="overview" label="Overview" />
      <Tab value="edit" label="Edit" />
    </Tabs>
  );
}

/** Two or three numbers side by side at the top of an overview. */
export function StatRow({ children }) {
  const { m3: c } = useTheme();
  // Outlined, since the cards sit on the sheet's own surface colour.
  return <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 1.5, "& > .MuiCard-root": { border: `1px solid ${c.outlineVariant}` } }}>{children}</Box>;
}

/** One line of a "recent" list: who, when, and a value or status at the end. */
export function RecentRow({ title, to, detail, end }) {
  const { m3: c } = useTheme();
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, "&:not(:last-of-type)": { borderBottom: `1px solid ${c.outlineVariant}` } }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="labelLarge" noWrap component={to ? Link : "div"} to={to} sx={{ display: "block", color: "inherit", textDecoration: "none", "&:hover": to ? { textDecoration: "underline" } : undefined }}>
          {title}
        </Typography>
        <Typography variant="bodySmall" color="text.secondary" noWrap component="div">
          {detail}
        </Typography>
      </Box>
      {end}
    </Box>
  );
}
