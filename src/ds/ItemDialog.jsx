import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { ListGroup, ListItem } from "./ListGroup";

/**
 * Edits one part of a form (a list item, an optional reward…) in a dialog. The dialog's fields
 * write straight into the page's form under `path`; Cancel puts back what was there, or for a new
 * item calls its `discard` (remove it, switch it off). `form` is { getValues, setValue, trigger }.
 * `path` can also be a list of field names, for an item stored as flat fields (lobbyOpenTitle…).
 * `open(path, revert)` takes an extra undo for state kept outside `path` (a picked icon file).
 */
export function useItemEditor(form) {
  const [editing, setEditing] = useState(null); // { path, snapshot, revert, discard }
  // A copy: getValues hands back the form's own object, which the fields then change.
  const open = (path, revert) => setEditing({ path, snapshot: structuredClone(form.getValues(path)), revert });
  const add = (path, discard) => setEditing({ path, discard });
  const cancel = () => {
    if (editing.discard) editing.discard();
    else {
      if (Array.isArray(editing.path)) editing.path.forEach((p, i) => form.setValue(p, editing.snapshot[i], { shouldDirty: true }));
      else form.setValue(editing.path, editing.snapshot, { shouldDirty: true });
      editing.revert?.();
    }
    setEditing(null);
  };
  const done = async () => {
    if (await form.trigger(editing.path)) setEditing(null);
  };
  return { path: editing?.path ?? null, isNew: !!editing?.discard, open, add, cancel, done };
}

/** The dialog for useItemEditor. `children(path)` renders the fields of what's being edited. */
export function ItemDialog({ editor, title, children }) {
  const isOpen = editor.path !== null;
  return (
    <Dialog open={isOpen} onClose={editor.cancel} maxWidth="sm" fullWidth>
      <DialogTitle>{typeof title === "function" ? isOpen && title(editor.path) : title}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>{isOpen && children(editor.path)}</DialogContent>
      <DialogActions>
        <Button variant="text" onClick={editor.cancel}>
          Cancel
        </Button>
        <Button onClick={editor.done}>{editor.isNew ? "Add" : "Done"}</Button>
      </DialogActions>
    </Dialog>
  );
}

/** First error message under `path` (a name or a list of names) in react-hook-form's error tree. */
export function firstError(errors, path) {
  for (const p of [].concat(path)) {
    let e = p.split(".").reduce((o, k) => o?.[k], errors);
    while (e && !e.message && typeof e === "object") e = Object.values(e).find(Boolean);
    if (e?.message) return e.message;
  }
  return null;
}

/**
 * A fixed set of form parts (share cards, notifications…), each edited right where it is: a
 * segment with its title, then its fields, and its `preview` beside them on wide screens.
 * `items` are { key, title, path, fields(path) → fields, preview?(path) → node }.
 */
export function EditRows({ label, items }) {
  return (
    <ListGroup label={label}>
      {items.map((item) => (
        <ListItem key={item.key} title={item.title}>
          <Box sx={{ display: "grid", gridTemplateColumns: item.preview ? { xs: "1fr", sm: "160px minmax(0, 1fr)" } : "1fr", alignItems: "start", gap: 2, mt: 1.5, mb: 0.5 }}>
            {item.preview?.(item.path)}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 }}>{item.fields(item.path)}</Box>
          </Box>
        </ListItem>
      ))}
    </ListGroup>
  );
}
