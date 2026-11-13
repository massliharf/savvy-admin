// TRIAL (2026-11-13): bakes the stream image (900 × 1200) from the game set's stream image
// background and the host's picture, by itself, so nobody has to make one per host and set.
//
//   1. Cut out: the host's picture loses its own background (a person segmenter, MediaPipe,
//      running in the browser; in production this runs once on the server when a host picture is
//      uploaded, and the cut-out is kept with the host).
//   2. Bake: background (cover) + cut-out (head and shoulders on the bottom edge) + a soft dark
//      fade at the bottom for the app's text. In production the server bakes on save, once per
//      background + host pair, and the stream gets that image's URL (heroImageUrl).
//
// It's baked on the stream (Stream detail › When & title) and only previewed: nothing is saved.
// To remove the trial, delete this file and the lines marked "bake trial" in streams/detail/sections.jsx.
import { useEffect, useState } from "react";
import { useList } from "@refinedev/core";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { DP } from "../../providers";
import { STREAM_HERO_URL } from "../../assets";
import { hostLabel } from "./hosts";

const W = 900;
const H = 1200;
const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite";

// ---------------------------------------------------------------- engine
let segmenter;
function getSegmenter() {
  segmenter ??= (async () => {
    const { FilesetResolver, ImageSegmenter } = await import(/* @vite-ignore */ `${MP}/vision_bundle.mjs`);
    const files = await FilesetResolver.forVisionTasks(`${MP}/wasm`);
    return ImageSegmenter.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL }, runningMode: "IMAGE", outputConfidenceMasks: true, outputCategoryMask: false });
  })().catch((e) => {
    segmenter = undefined;
    throw e;
  });
  return segmenter;
}

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't load an image"));
    img.src = src;
  });

/** The host's picture without its background, as a canvas (cached per picture). */
const cutouts = new Map();
function cutout(url) {
  if (!cutouts.has(url))
    cutouts.set(
      url,
      (async () => {
        const [img, seg] = await Promise.all([loadImage(url), getSegmenter()]);
        const result = seg.segment(img);
        // Masks: background, hair, body skin, face skin, clothes, others. The person is all but the first.
        const bg = result.confidenceMasks[0];
        const mw = bg.width;
        const mh = bg.height;
        const conf = bg.getAsFloat32Array();
        const mask = document.createElement("canvas");
        mask.width = mw;
        mask.height = mh;
        const mctx = mask.getContext("2d");
        const px = mctx.createImageData(mw, mh);
        for (let i = 0; i < conf.length; i++) px.data[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, (1 - conf[i] - 0.2) / 0.6)) * 255);
        mctx.putImageData(px, 0, 0);
        result.confidenceMasks.forEach((m) => m.close());
        const out = document.createElement("canvas");
        out.width = img.naturalWidth;
        out.height = img.naturalHeight;
        const ctx = out.getContext("2d");
        ctx.drawImage(img, 0, 0);
        // Keep only the person; a little blur softens the mask's edge.
        ctx.globalCompositeOperation = "destination-in";
        ctx.filter = "blur(2px)";
        ctx.drawImage(mask, 0, 0, out.width, out.height);
        return out;
      })().catch((e) => {
        cutouts.delete(url);
        throw e;
      }),
    );
  return cutouts.get(url);
}

function drawCover(ctx, img, w, h) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/** A clean Savvy-blue background (no one in it), for when the game set's has a host baked in. */
function paintSample(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1556f0");
  g.addColorStop(0.45, "#1d9bf4");
  g.addColorStop(1, "#04112a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.filter = "blur(14px)";
  [
    [130, 420, 70, "rgba(120,180,255,0.55)"],
    [790, 280, 48, "rgba(40,90,230,0.8)"],
    [760, 760, 90, "rgba(20,70,190,0.55)"],
    [120, 980, 80, "rgba(10,40,120,0.6)"],
  ].forEach(([x, y, r, color]) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

/** The sample stream image is a photo with the host already in it: not a background to bake on. */
export const hasHostInIt = (url) => !url || url === STREAM_HERO_URL;

const bakes = new Map();
/** The stream image: `background` (cover) + the cut-out `host` on the bottom edge. Cached per pair. */
export function bakeStreamImage({ background, host }) {
  const key = `${background}|${host}`;
  if (!bakes.has(key))
    bakes.set(
      key,
      (async () => {
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (hasHostInIt(background)) paintSample(ctx);
        else drawCover(ctx, await loadImage(background), W, H);
        if (host) {
          const cut = await cutout(host);
          // Head and shoulders, as wide as the image, its bottom (where the photo cuts the shoulders) on the bottom edge.
          const w = W * 1.04;
          const h = (w * cut.height) / cut.width;
          ctx.save();
          ctx.shadowColor = "rgba(0, 10, 40, 0.45)";
          ctx.shadowBlur = 48;
          ctx.drawImage(cut, (W - w) / 2, H - h, w, h);
          ctx.restore();
        }
        // A soft dark fade at the bottom, where the app puts its text.
        const fade = ctx.createLinearGradient(0, H * 0.68, 0, H);
        fade.addColorStop(0, "rgba(2, 8, 24, 0)");
        fade.addColorStop(1, "rgba(2, 8, 24, 0.55)");
        ctx.fillStyle = fade;
        ctx.fillRect(0, H * 0.68, W, H * 0.32);
        return canvas.toDataURL("image/jpeg", 0.88);
      })().catch((e) => {
        bakes.delete(key);
        throw e;
      }),
    );
  return bakes.get(key);
}

function useBake(background, host) {
  const [state, setState] = useState({ url: null, error: null, busy: true });
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, busy: true, error: null }));
    bakeStreamImage({ background, host })
      .then((url) => live && setState({ url, error: null, busy: false }))
      .catch((e) => live && setState({ url: null, error: e.message || "Couldn't make the image", busy: false }));
    return () => {
      live = false;
    };
  }, [background, host]);
  return state;
}

// ---------------------------------------------------------------- preview
function BakedImage({ background, host, width }) {
  const { m3: c, tokens } = useTheme();
  const { url, error, busy } = useBake(background, host);
  return (
    <Box sx={{ width, aspectRatio: "3 / 4", flexShrink: 0, borderRadius: `${tokens.shape.md}px`, overflow: "hidden", bgcolor: c.surfaceContainerHighest, display: "grid", placeItems: "center", position: "relative" }}>
      {url && <Box component="img" src={url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: busy ? 0.5 : 1 }} />}
      {(busy || error) && (
        <Typography variant="bodySmall" color="text.secondary" sx={{ position: "absolute", px: 1, textAlign: "center" }}>
          {error ?? "Cutting out the host…"}
        </Typography>
      )}
    </Box>
  );
}

/** Stream page (When & title): the image this stream gets, made from its background and host. */
export function StreamBakePreview({ background, host, hostId, setName }) {
  const { data } = useList({ resource: "Host", dataProviderName: DP.hosts, pagination: { mode: "off" } });
  // The name the app shows (display name, else name).
  const hostName = hostLabel((data?.data ?? []).find((h) => h.id === hostId));
  if (!host) return null;
  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", py: 1.25, borderTop: 1, borderColor: "divider" }}>
      <BakedImage background={background} host={host} width={150} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box>
          <Typography variant="titleSmall" component="div">
            Stream image
          </Typography>
          <Typography variant="bodySmall" color="text.secondary" component="div">
            Made from {setName ? `${setName}'s background` : "the background"} and {hostName || "the host"}'s picture. Updates by itself when either changes.
          </Typography>
          {hasHostInIt(background) && (
            <Typography variant="bodySmall" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
              This background already has a host in it, so a clean sample is used here.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
