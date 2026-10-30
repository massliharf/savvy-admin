import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { Icon } from "./Icon";

// Picking from fixed options is never a text field (that reads as "type here"). Like Audience,
// a choice is a small label over its control: a connected button group for a few options
// (ChoiceGroup), a button that opens a menu for longer or pictured lists (SelectButton).

function Labelled({ label, error, helperText, children, sx }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.75, minWidth: 0, ...sx }}>
      {label && (
        <Typography variant="labelLarge" color="text.secondary" component="div">
          {label}
        </Typography>
      )}
      {children}
      {(error || helperText) && (
        <Typography variant="bodySmall" color={error ? "error" : "text.secondary"} component="div">
          {error || helperText}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Button showing the current choice (with its icon or picture) that opens a menu of `options`
 * ({ value, label, leading? }). For lists too long or too pictured for a button group.
 */
export function SelectButton({ label, value, options, onChange, error, helperText, disabled, placeholder = "Choose", size, sx, "aria-label": ariaLabel }) {
  const [anchor, setAnchor] = useState(null);
  const current = options.find((o) => o.value === value);
  return (
    <Labelled label={label} error={error} helperText={helperText} sx={sx}>
      <Button
        variant="tonal"
        size={size}
        color={error ? "error" : "primary"}
        disabled={disabled}
        onClick={(e) => setAnchor(e.currentTarget)}
        endIcon={<Icon name="keyboard_arrow_down" />}
        aria-haspopup="listbox"
        aria-expanded={!!anchor}
        aria-label={ariaLabel ?? (label ? `${label}: ${current?.label ?? placeholder}` : undefined)}
        // The control box (opaque, lined), value then ⌄ at the end.
        sx={{ maxWidth: "100%", justifyContent: "flex-start", px: 1.5, fontWeight: 500, ...(!error && { bgcolor: (t) => t.m3.ctrl, color: "text.primary", boxShadow: (t) => `inset 0 0 0 1px ${t.m3.ctrlBorder}`, "&:hover": { bgcolor: (t) => t.m3.ctrlHover, boxShadow: (t) => `inset 0 0 0 1px ${t.m3.ctrlBorderHover}` } }), "& .MuiButton-endIcon": { ml: "auto", pl: 1, color: "text.secondary" } }}
      >
        {current?.leading && <Box sx={{ display: "inline-flex", flexShrink: 0, mr: 1 }}>{current.leading}</Box>}
        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current?.label ?? placeholder}
        </Box>
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} slotProps={{ list: { role: "listbox", "aria-label": label ?? ariaLabel, dense: false }, paper: { sx: { maxHeight: 360, minWidth: 200 } } }}>
        {options.map((o) => (
          <MenuItem
            key={o.value}
            role="option"
            aria-selected={o.value === value}
            selected={o.value === value}
            onClick={() => {
              setAnchor(null);
              onChange(o.value);
            }}
          >
            {o.leading && <ListItemIcon>{o.leading}</ListItemIcon>}
            <ListItemText>{o.label}</ListItemText>
            {o.value === value && <Icon name="check" size={16} style={{ marginLeft: 16 }} />}
          </MenuItem>
        ))}
      </Menu>
    </Labelled>
  );
}

/** A few options (2–6) as a connected button group; `options` are { value, label, icon?, leading? }. */
export function ChoiceGroup({ label, value, options, onChange, error, helperText, disabled, sx }) {
  return (
    <Labelled label={label} error={error} helperText={helperText} sx={sx}>
      <ToggleButtonGroup
        exclusive
        value={value ?? null}
        onChange={(_, v) => v !== null && onChange(v)}
        aria-label={label}
        disabled={disabled}
        sx={{ flexWrap: "wrap", maxWidth: "100%" }}
      >
        {options.map((o) => (
          <ToggleButton key={o.value} value={o.value}>
            {o.leading ?? (o.icon && <Icon name={o.icon} size={16} />)}
            {o.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Labelled>
  );
}

/**
 * A choice, the one way it looks everywhere: up to six options as a connected button group, more
 * as a button that opens the list. `end` sits right after it (an edit button for a library pick).
 */
export function Choice({ options, end, ...props }) {
  const control = options.length <= 6 ? <ChoiceGroup options={options} {...props} /> : <SelectButton options={options} {...props} value={props.value ?? ""} />;
  if (!end) return control;
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, flexWrap: "wrap" }}>
      {control}
      <Box sx={{ mb: props.error || props.helperText ? 3.5 : 0 }}>{end}</Box>
    </Box>
  );
}

/** The edit button next to a library pick (host, sponsor): outlined, the same height as the group. */
export function EditButton({ label, onClick }) {
  return (
    <Tooltip title={label}>
      <IconButton aria-label={label} onClick={onClick} sx={(t) => ({ bgcolor: t.m3.ctrl, "&:hover": { bgcolor: t.m3.ctrlHover } })}>
        <Icon name="edit" size={16} />
      </IconButton>
    </Tooltip>
  );
}
