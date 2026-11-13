// Pickers shared by every place that picks a host, an audience or a stream (new stream, stream
// detail, time slots, host hand-over, Words, polls), so they look and behave the same everywhere.
import { useEffect, useState } from "react";
import Avatar from "@mui/material/Avatar";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { Icon } from "../../ds/Icon";
import { SwitchRow } from "../../ds/SwitchRow";
import { ListGroup, ListSwitch } from "../../ds/ListGroup";
import { Choice, ChoiceGroup } from "../../ds/SelectButton";
import { EmptyState } from "../../ds/EmptyState";
import { SelectList } from "../../ds/SelectList";
import { useTimezoneFormat } from "../../contexts";
import { StatusBadge, StreamImage, logoHidden } from "./parts";
import { StreamType } from "./enums";
import { GAME_MODES, bundleLine, useBundles } from "./gameModes";
import { IconTile } from "../../ds/IconTile";
import { hostLabel, showTitle } from "./hosts";

export function HostAvatar({ host, size = 32, sx }) {
  return (
    <Avatar
      src={host?.imageUrl ?? undefined}
      alt=""
      sx={{
        width: size,
        height: size,
        // A person: round, like the host pill on stream cards.
        borderRadius: "50%",
        fontSize: Math.round(size / 2.2),
        ...sx,
      }}
    >
      {host?.name?.[0]}
    </Avatar>
  );
}

/** Host picker, like every other choice (see Choice): the hosts with their pictures. */
/**
 * A library pick shown as a card (picture, name, one line about it); clicking it opens a menu of
 * the choices, then any `actions` (e.g. "Edit …") below a divider. `options` are
 * { value, media, primary, secondary? }; `media` on the card is 48px, in the menu 32px.
 */
export function PickCard({ label, value, options, onChange, media, title, supporting, actions = [], error, helperText, ariaLabel }) {
  const { m3: c, tokens } = useTheme();
  const [anchor, setAnchor] = useState(null);
  const run = (fn) => {
    setAnchor(null);
    fn();
  };
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
      {label && (
        <Typography variant="labelLarge" color="text.secondary" component="div">
          {label}
        </Typography>
      )}
      <ButtonBase
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        aria-label={`${ariaLabel ?? label}: ${title}. Change`}
        sx={{
          justifyContent: "flex-start",
          gap: 1.5,
          p: 1.5,
          pr: 2,
          textAlign: "left",
          borderRadius: `${tokens.shape.lg}px`,
          bgcolor: c.surfaceContainerHigh,
          "[role='listitem'] &": { bgcolor: c.nested },
          outline: error ? `2px solid ${c.error}` : "none",
          transition: `background-color ${tokens.motion.effects}`,
          "&:hover": { bgcolor: c.surfaceContainerHighest },
        }}
      >
        {media}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="titleMedium" noWrap>
            {title}
          </Typography>
          {supporting && (
            <Typography variant="bodySmall" color="text.secondary" noWrap component="div">
              {supporting}
            </Typography>
          )}
        </Box>
        <Icon name="unfold_more" style={{ color: c.onSurfaceVariant }} />
      </ButtonBase>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { minWidth: anchor?.offsetWidth ?? 280, maxHeight: 400 } } }}>
        {options.map((o) => (
          <MenuItem key={o.value} selected={o.value === value} onClick={() => run(() => onChange(o.value))} sx={{ gap: 1.5 }}>
            {o.media}
            <ListItemText primary={o.primary} secondary={o.secondary || null} />
            {o.value === value && <Icon name="check" />}
          </MenuItem>
        ))}
        {actions.length > 0 && <Divider />}
        {actions.map((a) => (
          // The same row as every ⋮ menu: 16px icon, then the label.
          <MenuItem key={a.label} onClick={() => run(a.onClick)}>
            <Icon name={a.icon} size={16} />
            {a.label}
          </MenuItem>
        ))}
      </Menu>
      {(error || helperText) && (
        <Typography variant="bodySmall" color={error ? "error" : "text.secondary"} component="div">
          {error || helperText}
        </Typography>
      )}
    </Box>
  );
}

/** Empty picture slot on a PickCard (nothing picked yet). */
export function PickPlaceholder({ icon }) {
  const { m3: c } = useTheme();
  return (
    <Box sx={{ width: 48, height: 48, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, bgcolor: c.surfaceContainerHighest, color: c.onSurfaceVariant }}>
      <Icon name={icon} />
    </Box>
  );
}

/** The game set as a PickCard, like Host and Sponsor: its showdown tile, name and prize. */
export function GameSetPicker({ value, onChange, label = "Game set" }) {
  const { bundles } = useBundles();
  const tile = (b, size) => <IconTile icon={b.showdown?.superSavvyOnly ? "diamond" : "trophy"} tone={b.showdown?.prize?.rewardType === "Cash" ? "green" : "violet"} size={size} />;
  const set = bundles.find((b) => b.id === value) ?? bundles[0];
  return (
    <PickCard
      label={label}
      ariaLabel={label}
      value={set?.id ?? ""}
      options={bundles.map((b) => ({ value: b.id, media: tile(b, 32), primary: b.name, secondary: bundleLine(b) }))}
      onChange={onChange}
      media={set ? tile(set, 48) : <PickPlaceholder icon="inventory_2" />}
      title={set?.name ?? "No game sets yet"}
      supporting={set ? bundleLine(set) : "Add one in Library › Gameplay › Game sets."}
    />
  );
}

/** The host as a PickCard; "Edit …" in the menu when `onEdit` is given (edits the Hosts library). */
export function HostPicker({ hosts, value, onChange, label = "Host", error, helperText, exclude, onEdit }) {
  const list = exclude ? hosts.filter((h) => h.id !== exclude) : hosts;
  return (
    <PickCard
      label={label}
      ariaLabel={label ?? "Host"}
      value={value?.id ?? null}
      options={list.map((h) => ({ value: h.id, media: <HostAvatar host={h} size={32} />, primary: hostLabel(h), secondary: h.displayName ? h.name : undefined }))}
      onChange={(id) => onChange(hosts.find((h) => h.id === id) ?? null)}
      media={value ? <HostAvatar host={value} size={48} /> : <PickPlaceholder icon="person_add" />}
      title={value ? hostLabel(value) : "Choose a host"}
      supporting={value ? (value.displayName ? value.name : undefined) : `${list.length} ${list.length === 1 ? "host" : "hosts"} in the library`}
      actions={onEdit && value ? [{ label: `Edit ${hostLabel(value)}`, icon: "edit", onClick: () => onEdit(value) }] : []}
      error={error}
      helperText={helperText}
    />
  );
}

/** Game mode picker: the two modes as a connected button group. `value` is a mode id. */
export function ModeChoice({ value, onChange, label = "Game mode" }) {
  return <ChoiceGroup label={label} value={value} options={Object.values(GAME_MODES).map((m) => ({ value: m.id, label: m.label, icon: m.icon }))} onChange={onChange} />;
}

const AUDIENCES = [
  { value: StreamType.Public, label: "Public", icon: "public" },
  { value: StreamType.Internal, label: "Internal", icon: "lock" },
];

/**
 * Who sees and joins a stream. Super Savvy isn't an audience of its own: it's a Public stream
 * only Super Savvy members can join (stored as streamType "SuperSavvy").
 */
// `label={null}` when the section around it already says what it is ("Who can join").
export function AudienceField({ value, onChange, error, superSavvySwitch = true, label = "Visibility" }) {
  const superSavvy = value === StreamType.SuperSavvy;
  const audience = superSavvy ? StreamType.Public : value;
  return (
    <Box>
      {label && (
        <Typography variant="labelLarge" color="text.secondary" component="div" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      <ToggleButtonGroup
        exclusive
        value={audience ?? null}
        onChange={(_, v) => v && onChange(v)}
        aria-label="Visibility"
        sx={{
          width: { xs: "100%", sm: "auto" },
          "& .MuiToggleButton-root": { flex: { xs: 1, sm: "none" } },
        }}
      >
        {AUDIENCES.map((a) => (
          <ToggleButton key={a.value} value={a.value}>
            <Icon name={a.icon} size={16} />
            {a.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {error && (
        <Typography variant="bodySmall" color="error" component="div" sx={{ mt: 0.75 }}>
          {error}
        </Typography>
      )}
      {superSavvySwitch && audience === StreamType.Public && (
        <Box sx={{ mt: 2 }}>
          {/* The same row as on the stream's Details. */}
          <ListGroup label="Options">
            <ListSwitch icon="workspace_premium" title="Super Savvy only" supporting="Everyone sees it; only Super Savvy members can join" checked={superSavvy} onChange={(on) => onChange(on ? StreamType.SuperSavvy : StreamType.Public)} />
          </ListGroup>
        </Box>
      )}
    </Box>
  );
}

/** A stream in one line: its image, title and status, then when, the host and an optional note. */
export function StreamSummary({ stream: s, note }) {
  const { formatDate } = useTimezoneFormat();
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
      <StreamImage stream={s} size={40} />
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Typography variant="titleSmall" noWrap>
            {showTitle(s)}
          </Typography>
          <StatusBadge status={s.status} draft={logoHidden(s)} />
        </Box>
        <Typography variant="bodySmall" color="text.secondary" noWrap component="div">
          {[formatDate(s.startDate, "ddd, MMM D · h:mm A"), s.hostDisplayName || s.hostName, note].filter(Boolean).join(" · ")}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Dialog that picks one upcoming stream (assigning words, polls, …). `describe(stream)` adds a
 * line of context; `disabledReason(stream)` greys a stream out with that reason.
 */
export function StreamPickerDialog({ open, title, header, streams, describe, disabledReason, toggle, confirmLabel = "Assign", busy, onConfirm, onClose, emptyText = "Upcoming streams will show here." }) {
  const [picked, setPicked] = useState(null);
  useEffect(() => {
    if (open) setPicked(null);
  }, [open]);
  const items = streams.map((s) => ({ ...s, disabled: !!disabledReason?.(s) }));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {header}
        {toggle && (
          <Box sx={{ px: 3, py: 1.5 }}>
            <SwitchRow label={toggle.label} checked={toggle.value} onChange={toggle.onChange} />
          </Box>
        )}
        {items.length === 0 ? (
          <EmptyState compact icon="event_busy" title="No matching streams" description={emptyText} />
        ) : (
          <SelectList
            label="Streams"
            items={items}
            value={picked?.id}
            onChange={(id) => setPicked(items.find((s) => s.id === id))}
            renderItem={(s) => <StreamSummary stream={s} note={disabledReason?.(s) || describe?.(s)} />}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!picked || busy} onClick={() => onConfirm(picked)}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
