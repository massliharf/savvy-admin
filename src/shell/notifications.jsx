import { forwardRef, useCallback } from "react";
import { SnackbarContent, SnackbarProvider, useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import GlobalStyles from "@mui/material/GlobalStyles";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { Icon } from "../ds/Icon";
import { radius } from "../theme/tokens";

// M3 snackbar: inverse surface, one or two lines, optional text action and close button.
const Snackbar = forwardRef(function Snackbar({ id, message, variant, description, actionLabel, onAction }, ref) {
  const { closeSnackbar } = useSnackbar();
  const { m3: c } = useTheme();
  return (
    <SnackbarContent ref={ref} role={variant === "error" ? "alert" : "status"}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          minHeight: 48,
          width: { xs: "calc(100vw - 32px)", sm: "auto" },
          minWidth: { sm: 344 },
          maxWidth: 560,
          pl: 2,
          pr: 1,
          py: 0.75,
          borderRadius: radius("xs"),
          bgcolor: c.inverseSurface,
          color: c.inverseOnSurface,
          boxShadow: (t) => t.tokens.elevation[3],
        }}
      >
        {variant === "error" && <Icon name="error" size={20} style={{ color: c.inverseError }} />}
        <Box sx={{ flex: 1, py: 0.5 }}>
          <Typography variant="bodyMedium" component="div">
            {message}
          </Typography>
          {description && (
            <Typography variant="bodySmall" component="div" sx={{ opacity: 0.8 }}>
              {description}
            </Typography>
          )}
        </Box>
        {actionLabel && (
          <Button
            variant="text"
            onClick={() => {
              onAction?.();
              closeSnackbar(id);
            }}
            sx={{ color: c.inversePrimary, "&:hover": { bgcolor: alpha(c.inverseOnSurface, 0.08) } }}
          >
            {actionLabel}
          </Button>
        )}
        <IconButton size="small" aria-label="Dismiss" onClick={() => closeSnackbar(id)} sx={{ color: c.inverseOnSurface }}>
          <Icon name="close" size={20} />
        </IconButton>
      </Box>
    </SnackbarContent>
  );
});

const COMPONENTS = { default: Snackbar, success: Snackbar, error: Snackbar, warning: Snackbar, info: Snackbar };

export function SnackbarHost({ children }) {
  return (
    <>
      {/* On phones, keep snackbars above the bottom navigation bar. */}
      <GlobalStyles styles={(t) => ({ [t.breakpoints.down("sm")]: { ".notistack-SnackbarContainer": { bottom: "96px !important" } } })} />
      <SnackbarProvider
        Components={COMPONENTS}
        maxSnack={3}
        autoHideDuration={5000}
        preventDuplicate
        disableWindowBlurListener
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {children}
      </SnackbarProvider>
    </>
  );
}

/** `notify("Saved", { actionLabel: "Undo", onAction, variant: "error", description })` */
export function useNotify() {
  const { enqueueSnackbar } = useSnackbar();
  return useCallback((message, options = {}) => enqueueSnackbar(message, options), [enqueueSnackbar]);
}

// Refine notification provider routed into the same snackbar.
export function useNotificationProvider() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  return {
    open: ({ message, description, type, key, undoableTimeout, cancelMutation }) => {
      if (type === "progress") {
        enqueueSnackbar(message, {
          key,
          autoHideDuration: (undoableTimeout ?? 5) * 1000,
          actionLabel: "Undo",
          onAction: cancelMutation,
        });
        return;
      }
      enqueueSnackbar(message, { key, variant: type, description: description !== message ? description : undefined });
    },
    close: (key) => closeSnackbar(key),
  };
}
