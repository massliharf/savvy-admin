// Streams › Schedule — daily time slots, "Fill month" (creates planned) and publishing planned.
import { useEffect, useMemo, useState } from "react";
import { useCustomMutation, useInvalidate, useList, useUpdate } from "@refinedev/core";
import { Controller, useFieldArray, useForm, useWatch, useFormState } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { SideSheet } from "../../ds/SideSheet";
import { Banner } from "../../ds/Banner";
import { dayjs } from "../../contexts";
import { DP } from "../../providers";
import { useNotify } from "../../shell/notifications";
import { StreamType } from "./enums";
import { TextInput } from "./detail/fields";
import { modeOf, useBundles, useStreamBuilder } from "./gameModes";
import { BundleCards } from "./BundleCards";
import { ModeCards } from "./ModeCards";
import { MonthNav } from "./calendar";
import { AudienceField, HostPicker } from "./pickers";
import { ListAdd, ListGroup, ListItem } from "../../ds/ListGroup";
import { ActionMenu } from "../../ds/ActionMenu";
import { DEFAULT_TITLE, fillHost, hostLabel } from "./hosts";

// Said on a slot only when it isn't open to everyone.
const AUDIENCE_TEXT = { [StreamType.Internal]: "Internal", [StreamType.SuperSavvy]: "Super Savvy only" };
// Streams closer than this to a slot's start count as "already scheduled" for that slot.
const CONFLICT_MINUTES = 60;
export const slotTime = (time) => dayjs(`2000-01-01T${time}`).format("h:mm A");

// Weekdays a slot runs on (0 = Sunday, as dayjs counts); a slot without `days` runs every day.
const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];
const EVERY_DAY = [1, 2, 3, 4, 5, 6, 0];
export const slotDays = (slot) => (Array.isArray(slot?.days) && slot.days.length ? slot.days : EVERY_DAY);
/** "Every day", "Weekdays", "Weekends" or the days themselves ("Mon, Wed, Fri"). */
export const daysText = (days) => {
  const set = new Set(days);
  if (set.size === 7) return "Every day";
  if (set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d))) return "Weekdays";
  if (set.size === 2 && set.has(0) && set.has(6)) return "Weekends";
  return WEEKDAYS.filter((d) => set.has(d.value)).map((d) => d.label).join(", ");
};

export function useScheduleSlots() {
  const { data, isLoading } = useList({ resource: "ScheduleSlot", dataProviderName: DP.scheduleSlots, pagination: { mode: "off" } });
  return { slots: data?.data ?? [], isLoading };
}

/**
 * One time slot: when it runs, who hosts and who can join; click to open its fields right below,
 * ⋮ to remove. Every stream it makes is "You vs {host}" with the Default presets.
 */
function SlotRow({ form, index, hosts, expanded, onToggle, onRemove }) {
  const { control } = form;
  const at = (k) => `slots.${index}.${k}`;
  const [time, hostId, days, streamType] = useWatch({ control, name: [at("time"), at("hostId"), at("days"), at("streamType")] });
  const { errors } = useFormState({ control, name: `slots.${index}` });
  const summary = [daysText(slotDays({ days })), hostLabel(hosts.find((h) => h.id === hostId)) || "No host", AUDIENCE_TEXT[streamType]].filter(Boolean).join(" · ");
  return (
    <ListItem
      onClick={onToggle}
      leading={<Icon name="schedule" />}
      title={time ? slotTime(time) : "New time slot"}
      supporting={summary}
      error={errors?.slots?.[index] ? "Some fields need attention" : null}
      trailing={
        <>
          <ActionMenu label="Slot actions" items={[{ label: "Remove slot", icon: "delete", tone: "error", onClick: onRemove }]} />
          {/* A real button (the row opens too), so the chevron does what it looks like. */}
          <Tooltip title={expanded ? "Close" : "Edit"}>
            <IconButton
              aria-label={expanded ? "Close time slot" : "Edit time slot"}
              aria-expanded={expanded}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              <Icon name={expanded ? "expand_less" : "expand_more"} />
            </IconButton>
          </Tooltip>
        </>
      }
      below={expanded && <SlotFields form={form} index={index} hosts={hosts} />}
    />
  );
}

/**
 * Weekdays as separate round buttons (a multi-pick, like an alarm's days): a chosen day is filled
 * blue with a white label, the others are outlined.
 */
function DayButtons({ value, onChange }) {
  const { m3: c, tokens } = useTheme();
  const toggle = (d) => onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d]);
  return (
    <Box role="group" aria-label="Days this slot runs" sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {WEEKDAYS.map((d) => {
        const on = value.includes(d.value);
        return (
          <ButtonBase
            key={d.value}
            onClick={() => toggle(d.value)}
            aria-pressed={on}
            aria-label={d.label}
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              typography: "labelLarge",
              color: on ? c.onPrimary : c.onSurface,
              bgcolor: on ? c.primary : c.ctrl,
              transition: `background-color ${tokens.motion.effects}`,
              "&:hover": { bgcolor: on ? c.primaryHover : c.ctrlHover },
              "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: 2 },
            }}
          >
            {d.label.slice(0, 2)}
          </ButtonBase>
        );
      })}
    </Box>
  );
}

/** A time slot's fields, open under its row: its time, its days, its host and who can join. */
function SlotFields({ form, index, hosts }) {
  const { control } = form;
  const at = (k) => `slots.${index}.${k}`;
  return (
    <>
      <Box sx={{ maxWidth: 160 }}>
        <TextInput
          control={control}
          name={at("time")}
          label="Time"
          type="time"
          rules={{ validate: (v, all) => (!v ? "Pick a time" : all.slots.filter((s) => s.time === v).length > 1 ? "Already used" : true) }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>
      <Controller
        name={at("days")}
        control={control}
        rules={{ validate: (v) => (v == null || v.length > 0 ? true : "Pick at least one day") }}
        render={({ field, fieldState }) => (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <Typography variant="labelLarge" color="text.secondary">
              Days
            </Typography>
            <DayButtons value={field.value ?? EVERY_DAY} onChange={field.onChange} />
            <Typography variant="bodySmall" color={fieldState.error ? "error" : "text.secondary"}>
              {fieldState.error?.message ?? `${daysText(field.value?.length ? field.value : EVERY_DAY)}: Fill month adds this slot on these days.`}
            </Typography>
          </Box>
        )}
      />
      <Controller
        name={at("hostId")}
        control={control}
        rules={{ validate: (v) => (hosts.some((h) => h.id === v) ? true : "Pick a host") }}
        render={({ field, fieldState }) => (
          <HostPicker hosts={hosts} value={hosts.find((h) => h.id === field.value) ?? null} onChange={(h) => field.onChange(h?.id ?? "")} error={!!fieldState.error} helperText={fieldState.error?.message} />
        )}
      />
      {/* Public or Internal, and (for a public one) Super Savvy only: the streams it makes get this. */}
      <Controller name={at("streamType")} control={control} render={({ field }) => <AudienceField value={field.value} onChange={field.onChange} />} />
    </>
  );
}

/**
 * Side sheet with the weekly time slots "Fill month" uses. With `mode`, only that game mode's
 * slots (from Game modes); the others are kept as they are.
 */
export function SlotsSheet({ open, onClose, onBack, instant, slots, hosts, mode }) {
  const notify = useNotify();
  const { control, setValue, getValues, trigger, handleSubmit, reset, formState } = useForm({ defaultValues: { slots: [] } });
  const form = { control, setValue, getValues, trigger };
  // The slot whose fields are open under its row (one at a time).
  // Every slot opens with its fields showing; the ones closed by hand are kept here (by row key).
  const [closed, setClosed] = useState([]);
  const toggle = (key) => setClosed((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]));
  const { fields, append, remove } = useFieldArray({ control, name: "slots", keyName: "key" });
  const { mutateAsync, isPending } = useUpdate();

  useEffect(() => {
    if (open) {
      reset({ slots: mode ? slots.filter((sl) => modeOf(sl).id === mode) : slots });
      setClosed([]);
    }
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A slot with errors opens again, so its fields are in view.
  const save = handleSubmit(async (v) => {
    try {
      await mutateAsync({ resource: "ScheduleSlot", dataProviderName: DP.scheduleSlots, id: "all", values: { slots: mode ? [...slots.filter((sl) => modeOf(sl).id !== mode), ...v.slots] : v.slots }, successNotification: false, errorNotification: false });
      notify("Time slots saved");
      (onBack ?? onClose)();
    } catch {
      notify("Couldn't save the time slots", { variant: "error" });
    }
  }, (errors) => setClosed((c) => c.filter((k) => !fields.some((f, i) => f.key === k && errors.slots?.[i]))));

  const add = () => {
    const i = fields.length;
    append(
      {
      id: "",
      time: "",
      title: DEFAULT_TITLE,
      days: EVERY_DAY,
      streamType: StreamType.Public,
      // The only host there is, else picked on the slot.
      hostId: hosts.length === 1 ? hosts[0].id : "",
      },
      { shouldFocus: false },
    );
  };

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      onBack={onBack}
      dirty={formState.isDirty}
      instant={instant}
      title="Time slots"
      subtitle={mode ? `${modeOf({ gameMode: mode }).label} · changes apply to the next fill` : "Changes apply to the next fill."}
      actions={
        <>
          <Button variant="text" onClick={onBack ?? onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!formState.isDirty || isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <ListGroup label="Time slots">
        {fields.map((f, i) => (
          <SlotRow
            key={f.key}
            form={form}
            index={i}
            hosts={hosts}
            expanded={!closed.includes(f.key)}
            onToggle={() => toggle(f.key)}
            onRemove={() => remove(i)}
          />
        ))}
        <ListAdd label="Add time slot" onClick={add} />
      </ListGroup>
    </SideSheet>
  );
}

/**
 * What filling `month` would do. Each slot gets a stream on its future days unless one already
 * starts within an hour. Words come later, from a word set.
 */
function planMonth({ month, slots, streams, hosts, timezone }) {
  const now = dayjs();
  const active = streams.filter((s) => s.status !== "Canceled");
  const near = (start) => active.some((s) => Math.abs(dayjs(s.startDate).diff(start, "minute")) < CONFLICT_MINUTES);
  const planned = [];
  const skipped = { taken: 0, past: 0, noHost: 0 };
  for (let d = 1; d <= month.daysInMonth(); d += 1) {
    const date = `${month.format("YYYY-MM")}-${String(d).padStart(2, "0")}`;
    slots.forEach((slot) => {
      const start = dayjs.tz(`${date}T${slot.time}`, timezone);
      // A slot runs only on its own weekdays.
      if (!slotDays(slot).includes(start.day())) return;
      if (start.isBefore(now)) skipped.past += 1;
      else if (near(start)) skipped.taken += 1;
      else if (!hosts.some((h) => h.id === slot.hostId)) skipped.noHost += 1;
      else planned.push({ slot, start });
    });
  }
  return { planned, skipped };
}

/** Preview of a month's new streams; adding them is one request. */
export function FillMonthDialog({ open, onClose, instant, initialMonth, slots, streams, hosts, timezone, onFilled, onEditSlots, mode }) {
  const { m3: c, tokens } = useTheme();
  const notify = useNotify();
  const invalidate = useInvalidate();
  const build = useStreamBuilder();
  // The bundle every stream of this fill starts with (the first one until another is picked).
  const { bundles } = useBundles();
  const [pickedBundle, setPickedBundle] = useState(null);
  const bundleId = bundles.some((b) => b.id === pickedBundle) ? pickedBundle : bundles[0]?.id ?? null;
  // The format every stream of this fill gets; none picked leaves it to each stream.
  const [gameMode, setGameMode] = useState(null);
  const { mutateAsync, isPending } = useCustomMutation();
  const [month, setMonth] = useState(initialMonth);
  // Slots left out of this fill (switched off in the list); all are in when the dialog opens.
  const [offSlots, setOffSlots] = useState([]);

  useEffect(() => {
    if (!open) return;
    const current = dayjs().tz(timezone).startOf("month");
    setMonth(initialMonth.isBefore(current) ? current : initialMonth);
    setOffSlots([]);
    setGameMode(null);
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { planned, skipped } = useMemo(() => planMonth({ month, slots: slots.filter((s) => !offSlots.includes(s.id)), streams, hosts, timezone }), [month, slots, offSlots, streams, hosts, timezone]);
  const hostName = (id) => hostLabel(hosts.find((h) => h.id === id)) || null;

  const create = async () => {
    const payload = planned.map(({ slot, start }) => {
      const host = hosts.find((h) => h.id === slot.hostId);
      // Built like every new stream (its bundle + the Default presets); words come later, from a word set.
      return build({ title: DEFAULT_TITLE, host, startDate: start.utc().toISOString(), bundleId, gameMode, streamType: slot.streamType });
    });
    try {
      await mutateAsync({ url: "/TextSavvyStream/bulk", method: "post", values: { streams: payload, assignments: [] }, successNotification: false, errorNotification: false });
      invalidate({ resource: "TextSavvyStream", invalidates: ["list"] });
      notify(`${payload.length} ${payload.length === 1 ? "stream" : "streams"} added to ${month.format("MMMM")}`);
      onFilled?.(month);
      onClose();
    } catch (e) {
      notify(e?.response?.data?.detail ?? "Couldn't add the streams", { variant: "error" });
    }
  };

  const skippedText = [
    skipped.taken && `${skipped.taken} ${skipped.taken === 1 ? "time already has" : "times already have"} a stream within an hour`,
    skipped.past && `${skipped.past} ${skipped.past === 1 ? "time is" : "times are"} already past`,
    skipped.noHost && `${skipped.noHost} ${skipped.noHost === 1 ? "time has" : "times have"} no host`,
  ].filter(Boolean);
  const nothing = !planned.length;

  return (
    // A side sheet, like Time slots: it opens over the page and swaps to Time slots in place.
    <SideSheet
      open={open}
      onClose={onClose}
      instant={instant}
      title={mode ? `Fill month · ${modeOf({ gameMode: mode }).label}` : "Fill month"}
      subtitle="Adds a stream for each time slot this month."
      footerStart={
        onEditSlots && (
          <Button variant="text" startIcon={<Icon name="edit" />} onClick={onEditSlots}>
            Edit time slots
          </Button>
        )
      }
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={create} disabled={nothing || isPending || !slots.length} startIcon={<Icon name="auto_awesome" />}>
            {isPending ? "Adding…" : planned.length ? `Add ${planned.length} ${planned.length === 1 ? "stream" : "streams"}` : "Nothing to add"}
          </Button>
        </>
      }
    >
        <MonthNav
          month={month}
          onChange={(m) => setMonth(m.isBefore(dayjs().tz(timezone).startOf("month")) ? month : m)}
          timezone={timezone}
        />
        {slots.length === 0 ? (
          <Typography variant="bodyMedium" color="text.secondary">
            Add a time slot first.
          </Typography>
        ) : (
          <>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="overline" color="text.secondary" component="div">
                Bundle
              </Typography>
              <BundleCards value={bundleId} onChange={setPickedBundle} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="overline" color="text.secondary" component="div">
                How to play & format
              </Typography>
              <ModeCards value={gameMode} onChange={setGameMode} />
            </Box>
            <Box sx={{ borderRadius: `${tokens.shape.md}px`, bgcolor: c.surfaceContainer, overflow: "hidden" }}>
              {slots.map((slot) => {
                const mine = planned.filter((p) => p.slot.id === slot.id);
                const on = !offSlots.includes(slot.id);
                return (
                  <Box key={slot.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.25, "&:not(:last-of-type)": { borderBottom: `1px solid ${c.outlineVariant}` } }}>
                    {/* Switch a slot off to leave it out of this fill. */}
                    <Switch checked={on} onChange={(e) => setOffSlots((o) => (e.target.checked ? o.filter((x) => x !== slot.id) : [...o, slot.id]))} slotProps={{ input: { "aria-label": `Fill ${slotTime(slot.time)}` } }} />
                    <Typography variant="labelLarge" sx={{ width: 64, flexShrink: 0, opacity: on ? 1 : 0.5 }}>
                      {slotTime(slot.time)}
                    </Typography>
                    <Box sx={{ flex: 1, minWidth: 0, opacity: on ? 1 : 0.5 }}>
                      <Typography variant="bodyMedium" noWrap>
                        {fillHost(DEFAULT_TITLE, hostName(slot.hostId))}
                      </Typography>
                      <Typography variant="bodySmall" color={hostName(slot.hostId) ? "text.secondary" : "error"} noWrap component="div">
                        {daysText(slotDays(slot))} · {hostName(slot.hostId) ?? "No host"}
                        {AUDIENCE_TEXT[slot.streamType] && ` · ${AUDIENCE_TEXT[slot.streamType]}`}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", flexShrink: 0, opacity: on ? 1 : 0.5 }}>
                      <Typography variant="labelLarge" component="div">
                        {on ? mine.length : "Off"}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            {skippedText.length > 0 && (
              <Typography variant="bodySmall" color="text.secondary">
                Skipped: {skippedText.join(", ")}.
              </Typography>
            )}
            <Banner icon="hide_image">{`Streams show in the app right away; their logo shows once they have a format and their words. Times are in ${timezone.replace(/_/g, " ")}.`}</Banner>
          </>
        )}
    </SideSheet>
  );
}

