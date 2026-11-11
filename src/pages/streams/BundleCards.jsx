import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { IconTile } from "../../ds/IconTile";
import { bundleLine, useBundles } from "./gameModes";

/**
 * Bundles as cards (name, showdown and prize), the same card as a game mode's. With `onChange`
 * they're a picker (New stream, Fill month); with `onOpen` each card opens its bundle (Bundles).
 */
export function BundleCards({ value, onChange, onOpen }) {
  const theme = useTheme();
  const { bundles } = useBundles();
  const pick = !!onChange;
  return (
    <Box role={pick ? "radiogroup" : "list"} aria-label={pick ? "Bundle" : "Bundles"} sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: 1 }}>
      {bundles.map((b) => {
        const on = pick && b.id === value;
        return (
          <Box key={b.id} role={pick ? undefined : "listitem"} sx={{ display: "flex" }}>
            <ButtonBase
              role={pick ? "radio" : undefined}
              aria-checked={pick ? on : undefined}
              onClick={() => (pick ? onChange(b.id) : onOpen(b.id))}
              sx={{
                flex: 1,
                minWidth: 0,
                p: 1.5,
                gap: 1.5,
                justifyContent: "flex-start",
                textAlign: "left",
                borderRadius: `${theme.tokens.shape.md}px`,
                bgcolor: theme.m3.surfaceCard,
                boxShadow: on ? `inset 0 0 0 2px ${theme.m3.primary}` : "none",
                transition: `background-color ${theme.tokens.motion.effects}`,
                "&:hover": { bgcolor: theme.m3.hover },
                "&.Mui-focusVisible": { outline: `2px solid ${theme.m3.focus}`, outlineOffset: 2 },
              }}
            >
              <IconTile icon={b.showdown?.superSavvyOnly ? "diamond" : "trophy"} tone={b.showdown?.prize?.rewardType === "Cash" ? "green" : "violet"} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="titleSmall" component="div" noWrap>
                  {b.name}
                </Typography>
                <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
                  {bundleLine(b)}
                </Typography>
              </Box>
              {on && <Icon name="check_circle" fill size={20} style={{ color: theme.m3.primary }} />}
              {!pick && <Icon name="chevron_right" size={20} style={{ color: theme.m3.onSurfaceVariant }} />}
            </ButtonBase>
          </Box>
        );
      })}
    </Box>
  );
}
