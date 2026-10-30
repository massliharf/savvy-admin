// Streams › Game modes — one place per game mode: its sets (words + rewards, what each stream plays),
// its weekly times and Fill month. The mode's own settings (rules, scoring, defaults, How to play)
// sit behind Advanced. Streams show in the app right away; the game mode logo once words are in.
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useCustomMutation, useInvalidate, useList } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { ScopeToggle } from "../../ds/ScopeToggle";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { EmptyState } from "../../ds/EmptyState";
import { ActionMenu } from "../../ds/ActionMenu";
import { ConfirmDialog } from "../../ds/ConfirmDialog";
import { PageToolbar } from "../../ds/Page";
import { SearchField } from "../../ds/SearchField";
import { ContainerCard } from "../../ds/ContainerCard";
import { Banner } from "../../ds/Banner";
import { CardsSkeleton } from "../../ds/Skeletons";
import { dayjs, useTimezone, useTimezoneFormat } from "../../contexts";
import { DP } from "../../providers";
import { useNotify } from "../../shell/notifications";
import { GameMode } from "./enums";
import { rewardText } from "./detail/fields";
import { GAME_MODES, modeOf, useGameModePresets } from "./gameModes";
import { StreamPickerDialog } from "./pickers";
import { hostLabel, showTitle, useHosts } from "./hosts";
import { logoHidden } from "./parts";
import { FillMonthDialog, SlotsSheet, daysText, slotDays, slotTime, useScheduleSlots, withSlotHosts } from "./slots";
import { ModeCards } from "./ModeCards";
import { NewModeDialog } from "../gameModes/NewModeDialog";
import { GameModeSettings } from "../gameModes/detail";
import { useWordValidator } from "./form";
import { WordSetCard, WordSetSheet, WordSetSummary, isPublic, missingRoundWords, needsSet, setDetails, setState, useWordSetActions, useWordSets, useWordsLock, wordsOf } from "./words";

const TABS = [
  { id: "available", label: "Ready" },
  { id: "assigned", label: "Scheduled" },
  { id: "used", label: "Used" },
];

/** "Showdown $100": the set's showdown prize (else the game mode's). */
function rewardsLine(set, preset) {
  const prize = set.showdown?.prize ?? preset?.showdown?.prize;
  return set.showdown && prize ? `Showdown ${rewardText(prize)}` : "";
}

// A game mode's three parts: its word sets, its schedule, and its settings (what its streams
// start with and how it shows in the app).
const SECTIONS = [
  { value: "sets", label: "Word sets", icon: "spellcheck" },
  { value: "schedule", label: "Schedule", icon: "event_repeat" },
  { value: "settings", label: "Settings", icon: "tune" },
];

/** The mode's weekly time slots and this month, with Time slots and Fill month. */
function ScheduleTab({ slots, hosts, month, onTimes, onFill }) {
  const { m3: c } = useTheme();
  return (
    <ContainerCard sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5, maxWidth: 880 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="titleMedium" component="h2">
            Time slots
          </Typography>
          <Typography variant="bodySmall" color="text.secondary">
            {month.total ? `${month.total} streams this month${month.hidden ? ` · ${month.hidden} need words` : ""}` : "Nothing planned this month."}
          </Typography>
        </Box>
        <Button variant="tonal" startIcon={<Icon name="edit" />} onClick={onTimes}>
          Edit time slots
        </Button>
        <Button variant="tonal" startIcon={<Icon name="auto_awesome" />} onClick={onFill}>
          Fill month
        </Button>
      </Box>
      {slots.length === 0 ? (
        <Typography variant="bodyMedium" color="text.secondary">
          No time slots yet.
        </Typography>
      ) : (
        <Box>
          {slots.map((sl) => (
            <Box key={sl.id} sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.25, "&:not(:last-of-type)": { borderBottom: `1px solid ${c.border}` } }}>
              <Typography variant="titleSmall" sx={{ width: 80, flexShrink: 0 }}>
                {slotTime(sl.time)}
              </Typography>
              <Typography variant="bodyMedium" color="text.secondary" noWrap sx={{ flex: 1, minWidth: 0 }}>
                {[daysText(slotDays(sl)), hostLabel(hosts.find((h) => h.id === sl.hostId)) + (sl.followsMode ? " (default)" : ""), sl.streamType === "Internal" ? "Internal" : null].filter(Boolean).join(" · ")}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </ContainerCard>
  );
}

export default function GameModesPage() {
  const { m3: c } = useTheme();
  const { timezone } = useTimezone();
  const { formatDate } = useTimezoneFormat();
  const notify = useNotify();
  const invalidate = useInvalidate();
  const [params, setParams] = useSearchParams();
  const mode = GAME_MODES[params.get("mode")] ? params.get("mode") : GameMode.TextChain;
  const [newMode, setNewMode] = useState(false);
  const setMode = (m) => setParams((p) => ({ ...Object.fromEntries(p), mode: m }), { replace: true });
  // Old links (Stream defaults, App) open Settings.
  const tabParam = ["defaults", "app"].includes(params.get("tab")) ? "settings" : params.get("tab");
  const section = SECTIONS.some((x) => x.value === tabParam) ? tabParam : "sets";
  const setSection = (t) => setParams((p) => ({ ...Object.fromEntries(p), tab: t }), { replace: true });

  const { presets } = useGameModePresets();
  const hosts = useHosts();
  const { slots } = useScheduleSlots();
  const { sets, isLoading } = useWordSets();
  const { data: streamData } = useList({ resource: "TextSavvyStream", pagination: { current: 1, pageSize: 1000 } });
  const streams = useMemo(() => streamData?.data ?? [], [streamData]);
  const streamsById = useMemo(() => Object.fromEntries(streams.map((s) => [s.id, s])), [streams]);
  const { assign, release, busy } = useWordSetActions();
  const { validateWord } = useWordValidator();
  // Words show only after the words password; opening a set (its words) asks for it too.
  const { hidden, unlock, lock, dialog: unlockDialog } = useWordsLock();
  const { mutateAsync: request, isPending: requesting } = useCustomMutation();

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("available");
    const [sheet, setSheet] = useState(null); // null closed, {} new, a set to edit
  const [assigning, setAssigning] = useState(null);
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [releasing, setReleasing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [autoOpen, setAutoOpen] = useState(false);
  const [timesOpen, setTimesOpen] = useState(false);
  const [fillOpen, setFillOpen] = useState(false);

  const preset = presets[mode];
  const modeSlots = useMemo(() => slots.filter((sl) => modeOf(sl).id === mode).sort((a, b) => a.time.localeCompare(b.time)), [slots, mode]);
  const shownSlots = useMemo(() => withSlotHosts(modeSlots, presets), [modeSlots, presets]);
  const upcoming = useMemo(() => streams.filter((s) => s.status === "Scheduled" && dayjs(s.startDate).isAfter(dayjs()) && (s.gameMode ?? GameMode.TextChain) === mode), [streams, mode]);
  // Upcoming public streams of this mode still waiting for words: the app hides their mode logo.
  const waiting = useMemo(() => upcoming.filter((s) => isPublic(s) && needsSet(s, mode)).sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate)), [upcoming, mode]);
  const monthKey = dayjs().tz(timezone).format("YYYY-MM");
  const inMonth = upcoming.filter((s) => dayjs.utc(s.startDate).tz(timezone).format("YYYY-MM") === monthKey);
  const month = { total: inMonth.length, hidden: inMonth.filter(logoHidden).length };

  const mine = useMemo(() => sets.filter((s) => s.type === mode).map((set) => ({ set, state: setState(set, streamsById) })), [sets, mode, streamsById]);
  const ready = mine.filter((r) => r.state.key === "available").sort((a, b) => Date.parse(a.set.createdAt) - Date.parse(b.set.createdAt));
  const count = (key) => mine.filter((r) => r.state.key === key).length;
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mine
      .filter(({ set, state }) => state.key === tab && (!q || (set.title ?? "").toLowerCase().includes(q) || (!hidden && wordsOf(set).some((w) => w.includes(q)))))
      .sort((a, b) => Date.parse(b.set.createdAt) - Date.parse(a.set.createdAt));
  }, [mine, tab, query, hidden]);

  // Oldest ready sets to the earliest waiting streams.
  const autoPairs = waiting.slice(0, ready.length).map((s, i) => ({ streamId: s.id, wordSetId: ready[i].set.id }));
  const autoAssign = async () => {
    setAutoOpen(false);
    try {
      await request({ url: "/TextSavvyStream/bulk", method: "post", values: { streams: [], assignments: autoPairs }, dataProviderName: undefined, successNotification: false, errorNotification: false });
      invalidate({ resource: "TextSavvyStream", invalidates: ["list"] });
      invalidate({ resource: "WordSet", dataProviderName: DP.wordSets, invalidates: ["list"] });
      notify(`${autoPairs.length} ${autoPairs.length === 1 ? "stream got its words" : "streams got their words"}; the game mode logo now shows`);
    } catch (e) {
      notify(e?.response?.data?.detail ?? "Couldn't add the words", { variant: "error" });
    }
  };

  const candidates = assigning
    ? upcoming.filter((s) => !onlyMissing || needsSet(s, mode)).sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))
    : [];
  const describe = (s) => {
    const internal = isPublic(s) ? null : "Internal: the set stays ready";
    const missing = missingRoundWords(s) + (s.showdownConfiguration && !s.showdownConfiguration.word ? 1 : 0);
    return [missing ? `${missing} ${missing === 1 ? "word" : "words"} missing` : "Replaces the current words", internal].filter(Boolean).join(" · ");
  };

  const confirmDelete = async () => {
    const set = deleting;
    setDeleting(null);
    try {
      await request({ url: `/admin/word-sets/${set.id}`, method: "delete", values: {}, dataProviderName: DP.wordSets, successNotification: false, errorNotification: false });
      invalidate({ resource: "WordSet", dataProviderName: DP.wordSets, invalidates: ["list"] });
      notify("Set deleted");
    } catch (e) {
      notify(e?.response?.data?.detail ?? "Couldn't delete the set", { variant: "error" });
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Which game mode (the same cards as New stream), then one row of its parts. */}
      <ModeCards value={mode} onChange={setMode} onAdd={() => setNewMode(true)} />
      <NewModeDialog
        open={newMode}
        onClose={() => setNewMode(false)}
        onCreated={(m) => {
          setNewMode(false);
          notify(`“${m.name}” created`);
          // Opens on its settings: logo, defaults and how it shows in the app come next.
          setParams({ mode: m.id, tab: "settings" }, { replace: true });
        }}
      />
      <ScopeToggle label="Game mode parts" all={false} value={section} options={SECTIONS} onChange={setSection} />

      {section === "schedule" && <ScheduleTab slots={shownSlots} hosts={hosts} month={month} onTimes={() => setTimesOpen(true)} onFill={() => setFillOpen(true)} />}
      {section === "settings" && <GameModeSettings key={mode} id={mode} />}

      {section === "sets" && (
      <>
      <PageToolbar
        search={<SearchField value={query} onChange={setQuery} placeholder={hidden ? "Search names" : "Search words or names"} />}
        secondary={[{ label: hidden ? "Show words" : "Hide words", icon: hidden ? "lock_open" : "visibility_off", onClick: () => (hidden ? unlock() : lock()) }]}
        actionLabel="New word set"
        onAction={() => setSheet({})}
      />

      {waiting.length > 0 && (
        <Banner
          tone="warning"
          icon="hide_image"
          action={
            ready.length > 0 && (
              <Button variant="tonal" size="small" onClick={() => setAutoOpen(true)} disabled={requesting}>
                {`Add words to ${autoPairs.length}`}
              </Button>
            )
          }
        >
          {`${waiting.length} upcoming ${waiting.length === 1 ? "stream shows" : "streams show"} without the game mode logo until ${waiting.length === 1 ? "it gets" : "they get"} words. ${ready.length ? `${ready.length} ${ready.length === 1 ? "word set is" : "word sets are"} ready.` : "No word sets are ready."}`}
        </Banner>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <ScopeToggle label="Word sets" all={false} value={tab} options={TABS.map((t) => ({ value: t.id, label: t.label }))} count={count} onChange={setTab} />
        </Box>

        {isLoading ? (
          <CardsSkeleton count={4} media={40} min={10000} label="Loading sets" />
        ) : rows.length === 0 ? (
          <ContainerCard>
            <EmptyState icon={query ? "search_off" : "spellcheck"} title={query ? "No word sets match" : tab === "available" ? "No ready word sets" : tab === "assigned" ? "No scheduled word sets" : "No used word sets yet"}>
              {tab === "available" && !query && (
                <Button color="secondary" startIcon={<Icon name="add" />} onClick={() => setSheet({})}>
                  New word set
                </Button>
              )}
            </EmptyState>
          </ContainerCard>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(380px, 100%), 1fr))", gap: 2 }}>
            {rows.map(({ set, state }) => (
              <WordSetCard
                key={set.id}
                set={set}
                state={state}
                hidden={hidden}
                showState={false}
                detail={`${setDetails(set)}${rewardsLine(set, preset) ? ` · ${rewardsLine(set, preset)}` : ""}`}
                onOpen={() => unlock(() => setSheet(set))}
                actions={
                  <ActionMenu
                    label={`Actions for ${set.title || "this set"}`}
                    items={[
                      { label: "Assign to a stream", icon: "event_available", onClick: () => setAssigning(set), hidden: state.key !== "available" },
                      { label: "Make ready again", icon: "link_off", onClick: () => setReleasing({ set, stream: state.stream }), hidden: state.key !== "assigned" },
                      { label: "Delete", icon: "delete", tone: "error", divider: true, onClick: () => setDeleting(set), hidden: state.key !== "available" },
                    ]}
                  />
                }
              />
            ))}
          </Box>
        )}
      </Box>
      </>
      )}

      {unlockDialog}
      <WordSetSheet open={!!sheet} set={sheet} mode={mode} onClose={() => setSheet(null)} validateWord={validateWord} />
      <SlotsSheet open={timesOpen} onClose={() => setTimesOpen(false)} slots={slots} hosts={hosts} mode={mode} />
      <FillMonthDialog
        open={fillOpen}
        onClose={() => setFillOpen(false)}
        initialMonth={dayjs().tz(timezone).startOf("month")}
        slots={modeSlots}
        streams={streams}
        hosts={hosts}
        timezone={timezone}
        mode={mode}
        onEditSlots={() => setTimesOpen(true)}
      />
      <StreamPickerDialog
        open={!!assigning}
        title="Assign to a stream"
        header={
          assigning && (
            <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${c.outlineVariant}` }}>
              <WordSetSummary set={assigning} hidden={hidden} />
            </Box>
          )
        }
        streams={candidates}
        describe={describe}
        toggle={{ label: "Only streams missing words", value: onlyMissing, onChange: setOnlyMissing }}
        emptyText={`Upcoming ${GAME_MODES[mode].label} streams will show here.`}
        busy={busy}
        onClose={() => setAssigning(null)}
        onConfirm={async (stream) => (await assign(assigning, stream)) && setAssigning(null)}
      />
      <ConfirmDialog
        open={autoOpen}
        title={`Add words to ${autoPairs.length} ${autoPairs.length === 1 ? "stream" : "streams"}?`}
        confirmLabel="Add words"
        onCancel={() => setAutoOpen(false)}
        onConfirm={autoAssign}
      >
        The oldest ready sets go to the earliest streams, with their rewards. Their game mode logo then shows in the app.
      </ConfirmDialog>
      <ConfirmDialog
        open={!!releasing}
        title="Make this set ready again?"
        confirmLabel="Make ready"
        busy={busy}
        onCancel={() => setReleasing(null)}
        onConfirm={async () => (await release(releasing.set)) && setReleasing(null)}
      >
        {releasing?.stream && `“${showTitle(releasing.stream)}” (${formatDate(releasing.stream.startDate, "MMM D")}) loses these words; the app hides its game mode logo until it gets new ones.`}
      </ConfirmDialog>
      <ConfirmDialog open={!!deleting} title={`Delete “${deleting?.title || "word set"}”?`} tone="error" confirmLabel="Delete" onCancel={() => setDeleting(null)} onConfirm={confirmDelete}>
        No stream has used it yet. This can't be undone.
      </ConfirmDialog>
    </Box>
  );
}
