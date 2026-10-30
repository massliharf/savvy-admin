import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { Icon } from "./Icon";

const ALL = "__all";

/**
 * Which slice of a list is shown — always exactly one, usually starting with All — as a
 * segmented control in the page toolbar (Upcoming / Past, Ready / Scheduled / Used, an order's or
 * account's status). Optional, combinable narrowing (region, game mode, dates) is a menu chip in
 * the same toolbar instead. `value` null means All when `all` is set; `count(value)` adds "· n".
 */
export function ScopeToggle({ label, value, options, onChange, all = "All", count }) {
  const items = [...(all ? [{ value: null, label: all }] : []), ...options];
  const text = (o) => (count ? `${o.label} · ${count(o.value)}` : o.label);
  return (
    // On a narrow screen a long set scrolls sideways inside itself instead of widening the page.
    <ToggleButtonGroup exclusive value={value ?? ALL} onChange={(_, v) => v != null && onChange(v === ALL ? null : v)} aria-label={label} sx={{ maxWidth: "100%", overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" }, "& .MuiToggleButton-root": { flexShrink: 0, whiteSpace: "nowrap" } }}>
      {items.map((o) => (
        <ToggleButton key={String(o.value ?? ALL)} value={o.value ?? ALL} sx={o.icon ? { gap: 0.75 } : undefined}>
          {o.icon && <Icon name={o.icon} size={18} />}
          {text(o)}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
