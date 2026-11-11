// Library › Polls & trivia — up to 3 of each, assigned to scheduled streams; results export as CSV.
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useCreate, useDataProvider, useDelete, useList, useMany, useUpdate } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormHelperText from "@mui/material/FormHelperText";
import Radio from "@mui/material/Radio";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { StreamImage } from "../streams/parts";
import { PageToolbar } from "../../ds/Page";
import { CardCorner } from "../../ds/CardCorner";
import { ActionMenu } from "../../ds/ActionMenu";
import { StreamPickerDialog } from "../streams/pickers";
import { SideSheet } from "../../ds/SideSheet";
import { EmptyState } from "../../ds/EmptyState";
import { SearchField } from "../../ds/SearchField";
import { ChoiceGroup } from "../../ds/SelectButton";
import { CardsSkeleton, RowsSkeleton } from "../../ds/Skeletons";
import { useTimezoneFormat } from "../../contexts";
import { useNotify } from "../../shell/notifications";
import { DP, POLLS_EXPORT, downloadBlob } from "../../providers";
import { NumberInput, TextInput } from "../streams/detail/fields";
import { ConfirmDelete } from "../library/shared";
import { Pill } from "../../ds/Pill";
import {
  CSV_TYPE,
  MAX_ANSWERS,
  MAX_DURATION,
  MAX_PER_STREAM,
  MIN_ANSWERS,
  MIN_DURATION,
  assignPayload,
  createDefaults,
  exportFilename,
  formToPayload,
  isStreamFull,
  mergeCsv,
  presetToForm,
  statusLabel,
} from "./pollHelpers";
import { radius } from "../../theme/tokens";
import { ContainerCard } from "../../ds/ContainerCard";
import { EditTable, TextCell } from "../../ds/EditTable";
import { showTitle } from "../streams/hosts";

const TYPES = {
  Poll: { label: "Poll", plural: "Polls", icon: "ballot" },
  Trivia: { label: "Trivia", plural: "Trivia", icon: "quiz" },
};

// ---------------------------------------------------------------- card
/**
 * A poll or trivia question as a card, like the other library cards: click to edit, ⋮ for the
 * stream it runs in. On top: which stream (or none) and how long players get; then the answers,
 * trivia's correct one marked.
 */
/** `hidden` masks the answers (and which one is correct), e.g. while sharing the screen. */
function PresetCard({ preset, stream, hidden, onEdit, onAssign, onUnassign, onDelete }) {
  const { m3: c, palette, tokens } = useTheme();
  const { formatDate } = useTimezoneFormat();
  return (
    <Card component="article" aria-label={preset.question} sx={{ position: "relative", height: "100%" }}>
      {/* Only the question keeps clear of the ⋮ menu; the answers run the card's full width. */}
      <CardActionArea onClick={onEdit} sx={{ height: "100%", p: 2, display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start", gap: 1.5 }}>
        <Typography variant="titleMedium" sx={{ pr: 4 }}>{preset.question}</Typography>
        {/* One line: the stream it's on (a pill, it matters) or "Not assigned", then its timer. */}
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mt: -0.5 }}>
          {preset.streamId && (
            <Pill tone="primary" leading={stream && <StreamImage stream={stream} size={18} />}>
              {stream ? `${showTitle(stream)} · ${formatDate(stream.startDate, "MMM D")}` : "Assigned"}
            </Pill>
          )}
          <Typography variant="bodySmall" color="text.secondary">
            {[!preset.streamId && "Not assigned", `${preset.durationSeconds}s to answer`].filter(Boolean).join(" · ")}
          </Typography>
        </Box>
        <Box component="ol" sx={{ m: 0, p: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 0.5 }}>
          {preset.options.map((o, i) => {
            const correct = !hidden && preset.type === "Trivia" && o.optionId === preset.correctOptionId;
            return (
              <Box
                component="li"
                key={o.optionId}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mx: -1,
                  px: 1,
                  py: 0.75,
                  borderRadius: `${tokens.shape.sm}px`,
                  typography: "bodyMedium",
                  bgcolor: correct ? palette.success.container : "transparent",
                  color: correct ? palette.success.onContainer : "text.primary",
                }}
              >
                <Box component="span" sx={{ width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, typography: "labelMedium", bgcolor: correct ? "transparent" : c.surfaceCardInset, color: correct ? "inherit" : "text.secondary" }}>
                  {String.fromCharCode(65 + i)}
                </Box>
                <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
                  {hidden ? "•••••" : o.label}
                </Box>
                {correct && <Icon name="check" size={16} aria-label="Correct answer" />}
              </Box>
            );
          })}
        </Box>
      </CardActionArea>
      <CardCorner>
        <ActionMenu
          label={`Actions for ${preset.question}`}
          items={[
            { label: preset.streamId ? "Move to another stream" : "Assign to a stream", icon: "live_tv", onClick: onAssign },
            { label: "Unassign", icon: "link_off", onClick: onUnassign, hidden: !preset.streamId },
            { label: "Delete", icon: "delete", tone: "error", divider: true, onClick: onDelete },
          ]}
        />
      </CardCorner>
    </Card>
  );
}

// ---------------------------------------------------------------- editor
function PresetSheet({ state, onClose, onDelete }) {
  const notify = useNotify();
  const open = !!state;
  const preset = state?.preset;
  // A new one picks its type in the sheet; a saved one keeps it.
  const [newType, setNewType] = useState("Poll");
  const type = preset?.type ?? newType;
  const meta = TYPES[type];
  const { mutateAsync: create, isPending: creating } = useCreate();
  const { mutateAsync: update, isPending: updating } = useUpdate();
  const [serverError, setServerError] = useState(null);
  const { control, reset, handleSubmit, setValue, getValues, trigger, formState } = useForm({ defaultValues: createDefaults(type) });
  const { fields, append, remove } = useFieldArray({ control, name: "answers" });
  const answers = useWatch({ control, name: "answers" }) ?? [];
  const letter = (i) => String.fromCharCode(65 + i);
  const correct = useWatch({ control, name: "correctAnswerIndex" });

  useEffect(() => {
    if (open) {
      reset(preset ? presetToForm(preset) : createDefaults(state.type ?? "Poll"));
      setNewType(state.type ?? "Poll");
      setServerError(null);
    }
  }, [open, preset, state?.type, reset]);

  const removeAnswer = (i) => {
    const idx = getValues("correctAnswerIndex");
    remove(i);
    if (idx === i) setValue("correctAnswerIndex", null, { shouldDirty: true });
    else if (idx !== null && idx > i) setValue("correctAnswerIndex", idx - 1, { shouldDirty: true });
  };

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    const common = { resource: "Poll", dataProviderName: DP.polls, values: formToPayload({ ...values, type }, preset), successNotification: false, errorNotification: false };
    try {
      if (preset) await update({ ...common, id: preset.id });
      else await create(common);
      notify(preset ? `${meta.label} saved` : `${meta.label} added`);
      onClose();
    } catch (e) {
      setServerError(e?.message ?? "Couldn't save");
    }
  });

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      dirty={formState.isDirty}
      title={preset ? preset.question : `New ${meta.label.toLowerCase()}`}
      subtitle={preset ? meta.label : undefined}
      footerStart={
        preset && (
          <Button variant="text" color="error" onClick={() => onDelete(preset)}>
            Delete
          </Button>
        )
      }
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={creating || updating || (preset && !formState.isDirty)}>
            {preset ? "Save" : `Add ${meta.label.toLowerCase()}`}
          </Button>
        </>
      }
    >
      {!preset && (
        <ChoiceGroup
          label="Type"
          value={type}
          options={Object.entries(TYPES).map(([value, t]) => ({ value, label: t.label, icon: t.icon }))}
          onChange={(v) => {
            setNewType(v);
            setValue("correctAnswerIndex", null);
          }}
        />
      )}
      <TextInput control={control} name="question" label="Question" multiline minRows={2} rules={{ validate: (v) => (v?.trim() ? true : "Enter a question") }} />
      <NumberInput
        control={control}
        name="durationSeconds"
        label="Time to answer"
        suffix="s"
        inputProps={{ min: MIN_DURATION, max: MAX_DURATION, step: 1 }}
        helperText={`${MIN_DURATION}–${MAX_DURATION} seconds`}
        rules={{ validate: (v) => (v != null && Number.isInteger(v) && v >= MIN_DURATION && v <= MAX_DURATION ? true : `Use ${MIN_DURATION}–${MAX_DURATION} seconds`) }}
        sx={{ maxWidth: 220 }}
      />
      <Box>
        <Typography variant="labelLarge" color="text.secondary" component="div" sx={{ mb: 1 }}>
          Answers{type === "Trivia" && " · select the correct one"}
        </Typography>
        <Controller
          name="correctAnswerIndex"
          control={control}
          rules={{ validate: (v) => type !== "Trivia" || v !== null || "Select the correct answer" }}
          render={({ fieldState }) => (
            <>
              <EditTable
                label="Answers"
                columns={[
                  { header: type === "Trivia" ? "Correct" : "", width: type === "Trivia" ? "72px" : "16px", align: type === "Trivia" ? "center" : "left" },
                  { header: "Answer", width: "1fr" },
                ]}
                minWidth={280}
                // A poll's rows are just lettered answers under the "Answers" label; trivia keeps its "Correct" column head.
                header={type === "Trivia"}
                rows={fields.map((f, i) => ({
                  key: f.id,
                  onRemove: () => removeAnswer(i),
                  canRemove: fields.length > MIN_ANSWERS,
                  removeLabel: `Remove answer ${letter(i)}`,
                  cells: [
                    type === "Trivia" ? (
                      <Radio key="c" checked={correct === i} onChange={() => setValue("correctAnswerIndex", i, { shouldDirty: true, shouldValidate: true })} inputProps={{ "aria-label": `Answer ${letter(i)} is correct` }} />
                    ) : (
                      <Typography key="c" variant="bodyLarge" color="text.secondary">
                        {letter(i)}
                      </Typography>
                    ),
                    <TextCell key="a" control={control} name={`answers.${i}.label`} label={`Answer ${letter(i)}`} placeholder={`Answer ${letter(i)}`} rules={{ validate: (v) => (v?.trim() ? true : "Enter an answer") }} />,
                  ],
                }))}
                addLabel="Add answer"
                addDisabled={fields.length >= MAX_ANSWERS}
                onAdd={() => append({ label: "" })}
              />
              {fieldState.error && <FormHelperText error>{fieldState.error.message}</FormHelperText>}
            </>
          )}
        />
      </Box>
      {serverError && <FormHelperText error>{serverError}</FormHelperText>}
    </SideSheet>
  );
}

// ---------------------------------------------------------------- assign
function AssignDialog({ preset, presets, streams, onClose }) {
  const notify = useNotify();
  const { mutateAsync: update, isPending } = useUpdate();
  const count = (id) => presets.filter((p) => p.streamId === id).length;
  const save = async (stream) => {
    await update({ resource: "Poll", dataProviderName: DP.polls, id: preset.id, values: assignPayload(preset, stream.id), successNotification: false });
    notify(`Assigned to “${showTitle(stream)}”`);
    onClose();
  };
  return (
    <StreamPickerDialog
      open={!!preset}
      title="Assign to a stream"
      streams={streams}
      describe={(s) => `${count(s.id)}/${MAX_PER_STREAM} used`}
      disabledReason={(s) => (s.id === preset?.streamId ? "Already here" : preset && isStreamFull(presets, s.id, preset.id) ? `Full (${MAX_PER_STREAM}/${MAX_PER_STREAM})` : null)}
      emptyText={`Scheduled streams show here. Each holds up to ${MAX_PER_STREAM}.`}
      busy={isPending}
      onClose={onClose}
      onConfirm={save}
    />
  );
}

// ---------------------------------------------------------------- export
function ExportDialog({ open, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const notify = useNotify();
  const { formatDate } = useTimezoneFormat();
  const provider = useDataProvider()(DP.polls);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useList({ resource: "TextSavvyStream", sorters: [{ field: "startDate", order: "desc" }], pagination: { current: 1, pageSize: 100 }, queryOptions: { enabled: open } });
  const streams = (data?.data ?? []).filter((s) => showTitle(s).toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (open) {
      setSelected([]);
      setQuery("");
    }
  }, [open]);

  const run = async () => {
    const chosen = (data?.data ?? []).filter((s) => selected.includes(s.id));
    setBusy(true);
    try {
      const res = await Promise.all(chosen.map((s) => provider.custom({ url: `${POLLS_EXPORT}?streamId=${encodeURIComponent(s.id)}`, method: "get", meta: { responseType: "blob" } })));
      let blob;
      let filename;
      if (res.length === 1) ({ blob, filename } = res[0].data);
      else {
        const texts = await Promise.all(res.map((r) => r.data.blob.text()));
        blob = new Blob([mergeCsv(texts)], { type: CSV_TYPE });
        const latest = [...chosen].sort((a, b) => Date.parse(b.startDate) - Date.parse(a.startDate))[0];
        filename = exportFilename(latest.title, chosen.length, formatDate(latest.startDate, "MM-DD"));
      }
      downloadBlob(blob, filename);
      notify(`${filename} downloaded`);
      onClose();
    } catch {
      notify("Couldn't export poll results", { variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Export poll results</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <SearchField dense value={query} onChange={setQuery} placeholder="Search streams" sx={{ flex: "none" }} />
        <Box sx={{ border: `1px solid ${theme.m3.outlineVariant}`, borderRadius: radius("lg"), overflow: "auto", maxHeight: { sm: 360 } }}>
          {isLoading ? (
            <RowsSkeleton count={3} lead={false} height={56} label="Loading streams" />
          ) : streams.length === 0 ? (
            <Typography variant="bodyMedium" color="text.secondary" sx={{ p: 2 }}>
              No stream matches.
            </Typography>
          ) : (
            streams.map((s) => (
              <Box
                key={s.id}
                component="label"
                sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, py: 0.5, cursor: "pointer", bgcolor: selected.includes(s.id) ? theme.m3.secondaryContainer : "transparent", "&:not(:last-of-type)": { borderBottom: `1px solid ${theme.m3.outlineVariant}` } }}
              >
                <Checkbox checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="bodyMedium" noWrap>
                    {showTitle(s)}
                  </Typography>
                  <Typography variant="bodySmall" color="text.secondary">
                    {formatDate(s.startDate, "MMM D, YYYY · h:mm A")}
                  </Typography>
                </Box>
                <Pill>{statusLabel(s.status)}</Pill>
              </Box>
            ))
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between" }}>
        <Typography variant="bodySmall" color="text.secondary" sx={{ pl: 1 }}>
          {selected.length === 0 ? "None selected" : `${selected.length} selected`}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={run} disabled={busy || selected.length === 0} startIcon={<Icon name="download" />}>
            {busy ? "Exporting…" : "Export CSV"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------------------------------------------------- page
export default function PollsPage() {
  const notify = useNotify();
  const [editing, setEditing] = useState(null); // { type } | { preset }
  const [assigning, setAssigning] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const { mutateAsync: update } = useUpdate();
  const { mutateAsync: remove } = useDelete();

  const { data, isLoading } = useList({ resource: "Poll", dataProviderName: DP.polls, pagination: { mode: "off" } });
  const presets = useMemo(() => [...(data?.data ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [data]);
  const { data: scheduled } = useList({ resource: "TextSavvyStream", filters: [{ field: "status", operator: "eq", value: "Scheduled" }], sorters: [{ field: "startDate", order: "asc" }], pagination: { current: 1, pageSize: 100 } });
  const ids = [...new Set(presets.map((p) => p.streamId).filter(Boolean))];
  const { data: assigned } = useMany({ resource: "TextSavvyStream/list", ids, queryOptions: { enabled: ids.length > 0 } });
  const streamById = Object.fromEntries([...(scheduled?.data ?? []), ...(assigned?.data ?? [])].map((s) => [s.id, s]));

  const unassign = async (p) => {
    await update({ resource: "Poll", dataProviderName: DP.polls, id: p.id, values: assignPayload(p, null), successNotification: false });
    notify("Unassigned");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageToolbar
        search={<SearchField value={query} onChange={setQuery} placeholder="Search questions" />}
        secondary={[
          { label: hidden ? "Show answers" : "Hide answers", icon: hidden ? "visibility" : "visibility_off", onClick: () => setHidden(!hidden) },
          { label: "Export results", icon: "download", onClick: () => setExporting(true) },
        ]}
        actionLabel="New poll"
        onAction={() => setEditing({ type: "Poll" })}
      />

      {Object.entries(TYPES).map(([type, meta]) => {
        const all = presets.filter((p) => p.type === type);
        const items = term ? all.filter((p) => p.question.toLowerCase().includes(term)) : all;
        return (
          <Box component="section" key={type} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Icon name={meta.icon} />
              <Typography variant="titleMedium" component="h2">
                {meta.plural}
              </Typography>
              <Pill>{all.length}</Pill>
            </Box>
            {isLoading ? (
              <CardsSkeleton count={3} media={0} label={`Loading ${meta.plural.toLowerCase()}`} />
            ) : items.length === 0 ? (
              <ContainerCard>
                <EmptyState compact icon={term ? "search_off" : meta.icon} title={term ? `No ${meta.plural.toLowerCase()} match` : `No ${meta.plural.toLowerCase()} yet`}>
                  {!term && (
                    <Button color="secondary" startIcon={<Icon name="add" />} onClick={() => setEditing({ type })}>
                      New {meta.label.toLowerCase()}
                    </Button>
                  )}
                </EmptyState>
              </ContainerCard>
            ) : (
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" } }}>
                {items.map((p) => (
                  <PresetCard
                    key={p.id}
                    preset={p}
                    hidden={hidden}
                    stream={streamById[p.streamId]}
                    onEdit={() => setEditing({ preset: p })}
                    onAssign={() => setAssigning(p)}
                    onUnassign={() => unassign(p)}
                    onDelete={() => setDeleting(p)}
                  />
                ))}
              </Box>
            )}
          </Box>
        );
      })}

      <PresetSheet state={editing} onClose={() => setEditing(null)} onDelete={setDeleting} />
      <AssignDialog preset={assigning} presets={presets} streams={scheduled?.data ?? []} onClose={() => setAssigning(null)} />
      <ExportDialog open={exporting} onClose={() => setExporting(false)} />
      <ConfirmDelete
        open={!!deleting}
        title={`Delete “${deleting?.question}”?`}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          const p = deleting;
          setDeleting(null);
          await remove({ resource: "Poll", dataProviderName: DP.polls, id: p.id, successNotification: false });
          if (editing?.preset?.id === p.id) setEditing(null);
          notify(`“${p.question}” deleted`);
        }}
      >
        {deleting?.streamId ? "It's removed from its stream too. " : ""}This can't be undone.
      </ConfirmDelete>
    </Box>
  );
}
