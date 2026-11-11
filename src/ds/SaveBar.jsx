import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Slide from "@mui/material/Slide";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { radius } from "../theme/tokens";
import { useUnsavedGuard } from "../shell/unsaved";

/**
 * Floating toast (Savvy Admin's white pill with the overlay shadow) for settings-style pages; appears
 * while there are unsaved changes.
 */
export function SaveBar({ dirty, saving, onSave, onDiscard, guard = true }) {
  // Leaving the page with unsaved changes asks first.
  useUnsavedGuard(guard && dirty);
  const { m3: c, tokens } = useTheme();
  return (
    <Slide direction="up" in={dirty} mountOnEnter unmountOnExit>
      <Box
        role="region"
        aria-label="Unsaved changes"
        sx={{
          position: "sticky",
          // Above the snackbar area (and the bottom navigation bar on phones).
          bottom: { xs: 168, sm: 88 },
          zIndex: 4,
          mx: "auto",
          mt: 2,
          width: "fit-content",
          maxWidth: "100%",
          display: "flex",
          alignItems: "center",
          gap: 1,
          minHeight: 48,
          pl: 2.5,
          pr: 1,
          borderRadius: radius("full"),
          bgcolor: c.surfaceContainerLowest,
          color: c.onSurface,
          border: `1px solid ${c.border}`,
          boxShadow: tokens.elevation[2],
        }}
      >
        <Typography variant="bodyMedium" sx={{ mr: 1, whiteSpace: "nowrap" }}>
          Unsaved changes
        </Typography>
        <Button variant="text" onClick={onDiscard} disabled={saving}>
          Discard
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </Box>
    </Slide>
  );
}
