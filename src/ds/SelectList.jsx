import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useTheme } from "@mui/material/styles";
import { Icon } from "./Icon";

/**
 * Single-choice list (radio rows) for pickers inside dialogs. `items` are { id, disabled? };
 * `renderItem(item)` draws the row content.
 */
export function SelectList({ items, value, onChange, renderItem, label }) {
  const { m3: c, tokens } = useTheme();
  return (
    <Box role="radiogroup" aria-label={label}>
      {items.map((item) => {
        const on = value === item.id;
        return (
          <ButtonBase
            key={item.id}
            role="radio"
            aria-checked={on}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            sx={{
              width: "100%",
              justifyContent: "flex-start",
              textAlign: "left",
              gap: 2,
              px: 3,
              py: 1.25,
              bgcolor: on ? c.secondaryContainer : "transparent",
              color: on ? c.onSecondaryContainer : c.onSurface,
              transition: `background-color ${tokens.motion.effects}`,
              "&:hover": { bgcolor: on ? c.secondaryContainer : "action.hover" },
              "&.Mui-disabled": { opacity: 0.38 },
            }}
          >
            <Icon name={on ? "radio_button_checked" : "radio_button_unchecked"} fill={on} style={{ color: on ? c.primary : c.onSurfaceVariant, flexShrink: 0 }} />
            <Box sx={{ minWidth: 0, flex: 1 }}>{renderItem(item)}</Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
