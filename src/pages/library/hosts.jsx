// Hosts — the Savvy accounts with the Host role, who present streams. Adding a host gives an
// account the role; removing one takes it away (the account stays). Picked when creating or
// editing a stream; a host's upcoming streams can be handed over to someone else for a date range.
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useList } from "@refinedev/core";
import { Link, useSearchParams } from "react-router";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Icon } from "../../ds/Icon";
import { EmptyState } from "../../ds/EmptyState";
import { ImageGallery } from "../../ds/ImageGallery";
import { SideSheet } from "../../ds/SideSheet";
import { useDebounced } from "../../ds/SearchField";
import { dayjs, useTimezone, useTimezoneFormat } from "../../contexts";
import { DP } from "../../providers";
import { TextInput } from "../streams/detail/fields";
import { hostLabel, useChangeHost } from "../streams/hosts";
import { HostPicker } from "../streams/pickers";
import { CardGrid, ShopCard } from "../shop/shared";
import { ConfirmDelete, LibraryToolbar, useLibraryMutations, useSheet } from "./shared";
import { CardsSkeleton } from "../../ds/Skeletons";

// Each picture kind keeps up to five images; the selected one (imageUrl, heroCardImageUrl) is what
// new streams use. The stream image (900 × 1200) comes from the stream's game set, not the host.
const EMPTY = { id: "", name: "", displayName: "", imageUrl: null, pictureUrls: [], heroCardImageUrl: null, heroCardImageUrls: [] };
const GALLERIES = [
  // The same two, by the same names, as a stream's Host section shows them.
  { list: "pictureUrls", pick: "imageUrl", label: "Host picture", width: 256, height: 256, hint: "Avatar and stream thumbnail · 256 × 256" },
  { list: "heroCardImageUrls", pick: "heroCardImageUrl", label: "Hero card image", width: 256, height: 256, hint: "Home screen card · 256 × 256" },
];
const galleryOf = (r, g) => r?.[g.list] ?? (r?.[g.pick] ? [r[g.pick]] : []);

/** A host as a large card, like the Shop's: their picture, the name the app shows, then their name. */
function HostCard({ host, onOpen }) {
  return (
    <ShopCard
      image={host.imageUrl}
      icon="mic"
      title={hostLabel(host)}
      meta={
        host.displayName && (
          <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
            {host.name}
          </Typography>
        )
      }
      onOpen={onOpen}
    />
  );
}

/** Searches Savvy accounts (username, phone or ID) for one to make a host. */
function AccountPicker({ value, onChange, error, exclude }) {
  const [input, setInput] = useState("");
  const term = useDebounced(input.trim());
  const { data, isFetching } = useList({
    resource: "UserManagement",
    dataProviderName: DP.userManagement,
    pagination: { current: 1, pageSize: 20 },
    filters: [{ field: "SearchTerm", operator: "contains", value: term }],
    queryOptions: { enabled: term.length > 1 },
  });
  const options = term.length > 1 ? (data?.data ?? []).filter((u) => !u.id.startsWith("savvy-bot_") && !exclude.includes(u.id)) : [];
  return (
    <Autocomplete
      options={options}
      value={value}
      onChange={(_, u) => onChange(u)}
      inputValue={input}
      onInputChange={(_, v) => setInput(v)}
      filterOptions={(o) => o}
      loading={isFetching}
      getOptionLabel={(u) => u.username}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      noOptionsText={term.length > 1 ? "No accounts match" : "Type at least 2 characters"}
      renderOption={({ key, ...props }, u) => (
        <li key={key} {...props}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="bodyLarge" noWrap>
              {u.username}
            </Typography>
            <Typography variant="bodySmall" color="text.secondary" noWrap component="div">
              {u.phoneNumber ?? u.id}
            </Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Savvy account"
          error={!!error}
          helperText={error ?? "They get the Host role."}
          slotProps={{ input: { ...params.InputProps, startAdornment: <Icon name="person_search" style={{ marginLeft: 4 }} /> } }}
        />
      )}
    />
  );
}

/** Moves a host's scheduled streams in a date range to another host (e.g. while they're away). */
function HandOverDialog({ host, onClose, streams, hosts }) {
  const { m3: c, tokens } = useTheme();
  const { timezone } = useTimezone();
  const { formatDate } = useTimezoneFormat();
  const { changeHost, changingHost } = useChangeHost();
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [target, setTarget] = useState("");

  useEffect(() => {
    if (!host) return;
    const today = dayjs().tz(timezone).startOf("day");
    setFrom(today);
    setTo(today.add(6, "day"));
    setTarget("");
  }, [host, timezone]);

  const others = hosts.filter((h) => h.id !== host?.id).sort((a, b) => hostLabel(a).localeCompare(hostLabel(b)));
  const valid = from?.isValid() && to?.isValid() && !to.isBefore(from, "day");
  const moving = useMemo(() => {
    if (!host || !valid) return [];
    const start = from.format("YYYY-MM-DD");
    const end = to.format("YYYY-MM-DD");
    return streams
      .filter((s) => s.hostId === host.id && s.status === "Scheduled")
      .filter((s) => {
        const day = dayjs.utc(s.startDate).tz(timezone).format("YYYY-MM-DD");
        return day >= start && day <= end && dayjs(s.startDate).isAfter(dayjs());
      })
      .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));
  }, [host, streams, from, to, valid, timezone]);
  const targetHost = others.find((h) => h.id === target);

  const submit = async () => {
    const n = moving.length;
    if (await changeHost(moving.map((s) => s.id), targetHost, `${n} ${n === 1 ? "stream" : "streams"} moved to ${hostLabel(targetHost)}`)) onClose();
  };

  return (
    <Dialog open={!!host} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Hand over {hostLabel(host)}'s streams</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <DatePicker label="From" value={from} timezone={timezone} disablePast onChange={setFrom} slots={{ openPickerIcon: () => <Icon name="calendar_today" /> }} slotProps={{ textField: { sx: { flex: 1 } } }} />
          <DatePicker
            label="To"
            value={to}
            timezone={timezone}
            minDate={from ?? undefined}
            onChange={setTo}
            slots={{ openPickerIcon: () => <Icon name="calendar_today" /> }}
            slotProps={{ textField: { sx: { flex: 1 }, error: !!from && !!to && to.isBefore(from, "day"), helperText: from && to && to.isBefore(from, "day") ? "Ends before it starts" : undefined } }}
          />
        </Box>
        <HostPicker hosts={others} value={targetHost ?? null} onChange={(h) => setTarget(h?.id ?? "")} label="New host" />
        <Box sx={{ borderRadius: `${tokens.shape.md}px`, bgcolor: c.surfaceContainer, px: 2, py: 1.5 }}>
          <Typography variant="titleSmall">
            {moving.length ? `${moving.length} ${moving.length === 1 ? "stream" : "streams"} will move` : "No scheduled streams in these dates"}
          </Typography>
          {moving.length > 0 && (
            <Typography variant="bodySmall" color="text.secondary" component="div">
              {formatDate(moving[0].startDate, "ddd, MMM D")}
              {moving.length > 1 && ` – ${formatDate(moving.at(-1).startDate, "ddd, MMM D")}`}. Live and past streams stay as they are.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!moving.length || !targetHost || changingHost}>
          {moving.length ? `Move ${moving.length} ${moving.length === 1 ? "stream" : "streams"}` : "Move"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function HostSheet({ sheet, stats, existing, onHandOver }) {
  const isNew = sheet.open && !sheet.record?.id;
  const { save, destroy, saving } = useLibraryMutations({ resource: "Host", dataProviderName: DP.hosts, noun: "Host" });
  const [confirm, setConfirm] = useState(false);
  const { control, reset, handleSubmit, setValue, setError, getValues, formState } = useForm({ defaultValues: EMPTY });
  const [account, setAccount] = useState(null);
  const gallery = useWatch({ control, name: GALLERIES.flatMap((g) => [g.list, g.pick]) });

  useEffect(() => {
    if (sheet.open) reset({ ...EMPTY, ...sheet.record, displayName: sheet.record?.displayName ?? "", ...Object.fromEntries(GALLERIES.map((g) => [g.list, galleryOf(sheet.record, g)])) });
    setAccount(null);
  }, [sheet.open, sheet.record, reset]);

  const submit = handleSubmit(async (v) => {
    const values = { name: v.name, displayName: v.displayName || null, ...Object.fromEntries(GALLERIES.flatMap((g) => [[g.list, v[g.list]], [g.pick, v[g.pick] || null]])), ...(isNew ? { id: v.id } : {}) };
    if (await save(isNew ? null : sheet.record.id, values, setError)) sheet.close();
  });
  const upcoming = sheet.record?.id ? stats(sheet.record.id).upcoming : 0;

  return (
    <SideSheet
      open={sheet.open}
      onClose={sheet.close}
      dirty={formState.isDirty}
      title={isNew ? "New host" : hostLabel(sheet.record)}
      subtitle={isNew ? undefined : `Host · ${sheet.record?.username ?? sheet.record?.id}`}
      headerActions={
        !isNew && (
          <Tooltip title="Open user">
            <IconButton aria-label="Open user" component={Link} to={`/user-management/${encodeURIComponent(sheet.record?.id ?? "")}`}>
              <Icon name="person" />
            </IconButton>
          </Tooltip>
        )
      }
      footerStart={
        !isNew && (
          <>
            <Button variant="text" color="error" onClick={() => setConfirm(true)}>
              Remove host
            </Button>
            {onHandOver && upcoming > 0 && (
              <Button variant="text" onClick={() => onHandOver(sheet.record)}>
                Hand over streams
              </Button>
            )}
          </>
        )
      }
      actions={
        <>
          <Button variant="text" onClick={sheet.close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || (!isNew && !formState.isDirty)}>
            {isNew ? "Add host" : "Save"}
          </Button>
        </>
      }
    >
      {isNew ? (
        <Controller
          name="id"
          control={control}
          rules={{ required: "Choose the host's Savvy account" }}
          render={({ fieldState }) => (
            <AccountPicker
              value={account}
              exclude={existing}
              error={fieldState.error?.message}
              onChange={(u) => {
                setAccount(u);
                setValue("id", u?.id ?? "", { shouldDirty: true, shouldValidate: true });
                if (u && !getValues("name")) setValue("name", u.username, { shouldDirty: true });
              }}
            />
          )}
        />
      ) : null}
      <TextInput control={control} name="name" label="Name" rules={{ required: "Enter a name", maxLength: { value: 40, message: "Use 40 characters or fewer" } }} />
      <TextInput control={control} name="displayName" label="Display name (optional)" helperText="Shown in the app instead of the name." />
      {/* The pictures, after who the host is. */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {GALLERIES.map((g, i) => (
          <ImageGallery
            key={g.list}
            label={g.label}
            hint={g.hint}
            width={g.width}
            height={g.height}
            urls={gallery[i * 2] ?? []}
            selected={gallery[i * 2 + 1]}
            onChange={(urls, picked) => {
              setValue(g.list, urls, { shouldDirty: true });
              setValue(g.pick, picked, { shouldDirty: true });
            }}
          />
        ))}
      </Box>
      <ConfirmDelete
        open={confirm}
        title={`Remove ${sheet.record?.name} as a host?`}
        confirmLabel="Remove host"
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          await destroy(sheet.record.id, sheet.record.name, `${sheet.record.name} is no longer a host`);
          sheet.close();
        }}
      >
        {`Their Savvy account stays; it loses the Host role. ${
          upcoming > 0
            ? `${sheet.record?.name} hosts ${upcoming} upcoming ${upcoming === 1 ? "stream" : "streams"}. Those streams keep their host details; you just can't pick this host for new streams.`
            : "They won't be available for new streams. Existing streams aren't changed."
        }`}
      </ConfirmDelete>
    </SideSheet>
  );
}

export default function HostsPage() {
  const [query, setQuery] = useState("");
  const [handOver, setHandOver] = useState(null);
  const sheet = useSheet();
  const { data, isLoading } = useList({ resource: "Host", dataProviderName: DP.hosts, pagination: { mode: "off" } });
  // `?edit=<id>` opens that host, e.g. from a stream's Home screen section.
  const [params, setParams] = useSearchParams();
  const editId = params.get("edit");
  useEffect(() => {
    const host = editId && data?.data?.find((h) => h.id === editId);
    if (!host) return;
    sheet.openEdit(host);
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, data]);
  const { data: streams } = useList({ resource: "TextSavvyStream", pagination: { current: 1, pageSize: 1000 } });

  const stats = useMemo(() => {
    const now = dayjs();
    const by = {};
    (streams?.data ?? []).forEach((s) => {
      const st = (by[s.hostId] ??= { total: 0, upcoming: 0, next: null });
      st.total += 1;
      if (s.status === "Scheduled" && dayjs(s.startDate).isAfter(now)) {
        st.upcoming += 1;
        if (!st.next || dayjs(s.startDate).isBefore(st.next)) st.next = s.startDate;
      }
    });
    return (id) => by[id] ?? { total: 0, upcoming: 0, next: null };
  }, [streams]);

  const hosts = (data?.data ?? [])
    .filter((h) => `${h.name} ${h.displayName ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => hostLabel(a).localeCompare(hostLabel(b)));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <LibraryToolbar query={query} onQuery={setQuery} placeholder="Search hosts" actionLabel="New host" onAction={sheet.openNew} />
      {isLoading ? (
        <CardsSkeleton count={2} label="Loading hosts" />
      ) : hosts.length === 0 ? (
        <EmptyState icon={query ? "search_off" : "mic"} title={query ? "No hosts match" : "No hosts yet"}>
          {!query && (
            <Button color="secondary" startIcon={<Icon name="add" />} onClick={sheet.openNew}>
              New host
            </Button>
          )}
        </EmptyState>
      ) : (
        <CardGrid>
          {hosts.map((h) => (
            <HostCard key={h.id} host={h} onOpen={() => sheet.openEdit(h)} />
          ))}
        </CardGrid>
      )}
      <HostSheet
        sheet={sheet}
        stats={stats}
        existing={(data?.data ?? []).map((h) => h.id)}
        onHandOver={(h) => {
          sheet.close();
          setHandOver(h);
        }}
      />
      <HandOverDialog host={handOver} onClose={() => setHandOver(null)} streams={streams?.data ?? []} hosts={data?.data ?? []} />
    </Box>
  );
}
