// Streams › Schedule — month and week calendars. Streams in them are the same StreamItem the other views use.
import { useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { dayjs } from "../../contexts";
import { StreamItem, logoHidden, useStreamSurface } from "./parts";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayKey = (d) => d.format("YYYY-MM-DD");

/** Small sample of a stream surface: its fill, with its strong colour as a dot so it shows on the page. */
function Swatch({ bg, dot }) {
  const { tokens } = useTheme();
  return (
    <Box component="span" sx={{ width: 20, height: 14, borderRadius: `${tokens.shape.xs}px`, bgcolor: bg, flexShrink: 0, display: "grid", placeItems: "center" }}>
      <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: dot }} />
    </Box>
  );
}


/** What the calendar's colours mean (cards and list rows are neutral and use badges instead). */
export function StreamLegend() {
  const { m3: c, palette } = useTheme();
  // The same fills as the calendar's streams (useStreamSurface).
  const items = [
    { label: "Scheduled", bg: c.primaryContainer, dot: c.primary },
    { label: "Needs setup", bg: palette.warning.container, dot: palette.warning.color },
    { label: "Live", bg: c.errorContainer, dot: c.error },
    { label: "Ended", bg: c.surface3, dot: c.outline },
  ];
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 2.5, rowGap: 1, typography: "labelMedium", color: "text.secondary" }}>
      {items.map((i) => (
        <Box key={i.label} component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
          <Swatch bg={i.bg} dot={i.dot} />
          {i.label}
        </Box>
      ))}
    </Box>
  );
}

/**
 * Month grid (weeks start on Sunday, like the agenda). On wide screens each day lists all its
 * streams; on phones a day shows dots and selecting it lists that day's streams underneath.
 */
export function MonthCalendar({ month, streams, timezone, onCreate, selected, onSelect, onAction }) {
  const { m3: c, tokens } = useTheme();
  const compact = useMediaQuery((t) => t.breakpoints.down("md"));
  const surfaceOf = useStreamSurface(true);
  // Grid dates are plain calendar dates (UTC midnight) so DST changes can't shift a day.
  const todayKey = dayKey(dayjs().tz(timezone));
  const selectedKey = selected ? dayKey(selected) : null;

  const byDay = useMemo(() => {
    const map = {};
    streams.forEach((s) => (map[dayKey(dayjs.utc(s.startDate).tz(timezone))] ??= []).push(s));
    Object.values(map).forEach((list) => list.sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate)));
    return map;
  }, [streams, timezone]);

  const monthStart = dayjs.utc(`${month.format("YYYY-MM")}-01`);
  const first = monthStart.subtract(monthStart.day(), "day");
  const weeks = Math.ceil((monthStart.day() + monthStart.daysInMonth()) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => first.add(i, "day"));

  return (
    // Days are separate surfaces 4px apart (tone, not grid lines); days outside the month are the
    // workspace showing through.
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {WEEKDAYS.map((d) => (
          <Typography key={d} variant="labelMedium" color="text.secondary" sx={{ py: 1, textAlign: "center", textTransform: "uppercase" }}>
            {compact ? d[0] : d}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gridAutoRows: { xs: "64px", md: "minmax(132px, auto)" }, gap: 0.5 }}>
        {days.map((day, i) => {
          const key = dayKey(day);
          const items = byDay[key] ?? [];
          const inMonth = day.month() === monthStart.month();
          const isToday = key === todayKey;
          const canCreate = key >= todayKey;
          const isSelected = compact && key === selectedKey;
          const border = { borderRadius: `${tokens.shape.sm}px` };
          const number = (
            <Box
              component="span"
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                typography: "labelLarge",
                bgcolor: isToday ? c.primary : isSelected ? c.secondaryContainer : "transparent",
                color: isToday ? c.onPrimary : isSelected ? c.onSecondaryContainer : inMonth ? c.onSurface : c.outline,
              }}
            >
              {day.date()}
            </Box>
          );

          if (compact) {
            return (
              <ButtonBase
                key={key}
                onClick={() => onSelect(day)}
                aria-label={`${day.format("dddd, MMMM D")}: ${items.length} ${items.length === 1 ? "stream" : "streams"}`}
                aria-pressed={!!isSelected}
                sx={{ ...border, flexDirection: "column", justifyContent: "flex-start", gap: 0.5, pt: 0.75, bgcolor: inMonth ? c.surfaceCard : "transparent" }}
              >
                {number}
                <Box sx={{ display: "flex", gap: "3px", flexWrap: "wrap", justifyContent: "center", px: 0.5 }}>
                  {items.slice(0, 4).map((s) => {
                    const draft = logoHidden(s);
                    return <Box key={s.id} sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: surfaceOf(s).dot }} />;
                  })}
                </Box>
              </ButtonBase>
            );
          }

          return (
            <Box
              key={key}
              onClick={canCreate ? () => onCreate(day) : undefined}
              sx={{
                ...border,
                p: 0.75,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                minWidth: 0,
                cursor: canCreate ? "pointer" : "default",
                bgcolor: inMonth ? c.surfaceCard : "transparent",
                "&:hover .add-stream, & .add-stream.Mui-focusVisible": { opacity: 1 },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 28 }}>
                {number}
                {canCreate && (
                  <Tooltip title={`New stream on ${day.format("MMM D")}`}>
                    <IconButton
                      className="add-stream"
                      size="small"
                      aria-label={`New stream on ${day.format("MMMM D")}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreate(day);
                      }}
                      sx={{ width: 28, height: 28, opacity: 0, transition: `opacity ${tokens.motion.effects}` }}
                    >
                      <Icon name="add" size={18} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {items.map((s) => (
                <StreamItem key={s.id} stream={s} variant="compact" onAction={onAction} />
              ))}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/**
 * Week grid: one column per day (Sunday first, like the month), each listing its streams. Phones
 * get the same days stacked, each with its streams as rows.
 */
export function WeekCalendar({ week, streams, timezone, onCreate, onAction }) {
  const { m3: c, tokens } = useTheme();
  const compact = useMediaQuery((t) => t.breakpoints.down("md"));
  const todayKey = dayKey(dayjs().tz(timezone));
  const byDay = useMemo(() => {
    const map = {};
    streams.forEach((s) => (map[dayKey(dayjs.utc(s.startDate).tz(timezone))] ??= []).push(s));
    Object.values(map).forEach((list) => list.sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate)));
    return map;
  }, [streams, timezone]);
  const start = dayjs.utc(week.format("YYYY-MM-DD"));
  const days = Array.from({ length: 7 }, (_, i) => start.add(i, "day"));

  const dayHeader = (day, key) => {
    const isToday = key === todayKey;
    return (
      // Fits a narrow week column: 24px date circle and add button, 4px apart, none of them shrinking.
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
        <Typography variant="labelMedium" sx={{ textTransform: "uppercase", flexShrink: 0, color: isToday ? c.primaryText : c.onSurfaceVariant }}>
          {day.format("ddd")}
        </Typography>
        <Box sx={{ width: 24, height: 24, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", typography: "labelLarge", bgcolor: isToday ? c.primaryText : "transparent", color: isToday ? c.onPrimary : c.onSurface }}>{day.date()}</Box>
        <Box sx={{ flex: 1 }} />
        {key >= todayKey && (
          <Tooltip title={`New stream on ${day.format("MMM D")}`}>
            <IconButton size="small" aria-label={`New stream on ${day.format("MMMM D")}`} onClick={() => onCreate(day)} sx={{ width: 24, height: 24, p: 0.5, flexShrink: 0 }}>
              <Icon name="add" size={16} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  if (compact) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {days.map((day) => {
          const key = dayKey(day);
          const items = byDay[key] ?? [];
          return (
            <Box key={key} component="section" aria-label={day.format("dddd, MMMM D")} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {dayHeader(day, key)}
              {items.length ? items.map((s) => <StreamItem key={s.id} stream={s} variant="row" onAction={onAction} />) : <Typography variant="bodySmall" color="text.secondary">No streams</Typography>}
            </Box>
          );
        })}
      </Box>
    );
  }

  return (
    // Like the month: each day its own surface, 4px apart, no lines.
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 0.5 }}>
      {days.map((day, i) => {
        const key = dayKey(day);
        const items = byDay[key] ?? [];
        return (
          <Box key={key} component="section" aria-label={day.format("dddd, MMMM D")} sx={{ minWidth: 0, minHeight: 480, borderRadius: `${tokens.shape.sm}px`, overflow: "hidden", bgcolor: c.surfaceCard, display: "flex", flexDirection: "column" }}>
            <Box sx={{ px: 1, py: 0.75 }}>{dayHeader(day, key)}</Box>
            <Box sx={{ p: 0.75, display: "flex", flexDirection: "column", gap: 0.75 }}>
              {items.map((s) => (
                <StreamItem key={s.id} stream={s} variant="compact" onAction={onAction} />
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/** Previous / next / today for the calendar; `label` names the month or week shown. */
export function PeriodNav({ label, onPrev, onNext, onToday, prevLabel, nextLabel }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Tooltip title={prevLabel}>
        <IconButton aria-label={prevLabel} onClick={onPrev}>
          <Icon name="chevron_left" />
        </IconButton>
      </Tooltip>
      <Tooltip title={nextLabel}>
        <IconButton aria-label={nextLabel} onClick={onNext}>
          <Icon name="chevron_right" />
        </IconButton>
      </Tooltip>
      <Typography variant="titleLarge" component="h2" sx={{ mx: 1, minWidth: 0 }}>
        {label}
      </Typography>
      {onToday && (
        <Button variant="outlined" size="small" onClick={onToday}>
          Today
        </Button>
      )}
    </Box>
  );
}

/** Month title with previous / next / today. */
export function MonthNav({ month, onChange, timezone }) {
  const current = dayjs().tz(timezone).startOf("month");
  return (
    <PeriodNav
      label={month.format("MMMM YYYY")}
      prevLabel="Previous month"
      nextLabel="Next month"
      onPrev={() => onChange(month.subtract(1, "month"))}
      onNext={() => onChange(month.add(1, "month"))}
      onToday={month.format("YYYY-MM") !== current.format("YYYY-MM") ? () => onChange(current) : null}
    />
  );
}

/** "Oct 25 – 31, 2026" style label and navigation for a week starting on Sunday (`week` is a UTC date). */
export function WeekNav({ week, onChange, timezone }) {
  const today = dayjs().tz(timezone);
  const current = dayjs.utc(today.format("YYYY-MM-DD")).subtract(today.day(), "day");
  const start = dayjs.utc(week.format("YYYY-MM-DD"));
  const end = start.add(6, "day");
  const label = `${start.format("MMM D")} – ${end.format(end.month() === start.month() ? "D" : "MMM D")}, ${end.year()}`;
  return (
    <PeriodNav
      label={label}
      prevLabel="Previous week"
      nextLabel="Next week"
      onPrev={() => onChange(week.subtract(7, "day"))}
      onNext={() => onChange(week.add(7, "day"))}
      onToday={week.format("YYYY-MM-DD") !== current.format("YYYY-MM-DD") ? () => onChange(current) : null}
    />
  );
}
