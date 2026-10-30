// Pieces shared by the Hosts and Sponsors library pages.
import { useState } from "react";
import { useCreate, useDelete, useUpdate } from "@refinedev/core";
import { SearchField } from "../../ds/SearchField";
import { PageToolbar } from "../../ds/Page";
import { ConfirmDialog } from "../../ds/ConfirmDialog";
import { useNotify } from "../../shell/notifications";

export function LibraryToolbar({ query, onQuery, placeholder, actionLabel, onAction }) {
  return (
    <PageToolbar search={<SearchField value={query} onChange={onQuery} placeholder={placeholder} />} actionLabel={actionLabel} onAction={onAction} />
  );
}

/**
 * Create / update / delete for one library collection, with server validation errors mapped onto
 * the form (`setError`) and snackbars for the outcome.
 */
export function useLibraryMutations({ resource, dataProviderName, noun }) {
  const notify = useNotify();
  const { mutateAsync: create, isPending: creating } = useCreate();
  const { mutateAsync: update, isPending: updating } = useUpdate();
  const { mutateAsync: remove } = useDelete();
  const common = { resource, dataProviderName, successNotification: false, errorNotification: false };

  const save = async (id, values, setError) => {
    try {
      const res = id ? await update({ ...common, id, values }) : await create({ ...common, values });
      notify(id ? `${noun} saved` : `${noun} added`);
      return res.data;
    } catch (e) {
      const errors = e?.response?.data?.errors ?? e?.response?.data?.ValidationErrors;
      if (errors) Object.entries(errors).forEach(([field, msgs]) => setError(field, { message: msgs.join(" ") }));
      else notify(`Couldn't save the ${noun.toLowerCase()}`, { variant: "error" });
      return null;
    }
  };
  const destroy = async (id, label, message) => {
    await remove({ ...common, id });
    notify(message ?? `“${label}” deleted`);
  };
  return { save, destroy, saving: creating || updating };
}

export function ConfirmDelete({ open, title, confirmLabel = "Delete", children, onCancel, onConfirm }) {
  return (
    <ConfirmDialog open={open} title={title} tone="error" confirmLabel={confirmLabel} onCancel={onCancel} onConfirm={onConfirm}>
      {children}
    </ConfirmDialog>
  );
}

/** Sheet open state: `null` closed, `{}` new record, a record to edit. */
export function useSheet() {
  const [record, setRecord] = useState(null);
  return { record, open: record !== null, openNew: () => setRecord({}), openEdit: setRecord, close: () => setRecord(null) };
}
