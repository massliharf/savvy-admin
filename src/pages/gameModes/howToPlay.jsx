// Streams › How to play — what players see of each game in the app: its logo, name and
// description, the home screen pill and the How to play power-ups. One card per game; a card
// opens that game in a side sheet.
import { useEffect } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ActionMenu } from "../../ds/ActionMenu";
import { useDragSort } from "../../ds/DragSort";
import { ImageCell, TextCell } from "../../ds/EditTable";
import { ImageField, useFilePreview } from "../../ds/ImageField";
import { ListAdd, ListGroup, ListItem } from "../../ds/ListGroup";
import { SideSheet } from "../../ds/SideSheet";
import { CardsSkeleton } from "../../ds/Skeletons";
import { MODE_LOGOS } from "../../assets";
import { DP } from "../../providers";
import { useLibraryMutations, useSheet } from "../library/shared";
import { CardGrid, ShopCard } from "../shop/shared";
import { TextInput } from "../streams/detail/fields";
import { PillFields } from "../streams/detail/sections";
import { useGameModePresets } from "../streams/gameModes";

const powerUpCount = (n) => `${n} ${n === 1 ? "power-up" : "power-ups"}`;

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

function HowToPlaySheet({ sheet }) {
  const { save, saving } = useLibraryMutations({ resource: "GameMode", dataProviderName: DP.gameModes, noun: "How to play & format" });
  const { control, reset, handleSubmit, setValue, setError, formState } = useForm({ defaultValues: { name: "", summary: "", howToPlay: { powerUps: [] } } });
  const { fields: powerUps, append, move, remove } = useFieldArray({ control, name: "howToPlay.powerUps" });
  const drag = useDragSort({ count: powerUps.length, onMove: move });
  const [gameLogoUrl, gameModeIconUrl] = useWatch({ control, name: ["gameLogoUrl", "gameModeIconUrl"] });

  useEffect(() => {
    if (!sheet.open) return;
    const r = sheet.record;
    reset({ ...r, howToPlay: { powerUps: (r.howToPlay?.powerUps ?? []).map((p) => ({ ...p, iconFile: null })) }, gameModeIconFile: null, gameLogoFile: null });
  }, [sheet.open, sheet.record, reset]);

  // The whole game mode goes back (the endpoint replaces it); only these fields change here.
  const submit = handleSubmit(async (v) => {
    if (await save(sheet.record.id, v, setError)) sheet.close();
  });
  const image = (fileField, urlField) => ({
    onChange: (f) => setValue(fileField, f, { shouldDirty: true }),
    onRemove: () => {
      setValue(fileField, null, { shouldDirty: true });
      setValue(urlField, null, { shouldDirty: true });
    },
  });
  const logo = image("gameLogoFile", "gameLogoUrl");
  const icon = image("gameModeIconFile", "gameModeIconUrl");

  return (
    <SideSheet
      open={sheet.open}
      onClose={sheet.close}
      dirty={formState.isDirty}
      title={sheet.record?.name}
      subtitle="How to play & format"
      actions={
        <>
          <Button variant="text" onClick={sheet.close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !formState.isDirty}>
            Save
          </Button>
        </>
      }
    >
      <ImageField label="Game logo" value={gameLogoUrl} width={336} height={156} fit="contain" onChange={logo.onChange} onRemove={logo.onRemove} />
      <TextInput control={control} name="name" label="Title" max={40} rules={{ validate: (v) => (v?.trim() ? (v.length <= 40 ? true : "Use 40 characters or fewer") : "Enter a title") }} />
      <TextInput control={control} name="summary" label="Description" max={120} rules={{ required: "Add a short description", maxLength: { value: 120, message: "Use 120 characters or fewer" } }} />
      <Box>
        <Typography variant="titleSmall" component="div" sx={{ mb: 1.5 }}>
          Power-ups
        </Typography>
        <ListGroup label="Power-ups">
          {powerUps.map((f, i) => (
            <PowerUpRow key={f.id} control={control} setValue={setValue} index={i} drag={drag} onRemove={() => remove(i)} />
          ))}
          <ListAdd label="Add power-up" onClick={() => append({ title: "", description: "", iconUrl: "", iconFile: null })} />
        </ListGroup>
      </Box>
      <PillFields control={control} iconUrl={gameModeIconUrl} onIconChange={icon.onChange} onIconRemove={icon.onRemove} />
    </SideSheet>
  );
}

export default function HowToPlayPage() {
  const sheet = useSheet();
  const { presets, isLoading } = useGameModePresets();
  const modes = Object.values(presets);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {isLoading ? (
        <CardsSkeleton count={2} label="Loading games" />
      ) : (
        <CardGrid>
          {modes.map((m) => {
            const src = m.gameLogoUrl ?? MODE_LOGOS[m.id];
            return (
              <ShopCard
                key={m.id}
                media={src && <Box component="img" src={src} alt="" sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.5, display: "block" }} />}
                aspect="2 / 1"
                icon="sports_esports"
                title={m.name}
                meta={
                  <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
                    {powerUpCount(m.howToPlay?.powerUps?.length ?? 0)}
                  </Typography>
                }
                onOpen={() => sheet.openEdit(m)}
              />
            );
          })}
        </CardGrid>
      )}
      <HowToPlaySheet sheet={sheet} />
    </Box>
  );
}
