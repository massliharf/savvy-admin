// Game mode detail — the defaults a new stream of this mode starts from, and its How to Play.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "@refinedev/react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { Icon } from "../../ds/Icon";
import { IconTile } from "../../ds/IconTile";
import { EmptyState } from "../../ds/EmptyState";
import { FormSection } from "../../ds/FormSection";
import { ImageField, useFilePreview } from "../../ds/ImageField";
import { DetailBody, DetailHeader, DetailSkeleton, SectionNav, useActiveSection } from "../../ds/DetailLayout";
import { useNotify } from "../../shell/notifications";
import { DP } from "../../providers";
import { GAME_MODES } from "../streams/gameModes";
import { TextInput } from "../streams/detail/fields";
import { PillFields, RewardsEditor, ScoringFields, ShowdownEditor } from "../streams/detail/sections";
import { ListAdd, ListGroup, ListItem } from "../../ds/ListGroup";
import { ActionMenu } from "../../ds/ActionMenu";
import { useDragSort } from "../../ds/DragSort";
import { ImageCell, TextCell } from "../../ds/EditTable";
import { useList } from "@refinedev/core";
import Avatar from "@mui/material/Avatar";
import { useTheme } from "@mui/material/styles";
import { cornerFor } from "../../ds/IconTile";
import { HostPicker, PickCard, PickPlaceholder } from "../streams/pickers";
import { useHosts } from "../streams/hosts";

// Pictures first: Details (logo, title, description) leads.
const SECTIONS = [
  { id: "details", label: "Details", icon: "info", fields: ["name", "summary"] },
  // Who hosts and sponsors a new stream of this mode, unless the stream picks otherwise.
  { id: "defaults", label: "Defaults", icon: "tune", fields: ["defaultHostId", "defaultSponsorId"] },
  { id: "home", label: "Home screen", icon: "smartphone", fields: ["gameModeDisplayName", "gameModeBackgroundColor"] },
  { id: "scoring", label: "Scoring", icon: "scoreboard", fields: ["roundScoring"] },
  { id: "showdown", label: "Showdown", icon: "trophy", fields: ["showdown"], showdown: true },
  { id: "rewards", label: "Rewards", icon: "redeem", fields: ["defaultRewards", "hostStumperBonusXp"] },
  { id: "howto", label: "How to play", icon: "help", fields: ["howToPlay"] },
];


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

/** The mode's default host and sponsor, picked from the libraries (a sponsor is optional). */
function ModeDefaults({ control, setValue }) {
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
  return (
    <>
      <HostPicker hosts={hosts} value={host} onChange={(h) => set("defaultHostId", h?.id ?? null)} label="Default host" />
      <PickCard
        label="Default sponsor"
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

export default function GameModeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
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
    formState: { isDirty, errors },
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
  // The same section parts as a stream's page (scoring, rewards) take the form as one object.
  const modeForm = { control, setValue, getValues, trigger };
  const roundCount = useWatch({ control, name: "roundCount" });
  const gameModeIconUrl = useWatch({ control, name: "gameModeIconUrl" });
  const gameLogoUrl = useWatch({ control, name: "gameLogoUrl" });
  const mode = query?.data?.data;
  const subText = meta?.base === "SubText";
  // Only "with Showdown" modes have showdown defaults.
  const sections = SECTIONS.filter((s) => !s.showdown || meta?.showdown);

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

  useEffect(() => {
    if (mode) document.title = `${mode.name} · Game modes · Savvy Admin`;
  }, [mode]);

  const [active, goTo] = useActiveSection(sections, loaded);
  const errorIds = sections.filter((s) => s.fields.some((f) => errors[f])).map((s) => s.id);

  const save = async () => {
    if (!(await trigger())) {
      const first = sections.find((s) => s.fields.some((f) => control.getFieldState(f).invalid));
      notify("Some fields need attention", { variant: "error" });
      if (first) goTo(first.id);
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

  if (query?.isError) {
    return (
      <EmptyState icon="error" title="Couldn't load this game mode" description={query.error?.message}>
        <Button variant="tonal" onClick={() => navigate("/game-modes")}>
          Back to game modes
        </Button>
      </EmptyState>
    );
  }
  if (!mode || !loaded) return <DetailSkeleton />;

  return (
    <Box>
      <DetailHeader
        onBack={() => navigate(`/game-modes?mode=${mode.id}`)}
        backLabel="Back to game modes"
        media={
          <IconTile icon={meta?.icon ?? "sports_esports"} tone={meta?.tone ?? "primary"} size={48} />
        }
        title={mode.name}
        subtitle="Advanced settings · defaults for new streams and sets"
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
          </>
        }
      />
      <DetailBody nav={<SectionNav label="Game mode sections" sections={sections} active={active} onSelect={goTo} errorIds={errorIds} />}>
        <FormSection id="details" title="Details">
          <ImageField label="Game logo" value={gameLogoUrl} width={336} height={156} fit="contain" onChange={logo.onChange} onRemove={logo.onRemove} />
          <TextInput control={control} name="name" label="Title" max={40} rules={{ validate: (v) => (v?.trim() ? (v.length <= 40 ? true : "Use 40 characters or fewer") : "Enter a title") }} />
          <TextInput control={control} name="summary" label="Description" max={120} rules={{ required: "Add a short description", maxLength: { value: 120, message: "Use 120 characters or fewer" } }} />
        </FormSection>

        <FormSection id="defaults" title="Defaults" description="New streams of this mode start with these. A stream can still change them.">
          <ModeDefaults control={control} setValue={setValue} />
        </FormSection>

        <FormSection id="home" title="Home screen">
          <PillFields control={control} iconUrl={gameModeIconUrl} onIconChange={icon.onChange} onIconRemove={icon.onRemove} />
        </FormSection>

        <FormSection id="scoring" title="Scoring">
          <ScoringFields control={control} subText={subText} roundCount={5} withStumper={false} />
        </FormSection>

        {meta?.showdown && (
          <FormSection id="showdown" title="Showdown">
            <ShowdownEditor control={control} setValue={setValue} name="showdown" word={false} note="Each stream picks its own showdown word." />
          </FormSection>
        )}

        <FormSection id="rewards" title="Rewards">
          <RewardsEditor form={modeForm} keys={["defaultRewards"]} stumper />
        </FormSection>

        <FormSection id="howto" title="How to play">
          <ListGroup label="Power-ups">
            {powerUps.map((f, i) => (
              <PowerUpRow key={f.id} control={control} setValue={setValue} index={i} drag={powerUpDrag} onRemove={() => remove(i)} />
            ))}
            <ListAdd label="Add power-up" onClick={() => append({ title: "", description: "", iconUrl: "", iconFile: null })} />
          </ListGroup>
        </FormSection>

      </DetailBody>
    </Box>
  );
}
