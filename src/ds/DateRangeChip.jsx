import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Icon } from "./Icon";

/**
 * Filter chip with a menu for a date range: "Any date" until a range is picked, then the range
 * (selected look, with a clear button). `from` / `to` are dayjs or null.
 */
export function DateRangeChip({ from, to, onChange, timezone, label = "Date" }) {
  const [anchor, setAnchor] = useState(null);
  const [draft, setDraft] = useState({ from: null, to: null });
  const on = !!(from || to);
  const fmt = (d) => d.format(d.year() === new Date().getFullYear() ? "MMM D" : "MMM D, YYYY");
  const text = !on ? label : from && to ? `${fmt(from)} – ${fmt(to)}` : from ? `From ${fmt(from)}` : `Until ${fmt(to)}`;
  const open = (e) => {
    setDraft({ from, to });
    setAnchor(e.currentTarget);
  };
  const apply = (next) => {
    onChange(next);
    setAnchor(null);
  };
  const picker = { timezone, slots: { openPickerIcon: () => <Icon name="calendar_today" size={16} /> }, slotProps: { textField: { sx: { width: { xs: "100%", sm: 180 } } }, field: { clearable: true } } };
  const invalid = draft.from && draft.to && draft.to.isBefore(draft.from, "day");
  return (
    <>
      <Chip
        label={text}
        variant={on ? "filled" : "outlined"}
        icon={<Icon name={on ? "check" : "calendar_today"} size={16} />}
        onClick={open}
        onDelete={on ? () => onChange({ from: null, to: null }) : open}
        deleteIcon={on ? <Icon name="close" size={16} aria-label={`Clear ${label.toLowerCase()}`} /> : <Icon name="keyboard_arrow_down" size={16} />}
        aria-haspopup="dialog"
        aria-expanded={!!anchor}
      />
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { mt: 1, p: 2, display: "flex", flexDirection: "column", gap: 2 } } }}
      >
        <Typography variant="titleSmall">{label}</Typography>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
          <DatePicker label="From" value={draft.from} onChange={(v) => setDraft((d) => ({ ...d, from: v }))} {...picker} />
          <DatePicker label="To" value={draft.to} minDate={draft.from ?? undefined} onChange={(v) => setDraft((d) => ({ ...d, to: v }))} {...picker} />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button variant="text" onClick={() => apply({ from: null, to: null })}>
            Clear
          </Button>
          <Button onClick={() => apply({ from: draft.from?.isValid() ? draft.from : null, to: draft.to?.isValid() ? draft.to : null })} disabled={!!invalid}>
            Apply
          </Button>
        </Box>
      </Popover>
    </>
  );
}
