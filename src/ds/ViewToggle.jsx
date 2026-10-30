import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import { Icon } from "./Icon";

export const CARDS_LIST = [
  { id: "cards", label: "Cards", icon: "grid_view" },
  { id: "list", label: "List", icon: "view_agenda" },
];

/** How a list page lays out its items (cards, list, calendar…): icon-only segments with tooltips. */
export function ViewToggle({ value, onChange, views = CARDS_LIST }) {
  return (
    <ToggleButtonGroup exclusive value={value} onChange={(_, v) => v && onChange(v)} aria-label="View">
      {views.map((v) => (
        <Tooltip key={v.id} title={v.label}>
          <ToggleButton value={v.id} aria-label={`${v.label} view`} sx={{ px: 1.5 }}>
            <Icon name={v.icon} size={16} />
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
}
