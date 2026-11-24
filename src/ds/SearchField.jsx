import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import { useTheme } from "@mui/material/styles";
import { Icon } from "./Icon";
import { radius } from "../theme/tokens";

/** Search control (Framer style): 30 tall, 8px corners, the 5% input fill, a grey leading icon 8px in and 6px from the text; a tint edge when focused. `dense` is the full-width version inside menus. */
export function SearchField({ value, onChange, placeholder, dense = false, autoFocus, label, sx }) {
  const { m3: c } = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        height: 30,
        pl: 1,
        pr: 0.5,
        borderRadius: radius("sm"),
        // Framer input: the 5% fill, no line; 7% on hover, a tint edge on focus.
        bgcolor: c.field,
        flex: dense ? "1 1 auto" : "1 1 200px",
        minWidth: dense ? 0 : 160,
        maxWidth: dense ? "none" : 320,
        transition: "background-color 120ms, box-shadow 120ms",
        "&:hover": { bgcolor: c.fieldHover },
        "&:focus-within": { bgcolor: c.field, boxShadow: `inset 0 0 0 1px ${c.fieldActive}` },
        ...sx,
      }}
    >
      <Icon name="search" size={16} style={{ color: c.outline }} />
      <InputBase autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputProps={{ "aria-label": label ?? placeholder }} sx={{ flex: 1, typography: "bodyMedium", "& input": { p: 0 } }} />
      {value && (
        <IconButton size="small" aria-label="Clear search" onClick={() => onChange("")} sx={{ width: 20, height: 20, p: 0.25, borderRadius: "5px" }}>
          <Icon name="close" size={14} />
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
