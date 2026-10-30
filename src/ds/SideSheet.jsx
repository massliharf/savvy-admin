import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Icon } from "./Icon";

/**
 * Modal side sheet for creating and editing small records.
 * `actions` sit in the footer on the right; `footerStart` (e.g. a delete button) on the left.
 * `headerActions` (icon buttons about the record itself, like "Open user") sit before Close.
 * Every sheet is one width (520), so moving between records never shifts the panel.
 */
export function SideSheet({ open, onClose, title, subtitle, children, actions, footerStart, headerActions }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 520 }, maxWidth: "100%", borderRadius: { xs: 0, sm: undefined } } } }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 2.5, pr: 1.5, pt: 2, pb: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="headlineSmall" component="h2" noWrap>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="bodySmall" color="text.secondary" noWrap component="div">
                {subtitle}
              </Typography>
            )}
          </Box>
          {headerActions}
          <Tooltip title="Close">
            <IconButton aria-label="Close" onClick={onClose}>
              <Icon name="close" size={20} />
            </IconButton>
          </Tooltip>
        </Box>
        <Box
          component="form"
          autoComplete="off"
          onSubmit={(e) => e.preventDefault()}
          sx={{ flex: 1, overflowY: "auto", scrollbarGutter: "stable", px: 2.5, pt: 1, pb: 2.5, display: "flex", flexDirection: "column", gap: 2 }}
        >
          {children}
        </Box>
        {(actions || footerStart) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 1.5, borderTop: 1, borderColor: "divider" }}>
            {footerStart}
            <Box sx={{ flex: 1 }} />
            {actions}
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
