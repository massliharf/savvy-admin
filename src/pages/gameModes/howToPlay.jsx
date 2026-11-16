// Library › Gameplay › Game modes — each game as players see it in the app: its title and its logo.
// (Power-ups are picked per game set and stream.) One card per game; a card opens it in a side sheet.
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ImageField } from "../../ds/ImageField";
import { SideSheet } from "../../ds/SideSheet";
import { CardsSkeleton } from "../../ds/Skeletons";
import { MODE_LOGOS } from "../../assets";
import { DP } from "../../providers";
import { useLibraryMutations, useSheet } from "../library/shared";
import { CardGrid, ShopCard } from "../shop/shared";
import { TextInput } from "../streams/detail/fields";
import { useGameModePresets } from "../streams/gameModes";

function GameModeSheet({ sheet }) {
  const { save, saving } = useLibraryMutations({ resource: "GameMode", dataProviderName: DP.gameModes, noun: "Game mode" });
  const { control, reset, handleSubmit, setValue, setError, formState } = useForm({ defaultValues: { name: "", gameLogoUrl: null, gameLogoFile: null } });
  const gameLogoUrl = useWatch({ control, name: "gameLogoUrl" });

  useEffect(() => {
    if (!sheet.open) return;
    const r = sheet.record;
    reset({ name: r.name ?? "", gameLogoUrl: r.gameLogoUrl ?? MODE_LOGOS[r.id] ?? null, gameLogoFile: null });
  }, [sheet.open, sheet.record, reset]);

  const submit = handleSubmit(async (v) => {
    if (await save(sheet.record.id, { name: v.name, gameLogoUrl: v.gameLogoUrl, gameLogoFile: v.gameLogoFile }, setError)) sheet.close();
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
                    {m.summary}
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
