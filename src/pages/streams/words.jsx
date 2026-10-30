// Word sets — what one stream plays: a word per round with its time and Round Pounder reward, and
// the Savvy Showdown word with its prize, as in a stream's Words. A public stream uses a set
// once; Internal test streams may reuse sets. Listed under Streams › Game modes, per game mode.
import { useEffect, useState, useSyncExternalStore } from "react";
import { useCustomMutation, useInvalidate, useList } from "@refinedev/core";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { ChoiceGroup } from "../../ds/SelectButton";
import { EmptyState } from "../../ds/EmptyState";
import { Pill } from "../../ds/Pill";
import { SelectList } from "../../ds/SelectList";
import { SideSheet } from "../../ds/SideSheet";
import { useTimezoneFormat } from "../../contexts";
import { DP } from "../../providers";
import { useNotify } from "../../shell/notifications";
import { GameMode, StreamType, ROUND_COUNT, busterFor, durationFor } from "./enums";
import { TextInput } from "./detail/fields";
import { BusterCell, RoundTimeCell, SHOWDOWN_REWARDS, wordRules } from "./detail/sections";
import { RewardCell } from "./detail/fields";
import { EditTable, TextCell } from "../../ds/EditTable";
import { GAME_MODES, useGameModePresets } from "./gameModes";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import { CardCorner } from "../../ds/CardCorner";
import { showTitle } from "./hosts";
import { ModeLogo } from "./ModeLogo";

export const WORD_TYPES = {
  TextChain: { label: GAME_MODES.TextChain.label, icon: GAME_MODES.TextChain.icon, tone: GAME_MODES.TextChain.tone },
  SubText: { label: GAME_MODES.SubText.label, icon: GAME_MODES.SubText.icon, tone: GAME_MODES.SubText.tone },
};

/** Every word in a set: its rounds, then its showdown word. */
export const wordsOf = (set) => [...(set.rounds ?? []).map((r) => r.word), set.showdown?.word].filter((w) => w != null);
export const isPublic = (s) => s.streamType !== StreamType.Internal;
export const missingRoundWords = (s) => (s.textSavvyRounds?.rounds ?? []).filter((r) => !r.word).length;
/** Does the stream (of this game mode) still need a set? Round words missing, or no showdown word. */
export const needsSet = (s, type) => (s.gameMode ?? GameMode.TextChain) === type && (missingRoundWords(s) > 0 || (!!s.showdownConfiguration && !s.showdownConfiguration.word));

// Words stay hidden until someone enters the words password; they hide again with "Hide words"
// or a reload. Shared by every page that shows sets.
let wordsOpen = false;
const lockListeners = new Set();
const setWordsOpen = (v) => {
  wordsOpen = v;
  lockListeners.forEach((l) => l());
};
const subscribeLock = (l) => {
  lockListeners.add(l);
  return () => lockListeners.delete(l);
};

/**
 * `hidden` while locked; `unlock(then)` asks for the password first (then runs `then`), `lock()`
 * hides the words again. Render `dialog` once.
 */
export function useWordsLock() {
  const open = useSyncExternalStore(subscribeLock, () => wordsOpen);
  const [asking, setAsking] = useState(null); // null, or what to do once unlocked
  const unlock = (then) => (open ? then?.() : setAsking({ then }));
  const dialog = <UnlockWordsDialog open={!!asking} onClose={() => setAsking(null)} onUnlocked={() => { const next = asking?.then; setAsking(null); setWordsOpen(true); next?.(); }} />;
  return { hidden: !open, unlock, lock: () => setWordsOpen(false), dialog };
}

function UnlockWordsDialog({ open, onClose, onUnlocked }) {
  const { mutateAsync, isPending } = useCustomMutation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  useEffect(() => {
    if (open) {
      setPassword("");
      setError(null);
    }
  }, [open]);
  const submit = async (e) => {
    e.preventDefault();
    if (!password) return setError("Enter the password");
    try {
      await mutateAsync({ url: "/admin/word-sets/unlock", method: "post", values: { password }, dataProviderName: DP.wordSets, successNotification: false, errorNotification: false });
      onUnlocked();
    } catch (err) {
      setError(err?.response?.data?.detail ?? "That password isn't right.");
    }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={submit} noValidate>
        <DialogTitle>Show words</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="bodyMedium" color="text.secondary">
            Words are hidden so nobody sees them by accident. Enter the words password to show them.
          </Typography>
          <TextField
            label="Password"
            type="password"
            autoComplete="off"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            error={!!error}
            helperText={error ?? " "}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            Show words
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export function useWordSets() {
  const { data, isLoading } = useList({ resource: "WordSet", dataProviderName: DP.wordSets, pagination: { mode: "off" } });
  return { sets: data?.data ?? [], isLoading };
}

/** Assign (copies the set into the stream) and release (gives it back, clearing those words). */
export function useWordSetActions() {
  const notify = useNotify();
  const invalidate = useInvalidate();
  const { mutateAsync, isPending } = useCustomMutation();
  const run = async (url, values, message) => {
    try {
      const res = await mutateAsync({ url, method: "post", values, dataProviderName: DP.wordSets, successNotification: false, errorNotification: false });
      invalidate({ resource: "WordSet", dataProviderName: DP.wordSets, invalidates: ["list"] });
      invalidate({ resource: "TextSavvyStream", invalidates: ["list", "detail"], id: res.data?.stream?.id });
      notify(message);
      return res.data;
    } catch (e) {
      notify(e?.response?.data?.detail ?? "Something went wrong", { variant: "error" });
      return null;
    }
  };
  return {
    assign: (set, stream) => run(`/admin/word-sets/${set.id}/assign`, { streamId: stream.id }, `Words added to “${showTitle(stream)}”`),
    release: (set) => run(`/admin/word-sets/${set.id}/release`, {}, "Set is available again"),
    busy: isPending,
  };
}

/** A set's words as chips; the showdown word marked with a trophy. `hidden` masks them all. */
function WordTokens({ set, hidden }) {
  const { m3: c, tokens } = useTheme();
  const chip = (key, text, showdown) => (
    <Box key={key} component="span" sx={{ px: 1, height: 24, display: "inline-flex", alignItems: "center", gap: 0.5, borderRadius: `${tokens.shape.sm}px`, bgcolor: showdown ? "transparent" : c.surfaceCardInset, border: showdown ? `1px solid ${c.outlineVariant}` : "none", color: "text.primary", typography: "labelLarge", letterSpacing: hidden ? "0.1em" : undefined }}>
      {showdown && <Icon name="trophy" size={14} />}
      {hidden ? "•••••" : text || "—"}
    </Box>
  );
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }} aria-label={hidden ? "Words hidden" : undefined}>
      {(set.rounds ?? []).map((r, i) => chip(i, r.word, false))}
      {set.showdown && chip("sd", set.showdown.word, true)}
    </Box>
  );
}

/** One line about the set besides its words: how many rounds, and whether it has a showdown word. */
export function setDetails(set) {
  const n = set.rounds?.length ?? 0;
  return `${n} ${n === 1 ? "round" : "rounds"}${set.showdown ? " + showdown" : ""}`;
}

/** Name, words and details of a set; used in the set pickers. */
export function WordSetSummary({ set, hidden }) {
  const t = WORD_TYPES[set.type] ?? WORD_TYPES.TextChain;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
      <ModeLogo mode={set.type} />
      <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography variant="titleSmall">{set.title || "Untitled set"}</Typography>
        <WordTokens set={set} hidden={hidden} />
        <Typography variant="bodySmall" color="text.secondary" component="div">
          {`${t.label} · ${setDetails(set)}`}
        </Typography>
      </Box>
    </Box>
  );
}

/** Where a set is: available, assigned to an upcoming public stream, or used by one that ran. */
export function setState(set, streamsById) {
  const stream = set.streamId ? streamsById[set.streamId] : null;
  if (!stream) return { key: "available", stream: null };
  return { key: stream.status === "Scheduled" ? "assigned" : "used", stream };
}

const blankRounds = (count) => Array.from({ length: count }, (_, i) => ({ roundIndex: i, word: "", durationInSeconds: durationFor("", i), roundBusterReward: busterFor(i) }));
const NO_SHOWDOWN = { word: "" };
const wordInput = { htmlInput: { autoCapitalize: "none", spellCheck: false } };

/**
 * A set's words as one M3 data table, like a stream's Words: per round the word, its time and
 * Round Pounder reward (at least five rounds); then the showdown word and its prize.
 */
function SetWordsEditor({ control, setValue, getValues, fields, append, remove, validateWord }) {
  const { m3: c } = useTheme();
  const number = (text) => (
    <Typography variant="bodyLarge" color="text.secondary">
      {text}
    </Typography>
  );
  // The showdown is the last row, left empty when the set has none.
  const wordRow = (key, lead, name, label, rules, time, reward) => ({
    key,
    cells: [lead, <TextCell key="w" control={control} name={name} label={label} placeholder={key === "sd" ? "No showdown" : "Add a word"} rules={rules} inputProps={{ autoCapitalize: "none", spellCheck: false }} />, time, reward],
  });
  return (
    <>
      <EditTable
        label="Words"
        columns={[
          { header: "#", width: "16px" },
          { header: "Word", width: "minmax(96px, 1fr)" },
          { header: "Time", width: "64px", align: "right" },
          // Narrows before the word does, so words stay readable on a phone.
          { header: "Reward", width: "minmax(148px, 176px)" },
        ]}
        minWidth={340}
        rows={[
          ...fields.map((f, i) => ({
            ...wordRow(f.id, number(i + 1), `rounds.${i}.word`, `Round ${i + 1} word`, wordRules(validateWord), <RoundTimeCell key="t" control={control} setValue={setValue} getValues={getValues} base={`rounds.${i}`} label={`Round ${i + 1} time`} />, <BusterCell key="b" control={control} setValue={setValue} base={`rounds.${i}`} index={i} />),
            onRemove: fields.length > ROUND_COUNT && i === fields.length - 1 ? () => remove(i) : undefined,
            removeLabel: `Remove round ${i + 1}`,
          })),
          wordRow("sd", <Icon key="i" name="trophy" size={20} style={{ color: c.onSurfaceVariant }} />, "showdown.word", "Showdown word (optional)", { validate: async (v) => (!v ? true : !/^[a-z]+$/.test(v) ? "Lowercase letters a–z only" : validateWord ? await validateWord(v) : true) }, null, <RewardCell key="p" control={control} name="showdown.prize" allowed={SHOWDOWN_REWARDS} label="Showdown prize" />),
        ]}
        // A new round goes in before the showdown row.
        addLabel="Add round"
        onAdd={() => append({ roundIndex: fields.length, word: "", durationInSeconds: durationFor("", fields.length), roundBusterReward: busterFor(fields.length) })}
      />
      <Typography variant="bodySmall" color="text.secondary" sx={{ mt: -1 }}>
        Reward is the Round Pounder reward per round, and the showdown prize on the trophy row. Leave the showdown word empty for a set without one.
      </Typography>
    </>
  );
}

/** Add or edit a set with the same round / showdown fields a stream has. */
export function WordSetSheet({ open, set, mode = "TextChain", onClose, validateWord }) {
  const notify = useNotify();
  const invalidate = useInvalidate();
  const { presets } = useGameModePresets();
  const { mutateAsync, isPending } = useCustomMutation();
  const isNew = !set?.id;
  const { control, setValue, getValues, handleSubmit, reset, formState, setError } = useForm({ defaultValues: { type: "TextChain", title: "", rounds: [], hasShowdown: true, showdown: { ...NO_SHOWDOWN } } });
  const type = useWatch({ control, name: "type" });
  const { fields, append, remove } = useFieldArray({ control, name: "rounds" });

  // A new set starts with the game mode's rounds and round duration.
  const fresh = () => blankRounds(ROUND_COUNT);
  // The showdown prize: the set's own, else the game mode's.
  const prizeOf = (t, sd) => sd?.prize ?? presets[t]?.showdown?.prize ?? { rewardType: "Cash", amount: 100 };

  useEffect(() => {
    if (!open) return;
    if (set?.id) reset({ type: set.type, title: set.title ?? "", rounds: (set.rounds ?? []).map((r, i) => ({ ...r, roundBusterReward: r.roundBusterReward === undefined ? busterFor(i) : r.roundBusterReward })), hasShowdown: !!set.showdown, showdown: { word: set.showdown?.word ?? "", prize: prizeOf(set.type, set.showdown) } });
    else reset({ type: mode, title: "", rounds: fresh(), hasShowdown: true, showdown: { ...NO_SHOWDOWN, prize: prizeOf(mode) } });
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, set]);


  const save = (addAnother) =>
    handleSubmit(async (v) => {
      const values = {
        type: v.type,
        title: v.title.trim(),
        rounds: v.rounds.map((r, i) => ({ word: r.word, durationInSeconds: r.durationInSeconds ?? durationFor(r.word, i), roundBusterReward: r.roundBusterReward ?? null })),
        showdown: v.showdown?.word?.trim() ? { word: v.showdown.word.trim(), prize: v.showdown.prize } : null,
      };
      try {
        await mutateAsync({ url: isNew ? "/admin/word-sets" : `/admin/word-sets/${set.id}`, method: isNew ? "post" : "put", dataProviderName: DP.wordSets, values, successNotification: false, errorNotification: false });
        invalidate({ resource: "WordSet", dataProviderName: DP.wordSets, invalidates: ["list"] });
        notify(isNew ? `“${v.title.trim()}” added` : "Word set saved");
        if (addAnother) reset({ type: v.type, title: "", rounds: fresh(), hasShowdown: v.hasShowdown, showdown: { ...NO_SHOWDOWN, prize: v.showdown.prize } });
        else onClose();
      } catch (e) {
        const errors = e?.response?.data?.errors;
        if (errors) Object.entries(errors).forEach(([k, m]) => setError(k.replace(/\[(\d+)\]/g, ".$1"), { message: m.join(" ") }));
        else notify("Couldn't save the set", { variant: "error" });
      }
    })();

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title={isNew ? "New word set" : set.title || "Word set"}
      subtitle={isNew ? undefined : `${WORD_TYPES[set.type]?.label ?? set.type} word set`}
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          {isNew && (
            <Button variant="tonal" onClick={() => save(true)} disabled={isPending}>
              Save and add another
            </Button>
          )}
          <Button onClick={() => save(false)} disabled={isPending || (!isNew && !formState.isDirty)}>
            {isNew ? "Add word set" : "Save"}
          </Button>
        </>
      }
    >
      {/* Which game mode the set is for: the page's mode to start with; fixed once the set exists. */}
      {isNew && (
        <ChoiceGroup label="Game mode" value={type} options={Object.entries(WORD_TYPES).map(([id, w]) => ({ value: id, label: w.label, icon: w.icon }))} onChange={(v) => setValue("type", v, { shouldDirty: true })} />
      )}
      <TextInput control={control} name="title" label="Name" max={40} rules={{ validate: (v) => (v?.trim() ? (v.trim().length <= 40 ? true : "Use 40 characters or fewer") : "Enter a name") }} />
      <SetWordsEditor control={control} setValue={setValue} getValues={getValues} fields={fields} append={append} remove={remove} validateWord={validateWord} />
    </SideSheet>
  );
}

/**
 * From a stream's detail page: pick a set for its rounds (same game mode) or its showdown. A public
 * stream can only take sets no other public stream uses; an Internal one can take any.
 */
export function WordSetPickerDialog({ open, type, stream, onClose, onPick }) {
  const { sets } = useWordSets();
  const { hidden } = useWordsLock();
  const [picked, setPicked] = useState(null);
  useEffect(() => {
    if (open) setPicked(null);
  }, [open]);
  const publicStream = stream ? isPublic(stream) : true;
  const usable = sets
    .filter((w) => w.type === type && (!publicStream || !w.streamId || w.streamId === stream?.id))
    .sort((a, b) => Number(!!a.streamId) - Number(!!b.streamId) || Date.parse(a.createdAt) - Date.parse(b.createdAt));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>{`Pick a ${WORD_TYPES[type]?.label ?? type} word set`}</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {usable.length === 0 ? (
          <EmptyState compact icon="spellcheck" title={`No ${WORD_TYPES[type]?.label ?? type} sets available`} description="Add more in Streams › Game modes." />
        ) : (
          <SelectList label="Word sets" items={usable} value={picked?.id} onChange={(id) => setPicked(usable.find((w) => w.id === id))} renderItem={(w) => <WordSetSummary set={w} hidden={hidden} />} />
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!picked} onClick={() => onPick(picked)}>
          Use this set
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Types are filtered with the stock cards above the list; these chips filter by state.
/** A word set as a card: name and game mode, its words (hideable), where it is, and ⋮ actions. */
export function WordSetCard({ set, state, hidden, onOpen, actions, showState = true, detail }) {
  const { formatDate } = useTimezoneFormat();
  const t = WORD_TYPES[set.type] ?? WORD_TYPES.TextChain;
  return (
    // The whole card is the click target (its hover covers all of it); ⋮ sits in the corner.
    <Card sx={{ position: "relative", height: "100%" }}>
      <CardActionArea onClick={onOpen} sx={{ height: "100%", minWidth: 0, p: 2, pr: 6, display: "flex", alignItems: "flex-start", justifyContent: "flex-start", gap: 2 }}>
        <ModeLogo mode={set.type} />
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="titleMedium" noWrap>
                {set.title || "Untitled set"}
              </Typography>
              <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
                {state.key === "available" ? (detail ?? `${t.label} · ${setDetails(set)}`) : `${state.key === "used" ? "Used by" : "Assigned to"} ${showTitle(state.stream)} · ${formatDate(state.stream.startDate, "MMM D")}`}
              </Typography>
            </Box>
            {showState && <Pill tone={state.key === "available" ? "success" : state.key === "used" ? "neutral" : "primary"}>{state.key === "available" ? "Available" : state.key === "used" ? "Used" : "Assigned"}</Pill>}
          </Box>
          <WordTokens set={set} hidden={hidden} />
        </Box>
      </CardActionArea>
      <CardCorner>{actions}</CardCorner>
    </Card>
  );
}
