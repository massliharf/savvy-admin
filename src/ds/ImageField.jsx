import { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "./Icon";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function cropToFile(src, area, width, height) {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(img, area.x, area.y, area.width, area.height, 0, 0, width, height);
  const blob = await new Promise((resolve, reject) =>
    // WebP keeps transparency (logos) at a fraction of PNG's size, so uploads fit the saved data.
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))), "image/webp", 0.88),
  );
  return new File([blob], "image.webp", { type: blob.type || "image/webp" });
}

/** A picked file's preview (an object URL while it's mounted), else the saved URL. */
export function useFilePreview(file, url) {
  const [local, setLocal] = useState(null);
  useEffect(() => {
    if (!(file instanceof Blob)) return setLocal(null);
    const u = URL.createObjectURL(file);
    setLocal(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return local ?? url;
}

/**
 * Image picker that crops to an exact output size.
 * `value` is the current image URL; `onChange(file)` receives the cropped PNG; `onRemove()` clears it.
 * `fit="contain"` shows the whole image (logos) instead of filling the frame.
 */
export function ImageField({ label, value, width, height, onChange, onRemove, hint, compact, tileWidth, fit = "cover" }) {
  const { m3: c, tokens } = useTheme();
  const inputRef = useRef(null);
  const [source, setSource] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState(null);
  const [local, setLocal] = useState(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => () => local && URL.revokeObjectURL(local), [local]);
  useEffect(() => setBroken(false), [value, local]);
  // A new saved/picked URL replaces a cropped file's preview.
  useEffect(() => setLocal(null), [value]);

  const preview = local || value;
  const shown = preview && !broken;
  const aspect = width / height;
  // `compact` (a size in px) renders only the clickable tile, e.g. for list rows.
  const boxH = compact ?? 88;
  const boxW = tileWidth ?? compact ?? Math.min(Math.round(boxH * aspect), 190);

  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSource(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const apply = async () => {
    if (!source || !area) return;
    const file = await cropToFile(source, area, width, height);
    setLocal(URL.createObjectURL(file));
    onChange(file);
    setSource(null);
  };

  const tile = (
    <Box
      component="button"
      type="button"
      onClick={() => inputRef.current?.click()}
      aria-label={`${shown ? "Replace" : "Upload"} ${label}`}
      sx={{
        all: "unset",
        cursor: "pointer",
        flexShrink: 0,
        width: boxW,
        height: boxH,
        borderRadius: `${tokens.shape.md}px`,
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        // Savvy Admin upload box: default-0 fill with a dashed alpha-1 line.
        bgcolor: c.ctrl,
        color: c.onSurfaceVariant,
        outline: shown ? "none" : `1px dashed ${c.border}`,
        outlineOffset: -1,
        transition: `filter ${tokens.motion.effects}`,
        "&:hover": { filter: "brightness(0.95)" },
        "&:focus-visible": { outline: `2px solid ${c.focus}`, outlineOffset: 2 },
      }}
    >
      {shown ? (
        <Box component="img" src={preview} alt="" onError={() => setBroken(true)} sx={{ width: "100%", height: "100%", objectFit: fit, display: "block" }} />
      ) : (
        <Icon name="add_photo_alternate" size={20} />
      )}
    </Box>
  );
  const cropper = (
    <>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
      <Dialog open={!!source} onClose={() => setSource(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Crop {label.toLowerCase()}</DialogTitle>
        <DialogContent>
          <Box sx={{ position: "relative", height: 360, borderRadius: `${tokens.shape.lg}px`, overflow: "hidden", bgcolor: c.inverseSurface }}>
            {source && (
              <Cropper
                image={source}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, px) => setArea(px)}
              />
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
            <Icon name="zoom_out" size={20} />
            <Slider value={zoom} min={1} max={5} step={0.05} onChange={(_, v) => setZoom(v)} aria-label="Zoom" sx={{ height: 4 }} />
            <Icon name="zoom_in" size={20} />
          </Box>
          <Typography variant="bodySmall" color="text.secondary">
            Saved as a {width} × {height} px image.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setSource(null)}>
            Cancel
          </Button>
          <Button onClick={apply}>Use image</Button>
        </DialogActions>
      </Dialog>
    </>
  );

  if (compact) {
    return (
      <>
        {tile}
        {cropper}
      </>
    );
  }
  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
      {/* The text always sits 16px after the image, whatever its shape. */}
      {tile}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="titleSmall" component="div">
          {label}
        </Typography>
        <Typography variant="bodySmall" color="text.secondary" component="div">
          {hint ?? `${width} × ${height} px`}
        </Typography>
        {/* Real buttons (filled), so they never read as plain text next to the image. */}
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Button variant="tonal" size="small" onClick={() => inputRef.current?.click()}>
            {shown ? "Replace" : "Upload"}
          </Button>
          {onRemove && shown && (
            <Button
              variant="tonal"
              size="small"
              color="error"
              onClick={() => {
                setLocal(null);
                onRemove();
              }}
            >
              Remove
            </Button>
          )}
        </Box>
      </Box>
      {cropper}
    </Box>
  );
}
