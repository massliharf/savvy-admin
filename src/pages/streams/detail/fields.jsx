// Controlled form inputs used by the stream detail page (react-hook-form + M3 components).
import { Controller, useWatch } from "react-hook-form";
import Box from "@mui/material/Box";
import FormHelperText from "@mui/material/FormHelperText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { Icon } from "../../../ds/Icon";
import { ListSwitch } from "../../../ds/ListGroup";
import { dayjs, useTimezone } from "../../../contexts";
import { isPowerup, richLen } from "../enums";
import { FieldHelper } from "../../../ds/FieldHelper";
import { ChoiceGroup, SelectButton } from "../../../ds/SelectButton";
import { NumberCell, SelectCell } from "../../../ds/EditTable";

export const REWARD_LABELS = {
  Sparks: "Sparks",
  Cash: "Cash",
  BombPowerup: "Letter Bomb",
  BetterBombPowerup: "Better Bomb",
  GreeniePowerup: "Greenie",
  HintPowerup: "Magniflyer",
};

/** A reward in a few words: "$5", "10 Sparks", "1 Letter Bomb". */
export const rewardText = (r) => (!r?.rewardType ? "" : r.rewardType === "Cash" ? `$${r.amount ?? 0}` : `${r.amount ?? 0} ${REWARD_LABELS[r.rewardType] ?? r.rewardType}`);

/** Text field bound to the form. `max` adds a rich-text-aware character counter. */
export function TextInput({ control, name, rules, max, helperText, ...props }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const length = richLen(field.value ?? "");
        const counter = max != null ? `${length} / ${max}` : null;
        const message = fieldState.error?.message;
        return (
          <TextField
            {...props}
            name={field.name}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={!!message}
            helperText={<FieldHelper text={message ?? helperText} counter={counter} over={max != null && length > max} />}
          />
        );
      }}
    />
  );
}

/** Number field; empty input is stored as `null`. */
export function NumberInput({ control, name, rules, suffix, inputProps, helperText, ...props }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          type="number"
          name={field.name}
          value={field.value ?? ""}
          onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
          onBlur={field.onBlur}
          inputRef={field.ref}
          error={!!fieldState.error}
          helperText={fieldState.error?.message ?? helperText}
          slotProps={{
            ...props.slotProps,
            input: suffix ? { endAdornment: <Typography variant="bodyMedium" color="text.secondary" sx={{ ml: 1 }}>{suffix}</Typography> } : props.slotProps?.input,
            htmlInput: { min: 0, ...props.slotProps?.htmlInput, ...inputProps },
          }}
        />
      )}
    />
  );
}

/** A choice bound to the form: a button that opens a menu (see SelectButton). */
export function SelectInput({ control, name, rules, options, label, helperText, error, sx, size, disabled, "aria-label": ariaLabel }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <SelectButton label={label} aria-label={ariaLabel} value={field.value ?? ""} options={options} onChange={field.onChange} error={fieldState.error?.message ?? (error ? helperText : undefined)} helperText={error ? undefined : helperText} sx={sx} size={size} disabled={disabled} />
      )}
    />
  );
}

/** A choice among a few options bound to the form: a connected button group. */
export function ChoiceInput({ control, name, rules, options, label, helperText, sx, disabled }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => <ChoiceGroup label={label} value={field.value} options={options} onChange={field.onChange} error={fieldState.error?.message} helperText={helperText} sx={sx} disabled={disabled} />}
    />
  );
}

/** A toggle bound to the form as a list row (put it in a ListGroup with its siblings). */
export function SwitchListInput({ control, name, icon, title, supporting, disabled }) {
  return <Controller name={name} control={control} render={({ field }) => <ListSwitch icon={icon} title={title} supporting={supporting} checked={!!field.value} disabled={disabled} onChange={field.onChange} />} />;
}



/**
 * A reward in an EditTable cell: its amount in a fixed-width slot, then its type ("5 Sparks ▾"),
 * so the types line up from row to row. `onClear`, when given,
 * adds "No reward" to the type menu.
 */
export function RewardCell({ control, name, allowed, label = "Reward", labels = REWARD_LABELS, onClear }) {
  const value = useWatch({ control, name });
  const powerup = isPowerup(value?.rewardType);
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, width: "100%", minWidth: 0 }}>
      <NumberCell
        control={control}
        name={`${name}.amount`}
        label={`${label} amount`}
        align="left"
        sx={{ width: 56, flexShrink: 0 }}
        rules={{
          validate: (v) => {
            if (v == null || Number.isNaN(v)) return "Enter an amount";
            if (v < 1) return "At least 1";
            if (powerup && !Number.isInteger(v)) return "Whole number";
            return true;
          },
        }}
      />
      <SelectCell control={control} name={`${name}.rewardType`} label={`${label} type`} options={allowed.map((t) => ({ value: t, label: labels[t] ?? t }))} extra={onClear ? [{ label: "No reward", onClick: onClear }] : undefined} sx={{ flex: 1, minWidth: 0 }} />
    </Box>
  );
}

/**
 * Date + time pickers bound to one UTC ISO string, edited in the admin's time zone.
 * `rules` are react-hook-form rules for the ISO value.
 */
export function DateTimeInput({ control, name, rules, dateLabel = "Date", timeLabel = "Time", clearable, showZone = true }) {
  const { timezone } = useTimezone();
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const value = field.value ? dayjs.utc(field.value).tz(timezone) : null;
        const set = (date, time) => {
          if (date === null && clearable) {
            field.onChange(null);
            return;
          }
          if (!date?.isValid() || !time?.isValid()) return;
          field.onChange(dayjs.tz(`${date.format("YYYY-MM-DD")}T${time.format("HH:mm")}`, timezone).utc().toISOString());
        };
        const fallback = value ?? dayjs().tz(timezone).hour(19).minute(0);
        return (
          <Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <DatePicker
                label={dateLabel}
                value={value}
                timezone={timezone}
                onChange={(d) => set(d, fallback)}
                slots={{ openPickerIcon: () => <Icon name="calendar_today" /> }}
                slotProps={{ textField: { error: !!fieldState.error, sx: { flex: 3 }, onBlur: field.onBlur }, field: { clearable } }}
              />
              <TimePicker
                label={timeLabel}
                value={value}
                timezone={timezone}
                onChange={(t) => set(value ?? fallback, t)}
                slots={{ openPickerIcon: () => <Icon name="schedule" /> }}
                slotProps={{ textField: { error: !!fieldState.error, sx: { flex: 2 } } }}
              />
            </Box>
            {/* A pair of pickers (start, end) shows the zone once, under the last one. */}
            {(fieldState.error || showZone) && (
              <FormHelperText error={!!fieldState.error}>
                {fieldState.error?.message ?? `Time zone: ${timezone.replace(/_/g, " ")}`}
              </FormHelperText>
            )}
          </Box>
        );
      }}
    />
  );
}
