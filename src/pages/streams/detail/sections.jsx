// Sections of the stream detail page. Each receives the stream form (useStreamForm) as `form`.
import { useEffect, useRef, useState } from "react";
import { Controller, useFormState, useWatch } from "react-hook-form";
import { useList } from "@refinedev/core";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListSubheader from "@mui/material/ListSubheader";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../../ds/Icon";
import { MenuCheck } from "../../../ds/MenuCheck";
import { FieldGroup, FormSection } from "../../../ds/FormSection";
import { ImageField, useFilePreview } from "../../../ds/ImageField";
import { ColorSwatches } from "../../../ds/ColorSwatches";
import { cornerFor } from "../../../ds/IconTile";
import { DEFAULT_ROUND_DURATION, ROUND_COUNT, GameMode, busterFor, durationFor, NON_CASH_REWARDS, RAFFLE_REWARD_OPTIONS, RewardType, StreamType, richLen, stripRichText } from "../enums";
import { ModeLogo } from "../ModeLogo";
import { PresetsButton } from "../../liveops/presets";
import { AudienceField, HostPicker, PickCard, PickPlaceholder } from "../pickers";
import { HostSheet } from "../../library/hosts";
import { GameSetSheet } from "../../gameModes/sheet";
import { BakedImage } from "../bakeTrial"; // bake trial
import { BackgroundPickerDialog, useBackgroundPresets } from "../../library/backgrounds";
import { backgroundUrl } from "../../../utils/backgrounds";
import { FACE_POSITION, fillHost, hostLabel, titleRule } from "../hosts";
import { useWordSets, useWordsLock } from "../words";
import { useSheet } from "../../library/shared";
import { baseOf, modeId, modeOf, newShowdown, prizeText, roundRewardOf, streamRewards, useBundles, useRewardSets, useStreamBuilder } from "../gameModes";
import { PowerUpPicker } from "../../gameModes/powerUps";
import { DP } from "../../../providers";
import { useTimezoneFormat } from "../../../contexts";
import { DateTimeInput, NumberInput, RewardCell, TextInput, rewardText } from "./fields";
import { EditTable, NumberCell, SelectCell, TextCell, cellSx } from "../../../ds/EditTable";
import { radius } from "../../../theme/tokens";
import { ListGroup, ListItem, ListSwitch } from "../../../ds/ListGroup";
import { Choice, ChoiceGroup, SelectButton } from "../../../ds/SelectButton";
import { EditRows, ItemDialog, firstError, useItemEditor } from "../../../ds/ItemDialog";

const lengthRule = (label, min, max) => ({
  required: min > 0 ? `${label} is required` : false,
  validate: (v) => {
    const n = richLen(v ?? "");
    if (min > 0 && n < min) return `Use at least ${min} character${min > 1 ? "s" : ""}`;
    if (n > max) return `Use ${max} characters or fewer`;
    return true;
  },
});

export const wordRules = (validateWord) => ({
  required: "Enter a word",
  pattern: { value: /^[a-z]+$/, message: "Lowercase letters a–z only" },
  validate: validateWord,
});

/** A round's word: a known word, and not one another round already uses. */
const roundWordRules = (validateWord, base) => {
  const [list, index] = [base.slice(0, base.lastIndexOf(".")), Number(base.split(".").pop())];
  return {
    ...wordRules(),
    validate: {
      known: (v) => validateWord?.(v) ?? true,
      unique: (v, all) => {
        const words = list.split(".").reduce((o, k) => o?.[k], all) ?? [];
        const w = String(v ?? "").trim().toLowerCase();
        return !w || !words.some((r, i) => i !== index && String(r?.word ?? "").trim().toLowerCase() === w) || "Another round uses this word";
      },
    },
  };
};

// ---------------------------------------------------------------- basics
export const STATUS_OPTIONS = [
  { value: "Scheduled", label: "Scheduled", icon: "schedule" },
  { value: "InProgress", label: "Live", icon: "sensors" },
  { value: "Completed", label: "Ended", icon: "flag" },
  { value: "Canceled", label: "Canceled", icon: "cancel" },
];

/** Toggle bound to the form, as a list row (Run headless, Spotlight). */
function SwitchListRow({ control, name, icon, title, supporting }) {
  return <Controller name={name} control={control} render={({ field }) => <ListSwitch icon={icon} title={title} supporting={supporting} checked={!!field.value} onChange={field.onChange} />} />;
}

// ---------------------------------------------------------------- images
// A stream shows its host twice, each time as an image placed on a background: the live game host
// avatar (in the live game) and the hero card (on the home screen). The backgrounds come from the
// stream's game set, the images from its host; each can be switched per stream (another of the
// game set's backgrounds, or one uploaded for this stream only) without changing the game set or
// the host.
const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

// `field` is the stream's (API names kept: heroImageUrl is the avatar background); `list`/`pick`
// are the source's (the game set keeps up to five backgrounds, a host one image).
const IMAGE_PAIRS = [
  {
    key: "avatar",
    title: "Live game host avatar",
    // Square; also a colour or gradient (presets, or Custom).
    background: { label: "Live game host avatar background", short: "Background", source: "set", list: "avatarBackgroundUrls", pick: "avatarBackgroundUrl", field: "heroImageUrl", file: "heroImageFile", width: 1024, height: 1024, swatches: true },
    image: { label: "Live game host avatar image", short: "Image", source: "host", list: "pictureUrls", pick: "imageUrl", field: "imageUrl", file: "hostImageFile", width: 256, height: 256 },
  },
  {
    key: "heroCard",
    title: "Hero card",
    background: { label: "Hero card background", short: "Background", source: "set", list: "heroCardBackgroundUrls", pick: "heroCardBackgroundUrl", field: "heroCardBackgroundUrl", file: null, width: 900, height: 1200 },
    image: { label: "Hero card image", short: "Image", source: "host", list: "heroCardImageUrls", pick: "heroCardImageUrl", field: "heroCardImageUrl", file: null, width: 256, height: 256 },
  },
];
export const IMAGE_FIELDS = IMAGE_PAIRS.flatMap((p) => [p.background.field, p.image.field]);

/**
 * One image of a stream: what it uses now and where that comes from, and "Change" to pick another
 * of its source's, upload one for this stream only, or edit the source (game set or host).
 */
function PictureRow({ def, value, source, sourceName, emptyText, editLabel, onEdit, onPick }) {
  const { m3: c, tokens } = useTheme();
  const [anchor, setAnchor] = useState(null);
  const [swatches, setSwatches] = useState(false);
  const pickFile = useRef(null);
  const urls = (def.list ? source?.[def.list] : null) ?? (source?.[def.pick] ? [source[def.pick]] : []);
  const current = value || source?.[def.pick] || null;
  const own = !!value && !urls.includes(value);
  // A colour or gradient by its preset's name (a game set's background too).
  const { presets } = useBackgroundPresets();
  const preset = def.swatches && current ? presets.find((p) => backgroundUrl(p) === current) : null;
  const origin = !current ? emptyText : own ? `${preset ? preset.name : "Uploaded"} · this stream only` : [preset?.name, `From ${sourceName}`].filter(Boolean).join(" · ");
  const ratio = def.width / def.height;
  const thumb = (url, size) => (
    <Box sx={{ width: Math.round(size * ratio), height: size, flexShrink: 0, borderRadius: `${tokens.shape.sm}px`, overflow: "hidden", bgcolor: c.surfaceCardInset, display: "grid", placeItems: "center" }}>
      {url ? <Box component="img" src={url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: def.source === "host" ? FACE_POSITION : "center", display: "block" }} /> : <Icon name="image" size={16} style={{ color: c.onSurfaceVariant }} />}
    </Box>
  );
  const close = () => setAnchor(null);
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.25, "&:not(:last-of-type)": { borderBottom: 1, borderColor: "divider" } }}>
      {thumb(current, 56)}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="titleSmall" component="div">
          {def.short}
        </Typography>
        <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
          {origin}
        </Typography>
      </Box>
      <Button variant="tonal" size="small" endIcon={<Icon name="arrow_drop_down" size={18} />} onClick={(e) => setAnchor(e.currentTarget)} aria-label={`Change ${def.label.toLowerCase()}`} aria-haspopup="menu">
        Change
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={close}>
        <ListSubheader>{`From ${sourceName}`}</ListSubheader>
        {urls.length === 0 && <MenuItem disabled>{emptyText}</MenuItem>}
        {urls.map((u, i) => (
          <MenuItem
            key={u.slice(-40) + i}
            selected={u === current}
            onClick={() => {
              close();
              onPick(u === (source?.[def.pick] ?? null) ? null : u);
            }}
          >
            {thumb(u, 32)}
            <ListItemText primary={urls.length > 1 ? `${def.short} ${i + 1}` : def.short} secondary={u === source?.[def.pick] ? "Selected on it" : undefined} />
            {u === current && <MenuCheck />}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => {
            close();
            pickFile.current?.();
          }}
        >
          <ListItemIcon>
            <Icon name="upload" size={16} />
          </ListItemIcon>
          <ListItemText primary="Upload for this stream" secondary={`${def.width} × ${def.height}`} />
        </MenuItem>
        {def.swatches && (
          <MenuItem
            onClick={() => {
              close();
              setSwatches(true);
            }}
          >
            <ListItemIcon>
              <Icon name="palette" size={16} />
            </ListItemIcon>
            <ListItemText primary="Colour or gradient for this stream" secondary="Presets, or add a custom one" />
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem
            onClick={() => {
              close();
              onEdit();
            }}
          >
            <ListItemIcon>
              <Icon name="edit" size={16} />
            </ListItemIcon>
            <ListItemText primary={editLabel} />
          </MenuItem>
        )}
      </Menu>
      {/* Crops an upload to the image's size; it's this stream's own (the source stays as it is). */}
      <ImageField headless pickRef={pickFile} label={def.label} width={def.width} height={def.height} onChange={async (file) => onPick(await toDataUrl(file))} />
      {def.swatches && <BackgroundPickerDialog open={swatches} onClose={() => setSwatches(false)} selected={current} onPick={onPick} title={def.label} />}
    </Box>
  );
}

/** A background and an image, as this stream uses them, and (trial) the picture made of the two. */
function ImagePair({ pair, form, set, host, onEditSet, onEditHost }) {
  const { control, setValue } = form;
  const [bg, img] = useWatch({ control, name: [pair.background.field, pair.image.field] });
  const pick = (def) => (url) => {
    if (def.file) setValue(def.file, null);
    // null: back to the source's selected one.
    setValue(def.field, url ?? (def.source === "set" ? set : host)?.[def.pick] ?? null, { shouldDirty: true });
  };
  const hostName = hostLabel(host) || "the host";
  const { width: w, height: h } = pair.background;
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" component="h3" sx={{ display: "block", mb: 0.5 }}>
        {pair.title}
      </Typography>
      {/* What the app shows (the background with the host's image cut out on it) on the left; what it's made of on the right. */}
      <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start", flexWrap: { xs: "wrap", sm: "nowrap" } }}>
        <BakedImage background={bg || set?.[pair.background.pick]} host={img || host?.[pair.image.pick]} w={w} h={h} width={w >= h ? 132 : 120} /> {/* bake trial */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <PictureRow def={pair.background} value={bg} source={set} sourceName={set?.name ?? "the game set"} emptyText={set ? `${set.name} has none yet` : "No game set"} editLabel="Edit in Game sets" onEdit={set ? onEditSet : undefined} onPick={pick(pair.background)} />
          <PictureRow def={pair.image} value={img} source={host} sourceName={hostName} emptyText={host ? `${hostName} has none yet` : "Pick a host first"} editLabel="Edit in Hosts" onEdit={host ? onEditHost : undefined} onPick={pick(pair.image)} />
        </Box>
      </Box>
    </Box>
  );
}

/** The stream's images: the live game host avatar and the hero card, each a background and an image. */
export function ImagesSection({ form, hosts, frame }) {
  const { getValues, setValue } = form;
  const [bundleId, hostId] = useWatch({ control: form.control, name: ["bundleId", "hostId"] });
  const { byId } = useBundles();
  const set = byId[bundleId];
  const host = hosts.find((h) => h.id === hostId);
  const setSheet = useSheet();
  const hostSheet = useSheet();
  return (
    <FormSection {...frame} id="images" title="Images">
      {IMAGE_PAIRS.map((p) => (
        <ImagePair key={p.key} pair={p} form={form} set={set} host={host} onEditSet={() => setSheet.openEdit(set)} onEditHost={() => hostSheet.openEdit(host)} />
      ))}
      {/* Edits the game set in Game sets (every stream of it shows the change). */}
      <GameSetSheet
        sheet={setSheet}
        onSaved={(before, after) => {
          // Upcoming streams still on the game set's old background move to its new one (as the
          // server does): this stream's form follows, without counting as an edit of its own.
          if (getValues("status") !== "Scheduled") return;
          IMAGE_PAIRS.forEach(({ background: d }) => {
            const current = getValues(d.field);
            const next = after?.[d.pick];
            if (next && next !== before[d.pick] && (!current || current === before[d.pick])) setValue(d.field, next);
          });
        }}
      />
      {/* Edits the host in the Hosts library (every stream they host shows the change). */}
      <HostSheet sheet={hostSheet} stats={() => ({ upcoming: 0 })} existing={[]} />
    </FormSection>
  );
}

/** The stream itself: title and subtitle, when, who sees it, and its toggles. */
export function DetailsSection({ form, frame }) {
  const { control } = form;
  return (
    <FormSection {...frame} id="basics" title="When & title">
      <TextInput control={control} name="title" label="Title" max={100} rules={{ validate: titleRule }} helperText="{host} becomes the host's name wherever the title shows." />
      <TextInput control={control} name="subtitle" label="Subtitle" />
      <DateTimeInput control={control} name="startDate" rules={{ required: "Pick a date and time" }} />
      <Controller
        name="streamType"
        control={control}
        rules={{ validate: (v) => (v && v !== StreamType.None ? true : "Choose who can see this stream") }}
        render={({ field, fieldState }) => <AudienceField value={field.value} onChange={field.onChange} error={fieldState.error?.message} superSavvySwitch={false} />}
      />
      <ListGroup label="Options">
        {/* Super Savvy only is a Public stream only members can join (stored as its own streamType). */}
        <Controller
      name="streamType"
      control={control}
      render={({ field }) =>
        field.value === StreamType.Public || field.value === StreamType.SuperSavvy ? (
          <ListSwitch icon="workspace_premium" title="Super Savvy only" supporting="Everyone sees it; only Super Savvy members can join" checked={field.value === StreamType.SuperSavvy} onChange={(on) => field.onChange(on ? StreamType.SuperSavvy : StreamType.Public)} />
        ) : null
      }
        />
        <SwitchListRow control={control} name="isSpotlighted" icon="star" title="Spotlight" supporting="Featured at the top of the home screen" />
        <SwitchListRow control={control} name="headless" icon="smart_toy" title="Run headless" />
      </ListGroup>
      <ShowdownTypeField control={control} setValue={form.setValue} />
    </FormSection>
  );
}



/** The host, picked from the Hosts library like every other choice; ✎ edits them in the library. Their images are under Images. */
export function HostSection({ form, hosts, frame }) {
  const { control, setValue } = form;
  const sheet = useSheet();
  const { m3: c } = useTheme();
  const [hostId, hostName, imageUrl] = useWatch({ control, name: ["hostId", "hostName", "imageUrl"] });
  const current = hosts.find((h) => h.id === hostId) ?? (hostId ? { id: hostId, name: hostName, imageUrl } : null);
  return (
    <FormSection {...frame} id="host" title="Host">
      <Controller
        name="hostId"
        control={control}
        rules={{ required: "Choose a host" }}
        render={({ fieldState }) => (
          <HostPicker
            hosts={hosts}
            value={current}
            label={null}
            onEdit={(h) => sheet.openEdit(hosts.find((x) => x.id === h.id) ?? h)}
            error={fieldState.error?.message}
            onChange={(h) => {
              setValue("hostId", h?.id ?? "", { shouldDirty: true, shouldValidate: true });
              setValue("hostName", h?.name ?? "", { shouldDirty: true });
              // A new host brings their images (avatar image, hero card image); the backgrounds are the game set's.
              setValue("imageUrl", h?.imageUrl ?? null, { shouldDirty: true });
              setValue("heroCardImageUrl", h?.heroCardImageUrl ?? null, { shouldDirty: true });
              setValue("hostImageFile", null);
            }}
          />
        )}
      />
      {/* Edits the host in the Hosts library (every stream they host shows the change). */}
      <HostSheet sheet={sheet} stats={() => ({ upcoming: 0 })} existing={[]} />
    </FormSection>
  );
}

// ---------------------------------------------------------------- rounds
const durationRules = { validate: (v) => (v == null || Number.isNaN(v) ? "Required" : !Number.isInteger(v) || v < 10 || v > 300 ? "10–300 s" : true) };

/**
 * A round's time in seconds, edited in its cell. It starts from the default (see durationFor: the
 * word's length, 45 s for the fifth round) and follows the word as it changes, until set by hand.
 */
export function RoundTimeCell({ control, setValue, getValues, base, label }) {
  const index = Number(base.split(".").pop());
  const word = useWatch({ control, name: `${base}.word` });
  const prevWord = useRef(word);
  useEffect(() => {
    if (prevWord.current === word) return;
    const current = getValues(`${base}.durationInSeconds`);
    // Still the automatic value for the old word (or empty): follow the new word.
    if (current == null || current === durationFor(prevWord.current, index)) setValue(`${base}.durationInSeconds`, durationFor(word, index), { shouldDirty: true });
    prevWord.current = word;
  }, [word, base, index, setValue, getValues]);
  return <NumberCell control={control} name={`${base}.durationInSeconds`} label={label} suffix="s" step={5} min={10} rules={durationRules} sx={{ width: 72 }} />;
}


/** A word while the words are locked: dots for a word, "No word yet" when it's empty. */
function MaskedWord({ control, name }) {
  const word = useWatch({ control, name });
  return (
    <Typography variant="bodyMedium" color="text.secondary" sx={{ px: 1, letterSpacing: word ? "0.1em" : undefined }}>
      {word ? "•••••" : "No word yet"}
    </Typography>
  );
}

/** A round's Round Pounder reward cell (`name`): the reward, or "Add" when it has none. */
export function BusterCell({ control, setValue, name, index }) {
  const buster = useWatch({ control, name });
  const set = (v) => setValue(name, v, { shouldDirty: true });
  if (!buster) {
    return (
      <Button variant="tonal" size="small" startIcon={<Icon name="add" />} onClick={() => set(busterFor(index))}>
        Add
      </Button>
    );
  }
  return <RewardCell control={control} name={name} allowed={NON_CASH_REWARDS} label={`Round Pounder reward, round ${index + 1}`} onClear={() => set(null)} />;
}

/**
 * Rounds as an M3 data table: word and its time (from the word), each edited in its cell. Each
 * round's Round Pounder is under Rewards. Every game has at least five rounds; more can be added,
 * and the last one past five removed. `fields`, `append` and `remove` come from the caller's
 * useFieldArray on `name`; `newReward(i)` is a new round's Round Pounder.
 */
export function RoundsEditor({ form, name, fields, append, remove, validateWord, defaultDuration = DEFAULT_ROUND_DURATION, detailed = true, masked = false, newReward = busterFor }) {
  const { control, setValue } = form;
  // Without `detailed` only the words show; times keep their values.
  const extra = (cell) => (detailed ? [cell] : []);
  return (
    <EditTable
      label="Rounds"
      minWidth={340}
      reserveRemove
      columns={[
        { header: "#", width: "16px" },
        { header: "Word", width: "minmax(96px, 1fr)" },
        ...extra({ header: "Time", width: "64px", align: "right" }),
      ]}
      rows={fields.map((f, i) => {
        const base = `${name}.${i}`;
        return {
          key: f.id,
          onRemove: fields.length > ROUND_COUNT && i === fields.length - 1 ? () => remove(i) : undefined,
          removeLabel: `Remove round ${i + 1}`,
          cells: [
            <Typography key="n" variant="bodyMedium" color="text.secondary">
              {i + 1}
            </Typography>,
            masked ? <MaskedWord key="w" control={control} name={`${base}.word`} /> : <TextCell key="w" control={control} name={`${base}.word`} label={`Round ${i + 1} word`} placeholder="Add a word" rules={roundWordRules(validateWord, base)} inputProps={{ autoCapitalize: "none", spellCheck: false }} />,
            ...extra(<RoundTimeCell key="t" control={control} setValue={setValue} getValues={form.getValues} base={base} label={`Round ${i + 1} time`} />),
          ],
        };
      })}
      addLabel="Add round"
      onAdd={() => append({ roundIndex: fields.length, word: "", durationInSeconds: defaultDuration, roundBusterReward: newReward(fields.length) })}
    />
  );
}

/**
 * The stream's word set and the game mode it brings (logo and name). A stream plays its word
 * set's game mode; "Pick a word set" changes both.
 */
function WordSetRow({ form }) {
  const [wordSetId, gameMode, id] = useWatch({ control: form.control, name: ["wordSetId", "gameMode", "id"] });
  const { sets } = useWordSets();
  const set = sets.find((w) => w.id === wordSetId) ?? sets.find((w) => w.streamId === id);
  const mode = modeOf({ gameMode }).id ? modeOf({ gameMode }) : null;
  return (
    <ListGroup label="Word set">
      <ListItem
        leading={mode ? <ModeLogo mode={gameMode} width={72} height={40} /> : <Icon name="spellcheck" />}
        title={set ? set.title || "Untitled set" : "No word set yet"}
        supporting={mode ? mode.label : "The game mode comes with the word set."}
      />
    </ListGroup>
  );
}

/**
 * The stream's words in one place: the rounds, then (with a showdown) the showdown word right
 * under them, since a word set fills both. "Pick a word set" fills them together.
 */
export function WordsSection({ form, validateWord, onPickWords, frame }) {
  const { roundFields, appendRound, removeRound, gameMode } = form;
  const [showdown, rounds, bundleId] = useWatch({ control: form.control, name: ["showdownConfiguration", "textSavvyRounds.rounds", "bundleId"] });
  // A round added here gets its Round Pounder from the game set's reward set (set under Rewards).
  const { byId, rewardsOf } = useBundles();
  const rewards = rewardsOf(byId[bundleId]);
  // Words stay hidden behind the words password (as in Game modes) once there are any to hide;
  // admins see them straight away.
  const { hidden, unlock, lock, canLock, dialog } = useWordsLock();
  const hasWords = (rounds ?? []).some((r) => r?.word) || !!showdown?.word;
  const masked = hidden && hasWords;
  return (
    <FormSection {...frame}
      id="words"
      title="Words"
      action={
        <Box sx={{ display: "flex", gap: 1 }}>
          {hasWords && canLock && (
            <Button variant="tonal" size="small" startIcon={<Icon name={hidden ? "lock_open" : "visibility_off"} />} onClick={() => (hidden ? unlock() : lock())}>
              {hidden ? "Show words" : "Hide words"}
            </Button>
          )}
          <Button variant="tonal" size="small" startIcon={<Icon name="spellcheck" />} onClick={onPickWords}>
            Pick a word set
          </Button>
        </Box>
      }
    >
      {dialog}
      <WordSetRow form={form} />
      {/* Each round's word and time, all in view (words masked while locked). Rewards are under Rewards. */}
      <RoundsEditor form={form} name="textSavvyRounds.rounds" fields={roundFields} append={appendRound} remove={removeRound} subText={baseOf(gameMode) === GameMode.SubText} validateWord={validateWord} masked={masked} newReward={(i) => roundRewardOf(rewards, i)} />
      {/* The showdown is optional: switched on, it needs its word (its prize is under Rewards). */}
      <Box id="showdown" sx={{ display: "flex", flexDirection: "column", gap: 1, scrollMarginTop: 96 }}>
        <Typography variant="overline" color="text.secondary" component="h3" sx={{ px: 0.5 }}>
          Showdown
        </Typography>
        <ShowdownSwitch form={form} />
        {showdown && <ShowdownFields control={form.control} name="showdownConfiguration" validateWord={validateWord} masked={masked} prize={false} />}
      </Box>
    </FormSection>
  );
}

/**
 * Game mode (Savvy TextChain or Savvy SubText) and its showdown (Savvy Showdown or Super Savvy
 * Showdown), both connected button groups. Scoring comes from the mode and can be changed here.
 */
/**
 * Which scoring preset (Library › Gameplay › Scoring) the stream plays: picking one fills in its points;
 * points changed by hand show as Custom.
 */
function ScoringPresetField({ control, setValue }) {
  const [scoring, stumper] = useWatch({ control, name: ["roundScoring", "hostStumperBonusXp"] });
  const { data } = useList({ resource: "ScoringPreset", dataProviderName: DP.scoringPresets, pagination: { mode: "off" } });
  const presets = data?.data ?? [];
  // A preset is its points and its host stumper bonus.
  const current = presets.find((p) => sameScoring(p.roundScoring, scoring) && Number(p.hostStumperBonusXp ?? 0) === Number(stumper ?? 0));
  const pick = (id) => {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setValue("roundScoring", structuredClone(p.roundScoring), { shouldDirty: true, shouldValidate: true });
    setValue("hostStumperBonusXp", p.hostStumperBonusXp ?? null, { shouldDirty: true, shouldValidate: true });
  };
  return <SelectButton label="Preset" value={current?.id ?? ""} placeholder="Custom" options={presets.map((p) => ({ value: p.id, label: p.name }))} onChange={pick} sx={{ maxWidth: 320 }} />;
}

/** This stream's points per round: a scoring preset, then this stream's copy. */
export function ScoringSection({ form, frame }) {
  return (
    <FormSection {...frame} id="game" title="Scoring" action={<PresetsLink kind="scoring" />}>
      <ScoringPresetField control={form.control} setValue={form.setValue} />
      <ScoringFields control={form.control} setValue={form.setValue} subText={baseOf(form.gameMode) === GameMode.SubText} roundCount={form.roundFields?.length ?? 5} />
    </FormSection>
  );
}

/**
 * Turns the stream's showdown on or off. Switched back on, it gets back what it had (else a new one
 * from the game set's reward set, waiting for its word).
 */
function ShowdownSwitch({ form }) {
  const [bundleId, showdown, streamType] = useWatch({ control: form.control, name: ["bundleId", "showdownConfiguration", "streamType"] });
  const { bundles, byId, rewardsOf } = useBundles();
  const last = useRef(null);
  if (showdown) last.current = showdown;
  const set = byId[bundleId] ?? bundles[0];
  const turn = (on) => form.setValue("showdownConfiguration", on ? (last.current ?? newShowdown(set, streamType, rewardsOf(set))) : null, { shouldDirty: true, shouldTouch: true });
  return (
    <ListGroup label="Showdown">
      <ListSwitch icon="trophy" title="Showdown" supporting={showdown ? "A final word after the rounds" : "Off: this stream has no showdown"} checked={!!showdown} onChange={turn} />
    </ListGroup>
  );
}

/**
 * Savvy or Super Savvy Showdown: it follows who can join (a Super Savvy only stream always runs a
 * Super Savvy Showdown), so it sits with the audience.
 */
function ShowdownTypeField({ control, setValue }) {
  const [bundleId, showdown, streamType] = useWatch({ control, name: ["bundleId", "showdownConfiguration", "streamType"] });
  // A showdown added here starts from the stream's bundle (its prize).
  const { bundles, byId, rewardsOf } = useBundles();
  const superSavvy = streamType === StreamType.SuperSavvy;
  const set = byId[bundleId] ?? bundles[0];
  const setShowdown = (superSavvyOnly) => setValue("showdownConfiguration", { ...(showdown ?? newShowdown(set, streamType, rewardsOf(set))), superSavvyOnly }, { shouldDirty: true });
  useEffect(() => {
    if (superSavvy && showdown && !showdown.superSavvyOnly) setValue("showdownConfiguration", { ...showdown, superSavvyOnly: true }, { shouldDirty: true });
  }, [superSavvy, showdown, setValue]);
  // Only for a stream with a showdown (switched on under Words).
  if (!showdown) return null;
  return (
    <ChoiceGroup
      label="Showdown"
      value={showdown ? (showdown.superSavvyOnly ? 1 : 0) : null}
      options={SHOWDOWN_TYPES.map((t, i) => ({ value: i, label: t.label, icon: t.icon }))}
      onChange={(v) => setShowdown(SHOWDOWN_TYPES[v].superSavvyOnly)}
      disabled={superSavvy}
      helperText={superSavvy ? "Super Savvy only streams always run a Super Savvy Showdown." : undefined}
    />
  );
}

// ---------------------------------------------------------------- scoring
const BRACKETS = [
  { key: "rounds1To2", label: "Rounds 1–2", minRounds: 0 },
  { key: "rounds3To4", label: "Rounds 3–4", minRounds: 3 },
  { key: "round5OrMore", label: "Round 5+", minRounds: 5 },
];
const SCORE_ROWS = [
  { key: "greenLetterXp", label: "Green letter" },
  { key: "yellowLetterXp", label: "Yellow letter" },
  { key: "solveBonusXp", label: "Solve bonus" },
  { key: "timeBonusXp", label: "Time bonus" },
];
export const SCORE_BRACKETS = BRACKETS.map((b) => b.key);
/** The same points per round. */
export const sameScoring = (a, b) => SCORE_BRACKETS.every((k) => SCORE_ROWS.every(({ key: f }) => Number(a?.[k]?.[f] ?? 0) === Number(b?.[k]?.[f] ?? 0)));
const TIME_BONUS = Array.from({ length: 25 }, (_, i) => (i + 1) * 100);
const xpRules = { validate: (v) => (v == null || Number.isNaN(v) ? "Required" : v < 0 ? "Min 0" : v > 10000 ? "Max 10,000" : true) };

/** One editable number in the points table: plain text in the cell, a line under it while editing. */
function ScoreCell({ control, name, label, disabled, rules, step, onValue }) {
  const { m3: c, tokens } = useTheme();
  if (disabled) {
    return (
      <Box sx={{ textAlign: "right", typography: "bodyLarge", color: "text.disabled", px: 1 }} aria-label={`${label}: not scored`}>
        —
      </Box>
    );
  }
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <Tooltip title={fieldState.error?.message ?? ""} open={!!fieldState.error} placement="top" arrow>
          <InputBase
            value={field.value ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value);
              field.onChange(v);
              onValue?.(v);
            }}
            onBlur={field.onBlur}
            inputRef={field.ref}
            type="number"
            inputProps={{ "aria-label": label, min: 0, step: step ?? 1, style: { textAlign: "right" } }}
            // The same field as every other editable table cell.
            sx={{ ...cellSx(c, tokens, !!fieldState.error), fontVariantNumeric: "tabular-nums" }}
          />
        </Tooltip>
      )}
    />
  );
}

const timeRules = { validate: (v) => (v == null || Number.isNaN(v) ? "Required" : v < 100 || v > 2500 ? "Use 100–2,500" : v % 100 ? "Steps of 100" : true) };

/**
 * Points per round as a data table: score kinds down, round brackets across, every number
 * editable in its cell (+ host stumper bonus when it applies).
 */
export function ScoringFields({ control, setValue, subText, roundCount, prefix = "roundScoring", stumperName = "hostStumperBonusXp", withStumper = true }) {
  // Yellow follows green: half of it in rounds 1–4, none from round 5. Changing green sets it;
  // yellow stays editable on its own.
  const yellowFor = (bracket, green) => (bracket === "round5OrMore" || green == null ? 0 : Math.round(green / 2));
  const followGreen = (bracket) => (v) => setValue?.(`${prefix}.${bracket}.yellowLetterXp`, yellowFor(bracket, v), { shouldDirty: true, shouldValidate: true });
  const { m3: c, tokens } = useTheme();
  const count = Math.max(roundCount, 1);
  const brackets = BRACKETS.filter((b) => count >= b.minRounds);
  const disabled = (bracket, row) => subText && bracket === "round5OrMore" && row === "greenLetterXp";
  const stumper = withStumper && (subText || count >= 5);
  const cols = `minmax(96px, 1.2fr) repeat(${brackets.length}, minmax(64px, 1fr))`;
  // Rows are segments like ListGroup's (and EditTable's): 2px apart, outer corners 12px.
  const { xs, md: lg } = tokens.shape;
  const row = { display: "grid", gridTemplateColumns: cols, alignItems: "center", columnGap: 1, px: 1.5, minHeight: 44 };
  const segment = (first, last) => ({ bgcolor: c.surfaceContainerHigh, borderRadius: `${first ? lg : xs}px ${first ? lg : xs}px ${last ? lg : xs}px ${last ? lg : xs}px` });
  return (
    <>
      <Box role="table" aria-label="Points per round" sx={{ overflowX: "auto" }}>
        <Box sx={{ minWidth: 96 + 64 * brackets.length + 48, display: "flex", flexDirection: "column", gap: "2px" }}>
          <Box role="row" sx={{ ...row, minHeight: 28 }}>
            <Typography role="columnheader" variant="overline" color="text.secondary">
              Points
            </Typography>
            {brackets.map((b) => (
              <Typography key={b.key} role="columnheader" variant="overline" color="text.secondary" sx={{ textAlign: "right", px: 1 }}>
                {b.label}
              </Typography>
            ))}
          </Box>
          {SCORE_ROWS.map((r, i) => (
            <Box key={r.key} role="row" sx={{ ...row, ...segment(i === 0, i === SCORE_ROWS.length - 1) }}>
              <Typography role="rowheader" variant="bodyMedium">
                {r.label}
              </Typography>
              {brackets.map((b) => (
                <Box key={b.key} role="cell">
                  <ScoreCell
                    control={control}
                    name={`${prefix}.${b.key}.${r.key}`}
                    label={`${b.label} ${r.label}`}
                    disabled={disabled(b.key, r.key)}
                    rules={r.key === "timeBonusXp" ? timeRules : xpRules}
                    step={r.key === "timeBonusXp" ? 100 : 1}
                    onValue={r.key === "greenLetterXp" && !disabled(b.key, "yellowLetterXp") ? followGreen(b.key) : undefined}
                  />
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
      {stumper && (
        <NumberInput control={control} name={stumperName} label="Host stumper bonus" suffix="XP" rules={{ validate: (v) => (v == null || v >= 0 ? true : "Min 0") }} sx={{ maxWidth: 320 }} />
      )}
    </>
  );
}

// Same values regardless of key order; numbers compared as numbers ("500" = 500).
const canon = (v) => (v && typeof v === "object" ? Object.keys(v).sort().map((k) => [k, canon(v[k])]) : v == null || v === "" ? null : Number.isNaN(Number(v)) ? v : Number(v));
const sameJson = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

// ---------------------------------------------------------------- rewards
export const SHOWDOWN_REWARDS = ["Cash", "Sparks", "BombPowerup", "HintPowerup"];


export const SHOWDOWN_TYPES = [
  { superSavvyOnly: false, label: "Savvy Showdown", icon: "trophy" },
  { superSavvyOnly: true, label: "Super Savvy Showdown", icon: "diamond" },
];

/**
 * Showdown word (left out with `word={false}`) and prize (left out with `prize={false}`: the prize
 * is under Rewards), as a one-row M3 data table.
 */
export function ShowdownFields({ control, name, validateWord, word = true, prize = true, label = "Showdown winner", masked = false, typeSelect = false }) {
  const { m3: c } = useTheme();
  return (
    <EditTable
      label="Savvy Showdown"
      minWidth={360}
      reserveRemove
      // The same tracks as the other tables (rounds, raffle, rewards), so the prize lines up with
      // their values; without a word (game mode defaults) that column stays empty. The showdown
      // select (a game set) takes the spacer too, so its name fits in a side sheet: the prize
      // stays put, as it's placed from the right.
      columns={[{ header: "", width: "16px" }, { header: word ? "Word" : typeSelect ? "Showdown" : "", width: "minmax(96px, 1fr)" }, ...(!word && typeSelect ? [] : [{ header: "", width: "64px" }]), ...(prize ? [{ header: "Prize", width: "200px" }] : [])]}
      rows={[
        {
          key: "sd",
          cells: [
            <Icon key="i" name="trophy" style={{ color: c.outline }} />,
            word && masked ? (
              <MaskedWord key="w" control={control} name={`${name}.word`} />
            ) : word ? (
              <TextCell key="w" control={control} name={`${name}.word`} label="Showdown word" placeholder="Add a word" rules={wordRules(validateWord)} inputProps={{ autoCapitalize: "none", spellCheck: false }} />
            ) : typeSelect ? (
              // Which showdown it is and its prize, in the one row.
              <SelectCell key="w" control={control} name={`${name}.superSavvyOnly`} label="Showdown" options={SHOWDOWN_TYPES.map((t) => ({ value: t.superSavvyOnly, label: t.label }))} />
            ) : (
              <Typography key="w" variant="bodyMedium" noWrap sx={{ px: 1 }}>
                {label}
              </Typography>
            ),
            ...(!word && typeSelect ? [] : [null]),
            ...(prize ? [<RewardCell key="p" control={control} name={`${name}.prize`} allowed={SHOWDOWN_REWARDS} label="Showdown prize" />] : []),
          ],
        },
      ]}
    />
  );
}

const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th");

/** The raffle switch and, when on, its winners table (stream Raffle section, time slots). */
function RaffleWinners({ control, setValue, name }) {
  const winners = useWatch({ control, name }) ?? null;
  const on = !!winners?.length;
  const set = (v) => setValue(name, v, { shouldDirty: true, shouldTouch: true });
  const add = () => set([...(winners ?? []), { rewardType: RewardType.Cash, amount: 1 }]);
  return (
    <>
      <ListGroup label="Raffle">
        <ListSwitch icon="confirmation_number" title="Raffle winners" supporting={on ? `${winners.length} ${winners.length === 1 ? "winner" : "winners"}` : null} checked={on} onChange={(v) => (v ? add() : set(null))} />
      </ListGroup>
      {on && (
        <EditTable
          label="Raffle winners"
          reserveRemove
          // Reward in the same column as the Round Pounder, showdown prize and rewards amounts.
          columns={[
            { header: "#", width: "16px" },
            { header: "Winner", width: "1fr" },
            { header: "Reward", width: "200px" },
          ]}
          rows={winners.map((_, i) => ({
            key: i,
            onRemove: () => set(winners.filter((__, j) => j !== i)),
            canRemove: winners.length > 1,
            removeLabel: `Remove winner ${i + 1}`,
            cells: [
              <Typography key="n" variant="bodyMedium" color="text.secondary">
                {i + 1}
              </Typography>,
              <Typography key="w" variant="bodyMedium" sx={{ px: 1 }}>
                {ordinal(i + 1)} place
              </Typography>,
              <RewardCell key="r" control={control} name={`${name}.${i}`} allowed={RAFFLE_REWARD_OPTIONS} label={`Winner ${i + 1} reward`} />,
            ],
          }))}
          addLabel={`Add winner (${winners.length} of 20)`}
          addDisabled={winners.length >= 20}
          onAdd={add}
        />
      )}
    </>
  );
}

/**
 * Participation, host buster and raffle rewards under `prefix` (e.g. "" for a stream, "slots.0."
 * for a time slot). The stream's Rewards section and time slots both use it; the showdown has its
 * own editor.
 */
const OPTIONAL_REWARDS = [
  { key: "defaultRewards", icon: "redeem", title: "Participation reward", blank: [{ rewardType: RewardType.BombPowerup, amount: 1 }], off: [] },
  { key: "hostBusterReward", icon: "military_tech", title: "Host buster reward", blank: { rewardType: RewardType.Sparks, amount: 1 }, off: null },
  { key: "raffleSystemWinnersConfiguration", icon: "confirmation_number", title: "Raffle winners", blank: [{ rewardType: RewardType.Cash, amount: 1 }], off: null },
];
const rewardOn = (v) => (Array.isArray(v) ? v.length > 0 : !!v);
/** One reward row's value: the reward when it's on, "Off" when not. */
function OptionalRewardCell({ control, path, def }) {
  const value = useWatch({ control, name: path });
  if (!rewardOn(value)) {
    return (
      <Typography variant="bodyMedium" color="text.secondary" sx={{ px: 1 }}>
        Off
      </Typography>
    );
  }
  return <RewardCell control={control} name={Array.isArray(value) ? `${path}.0` : path} allowed={NON_CASH_REWARDS} label={def.title} />;
}

function OptionalRewardSwitch({ control, path, def, onToggle }) {
  const value = useWatch({ control, name: path });
  return <Switch checked={rewardOn(value)} onChange={(e) => onToggle(e.target.checked)} slotProps={{ input: { "aria-label": def.title } }} />;
}

/**
 * Rewards as an M3 data table: one row each (participation, host buster, and the host stumper XP
 * with `stumper`), switched on or off at the end of the row and set in its cell. The raffle, when
 * in `keys`, follows as its own switch and winners table.
 */
export function RewardsEditor({ form, prefix = "", keys, stumper }) {
  const { control, setValue } = form;
  const { m3: c } = useTheme();
  const defs = OPTIONAL_REWARDS.filter((d) => (!keys || keys.includes(d.key)) && d.key !== "raffleSystemWinnersConfiguration");
  const raffle = !keys || keys.includes("raffleSystemWinnersConfiguration");
  const toggle = (def, on) => setValue(`${prefix}${def.key}`, on ? structuredClone(def.blank) : def.off, { shouldDirty: true, shouldTouch: true });
  // Icon and name in their own columns, so names line up with the words and winners above.
  const icon = (name) => <Icon name={name} style={{ color: c.outline }} />;
  const name = (text) => (
    <Typography variant="bodyMedium" noWrap sx={{ px: 1 }}>
      {text}
    </Typography>
  );
  const rows = defs.map((d) => ({
    key: d.key,
    cells: [icon(d.icon), name(d.title), <OptionalRewardCell key="v" control={control} path={`${prefix}${d.key}`} def={d} />, <OptionalRewardSwitch key="s" control={control} path={`${prefix}${d.key}`} def={d} onToggle={(on) => toggle(d, on)} />],
  }));
  if (stumper) {
    rows.push({
      key: "stumper",
      cells: [
        icon("psychology"),
        name("Host stumper reward"),
        // The same slots as a reward: the amount, then the unit where a reward's type sits.
        <Box key="v" sx={{ display: "flex", alignItems: "center", gap: 0.75, width: "100%" }}>
          <NumberCell control={control} name="hostStumperBonusXp" label="Host stumper reward XP" placeholder="500" align="left" sx={{ width: 64, flexShrink: 0 }} rules={{ validate: (v) => (v == null || v >= 0 ? true : "Min 0") }} />
          <Typography variant="bodyMedium" color="text.secondary" sx={{ px: 1 }}>
            XP
          </Typography>
        </Box>,
        null,
      ],
    });
  }
  return (
    <>
      <EditTable
        label="Rewards"
        minWidth={360}
        columns={[
          { header: "", width: "16px" },
          { header: "Reward", width: "minmax(120px, 1fr)" },
          { header: "Amount", width: "200px" },
          { header: "On", width: "48px", align: "right" },
        ]}
        rows={rows}
      />
      {raffle && <RaffleWinners control={control} setValue={setValue} name={`${prefix}raffleSystemWinnersConfiguration`} />}
    </>
  );
}

/**
 * Round Pounder rewards as a table, one row per round; `path(i)` is a round's reward (a reward
 * set's `roundRewards.i`, a stream's round's `roundBusterReward`). With `onAdd` / `onRemove`
 * rounds can be added (up to 20) and the last one past five removed.
 */
function RoundRewardsTable({ control, setValue, count, path, onAdd, onRemove }) {
  return (
    <EditTable
      label="Round Pounder rewards"
      minWidth={360}
      reserveRemove
      removeWidth="48px"
      // The same tracks as Rewards below, so the rewards line up.
      columns={[
        { header: "#", width: "16px" },
        { header: "Round Pounder", width: "minmax(120px, 1fr)" },
        { header: "Reward", width: "200px" },
      ]}
      rows={Array.from({ length: count }, (_, i) => ({
        key: i,
        onRemove: onRemove && count > ROUND_COUNT && i === count - 1 ? () => onRemove(i) : undefined,
        removeLabel: `Remove round ${i + 1}`,
        cells: [
          <Typography key="n" variant="bodyMedium" color="text.secondary">
            {i + 1}
          </Typography>,
          <Typography key="r" variant="bodyMedium" noWrap sx={{ px: 1 }}>
            Round {i + 1}
          </Typography>,
          <BusterCell key="b" control={control} setValue={setValue} name={path(i)} index={i} />,
        ],
      }))}
      {...(onAdd ? { addLabel: `Add round (${count} of 20)`, addDisabled: count >= 20, onAdd } : {})}
    />
  );
}

/** The showdown winner's prize (`name`), as a one-row table lined up with the rewards. */
function ShowdownPrizeRow({ control, name }) {
  const { m3: c } = useTheme();
  return (
    <EditTable
      label="Showdown prize"
      minWidth={360}
      reserveRemove
      removeWidth="48px"
      columns={[
        { header: "", width: "16px" },
        { header: "Showdown", width: "minmax(120px, 1fr)" },
        { header: "Prize", width: "200px" },
      ]}
      rows={[
        {
          key: "sd",
          cells: [
            <Icon key="i" name="trophy" style={{ color: c.outline }} />,
            <Typography key="w" variant="bodyMedium" noWrap sx={{ px: 1 }}>
              Showdown winner
            </Typography>,
            <RewardCell key="p" control={control} name={name} allowed={SHOWDOWN_REWARDS} label="Showdown prize" />,
          ],
        },
      ]}
    />
  );
}

/** A reward set's fields (Library › Gameplay › Reward sets): every reward a stream pays. */
export function RewardSetFields({ form }) {
  const { control, setValue } = form;
  const rounds = useWatch({ control, name: "roundRewards" }) ?? [];
  const set = (v) => setValue("roundRewards", v, { shouldDirty: true, shouldTouch: true });
  return (
    <>
      <FieldGroup title="Rounds" description="Each round's Round Pounder. A stream with more rounds keeps counting up (5, 10, 15 … Sparks).">
        <RoundRewardsTable control={control} setValue={setValue} count={rounds.length} path={(i) => `roundRewards.${i}`} onAdd={() => set([...rounds, busterFor(rounds.length)])} onRemove={(i) => set(rounds.filter((_, j) => j !== i))} />
      </FieldGroup>
      <FieldGroup title="Showdown" description="Paid when the stream has a showdown.">
        <ShowdownPrizeRow control={control} name="showdownPrize" />
      </FieldGroup>
      <FieldGroup title="Game rewards">
        <RewardsEditor form={form} />
      </FieldGroup>
    </>
  );
}

/** A reward set in a line: the showdown prize and how many rounds pay a Round Pounder. */
export const rewardSetSummary = (p) => {
  const pounders = (p.roundRewards ?? []).filter(Boolean).length;
  return [p.showdownPrize && `Showdown ${prizeText(p.showdownPrize)}`, `${pounders} Round ${pounders === 1 ? "Pounder" : "Pounders"}`].filter(Boolean).join(" · ");
};

/** The rewards a stream (a saved one, or the form's values) pays, in a reward set's shape. */
const rewardsOfStream = (s) => {
  const rounds = s.textSavvyRounds?.rounds ?? [];
  return {
    roundRewards: rounds.map((r) => r?.roundBusterReward ?? null),
    showdownPrize: s.showdownConfiguration ? s.showdownConfiguration.prize ?? null : null,
    defaultRewards: s.defaultRewards ?? [],
    hostBusterReward: s.hostBusterReward ?? null,
    raffleSystemWinnersConfiguration: s.raffleSystemWinnersConfiguration?.length ? s.raffleSystemWinnersConfiguration : null,
  };
};
/** Does the stream pay exactly what the reward set gives it (for its rounds and showdown)? */
export const sameRewards = (rs, s) => sameJson(streamRewards(rs, s.textSavvyRounds?.rounds?.length ?? 0, s.showdownConfiguration), rewardsOfStream(s));

const REWARD_FIELDS = ["textSavvyRounds.rounds", "showdownConfiguration", "defaultRewards", "hostBusterReward", "raffleSystemWinnersConfiguration"];
/** The stream's rewards as the form holds them, in a stream's shape. */
function useStreamRewards(control) {
  const [rounds, showdown, defaultRewards, hostBusterReward, raffle] = useWatch({ control, name: REWARD_FIELDS });
  return { textSavvyRounds: { rounds }, showdownConfiguration: showdown, defaultRewards, hostBusterReward, raffleSystemWinnersConfiguration: raffle };
}

/** Puts a reward set's rewards on the stream's form (its rounds and showdown as they are). */
export function applyRewardSet({ getValues, setValue }, rs) {
  const rounds = getValues("textSavvyRounds.rounds") ?? [];
  const showdown = getValues("showdownConfiguration");
  const pays = streamRewards(rs, rounds.length, showdown);
  const opts = { shouldDirty: true, shouldTouch: true };
  rounds.forEach((_, i) => setValue(`textSavvyRounds.rounds.${i}.roundBusterReward`, pays.roundRewards[i], opts));
  if (showdown) setValue("showdownConfiguration.prize", pays.showdownPrize, opts);
  ["defaultRewards", "hostBusterReward", "raffleSystemWinnersConfiguration"].forEach((k) => setValue(k, pays[k], opts));
}

/** Which reward set (Library › Gameplay › Reward sets) the stream pays: picking one fills in its rewards; rewards changed by hand show as Custom. */
function RewardSetField({ form }) {
  const stream = useStreamRewards(form.control);
  const { rewardSets } = useRewardSets();
  const current = rewardSets.find((r) => sameRewards(r, stream));
  return (
    <SelectButton
      label="Reward set"
      value={current?.id ?? ""}
      placeholder="Custom"
      options={rewardSets.map((r) => ({ value: r.id, label: r.name }))}
      onChange={(id) => {
        const rs = rewardSets.find((r) => r.id === id);
        if (rs) applyRewardSet(form, rs);
      }}
      sx={{ maxWidth: 320 }}
    />
  );
}

/** Everything this stream pays: a reward set, then this stream's copy (rounds, showdown, game rewards, raffle). */
export function RewardsSection({ form, frame }) {
  const { control, setValue } = form;
  const [rounds, showdown] = useWatch({ control, name: ["textSavvyRounds.rounds", "showdownConfiguration"] });
  return (
    <FormSection {...frame} id="rewards-card" title="Rewards" action={<PresetsLink kind="rewards" />}>
      <RewardSetField form={form} />
      {/* One per round (rounds are added in Words). */}
      <RoundRewardsTable control={control} setValue={setValue} count={(rounds ?? []).length} path={(i) => `textSavvyRounds.rounds.${i}.roundBusterReward`} />
      {showdown && <ShowdownPrizeRow control={control} name="showdownConfiguration.prize" />}
      <RewardsEditor form={form} />
    </FormSection>
  );
}

/** The power-ups this stream's How to play shows: its game set's, changeable for this stream. */
export function PowerUpsSection({ form, frame }) {
  return (
    <FormSection {...frame} id="power-ups" title="Power-ups">
      <PowerUpPicker control={form.control} setValue={form.setValue} />
    </FormSection>
  );
}

// ---------------------------------------------------------------- sponsor
const NONE = "__none";
const CUSTOM = "__custom";
/** Fills the sponsorship from a sponsor in the library. */

/** Sponsor: picked from the Sponsors library (or none) like every other choice; ✎ edits this stream's copy. */
export function SponsorSection({ form, frame }) {
  const { control, sponsorship, setValue } = form;
  const editor = useItemEditor(form);
  const { errors } = useFormState({ control, name: "sponsorship" });
  const image = useFilePreview(sponsorship?.sponsorshipImageFile, sponsorship?.imageUrl);
  const { data } = useList({ resource: "Sponsor", dataProviderName: DP.sponsors, pagination: { mode: "off" } });
  const sponsors = [...(data?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const { m3: c } = useTheme();
  // The library sponsor this stream's copy still matches, if any.
  const match = sponsorship && sponsors.find((sp) => sp.title === sponsorship.title && sp.description === sponsorship.description && sp.cta === sponsorship.cta);
  const pick = (id) => {
    if (id === NONE) return form.removeSponsorshipAction();
    const sp = sponsors.find((x) => x.id === id);
    setValue("sponsorship", { title: sp.title, description: sp.description, cta: sp.cta, imageUrl: sp.imageUrl ?? null, sponsorshipImageFile: null }, { shouldDirty: true, shouldTouch: true });
  };
  const thumb = (src, size) => (
    <Avatar src={src === NONE ? undefined : src ?? undefined} alt="" sx={{ width: size, height: size, borderRadius: `${cornerFor(size)}px`, bgcolor: c.surfaceCardInset, color: c.onSurfaceVariant }}>
      <Icon name={src === NONE ? "block" : "handshake"} size={size / 2} />
    </Avatar>
  );
  return (
    <FormSection {...frame} id="sponsor" title="Sponsor">
      <PickCard
        ariaLabel="Sponsor"
        value={sponsorship ? match?.id ?? CUSTOM : NONE}
        options={[{ value: NONE, media: thumb(NONE, 32), primary: "No sponsor" }, ...sponsors.map((sp) => ({ value: sp.id, media: thumb(sp.imageUrl, 32), primary: sp.name, secondary: sp.title }))]}
        onChange={pick}
        media={sponsorship ? thumb(image ?? sponsorship.imageUrl, 48) : <PickPlaceholder icon="handshake" />}
        title={sponsorship ? match?.name ?? "Custom sponsor" : "No sponsor"}
        supporting={sponsorship ? sponsorship.title || "No title yet" : `${sponsors.length} ${sponsors.length === 1 ? "sponsor" : "sponsors"} in the library`}
        actions={sponsorship ? [{ label: "Edit this stream's sponsor", icon: "edit", onClick: () => editor.open("sponsorship") }] : []}
        error={sponsorship ? firstError(errors, "sponsorship") : null}
      />
      <ItemDialog editor={editor} title="Sponsor for this stream">
        {() => (
          <>
            <ImageField label="Sponsor image" value={image} width={256} height={256} onChange={form.handleSponsorshipImageChange} onRemove={form.handleSponsorshipImageRemove} />
            <TextInput control={control} name="sponsorship.title" label="Title" max={30} rules={lengthRule("Title", 1, 30)} />
            <TextInput control={control} name="sponsorship.description" label="Description" multiline minRows={2} max={60} rules={lengthRule("Description", 1, 60)} />
            <TextInput control={control} name="sponsorship.cta" label="Link" placeholder="https://" rules={{ required: "Add the link players open" }} />
          </>
        )}
      </ItemDialog>
    </FormSection>
  );
}

// ---------------------------------------------------------------- home screen


/** Name, icon and colour of the game mode pill on the home screen. */
// Pill colours offered as swatches: the app's blue (no colour stored) and the tonal set; the
// last swatch picks any other colour.
const PILL_COLOURS = [
  { value: null, label: "App blue (default)" },
  { value: "#7444E0", label: "Purple" },
  { value: "#146C2E", label: "Green" },
  { value: "#B3261E", label: "Red" },
  { value: "#8B5000", label: "Orange" },
  { value: "#984061", label: "Pink" },
  { value: "#006A6A", label: "Teal" },
];

export function PillFields({ control, iconUrl, onIconChange, onIconRemove }) {
  return (
    <FieldGroup title="Game mode pill" description="Only shown when it has a name.">
      <ImageField label="Pill icon" value={iconUrl} width={128} height={128} onChange={onIconChange} onRemove={onIconRemove} />
      <TextInput control={control} name="gameModeDisplayName" label="Pill text" />
      <Controller
        name="gameModeBackgroundColor"
        control={control}
        render={({ field }) => <ColorSwatches label="Pill colour" value={field.value || null} onChange={field.onChange} colors={PILL_COLOURS} defaultColor="#3B6BF6" />}
      />
    </FieldGroup>
  );
}

// ---------------------------------------------------------------- notifications
export function NotificationPreview({ control, title, body }) {
  const t = useWatch({ control, name: title });
  const b = useWatch({ control, name: body });
  const { m3: c } = useTheme();
  return (
    <Box sx={{ display: "flex", gap: 1.5, p: 1.5, borderRadius: radius("md"), bgcolor: c.surfaceCardInset, "[role='listitem'] &": { bgcolor: c.nested } }} aria-hidden>
      <Box sx={{ width: 32, height: 32, borderRadius: radius("sm"), bgcolor: c.primary, color: c.onPrimary, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name="notifications" size={18} fill />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="titleSmall" noWrap component="div">
          {t || "No title"}
        </Typography>
        <Typography variant="bodySmall" color="text.secondary" noWrap component="div">
          {b || "No description"}
        </Typography>
      </Box>
    </Box>
  );
}

export const NOTIFICATIONS = [
  { prefix: "lobbyOpen", title: "Lobby opens" },
  { prefix: "goingLive", title: "Going live" },
  { prefix: "round1Starts", title: "Round 1 starts", sendAt: true },
];

export const NOTIFICATION_KEYS = NOTIFICATIONS.flatMap((n) => [`${n.prefix}Title`, `${n.prefix}Body`]);

/**
 * The three push notifications as rows (title · text); each opens with a preview. Fields sit
 * under `prefix`; `sendAt` adds the round 1 send time (a stream has one, a preset doesn't).
 */
export function NotificationRows({ form, prefix = "", sendAt }) {
  const { control } = form;
  const startDate = useWatch({ control, name: "startDate" });
  const items = NOTIFICATIONS.map((n) => ({
    key: n.prefix,
    title: n.title,
    path: [`${prefix}${n.prefix}Title`, `${prefix}${n.prefix}Body`, ...(sendAt && n.sendAt ? ["round1StartsAt"] : [])],
    fields: () => (
      <>
        <NotificationPreview control={control} title={`${prefix}${n.prefix}Title`} body={`${prefix}${n.prefix}Body`} />
        <TextInput control={control} name={`${prefix}${n.prefix}Title`} label="Title" />
        <TextInput control={control} name={`${prefix}${n.prefix}Body`} label="Description" />
        {sendAt && n.sendAt && (
          <DateTimeInput
            control={control}
            name="round1StartsAt"
            dateLabel="Send date"
            timeLabel="Send time"
            clearable
            rules={{ validate: (v) => (!v || !startDate || new Date(v) >= new Date(startDate) ? true : "Can't be before the stream starts") }}
          />
        )}
      </>
    ),
  }));
  return <EditRows label="Notifications" items={items} />;
}

/** A stream's notifications: a preset from Library › Notifications, then this stream's copy. */
export function NotificationsSection({ form, frame }) {
  const { control, setValue } = form;
  const values = useWatch({ control, name: NOTIFICATION_KEYS });
  const { data } = useList({ resource: "NotificationPreset", dataProviderName: DP.notificationPresets, pagination: { mode: "off" } });
  const presets = data?.data ?? [];
  const match = presets.find((p) => NOTIFICATION_KEYS.every((k, i) => (p[k] ?? "") === (values[i] ?? "")));
  const apply = (id) => {
    const p = presets.find((x) => x.id === id);
    NOTIFICATION_KEYS.forEach((k) => setValue(k, p[k] ?? "", { shouldDirty: true }));
  };
  return (
    <FormSection {...frame} id="notifications-card" title="Notifications" action={<PresetsLink kind="notify" />}>
      <Choice
        label="Preset"
        value={match?.id ?? CUSTOM}
        options={[...(match ? [] : [{ value: CUSTOM, label: "Custom" }]), ...presets.map((p) => ({ value: p.id, label: p.name }))]}
        onChange={(id) => id !== CUSTOM && apply(id)}
        aria-label="Notification preset"
      />
      <NotificationRows form={form} sendAt />
    </FormSection>
  );
}

// ---------------------------------------------------------------- share cards
export const SHARE_CARDS = [
  { key: "liveHome", title: "Live on home", fields: ["title", "subtitle"] },
  { key: "upcomingHome", title: "Upcoming on home", fields: ["title", "subtitle"] },
  { key: "beatHost", title: "Beat the host", fields: ["header", "title", "subtitle"] },
  { key: "didNotBeatHost", title: "Didn't beat the host", fields: ["header", "title", "subtitle"] },
];

const cap = (f) => f[0].toUpperCase() + f.slice(1);

/** A share card as the app draws it: header, title and subtitle on the brand colour. */
export function ShareCardPreview({ control, path, host = "the host" }) {
  const raw = useWatch({ control, name: path }) ?? {};
  // As the app shows it: rich-text tags applied (dropped here), {host} filled with the stream's
  // host and {tries} with a sample.
  const shown = (t) => (t ? fillHost(stripRichText(t), host).replace(/\{tries\}/g, "3 tries") : t);
  const v = { header: shown(raw.header), title: shown(raw.title), subtitle: shown(raw.subtitle) };
  const { m3: c } = useTheme();
  const empty = !v.title?.trim() && !v.subtitle?.trim() && !v.header?.trim();
  return (
    <Box aria-hidden sx={{ width: "100%", maxWidth: 160, aspectRatio: "4 / 5", borderRadius: radius("lg"), p: 1.5, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 0.5, bgcolor: c.primary, color: c.onPrimary, opacity: empty ? 0.4 : 1 }}>
      {v.header && <Typography variant="labelLarge">{v.header}</Typography>}
      <Typography variant="titleMedium" sx={{ lineHeight: 1.15 }}>
        {v.title || (empty ? "Hidden" : "")}
      </Typography>
      {v.subtitle && <Typography variant="bodySmall">{v.subtitle}</Typography>}
    </Box>
  );
}


/**
 * The four share cards under `prefix`, each with its texts and a preview, edited in place.
 * `host` (the stream's host name) fills {host} in the previews; presets show "the host".
 */
export function ShareCardFields({ form, prefix = "shareableCards", host }) {
  const items = SHARE_CARDS.map((card) => ({
    key: card.key,
    title: card.title,
    path: `${prefix}.${card.key}`,
    preview: (path) => <ShareCardPreview control={form.control} path={path} host={host} />,
    fields: (path) => card.fields.map((f) => <TextInput key={f} control={form.control} name={`${path}.${f}`} label={cap(f)} multiline={f === "subtitle"} minRows={f === "subtitle" ? 2 : undefined} />),
  }));
  return (
    <>
      <EditRows label="Share cards" items={items} />
      <Typography variant="bodySmall" color="text.secondary" sx={{ mt: -1 }}>
        {host ? `Use {host} in any text for the stream's host; it's filled in for you (now ${host}).` : "Use {host} in any text for the stream's host; each stream fills in its own."}
      </Typography>
    </>
  );
}

/** The presets of this kind (share, notify, scoring) in a side sheet, without leaving the stream. */
export function PresetsLink({ kind }) {
  return <PresetsButton kind={kind} />;
}

/** A stream's share cards: a preset from Library › Share cards, then this stream's copy. */
export function ShareCardsSection({ form, hosts = [], frame }) {
  const { control, setValue } = form;
  const [cards, hostId, hostName] = useWatch({ control, name: ["shareableCards", "hostId", "hostName"] });
  // The app shows the host's display name ("Puzzle Papi") when there is one.
  const host = hosts.find((h) => h.id === hostId);
  const hostShown = hostLabel(host) || hostName || "";
  const { data } = useList({ resource: "SharePreset", dataProviderName: DP.sharePresets, pagination: { mode: "off" } });
  const presets = data?.data ?? [];
  const match = presets.find((p) => sameJson(p.cards, cards));
  const apply = (id) => setValue("shareableCards", structuredClone(presets.find((x) => x.id === id).cards), { shouldDirty: true });
  return (
    <FormSection {...frame} id="share" title="Share cards" action={<PresetsLink kind="share" />}>
      <Choice
        label="Preset"
        value={match?.id ?? CUSTOM}
        options={[...(match ? [] : [{ value: CUSTOM, label: "Custom" }]), ...presets.map((p) => ({ value: p.id, label: p.name }))]}
        onChange={(id) => id !== CUSTOM && apply(id)}
        aria-label="Share card preset"
      />
      <ShareCardFields form={form} host={hostShown} />
    </FormSection>
  );
}

// ---------------------------------------------------------------- status
/**
 * Each section's state for the stream being edited, from the live form: "error" (a field fails
 * validation), "todo" (something it needs is missing) or "ok", with a one-line summary for when
 * the section is folded and the list of what's missing. `sections` gives each section's fields.
 */
export function useSectionStatus(form, sections, hosts) {
  const { control } = form;
  const { errors } = useFormState({ control });
  const { formatDate } = useTimezoneFormat();
  // Words show here only once unlocked (words password), like everywhere else.
  const { hidden: wordsHidden } = useWordsLock();
  const [title, startDate, hostId, hostName, gameMode, rounds, showdown, scoring, sponsorship, participation, buster, stumper, raffle, cards, streamType, powerUpIds, ...rest] = useWatch({
    control,
    name: ["title", "startDate", "hostId", "hostName", "gameMode", "textSavvyRounds.rounds", "showdownConfiguration", "roundScoring", "sponsorship", "defaultRewards", "hostBusterReward", "hostStumperBonusXp", "raffleSystemWinnersConfiguration", "shareableCards", "streamType", "powerUpIds", ...IMAGE_FIELDS, ...NOTIFICATION_KEYS],
  });
  const images = Object.fromEntries(IMAGE_FIELDS.map((f, i) => [f, rest[i]]));
  const notes = rest.slice(IMAGE_FIELDS.length);
  const { rewardSets } = useRewardSets();
  const { data: shareData } = useList({ resource: "SharePreset", dataProviderName: DP.sharePresets, pagination: { mode: "off" } });
  const { data: noteData } = useList({ resource: "NotificationPreset", dataProviderName: DP.notificationPresets, pagination: { mode: "off" } });
  const { data: scoringData } = useList({ resource: "ScoringPreset", dataProviderName: DP.scoringPresets, pagination: { mode: "off" } });
  const { data: sponsorData } = useList({ resource: "Sponsor", dataProviderName: DP.sponsors, pagination: { mode: "off" } });

  const mode = modeOf({ gameMode: modeId(gameMode) }).id ? modeOf({ gameMode: modeId(gameMode) }) : null;
  // The bundle the stream was made from; none when that bundle was deleted since.
  const { byId, rewardsOf } = useBundles();
  const bundle = byId[form.getValues?.("bundleId")];
  const words = (rounds ?? []).map((r) => r?.word).filter(Boolean);
  const missingWords = (rounds ?? []).length - words.length;
  const host = hosts.find((h) => h.id === hostId);
  const sharePreset = (shareData?.data ?? []).find((p) => sameJson(p.cards, cards));
  const scoringPreset = (scoringData?.data ?? []).find((p) => sameScoring(p.roundScoring, scoring));
  const notePreset = (noteData?.data ?? []).find((p) => NOTIFICATION_KEYS.every((k, i) => (p[k] ?? "") === (notes[i] ?? "")));
  const on = (v) => (Array.isArray(v) ? v.length > 0 : !!v);
  const participationReward = Array.isArray(participation) ? participation[0] : participation;
  // What the game mode would give this stream (Game modes › Stream defaults): the same builder New
  // stream and Fill month use. Each part says if it still matches it, and can go back to it.
  const build = useStreamBuilder();
  // Bundles carry no host: any host is the stream's own pick.
  const defaultHost = undefined;
  const template = build({ title, host: defaultHost ?? {}, startDate, gameMode: modeId(gameMode, !!showdown), bundleId: bundle?.id, streamType });
  const from = (text, isDefault) => (bundle ? `${text} · ${isDefault ? `From ${bundle.name}` : "Changed"}` : text);
  const resetTo = (names) => () => names.forEach((n) => form.setValue(n, structuredClone(template[n] ?? null), { shouldDirty: true }));
  // Only a part that differs from the game mode offers the reset.
  const part = (text, isDefault, names) => ({ summary: from(text, isDefault), onReset: isDefault || !bundle ? undefined : resetTo(names) });
  const sponsorName = sponsorship ? (sponsorData?.data ?? []).find((sp) => sp.title === sponsorship.title)?.name ?? sponsorship.title ?? "Custom sponsor" : "No sponsor";
  const sponsorIsDefault = (sponsorship?.title ?? null) === (template.sponsorship?.title ?? null);
  const stream = { textSavvyRounds: { rounds }, showdownConfiguration: showdown, defaultRewards: participation, hostBusterReward: buster, hostStumperBonusXp: stumper, raffleSystemWinnersConfiguration: raffle };
  const rewardSet = rewardSets.find((r) => sameRewards(r, stream));
  const rewardsAreDefault = !!bundle && sameRewards(rewardsOf(bundle), stream);
  const powerUpsAreDefault = sameJson([...(powerUpIds ?? [])].sort(), [...(template.powerUpIds ?? [])].sort());
  // Each image: the game set's selected background or the host's image, unless switched for this stream.
  const imageDefaults = { heroImageUrl: bundle?.avatarBackgroundUrl ?? null, heroCardBackgroundUrl: bundle?.heroCardBackgroundUrl ?? null, imageUrl: host?.imageUrl ?? null, heroCardImageUrl: host?.heroCardImageUrl ?? null };
  const imagesAreDefault = IMAGE_FIELDS.every((f) => !images[f] || images[f] === imageDefaults[f]);
  const shareIsDefault = sameJson(cards, template.shareableCards);
  const notesAreDefault = NOTIFICATION_KEYS.every((k, i) => (notes[i] ?? "") === (template[k] ?? ""));

  const parts = {
    basics: {
      todo: [!title?.trim() && "Add a title", !startDate && "Pick a date"].filter(Boolean),
      summary: [fillHost(title?.trim(), hostLabel(host) || hostName) || "Untitled", startDate && formatDate(startDate, "ddd, MMM D · h:mm A"), streamType === StreamType.Internal ? "Internal" : streamType === StreamType.SuperSavvy ? "Super Savvy only" : "Public", showdown && (showdown.superSavvyOnly ? "Super Savvy Showdown" : "Savvy Showdown")].filter(Boolean).join(" · "),
    },
    // Backgrounds from the game set, images from the host (or this stream's own).
    images: {
      todo: [!images.heroImageUrl && "Live game host avatar background missing", hostId && !images.imageUrl && !host?.imageUrl && "Live game host avatar image missing"].filter(Boolean),
      summary: [`${IMAGE_FIELDS.filter((f) => images[f] || imageDefaults[f]).length} of ${IMAGE_FIELDS.length} images`, bundle && (imagesAreDefault ? "From game set and host" : "Changed")].filter(Boolean).join(" · "),
      onReset: imagesAreDefault || !bundle ? undefined : () => IMAGE_FIELDS.forEach((f) => form.setValue(f, imageDefaults[f], { shouldDirty: true })),
    },
    host: { todo: [!hostId && "Pick a host"].filter(Boolean), ...(hostId ? part(hostLabel(host) || hostName, !defaultHost || hostId === defaultHost.id, ["hostId", "hostName", "imageUrl", "heroCardImageUrl"]) : { summary: "No host" }) },
    words: {
      // The game mode comes with the word set: none yet means no word set.
      todo: [!mode && "Pick a word set", missingWords > 0 && `${missingWords} ${missingWords === 1 ? "word" : "words"} missing`, (rounds ?? []).length === 0 && "No rounds", showdown && !showdown.word && "Showdown word missing"].filter(Boolean),
      summary: (mode ? `${mode.label} · ` : "") + (wordsHidden
        ? [words.length ? `${words.length} ${words.length === 1 ? "word" : "words"}` : "No words yet", showdown?.word && "showdown word"].filter(Boolean).join(" + ")
        : [words.join(", ") || "No words yet", showdown?.word && `showdown: ${showdown.word}`].filter(Boolean).join(" · ")),
    },
    game: { todo: [], ...part(scoringPreset ? `${scoringPreset.name} preset` : "Own points", sameJson(scoring, template.roundScoring), ["roundScoring"]) },
    sponsor: { todo: [], ...part(sponsorName, sponsorIsDefault, ["sponsorship"]) },
    "rewards-card": {
      todo: [],
      summary: from([rewardSet ? `${rewardSet.name} reward set` : "Own rewards", showdown?.prize && `Showdown ${prizeText(showdown.prize)}`, on(participation) && `Participation: ${rewardText(participationReward)}`, on(raffle) && `Raffle: ${raffle.length} ${raffle.length === 1 ? "winner" : "winners"}`].filter(Boolean).join(" · "), rewardsAreDefault),
      // Back to the game set's reward set.
      onReset: rewardsAreDefault || !bundle ? undefined : () => applyRewardSet(form, rewardsOf(bundle)),
    },
    "power-ups": { todo: [], ...part(`${(powerUpIds ?? []).length} ${(powerUpIds ?? []).length === 1 ? "power-up" : "power-ups"}`, powerUpsAreDefault, ["powerUpIds"]) },
    share: { todo: [], ...part(sharePreset ? `${sharePreset.name} preset` : "Own cards", shareIsDefault, ["shareableCards"]) },
    "notifications-card": { todo: [], ...part(notePreset ? `${notePreset.name} preset` : "Own texts", notesAreDefault, NOTIFICATION_KEYS) },
  };

  return Object.fromEntries(
    sections.map((s) => {
      const p = parts[s.id] ?? { todo: [], summary: "" };
      const failing = s.fields.filter((f) => f.split(".").reduce((o, k) => o?.[k], errors));
      const state = failing.length ? "error" : p.todo.length ? "todo" : "ok";
      return [s.id, { state, summary: p.summary, todo: p.todo, label: s.label, onReset: p.onReset }];
    }),
  );
}
