import { useRef } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "./Icon";

const HEX = /^#[0-9A-Fa-f]{6}$/;
// Readable mark (check) on a swatch: dark on light colours, white on dark ones.
const onColour = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "#1b1b1f" : "#ffffff";
};

/**
 * Colour choice the way Material 3 apps pick colours (Android "Wallpaper & style"): a row of round
 * swatches, the chosen one ringed with a check. `colors` are { value, label } (value `null` is the
 * default); the last swatch picks any colour. `value` is "#RRGGBB" or null.
 */
export function ColorSwatches({ label, value, onChange, colors, defaultColor, helperText }) {
  const { m3: c, tokens } = useTheme();
  const picker = useRef(null);
  const known = colors.some((o) => (o.value ?? null) === (value ?? null));
  const custom = !known && HEX.test(value ?? "") ? value : null;
  const swatch = (key, fill, selected, tip, onClick, children) => (
    <Tooltip key={key} title={tip}>
      <ButtonBase
        onClick={onClick}
        aria-label={tip}
        aria-pressed={selected}
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          bgcolor: fill,
          color: fill && HEX.test(fill) ? onColour(fill) : c.onSurfaceVariant,
          border: fill ? "none" : `1px solid ${c.outline}`,
          // Selected: a ring in the gap around the swatch.
          boxShadow: selected ? `0 0 0 3px ${c.surfaceContainerLow}, 0 0 0 5px ${c.focus}` : "none",
          transition: `box-shadow ${tokens.motion.effects}`,
          "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: 4 },
        }}
      >
        {children}
      </ButtonBase>
    </Tooltip>
  );
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {label && (
        <Typography variant="labelLarge" color="text.secondary" component="div">
          {label}
        </Typography>
      )}
      <Box role="radiogroup" aria-label={label} sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, py: 0.75, px: 0.75, mx: -0.75 }}>
        {colors.map((o) => {
          const fill = o.value ?? defaultColor;
          const on = (o.value ?? null) === (value ?? null);
          return swatch(o.label, fill, on, o.label, () => onChange(o.value ?? null), on && <Icon name="check" size={20} />);
        })}
        {swatch(
          "custom",
          custom,
          !!custom,
          custom ? `Custom ${custom}` : "Custom colour",
          () => picker.current?.click(),
          custom ? <Icon name="check" size={20} /> : <Icon name="palette" size={20} />,
        )}
        <Box component="input" ref={picker} type="color" tabIndex={-1} aria-hidden value={custom ?? defaultColor} onChange={(e) => onChange(e.target.value.toUpperCase())} sx={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }} />
      </Box>
      {(custom || helperText) && (
        <Typography variant="bodySmall" color="text.secondary" component="div">
          {custom ? `Custom ${custom}` : helperText}
        </Typography>
      )}
    </Box>
  );
}
