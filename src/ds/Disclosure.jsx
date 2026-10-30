import { useState } from "react";
import ButtonBase from "@mui/material/ButtonBase";
import Collapse from "@mui/material/Collapse";
import { useTheme } from "@mui/material/styles";
import { Icon } from "./Icon";

/** "Show more" toggle that reveals a block of optional fields underneath. */
export function Disclosure({ label, children, defaultOpen = true }) {
  const { m3: c, tokens } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <ButtonBase
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        sx={{ alignSelf: "flex-start", gap: 1, mx: -1, px: 1, py: 0.75, borderRadius: `${tokens.shape.sm}px`, typography: "labelLarge", color: c.onSurface, "&:hover": { bgcolor: "action.hover" } }}
      >
        <Icon name={open ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={16} />
        {label}
      </ButtonBase>
      <Collapse in={open} unmountOnExit>
        {children}
      </Collapse>
    </>
  );
}
