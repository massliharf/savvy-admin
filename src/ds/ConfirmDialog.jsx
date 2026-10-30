import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

/**
 * Confirmation dialog. `tone="error"` for destructive actions. Text children are wrapped as the
 * supporting text; pass `content` for anything else (fields, lists).
 */
export function ConfirmDialog({ open, title, children, content, confirmLabel, tone = "primary", busy = false, disabled = false, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      {(children || content) && (
        <DialogContent>
          {children && <DialogContentText component="div">{children}</DialogContentText>}
          {content}
        </DialogContent>
      )}
      <DialogActions>
        <Button variant="text" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button color={tone === "error" ? "error" : "primary"} onClick={onConfirm} disabled={busy || disabled}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
