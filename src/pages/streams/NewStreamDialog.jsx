import { useEffect, useState } from "react";
import { useCreate } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { Icon } from "../../ds/Icon";
import { dayjs, useTimezone } from "../../contexts";
import { richLen } from "./enums";
import { GAME_MODES, modeOf, useGameModePresets, useStreamBuilder } from "./gameModes";
import { DEFAULT_TITLE, fillHost, hostLabel, titleRule } from "./hosts";
import { HostAvatar } from "./pickers";
import { FieldHelper } from "../../ds/FieldHelper";
import { ListGroup, ListItem, ListSwitch } from "../../ds/ListGroup";
import { ScopeToggle } from "../../ds/ScopeToggle";
import { ModeLogo } from "./ModeLogo";
import { useList } from "@refinedev/core";
import { DP } from "../../providers";
import ButtonBase from "@mui/material/ButtonBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { StreamType } from "./enums";

const defaultStart = (tz) => dayjs().tz(tz).add(1, "day").hour(19).minute(0).second(0).millisecond(0);

function initialState(source, hosts, tz, date) {
  const start = date ? dayjs.tz(`${date}T19:00`, tz) : defaultStart(tz);
  if (!source) return { gameMode: "TextChain", title: DEFAULT_TITLE, host: null, start: start.isValid() ? start : defaultStart(tz), streamType: "Public" };
  return {
    gameMode: modeOf(source).id,
    // The copy keeps the title; {host} names whoever hosts it.
    title: source.title || DEFAULT_TITLE,
    host: hosts.find((h) => h.id === source.hostId) ?? null,
    start: dayjs.utc(source.startDate).tz(tz).add(7, "day"),
    streamType: source.streamType ?? "Public",
  };
}

/**
 * Short create flow: game mode, title, time, host, audience. Everything else (host and sponsor
 * included, by default) comes from the game mode (or the duplicated stream).
 */
export function NewStreamDialog({ open, source, date, hosts, onClose, onCreated }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { timezone } = useTimezone();
  const [form, setForm] = useState(() => initialState(source, hosts, timezone, date));
  const [submitted, setSubmitted] = useState(false);
  // The host follows the game mode's default until someone picks one by hand.
  const [hostPicked, setHostPicked] = useState(false);
  const { mutateAsync: create, isPending } = useCreate();
  const { presets } = useGameModePresets();
  const defaultHost = (gameMode) => hosts.find((h) => h.id === presets[gameMode]?.defaultHostId) ?? null;
  const build = useStreamBuilder();
  const { data: sponsorData } = useList({ resource: "Sponsor", dataProviderName: DP.sponsors, pagination: { mode: "off" } });
  const [hostMenu, setHostMenu] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(initialState(source, hosts, timezone, date));
      setSubmitted(false);
      setHostPicked(!!source);
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, source?.id, date]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  // Fill in (and follow) the mode's default host while none has been picked by hand.
  useEffect(() => {
    if (!open || hostPicked) return;
    const h = defaultHost(form.gameMode);
    if (h && h.id !== form.host?.id) set({ host: h });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hostPicked, form.gameMode, presets, hosts]);
  // Date and time are picked separately; rebuild the instant in the admin time zone so DST is right.
  const compose = (date, time) =>
    date?.isValid() && time?.isValid() ? dayjs.tz(`${date.format("YYYY-MM-DD")}T${time.format("HH:mm")}`, timezone) : (date ?? time);
  const titleLen = richLen(form.title.trim());
  const titleCheck = titleRule(form.title);
  const errors = {
    title: titleCheck === true ? null : titleCheck,
    host: form.host ? null : "Choose a host",
    start: !form.start?.isValid?.() ? "Pick a date and time" : form.start.isBefore(dayjs()) ? "Pick a time in the future" : null,
  };
  const valid = !errors.title && !errors.host && !errors.start;
  const show = (k) => (submitted ? errors[k] : null);
  const mode = GAME_MODES[form.gameMode];
  // A game mode's defaults in a line: who hosts, who sponsors.
  const defaultsOf = (id) => {
    const p = presets[id];
    const h = hosts.find((x) => x.id === p?.defaultHostId);
    const sp = sponsorData?.data?.find((x) => x.id === p?.defaultSponsorId);
    return [h ? hostLabel(h) : "No default host", sp ? sp.name : "No sponsor"].join(" · ");
  };
  const superSavvy = form.streamType === StreamType.SuperSavvy;
  const audience = superSavvy ? StreamType.Public : form.streamType;

  const submit = async () => {
    setSubmitted(true);
    if (!valid) return;
    const startDate = form.start.utc().toISOString();
    const base = { title: form.title.trim(), host: form.host, startDate, gameMode: form.gameMode, streamType: form.streamType };
    // A new stream: the game mode's defaults and the Default presets (see useStreamBuilder).
    let values = build(base);
    if (source) {
      // A copy keeps the source's settings (sponsor, rewards, share cards, notifications…); only
      // the time, host and audience are new. Words aren't copied: a word set is used once.
      // eslint-disable-next-line no-unused-vars
      const { id, status, prizePool, totalPrizePool, isDraft, hideGameModeLogo, ...copy } = source;
      const sameMode = source.gameMode === mode.base;
      const sameHost = source.hostId === form.host.id;
      values = {
        ...copy,
        title: base.title,
        startDate,
        streamType: form.streamType,
        gameMode: values.gameMode,
        hostId: values.hostId,
        hostName: values.hostName,
        imageUrl: sameHost ? copy.imageUrl : values.imageUrl,
        heroImageUrl: sameHost ? copy.heroImageUrl : values.heroImageUrl,
        textSavvyRounds: sameMode ? { rounds: (copy.textSavvyRounds?.rounds ?? []).map((r) => ({ ...r, word: "" })) } : values.textSavvyRounds,
        showdownConfiguration: sameMode && copy.showdownConfiguration ? { ...copy.showdownConfiguration, word: "" } : values.showdownConfiguration,
        roundScoring: sameMode ? copy.roundScoring : values.roundScoring,
        hostStumperBonusXp: sameMode ? copy.hostStumperBonusXp : values.hostStumperBonusXp,
        round1StartsAt: null,
      };
    }
    // The app shows the stream right away; its game mode logo once the words are in.
    // Words come later (Pick a word set on the stream); until then the app hides the mode logo.
    const res = await create({ resource: "TextSavvyStream", values, successNotification: false });
    onCreated(res.data);
  };

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth>
      <DialogTitle>{source ? "Duplicate stream" : "New stream"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* What's played: a game mode, shown like a host card (its logo, name and defaults). Words
            are added on the stream afterwards. */}
        <Box role="radiogroup" aria-label="Game mode" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="overline" color="text.secondary" component="div">
            Game mode
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
            {Object.values(GAME_MODES).map((m) => {
              const on = m.id === form.gameMode;
              return (
                <ButtonBase
                  key={m.id}
                  role="radio"
                  aria-checked={on}
                  onClick={() => set({ gameMode: m.id })}
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
          </Box>
        </Box>

        {/* The stream itself, one group: who hosts, when, for whom, and its title. */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="overline" color="text.secondary" component="div">
            Stream
          </Typography>
          <ListGroup label="Stream">
            <ListItem
              leading={form.host ? <HostAvatar host={form.host} size={36} /> : <Icon name="person_add" size={20} />}
              title={form.host ? hostLabel(form.host) : "Choose a host"}
              supporting={form.host ? (hostPicked ? form.host.name : `Default for ${mode.label}`) : `${hosts.length} ${hosts.length === 1 ? "host" : "hosts"} in the library`}
              error={show("host")}
              trailing={<Icon name="unfold_more" size={20} />}
              // The list opens under the whole row, as wide as it (like every picker).
              onClick={(e) => setHostMenu(e.currentTarget.closest("[role='listitem']") ?? e.currentTarget)}
            />
            <ListItem leading={<Icon name="event" size={20} />} title="When" supporting={show("start") ? undefined : `Time zone: ${timezone.replace(/_/g, " ")}`} error={show("start")}>
              <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
                <DatePicker
                  label="Date"
                  value={form.start}
                  timezone={timezone}
                  disablePast
                  onChange={(d) => set({ start: compose(d, form.start) })}
                  slots={{ openPickerIcon: () => <Icon name="calendar_today" /> }}
                  slotProps={{ textField: { error: !!show("start"), sx: { flex: 3 } } }}
                />
                <TimePicker
                  label="Time"
                  value={form.start}
                  timezone={timezone}
                  onChange={(t) => set({ start: compose(form.start, t) })}
                  slots={{ openPickerIcon: () => <Icon name="schedule" /> }}
                  slotProps={{ textField: { error: !!show("start"), sx: { flex: 2 } } }}
                />
              </Box>
            </ListItem>
            <ListItem
              leading={<Icon name="visibility" size={20} />}
              title="Visibility"
              supporting={audience === StreamType.Internal ? "Only the team sees it" : "Everyone in the app"}
              trailing={<ScopeToggle label="Visibility" all={false} value={audience} options={[{ value: StreamType.Public, label: "Public" }, { value: StreamType.Internal, label: "Internal" }]} onChange={(v) => set({ streamType: v })} />}
            />
            <ListSwitch
              icon="workspace_premium"
              title="Super Savvy only"
              supporting="Everyone sees it; only Super Savvy members can join"
              checked={superSavvy}
              disabled={audience === StreamType.Internal}
              onChange={(on) => set({ streamType: on ? StreamType.SuperSavvy : StreamType.Public })}
            />
            <ListItem leading={<Icon name="title" size={20} />} title="Title">
              <TextField
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
                error={!!show("title")}
                inputProps={{ "aria-label": "Title" }}
                // {host} is filled with the stream's host wherever the title shows; say how it reads now.
                helperText={<FieldHelper text={show("title") ?? (/\{host\}/i.test(form.title) && form.host ? `Shows as “${fillHost(form.title, hostLabel(form.host))}”` : "{host} becomes the host's name.")} counter={`${titleLen} / 100`} over={titleLen > 100} />}
                sx={{ mt: 1 }}
              />
            </ListItem>
          </ListGroup>
          <Menu
            anchorEl={hostMenu}
            open={!!hostMenu}
            onClose={() => setHostMenu(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            slotProps={{ paper: { sx: { minWidth: hostMenu?.offsetWidth ?? 280, maxHeight: 400, mt: 0.5 } } }}
          >
            {hosts.map((h) => (
              <MenuItem
                key={h.id}
                selected={h.id === form.host?.id}
                onClick={() => {
                  setHostMenu(null);
                  setHostPicked(true);
                  set({ host: h });
                }}
                sx={{ gap: 1.5 }}
              >
                <HostAvatar host={h} size={32} />
                <ListItemText primary={hostLabel(h)} secondary={h.displayName ? h.name : null} />
                {h.id === form.host?.id && <Icon name="check" />}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={isPending}>
          {source ? "Duplicate" : "Add stream"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
