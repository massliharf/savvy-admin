import { Link } from "react-router";
import { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { Pill } from "../../ds/Pill";
import { CardCorner } from "../../ds/CardCorner";
import { ActionMenu } from "../../ds/ActionMenu";
import { cornerFor } from "../../ds/IconTile";
import { layer, radius } from "../../theme/tokens";
import { hostLabel, useHosts, showTitle } from "./hosts";
import { useTimezoneFormat } from "../../contexts";
import { modeOf, setupIssues } from "./gameModes";

export const STREAM_TYPES = {
  Public: { label: "Public", icon: "public", hint: "Everyone can see and join." },
  Internal: { label: "Internal", icon: "lock", hint: "Only internal users can see it." },
  // Shown as Public + "Super Savvy only" when editing (see AudienceField).
  SuperSavvy: { label: "Super Savvy only", icon: "diamond", hint: "Everyone can see it; only Super Savvy members can join." },
};

/** An upcoming stream still missing words: the app shows it without its game mode logo. */
export const logoHidden = (s) => s.status === "Scheduled" && setupIssues(s).length > 0;
export const isEnded = (s) => s.status === "Completed" || s.status === "Canceled";

/** Status badge. Published scheduled streams show none: upcoming is the normal state. */
export function StatusBadge({ status, draft: needsWords }) {
  const look = { InProgress: ["live", "Live"], Completed: ["neutral", "Ended"], Canceled: ["error", "Canceled"] }[status] ?? (needsWords ? ["neutral", "Needs words"] : null);
  return look ? <Pill tone={look[0]}>{look[1]}</Pill> : null;
}

function MetaItem({ icon, children, tooltip, color = "text.secondary" }) {
  const item = (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, minWidth: 0, color, typography: "labelMedium", whiteSpace: "nowrap" }}>
      <Icon name={icon} size={16} />
      {/* Ellipsis, not a hard cut, when the card is narrow. */}
      <Box component="span" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
        {children}
      </Box>
    </Box>
  );
  return tooltip ? <Tooltip title={tooltip}>{item}</Tooltip> : item;
}

/**
 * One line: game mode and rounds, then the audience and any extras (sponsor, raffle, spotlight,
 * a Super Savvy showdown on a Public stream) as icons with tooltips.
 */
export function StreamMeta({ stream, color }) {
  const mode = modeOf(stream);
  const type = STREAM_TYPES[stream.streamType];
  const rounds = stream.textSavvyRounds?.rounds?.length ?? 0;
  const extras = [
    type && { icon: type.icon, tip: type.label },
    stream.showdownConfiguration?.superSavvyOnly && stream.streamType !== "SuperSavvy" && { icon: "diamond", tip: "Super Savvy Showdown" },
    stream.sponsorship && { icon: "handshake", tip: `Sponsor: ${stream.sponsorship.title}` },
    stream.raffleSystemWinnersConfiguration && { icon: "confirmation_number", tip: "Raffle" },
    stream.isSpotlighted && { icon: "star", tip: "Spotlight on the home screen" },
  ].filter(Boolean);
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, color }}>
      <MetaItem icon={mode.icon} color={color}>
        {mode.label} · {rounds} {rounds === 1 ? "round" : "rounds"}
      </MetaItem>
      {extras.map((x) => (
        <Tooltip key={x.icon} title={x.tip}>
          <Box component="span" aria-label={x.tip} sx={{ display: "inline-flex", flexShrink: 0, color }}>
            <Icon name={x.icon} size={16} />
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
}

export function SetupWarning({ stream }) {
  const issues = setupIssues(stream);
  if (!issues.length || stream.status === "Completed" || stream.status === "Canceled") return null;
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "warning.main", typography: "labelMedium" }}>
      <Icon name="warning" size={16} fill />
      {issues.join(" · ")}
    </Box>
  );
}

export function StreamImage({ stream, size = 56 }) {
  return (
    <Box
      component="img"
      src={stream.imageUrl}
      alt=""
      loading="lazy"
      sx={{ width: size, height: size, borderRadius: `${cornerFor(size)}px`, objectFit: "cover", flexShrink: 0, bgcolor: "action.hover", display: "block" }}
    />
  );
}

/**
 * The stream's hero image at 3:4 (the shape the app shows it in), falling back to the stream image
 * and then to a plain tile when an image is missing or fails to load.
 */
export function StreamHero({ stream, width = 96, corner = 4 }) {
  const sources = [stream.heroImageUrl, stream.imageUrl].filter(Boolean);
  const [failed, setFailed] = useState(0);
  const src = sources[failed];
  // Exactly 3:4, inset in its card; `corner` follows the card's corner minus the inset.
  const box = { width, height: (width * 4) / 3, flexShrink: 0, overflow: "hidden", borderRadius: `${corner}px`, bgcolor: "action.hover" };
  return src ? (
    <Box component="img" src={src} alt="" loading="lazy" onError={() => setFailed((n) => n + 1)} sx={{ ...box, objectFit: "cover", display: "block" }} />
  ) : (
    <Box sx={{ ...box, display: "grid", placeItems: "center" }}>
      <Icon name="image" size={28} />
    </Box>
  );
}

// The host as the app names them (display name first), the same on every stream and screen.
function useHostOf(stream) {
  const host = useHosts().find((h) => h.id === stream.hostId);
  return { picture: host?.imageUrl ?? undefined, name: hostLabel(host) || stream.hostDisplayName || stream.hostName || "No host" };
}

/** Host picture, tinted from the surface it sits on. */
function HostFace({ host, size, color }) {
  return (
    <Avatar src={host.picture} alt="" sx={{ width: size, height: size, fontSize: Math.round(size * 0.55), bgcolor: alpha(color, 0.16), color, flexShrink: 0 }}>
      {host.name[0]}
    </Avatar>
  );
}

/** Host as a pill (picture and name), tinted from the surface it sits on. */
export function HostPill({ stream, color }) {
  const host = useHostOf(stream);
  return (
    <Pill on={color} leading={<HostFace host={host} size={18} color={color} />}>
      {host.name}
    </Pill>
  );
}

/**
 * How a stream looks, as M3 cards: one still missing words is an outlined card, the rest filled.
 * Cards and list rows stay neutral (live and ended are told by their badge). `tinted` (the
 * calendar, where there's no room for badges) colours the filled card instead: the game mode's
 * container, error container when live, a dimmer neutral when ended.
 * `dot` is the solid colour for small markers (calendar dots on phones).
 */
export function useStreamSurface(tinted = false) {
  const { m3: c, palette } = useTheme();
  const look = (bg, fg, sub, dot, border = "1px solid transparent") => ({ bg, fg, sub, dot, border, filled: bg !== "transparent", hover: layer(bg === "transparent" ? c.surface : bg, fg, 0.08) });
  return (stream) => {
    // Missing words: the warning fill (not an outline), everywhere a stream shows.
    if (logoHidden(stream)) return look(palette.warning.container, palette.warning.onContainer, palette.warning.onContainer, palette.warning.color);
    if (!tinted) {
      // Ended: the same card, told apart by its badge; text keeps full contrast.
      if (isEnded(stream)) return look(c.surfaceCard, c.onSurface, c.onSurfaceVariant, c.outline);
      return look(c.surfaceCard, c.onSurface, c.onSurfaceVariant, stream.status === "InProgress" ? c.error : c.onSurfaceVariant);
    }
    if (stream.status === "InProgress") return look(c.errorContainer, c.onErrorContainer, c.onErrorContainer, c.error);
    // Ended: a clear grey, a step darker than a day and than the page, so it reads as a block (and
    // its legend swatch shows on the page too).
    if (isEnded(stream)) return look(c.surface3, c.onSurfaceVariant, c.onSurfaceVariant, c.outline);
    // Scheduled: the one accent. The game mode shows as its icon, not as a colour.
    return look(c.primaryContainer, c.onPrimaryContainer, c.onPrimaryContainer, c.primary);
  };
}

export function streamActions(stream, onAction) {
  return [
    { label: "Edit", icon: "edit", onClick: () => onAction("edit", stream) },
    { label: "Add words", icon: "spellcheck", onClick: () => onAction("edit", stream), hidden: !logoHidden(stream) },
    { label: "Duplicate", icon: "content_copy", onClick: () => onAction("duplicate", stream) },
    { label: "Stream key", icon: "key", onClick: () => onAction("key", stream) },
    { label: "Delete", icon: "delete", onClick: () => onAction("delete", stream), tone: "error", divider: true },
  ];
}

// Each view has its own layout, with the same order (time → name → host → how it's played), the
// same time style and concentric corners: an inset image's corner is the card corner minus the
// inset. All sizes are on the 4px grid and the shape scale.
const LAYOUT = {
  // Cards and rows share the app's card corner (16) and title size with every other list.
  card: { radius: "lg", inset: 8, gap: 12, hero: 108, title: "titleMedium" },
  row: { radius: "lg", inset: 8, gap: 12, hero: 36, title: "titleMedium" },
  compact: { radius: "sm", inset: 4, gap: 4, title: "labelLarge" },
};

/**
 * One stream in the schedule. The same parts in the same order everywhere: 3:4 image, then time
 * with status and a setup warning, the name, the host and (where there's room) how it's played.
 * `variant` only changes sizes: "card" (cards view), "row" (list view and the phone day list) or
 * "compact" (calendar cells). Clicking opens the stream's detail page in every variant.
 */
export function StreamItem({ stream, variant = "card", onAction, highlight }) {
  const { m3: c, tokens } = useTheme();
  const { formatDate } = useTimezoneFormat();
  const surface = useStreamSurface(variant === "compact")(stream);
  const L = LAYOUT[variant];
  const host = useHostOf(stream);
  const mode = modeOf(stream);
  const draft = logoHidden(stream);
  const canceled = stream.status === "Canceled";
  const issues = isEnded(stream) ? [] : setupIssues(stream);
  // Calendar cells drop ":00" to save room.
  const start = formatDate(stream.startDate, variant === "compact" && formatDate(stream.startDate, "m") === "0" ? "h A" : "h:mm A");
  const corner = tokens.shape[L.radius] - L.inset;
  const label = `${formatDate(stream.startDate, "ddd, MMM D · h:mm A")} ${showTitle(stream)}, ${host.name}, ${mode.label}${draft ? ", game mode logo hidden until words are in" : ""}${stream.status === "InProgress" ? ", live" : ""}${issues.length ? `, ${issues.join(", ")}` : ""}`;

  const hero = <StreamHero stream={stream} width={L.hero} corner={corner} />;
  const warning = issues.length > 0 && (
    <Tooltip title={issues.join(" · ")}>
      <Box component="span" aria-hidden sx={{ display: "inline-flex", color: "warning.main", flexShrink: 0 }}>
        <Icon name="warning" size={16} fill />
      </Box>
    </Tooltip>
  );
  // Time is the overline everywhere, in the same style.
  const time = (
    <Typography variant="labelMedium" noWrap sx={{ flexShrink: 0 }}>
      {start}
    </Typography>
  );
  const overline = (
    // Wraps on narrow cards so the status never runs under the ⋮ menu.
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1, rowGap: 0.5, minWidth: 0, minHeight: 24, color: surface.sub }}>
      {time}
      <StatusBadge status={stream.status} draft={draft} />
      {warning}
    </Box>
  );
  const title = (
    <Typography
      variant={L.title}
      component={variant === "card" ? "h3" : "span"}
      noWrap={variant !== "card"}
      sx={{
        display: "block",
        minWidth: 0,
        textDecoration: canceled ? "line-through" : "none",
        ...(variant === "card" ? { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } : {}),
      }}
    >
      {showTitle(stream)}
    </Typography>
  );
  const hostPill = <HostPill stream={stream} color={surface.fg} />;

  const root = {
    component: Link,
    to: `/streams/edit/${stream.id}`,
    "aria-label": label,
  };
  const sx = {
    position: "relative",
    width: "100%",
    textAlign: "left",
    textDecoration: "none",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    p: `${L.inset}px`,
    gap: `${L.gap}px`,
    borderRadius: `${tokens.shape[L.radius]}px`,
    bgcolor: surface.bg,
    color: surface.fg,
    border: surface.border,
    outline: highlight ? `2px solid ${c.primary}` : "none",
    outlineOffset: -2,
    transition: `background-color ${tokens.motion.effects}`,
    "&:hover": { bgcolor: surface.hover },
    "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: 2 },
  };
  // The ⋮ menu in the card's corner, like every card's actions.
  const menu = onAction && (
    <CardCorner centered={variant === "row"}>
      <ActionMenu items={streamActions(stream, onAction)} label={`Actions for ${showTitle(stream)}`} color={surface.fg} />
    </CardCorner>
  );

  // Calendar: no image, three tight lines. The surface colour gives the game mode and status (see
  // the legend); icons add what colour can't: mode, showdown, a non-public audience, warnings.
  if (variant === "compact") {
    const marks = [
      stream.showdownConfiguration && { icon: stream.showdownConfiguration.superSavvyOnly ? "diamond" : "trophy", tip: stream.showdownConfiguration.superSavvyOnly ? "Super Savvy Showdown" : "Showdown" },
      stream.streamType === "Internal" && { icon: "lock", tip: "Internal" },
      stream.streamType === "SuperSavvy" && { icon: "workspace_premium", tip: "Super Savvy only" },
    ].filter(Boolean);
    return (
      // The marks give way to the time in narrow cells (a container query on the item's width).
      <ButtonBase {...root} onClick={(e) => e.stopPropagation()} sx={{ ...sx, display: "flex", flexDirection: "column", alignItems: "stretch", px: 1, py: 0.5, containerType: "inline-size" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0, minHeight: 16, color: surface.sub }}>
          <Icon name={mode.icon} size={14} />
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", overflow: "hidden" }}>{time}</Box>
          {warning}
          {marks.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0, "@container (max-width: 104px)": { display: "none" } }}>
              {marks.map((m) => (
                <Tooltip key={m.icon} title={m.tip}>
                  <Box component="span" aria-hidden sx={{ display: "inline-flex" }}>
                    <Icon name={m.icon} size={14} />
                  </Box>
                </Tooltip>
              ))}
            </Box>
          )}
        </Box>
        {title}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0, color: surface.sub }}>
          <HostFace host={host} size={16} color={surface.fg} />
          <Typography variant="labelSmall" noWrap>
            {host.name}
          </Typography>
        </Box>
      </ButtonBase>
    );
  }

  if (variant === "row") {
    return (
      <Box sx={{ position: "relative" }}>
        <ButtonBase
          {...root}
          sx={{
            ...sx,
            display: "grid",
            alignItems: "center",
            // The meta column joins on wide screens only, so the title keeps room next to the rail.
            gridTemplateColumns: { xs: `${L.hero}px minmax(0, 1fr) 40px`, md: `${L.hero}px minmax(0, 1fr) 160px 40px`, lg: `${L.hero}px minmax(0, 1fr) 160px 260px 40px` },
          }}
        >
          {hero}
          <Box sx={{ minWidth: 0 }}>
            {overline}
            {title}
          </Box>
          <Box sx={{ display: { xs: "none", md: "flex" }, minWidth: 0 }}>{hostPill}</Box>
          <Box sx={{ display: { xs: "none", lg: "block" }, minWidth: 0, overflow: "hidden" }}>
            <StreamMeta stream={stream} color={surface.sub} />
          </Box>
          <span />
        </ButtonBase>
        {menu}
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", height: "100%" }}>
      <ButtonBase {...root} sx={{ ...sx, height: "100%", display: "flex" }}>
        {hero}
        <Box sx={{ minWidth: 0, flex: 1, alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", pr: 5 }}>
          {overline}
          <Box sx={{ mt: 0.5, width: "100%" }}>{title}</Box>
          <Box sx={{ mt: 1, display: "flex", maxWidth: "100%" }}>{hostPill}</Box>
          <Box sx={{ mt: "auto", pt: 1, width: "100%", overflow: "hidden" }}>
            <StreamMeta stream={stream} color={surface.sub} />
          </Box>
        </Box>
      </ButtonBase>
      {menu}
    </Box>
  );
}
