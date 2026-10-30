import { Fragment } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { Icon } from "./Icon";

/**
 * Row of filter chips. `options` are { id, label, group? }; a divider separates groups.
 * `selected` is the list of selected ids. For a single choice pass `[value]` and set it in `onToggle`.
 * `onClear` shows a Clear button while something is selected. `children` (e.g. a DateRangeChip)
 * follow the options after a divider.
 */
export function FilterChips({ options, selected, onToggle, onClear, label = "Filters", children }) {
  return (
    <Box role="group" aria-label={label} sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
      {options.map((o, i) => {
        const on = selected.includes(o.id);
        const divider = i > 0 && options[i - 1].group !== o.group;
        return (
          <Fragment key={o.id ?? "all"}>
            {/* Group dividers only on wider screens, where the row doesn't wrap mid-group. */}
            {divider && <Box aria-hidden sx={{ display: { xs: "none", sm: "block" }, width: "1px", height: 20, bgcolor: "divider", mx: 0.5 }} />}
            <Chip label={o.label} variant={on ? "filled" : "outlined"} icon={on ? <Icon name="check" size={16} /> : undefined} onClick={() => onToggle(o.id)} aria-pressed={on} />
          </Fragment>
        );
      })}
      {children && (
        <>
          <Box aria-hidden sx={{ display: { xs: "none", sm: "block" }, width: "1px", height: 20, bgcolor: "divider", mx: 0.5 }} />
          {children}
        </>
      )}
      {onClear && selected.length > 0 && (
        <Button variant="tonal" size="small" onClick={onClear}>
          Clear
        </Button>
      )}
    </Box>
  );
}
