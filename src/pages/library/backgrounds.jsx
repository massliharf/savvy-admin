// Colour and gradient backgrounds: presets (a few built in, more added as Custom) picked wherever a
// live game host avatar background is chosen — a game set's backgrounds, or one stream's own.
import { useState } from "react";
import { useCreate, useDelete, useList } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { ChoiceGroup } from "../../ds/SelectButton";
import { DP } from "../../providers";
import { useNotify } from "../../shell/notifications";
import { backgroundCss, backgroundLine, backgroundUrl } from "../../utils/backgrounds";

/** The colour and gradient presets, in their saved order. */
export function useBackgroundPresets() {
  const { data, isLoading } = useList({ resource: "BackgroundPreset", dataProviderName: DP.backgroundPresets, pagination: { mode: "off" } });
  return { presets: data?.data ?? [], isLoading };
}

// Which way a gradient runs (CSS angles).
const DIRECTIONS = [
  { value: 180, label: "Down", icon: "south" },
  { value: 135, label: "Diagonal", icon: "south_east" },
  { value: 90, label: "Across", icon: "east" },
  { value: 45, label: "Up diagonal", icon: "north_east" },
];

/** A colour input as a swatch with its hex code. */
function ColorInput({ label, value, onChange }) {
  const { m3: c, tokens } = useTheme();
  return (
    <Box component="label" sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }}>
      <Box sx={{ position: "relative", width: 40, height: 40, borderRadius: `${tokens.shape.sm}px`, bgcolor: value, boxShadow: `inset 0 0 0 1px ${c.outlineVariant}`, flexShrink: 0 }}>
        <Box component="input" type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label={label} sx={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
      </Box>
      <Box>
        <Typography variant="labelLarge" color="text.secondary" component="div">
          {label}
        </Typography>
        <Typography variant="bodyMedium" component="div" sx={{ fontVariantNumeric: "tabular-nums" }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

/** Makes a custom preset (solid or gradient); it's added to the presets and picked. */
function CustomBackgroundDialog({ open, onClose, onSaved, presets }) {
  const { tokens } = useTheme();
  const notify = useNotify();
  const { mutateAsync, isPending } = useCreate();
  const [kind, setKind] = useState("gradient");
  const [colors, setColors] = useState(["#FF8A65", "#7C5CFF"]);
  const [angle, setAngle] = useState(135);
  const [name, setName] = useState("");
  const preset = { kind, colors: kind === "gradient" ? colors : [colors[0]], angle };
  const save = async () => {
    // The same as a preset already there: that one is used, no copy is added.
    const same = presets.find((p) => backgroundUrl(p) === backgroundUrl(preset));
    if (same) return onSaved(same);
    try {
      const res = await mutateAsync({ resource: "BackgroundPreset", dataProviderName: DP.backgroundPresets, values: { ...preset, name: name.trim() || backgroundLine(preset) }, successNotification: false, errorNotification: false });
      onSaved(res.data);
      setName("");
    } catch {
      notify("Couldn't add the background", { variant: "error" });
    }
  };
  const setColor = (i) => (v) => setColors((cs) => cs.map((x, j) => (j === i ? v : x)));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Custom background</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box sx={{ width: 120, aspectRatio: "1 / 1", borderRadius: `${tokens.shape.md}px`, background: backgroundCss(preset), alignSelf: "center" }} aria-hidden />
        <ChoiceGroup
          label="Type"
          value={kind}
          options={[
            { value: "color", label: "Solid", icon: "format_color_fill" },
            { value: "gradient", label: "Gradient", icon: "gradient" },
          ]}
          onChange={setKind}
        />
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <ColorInput label={kind === "gradient" ? "From" : "Colour"} value={colors[0]} onChange={setColor(0)} />
          {kind === "gradient" && <ColorInput label="To" value={colors[1]} onChange={setColor(1)} />}
        </Box>
        {kind === "gradient" && <ChoiceGroup label="Direction" value={angle} options={DIRECTIONS} onChange={setAngle} />}
        <TextField label="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} placeholder={backgroundLine(preset)} />
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} disabled={isPending}>
          Add and use
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * The colour and gradient presets as square swatches, then "Custom" to add one. Picking one calls
 * `onPick(url)` with the preset drawn as a square image; `selected` (a URL) rings the one in use.
 * Custom presets can be removed (× on hover); built-in ones stay.
 */
export function BackgroundSwatches({ selected, onPick, label = "Colours & gradients" }) {
  const { m3: c, tokens } = useTheme();
  const notify = useNotify();
  const { presets } = useBackgroundPresets();
  const { mutate: remove } = useDelete();
  const [custom, setCustom] = useState(false);
  const size = 40;
  const ring = (on) => (on ? `0 0 0 2px ${c.surfaceCard}, 0 0 0 4px ${c.primary}` : `inset 0 0 0 1px ${c.outlineVariant}`);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {label && (
        <Typography variant="labelLarge" color="text.secondary" component="div">
          {label}
        </Typography>
      )}
      <Box role="radiogroup" aria-label={label ?? "Colours & gradients"} sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, p: 0.5, m: -0.5 }}>
        {presets.map((p) => {
          const url = backgroundUrl(p);
          const on = url === selected;
          return (
            <Box key={p.id} sx={{ position: "relative", "&:hover .bg-remove, &:focus-within .bg-remove": { opacity: 1 } }}>
              <Tooltip title={p.name}>
                <ButtonBase
                  role="radio"
                  aria-checked={on}
                  aria-label={p.name}
                  onClick={() => onPick(url, p)}
                  sx={{ width: size, height: size, borderRadius: `${tokens.shape.sm}px`, background: backgroundCss(p), boxShadow: ring(on), "&.Mui-focusVisible": { outline: `1.5px solid ${c.focus}`, outlineOffset: 3 } }}
                >
                  {on && <Icon name="check" size={18} style={{ color: "#fff", filter: "drop-shadow(0 0 2px rgba(0,0,0,.6))" }} />}
                </ButtonBase>
              </Tooltip>
              {!p.builtIn && (
                <IconButton
                  className="bg-remove"
                  aria-label={`Remove ${p.name}`}
                  size="small"
                  onClick={() =>
                    remove(
                      { resource: "BackgroundPreset", dataProviderName: DP.backgroundPresets, id: p.id, successNotification: false, invalidates: ["list"] },
                      { onSuccess: () => notify(`“${p.name}” removed. Backgrounds already using it stay.`) },
                    )
                  }
                  sx={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, opacity: 0, transition: `opacity ${tokens.motion.effects}`, bgcolor: c.surfaceCard, "&:hover": { bgcolor: c.surfaceCard } }}
                >
                  <Icon name="close" size={12} />
                </IconButton>
              )}
            </Box>
          );
        })}
        <Tooltip title="Custom colour or gradient">
          <ButtonBase onClick={() => setCustom(true)} aria-label="Add a custom colour or gradient" sx={{ width: size, height: size, borderRadius: `${tokens.shape.sm}px`, outline: `1px dashed ${c.border}`, outlineOffset: -1, color: c.onSurfaceVariant, bgcolor: c.ctrl }}>
            <Icon name="add" />
          </ButtonBase>
        </Tooltip>
      </Box>
      <CustomBackgroundDialog
        presets={presets}
        open={custom}
        onClose={() => setCustom(false)}
        onSaved={(p) => {
          setCustom(false);
          onPick(backgroundUrl(p), p);
        }}
      />
    </Box>
  );
}

/** The swatches in a dialog (a stream's Change › Colour or gradient): picking one uses it and closes. */
export function BackgroundPickerDialog({ open, onClose, selected, onPick, title }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <BackgroundSwatches
          label={null}
          selected={selected}
          onPick={(url) => {
            onPick(url);
            onClose();
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
