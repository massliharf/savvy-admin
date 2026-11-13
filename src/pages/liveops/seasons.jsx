// Engagement › Seasons — the active season up top, then upcoming and ended seasons.
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useCustom, useCustomMutation, useInvalidate, useList } from "@refinedev/core";
import { SelectButton } from "../../ds/SelectButton";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import FormHelperText from "@mui/material/FormHelperText";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { Banner } from "../../ds/Banner";
import { IconTile, cornerFor } from "../../ds/IconTile";
import { ImageField } from "../../ds/ImageField";
import { PageToolbar } from "../../ds/Page";
import { SideSheet } from "../../ds/SideSheet";
import { dayjs, useTimezoneFormat } from "../../contexts";
import { useNotify } from "../../shell/notifications";
import { DP } from "../../providers";
import { DateTimeInput, TextInput } from "../streams/detail/fields";
import { ConfirmDelete, useLibraryMutations, useSheet } from "../library/shared";
import { ConfirmDialog } from "../../ds/ConfirmDialog";
import { radius } from "../../theme/tokens";
import { ContainerCard } from "../../ds/ContainerCard";
import { RowsSkeleton } from "../../ds/Skeletons";
import { CardGrid, ShopCard } from "../shop/shared";

const RESET_TZ = "America/New_York";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function nextResets(now, { time, weekday, timezone }) {
  const local = now.tz(timezone);
  const [h, m] = time.split(":").map(Number);
  let daily = local.hour(h).minute(m).second(0).millisecond(0);
  if (!daily.isAfter(local)) daily = daily.add(1, "day");
  let weekly = local.add((weekday - local.day() + 7) % 7, "day").hour(h).minute(m).second(0).millisecond(0);
  if (!weekly.isAfter(local)) weekly = weekly.add(7, "day");
  return { daily, weekly };
}

const phase = (s, now) => (s.isActive ? "active" : dayjs(s.startsAt).isAfter(now) ? "upcoming" : "past");

// The two reset pickers share one width, so their values and chevrons line up.
const PICKER = { width: 152, "& .MuiButton-root": { width: "100%" } };

function SeasonIcon({ season, size = 48 }) {
  const { m3: c } = useTheme();
  const [broken, setBroken] = useState(false);
  return (
    <Box sx={{ width: size, height: size, borderRadius: `${cornerFor(size)}px`, overflow: "hidden", flexShrink: 0, bgcolor: c.surfaceContainerHighest, display: "grid", placeItems: "center", color: c.onSurfaceVariant }}>
      {season.iconUrl && !broken ? (
        <Box component="img" src={season.iconUrl} alt="" onError={() => setBroken(true)} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <Icon name="trophy" />
      )}
    </Box>
  );
}

function ActiveSeason({ season, now, onEdit, onReset }) {
  const { m3: c } = useTheme();
  const { formatDate } = useTimezoneFormat();
  if (!season) {
    return (
      <ContainerCard sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <IconTile icon="event_busy" tone="surface" size={48} />
        <Box>
          <Typography variant="titleMedium">No active season</Typography>
          <Typography variant="bodyMedium" color="text.secondary">
            The seasonal leaderboard is paused until a season starts.
          </Typography>
        </Box>
      </ContainerCard>
    );
  }
  const start = dayjs(season.startsAt);
  const end = dayjs(season.endsAt);
  const progress = Math.min(100, Math.max(0, (now.diff(start) / end.diff(start)) * 100));
  const daysLeft = Math.max(0, Math.ceil(end.diff(now, "day", true)));
  return (
    <Card sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <SeasonIcon season={season} size={72} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="headlineMedium" noWrap>
            {season.title}
          </Typography>
          <Typography variant="bodySmall" color="text.secondary">
            {formatDate(season.startsAt, "MMM D")} – {formatDate(season.endsAt, "MMM D, YYYY")}
          </Typography>
        </Box>
      </Box>
      <Box>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: radius("xs"), bgcolor: c.track, "& .MuiLinearProgress-bar": { borderRadius: radius("xs"), bgcolor: c.primary } }} aria-label="Season progress" />
        <Typography variant="labelMedium" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
          {daysLeft === 0 ? "Ends today" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button variant="filled" onClick={onEdit} startIcon={<Icon name="edit" />}>
          Edit
        </Button>
        <Button variant="tonal" color="error" onClick={onReset} startIcon={<Icon name="restart_alt" />}>
          Reset season
        </Button>
      </Box>
    </Card>
  );
}

const RESET_HOURS = Array.from({ length: 24 }, (_, h) => ({ value: `${String(h).padStart(2, "0")}:00`, label: dayjs().hour(h).minute(0).format("h:mm A") }));

/**
 * When the leaderboards reset (in Eastern Time): daily at an hour, weekly on a day at that hour.
 * Each row's choice saves right away.
 */
function ResetsCard({ now }) {
  const notify = useNotify();
  const { data, refetch } = useCustom({ url: "/admin/leaderboard-resets", method: "get", dataProviderName: DP.season });
  const { mutateAsync } = useCustomMutation();
  const rule = data?.data ?? { time: "03:00", weekday: 6, timezone: RESET_TZ };
  const zone = dayjs().tz(rule.timezone).format("z");
  const { daily, weekly } = nextResets(now, rule);
  const save = async (change) => {
    try {
      await mutateAsync({ url: "/admin/leaderboard-resets", method: "put", values: change, dataProviderName: DP.season, successNotification: false, errorNotification: false });
      await refetch();
      notify("Reset time saved");
    } catch {
      notify("Couldn't save the reset time", { variant: "error" });
    }
  };
  return (
    <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography variant="titleMedium" component="h2">
        Leaderboard resets
      </Typography>
      {/* The same card with divided rows as Upcoming and Ended below. */}
      <ContainerCard role="list" aria-label="Leaderboard resets">
        {[
          { title: "Daily", supporting: `Next ${daily.format("ddd, MMM D")}`, control: <SelectButton aria-label="Daily reset time" size="small" sx={PICKER} value={rule.time} options={RESET_HOURS.map((o) => ({ ...o, label: `${o.label} ${zone}` }))} onChange={(time) => save({ time })} /> },
          { title: "Weekly", supporting: `Next ${weekly.format("ddd, MMM D")}, same time`, control: <SelectButton aria-label="Weekly reset day" size="small" sx={PICKER} value={rule.weekday} options={WEEKDAYS.map((d, i) => ({ value: i, label: d }))} onChange={(weekday) => save({ weekday })} /> },
        ].map((r) => (
          <Box key={r.title} role="listitem" sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 1.5, "&:not(:last-of-type)": { borderBottom: 1, borderColor: "divider" } }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="titleSmall" component="div">
                {r.title}
              </Typography>
              <Typography variant="bodySmall" color="text.secondary" component="div">
                {r.supporting}
              </Typography>
            </Box>
            {r.control}
          </Box>
        ))}
      </ContainerCard>
    </Box>
  );
}

/** An upcoming or ended season as the card every library page uses (no phase pill: it sits under its phase's title). */
function SeasonCard({ season, onOpen }) {
  const { formatDate } = useTimezoneFormat();
  return (
    <ShopCard
      image={season.iconUrl}
      icon="trophy"
      title={season.title}
      meta={
        <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
          {formatDate(season.startsAt, "MMM D, YYYY")} – {formatDate(season.endsAt, "MMM D, YYYY")}
        </Typography>
      }
      onOpen={onOpen}
    />
  );
}

const EMPTY = { title: "", iconUrl: null, iconFile: null, startsAt: null, endsAt: null };

function SeasonSheet({ sheet }) {
  const isNew = sheet.open && !sheet.record?.id;
  const { save, destroy, saving } = useLibraryMutations({ resource: "Season", dataProviderName: DP.season, noun: "Season" });
  const [confirm, setConfirm] = useState(false);
  const { control, reset, handleSubmit, setValue, setError, formState } = useForm({ defaultValues: EMPTY });
  const iconUrl = useWatch({ control, name: "iconUrl" });
  const iconFile = useWatch({ control, name: "iconFile" });
  const startsAt = useWatch({ control, name: "startsAt" });

  useEffect(() => {
    if (sheet.open) reset({ ...EMPTY, ...sheet.record, iconFile: null });
  }, [sheet.open, sheet.record, reset]);

  // The API reports field errors with capitalised keys (Title, EndsAt).
  const setServerError = (field, err) => setError(field[0].toLowerCase() + field.slice(1), err);

  const submit = handleSubmit(async (v) => {
    if (isNew && !v.iconFile) return; // icon is required for new seasons (message shown under the field)
    const values = { title: v.title.trim(), startsAt: v.startsAt, endsAt: v.endsAt, iconUrl: v.iconUrl || null, iconFile: v.iconFile || null };
    if (await save(isNew ? null : sheet.record.id, values, setServerError)) sheet.close();
  });

  return (
    <SideSheet
      open={sheet.open}
      onClose={sheet.close}
      dirty={formState.isDirty}
      title={isNew ? "New season" : sheet.record?.title}
      subtitle={isNew ? undefined : "Season"}
      footerStart={
        !isNew && (
          <Button variant="text" color="error" onClick={() => setConfirm(true)}>
            Delete
          </Button>
        )
      }
      actions={
        <>
          <Button variant="text" onClick={sheet.close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || (!isNew && !formState.isDirty)}>
            {isNew ? "Add season" : "Save"}
          </Button>
        </>
      }
    >
      <Box>
        <ImageField
          label="Icon"
          value={iconUrl}
          width={256}
          height={256}
          hint="Square, saved as 256 × 256 px"
          onChange={(f) => setValue("iconFile", f, { shouldDirty: true })}
        />
        {isNew && formState.isSubmitted && !iconFile && <FormHelperText error>Add an icon</FormHelperText>}
      </Box>
      <TextInput control={control} name="title" label="Title" max={100} rules={{ validate: (v) => (!v?.trim() ? "Enter a title" : v.length > 100 ? "Use 100 characters or fewer" : true) }} />
      <Box>
        <Typography variant="labelLarge" color="text.secondary" component="div" sx={{ mb: 1 }}>
          Starts
        </Typography>
        <DateTimeInput control={control} name="startsAt" rules={{ required: "Pick a start" }} showZone={false} />
      </Box>
      <Box>
        <Typography variant="labelLarge" color="text.secondary" component="div" sx={{ mb: 1 }}>
          Ends
        </Typography>
        <DateTimeInput control={control} name="endsAt" rules={{ required: "Pick an end", validate: (v) => (!v || !startsAt || dayjs(v).isAfter(dayjs(startsAt)) ? true : "Must be after the start") }} />
      </Box>
      <Banner tone="warning">The seasonal leaderboard doesn't reset by itself on the end date. Use Reset season.</Banner>
      <ConfirmDelete
        open={confirm}
        title={`Delete ${sheet.record?.title}?`}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          await destroy(sheet.record.id, sheet.record.title);
          sheet.close();
        }}
      >
        This can't be undone.
      </ConfirmDelete>
    </SideSheet>
  );
}

export default function SeasonsPage() {
  const notify = useNotify();
  const invalidate = useInvalidate();
  const sheet = useSheet();
  const [now, setNow] = useState(() => dayjs());
  const [confirmReset, setConfirmReset] = useState(false);
  const { mutate: reset, isPending: resetting } = useCustomMutation();
  const { data, isLoading } = useList({ resource: "Season", dataProviderName: DP.season, sorters: [{ field: "startsAt", order: "desc" }], pagination: { current: 1, pageSize: 100 } });

  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 60000);
    return () => clearInterval(t);
  }, []);

  const seasons = useMemo(() => data?.data ?? [], [data]);
  const active = seasons.find((s) => s.isActive);
  const upcoming = seasons.filter((s) => phase(s, now) === "upcoming").sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const past = seasons.filter((s) => phase(s, now) === "past");

  const doReset = () =>
    reset(
      { url: "/admin/Season/reset", method: "post", values: {}, dataProviderName: DP.season, successNotification: false, errorNotification: false },
      {
        onSuccess: (res) => {
          invalidate({ resource: "Season", dataProviderName: DP.season, invalidates: ["list"] });
          notify(res?.data ? "Season reset" : "Season closed");
        },
        onError: (e) => notify(e?.response?.data?.detail ?? "Couldn't reset the season", { variant: "error" }),
      },
    );

  const section = (title, items, empty) => (
    <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography variant="titleMedium" component="h2">
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="bodyMedium" color="text.secondary">
          {empty}
        </Typography>
      ) : (
        <CardGrid>
          {items.map((s) => (
            <SeasonCard key={s.id} season={s} onOpen={() => sheet.openEdit(s)} />
          ))}
        </CardGrid>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageToolbar actionLabel="New season" onAction={sheet.openNew} />
      {isLoading ? (
        <ContainerCard>
          <RowsSkeleton count={3} lead="square" label="Loading seasons" />
        </ContainerCard>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 3fr) minmax(300px, 2fr)" }, gap: 2 }}>
          {/* Both columns open with a section title, like Upcoming and Ended below. */}
          <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 }}>
            <Typography variant="titleMedium" component="h2">
              Active season
            </Typography>
            <ActiveSeason season={active} now={now} onEdit={() => sheet.openEdit(active)} onReset={() => setConfirmReset(true)} />
          </Box>
          <ResetsCard now={now} />
        </Box>
      )}
      {!isLoading && (
        <>
          {section("Upcoming", upcoming, "Nothing scheduled after the current season.")}
          {section("Ended", past, "No ended seasons.")}
        </>
      )}

      <SeasonSheet sheet={sheet} />

      <ConfirmDialog
        open={confirmReset}
        title={`Reset “${active?.title}”?`}
        tone="error"
        confirmLabel="Reset season"
        busy={resetting}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          doReset();
        }}
      >
        This clears the seasonal leaderboard and starts the next scheduled season, if there is one. It can't be undone.
      </ConfirmDialog>
    </Box>
  );
}
