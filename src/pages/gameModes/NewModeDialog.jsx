import { useEffect, useState } from "react";
import { useCreate } from "@refinedev/core";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { DP } from "../../providers";

/** A new bundle: a name. It starts as a copy of the first bundle; its settings open next. */
export function NewModeDialog({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const { mutateAsync: create, isPending } = useCreate();

  useEffect(() => {
    if (open) {
      setName("");
      setError(null);
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!name.trim()) return setError("Enter a name");
    try {
      const res = await create({ resource: "Bundle", dataProviderName: DP.bundles, values: { name: name.trim() }, successNotification: false, errorNotification: false, invalidates: ["list"] });
      onCreated(res.data);
    } catch (e) {
      setError(e?.errors?.name?.[0] ?? e?.response?.data?.errors?.name?.[0] ?? e?.message ?? "Couldn't create the game set");
    }
  };

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>New game set</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <TextField
          label="Name"
          value={name}
          autoFocus
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          error={!!error}
          helperText={error ?? "How the game set is called in the admin, e.g. Cash game · Savvy Showdown."}
          inputProps={{ maxLength: 40 }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={isPending}>
          {isPending ? "Creating…" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
