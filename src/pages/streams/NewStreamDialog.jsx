import { useEffect, useState } from "react";
import { useCreate } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { Icon } from "../../ds/Icon";
import { dayjs, useTimezone } from "../../contexts";
import { richLen } from "./enums";
import { GAME_MODES, modeOf, useBundles, useStreamBuilder } from "./gameModes";
import { GameSetPicker, HostPicker } from "./pickers";
import { DEFAULT_TITLE, fillHost, hostLabel, titleRule } from "./hosts";
import { FieldHelper } from "../../ds/FieldHelper";
import { ListGroup, ListItem } from "../../ds/ListGroup";
import Typography from "@mui/material/Typography";

const defaultStart = (tz) => dayjs().tz(tz).add(1, "day").hour(19).minute(0).second(0).millisecond(0);

function initialState(source, hosts, tz, date) {
  const start = date ? dayjs.tz(`${date}T19:00`, tz) : defaultStart(tz);
  if (!source) return { gameMode: null, bundleId: null, title: DEFAULT_TITLE, host: null, start: start.isValid() ? start : defaultStart(tz), streamType: "Public" };
  return {
    gameMode: modeOf(source).id,
    bundleId: source.bundleId ?? null,
    // The copy keeps the title; {host} names whoever hosts it.
    title: source.title || DEFAULT_TITLE,
    host: hosts.find((h) => h.id === source.hostId) ?? null,
    start: dayjs.utc(source.startDate).tz(tz).add(7, "day"),
    streamType: source.streamType ?? "Public",
  };
}

/**
 * Short create flow: bundle, format, host, time, audience, title. Everything else (host and sponsor included)
 * comes from the game mode (or the duplicated stream) and is changed on the stream.
 */
export function NewStreamDialog({ open, source, date, hosts, onClose, onCreated }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { timezone } = useTimezone();
  const [form, setForm] = useState(() => initialState(source, hosts, timezone, date));
  const [submitted, setSubmitted] = useState(false);
  const { mutateAsync: create, isPending } = useCreate();
  const build = useStreamBuilder();
  // The picked bundle; the first one until another is picked.
  const { bundles } = useBundles();
  const bundleId = bundles.some((b) => b.id === form.bundleId) ? form.bundleId : bundles[0]?.id ?? null;

  useEffect(() => {
    if (open) {
      setForm(initialState(source, hosts, timezone, date));
      setSubmitted(false);
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, source?.id, date]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  // Date and time are picked separately; rebuild the instant in the admin time zone so DST is right.
  const compose = (date, time) =>
    date?.isValid() && time?.isValid() ? dayjs.tz(`${date.format("YYYY-MM-DD")}T${time.format("HH:mm")}`, timezone) : (date ?? time);
  // Who'll host: picked here (a copy starts with its source's host).
  // With one host in the library there's nothing to pick: it's them.
  const host = form.host ?? (hosts.length === 1 ? hosts[0] : null);
  const titleLen = richLen(form.title.trim());
  const titleCheck = titleRule(form.title);
  const errors = {
    title: titleCheck === true ? null : titleCheck,
    start: !form.start?.isValid?.() ? "Pick a date and time" : form.start.isBefore(dayjs()) ? "Pick a time in the future" : null,
  };
  const valid = !errors.title && !errors.start;
  const show = (k) => (submitted ? errors[k] : null);
  const mode = GAME_MODES[form.gameMode];

  const submit = async () => {
    setSubmitted(true);
    if (!valid) return;
    const startDate = form.start.utc().toISOString();
    // Who can join comes from the game set; a copy keeps its source's.
    const base = { title: form.title.trim(), host: host ?? {}, startDate, gameMode: form.gameMode, bundleId, streamType: source ? form.streamType : undefined };
    // A new stream: its game set's defaults and the Default presets (see useStreamBuilder). Its game
    // comes with its word set.
    let values = build(base);
    if (source) {
      // A copy keeps the source's settings (sponsor, rewards, share cards, notifications…); only
      // the time, host and audience are new. Words aren't copied: a word set is used once.
      // eslint-disable-next-line no-unused-vars
      const { id, status, prizePool, totalPrizePool, isDraft, hideGameModeLogo, ...copy } = source;
      const sameMode = (source.gameMode ?? null) === (mode?.id ?? null);
      const sameHost = source.hostId === host?.id;
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
    // Words come later (Pick a word set on the stream); until then the app hides the mode logo.
    const res = await create({ resource: "TextSavvyStream", values, successNotification: false });
    onCreated(res.data);
  };

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth>
      <DialogTitle>{source ? "Duplicate stream" : "New stream"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* What the stream starts with: a game set (who can join, showdown, rewards). A copy keeps its
            source's settings. The game comes with the word set, added on the stream afterwards. */}
        {!source && (
          <GameSetPicker value={bundleId} onChange={(id) => set({ bundleId: id })} />
        )}

        <HostPicker hosts={hosts} value={host} onChange={(h) => set({ host: h })} />

        {/* The stream itself: its title and when. Who can join comes from its game set. */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="overline" color="text.secondary" component="div">
            Stream
          </Typography>
          <ListGroup label="Stream">
            <ListItem leading={<Icon name="title" size={20} />} title="Title">
              <TextField
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
                error={!!show("title")}
                inputProps={{ "aria-label": "Title" }}
                // {host} is filled with the stream's host wherever the title shows; say how it reads now.
                helperText={<FieldHelper text={show("title") ?? (/\{host\}/i.test(form.title) && host ? `Shows as “${fillHost(form.title, hostLabel(host))}”` : "{host} becomes the host's name.")} counter={`${titleLen} / 100`} over={titleLen > 100} />}
                sx={{ mt: 1 }}
              />
            </ListItem>
            <ListItem leading={<Icon name="event" size={20} />} title="When" supporting={show("start") ? undefined : `Time zone: ${timezone.replace(/_/g, " ")}`} error={show("start")}>
              <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
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
            </ListItem>
          </ListGroup>
        </Box>
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
