// Presets. Stream share cards and notifications: a stream picks one of each and can still change
// its own copy. App and daily puzzle share cards: the app uses one of each ("In use"), whose texts
// are the share config; "Use" switches it, and saving the one in use updates the app too.
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useList, useUpdate } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { PageToolbar } from "../../ds/Page";
import { SideSheet } from "../../ds/SideSheet";
import { ListAdd, ListGroup, ListItem } from "../../ds/ListGroup";
import { DP } from "../../providers";
import { TextInput } from "../streams/detail/fields";
import { NOTIFICATION_KEYS, NotificationRows, SCORE_BRACKETS, ScoringFields, ShareCardFields, sameScoring } from "../streams/detail/sections";
import { ConfirmDelete, useLibraryMutations, useSheet } from "../library/shared";
import { Pill } from "../../ds/Pill";
import { EmptyState } from "../../ds/EmptyState";
import { ContainerCard } from "../../ds/ContainerCard";
import { CardsSkeleton, RowsSkeleton } from "../../ds/Skeletons";
import { CardGrid, ShopCard } from "../shop/shared";
import { useNotify } from "../../shell/notifications";
import { DEFAULT_ROUND_SCORING, stripRichText } from "../streams/enums";
import { AppCardRows, cardsOf } from "./appCards";

const EMPTY_CARDS = {
  liveHome: { title: "", subtitle: "" },
  upcomingHome: { title: "", subtitle: "" },
  beatHost: { header: "", title: "", subtitle: "" },
  didNotBeatHost: { header: "", title: "", subtitle: "" },
};
const emptyAppCards = (puzzle) => Object.fromEntries(cardsOf(puzzle).map((card) => [card.key, Object.fromEntries(card.fields.map((f) => [f, ""]))]));
const norm = (v) => String(v ?? "").trim();

/** For app / puzzle presets: which one the app uses, and switching it (writes the share config). */
function useAppPreset(share, puzzle) {
  const notify = useNotify();
  // Without a share form (stream presets) watch an empty stand-in, so the hooks stay unconditional.
  const standIn = useForm();
  const live = useWatch({ control: share?.control ?? standIn.control });
  const inUse = (p) => !!share && cardsOf(puzzle).every((card) => card.fields.every((f) => norm(p.cards?.[card.key]?.[f]) === norm(live?.[card.key]?.[f])));
  const use = async (p, quiet) => {
    cardsOf(puzzle).forEach((card) => card.fields.forEach((f) => share.setValue(`${card.key}.${f}`, p.cards?.[card.key]?.[f] ?? "", { shouldDirty: true })));
    try {
      await share.save();
      if (!quiet) notify(`The app now uses “${p.name}”`);
    } catch {
      notify("Couldn't update the app's share cards", { variant: "error" });
    }
  };
  return { inUse, use };
}

const STREAM_SHARE_KEYS = ["liveHome", "upcomingHome", "beatHost", "didNotBeatHost"];
/** Does this stream still carry the preset's texts (its own copy unchanged)? */
const streamUses = (kind, p, s) =>
  kind === "scoring"
    ? sameScoring(p.roundScoring, s.roundScoring)
    : kind === "share"
    ? STREAM_SHARE_KEYS.every((key) => ["header", "title", "subtitle"].every((f) => norm(p.cards?.[key]?.[f]) === norm(s.shareableCards?.[key]?.[f])))
    : NOTIFICATION_KEYS.every((key) => norm(p[key]) === norm(s[key]));

/** For stream presets: the default for new streams, switching it, and how many upcoming streams use each. */
function useStreamPresetUsage(kind, k) {
  const notify = useNotify();
  const { mutateAsync } = useUpdate();
  const { data } = useList({ resource: "TextSavvyStream", filters: [{ field: "status", operator: "eq", value: "Scheduled" }], pagination: { current: 1, pageSize: 500 }, queryOptions: { enabled: kind === "share" || kind === "notify" || kind === "scoring" } });
  const streams = data?.data ?? [];
  const usedBy = (p) => streams.filter((s) => streamUses(kind, p, s)).length;
  const makeDefault = async (p) => {
    try {
      await mutateAsync({ resource: k.resource, dataProviderName: k.dataProviderName, id: p.id, values: { ...p, isDefault: true }, successNotification: false, errorNotification: false });
      notify(`New streams now start from “${p.name}”`);
    } catch {
      notify("Couldn't change the default", { variant: "error" });
    }
  };
  return { usedBy, makeDefault };
}

export const KINDS = {
  share: { resource: "SharePreset", dataProviderName: DP.sharePresets, noun: "Share card preset", title: "Stream share cards", description: "New streams start from the Default.", icon: "style", empty: () => ({ name: "", cards: structuredClone(EMPTY_CARDS) }), summary: (p) => p.cards?.liveHome?.title },
  app: { resource: "AppCardPreset", dataProviderName: DP.appCardPresets, noun: "App share card preset", title: "App share cards", description: "Shared from the profile and after a live show.", icon: "ios_share", puzzle: false, empty: () => ({ name: "", cards: emptyAppCards(false) }), summary: (p) => p.cards?.profileShare?.title },
  puzzle: { resource: "PuzzleCardPreset", dataProviderName: DP.puzzleCardPresets, noun: "Daily puzzle share card preset", title: "Daily puzzle share cards", description: "Shared after today's puzzle.", icon: "extension", puzzle: true, empty: () => ({ name: "", cards: emptyAppCards(true) }), summary: (p) => stripRichText(p.cards?.dailyPuzzleSuccess?.title ?? "") },
  scoring: { resource: "ScoringPreset", dataProviderName: DP.scoringPresets, noun: "Scoring preset", title: "Scoring", description: "Points per round. Each game set picks one (else the Default); a stream can pick another.", icon: "scoreboard", empty: () => ({ name: "", roundScoring: structuredClone(DEFAULT_ROUND_SCORING) }), summary: (p) => `Solve bonus ${SCORE_BRACKETS.map((k) => (p.roundScoring?.[k]?.solveBonusXp ?? 0).toLocaleString()).join(" / ")}` },
  notify: { resource: "NotificationPreset", dataProviderName: DP.notificationPresets, noun: "Notification preset", title: "Notifications", description: "New streams start from the Default.", icon: "notifications", empty: () => ({ name: "", ...Object.fromEntries(NOTIFICATION_KEYS.map((k) => [k, ""])) }), summary: (p) => p.lobbyOpenTitle },
};

/** `footerExtra` adds the preset's own action by Delete (Make default, Use in app). */
export function PresetSheet({ kind, sheet, onSaved, footerExtra }) {
  const k = KINDS[kind];
  const isNew = sheet.open && !sheet.record?.id;
  const { save, destroy, saving } = useLibraryMutations(k);
  const [confirm, setConfirm] = useState(false);
  const form = useForm({ defaultValues: k.empty() });
  const { control, reset, handleSubmit, setError, setValue, formState } = form;

  useEffect(() => {
    if (sheet.open) reset({ ...k.empty(), ...sheet.record });
    // `k` is fixed per sheet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.open, sheet.record, reset]);

  const submit = handleSubmit(async (v) => {
    const saved = await save(isNew ? null : sheet.record.id, v, setError);
    if (saved) {
      onSaved?.(saved);
      sheet.close();
    }
  });

  return (
    <SideSheet
      open={sheet.open}
      onClose={sheet.close}
      dirty={formState.isDirty}
      title={isNew ? `New ${k.noun.toLowerCase()}` : sheet.record?.name}
      subtitle={isNew ? undefined : k.noun}
      footerStart={
        !isNew && (
          <>
            <Button variant="text" color="error" onClick={() => setConfirm(true)}>
              Delete
            </Button>
            {footerExtra}
          </>
        )
      }
      actions={
        <>
          <Button variant="text" onClick={sheet.close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || (!isNew && !formState.isDirty)}>
            {isNew ? `Add ${k.noun.toLowerCase()}` : "Save"}
          </Button>
        </>
      }
    >
      <TextInput control={control} name="name" label="Preset name" rules={{ validate: (v) => (v?.trim() ? true : "Enter a name") }} />
      {kind === "scoring" ? <ScoringFields control={control} setValue={setValue} subText={false} roundCount={5} /> : kind === "share" ? <ShareCardFields form={form} prefix="cards" /> : kind === "notify" ? <NotificationRows form={form} /> : <AppCardRows form={form} puzzle={k.puzzle} prefix="cards." label={k.title} />}
      <ConfirmDelete
        open={confirm}
        title={`Delete ${sheet.record?.name}?`}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          await destroy(sheet.record.id, sheet.record.name);
          sheet.close();
        }}
      >
        {kind === "app" || kind === "puzzle" ? "If the app uses it, the app keeps its texts until you pick another preset." : "Streams that already use it keep their texts."} This can't be undone.
      </ConfirmDelete>
    </SideSheet>
  );
}

/** A preset card's status line: its pill, then how many upcoming streams use it, on one line. */
function PresetStatus({ pill, used }) {
  if (!pill && !used) return null;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, width: "100%" }}>
      {pill}
      {used > 0 && (
        <Typography variant="bodySmall" color="text.secondary" noWrap sx={{ minWidth: 0 }}>
          {used} upcoming {used === 1 ? "stream" : "streams"}
        </Typography>
      )}
    </Box>
  );
}

/**
 * The presets of one kind. On a page they're cards like every library page (CardGrid + ShopCard):
 * `page` makes them the whole page (its title names them), otherwise a titled section of their own
 * (Share cards has three kinds). `bare` (inside a side sheet) keeps them as list rows with their
 * actions on each row; on cards those actions sit in the preset's sheet.
 */
export function PresetList({ kind, share, bare = false, page = false }) {
  const k = KINDS[kind];
  const app = useAppPreset(share, !!k.puzzle);
  const usage = useStreamPresetUsage(kind, k);
  const forStreams = kind === "share" || kind === "notify" || kind === "scoring";
  // Stream presets: the default is the one new streams start from (the first one if none is set).
  const defaultId = (rows) => (rows.find((p) => p.isDefault) ?? rows[0])?.id;
  const { m3: c } = useTheme();
  const sheet = useSheet();
  const { data, isLoading } = useList({ resource: k.resource, dataProviderName: k.dataProviderName, pagination: { mode: "off" } });
  const rows = data?.data ?? [];
  const isDefault = (p) => forStreams && p.id === defaultId(rows);
  const supporting = (p) => {
    if (!forStreams) return k.summary(p);
    const n = usage.usedBy(p);
    return [k.summary(p), n ? `Used by ${n} upcoming ${n === 1 ? "stream" : "streams"}` : null].filter(Boolean).join(" · ");
  };
  const empty = (
    <EmptyState compact icon={k.icon} title="No presets yet">
      <Button color="secondary" startIcon={<Icon name="add" />} onClick={sheet.openNew}>
        New preset
      </Button>
    </EmptyState>
  );

  if (bare) {
    const list = isLoading ? (
      <ContainerCard>
        <RowsSkeleton count={3} lead={false} height={56} label={`Loading ${k.title.toLowerCase()}`} />
      </ContainerCard>
    ) : rows.length === 0 ? (
      <ContainerCard>{empty}</ContainerCard>
    ) : (
      <ListGroup label={k.title}>
        {rows.map((p) => (
          <ListItem
            key={p.id}
            onClick={() => sheet.openEdit(p)}
            leading={<Icon name={k.icon} style={{ color: c.onSurfaceVariant }} />}
            title={p.name}
            supporting={supporting(p)}
            trailing={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {share && (app.inUse(p) ? <Pill tone="primary">In use</Pill> : <Button variant="tonal" size="small" onClick={() => app.use(p)}>Use</Button>)}
                {forStreams && (isDefault(p) ? <Pill>Default</Pill> : <Button variant="tonal" size="small" onClick={() => usage.makeDefault(p)}>Make default</Button>)}
                <Icon name="chevron_right" style={{ color: c.onSurfaceVariant }} />
              </Box>
            }
          />
        ))}
        <ListAdd label="Add preset" onClick={sheet.openNew} />
      </ListGroup>
    );
    return (
      <>
        {list}
        <PresetSheet kind={kind} sheet={sheet} onSaved={share ? (saved) => sheet.record?.id && app.inUse(sheet.record) && app.use(saved, true) : undefined} />
      </>
    );
  }

  // The open preset as the list has it now, for its sheet's action.
  const open = rows.find((p) => p.id === sheet.record?.id);
  const action =
    open && forStreams && !isDefault(open) ? (
      <Button variant="text" onClick={() => usage.makeDefault(open)}>
        Make default
      </Button>
    ) : open && share && !app.inUse(open) ? (
      <Button variant="text" onClick={() => app.use(open)}>
        Use in app
      </Button>
    ) : null;
  const cards = isLoading ? (
    <CardsSkeleton count={2} media={88} label={`Loading ${k.title.toLowerCase()}`} />
  ) : rows.length === 0 ? (
    page ? empty : <ContainerCard>{empty}</ContainerCard>
  ) : (
    <CardGrid>
      {rows.map((p) => (
        // Like every library card: the title, one line of what it is, then one line of status
        // (Default / In use and how many upcoming streams use it). Each line stays one line.
        <ShopCard
          key={p.id}
          icon={k.icon}
          title={p.name}
          meta={
            <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
              {k.summary(p)}
            </Typography>
          }
          pills={<PresetStatus pill={isDefault(p) ? <Pill>Default</Pill> : share && app.inUse(p) ? <Pill tone="primary">In use</Pill> : null} used={forStreams ? usage.usedBy(p) : 0} />}
          onOpen={() => sheet.openEdit(p)}
        />
      ))}
    </CardGrid>
  );
  const editor = <PresetSheet kind={kind} sheet={sheet} footerExtra={action} onSaved={share ? (saved) => sheet.record?.id && app.inUse(sheet.record) && app.use(saved, true) : undefined} />;
  if (page)
    return (
      <>
        <PageToolbar description={k.description} actionLabel="New preset" onAction={sheet.openNew} />
        {cards}
        {editor}
      </>
    );
  // A titled group of cards, like Polls & trivia's.
  return (
    <Box component="section" id={kind} sx={{ display: "flex", flexDirection: "column", gap: 2, scrollMarginTop: 96 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Icon name={k.icon} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="titleMedium" component="h2">
            {k.title}
          </Typography>
          <Typography variant="bodySmall" color="text.secondary" component="div">
            {k.description}
          </Typography>
        </Box>
        <Button variant="tonal" size="small" startIcon={<Icon name="add" size={16} />} onClick={sheet.openNew}>
          New preset
        </Button>
      </Box>
      {cards}
      {editor}
    </Box>
  );
}

/**
 * "Presets" on a stream's section: the presets of that kind in a side sheet over the stream, so
 * nothing on the stream is lost. Each preset opens its own sheet on top to edit.
 */
export function PresetsButton({ kind }) {
  const k = KINDS[kind];
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="tonal" size="small" onClick={() => setOpen(true)}>
        Presets
      </Button>
      <SideSheet
        open={open}
        onClose={() => setOpen(false)}
        title={`${k.title} presets`}
        subtitle={k.description}
        actions={<Button onClick={() => setOpen(false)}>Done</Button>}
      >
        <PresetList kind={kind} bare />
      </SideSheet>
    </>
  );
}

/** Library › Gameplay › Scoring: the scoring presets streams pick from. One list, so the page title names it. */
export function ScoringPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PresetList kind="scoring" page />
    </Box>
  );
}

/** Library › Notifications: the notification presets streams pick from. */
export default function NotificationsPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* One list, so the page title names it (Share cards has several, each titled). */}
      <PresetList kind="notify" page />
    </Box>
  );
}
