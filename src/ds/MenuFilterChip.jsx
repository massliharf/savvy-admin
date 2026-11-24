import { useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Icon } from "./Icon";
import { SearchField } from "./SearchField";
import { MenuCheck } from "./MenuCheck";

/**
 * M3 filter chip with a menu (multi-select). `options` are { id, label }; `selected` the chosen
 * ids. Unselected it reads "Game mode ▾"; with one pick it shows that pick, with more "Game mode · 2".
 * `single` closes the menu on a pick (a one-of filter); `searchable` adds a search field on top of
 * a long list (regions). `groups` ({ id: title }) splits one menu into titled groups by each
 * option's `group`, so several filters can share one chip.
 */
export function MenuFilterChip({ label, options, selected, onToggle, onClear, single, searchable, groups }) {
  const [anchor, setAnchor] = useState(null);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? options.filter((o) => String(o.label).toLowerCase().includes(q)) : options;
  const picked = options.filter((o) => selected.includes(o.id));
  const on = picked.length > 0;
  const text = !on ? label : picked.length === 1 ? picked[0].label : `${label} · ${picked.length}`;
  const open = (e) => {
    setQuery("");
    setAnchor(e.currentTarget);
  };
  return (
    <>
      <Chip
        label={text}
        variant={on ? "filled" : "outlined"}
        // Chosen = the soft accent fill alone (the menu holds the checkmarks); the chevron takes the
        // chip's colour so the chosen chip reads as one piece.
        sx={on ? { "& .MuiChip-deleteIcon, & .MuiChip-deleteIcon:hover": { color: "inherit" } } : undefined}
        onClick={open}
        onDelete={open}
        deleteIcon={<Icon name="keyboard_arrow_down" size={16} />}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        aria-label={on ? `${label}: ${picked.map((o) => o.label).join(", ")}` : `Filter by ${label.toLowerCase()}`}
      />
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} autoFocus={!searchable} slotProps={{ list: { "aria-label": label, dense: false }, paper: { sx: { maxHeight: 420, minWidth: 224 } } }}>
        {/* The search stays on top while the list scrolls under it: the same search as pages. */}
        {searchable && (
          <Box sx={{ position: "sticky", top: -6, zIndex: 1, mt: -0.75, mx: -0.75, px: 0.75, pt: 0.75, pb: 0.75, bgcolor: (t) => t.m3.overlay }} onKeyDown={(e) => e.stopPropagation()}>
            <SearchField dense autoFocus value={query} onChange={setQuery} placeholder="Search" label={`Search ${label.toLowerCase()}`} sx={{ maxWidth: "none", flex: "none" }} />
          </Box>
        )}
        {shown.map((o, i) => {
          const checked = selected.includes(o.id);
          const title = groups && o.group !== shown[i - 1]?.group ? groups[o.group] : null;
          return [
            // Groups after the first start with a separator, then their heading (GUU menus).
            title && i > 0 && <Divider key={`d-${o.group}`} />,
            title && <ListSubheader key={`g-${o.group}`}>{title}</ListSubheader>,
            <MenuItem
              key={o.id}
              onClick={() => {
                onToggle(o.id);
                if (single) setAnchor(null);
              }}
              role={single ? "menuitemradio" : "menuitemcheckbox"}
              aria-checked={checked}
              selected={checked}
            >
              {/* Chosen: the checkmark at the end, like every menu (no fill, no empty icon column). */}
              <ListItemText>{o.label}</ListItemText>
              {checked && <MenuCheck />}
            </MenuItem>,
          ];
        })}
        {on && <Divider />}
        {on && (
          <MenuItem
            onClick={() => {
              onClear();
              setAnchor(null);
            }}
          >
            <ListItemIcon>
              <Icon name="close" size={16} />
            </ListItemIcon>
            <ListItemText>Clear</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
