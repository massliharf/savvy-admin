import { useEffect, useState } from "react";
import { useCreate } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ChoiceGroup } from "../../ds/SelectButton";
import { DP } from "../../providers";
import { GAME_MODES } from "../streams/gameModes";

/**
 * A new game mode: a name and the game it plays (TextChain or SubText rules). It starts with that
 * game's settings; its logo, word sets, time slots and defaults are set on the Game modes page.
 */
export function NewModeDialog({ open, onClose, onCreated }) {
  const games = Object.values(GAME_MODES).filter((m) => !m.custom);
  const [name, setName] = useState("");
  const [base, setBase] = useState(games[0].id);
  const [error, setError] = useState(null);
  const { mutateAsync: create, isPending } = useCreate();

  useEffect(() => {
    if (open) {
      setName("");
      setBase(games[0].id);
      setError(null);
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!name.trim()) return setError("Enter a name");
    try {
      const res = await create({ resource: "GameMode", dataProviderName: DP.gameModes, values: { name: name.trim(), base }, successNotification: false, errorNotification: false, invalidates: ["list"] });
      onCreated(res.data);
    } catch (e) {
      setError(e?.errors?.name?.[0] ?? e?.response?.data?.errors?.name?.[0] ?? e?.message ?? "Couldn't create the game mode");
    }
  };

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>New game mode</DialogTitle>
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
          helperText={error ?? "How the mode is called in the admin and the app, e.g. Holiday TextChain."}
          inputProps={{ maxLength: 40 }}
          sx={{ mt: 1 }}
        />
        <Box>
          <ChoiceGroup label="Plays" value={base} options={games.map((m) => ({ value: m.id, label: m.label, icon: m.icon }))} onChange={setBase} />
          <Typography variant="bodySmall" color="text.secondary" component="div" sx={{ mt: 1 }}>
            {GAME_MODES[base]?.summary} It starts with this game's settings.
          </Typography>
        </Box>
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
