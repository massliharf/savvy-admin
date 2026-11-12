// Streams › Game modes — each game as players see it in the app: its title, its logo and the
// power-ups its How to play shows (picked from Streams › Power-ups). One card per game; a card
// opens that game in a side sheet.
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import { ImageField } from "../../ds/ImageField";
import { IconTile } from "../../ds/IconTile";
import { ListGroup, ListItem } from "../../ds/ListGroup";
import { SideSheet } from "../../ds/SideSheet";
import { CardsSkeleton } from "../../ds/Skeletons";
import { EmptyState } from "../../ds/EmptyState";
import { MODE_LOGOS } from "../../assets";
import { DP } from "../../providers";
import { useLibraryMutations, useSheet } from "../library/shared";
import { CardGrid, ShopCard } from "../shop/shared";
import { TextInput } from "../streams/detail/fields";
import { useGameModePresets } from "../streams/gameModes";
import { usePowerUps } from "./powerUps";

const powerUpCount = (n) => `${n} ${n === 1 ? "power-up" : "power-ups"}`;

/** The power-ups as rows with a checkbox: the checked ones show in this game's How to play. */
function PowerUpPicker({ control, setValue }) {
  const { powerUps } = usePowerUps();
  const picked = useWatch({ control, name: "powerUpIds" }) ?? [];
  const toggle = (id, on) =>
    setValue(
      "powerUpIds",
      // Kept in the order of Streams › Power-ups.
      powerUps.map((p) => p.id).filter((x) => (x === id ? on : picked.includes(x))),
      { shouldDirty: true },
    );
  if (powerUps.length === 0) return <EmptyState compact icon="bolt" title="No power-ups yet" description="Add them in Streams › Power-ups." />;
  return (
    <ListGroup label="Power-ups">
      {powerUps.map((p) => (
        <ListItem
          key={p.id}
          onClick={() => toggle(p.id, !picked.includes(p.id))}
          leadingControl={<Checkbox checked={picked.includes(p.id)} onChange={(e) => toggle(p.id, e.target.checked)} onClick={(e) => e.stopPropagation()} slotProps={{ input: { "aria-label": `Show ${p.title}` } }} />}
          leading={<IconTile src={p.iconUrl} icon="bolt" />}
          title={p.title}
          supporting={p.description}
        />
      ))}
    </ListGroup>
  );
}

function GameModeSheet({ sheet }) {
  const { save, saving } = useLibraryMutations({ resource: "GameMode", dataProviderName: DP.gameModes, noun: "Game mode" });
  const { control, reset, handleSubmit, setValue, setError, formState } = useForm({ defaultValues: { name: "", gameLogoUrl: null, gameLogoFile: null, powerUpIds: [] } });
  const gameLogoUrl = useWatch({ control, name: "gameLogoUrl" });

  useEffect(() => {
    if (!sheet.open) return;
    const r = sheet.record;
    reset({ name: r.name ?? "", gameLogoUrl: r.gameLogoUrl ?? MODE_LOGOS[r.id] ?? null, gameLogoFile: null, powerUpIds: r.powerUpIds ?? [] });
  }, [sheet.open, sheet.record, reset]);

  const submit = handleSubmit(async (v) => {
    if (await save(sheet.record.id, { name: v.name, gameLogoUrl: v.gameLogoUrl, gameLogoFile: v.gameLogoFile, powerUpIds: v.powerUpIds }, setError)) sheet.close();
  });

  return (
    <SideSheet
      open={sheet.open}
      onClose={sheet.close}
      dirty={formState.isDirty}
      title={sheet.record?.name}
      subtitle="Game mode"
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
      <ImageField
        label="Logo"
        value={gameLogoUrl}
        width={336}
        height={156}
        fit="contain"
        onChange={(f) => setValue("gameLogoFile", f, { shouldDirty: true })}
        onRemove={() => {
          setValue("gameLogoFile", null, { shouldDirty: true });
          setValue("gameLogoUrl", null, { shouldDirty: true });
        }}
      />
      <TextInput control={control} name="name" label="Title" max={40} rules={{ validate: (v) => (v?.trim() ? (v.length <= 40 ? true : "Use 40 characters or fewer") : "Enter a title") }} />
      <Box>
        <Typography variant="titleSmall" component="div" sx={{ mb: 1.5 }}>
          Power-ups
        </Typography>
        <PowerUpPicker control={control} setValue={setValue} />
      </Box>
    </SideSheet>
  );
}

export default function GameModesPage() {
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
                    {powerUpCount(m.powerUpIds?.length ?? 0)}
                  </Typography>
                }
                onOpen={() => sheet.openEdit(m)}
              />
            );
          })}
        </CardGrid>
      )}
      <GameModeSheet sheet={sheet} />
    </Box>
  );
}
