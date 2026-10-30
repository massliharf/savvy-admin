// A game mode's settings, shown as two tabs of Streams › Game modes: Stream defaults (what a new
// stream of this mode starts with, in the same groups as a stream's page: Game, Host, Sponsor,
// Rewards, Messaging) and App (logo, name, home screen pill, How to play).
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { useForm } from "@refinedev/react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { Icon } from "../../ds/Icon";
import { EmptyState } from "../../ds/EmptyState";
import { FormSection } from "../../ds/FormSection";
import { ImageField, useFilePreview } from "../../ds/ImageField";
import { DetailSkeleton, SectionGroup } from "../../ds/DetailLayout";
import { SaveBar } from "../../ds/SaveBar";
import { SelectButton } from "../../ds/SelectButton";
import { useNotify } from "../../shell/notifications";
import { DP } from "../../providers";
import { GAME_MODES } from "../streams/gameModes";
import { TextInput } from "../streams/detail/fields";
import { PillFields, RewardsEditor, ScoringFields, ShowdownEditor } from "../streams/detail/sections";
import { ListAdd, ListGroup, ListItem } from "../../ds/ListGroup";
import { ActionMenu } from "../../ds/ActionMenu";
import { useDragSort } from "../../ds/DragSort";
import { ImageCell, TextCell } from "../../ds/EditTable";
import { useDelete, useList } from "@refinedev/core";
import { ConfirmDialog } from "../../ds/ConfirmDialog";
import Avatar from "@mui/material/Avatar";
import { useTheme } from "@mui/material/styles";
import { cornerFor } from "../../ds/IconTile";
import { HostPicker, PickCard, PickPlaceholder } from "../streams/pickers";
import { useHosts } from "../streams/hosts";



/**
 * One How to Play power-up, edited in its row: the icon (click to change), its name and what it
 * does; drag to reorder, ⋮ to remove.
 */
function PowerUpRow({ control, setValue, index, onRemove, drag }) {
  const base = `howToPlay.powerUps.${index}`;
  const [iconUrl, iconFile, title] = useWatch({ control, name: [`${base}.iconUrl`, `${base}.iconFile`, `${base}.title`] });
  const src = useFilePreview(iconFile, iconUrl);
  const name = title || "power-up";
  return (
    <ListItem
      sortable={drag.item(index)}
      leadingControl={drag.handle(index, name)}
      leading={<ImageCell src={src} label={`${title || "Power-up"} icon`} onPick={(f) => setValue(`${base}.iconFile`, f, { shouldDirty: true })} />}
      trailing={<ActionMenu label={`Actions for ${name}`} items={[{ label: "Remove", icon: "delete", tone: "error", onClick: onRemove }]} />}
    >
      {/* Name and description stacked with the form's 8px gap, never touching. */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <TextCell control={control} name={`${base}.title`} label="Power-up name" placeholder="Name" rules={{ required: "Enter a name" }} sx={{ typography: "titleSmall" }} />
      <TextCell control={control} name={`${base}.description`} label={`What ${name} does`} placeholder="What it does" multiline rules={{ required: "Describe what it does" }} sx={{ typography: "bodyMedium", color: "text.secondary", "& textarea": { py: 0.5 } }} />
      </Box>
    </ListItem>
  );
}

const NO_SPONSOR = "__none";

/** The mode's default host and sponsor, from the libraries (a sponsor is optional). */
function useModeDefaults({ control, setValue }) {
  const { m3: c } = useTheme();
  const hosts = useHosts();
  const { data } = useList({ resource: "Sponsor", dataProviderName: DP.sponsors, pagination: { mode: "off" } });
  const sponsors = [...(data?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const [hostId, sponsorId] = useWatch({ control, name: ["defaultHostId", "defaultSponsorId"] });
  const host = hosts.find((h) => h.id === hostId) ?? null;
  const sponsor = sponsors.find((sp) => sp.id === sponsorId) ?? null;
  const set = (name, v) => setValue(name, v, { shouldDirty: true, shouldTouch: true });
  const thumb = (src, size) => (
    <Avatar src={src ?? undefined} alt="" sx={{ width: size, height: size, borderRadius: `${cornerFor(size)}px`, bgcolor: c.surfaceContainerHighest, color: c.onSurfaceVariant }}>
      <Icon name={src === NO_SPONSOR ? "block" : "handshake"} size={size / 2} />
    </Avatar>
  );
  return { host, sponsor, sponsors, hosts, set, thumb };
}

/** The mode's default host, picked from Hosts. */
function ModeHost({ control, setValue }) {
  const { host, hosts, set } = useModeDefaults({ control, setValue });
  return <HostPicker hosts={hosts} value={host} onChange={(h) => set("defaultHostId", h?.id ?? null)} label={null} />;
}

/** The mode's default sponsor, picked from Sponsors (or none). */
function ModeSponsor({ control, setValue }) {
  const { sponsor, sponsors, set, thumb } = useModeDefaults({ control, setValue });
  return (
    <>
      <PickCard
        label={null}
        ariaLabel="Default sponsor"
        value={sponsor?.id ?? NO_SPONSOR}
        options={[{ value: NO_SPONSOR, media: thumb(NO_SPONSOR, 32), primary: "No sponsor" }, ...sponsors.map((sp) => ({ value: sp.id, media: thumb(sp.imageUrl, 32), primary: sp.name, secondary: sp.title }))]}
        onChange={(id) => set("defaultSponsorId", id === NO_SPONSOR ? null : id)}
        media={sponsor ? thumb(sponsor.imageUrl, 48) : <PickPlaceholder icon="handshake" />}
        title={sponsor?.name ?? "No sponsor"}
        supporting={sponsor ? sponsor.title : `${sponsors.length} ${sponsors.length === 1 ? "sponsor" : "sponsors"} in the library`}
      />
    </>
  );
}

/** The share card and notification presets new streams of this mode start from. */
function ModeMessaging({ control, setValue }) {
  const [shareId, noteId] = useWatch({ control, name: ["defaultSharePresetId", "defaultNotificationPresetId"] });
  const { data: share } = useList({ resource: "SharePreset", dataProviderName: DP.sharePresets, pagination: { mode: "off" } });
  const { data: notes } = useList({ resource: "NotificationPreset", dataProviderName: DP.notificationPresets, pagination: { mode: "off" } });
  const options = (list) => [{ value: "", label: `Library default (${list.find((p) => p.isDefault)?.name ?? "none"})` }, ...list.map((p) => ({ value: p.id, label: p.name }))];
  const set = (name) => (v) => setValue(name, v || null, { shouldDirty: true, shouldTouch: true });
  return (
    <>
      <SelectButton label="Share cards" value={shareId ?? ""} options={options(share?.data ?? [])} onChange={set("defaultSharePresetId")} helperText="Presets are kept in Library › Share cards." />
      <SelectButton label="Notifications" value={noteId ?? ""} options={options(notes?.data ?? [])} onChange={set("defaultNotificationPresetId")} helperText="Presets are kept in Library › Notifications." />
    </>
  );
}

/**
 * A game mode's settings on one page: what its new streams start with, then how it shows in the
 * app. Changes save with the floating Save bar.
 */
export function GameModeSettings({ id }) {
  const notify = useNotify();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: removeMode, isPending: deleting } = useDelete();
  const meta = GAME_MODES[id];
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const {
    refineCore: { query, onFinish },
    control,
    reset,
    setValue,
    getValues,
    handleSubmit,
    trigger,
    formState: { isDirty },
  } = useForm({
    refineCoreProps: {
      resource: "GameMode",
      dataProviderName: DP.gameModes,
      id,
      action: "edit",
      redirect: false,
      successNotification: () => ({ message: "Game mode saved", type: "success" }),
    },
  });
  const { fields: powerUps, append, move, remove } = useFieldArray({ control, name: "howToPlay.powerUps" });
  const powerUpDrag = useDragSort({ count: powerUps.length, onMove: move });
  // The same parts as a stream's page (scoring, rewards) take the form as one object.
  const modeForm = { control, setValue, getValues, trigger };
  const gameModeIconUrl = useWatch({ control, name: "gameModeIconUrl" });
  const gameLogoUrl = useWatch({ control, name: "gameLogoUrl" });
  const mode = query?.data?.data;
  const subText = meta?.base === "SubText";

  useEffect(() => {
    if (!mode) return;
    reset({
      ...mode,
      defaultRewards: mode.defaultRewards?.length ? mode.defaultRewards : [{ rewardType: "BombPowerup", amount: 1 }],
      howToPlay: { powerUps: (mode.howToPlay?.powerUps ?? []).map((p) => ({ ...p, iconFile: null })) },
      gameModeIconFile: null,
      gameLogoFile: null,
    });
    setLoaded(true);
  }, [mode, reset]);

  const save = async () => {
    if (!(await trigger())) {
      notify("Some fields need attention", { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await handleSubmit((values) => onFinish(values))();
    } finally {
      setSaving(false);
    }
  };

  const imageHandlers = (fileField, urlField) => ({
    onChange: (f) => setValue(fileField, f, { shouldDirty: true }),
    onRemove: () => {
      setValue(fileField, null, { shouldDirty: true });
      setValue(urlField, null, { shouldDirty: true });
    },
  });
  const icon = imageHandlers("gameModeIconFile", "gameModeIconUrl");
  const logo = imageHandlers("gameLogoFile", "gameLogoUrl");

  if (query?.isError) return <EmptyState icon="error" title="Couldn't load this game mode" description={query.error?.message} />;
  if (!mode || !loaded) return <DetailSkeleton />;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 880 }}>
      {/* The same groups, in the same order, as a stream's page: it starts with these. */}
      <SectionGroup title="New streams start with">
          <FormSection id="game" title="Game" description="Points per round and the showdown prize.">
            <ScoringFields control={control} subText={subText} roundCount={5} withStumper={false} />
            {meta?.showdown && <ShowdownEditor control={control} setValue={setValue} name="showdown" word={false} note="Each stream gets its showdown word from its word set." />}
          </FormSection>
          <FormSection id="host" title="Host">
            <ModeHost control={control} setValue={setValue} />
          </FormSection>
          <FormSection id="sponsor" title="Sponsor">
            <ModeSponsor control={control} setValue={setValue} />
          </FormSection>
          <FormSection id="rewards" title="Rewards">
            <RewardsEditor form={modeForm} keys={["defaultRewards"]} stumper />
          </FormSection>
          <FormSection id="messaging" title="Messaging">
            <ModeMessaging control={control} setValue={setValue} />
          </FormSection>
      </SectionGroup>
      {/* What players see of the mode in the app. */}
      <SectionGroup title="In the app">
          <FormSection id="details" title="Name & logo">
            <ImageField label="Game logo" value={gameLogoUrl} width={336} height={156} fit="contain" onChange={logo.onChange} onRemove={logo.onRemove} />
            <TextInput control={control} name="name" label="Title" max={40} rules={{ validate: (v) => (v?.trim() ? (v.length <= 40 ? true : "Use 40 characters or fewer") : "Enter a title") }} />
            <TextInput control={control} name="summary" label="Description" max={120} rules={{ required: "Add a short description", maxLength: { value: 120, message: "Use 120 characters or fewer" } }} />
          </FormSection>
          <FormSection id="home" title="Home screen">
            <PillFields control={control} iconUrl={gameModeIconUrl} onIconChange={icon.onChange} onIconRemove={icon.onRemove} />
          </FormSection>
          <FormSection id="howto" title="How to play">
            <ListGroup label="Power-ups">
              {powerUps.map((f, i) => (
                <PowerUpRow key={f.id} control={control} setValue={setValue} index={i} drag={powerUpDrag} onRemove={() => remove(i)} />
              ))}
              <ListAdd label="Add power-up" onClick={() => append({ title: "", description: "", iconUrl: "", iconFile: null })} />
            </ListGroup>
          </FormSection>
      </SectionGroup>
      {/* A mode made here can go again (the server refuses while streams, sets or slots use it). */}
      {mode.base && (
        <Box>
          <Button variant="text" color="error" startIcon={<Icon name="delete" />} disabled={deleting} onClick={() => setConfirmDelete(true)}>
            Delete game mode
          </Button>
        </Box>
      )}
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete “${mode.name}”?`}
        tone="error"
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          removeMode(
            { resource: "GameMode", dataProviderName: DP.gameModes, id, successNotification: false, errorNotification: false, invalidates: ["list"] },
            {
              onSuccess: () => {
                notify(`“${mode.name}” deleted`);
                navigate("/game-modes", { replace: true });
              },
              onError: (e) => notify(e?.errors?.id?.[0] ?? e?.response?.data?.errors?.id?.[0] ?? "Couldn't delete the game mode", { variant: "error" }),
            },
          );
        }}
      >
        Only possible while no stream, word set or time slot uses it.
      </ConfirmDialog>
      <SaveBar dirty={isDirty} saving={saving} onSave={save} onDiscard={() => reset()} />
    </Box>
  );
}

/** Old address of a game mode's settings: now its Stream defaults tab. */
export default function GameModeDetail() {
  const { id } = useParams();
  return <Navigate to={`/game-modes?mode=${id}&tab=settings`} replace />;
}
