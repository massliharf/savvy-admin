// A bundle's settings under Streams › Bundles: what a new stream of it starts with. Game (points
// per round, the showdown and its prize, rewards) and Messaging. Hosts and sponsors are picked per
// stream and time slot, not here. How the game shows in the app is edited in Streams › How to play.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "@refinedev/react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { Icon } from "../../ds/Icon";
import { EmptyState } from "../../ds/EmptyState";
import { FormSection } from "../../ds/FormSection";
import { DetailHeader, DetailSkeleton, SectionGroup } from "../../ds/DetailLayout";
import { IconTile } from "../../ds/IconTile";
import { TextInput } from "../streams/detail/fields";
import { SaveBar } from "../../ds/SaveBar";
import Radio from "@mui/material/Radio";
import { useTheme } from "@mui/material/styles";
import { ListAdd, ListGroup, ListItem } from "../../ds/ListGroup";
import { Pill } from "../../ds/Pill";
import { useSheet } from "../library/shared";
import { KINDS, PresetSheet } from "../liveops/presets";
import { useNotify } from "../../shell/notifications";
import { DP } from "../../providers";
import { bundleLine, useBundles } from "../streams/gameModes";
import { RewardsEditor, ShowdownEditor } from "../streams/detail/sections";
import { AudienceField } from "../streams/pickers";
import { StreamType } from "../streams/enums";
import { useDelete, useList } from "@refinedev/core";
import { ConfirmDialog } from "../../ds/ConfirmDialog";



/**
 * The library's presets of one kind (share cards or notifications), as the same rows as in
 * Library: the radio picks the one new streams of this bundle start from, the row opens the
 * preset in its side sheet to read and edit it, and "Add preset" makes a new one. Picking the
 * library's Default keeps following it (nothing stored on the bundle).
 */
function BundlePresets({ kind, control, setValue, name }) {
  const k = KINDS[kind];
  const { m3: c } = useTheme();
  const sheet = useSheet();
  const picked = useWatch({ control, name });
  const { data } = useList({ resource: k.resource, dataProviderName: k.dataProviderName, pagination: { mode: "off" } });
  const rows = data?.data ?? [];
  const fallback = rows.find((p) => p.isDefault) ?? rows[0];
  const current = rows.find((p) => p.id === picked) ?? fallback;
  const pick = (p) => setValue(name, p.id === fallback?.id ? null : p.id, { shouldDirty: true, shouldTouch: true });
  return (
    <>
      <ListGroup label={k.title}>
        {rows.map((p) => (
          <ListItem
            key={p.id}
            onClick={() => sheet.openEdit(p)}
            leadingControl={<Radio checked={p.id === current?.id} onChange={() => pick(p)} slotProps={{ input: { "aria-label": `Start new streams from ${p.name}` } }} />}
            title={p.name}
            supporting={k.summary(p)}
            trailing={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {p.id === fallback?.id && <Pill>Default</Pill>}
                <Icon name="chevron_right" style={{ color: c.onSurfaceVariant }} />
              </Box>
            }
          />
        ))}
        <ListAdd label="Add preset" onClick={sheet.openNew} />
      </ListGroup>
      <PresetSheet kind={kind} sheet={sheet} />
    </>
  );
}

/** A game mode's settings on one page: what its new streams start with. Changes save with the floating Save bar. */
export function GameModeSettings({ id }) {
  const notify = useNotify();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: removeMode, isPending: deleting } = useDelete();
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
      resource: "Bundle",
      dataProviderName: DP.bundles,
      id,
      action: "edit",
      redirect: false,
      successNotification: () => ({ message: "Game set saved", type: "success" }),
    },
  });
  // The same parts as a stream's page (scoring, rewards) take the form as one object.
  const modeForm = { control, setValue, getValues, trigger };
  const mode = query?.data?.data;
  const streamType = useWatch({ control, name: "streamType" });

  useEffect(() => {
    if (!mode) return;
    reset({
      ...mode,
      streamType: mode.streamType ?? StreamType.Public,
      defaultRewards: mode.defaultRewards?.length ? mode.defaultRewards : [{ rewardType: "BombPowerup", amount: 1 }],
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

  if (query?.isError) return <EmptyState icon="error" title="Couldn't load this game set" description={query.error?.message} />;
  if (!mode || !loaded) return <DetailSkeleton />;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 880 }}>
      {/* The same groups, in the same order, as a stream's page: it starts with these. */}
      <SectionGroup title="New streams start with">
          <FormSection id="name" title="Name">
            <TextInput control={control} name="name" label="Name" max={40} rules={{ validate: (v) => (v?.trim() ? (v.trim().length <= 40 ? true : "Use 40 characters or fewer") : "Enter a name") }} />
          </FormSection>
          {/* Public or Internal, and (for a public one) Super Savvy only: new streams of this game set get it. */}
          <FormSection id="audience" title="Who can join">
            <Controller name="streamType" control={control} render={({ field }) => <AudienceField value={field.value} onChange={field.onChange} />} />
          </FormSection>
          <FormSection id="scoring" title="Scoring" description="The preset new streams start from. Open one to see and edit its points.">
            <BundlePresets kind="scoring" control={control} setValue={setValue} name="defaultScoringPresetId" />
          </FormSection>
          <FormSection id="game" title="Game" description="The showdown and the rewards.">
            <ShowdownEditor control={control} setValue={setValue} name="showdown" word={false} superSavvy={streamType === StreamType.SuperSavvy} note="Each stream gets its showdown word from its word set." />
            <RewardsEditor form={modeForm} keys={["defaultRewards"]} stumper />
          </FormSection>
      </SectionGroup>
      {/* The library's presets, as in Library: pick one per kind; a row opens it to edit. */}
      <SectionGroup title="Messaging">
          <FormSection id="share" title="Share cards" description="The preset new streams start from. Open one to see and edit its cards.">
            <BundlePresets kind="share" control={control} setValue={setValue} name="defaultSharePresetId" />
          </FormSection>
          <FormSection id="notifications" title="Notifications" description="The preset new streams start from. Open one to see and edit its texts.">
            <BundlePresets kind="notify" control={control} setValue={setValue} name="defaultNotificationPresetId" />
          </FormSection>
      </SectionGroup>
      <Box>
        <Button variant="text" color="error" startIcon={<Icon name="delete" />} disabled={deleting} onClick={() => setConfirmDelete(true)}>
          Delete game set
        </Button>
      </Box>
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete “${mode.name}”?`}
        tone="error"
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          removeMode(
            { resource: "Bundle", dataProviderName: DP.bundles, id, successNotification: false, errorNotification: false, invalidates: ["list"] },
            {
              onSuccess: () => {
                notify(`“${mode.name}” deleted`);
                navigate("/game-sets", { replace: true });
              },
              onError: (e) => notify(e?.errors?.id?.[0] ?? e?.response?.data?.errors?.id?.[0] ?? "Couldn't delete the game set", { variant: "error" }),
            },
          );
        }}
      >
        Streams made from it keep what they started with.
      </ConfirmDialog>
      <SaveBar dirty={isDirty} saving={saving} onSave={save} onDiscard={() => reset()} />
    </Box>
  );
}

/** A bundle's page (opened from its card): what its new streams start with. */
export default function GameModeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { byId, isLoading } = useBundles();
  const bundle = byId[id];
  useEffect(() => {
    if (bundle) document.title = `${bundle.name} · Game sets · Savvy Admin`;
  }, [bundle]);
  if (isLoading) return <DetailSkeleton />;
  if (!bundle) return <EmptyState icon="search_off" title="Game set not found" description="It may have been deleted." />;
  return (
    <Box>
      <DetailHeader
        onBack={() => navigate("/game-sets")}
        backLabel="Back to game sets"
        media={<IconTile icon={bundle.showdown?.superSavvyOnly ? "diamond" : "trophy"} tone={bundle.showdown?.prize?.rewardType === "Cash" ? "green" : "violet"} />}
        title={bundle.name}
        subtitle={bundleLine(bundle)}
      />
      <Box sx={{ px: { xs: 2, sm: 3.5 }, py: 3 }}>
        <GameModeSettings key={id} id={id} />
      </Box>
    </Box>
  );
}
