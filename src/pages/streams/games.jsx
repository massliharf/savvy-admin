// Streams › Bundles — the bundles (what a new stream starts with: points, showdown, rewards,
// messaging; a card opens its settings) and the word sets. A word set is only words: it has no
// format and no rewards, and any stream can take it.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
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
import { dayjs, useTimezoneFormat } from "../../contexts";
import { DP } from "../../providers";
import { useNotify } from "../../shell/notifications";
import { StreamPickerDialog } from "./pickers";
import { showTitle } from "./hosts";
import { BundleCards } from "./BundleCards";
import { NewModeDialog } from "../gameModes/NewModeDialog";
import { useWordValidator } from "./form";
import { WordSetCard, WordSetSheet, WordSetSummary, isPublic, missingRoundWords, needsSet, setDetails, setState, useWordSetActions, useWordSets, useWordsLock, wordsOf } from "./words";

const TABS = [
  { id: "available", label: "Ready" },
  { id: "assigned", label: "Scheduled" },
  { id: "used", label: "Used" },
];

export default function GameModesPage() {
  const { m3: c } = useTheme();
  const { formatDate } = useTimezoneFormat();
  const notify = useNotify();
  const invalidate = useInvalidate();
  const [newMode, setNewMode] = useState(false);
  const navigate = useNavigate();

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

  // Upcoming streams; a set goes to one of its own format, or to one without a format yet.
  const upcoming = useMemo(() => streams.filter((s) => s.status === "Scheduled" && dayjs(s.startDate).isAfter(dayjs())), [streams]);
  // Upcoming public streams this format's sets could fill: the app hides their logo until then.
  const waiting = useMemo(() => upcoming.filter((s) => isPublic(s) && needsSet(s)).sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate)), [upcoming]);

  const mine = useMemo(() => sets.map((set) => ({ set, state: setState(set, streamsById) })), [sets, streamsById]);
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
      notify(`${autoPairs.length} ${autoPairs.length === 1 ? "stream got its words" : "streams got their words"}`);
    } catch (e) {
      notify(e?.response?.data?.detail ?? "Couldn't add the words", { variant: "error" });
    }
  };

  const candidates = assigning
    ? upcoming.filter((s) => !onlyMissing || needsSet(s)).sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))
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
      {/* The bundles: a card opens that bundle's settings. */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="overline" color="text.secondary" component="h2" sx={{ flex: 1 }}>
            Bundles
          </Typography>
          <Button variant="tonal" startIcon={<Icon name="add" />} onClick={() => setNewMode(true)}>
            New bundle
          </Button>
        </Box>
        <BundleCards onOpen={(id) => navigate(`/bundles/${id}`)} />
      </Box>
      <NewModeDialog
        open={newMode}
        onClose={() => setNewMode(false)}
        onCreated={(m) => {
          setNewMode(false);
          notify(`“${m.name}” created`);
          // Opens on its settings: points, showdown, rewards and messaging come next.
          navigate(`/bundles/${m.id}`);
        }}
      />

      <Typography variant="overline" color="text.secondary" component="h2" sx={{ mb: -1.5 }}>
        Word sets
      </Typography>
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
          {`${waiting.length} upcoming ${waiting.length === 1 ? "stream is" : "streams are"} still waiting for words. ${ready.length ? `${ready.length} ${ready.length === 1 ? "word set is" : "word sets are"} ready.` : "No word sets are ready."}`}
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
                detail={setDetails(set)}
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

      {unlockDialog}
      <WordSetSheet open={!!sheet} set={sheet} onClose={() => setSheet(null)} validateWord={validateWord} />
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
        emptyText="Upcoming streams will show here."
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
The oldest ready sets go to the earliest streams.
      </ConfirmDialog>
      <ConfirmDialog
        open={!!releasing}
        title="Make this set ready again?"
        confirmLabel="Make ready"
        busy={busy}
        onCancel={() => setReleasing(null)}
        onConfirm={async () => (await release(releasing.set)) && setReleasing(null)}
      >
        {releasing?.stream && `“${showTitle(releasing.stream)}” (${formatDate(releasing.stream.startDate, "MMM D")}) loses these words.`}
      </ConfirmDialog>
      <ConfirmDialog open={!!deleting} title={`Delete “${deleting?.title || "word set"}”?`} tone="error" confirmLabel="Delete" onCancel={() => setDeleting(null)} onConfirm={confirmDelete}>
        No stream has used it yet. This can't be undone.
      </ConfirmDialog>
    </Box>
  );
}
