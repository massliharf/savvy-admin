import { useList } from "@refinedev/core";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { DP } from "../../providers";
import { GAME_MODES, useGameModePresets } from "./gameModes";
import { hostLabel, useHosts } from "./hosts";
import { ModeLogo } from "./ModeLogo";

/**
 * Game mode as selectable cards (logo, name and its defaults: host · sponsor). The one game mode
 * picker: New stream, a stream's Game mode section and time slots. `onAdd` ends the list with a
 * "New game mode" card (Game modes page).
 */
export function ModeCards({ value, onChange, onAdd }) {
  const theme = useTheme();
  const { presets } = useGameModePresets();
  const hosts = useHosts();
  const { data: sponsorData } = useList({ resource: "Sponsor", dataProviderName: DP.sponsors, pagination: { mode: "off" } });
  // A game mode's defaults in a line: who hosts, who sponsors.
  const defaultsOf = (id) => {
    const p = presets[id];
    const h = hosts.find((x) => x.id === p?.defaultHostId);
    const sp = sponsorData?.data?.find((x) => x.id === p?.defaultSponsorId);
    return [h ? hostLabel(h) : "No default host", sp ? sp.name : "No sponsor"].join(" · ");
  };
  return (
    <Box role="radiogroup" aria-label="Game mode" sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 1 }}>
      {Object.values(GAME_MODES).map((m) => {
        const on = m.id === value;
        return (
          <ButtonBase
            key={m.id}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(m.id)}
            sx={{
              p: 1.5,
              gap: 1.5,
              justifyContent: "flex-start",
              textAlign: "left",
              borderRadius: `${theme.tokens.shape.md}px`,
              bgcolor: theme.m3.surfaceContainerHigh,
              boxShadow: on ? `inset 0 0 0 2px ${theme.m3.primary}` : "none",
              transition: `background-color ${theme.tokens.motion.effects}`,
              "&:hover": { bgcolor: theme.m3.hover },
              "&.Mui-focusVisible": { outline: `2px solid ${theme.m3.focus}`, outlineOffset: 2 },
            }}
          >
            <ModeLogo mode={m.id} width={64} height={40} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="titleSmall" component="div" noWrap>
                {presets[m.id]?.name ?? m.label}
              </Typography>
              <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
                {defaultsOf(m.id)}
              </Typography>
            </Box>
            {on && <Icon name="check_circle" fill size={20} style={{ color: theme.m3.primary }} />}
          </ButtonBase>
        );
      })}
      {onAdd && (
        <ButtonBase
          onClick={onAdd}
          sx={{
            p: 1.5,
            gap: 1.5,
            minHeight: 64,
            justifyContent: "flex-start",
            textAlign: "left",
            borderRadius: `${theme.tokens.shape.md}px`,
            color: theme.m3.onSurfaceVariant,
            transition: `background-color ${theme.tokens.motion.effects}`,
            "&:hover": { bgcolor: theme.m3.hover, color: theme.m3.onSurface },
            "&.Mui-focusVisible": { outline: `2px solid ${theme.m3.focus}`, outlineOffset: 2 },
          }}
        >
          <Box sx={{ width: 64, height: 40, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: `${theme.tokens.shape.sm}px`, bgcolor: theme.m3.surfaceContainerHigh }}>
            <Icon name="add" size={20} />
          </Box>
          <Typography variant="titleSmall" component="div">
            New game mode
          </Typography>
        </ButtonBase>
      )}
    </Box>
  );
}
