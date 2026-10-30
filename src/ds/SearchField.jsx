import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import { useTheme } from "@mui/material/styles";
import { Icon } from "./Icon";
import { radius } from "../theme/tokens";

/** Search control: 32 tall, 8px corners, the grey control fill; white with a blue edge when focused. `dense` is the full-width version inside menus. */
export function SearchField({ value, onChange, placeholder, dense = false, autoFocus, label, sx }) {
  const { m3: c } = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        height: 32,
        pl: 1.25,
        pr: 0.5,
        borderRadius: radius("sm"),
        // Savvy Admin's search box: the form fill, no line; a shade darker on hover, ink edge on focus.
        bgcolor: c.field,
        flex: dense ? "1 1 auto" : "1 1 200px",
        minWidth: dense ? 0 : 160,
        maxWidth: dense ? "none" : 320,
        transition: "background-color 150ms, box-shadow 150ms",
        "&:hover": { bgcolor: c.fieldHover },
        "&:focus-within": { bgcolor: c.field, boxShadow: `inset 0 0 0 1px ${c.fieldActive}` },
        ...sx,
      }}
    >
      <Icon name="search" size={16} style={{ color: c.onSurfaceVariant }} />
      <InputBase autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputProps={{ "aria-label": label ?? placeholder }} sx={{ flex: 1, typography: "bodyMedium", "& input": { p: 0 } }} />
      {value && (
        <IconButton size="small" aria-label="Clear search" onClick={() => onChange("")} sx={{ width: 24, height: 24, p: 0.5 }}>
          <Icon name="close" size={16} />
        </IconButton>
      )}
    </Box>
  );
}

/** `value`, settled after `ms` without changes (for search-as-you-type). */
export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
