import { useRef } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import ButtonBase from "@mui/material/ButtonBase";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "./Icon";

/**
 * Segmented list group: grey blocks stacked 2px apart, the group's outer corners 12px and the
 * corners between items 4px. Used for every add / remove collection (rounds, winners,
 * contents, slots…) and for optional add-ons switched on and off (ListSwitch).
 */
export function ListGroup({ label, children }) {
  return (
    <Box role="list" aria-label={label} sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {children}
    </Box>
  );
}

function useSegment() {
  const { m3: c, tokens } = useTheme();
  const { xs, md } = tokens.shape;
  return {
    bgcolor: c.surfaceContainerHigh,
    // Layers alternate (panel → block → nested): a group inside a block (a list item, a card) is
    // the panel colour again so it still stands apart.
    "[role='listitem'] &, .MuiCard-root .MuiCard-root &, .MuiDrawer-paper .MuiCard-root &, .MuiDialog-paper .MuiCard-root &": { bgcolor: c.nested },
    // By position, not element type (the add row is a button, the items are divs): large corners
    // where there is no neighbour, small ones between items. Sibling selectors, not :first-child.
    borderRadius: `${md}px`,
    "* + &": { borderTopLeftRadius: xs, borderTopRightRadius: xs },
    "&:has(+ *)": { borderBottomLeftRadius: xs, borderBottomRightRadius: xs },
  };
}

/**
 * One segment. The first row holds `leading`, the main content (`title` / `supporting`, or
 * `children` for inline fields) and `trailing`; `below` opens under it (e.g. an add-on's fields).
 */
export function ListItem({ leading, leadingControl, title, supporting, trailing, children, below, onClick, error, sortable }) {
  const segment = useSegment();
  const { m3: c, tokens } = useTheme();
  // A clickable item (opens its editor): leading + text are one button; trailing and
  // `leadingControl` (a radio, a checkbox) stay outside it.
  const main = (
    <>
      {leading && <Box sx={{ display: "flex", flexShrink: 0, mt: children ? 1 : 0 }}>{leading}</Box>}
      <Box sx={{ flex: 1, minWidth: 0, py: children ? 1 : 0, textAlign: "left" }}>
        {title && (
          <Typography variant="bodyMedium" component="div" noWrap={!!onClick} sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
        )}
        {(error || supporting) && (
          <Typography variant="bodySmall" color={error ? "error" : "text.secondary"} component="div" noWrap={!!onClick}>
            {error || supporting}
          </Typography>
        )}
        {children}
      </Box>
    </>
  );
  const { sx: dragSx, ...dragProps } = sortable ?? {};
  const lastBelow = useRef(below);
  if (below) lastBelow.current = below;
  const shownBelow = below ?? lastBelow.current;
  return (
    <Box
      role="listitem"
      {...dragProps}
      sx={{
        ...dragSx,
        ...segment,
        px: 1.5,
        py: 1,
        ...(onClick && { transition: `background-color ${tokens.motion.effects}`, "&:hover": { bgcolor: c.hover } }),
      }}
    >
      <Box sx={{ display: "flex", alignItems: children ? "flex-start" : "center", gap: 1.5, minHeight: 32 }}>
        {/* An icon button (drag handle) puts its glyph on the 12px icon line. */}
        {leadingControl && <Box sx={{ display: "flex", flexShrink: 0, "& > .MuiIconButton-root": { ml: "-6px" } }}>{leadingControl}</Box>}
        {onClick ? (
          <ButtonBase onClick={onClick} sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 1.5, my: -1, py: 1, ml: leadingControl ? -1 : -1.5, pl: leadingControl ? 1 : 1.5, mr: -1.5, pr: 1.5, borderRadius: "inherit", "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: -2 } }}>
            {main}
          </ButtonBase>
        ) : (
          main
        )}
        {trailing && <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0, mt: children ? 1 : 0 }}>{trailing}</Box>}
      </Box>
      {/* An add-on's fields slide open and shut (the last fields stay while it closes). */}
      <Collapse in={!!below} unmountOnExit timeout={220}>
        <Box sx={{ pt: 1, pb: 1, display: "flex", flexDirection: "column", gap: 2 }}>{shownBelow}</Box>
      </Collapse>
    </Box>
  );
}

/** Last segment of a collection: adds an item. */
export function ListAdd({ label, onClick, disabled }) {
  const segment = useSegment();
  const { m3: c, tokens } = useTheme();
  return (
    <ButtonBase
      role="listitem"
      onClick={onClick}
      disabled={disabled}
      sx={{
        ...segment,
        justifyContent: "flex-start",
        gap: 1.5,
        px: 1.5,
        minHeight: 44,
        color: disabled ? "text.disabled" : c.onSurface,
        typography: "labelLarge",
        transition: `background-color ${tokens.motion.effects}`,
        "&:hover": { bgcolor: c.hover },
        "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: -2 },
      }}
    >
      <Icon name="add" size={20} />
      {label}
    </ButtonBase>
  );
}

/** Optional add-on: a switch turns it on, and its fields open under it. */
export function ListSwitch({ icon, title, supporting, checked, onChange, disabled, children }) {
  const { m3: c } = useTheme();
  return (
    <ListItem
      leading={icon && <Icon name={icon} size={20} style={{ color: c.onSurfaceVariant }} />}
      title={title}
      supporting={supporting}
      trailing={<Switch checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} slotProps={{ input: { "aria-label": title } }} />}
      below={checked ? children : null}
    />
  );
}
