import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useTheme } from "@mui/material/styles";

/**
 * Single-choice list (radio rows) for pickers inside dialogs. `items` are { id, disabled? };
 * `renderItem(item)` draws the row content; `centered` centres the radio (rows that lead with a picture).
 *
 * Framer style, like a menu inside the dialog: the list is inset 5px / 10px so each row's text lines
 * up with the dialog title (20px); rows have 8px corners, 8px / 10px padding and a 10px gap; hover
 * is the menu hover (#F2F2F2). The choice is the 14px Framer radio (tint ring, white centre); the
 * chosen row gets no fill.
 */
export function SelectList({ items, value, onChange, renderItem, label, centered = false }) {
  const { m3: c, tokens } = useTheme();
  return (
    <Box role="radiogroup" aria-label={label} sx={{ display: "flex", flexDirection: "column", px: "10px", py: "5px" }}>
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
              // The radio sits on the row's first line (the title); `centered` rows lead with a
              // picture, so the radio centres on it instead.
              alignItems: centered ? "center" : "flex-start",
              textAlign: "left",
              gap: "10px",
              px: "10px",
              py: 1,
              borderRadius: `${tokens.shape.sm}px`,
              color: on ? c.textStrong : c.textBody,
              transition: `background-color ${tokens.motion.effectsFast}`,
              "&:hover": { bgcolor: c.menuHover },
              "&.Mui-focusVisible": { bgcolor: c.menuHover, outline: `1.5px solid ${c.focus}`, outlineOffset: -1.5 },
              "&.Mui-disabled": { opacity: 0.4 },
            }}
          >
            <Box
              component="span"
              aria-hidden
              sx={{
                width: 14,
                height: 14,
                mt: centered ? 0 : "1.5px",
                flexShrink: 0,
                borderRadius: "50%",
                boxSizing: "border-box",
                bgcolor: on ? "#FFFFFF" : c.surfaceCard,
                boxShadow: on ? `inset 0 0 0 4px ${c.primary}` : tokens.fx.ring,
                transition: `box-shadow ${tokens.motion.effectsFast}`,
              }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>{renderItem(item)}</Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
