import { useEffect, useState } from "react";
import { useCreate } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormHelperText from "@mui/material/FormHelperText";
import TextField from "@mui/material/TextField";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { Icon } from "../../ds/Icon";
import { dayjs, useTimezone } from "../../contexts";
import { richLen } from "./enums";
import { GAME_MODES, modeOf, useGameModePresets, useStreamBuilder } from "./gameModes";
import { DEFAULT_TITLE, fillHost, hostLabel, titleRule } from "./hosts";
import { AudienceField, HostPicker, ModeChoice } from "./pickers";
import { FieldHelper } from "../../ds/FieldHelper";
import { SelectButton } from "../../ds/SelectButton";
import { useWordSets } from "./words";

const defaultStart = (tz) => dayjs().tz(tz).add(1, "day").hour(19).minute(0).second(0).millisecond(0);

function initialState(source, hosts, tz, date) {
  const start = date ? dayjs.tz(`${date}T19:00`, tz) : defaultStart(tz);
  if (!source) return { gameMode: "TextChain", title: DEFAULT_TITLE, host: null, start: start.isValid() ? start : defaultStart(tz), streamType: "Public" };
  return {
    gameMode: modeOf(source).id,
    // The copy keeps the title; {host} names whoever hosts it.
    title: source.title || DEFAULT_TITLE,
    host: hosts.find((h) => h.id === source.hostId) ?? null,
    start: dayjs.utc(source.startDate).tz(tz).add(7, "day"),
    streamType: source.streamType ?? "Public",
  };
}

/**
 * Short create flow: game mode, title, time, host, audience. Everything else (host and sponsor
 * included, by default) comes from the game mode (or the duplicated stream).
 */
export function NewStreamDialog({ open, source, date, hosts, onClose, onCreated }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { timezone } = useTimezone();
  const [form, setForm] = useState(() => initialState(source, hosts, timezone, date));
  const [submitted, setSubmitted] = useState(false);
  // The host follows the game mode's default until someone picks one by hand.
  const [hostPicked, setHostPicked] = useState(false);
  const { mutateAsync: create, isPending } = useCreate();
  const { presets } = useGameModePresets();
  const defaultHost = (gameMode) => hosts.find((h) => h.id === presets[gameMode]?.defaultHostId) ?? null;
  const build = useStreamBuilder();
  const { sets } = useWordSets();

  useEffect(() => {
    if (open) {
      setForm(initialState(source, hosts, timezone, date));
      setSubmitted(false);
      setHostPicked(!!source);
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, source?.id, date]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  // Fill in (and follow) the mode's default host while none has been picked by hand.
  useEffect(() => {
    if (!open || hostPicked) return;
    const h = defaultHost(form.gameMode);
    if (h && h.id !== form.host?.id) set({ host: h });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hostPicked, form.gameMode, presets, hosts]);
  // Date and time are picked separately; rebuild the instant in the admin time zone so DST is right.
  const compose = (date, time) =>
    date?.isValid() && time?.isValid() ? dayjs.tz(`${date.format("YYYY-MM-DD")}T${time.format("HH:mm")}`, timezone) : (date ?? time);
  const titleLen = richLen(form.title.trim());
  const titleCheck = titleRule(form.title);
  const errors = {
    title: titleCheck === true ? null : titleCheck,
    host: form.host ? null : "Choose a host",
    start: !form.start?.isValid?.() ? "Pick a date and time" : form.start.isBefore(dayjs()) ? "Pick a time in the future" : null,
  };
  const valid = !errors.title && !errors.host && !errors.start;
  const show = (k) => (submitted ? errors[k] : null);
  const mode = GAME_MODES[form.gameMode];
  // Ready word sets of the chosen mode, oldest first (the order Fill month uses them in).
  const readySets = sets.filter((w) => w.type === form.gameMode && !w.streamId).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  const submit = async () => {
    setSubmitted(true);
    if (!valid) return;
    const startDate = form.start.utc().toISOString();
    const base = { title: form.title.trim(), host: form.host, startDate, gameMode: form.gameMode, streamType: form.streamType };
    // A new stream: the game mode's defaults and the Default presets (see useStreamBuilder).
    let values = build(base);
    if (source) {
      // A copy keeps the source's settings (sponsor, rewards, share cards, notifications…); only
      // the time, host and audience are new. Words aren't copied: a word set is used once.
      // eslint-disable-next-line no-unused-vars
      const { id, status, prizePool, totalPrizePool, isDraft, hideGameModeLogo, ...copy } = source;
      const sameMode = source.gameMode === mode.base;
      const sameHost = source.hostId === form.host.id;
      values = {
        ...copy,
        title: base.title,
        startDate,
        streamType: form.streamType,
        gameMode: values.gameMode,
        hostId: values.hostId,
        hostName: values.hostName,
        imageUrl: sameHost ? copy.imageUrl : values.imageUrl,
        heroImageUrl: sameHost ? copy.heroImageUrl : values.heroImageUrl,
        textSavvyRounds: sameMode ? { rounds: (copy.textSavvyRounds?.rounds ?? []).map((r) => ({ ...r, word: "" })) } : values.textSavvyRounds,
        showdownConfiguration: sameMode && copy.showdownConfiguration ? { ...copy.showdownConfiguration, word: "" } : values.showdownConfiguration,
        roundScoring: sameMode ? copy.roundScoring : values.roundScoring,
        hostStumperBonusXp: sameMode ? copy.hostStumperBonusXp : values.hostStumperBonusXp,
        round1StartsAt: null,
      };
    }
    // The app shows the stream right away; its game mode logo once the words are in.
    const res = await create({ resource: "TextSavvyStream", values: form.wordSetId && !source ? { ...values, wordSetId: form.wordSetId } : values, successNotification: false });
    onCreated(res.data);
  };

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth>
      <DialogTitle>{source ? "Duplicate stream" : "New stream"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* In the order a stream is put together: what's played, the words, who hosts, when, then the title. */}
        <ModeChoice value={form.gameMode} onChange={(gameMode) => set({ gameMode, wordSetId: null })} />

        {/* The words: a ready word set of this mode now, or later (the app shows the game mode logo
            once the words are in). A copy never takes words: a set is used once. */}
        {!source && (
          <SelectButton
            label="Word set"
            value={form.wordSetId ?? ""}
            options={[{ value: "", label: "Add words later" }, ...readySets.map((w) => ({ value: w.id, label: `${w.title} · ${w.rounds?.length ?? 0} rounds${w.showdown ? " + showdown" : ""}` }))]}
            onChange={(wordSetId) => set({ wordSetId: wordSetId || null })}
            helperText={form.wordSetId ? "Its words and rewards fill in the rounds." : readySets.length ? "Without words the app hides the game mode logo." : `No ready ${mode.label} word sets. Add some in Streams › Game modes.`}
          />
        )}

        <HostPicker
          hosts={hosts}
          value={form.host}
          onChange={(host) => {
            setHostPicked(true);
            set({ host });
          }}
          error={show("host")}
          helperText={!hostPicked && form.host ? `Default for ${mode.label}` : undefined}
        />


        <Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <DatePicker
              label="Date"
              value={form.start}
              timezone={timezone}
              disablePast
              onChange={(d) => set({ start: compose(d, form.start) })}
              slots={{ openPickerIcon: () => <Icon name="calendar_today" /> }}
              slotProps={{ textField: { error: !!show("start"), sx: { flex: 3 } } }}
            />
            <TimePicker
              label="Time"
              value={form.start}
              timezone={timezone}
              onChange={(t) => set({ start: compose(form.start, t) })}
              slots={{ openPickerIcon: () => <Icon name="schedule" /> }}
              slotProps={{ textField: { error: !!show("start"), sx: { flex: 2 } } }}
            />
          </Box>
          <FormHelperText error={!!show("start")}>{show("start") ?? `Time zone: ${timezone.replace(/_/g, " ")}`}</FormHelperText>
        </Box>


        <AudienceField value={form.streamType} onChange={(streamType) => set({ streamType })} />

        <TextField
          label="Title"
          value={form.title}
          onChange={(e) => set({ title: e.target.value })}
          error={!!show("title")}
          // {host} is filled with the stream's host wherever the title shows; say how it reads now.
          helperText={<FieldHelper text={show("title") ?? (/\{host\}/i.test(form.title) && form.host ? `Shows as “${fillHost(form.title, hostLabel(form.host))}”` : "{host} becomes the host's name.")} counter={`${titleLen} / 100`} over={titleLen > 100} />}
        />

      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={isPending}>
          {source ? "Duplicate" : "Add stream"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
