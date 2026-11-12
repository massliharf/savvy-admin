// Streams › Schedule — "Create event": one stream on a date, or, with an end date, a stream on the
// picked weekdays between the two dates. With its game set, host and sponsor; the words (and with
// them the game mode) come later, from a word set on each stream.
import { useEffect, useMemo, useState } from "react";
import { useCustomMutation, useInvalidate, useList } from "@refinedev/core";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import ButtonBase from "@mui/material/ButtonBase";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import useMediaQuery from "@mui/material/useMediaQuery";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { Banner } from "../../ds/Banner";
import { FieldHelper } from "../../ds/FieldHelper";
import { ChoiceGroup } from "../../ds/SelectButton";
import { cornerFor } from "../../ds/IconTile";
import { radius } from "../../theme/tokens";
import { dayjs } from "../../contexts";
import { DP } from "../../providers";
import { useNotify } from "../../shell/notifications";
import { useBundles, useStreamBuilder } from "./gameModes";
import { GameSetPicker, HostPicker, PickCard, PickPlaceholder } from "./pickers";
import { DEFAULT_TITLE, fillHost, hostLabel, titleRule } from "./hosts";
import { richLen } from "./enums";

// A long range stops here, so one click can't flood the schedule.
const MAX_STREAMS = 200;
const NONE = "__none__";

// Weekdays (0 = Sunday, as dayjs counts), Monday first.
const WEEKDAYS = [
  { value: 1, label: "Mon", letter: "M" },
  { value: 2, label: "Tue", letter: "T" },
  { value: 3, label: "Wed", letter: "W" },
  { value: 4, label: "Thu", letter: "T" },
  { value: 5, label: "Fri", letter: "F" },
  { value: 6, label: "Sat", letter: "S" },
  { value: 0, label: "Sun", letter: "S" },
];
const REPEAT = [
  { value: "once", label: "Once" },
  { value: "recurring", label: "Recurring" },
  { value: "month", label: "Month" },
];

/** The weekdays as round toggle buttons (M T W T F S S, like a calendar app): a picked day is filled blue. */
function DayButtons({ value, onChange }) {
  const { m3: c, tokens } = useTheme();
  // `onChange` is a state setter: each tap toggles from the latest days.
  const toggle = (d) => onChange((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  return (
    <Box role="group" aria-label="Days" sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {WEEKDAYS.map((d) => {
        const on = value.includes(d.value);
        return (
          <ButtonBase
            key={d.value}
            onClick={() => toggle(d.value)}
            aria-pressed={on}
            aria-label={d.label}
            sx={{
              width: 36,
              height: 36,
              borderRadius: radius("full"),
              typography: "labelLarge",
              color: on ? c.onPrimary : c.onSurface,
              bgcolor: on ? c.primary : c.ctrl,
              transition: `background-color ${tokens.motion.effects}`,
              "&:hover": { bgcolor: on ? c.primaryHover : c.ctrlHover },
              "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: 2 },
            }}
          >
            {d.letter}
          </ButtonBase>
        );
      })}
    </Box>
  );
}

/**
 * A month calendar to pick any days on: ‹ November 2026 › to move between months (picks are kept
 * across months), M T W T F S S on top, today ringed, past days greyed out.
 */
function MonthDays({ month, onMonth, value, onChange, timezone }) {
  const { m3: c, tokens } = useTheme();
  const today = dayjs().tz(timezone).startOf("day");
  const first = month.startOf("month");
  const lead = (first.day() + 6) % 7; // blanks before the 1st, Monday first
  const cells = [...Array(lead).fill(null), ...Array.from({ length: first.daysInMonth() }, (_, i) => first.add(i, "day"))];
  const toggle = (k) => onChange((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  const atStart = !first.isAfter(today, "month");
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2, borderRadius: `${tokens.shape.md}px`, border: `1px solid ${c.outlineVariant}` }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <IconButton size="small" aria-label="Previous month" disabled={atStart} onClick={() => onMonth(first.subtract(1, "month"))}>
          <Icon name="chevron_left" />
        </IconButton>
        <Typography variant="titleSmall" sx={{ minWidth: 128, textAlign: "center" }}>
          {first.format("MMMM YYYY")}
        </Typography>
        <IconButton size="small" aria-label="Next month" onClick={() => onMonth(first.add(1, "month"))}>
          <Icon name="chevron_right" />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        <Typography variant="bodySmall" color="text.secondary">
          {value.length ? `${value.length} picked` : "Tap days to pick"}
        </Typography>
        {value.length > 0 && (
          <Button variant="text" size="small" onClick={() => onChange([])}>
            Clear
          </Button>
        )}
      </Box>
      <Box role="group" aria-label={`Days in ${first.format("MMMM YYYY")}`} sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 0.5, justifyItems: "center" }}>
        {WEEKDAYS.map((d) => (
          <Typography key={d.value} variant="labelMedium" color="text.secondary" sx={{ pb: 0.5 }}>
            {d.letter}
          </Typography>
        ))}
        {cells.map((d, i) => {
          if (!d) return <Box key={`b${i}`} />;
          const k = d.format("YYYY-MM-DD");
          const on = value.includes(k);
          const isToday = d.isSame(today, "day");
          return (
            <ButtonBase
              key={k}
              disabled={d.isBefore(today, "day")}
              onClick={() => toggle(k)}
              aria-pressed={on}
              aria-label={d.format("dddd, MMMM D")}
              sx={{
                width: 40,
                height: 40,
                borderRadius: radius("full"),
                typography: "bodyMedium",
                fontWeight: on ? 600 : 400,
                color: on ? c.onPrimary : c.onSurface,
                bgcolor: on ? c.primary : "transparent",
                boxShadow: isToday && !on ? `inset 0 0 0 1px ${c.primary}` : "none",
                transition: `background-color ${tokens.motion.effects}`,
                "&:hover": { bgcolor: on ? c.primaryHover : c.ctrlHover },
                "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: 2 },
                "&.Mui-disabled": { color: c.onSurfaceVariant, opacity: 0.38 },
              }}
            >
              {d.date()}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}

/**
 * The streams to add: one on `from`; with `to`, one on each picked weekday from `from` to `to`;
 * with `dates`, one on each of those dates. Past times are left out.
 */
function planEvent({ from, to, days, dates, time, timezone }) {
  const now = dayjs();
  const planned = [];
  const skipped = { past: 0 };
  const add = (start) => {
    if (start.isBefore(now)) skipped.past += 1;
    else planned.push(start);
  };
  // Month: the picked dates.
  if (dates) {
    if (time?.isValid()) [...dates].sort().slice(0, MAX_STREAMS).forEach((k) => add(dayjs.tz(`${k}T${time.format("HH:mm")}`, timezone)));
    return { planned, skipped };
  }
  if (!from?.isValid() || !time?.isValid()) return { planned, skipped };
  const at = (d) => dayjs.tz(`${d.format("YYYY-MM-DD")}T${time.format("HH:mm")}`, timezone);
  if (!to) {
    add(at(from));
    return { planned, skipped };
  }
  if (!to.isValid() || to.isBefore(from, "day")) return { planned, skipped };
  for (let d = from.startOf("day"); !d.isAfter(to, "day") && planned.length < MAX_STREAMS; d = d.add(1, "day")) {
    if (days.includes(d.day())) add(at(d));
  }
  return { planned, skipped };
}

/** "Create event": one stream, or a recurring one on the picked weekdays until its end date. */
export function CreateEventDialog({ open, date, onClose, streams, hosts, timezone, onCreated }) {
  const theme = useTheme();
  const c = theme.m3;
  const { tokens } = theme;
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const notify = useNotify();
  const invalidate = useInvalidate();
  const build = useStreamBuilder();
  const { mutateAsync, isPending } = useCustomMutation();
  const { bundles } = useBundles();
  const { data: sponsorData } = useList({ resource: "Sponsor", dataProviderName: DP.sponsors, pagination: { mode: "off" } });
  const sponsors = [...(sponsorData?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  const tomorrow = () => dayjs().tz(timezone).add(1, "day").startOf("day");
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [bundleId, setBundleId] = useState(null);
  const [host, setHost] = useState(null);
  const [sponsorId, setSponsorId] = useState(NONE);
  const [from, setFrom] = useState(tomorrow);
  const [time, setTime] = useState(() => tomorrow().hour(19));
  const [repeat, setRepeat] = useState("once");
  const recurring = repeat === "recurring";
  const monthly = repeat === "month";
  const [month, setMonth] = useState(() => tomorrow().startOf("month"));
  const [dates, setDates] = useState([]);
  const [to, setTo] = useState(() => tomorrow().endOf("month"));
  const [days, setDays] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  // Each time it opens: one stream at 7 PM, tomorrow or on the day it was opened from (a calendar
  // day's +).
  useEffect(() => {
    if (!open) return;
    const picked = date ? dayjs.tz(date, timezone).startOf("day") : null;
    const start = picked?.isValid() && !picked.isBefore(dayjs().tz(timezone), "day") ? picked : tomorrow();
    setTitle(DEFAULT_TITLE);
    setBundleId(null);
    setHost(hosts[0] ?? null);
    setSponsorId(NONE);
    setFrom(start);
    setTime(start.hour(19));
    setRepeat("once");
    setMonth(start.startOf("month"));
    setDates([start.format("YYYY-MM-DD")]);
    setTo(start.endOf("month"));
    setDays([start.day()]);
    setSubmitted(false);
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setId = bundles.some((b) => b.id === bundleId) ? bundleId : bundles[0]?.id ?? null;
  const sponsor = sponsors.find((sp) => sp.id === sponsorId) ?? null;
  const end = recurring ? to : null;
  const picked = monthly ? dates : null;
  const { planned, skipped } = useMemo(() => planEvent({ from, to: end, days, dates: picked, time, timezone }), [from, end, days, picked, time, timezone]);

  const titleCheck = titleRule(title);
  const titleLen = richLen(title.trim());
  const errors = {
    title: titleCheck === true ? null : titleCheck,
    host: !host && "Pick a host",
    from: !monthly && !from?.isValid() && "Pick a date",
    dates: monthly && !dates.length && "Pick at least one day",
    time: !time?.isValid() && "Pick a time",
    to: recurring && (!to?.isValid() ? "Pick an end date" : to.isBefore(from, "day") ? "Ends before it starts" : null),
    days: recurring && !days.length && "Pick at least one day",
  };
  const show = (k) => (submitted ? errors[k] || null : null);
  const valid = !Object.values(errors).some(Boolean);

  const create = async () => {
    setSubmitted(true);
    if (!valid || !planned.length) return;
    const payload = planned.map((start) => {
      // Built like every new stream (its game set + its presets); words and the game mode come
      // later, from a word set.
      const values = build({ title: title.trim(), host, startDate: start.utc().toISOString(), bundleId: setId });
      values.sponsorship = sponsor ? { title: sponsor.title, description: sponsor.description, cta: sponsor.cta, imageUrl: sponsor.imageUrl ?? null, sponsorshipImageFile: null } : null;
      return values;
    });
    try {
      await mutateAsync({ url: "/TextSavvyStream/bulk", method: "post", values: { streams: payload, assignments: [] }, successNotification: false, errorNotification: false });
      invalidate({ resource: "TextSavvyStream", invalidates: ["list"] });
      notify(`${payload.length} ${payload.length === 1 ? "stream" : "streams"} added`);
      onCreated?.(planned[0]);
      onClose();
    } catch (e) {
      notify(e?.response?.data?.detail ?? "Couldn't add the streams", { variant: "error" });
    }
  };

  const thumb = (src, size) => (
    <Avatar src={src === NONE ? undefined : src ?? undefined} alt="" sx={{ width: size, height: size, borderRadius: `${cornerFor(size)}px`, bgcolor: c.surfaceContainerHighest, color: c.onSurfaceVariant }}>
      <Icon name={src === NONE ? "block" : "handshake"} size={size / 2} />
    </Avatar>
  );
  const pickerIcon = (name) => () => <Icon name={name} />;

  // What it adds, in one line.
  const at = time?.isValid() ? time.format("h:mm A") : "…";
  const count = `${planned.length} ${planned.length === 1 ? "stream" : "streams"}`;
  const dayNames = WEEKDAYS.filter((d) => days.includes(d.value)).map((d) => d.label).join(", ");
  // The plan, spelled out: how many, on which days, when, between which dates.
  const pickedDates = [...dates].sort().map((k) => dayjs(k));
  // "Nov 13, 15, 20 · Dec 2": picked days grouped by month.
  const byMonth = pickedDates.reduce((acc, d) => {
    const m = d.format("MMM YYYY");
    (acc[m] ??= []).push(d);
    return acc;
  }, {});
  const dateList = pickedDates.length ? Object.values(byMonth).map((ds) => `${ds[0].format("MMM")} ${ds.map((d) => d.date()).join(", ")}`).join(" · ") : "No days picked";
  const plan = monthly
    ? {
        headline: planned.length ? `${count} will be created` : "No stream will be created",
        rows: [
          ["event", dateList],
          ["schedule", `At ${at}`],
        ],
      }
    : !from?.isValid()
    ? null
    : {
        headline: planned.length ? `${count} will be created` : "No stream will be created",
        rows: recurring
          ? [
              ["event_repeat", dayNames ? `Every ${dayNames}` : "No days picked"],
              ["schedule", `At ${at}`],
              ["date_range", `${from.format("ddd, MMM D")} – ${to?.isValid() ? to.format("ddd, MMM D, YYYY") : "pick an end date"}`],
            ]
          : [
              ["event", from.format("dddd, MMM D, YYYY")],
              ["schedule", `At ${at}`],
            ],
      };

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        Create event
        <Typography variant="bodyMedium" color="text.secondary" component="span">
          One stream, a recurring one on the picked weekdays, or any days of a month.
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "8px !important" }}>
      <TextField
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={!!show("title")}
        // {host} is filled with each stream's host wherever the title shows; say how it reads now.
        helperText={<FieldHelper text={show("title") ?? (/\{host\}/i.test(title) && host ? `Shows as “${fillHost(title, hostLabel(host))}”` : "{host} becomes the host's name.")} counter={`${titleLen} / 100`} over={titleLen > 100} />}
      />
      <Box sx={{ display: "flex", gap: 1.5 }}>
        {!monthly && (
          <DatePicker
            label="Date"
            value={from}
            timezone={timezone}
            disablePast
            onChange={setFrom}
            slots={{ openPickerIcon: pickerIcon("calendar_today") }}
            slotProps={{ textField: { error: !!show("from"), helperText: show("from") || undefined, sx: { flex: 3 } } }}
          />
        )}
        <TimePicker
          label="Time"
          value={time}
          timezone={timezone}
          onChange={setTime}
          slots={{ openPickerIcon: pickerIcon("schedule") }}
          slotProps={{ textField: { error: !!show("time"), helperText: show("time") || undefined, sx: { flex: 2, maxWidth: monthly ? "50%" : undefined } } }}
        />
      </Box>

      {/* Once; recurring (the weekdays it repeats on and when it ends); or picked days of a month. */}
      <ChoiceGroup label="Repeat" value={repeat} options={REPEAT} onChange={(v) => v && setRepeat(v)} />
      {monthly && month?.isValid() && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          <MonthDays month={month} onMonth={setMonth} value={dates} onChange={setDates} timezone={timezone} />
          {show("dates") && (
            <Typography variant="bodySmall" color="error">
              {show("dates")}
            </Typography>
          )}
        </Box>
      )}
      {recurring && (
        <>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <Typography variant="labelLarge" color="text.secondary">
              Repeats on
            </Typography>
            <DayButtons value={days} onChange={setDays} />
            {show("days") && (
              <Typography variant="bodySmall" color="error">
                {show("days")}
              </Typography>
            )}
          </Box>
          <DatePicker
            label="End date"
            value={to}
            timezone={timezone}
            disablePast
            minDate={from}
            onChange={setTo}
            slots={{ openPickerIcon: pickerIcon("event") }}
            slotProps={{ textField: { error: !!show("to"), helperText: show("to") || undefined } }}
          />
        </>
      )}

      <GameSetPicker value={setId} onChange={setBundleId} />
      <HostPicker hosts={hosts} value={host} onChange={setHost} error={!!show("host")} helperText={show("host") || undefined} />
      <PickCard
        label="Sponsor"
        ariaLabel="Sponsor"
        value={sponsor ? sponsor.id : NONE}
        options={[{ value: NONE, media: thumb(NONE, 32), primary: "No sponsor" }, ...sponsors.map((sp) => ({ value: sp.id, media: thumb(sp.imageUrl, 32), primary: sp.name, secondary: sp.title }))]}
        onChange={setSponsorId}
        media={sponsor ? thumb(sponsor.imageUrl, 48) : <PickPlaceholder icon="handshake" />}
        title={sponsor ? sponsor.name : "No sponsor"}
        supporting={sponsor ? sponsor.title : `${sponsors.length} ${sponsors.length === 1 ? "sponsor" : "sponsors"} in the library`}
      />

      {plan && (
        <Box role="status" sx={{ display: "flex", flexDirection: "column", gap: 1, p: 2, borderRadius: `${tokens.shape.md}px`, bgcolor: planned.length ? c.primaryContainer : c.surfaceContainerHigh, color: planned.length ? c.onPrimaryContainer : c.onSurface }}>
          <Typography variant="titleMedium">{plan.headline}</Typography>
          {plan.rows.map(([icon, text]) => (
            <Box key={icon} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Icon name={icon} size={18} style={{ flexShrink: 0 }} />
              <Typography variant="bodyMedium">{text}</Typography>
            </Box>
          ))}
        </Box>
      )}
      {/* Days that won't get a stream: a warning, so it isn't missed under the summary. */}
      {skipped.past > 0 && planned.length > 0 && (
        <Banner tone="warning" icon="history">
          {skipped.past === 1 ? "1 day is" : `${skipped.past} days are`} left out: {at} has already passed on {skipped.past === 1 ? "it" : "them"}.
        </Banner>
      )}
      {planned.length >= MAX_STREAMS && <Banner tone="warning">Stops at {MAX_STREAMS} streams; pick an earlier end date for the rest.</Banner>}
      <Banner icon="hide_image">Streams show in the app right away; their game mode logo shows once each has its word set.</Banner>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={create} disabled={isPending || !planned.length || (submitted && !valid)}>
          {isPending ? "Creating…" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
