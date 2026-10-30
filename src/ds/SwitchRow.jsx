import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

/** Setting row: label and supporting text on the left, a switch on the right. */
export function SwitchRow({ label, description, checked, onChange, disabled }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="bodyMedium" component="div" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        {description && (
          <Typography variant="bodySmall" color="text.secondary" component="div">
            {description}
          </Typography>
        )}
      </Box>
      <Switch checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} slotProps={{ input: { "aria-label": label } }} />
    </Box>
  );
}
