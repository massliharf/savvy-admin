import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "./Icon";
import { ImageField } from "./ImageField";

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

/**
 * Up to `max` images of one kind, one of them selected (ringed, with a check). Click an image to
 * select it, × to remove it, the dashed tile to upload and crop another. The first upload is
 * selected; removing the selected one selects the first left.
 * `onChange(urls, selected)`. `hideLabel` leaves the label out (a section title already names it;
 * it still names the images for screen readers).
 */
export function ImageGallery({ label, hideLabel, hint, width, height, urls = [], selected, onChange, max = 5 }) {
  const { m3: c, tokens } = useTheme();
  const h = 88;
  const w = Math.min(Math.round(h * (width / height)), 156);
  const add = async (file) => {
    const url = await toDataUrl(file);
    const next = [...urls, url];
    onChange(next, selected && urls.includes(selected) ? selected : url);
  };
  const remove = (url) => {
    const next = urls.filter((u) => u !== url);
    onChange(next, selected === url ? (next[0] ?? null) : selected);
  };
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box>
        {!hideLabel && (
          <Typography variant="titleSmall" component="div">
            {label}
          </Typography>
        )}
        <Typography variant="bodySmall" color="text.secondary" component="div">
          {`${hint ?? `${width} × ${height} px`} · ${urls.length} / ${max}`}
        </Typography>
      </Box>
      <Box role="radiogroup" aria-label={label} sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {urls.map((url, i) => {
          const on = url === selected;
          return (
            <Box key={url.slice(-48) + i} sx={{ position: "relative", "&:hover .gallery-remove, &:focus-within .gallery-remove": { opacity: 1 } }}>
              <ButtonBase
                role="radio"
                aria-checked={on}
                aria-label={`${label} ${i + 1}${on ? ", selected" : ""}`}
                onClick={() => onChange(urls, url)}
                sx={{
                  width: w,
                  height: h,
                  borderRadius: `${tokens.shape.md}px`,
                  overflow: "hidden",
                  bgcolor: c.ctrl,
                  boxShadow: on ? `0 0 0 2px ${c.primary}` : "none",
                  "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: 2 },
                }}
              >
                <Box component="img" src={url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: on ? 1 : 0.85 }} />
              </ButtonBase>
              {on && (
                <Box sx={{ position: "absolute", left: 4, bottom: 4, width: 20, height: 20, borderRadius: "50%", bgcolor: c.primary, color: c.onPrimary, display: "grid", placeItems: "center", pointerEvents: "none" }}>
                  <Icon name="check" size={14} />
                </Box>
              )}
              <Tooltip title="Remove">
                <IconButton
                  className="gallery-remove"
                  aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
                  onClick={() => remove(url)}
                  size="small"
                  sx={{ position: "absolute", top: 2, right: 2, width: 24, height: 24, opacity: 0, transition: `opacity ${tokens.motion.effects}`, bgcolor: c.surfaceCard, "&:hover": { bgcolor: c.surfaceCard } }}
                >
                  <Icon name="close" size={14} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        })}
        {urls.length < max && <ImageField compact={h} tileWidth={w} label={label} value={null} width={width} height={height} onChange={add} />}
      </Box>
    </Box>
  );
}
