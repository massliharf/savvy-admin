import { useEffect, useState } from "react";
import { useCustomMutation, useOne, useUpdate } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { Icon } from "../../ds/Icon";
import { useNotify } from "../../shell/notifications";
import { ConfirmDialog } from "../../ds/ConfirmDialog";
import { showTitle } from "./hosts";

/** Shows, copies, edits and regenerates the RTMP stream key of a stream. */
export function StreamKeyDialog({ stream, onClose }) {
  const open = !!stream;
  const id = stream?.id;
  const notify = useNotify();
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState("");
  const [visible, setVisible] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const { data, isFetching } = useOne({ resource: "TextSavvyStream/stream-key", id, queryOptions: { enabled: open } });
  useEffect(() => {
    if (data?.data != null) {
      setKey(data.data);
      setSaved(data.data);
    }
  }, [data]);
  useEffect(() => {
    if (open) setVisible(false);
  }, [open]);

  const { mutateAsync: update, isPending: saving } = useUpdate({ resource: "TextSavvyStream/stream-key", invalidates: ["detail"] });
  const { mutateAsync: regenerate, isPending: regenerating } = useCustomMutation();
  const busy = isFetching || saving || regenerating;

  const save = async () => {
    await update({ id, values: { streamKey: key }, meta: { method: "patch", json: true }, successNotification: false });
    setSaved(key);
    notify("Stream key saved");
  };
  const doRegenerate = async () => {
    setConfirm(false);
    const res = await regenerate({
      url: `/TextSavvyStream/stream-key/${id}/regenerate`,
      method: "post",
      values: {},
      successNotification: false,
      errorNotification: { message: "Couldn't regenerate the stream key", type: "error" },
    });
    setKey(res.data);
    setSaved(res.data);
    setVisible(true);
    notify("New stream key generated");
  };
  const copy = async () => {
    await navigator.clipboard?.writeText(key);
    notify("Stream key copied");
  };

  return (
    <>
      <Dialog open={open && !confirm} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Stream key</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <DialogContentText>
            Paste this key into the streaming software for “{showTitle(stream)}”. Anyone with the key can broadcast to this stream.
          </DialogContentText>
          <TextField
            label="Stream key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={busy}
            type={visible ? "text" : "password"}
            autoComplete="off"
            slotProps={{
              input: {
                sx: { fontFamily: visible ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined },
                endAdornment: (
                  <InputAdornment position="end">
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title={visible ? "Hide" : "Show"}>
                        <IconButton aria-label={visible ? "Hide key" : "Show key"} onClick={() => setVisible((v) => !v)}>
                          <Icon name={visible ? "visibility_off" : "visibility"} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy">
                        <IconButton aria-label="Copy key" onClick={copy} disabled={!key}>
                          <Icon name="content_copy" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between" }}>
          <Button variant="text" color="error" onClick={() => setConfirm(true)} disabled={busy} startIcon={<Icon name="autorenew" />}>
            Regenerate
          </Button>
          <Box sx={{ display: "flex", gap: 1 }}>
            {key !== saved ? (
              <>
                <Button variant="text" onClick={() => setKey(saved)} disabled={busy}>
                  Discard
                </Button>
                <Button onClick={save} disabled={busy || !key}>
                  Save key
                </Button>
              </>
            ) : (
              <Button variant="text" onClick={onClose}>
                Done
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={open && confirm} title="Regenerate stream key?" tone="error" confirmLabel="Regenerate" onCancel={() => setConfirm(false)} onConfirm={doRegenerate}>
        The current key stops working right away. Streaming software using it will need the new key.
      </ConfirmDialog>
    </>
  );
}
