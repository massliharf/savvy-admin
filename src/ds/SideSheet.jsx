import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Icon } from "./Icon";
import { ConfirmDialog } from "./ConfirmDialog";
import { useUnsavedGuard } from "../shell/unsaved";

/**
 * Modal side sheet for creating and editing small records.
 * `actions` sit in the footer on the right; `footerStart` (e.g. a delete button) on the left.
 * `headerActions` (icon buttons about the record itself, like "Open user") sit before Close.
 * `dirty` (the form has unsaved edits) makes closing ask first.
 * Every sheet is one width (520), so moving between records never shifts the panel.
 */
export function SideSheet({ open, onClose, onBack, title, subtitle, children, actions, footerStart, headerActions, instant, dirty = false }) {
  // With unsaved edits (`dirty`), closing with ✕, Esc, the backdrop or Back asks first, and so
  // does leaving the page; the sheet's own Cancel button is the deliberate way to drop them.
  const [asking, setAsking] = useState(null);
  const edited = open && dirty;
  const skipNext = useUnsavedGuard(edited);
  const guarded = (run) => () => (edited ? setAsking(() => run) : run());
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={guarded(onClose)}
      // `instant`: one view of a sheet swapping to another (one sheet's views), no slide.
      transitionDuration={instant ? 0 : undefined}
      // The paper never scrolls (only the form inside does): otherwise wheel or focus scrolling
      // could push the whole sheet, header and footer included, up and leave a blank area below.
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 520 }, maxWidth: "100%", borderRadius: { xs: 0, sm: undefined }, overflow: "clip" } } }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: onBack ? 1 : 2.5, pr: 1.5, pt: 2, pb: 1.5 }}>
          {onBack && (
            <Tooltip title="Back">
              <IconButton aria-label="Back" onClick={guarded(onBack)}>
                <Icon name="arrow_back" size={20} />
              </IconButton>
            </Tooltip>
          )}
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
            <IconButton aria-label="Close" onClick={guarded(onClose)}>
              <Icon name="close" size={20} />
            </IconButton>
          </Tooltip>
        </Box>
        <Box
          component="form"
          autoComplete="off"
          onSubmit={(e) => e.preventDefault()}
          sx={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", scrollbarGutter: "stable", px: 2.5, pt: 1, pb: 2.5, display: "flex", flexDirection: "column", gap: 2 }}
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
      <ConfirmDialog
        open={!!asking}
        title="Discard changes?"
        tone="error"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onCancel={() => setAsking(null)}
        onConfirm={() => {
          const run = asking;
          setAsking(null);
          // Already confirmed here: a sheet whose close changes the page doesn't ask twice.
          skipNext();
          run();
        }}
      >
        Your changes haven't been saved and will be lost.
      </ConfirmDialog>
    </Drawer>
  );
}
