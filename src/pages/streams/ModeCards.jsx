import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { GAME_MODES, useGameModePresets } from "./gameModes";
import { ModeLogo } from "./ModeLogo";

/**
 * Game mode as selectable cards (logo, name and what it plays). The game mode
 * picker on a stream's Game mode section. `onSettings` adds a settings
 * button to each card (Game modes page), which opens that mode's page.
 */
export function ModeCards({ value, onChange, onSettings }) {
  const theme = useTheme();
  const { presets } = useGameModePresets();
  return (
    <Box role="radiogroup" aria-label="How to play & format" sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 1 }}>
      {Object.values(GAME_MODES).map((m) => {
        const on = m.id === value;
        const name = presets[m.id]?.name ?? m.label;
        return (
          <Box
            key={m.id}
            sx={{
              display: "flex",
              alignItems: "center",
              borderRadius: `${theme.tokens.shape.md}px`,
              bgcolor: theme.m3.surfaceCard,
              boxShadow: on ? `inset 0 0 0 2px ${theme.m3.primary}` : "none",
              transition: `background-color ${theme.tokens.motion.effects}`,
              "&:has(> .mode-pick:hover)": { bgcolor: theme.m3.hover },
            }}
          >
          <ButtonBase
            className="mode-pick"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(m.id)}
            sx={{
              flex: 1,
              minWidth: 0,
              p: 1.5,
              gap: 1.5,
              justifyContent: "flex-start",
              textAlign: "left",
              borderRadius: `${theme.tokens.shape.md}px`,
              "&.Mui-focusVisible": { outline: `2px solid ${theme.m3.focus}`, outlineOffset: 2 },
            }}
          >
            <ModeLogo mode={m.id} width={64} height={40} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="titleSmall" component="div" noWrap>
                {name}
              </Typography>
              <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
                {presets[m.id]?.summary ?? m.summary}
              </Typography>
            </Box>
            {on && <Icon name="check_circle" fill size={20} style={{ color: theme.m3.primary }} />}
          </ButtonBase>
          {onSettings && (
            <Tooltip title={`${name} settings`}>
              <IconButton aria-label={`${name} settings`} onClick={() => onSettings(m.id)} sx={{ mr: 1, flexShrink: 0 }}>
                <Icon name="settings" size={20} />
              </IconButton>
            </Tooltip>
          )}
          </Box>
        );
      })}
    </Box>
  );
}
