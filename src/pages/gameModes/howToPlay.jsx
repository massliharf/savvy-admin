// Library › Gameplay › Game modes — each game as players see it in the app: its title and its logo.
// (Power-ups are picked per game set and stream.) One card per game mode; a card opens it in a side
// sheet. "New game mode" sets one up for a game (TextChain or SubText) that has none yet; word sets
// can only be written for the game modes set up here.
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { EmptyState } from "../../ds/EmptyState";
import { Icon } from "../../ds/Icon";
import { ImageField } from "../../ds/ImageField";
import { PageToolbar } from "../../ds/Page";
import { SideSheet } from "../../ds/SideSheet";
import { CardsSkeleton } from "../../ds/Skeletons";
import { MODE_LOGOS } from "../../assets";
import { DP } from "../../providers";
import { useLibraryMutations, useSheet } from "../library/shared";
import { CardGrid, ShopCard } from "../shop/shared";
import { ChoiceInput, TextInput } from "../streams/detail/fields";
import { BASE_MODES, GAME_MODES, useGameModePresets } from "../streams/gameModes";

const GAMES = BASE_MODES.map((m) => ({ value: m.id, label: m.id, icon: m.icon }));

function GameModeSheet({ sheet, taken }) {
  const isNew = sheet.open && !sheet.record?.id;
  const { save, saving } = useLibraryMutations({ resource: "GameMode", dataProviderName: DP.gameModes, noun: "Game mode" });
  const { control, reset, handleSubmit, setValue, getValues, setError, formState } = useForm({ defaultValues: { base: "", name: "", gameLogoUrl: null, gameLogoFile: null } });
  const [base, gameLogoUrl] = useWatch({ control, name: ["base", "gameLogoUrl"] });
  const free = GAMES.filter((g) => !taken.includes(g.value));

  useEffect(() => {
    if (!sheet.open) return;
    const r = sheet.record;
    if (r?.id) reset({ base: r.id, name: r.name ?? "", gameLogoUrl: r.gameLogoUrl ?? MODE_LOGOS[r.id] ?? null, gameLogoFile: null });
    else {
      // A new one starts on the first game without a game mode, with that game's name and logo.
      const first = free[0]?.value ?? "";
      reset({ base: first, name: GAME_MODES[first]?.label ?? "", gameLogoUrl: MODE_LOGOS[first] ?? null, gameLogoFile: null });
    }
    // Only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.open, sheet.record, reset]);

  // Switching the game of a new one brings that game's name and logo, unless changed by hand.
  const pickGame = (next) => {
    const prev = getValues("base");
    if (getValues("name") === (GAME_MODES[prev]?.label ?? "")) setValue("name", GAME_MODES[next]?.label ?? "", { shouldDirty: true });
    if (!getValues("gameLogoFile")) setValue("gameLogoUrl", MODE_LOGOS[next] ?? null, { shouldDirty: true });
    setValue("base", next, { shouldDirty: true, shouldValidate: true });
  };

  const submit = handleSubmit(async (v) => {
    const values = { name: v.name, gameLogoUrl: v.gameLogoUrl, gameLogoFile: v.gameLogoFile };
    if (await save(isNew ? null : sheet.record.id, isNew ? { ...values, base: v.base } : values, setError)) sheet.close();
  });

  return (
    <SideSheet
      open={sheet.open}
      onClose={sheet.close}
      dirty={formState.isDirty}
      title={isNew ? "New game mode" : sheet.record?.name}
      subtitle={isNew ? undefined : "Game mode"}
      actions={
        <>
          <Button variant="text" onClick={sheet.close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || (isNew ? !base : !formState.isDirty)}>
            {isNew ? "Add game mode" : "Save"}
          </Button>
        </>
      }
    >
      {isNew && (
        <ChoiceInput
          control={control}
          name="base"
          label="Game"
          options={GAMES.map((g) => ({ ...g, disabled: taken.includes(g.value) }))}
          rules={{ required: "Pick a game" }}
          helperText={free.length ? "Each game has one game mode." : "TextChain and SubText both have a game mode. Open one to change its title or logo."}
          onChange={pickGame}
        />
      )}
      {(!isNew || free.length > 0) && (
        <>
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
        </>
      )}
    </SideSheet>
  );
}

export default function GameModesPage() {
  const sheet = useSheet();
  const { presets, isLoading } = useGameModePresets();
  const modes = Object.values(presets);
  const taken = modes.map((m) => m.id);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageToolbar description="How each game looks in the app: its title and logo. Word sets are written for the game modes here." actionLabel="New game mode" onAction={sheet.openNew} />
      {isLoading ? (
        <CardsSkeleton count={2} label="Loading games" />
      ) : modes.length === 0 ? (
        <EmptyState icon="sports_esports" title="No game modes yet" description="Add one before writing word sets.">
          <Button color="secondary" startIcon={<Icon name="add" />} onClick={sheet.openNew}>
            New game mode
          </Button>
        </EmptyState>
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
      <GameModeSheet sheet={sheet} taken={taken} />
    </Box>
  );
}
