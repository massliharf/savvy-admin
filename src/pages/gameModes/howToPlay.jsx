// Library › Gameplay › Game modes — each game mode as players see it in the app: its logo, title and
// the description under the logo. (Power-ups are picked per game set and stream.) One card per game
// mode; a card opens it in a side sheet. "New game mode" adds one for a game (TextChain or SubText);
// a game can have several, and each plays by its game's rules. Word sets are written for the game
// modes here.
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
import { BASE_MODES, GAME_MODES, gameOf, useGameModePresets } from "../streams/gameModes";

const GAMES = BASE_MODES.map((m) => ({ value: m.id, label: m.id, icon: m.icon }));
const lengthRule = (what, max) => ({ validate: (v) => (v?.trim() ? (v.trim().length <= max ? true : `Use ${max} characters or fewer`) : `Enter a ${what}`) });

function GameModeSheet({ sheet, taken }) {
  const isNew = sheet.open && !sheet.record?.id;
  const { save, saving } = useLibraryMutations({ resource: "GameMode", dataProviderName: DP.gameModes, noun: "Game mode" });
  const { control, reset, handleSubmit, setValue, getValues, setError, formState } = useForm({ defaultValues: { base: "", name: "", summary: "", gameLogoUrl: null, gameLogoFile: null } });
  const gameLogoUrl = useWatch({ control, name: "gameLogoUrl" });

  // What a new game mode of `game` starts with: the game's own name and logo while that game has no
  // game mode yet, else a blank title and logo to make it its own. The description always starts
  // from the game's rules.
  const startOf = (game) => {
    const first = !taken.includes(game);
    return { name: first ? (GAME_MODES[game]?.label ?? "") : "", summary: GAME_MODES[game]?.summary ?? "", gameLogoUrl: first ? (MODE_LOGOS[game] ?? null) : null };
  };

  useEffect(() => {
    if (!sheet.open) return;
    const r = sheet.record;
    if (r?.id) reset({ base: r.base ?? r.id, name: r.name ?? "", summary: r.summary ?? "", gameLogoUrl: r.gameLogoUrl ?? null, gameLogoFile: null });
    else {
      const first = GAMES.find((g) => !taken.includes(g.value))?.value ?? GAMES[0].value;
      reset({ base: first, ...startOf(first), gameLogoFile: null });
    }
    // Only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.open, sheet.record, reset]);

  // Switching the game of a new one brings that game's start, for the fields not changed by hand.
  const pickGame = (next) => {
    const was = startOf(getValues("base"));
    const now = startOf(next);
    ["name", "summary"].forEach((k) => getValues(k) === was[k] && setValue(k, now[k], { shouldDirty: true }));
    if (!getValues("gameLogoFile")) setValue("gameLogoUrl", now.gameLogoUrl, { shouldDirty: true });
    setValue("base", next, { shouldDirty: true, shouldValidate: true });
  };

  const submit = handleSubmit(async (v) => {
    const values = { name: v.name.trim(), summary: v.summary.trim(), gameLogoUrl: v.gameLogoUrl, gameLogoFile: v.gameLogoFile };
    if (await save(isNew ? null : sheet.record.id, isNew ? { ...values, base: v.base } : values, setError)) sheet.close();
  });

  return (
    <SideSheet
      open={sheet.open}
      onClose={sheet.close}
      dirty={formState.isDirty}
      title={isNew ? "New game mode" : sheet.record?.name}
      subtitle={isNew ? undefined : `Game mode · ${gameOf(sheet.record?.id)?.id ?? ""}`}
      actions={
        <>
          <Button variant="text" onClick={sheet.close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || (!isNew && !formState.isDirty)}>
            {isNew ? "Add game mode" : "Save"}
          </Button>
        </>
      }
    >
      {isNew && <ChoiceInput control={control} name="base" label="Game" options={GAMES} rules={{ required: "Pick a game" }} helperText="The rules it plays by." onChange={pickGame} />}
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
      <TextInput control={control} name="name" label="Title" max={40} rules={lengthRule("title", 40)} />
      <TextInput control={control} name="summary" label="Description" multiline minRows={2} max={80} rules={lengthRule("description", 80)} helperText="Shown under the logo in the app." />
    </SideSheet>
  );
}

export default function GameModesPage() {
  const sheet = useSheet();
  const { presets, isLoading } = useGameModePresets();
  const modes = Object.values(presets);
  const taken = modes.map((m) => m.base ?? m.id);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageToolbar description="How each game mode looks in the app: its logo, title and description. Word sets are written for the game modes here." actionLabel="New game mode" onAction={sheet.openNew} />
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
            const src = m.gameLogoUrl;
            return (
              <ShopCard
                key={m.id}
                media={src && <Box component="img" src={src} alt="" sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.5, display: "block" }} />}
                aspect="2 / 1"
                icon="sports_esports"
                title={m.name}
                meta={
                  <Typography variant="bodySmall" color="text.secondary" component="div" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
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
