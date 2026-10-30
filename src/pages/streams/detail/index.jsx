// Stream detail — every setting of one stream on a single page, grouped into sections.
import { Fragment, useEffect, useState } from "react";
import Link from "@mui/material/Link";
import { Banner } from "../../../ds/Banner";
import { useNavigate, useParams } from "react-router";
import { useWatch } from "react-hook-form";
import { useDelete } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { Icon } from "../../../ds/Icon";
import { EmptyState } from "../../../ds/EmptyState";
import { ActionMenu } from "../../../ds/ActionMenu";
import { ConfirmDialog } from "../../../ds/ConfirmDialog";
import { DetailBody, DetailHeader, DetailSkeleton, SectionNav, useActiveSection } from "../../../ds/DetailLayout";
import { useTimezoneFormat } from "../../../contexts";
import { useNotify } from "../../../shell/notifications";
import { useStreamForm, useWordValidator } from "../form";
import { DEFAULT_ROUND_SCORING, GameMode, busterFor, durationFor } from "../enums";
import { useGameModePresets } from "../gameModes";
import { STREAM_TYPES, SetupWarning, StatusBadge, StreamImage, logoHidden } from "../parts";
import { StreamKeyDialog } from "../StreamKeyDialog";
import { useHosts, showTitle } from "../hosts";
import { WordSetPickerDialog } from "../words";
import {
  DetailsSection,
  GameModeSection,
  HostSection,
  ScoringSection,
  NotificationsSection,
  RaffleSection,
  RewardsSection,
  WordsSection,
  ShareCardsSection,
  useSectionStatus,
  SponsorSection,
  STATUS_OPTIONS,
} from "./sections";

// Every part is its own open section, in the order a stream is set up. `fields` are what each owns,
// to jump to the first error.
// Always open: what a stream is (details) and plays (words).
// In the order a stream is put together: game mode → words → host → when (and title) → extras.
const SECTIONS = [
  { id: "mode", label: "Game mode", icon: "sports_esports", fields: ["gameMode"] },
  // Words holds the rounds and the showdown word together.
  { id: "words", label: "Words", icon: "spellcheck", fields: ["textSavvyRounds", "showdownConfiguration"] },
  // The host brings their pictures (host picture, stream image, hero card).
  { id: "host", label: "Host", icon: "person", fields: ["hostId", "hostName", "imageUrl", "heroImageUrl"] },
  { id: "basics", label: "When & title", icon: "event", fields: ["title", "subtitle", "startDate", "streamType", "headless", "isSpotlighted"] },
  { id: "sponsor", label: "Sponsor", icon: "handshake", fields: ["sponsorship"] },
  { id: "rewards-card", label: "Rewards", icon: "redeem", fields: ["defaultRewards", "hostBusterReward", "hostStumperBonusXp"] },
  { id: "raffle", label: "Raffle", icon: "confirmation_number", fields: ["raffleSystemWinnersConfiguration"] },
  { id: "game", label: "Scoring", icon: "scoreboard", fields: ["roundScoring"] },
  { id: "share", label: "Share cards", icon: "style", fields: ["shareableCards"] },
  { id: "notifications-card", label: "Notifications", icon: "notifications", fields: ["lobbyOpenTitle", "lobbyOpenBody", "goingLiveTitle", "goingLiveBody", "round1StartsTitle", "round1StartsBody", "round1StartsAt"] },
];

export default function StreamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const { presets } = useGameModePresets();
  const { formatDate } = useTimezoneFormat();
  const hosts = useHosts();
  const { validateWord } = useWordValidator();
  const [picking, setPicking] = useState(false); // while picking a word set
  const [keyOpen, setKeyOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmAudience, setConfirmAudience] = useState(false);
  const [saving, setSaving] = useState(false);
  const { mutate: remove } = useDelete();

  const form = useStreamForm({
    streamId: id,
    action: "edit",
    redirect: false,
    successNotification: () => ({ message: "Changes saved", type: "success" }),
  });
  const { query, reset, errors, isDirty, trigger, getValues } = form;
  const stream = query?.data?.data;
  const status = useWatch({ control: form.control, name: "status" });
  const sections = SECTIONS;
  // The form renders only once it holds the stream's values, so fields don't animate in empty.
  const [loadedId, setLoadedId] = useState(null);

  useEffect(() => {
    if (stream) {
      setLoadedId(stream.id);
      reset({
        ...stream,
        gameMode: stream.gameMode ?? GameMode.TextChain,
        roundScoring: stream.roundScoring ?? DEFAULT_ROUND_SCORING,
        status: stream.status ?? "Scheduled",
        // Same default the form applies (start + 7 min), set here so a fresh load isn't "dirty".
        round1StartsAt: stream.round1StartsAt ?? (stream.startDate ? new Date(Date.parse(stream.startDate) + 7 * 60000).toISOString() : null),
        shareableCards: stream.shareableCards ?? {
          liveHome: { title: null, subtitle: null },
          upcomingHome: { title: null, subtitle: null },
          beatHost: { header: null, title: null, subtitle: null },
          didNotBeatHost: { header: null, title: null, subtitle: null },
        },
      });
    }
  }, [stream, reset]);

  useEffect(() => {
    if (stream) document.title = `${showTitle(stream)} · Streams · Savvy Admin`;
  }, [stream]);

  const [active, scrollTo] = useActiveSection(sections, !!stream && loadedId === stream.id);
  // Each section says if it's done, missing something or has errors. Done sections fold to a
  // one-line summary (Details and Words stay open); the ones that need work open by themselves.
  const parts = useSectionStatus(form, sections, hosts);
  const [fold, setFold] = useState({});
  // Every section opens unfolded; one folded by hand stays folded.
  const isOpen = (id) => fold[id] ?? true;
  const goTo = (id) => {
    setFold((f) => ({ ...f, [id]: true }));
    setTimeout(() => scrollTo(id), 0);
  };
  const frame = (id) => ({ status: parts[id], collapsible: true, open: isOpen(id), onToggle: () => setFold((f) => ({ ...f, [id]: !isOpen(id) })) });
  const errorIds = sections.filter((s) => parts[s.id]?.state === "error").map((s) => s.id);
  const warningIds = sections.filter((s) => parts[s.id]?.state === "todo").map((s) => s.id);
  const doneIds = sections.filter((s) => parts[s.id]?.state === "ok").map((s) => s.id);
  const pending = sections.filter((s) => parts[s.id]?.state !== "ok");

  const submit = async () => {
    setSaving(true);
    try {
      await form.saveButtonProps.onClick();
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    const ok = await trigger();
    if (!ok) {
      const first = sections.find((s) => s.fields.some((f) => getFieldError(f)));
      notify("Some fields need attention", { variant: "error" });
      if (first) goTo(first.id);
      return;
    }
    if (getValues("streamType") !== stream.streamType) {
      setConfirmAudience(true);
      return;
    }
    submit();
  };
  // A picked set fills in the words (rounds and showdown); rewards and the prize stay the
  // stream's. Saving links the set to the stream (public streams use a set once).
  const applySet = (set) => {
    setPicking(false);
    const prev = form.getValues("textSavvyRounds.rounds") ?? [];
    // Same as adding a set anywhere else: its words, times and Round Pounder rewards; its showdown
    // (word and prize) or none when the set has none.
    form.replaceRounds(set.rounds.map((r, i) => ({ ...prev[i], roundIndex: i, word: r.word, durationInSeconds: r.durationInSeconds ?? durationFor(r.word, i), roundBusterReward: r.roundBusterReward ?? prev[i]?.roundBusterReward ?? busterFor(i) })));
    const current = form.getValues("showdownConfiguration");
    form.setValue("showdownConfiguration", set.showdown ? { superSavvyOnly: false, ...current, word: set.showdown.word, prize: set.showdown.prize ?? current?.prize ?? presets[form.gameMode ?? GameMode.TextChain]?.showdown?.prize ?? { rewardType: "Cash", amount: 100 } } : null, { shouldDirty: true });
    form.setValue("wordSetId", set.id, { shouldDirty: true });
    notify("Words filled in. Save to keep them.");
  };
  // react-hook-form's `errors` proxy updates after render; read the latest state directly.
  const getFieldError = (f) => form.control.getFieldState(f).invalid;

  if (query?.isError) {
    const e = query.error;
    const missing = e?.response?.status === 404 || e?.statusCode === 404 || e?.status === 404 || /\b404\b/.test(e?.message ?? "");
    return (
      <EmptyState icon={missing ? "search_off" : "error"} title={missing ? "Stream not found" : "Couldn't load this stream"} description={missing ? "It may have been deleted, or the link is out of date." : query.error?.message}>
        <Button variant="tonal" onClick={() => navigate("/streams")}>
          Back to streams
        </Button>
      </EmptyState>
    );
  }
  if (!stream || loadedId !== stream.id) return <DetailSkeleton />;

  const audience = STREAM_TYPES[getValues("streamType")];

  return (
    <Box>
      <DetailHeader
        onBack={() => navigate("/streams")}
        backLabel="Back to streams"
        media={<StreamImage stream={stream} size={48} />}
        title={showTitle(stream)}
        badge={<StatusBadge status={status ?? stream.status} draft={logoHidden(stream)} />}
        subtitle={
          <>
            <Box component="span" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {formatDate(stream.startDate, "ddd, MMM D · h:mm A")} · with {stream.hostDisplayName || stream.hostName}
            </Box>
            <SetupWarning stream={stream} />
          </>
        }
        actions={
          <>
            {isDirty && (
              <Button variant="text" onClick={() => reset()} disabled={saving} sx={{ display: { xs: "none", sm: "inline-flex" } }}>
                Discard
              </Button>
            )}
            <Button onClick={save} disabled={!isDirty || saving} startIcon={<Icon name="check" />}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <ActionMenu
              edge="end"
              items={[
                { label: "Discard changes", icon: "undo", onClick: () => reset(), hidden: !isDirty, sx: { display: { sm: "none" } } },
                // Status is changed here (rarely, by hand); the badge shows it until saved.
                ...STATUS_OPTIONS.filter((o) => o.value !== status).map((o, i) => ({
                  label: `Mark as ${o.label.toLowerCase()}`,
                  icon: o.icon,
                  divider: i === 0,
                  onClick: () => form.setValue("status", o.value, { shouldDirty: true }),
                })),
                { label: "Stream key", icon: "key", divider: true, onClick: () => setKeyOpen(true) },
                { label: "Duplicate", icon: "content_copy", onClick: () => navigate(`/streams/create?from=${id}`) },
                { label: "Delete", icon: "delete", tone: "error", divider: true, onClick: () => setConfirmDelete(true) },
              ]}
            />
          </>
        }
      />

      <DetailBody nav={<SectionNav label="Stream sections" sections={sections} active={active} onSelect={goTo} errorIds={errorIds} warningIds={warningIds} doneIds={doneIds} />}>
        {/* What's left, at the top, each a link to its section. */}
        {pending.length > 0 && (
          <Banner tone={errorIds.length ? "error" : "warning"} icon={errorIds.length ? "error" : "checklist"}>
            {logoHidden(stream) ? "The app hides the game mode logo until the words are in. Still to do: " : "Still to do: "}
            {pending.map((s, i) => (
              <Fragment key={s.id}>
                {i > 0 && " · "}
                <Link component="button" type="button" color="inherit" onClick={() => goTo(s.id)} sx={{ fontWeight: 600, verticalAlign: "baseline" }}>
                  {s.label}
                </Link>
                {parts[s.id].state === "error" ? " (errors)" : ` (${parts[s.id].todo.join(", ").toLowerCase()})`}
              </Fragment>
            ))}
          </Banner>
        )}
        {/* In the order a stream is put together: what's played, with which words, by whom, when;
            then the extras, which come set from the game mode and the Default presets. */}
        <GameModeSection form={form} frame={frame("mode")} />
        <WordsSection form={form} validateWord={validateWord} onPickWords={() => setPicking(true)} frame={frame("words")} />
        <HostSection form={form} hosts={hosts} frame={frame("host")} />
        <DetailsSection form={form} frame={frame("basics")} />
        <SponsorSection form={form} frame={frame("sponsor")} />
        <RewardsSection form={form} frame={frame("rewards-card")} />
        <RaffleSection form={form} frame={frame("raffle")} />
        <ScoringSection form={form} frame={frame("game")} />
        <ShareCardsSection form={form} hosts={hosts} frame={frame("share")} />
        <NotificationsSection form={form} frame={frame("notifications-card")} />
      </DetailBody>

      <StreamKeyDialog stream={keyOpen ? stream : null} onClose={() => setKeyOpen(false)} />
      <WordSetPickerDialog open={picking} type={form.gameMode ?? GameMode.TextChain} stream={{ ...stream, streamType: getValues("streamType") }} onClose={() => setPicking(false)} onPick={applySet} />

      <ConfirmDialog
        open={confirmAudience}
        title={`Change audience to ${audience?.label}?`}
        confirmLabel="Save"
        onCancel={() => setConfirmAudience(false)}
        onConfirm={() => {
          setConfirmAudience(false);
          submit();
        }}
      >
        {audience?.hint}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete stream?"
        tone="error"
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          remove(
            { resource: "TextSavvyStream", id, successNotification: false, invalidates: ["list"] },
            {
              onSuccess: () => {
                notify(`“${showTitle(stream)}” deleted`);
                navigate("/streams");
              },
            },
          );
        }}
      >
        “{showTitle(stream)}” and its rounds will be removed. This can't be undone.
      </ConfirmDialog>
    </Box>
  );
}
