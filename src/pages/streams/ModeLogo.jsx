import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { MODE_LOGOS } from "../../assets";
import { IconTile } from "../../ds/IconTile";
import { GAME_MODES, useGameModePresets } from "./gameModes";

/**
 * A game mode's logo (the one set in its settings, else the built-in one) on a quiet tile, so a
 * mode reads the same on every card and picker. Without any logo, its icon tile.
 */
export function ModeLogo({ mode, width = 72, height = 40 }) {
  const { m3: c, tokens } = useTheme();
  const { presets } = useGameModePresets();
  const meta = GAME_MODES[mode] ?? GAME_MODES.TextChain;
  const src = presets[mode]?.gameLogoUrl ?? MODE_LOGOS[mode];
  if (!src) return <IconTile icon={meta.icon} tone={meta.tone} />;
  return (
    <Box sx={{ width, height, flexShrink: 0, borderRadius: `${tokens.shape.sm}px`, bgcolor: c.surfaceCardInset, display: "grid", placeItems: "center", overflow: "hidden" }}>
      <Box component="img" src={src} alt={meta.label} sx={{ maxWidth: "86%", maxHeight: "78%", objectFit: "contain", display: "block" }} />
    </Box>
  );
}
