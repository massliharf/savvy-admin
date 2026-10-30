import { useState } from "react";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { Icon } from "./Icon";

/**
 * Overflow (⋮) menu. `items` are { label, icon, onClick, tone?, divider?, hidden?, sx? }; `divider`
 * draws a line above the item, `tone="error"` colours destructive ones.
 */
export function ActionMenu({ items, label = "More actions", edge, color }) {
  const [anchor, setAnchor] = useState(null);
  const shown = items.filter((i) => !i.hidden);
  return (
    <>
      <Tooltip title="More">
        <IconButton
          aria-label={label}
          edge={edge}
          sx={color ? { color } : undefined}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setAnchor(e.currentTarget);
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Icon name="more_vert" size={20} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {shown.flatMap((item, i) => [
          item.divider && i > 0 ? <Divider key={`d${i}`} /> : null,
          <MenuItem
            key={item.label}
            onClick={() => {
              setAnchor(null);
              item.onClick();
            }}
            sx={{ ...(item.tone === "error" ? { color: "error.main" } : {}), ...item.sx }}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
          </MenuItem>,
        ])}
      </Menu>
    </>
  );
}
