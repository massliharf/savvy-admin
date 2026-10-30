import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "./Icon";
import { IconTile } from "./IconTile";
import { ContainerCard } from "./ContainerCard";
import { Pill } from "./Pill";

/** What a section still needs, by its title: missing parts or errors. Done shows only in the side nav. */
function StatusPill({ status }) {
  if (!status) return null;
  if (status.state === "error") return <Pill tone="error" leading={<Icon name="error" size={14} />}>Fix errors</Pill>;
  if (status.state === "todo") return <Pill tone="warning" leading={<Icon name="warning" size={14} />}>{status.todo.length > 1 ? `${status.todo[0]} · +${status.todo.length - 1}` : status.todo[0]}</Pill>;
  return null;
}

/**
 * A titled card that groups related fields. `id` is used as a scroll anchor. `status` ({ state,
 * summary, todo }) puts its summary under the title and a missing / errors pill by it. `collapsible` sections fold
 * to their title, pill and a one-line `status.summary`; `open` and `onToggle` control that.
 */
export function FormSection({ id, title, description, action, status, collapsible, open = true, onToggle, children }) {
  const { m3: c } = useTheme();
  const folded = collapsible && !open;
  const heading = (
    <Box sx={{ flex: "1 1 280px", minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="titleMedium" component="h2">
          {title}
        </Typography>
        <StatusPill status={status} />
      </Box>
      {/* The summary sits under the title, open or folded; the description adds to it when open. */}
      {status?.summary && (
        <Typography variant="bodySmall" color="text.secondary" noWrap={folded} sx={{ mt: 0.25 }}>
          {status.summary}
        </Typography>
      )}
      {!folded && description && (
        <Typography variant="bodySmall" color="text.secondary" sx={{ mt: 0.25 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
  return (
    <ContainerCard component="section" id={id} sx={{ p: { xs: 2, sm: 3 }, scrollMarginTop: 96 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", columnGap: 2, rowGap: 1.5, mb: folded ? 0 : 2 }}>
        {collapsible ? (
          // The whole title line opens and closes the section.
          <ButtonBase
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={`${id}-body`}
            sx={{ flex: "1 1 280px", minWidth: 0, display: "flex", alignItems: "center", gap: 2, textAlign: "left", borderRadius: 2, m: -1, p: 1, "&:hover .fold-chevron": { color: c.onSurface }, "&.Mui-focusVisible": { outline: `2px solid ${c.focus}` } }}
          >
            {heading}
            <Icon name={open ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={20} className="fold-chevron" style={{ color: c.onSurfaceVariant, flexShrink: 0 }} />
          </ButtonBase>
        ) : (
          heading
        )}
        {!folded && action}
      </Box>
      {!folded && (
        <Box id={`${id}-body`} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {children}
        </Box>
      )}
    </ContainerCard>
  );
}

/**
 * Rows inside a section (subsections and add rows) are separated by a hairline, never boxed:
 * one container level.
 */
export const dividedRow = (c) => ({ "&:not(:first-of-type)": { borderTop: `1px solid ${c.border}`, pt: 2 } });

/** Titled subsection of a section, set off by a divider. Optional `onRemove` shows a remove button. */
export function FieldGroup({ title, description, onRemove, removeLabel = "Remove", children }) {
  const { m3: c } = useTheme();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, ...dividedRow(c) }}>
      {(title || onRemove) && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: -0.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {title && (
              <Typography variant="titleSmall" component="h3">
                {title}
              </Typography>
            )}
            {description && (
              <Typography variant="bodySmall" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
          {onRemove && (
            <Tooltip title={removeLabel}>
              <IconButton aria-label={removeLabel} onClick={onRemove} sx={{ my: -0.5, mr: -0.5 }}>
                <Icon name="close" size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
      {children}
    </Box>
  );
}

/** List item that adds an optional subsection (sponsorship, raffle, …); divided like one. */
export function AddTile({ icon, title, description, onClick }) {
  const { m3: c, tokens } = useTheme();
  return (
    <Box sx={dividedRow(c)}>
      <ButtonBase
        onClick={onClick}
        sx={{
          width: "calc(100% + 16px)",
          mx: -1,
          px: 1,
          py: 1,
          justifyContent: "flex-start",
          textAlign: "left",
          gap: 1.5,
          borderRadius: `${tokens.shape.sm}px`,
          color: c.onSurface,
          transition: `background-color ${tokens.motion.effects}`,
          "&:hover": { bgcolor: "action.hover" },
          "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: -2 },
        }}
      >
      <IconTile icon={icon} size={32} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="titleSmall" component="div">
          {title}
        </Typography>
        {description && (
          <Typography variant="bodySmall" color="text.secondary" component="div">
            {description}
          </Typography>
        )}
      </Box>
      <Icon name="add" size={16} style={{ color: c.onSurface }} />
      </ButtonBase>
    </Box>
  );
}
