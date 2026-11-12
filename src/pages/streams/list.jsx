// Streams › Schedule — every stream as cards, rows (grouped by day) or a month / week calendar. The views
// only change the layout: each stream is the same StreamItem and opens its detail page.
import { useEffect, useMemo, useState } from "react";
import { useMatch, useNavigate, useSearchParams } from "react-router";
import { useDelete, useList } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import { ScopeToggle } from "../../ds/ScopeToggle";
import { ViewToggle } from "../../ds/ViewToggle";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { PageToolbar } from "../../ds/Page";
import { EmptyState } from "../../ds/EmptyState";
import { ConfirmDialog } from "../../ds/ConfirmDialog";
import { SearchField } from "../../ds/SearchField";
import { MenuFilterChip } from "../../ds/MenuFilterChip";
import { dayjs, useTimezone } from "../../contexts";
import { useNotify } from "../../shell/notifications";
import { GAME_MODES, modeOf } from "./gameModes";
import { STREAM_TYPES, StreamItem, logoHidden } from "./parts";
import { NewStreamDialog } from "./NewStreamDialog";
import { StreamKeyDialog } from "./StreamKeyDialog";
import { WordSetPickerDialog, useWordSetActions, useWordsLock } from "./words";
import { StreamSummary } from "./pickers";
import { useHosts, showTitle } from "./hosts";
import { MonthCalendar, MonthNav, StreamLegend, WeekCalendar, WeekNav } from "./calendar";
import { CreateEventSheet } from "./events";
import { radius } from "../../theme/tokens";
import { useEnterOnChange } from "../../ds/useEnterOnChange";
import { CardsSkeleton } from "../../ds/Skeletons";

// The month calendar (always the default), cards and a compact list.
const VIEWS = [
  { id: "calendar", label: "Calendar", icon: "calendar_month" },
  { id: "cards", label: "Cards", icon: "grid_view" },
  { id: "list", label: "List", icon: "view_agenda" },
];

const FILTER_GROUPS = { mode: "Format", type: "Visibility", setup: "Status" };
// A function: game modes made in the admin join the list once their presets load.
const filters = () => [
  ...Object.values(GAME_MODES).map((m) => ({ id: `mode:${m.id}`, group: "mode", label: m.label, test: (s) => s.gameMode === m.id })),
  ...Object.entries(STREAM_TYPES).map(([v, t]) => ({ id: `type:${v}`, group: "type", label: t.label, test: (s) => s.streamType === v })),
  // Upcoming and still missing its host, its format or words.
  { id: "draft", group: "setup", label: "Needs setup", test: logoHidden },
];

function WeekHeader({ week, count, timezone }) {
  const thisWeek = dayjs().tz(timezone).startOf("day");
  const sunday = thisWeek.subtract(thisWeek.day(), "day");
  const diff = Math.round(week.diff(sunday, "day") / 7);
  const label = { 0: "This week", 1: "Next week", [-1]: "Last week" }[diff] ?? `Week of ${week.format("MMM D")}`;
  const end = week.add(6, "day");
  const range = `${week.format("MMM D")} – ${end.format(end.month() === week.month() ? "D" : "MMM D")}${week.year() !== thisWeek.year() ? `, ${week.year()}` : ""}`;
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 2 }}>
      <Typography variant="titleMedium" component="h2">
        {label}
      </Typography>
      <Typography variant="bodyMedium" color="text.secondary">
        {range}
      </Typography>
      <Typography variant="labelMedium" color="text.secondary" sx={{ ml: "auto" }}>
        {count} {count === 1 ? "stream" : "streams"}
      </Typography>
    </Box>
  );
}

// Day marker in the agenda's left column; today gets a filled primary circle.
function DayMarker({ day, timezone }) {
  const { m3: c } = useTheme();
  const today = day.format("YYYY-MM-DD") === dayjs().tz(timezone).format("YYYY-MM-DD");
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25, pt: 1 }}>
      <Typography variant="labelMedium" sx={{ color: today ? c.primaryText : c.onSurfaceVariant, textTransform: "uppercase" }}>
        {day.format("ddd")}
      </Typography>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          bgcolor: today ? c.primary : "transparent",
          color: today ? c.onPrimary : c.onSurface,
          typography: "headlineSmall",
        }}
      >
        {day.format("D")}
      </Box>
    </Box>
  );
}

function LoadingCards() {
  return (
    <CardsSkeleton count={4} media={118} label="Loading streams" />
  );
}

export default function StreamList() {
  const navigate = useNavigate();
  const notify = useNotify();
  const { timezone } = useTimezone();
  const creating = !!useMatch("/streams/create");
  const [params] = useSearchParams();
  const duplicateFrom = params.get("from");
  const createDate = params.get("date");

  const [query, setQuery] = useState("");
  // Always opens on all streams, as cards.
  const [when, setWhen] = useState("all");
  const [active, setActive] = useState([]);
  const [view, setView] = useState("calendar");
  const [keyStream, setKeyStream] = useState(null);
  // The stream whose word set is being picked (the small button on each stream).
  const [wordsFor, setWordsFor] = useState(null);
  const { assign, busy: assigning } = useWordSetActions();
  // Picking a set shows its words: the words password first, like opening a set.
  const { unlock, dialog: unlockDialog } = useWordsLock();
  const [deleting, setDeleting] = useState(null);
  const [highlight, setHighlight] = useState(null);
  // "Create event": one stream or a recurring one; the only way to add streams (`date` from a
  // calendar day's +).
  const [eventOpen, setEventOpen] = useState(false);
  const [eventDate, setEventDate] = useState(null);
  const createEvent = (date = null) => {
    setEventDate(date);
    setEventOpen(true);
  };
  const [month, setMonth] = useState(() => dayjs().tz(timezone).startOf("month"));
  // The calendar always opens on the month.
  const [range, setRange] = useState("month");
  // Switching view or range animates in; opening the page doesn't.
  const enter = useEnterOnChange(`${view}-${range}`);
  // Weeks are plain calendar dates (UTC midnight, Sunday) so DST changes can't shift a day.
  const weekOf = (day) => dayjs.utc(day.format("YYYY-MM-DD")).subtract(day.day(), "day");
  const [week, setWeek] = useState(() => weekOf(dayjs().tz(timezone)));
  const [selectedDay, setSelectedDay] = useState(() => dayjs().tz(timezone).startOf("day"));

  const { data, isLoading } = useList({ resource: "TextSavvyStream", pagination: { current: 1, pageSize: 1000 } });
  const streams = useMemo(() => data?.data ?? [], [data]);
  const { mutate: remove } = useDelete();

  const hosts = useHosts();
  const source = duplicateFrom ? streams.find((s) => s.id === duplicateFrom) : null;


  // Switching between month and week keeps the same period in view.
  const changeRange = (next) => {
    if (!next || next === range) return;
    if (next === "week") {
      const today = dayjs().tz(timezone);
      setWeek(month.format("YYYY-MM") === today.format("YYYY-MM") ? weekOf(today) : weekOf(dayjs.utc(`${month.format("YYYY-MM")}-01`)));
    } else setMonth(week.startOf("month"));
    setRange(next);
  };


  useEffect(() => {
    if (!highlight) return undefined;
    document.getElementById(`stream-${highlight}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setHighlight(null), 2400);
    return () => clearTimeout(t);
  }, [highlight]);

  // Search and filter chips; the time range applies to the agenda views only.
  const matching = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byGroup = active.reduce((acc, id) => {
      const f = filters().find((x) => x.id === id);
      (acc[f.group] ??= []).push(f.test);
      return acc;
    }, {});
    return streams.filter((s) => {
      if (q && !showTitle(s).toLowerCase().includes(q) && !`${s.hostName ?? ""} ${s.hostDisplayName ?? ""}`.toLowerCase().includes(q)) return false;
      return Object.values(byGroup).every((tests) => tests.some((t) => t(s)));
    });
  }, [streams, query, active]);

  const groups = useMemo(() => {
    const startOfToday = dayjs().tz(timezone).startOf("day");
    const rows = matching
      .filter((s) => {
        const start = dayjs.utc(s.startDate).tz(timezone);
        const upcoming = s.status === "InProgress" || !start.isBefore(startOfToday);
        if (when === "upcoming" && !upcoming) return false;
        if (when === "past" && upcoming) return false;
        return true;
      })
      .sort((a, b) => (Date.parse(a.startDate) - Date.parse(b.startDate)) * (when === "past" ? -1 : 1));
    const weeks = [];
    // Compare calendar dates, not instants: around DST changes the same day can differ by an hour.
    rows.forEach((s) => {
      const day = dayjs.utc(s.startDate).tz(timezone).startOf("day");
      const week = day.subtract(day.day(), "day");
      const weekKey = week.format("YYYY-MM-DD");
      const dayKey = day.format("YYYY-MM-DD");
      let w = weeks.at(-1);
      if (!w || w.key !== weekKey) weeks.push((w = { key: weekKey, week, count: 0, days: [] }));
      w.count += 1;
      const d = w.days.at(-1);
      if (d && d.key === dayKey) d.items.push(s);
      else w.days.push({ key: dayKey, day, items: [s] });
    });
    return weeks;
  }, [matching, when, timezone]);

  const toggleFilter = (id) => setActive((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const clearAll = () => {
    setActive([]);
    setQuery("");
  };

  const createOn = (day) => createEvent(day.format("YYYY-MM-DD"));
  // The old New stream link (/streams/create, with ?date=) opens Create event; ?from= still duplicates.
  useEffect(() => {
    if (!creating || duplicateFrom) return;
    createEvent(createDate);
    navigate("/streams", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creating, duplicateFrom]);
  const dayStreams = matching
    .filter((s) => dayjs.utc(s.startDate).tz(timezone).format("YYYY-MM-DD") === selectedDay.format("YYYY-MM-DD"))
    .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));

  const onAction = (action, stream) => {
    if (action === "edit") navigate(`/streams/edit/${stream.id}`);
    if (action === "duplicate") navigate(`/streams/create?from=${stream.id}`);
    if (action === "key") setKeyStream(stream);
    if (action === "words") unlock(() => setWordsFor(stream));
    if (action === "delete") setDeleting(stream);
  };

  const confirmDelete = () => {
    const stream = deleting;
    setDeleting(null);
    remove(
      { resource: "TextSavvyStream", id: stream.id, successNotification: false },
      { onSuccess: () => notify(`“${showTitle(stream)}” deleted`) },
    );
  };

  const onCreated = (stream) => {
    navigate("/streams");
    setWhen("all");
    clearAll();
    setHighlight(stream.id);
    if (view === "calendar") {
      const day = dayjs.utc(stream.startDate).tz(timezone);
      setMonth(day.startOf("month"));
      setWeek(weekOf(day));
    }
    notify(duplicateFrom ? "Stream duplicated" : "Stream created", {
      actionLabel: "Open",
      onAction: () => navigate(`/streams/edit/${stream.id}`),
    });
  };

  const item = (s, variant) => (
    <Box key={s.id} id={`stream-${s.id}`} sx={{ minWidth: 0 }}>
      <StreamItem stream={s} variant={variant} onAction={onAction} highlight={highlight === s.id} />
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* One toolbar line: search, then range and view next to it; the page actions on the right. */}
        <PageToolbar
          search={<SearchField value={query} onChange={setQuery} placeholder="Search title or host" />}
          actionLabel="Create event"
          actionIcon="event_repeat"
          onAction={() => createEvent()}
        >
          {view === "calendar" ? (
            <ScopeToggle label="Calendar range" all={false} value={range} options={[{ value: "month", label: "Month" }, { value: "week", label: "Week" }]} onChange={changeRange} />
          ) : (
            <ScopeToggle label="Time range" value={when === "all" ? null : when} options={[{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }]} onChange={(v) => setWhen(v ?? "all")} />
          )}
          <ViewToggle value={view} onChange={setView} views={VIEWS} />
          {/* Game mode, visibility and status share one chip: one menu, titled groups. */}
          <MenuFilterChip label="Filter" options={filters()} groups={FILTER_GROUPS} selected={active} onToggle={toggleFilter} onClear={() => setActive([])} />
        </PageToolbar>
        {/* The colour legend only matters where colour is the main cue: the calendar. */}
        {view === "calendar" && (
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
            {range === "month" ? <MonthNav month={month} onChange={setMonth} timezone={timezone} /> : <WeekNav week={week} onChange={setWeek} timezone={timezone} />}
            <Box sx={{ flex: 1 }} />
            <StreamLegend />
          </Box>
        )}
      </Box>

      {view === "calendar" && range === "week" ? (
        <Box key="week" className={enter} sx={{ mt: -2 }}>
          {isLoading ? <Skeleton variant="rounded" height={480} sx={{ borderRadius: radius("lg") }} /> : <WeekCalendar week={week} streams={matching} timezone={timezone} onCreate={createOn} onAction={onAction} />}
        </Box>
      ) : view === "calendar" ? (
        <Box key="month" className={enter} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: -2 }}>
          {isLoading ? (
            <Skeleton variant="rounded" height={560} sx={{ borderRadius: radius("lg") }} />
          ) : (
            <MonthCalendar month={month} streams={matching} timezone={timezone} onCreate={createOn} selected={selectedDay} onSelect={setSelectedDay} onAction={onAction} />
          )}
          {/* Phones: the calendar shows dots, the selected day's streams are listed here. */}
          <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="titleMedium" component="h3" sx={{ flex: 1 }}>
                {selectedDay.format("dddd, MMMM D")}
              </Typography>
              {selectedDay.format("YYYY-MM-DD") >= dayjs().tz(timezone).format("YYYY-MM-DD") && (
                <Button variant="tonal" size="small" startIcon={<Icon name="add" />} onClick={() => createOn(selectedDay)}>
                  Add
                </Button>
              )}
            </Box>
            {dayStreams.length ? (
              dayStreams.map((s) => item(s, "row"))
            ) : (
              <EmptyState compact icon="event_available" title="No streams on this day" />
            )}
          </Box>
        </Box>
      ) : isLoading ? (
        <LoadingCards />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={query || active.length ? "search_off" : "live_tv"}
          title={query || active.length ? "No streams match" : when === "past" ? "No past streams" : "Nothing scheduled"}
          
        >
          {query || active.length ? (
            <Button variant="tonal" onClick={clearAll}>
              Clear filters
            </Button>
          ) : (
            <Button color="secondary" startIcon={<Icon name="event_repeat" />} onClick={() => createEvent()}>
              Create event
            </Button>
          )}
        </EmptyState>
      ) : (
        groups.map(({ key, week, count, days }) => (
          <Box component="section" key={key}>
            <WeekHeader week={week} count={count} timezone={timezone} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {days.map(({ key: dayKey, day, items }) => (
                <Box key={dayKey} sx={{ display: "grid", gridTemplateColumns: { xs: "52px minmax(0, 1fr)", sm: "72px minmax(0, 1fr)" }, gap: { xs: 1, sm: 2 } }}>
                  <DayMarker day={day} timezone={timezone} />
                  {view === "cards" ? (
                    <Box key="cards" className={enter} sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: 2 }}>{items.map((s) => item(s, "card"))}</Box>
                  ) : (
                    <Box key="rows" className={enter} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>{items.map((s) => item(s, "row"))}</Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        ))
      )}

      <NewStreamDialog
        open={creating && !!duplicateFrom && !!source}
        source={source}
        date={createDate}
        hosts={hosts}
        onClose={() => navigate("/streams")}
        onCreated={onCreated}
      />
      <CreateEventSheet open={eventOpen} date={eventDate} onClose={() => setEventOpen(false)} streams={streams} hosts={hosts} timezone={timezone} onCreated={(start) => setMonth(start.tz(timezone).startOf("month"))} />
      <StreamKeyDialog stream={keyStream} onClose={() => setKeyStream(null)} />
      {unlockDialog}
      {/* A word set's "Assign to a stream", the other way round: this stream, then its set. */}
      <WordSetPickerDialog
        open={!!wordsFor}
        stream={wordsFor}
        header={
          wordsFor && (
            <Box sx={{ px: 3, py: 2, borderBottom: (t) => `1px solid ${t.m3.outlineVariant}` }}>
              <StreamSummary stream={wordsFor} />
            </Box>
          )
        }
        confirmLabel="Assign"
        busy={assigning}
        onClose={() => setWordsFor(null)}
        onPick={async (set) => (await assign(set, wordsFor)) && setWordsFor(null)}
      />
      <ConfirmDialog open={!!deleting} title="Delete stream?" tone="error" confirmLabel="Delete" onCancel={() => setDeleting(null)} onConfirm={confirmDelete}>
        “{deleting && showTitle(deleting)}” and its rounds will be removed. This can't be undone.
      </ConfirmDialog>
    </Box>
  );
}
