import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Icon } from "./Icon";
import { ActionMenu } from "./ActionMenu";

// Content widths: lists and boards use the full pane; forms and settings are capped for line length.
export const FORM_WIDTH = 880;

/**
 * The top row of every list page, always laid out the same way: the search (or an intro line) and
 * the page's view and filter controls on the left; on the right the secondary actions as outlined buttons of one size, then the one
 * "New …" page action (Savvy Admin's inverted secondary button). More than two secondary actions fold into a ⋮ menu; on phones
 * they shrink to icon buttons on tablets and phones. `secondary` items are { label, icon, onClick, disabled }.
 */
export function PageToolbar({ search, description, secondary = [], actionLabel, onAction, actionIcon = "add", children }) {
  // Below desktop width the secondary actions are icon buttons (label in the tooltip).
  const phone = useMediaQuery((t) => t.breakpoints.down("md"));
  const inline = secondary.length <= 2 ? secondary : [];
  const folded = secondary.length > 2 ? secondary : [];
  return (
    // Two zones: search and filters on the left (they wrap within their zone when space runs out),
    // the page actions on the right, always on the first line.
    // When even that doesn't fit, the actions move to their own line (still on the right), so
    // nothing ever overlaps.
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 1.5 }}>
      <Box sx={{ flex: "1 1 240px", minWidth: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
        {search}
        {description && (
          <Typography variant="bodyMedium" color="text.secondary" sx={{ flex: "1 1 280px" }}>
            {description}
          </Typography>
        )}
        {children}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0, ml: "auto" }}>
        {inline.map((a) =>
          phone ? (
            <Tooltip key={a.label} title={a.label}>
              <span>
                <IconButton aria-label={a.label} onClick={a.onClick} disabled={a.disabled} sx={(t) => ({ bgcolor: t.m3.ctrl, boxShadow: `inset 0 0 0 1px ${t.m3.ctrlBorder}`, "&:hover": { bgcolor: t.m3.ctrlHover } })}>
                  <Icon name={a.icon} />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Button key={a.label} variant="tonal" startIcon={a.icon && <Icon name={a.icon} />} onClick={a.onClick} disabled={a.disabled}>
              {a.label}
            </Button>
          ),
        )}
        {folded.length > 0 && <ActionMenu label="More actions" items={folded.map((a) => ({ label: a.label, icon: a.icon, onClick: a.onClick }))} />}
        {actionLabel && (
          // Savvy Admin's page action ("+ New space"): the inverted secondary button.
          <Button color="secondary" startIcon={<Icon name={actionIcon} />} onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
}
