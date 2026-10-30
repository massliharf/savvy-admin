import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { useGetIdentity, useLogout } from "@refinedev/core";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { styled, useTheme } from "@mui/material/styles";
import { Icon } from "../ds/Icon";
import { LOGO_URL } from "../assets";
import { useThemeSettings } from "../theme/ThemeSettings";
import { DESTINATIONS, findDestination, findTab, isRecordPage } from "./nav";
import { radius } from "../theme/tokens";
import { RailContext } from "./railContext";

const RAIL_WIDTH = 72;
const EXPANDED_WIDTH = 236;
const RAIL_KEY = "savvy-rail";
const BAR_HEIGHT = 64;
// The shell floats on the app ground: rail and workspace are 16px-cornered cards, 8px apart.
const GAP = 8;

// Phone bar destination: icon over a small label, the active one on a grey square.
const DestinationButton = styled(ButtonBase, { shouldForwardProp: (p) => p !== "active" })(({ theme, active }) => {
  const { m3: c, tokens } = theme;
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    width: "100%",
    padding: "4px 0",
    borderRadius: radius("sm"),
    color: c.onSurface,
    "& .indicator": {
      display: "grid",
      placeItems: "center",
      width: 32,
      height: 32,
      borderRadius: radius("sm"),
      backgroundColor: active ? c.secondaryContainer : "transparent",
      transition: `background-color ${tokens.motion.effects}`,
    },
    "&:hover .indicator": { backgroundColor: active ? c.secondaryContainer : c.hover },
    "&.Mui-focusVisible .indicator": { outline: `2px solid ${c.focus}`, outlineOffset: 2 },
    "& .label": theme.typography.labelSmall,
  };
});

function Destination({ destination, active, onClick }) {
  return (
    <DestinationButton
      active={active}
      component={Link}
      to={destination.tabs[0].path}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      <span className="indicator">
        <Icon name={destination.icon} size={20} />
      </span>
      <span className="label">{destination.label}</span>
    </DestinationButton>
  );
}

// The rail is one element that grows and shrinks: icons, the logo and the avatar keep their
// place (centred in the 72px rail), only the labels fade, so opening and closing is seamless.
// Rows sit 12px in from the rail's edge; an 18px icon 15px into its row lands on the rail's centre.
const ROW_INSET = 15;
const RAIL_EASE = "240ms cubic-bezier(0.2, 0, 0, 1)";
/** Labels that fade out as the rail closes (they stay in the layout, clipped by the row). */
const fade = (shown) => ({ opacity: shown ? 1 : 0, transition: `opacity ${shown ? "160ms 80ms" : "100ms"} ease` });

/**
 * The account. In the rail (`rail`): a row whose avatar stays put while the name and email fade
 * with the rail (`expanded`); elsewhere (phone header) just the avatar.
 */
function AccountMenu({ rail = false, expanded = true }) {
  const { data: identity } = useGetIdentity();
  const { mutate: logout } = useLogout();
  const { dark, update } = useThemeSettings();
  const [anchor, setAnchor] = useState(null);
  const email = identity?.email ?? "";
  const initial = (email[0] ?? "A").toUpperCase();
  const { m3: c, tokens } = useTheme();

  return (
    <>
      {rail ? (
        <ButtonBase
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label="Account"
          aria-haspopup="menu"
          sx={{ width: "100%", justifyContent: "flex-start", gap: 1.25, pl: `${ROW_INSET - 5}px`, pr: 1, py: 0.75, borderRadius: radius("sm"), textAlign: "left", overflow: "hidden", whiteSpace: "nowrap", transition: `background-color ${tokens.motion.effects}`, "&:hover": { bgcolor: c.hover }, "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: -2 } }}
        >
          <Avatar sx={{ width: 28, height: 28, fontSize: 12, flexShrink: 0 }}>{initial}</Avatar>
          <Box sx={{ flex: 1, minWidth: 0, ...fade(expanded) }}>
            <Typography variant="labelLarge" component="div">
              Admin
            </Typography>
            <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
              {email}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", ...fade(expanded) }}>
            <Icon name="unfold_more" size={16} style={{ color: c.onSurfaceVariant }} />
          </Box>
        </ButtonBase>
      ) : (
        <Tooltip title="Account" placement="right">
          <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Account" sx={{ p: 0 }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>{initial}</Avatar>
          </IconButton>
        </Tooltip>
      )}
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={rail ? (expanded ? { vertical: "top", horizontal: "left" } : { vertical: "bottom", horizontal: "right" }) : { vertical: "bottom", horizontal: "right" }}
        transformOrigin={rail && expanded ? { vertical: "bottom", horizontal: "left" } : rail ? { vertical: "bottom", horizontal: "left" } : { vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: rail && expanded ? { mt: -1, width: 220 } : rail ? { ml: 1, minWidth: 240 } : { mt: 1, minWidth: 240 } } }}
      >
        <Box sx={{ px: 1, py: 1 }}>
          <Typography variant="titleSmall" component="div">
            Signed in as admin
          </Typography>
          <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
            {email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            update({ mode: dark ? "light" : "dark" });
            setAnchor(null);
          }}
        >
          <Icon name={dark ? "light_mode" : "dark_mode"} size={16} />
          {dark ? "Light theme" : "Dark theme"}
        </MenuItem>
        <MenuItem component={Link} to="/settings" onClick={() => setAnchor(null)}>
          <Icon name="settings" size={16} />
          Settings
        </MenuItem>
        <MenuItem onClick={() => logout()}>
          <Icon name="logout" size={16} />
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}

/** One page: icon + name in a 32-tall row; the selected one in the accent tint. Collapsed, the name fades and a tooltip says it. */
function RailItem({ to, icon, label, active, expanded }) {
  const { m3: c, tokens } = useTheme();
  return (
    <Tooltip title={expanded ? "" : label} placement="right" disableInteractive>
      <ButtonBase
        component={Link}
        to={to}
        aria-label={expanded ? undefined : label}
        aria-current={active ? "page" : undefined}
        sx={{
          width: "100%",
          minHeight: 32,
          flexShrink: 0,
          justifyContent: "flex-start",
          gap: 1.25,
          pl: `${ROW_INSET}px`,
          pr: 1.25,
          borderRadius: radius("sm"),
          typography: "bodyMedium",
          // Savvy Admin: every item in ink at the same weight; where you are is the ghost-2 fill.
          fontWeight: 400,
          textAlign: "left",
          overflow: "hidden",
          whiteSpace: "nowrap",
          color: active ? c.onSecondaryContainer : c.onSurface,
          bgcolor: active ? c.secondaryContainer : "transparent",
          transition: `background-color ${tokens.motion.effects}, color ${tokens.motion.effects}`,
          "& .rail-icon": { color: c.onSurface },
          "&:hover": { bgcolor: active ? c.secondaryContainer : c.hover },
          "&:active": { bgcolor: c.pressed },
          "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: -2 },
        }}
      >
        <Icon name={icon} size={18} className="rail-icon" />
        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", ...fade(expanded) }}>
          {label}
        </Box>
      </ButtonBase>
    </Tooltip>
  );
}

/**
 * Navigation rail (Savvy Admin's sidebar), open (236px: icons + names, upper-case group labels) or
 * closed (72px: the same icons, group labels become hairlines). Closed, a click on its empty
 * space opens it (no expand button, like Savvy Admin); a keyboard-only button does the same.
 */
function NavRail({ pathname, expanded, onToggle }) {
  const { m3: c } = useTheme();
  const active = findDestination(pathname);
  const current = findTab(active, pathname);
  const currentPath = current?.parent ?? current?.path;
  const group = (d) => {
    const tabs = d.tabs.filter((t) => !t.hidden);
    if (tabs.length === 1) return <RailItem key={d.id} to={tabs[0].path} icon={d.icon} label={d.label} active={active?.id === d.id} expanded={expanded} />;
    return (
      <Box key={d.id} role="group" aria-label={d.label} sx={{ display: "flex", flexDirection: "column", gap: "2px", mt: 1 }}>
        {/* The label's row keeps its height either way; closed, a short hairline takes its place. */}
        <Box sx={{ position: "relative", height: 28, display: "flex", alignItems: "flex-end", pb: 0.5 }}>
          <Typography variant="overline" component="div" sx={{ pl: "10px", color: c.onSurfaceVariant, whiteSpace: "nowrap", ...fade(expanded) }}>
            {d.label}
          </Typography>
          <Box aria-hidden sx={{ position: "absolute", left: 12, width: 24, top: "50%", borderTop: `1px solid ${c.border}`, ...fade(!expanded) }} />
        </Box>
        {tabs.map((t) => (
          <RailItem key={t.path} to={t.path} icon={t.icon} label={t.label} active={currentPath === t.path} expanded={expanded} />
        ))}
      </Box>
    );
  };
  return (
    <Box
      component="nav"
      aria-label="Main"
      // Closed: only the rail's own empty space opens it (React also bubbles clicks from the
      // account menu's portal).
      onClick={(e) => !expanded && e.currentTarget.contains(e.target) && !e.target.closest("a, button") && onToggle()}
      sx={{
        width: expanded ? EXPANDED_WIDTH : RAIL_WIDTH,
        transition: `width ${RAIL_EASE}`,
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: c.surfaceContainerLowest,
        borderRadius: radius("lg"),
        overflow: "hidden",
        cursor: expanded ? "default" : "e-resize",
        "& a, & button": { cursor: "pointer" },
      }}
    >
      {/* Header: the logo stays centred over the icons; the name and the close button fade. */}
      <Box sx={{ position: "relative", display: "flex", alignItems: "center", height: 56, px: 1.5, flexShrink: 0 }}>
        <Box component={Link} to="/" aria-label="Savvy home" sx={{ display: "flex", alignItems: "center", gap: 1.25, pl: `${ROW_INSET - 5}px`, color: "inherit", textDecoration: "none", whiteSpace: "nowrap" }}>
          <Box component="img" src={LOGO_URL} alt="" sx={{ width: 28, height: 28, display: "block", flexShrink: 0 }} />
          <Typography variant="titleMedium" component="span" sx={fade(expanded)}>
            Savvy
          </Typography>
        </Box>
        <Tooltip title={expanded ? "Collapse menu" : "Expand menu"} placement="right">
          <IconButton
            onClick={onToggle}
            aria-label={expanded ? "Collapse menu" : "Expand menu"}
            aria-expanded={expanded}
            tabIndex={0}
            sx={{
              position: "absolute",
              right: 12,
              ...fade(expanded),
              // Closed it's hidden, but a keyboard user tabbing to it still sees it.
              ...(!expanded && { pointerEvents: "none", "&.Mui-focusVisible": { opacity: 1, pointerEvents: "auto", right: 20, bgcolor: c.surfaceContainerLowest } }),
            }}
          >
            <Icon name={expanded ? "left_panel_close" : "left_panel_open"} size={20} />
          </IconButton>
        </Tooltip>
      </Box>
      {/* Every page scrolls together (when the window is short); the account stays at the bottom,
          and Settings is in its menu. */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none", px: 1.5, pb: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
        {DESTINATIONS.slice(0, -1).map(group)}
      </Box>
      <Box sx={{ px: 1.5, py: 1, borderTop: `1px solid ${c.border}` }}>
        <AccountMenu rail expanded={expanded} />
      </Box>
    </Box>
  );
}

function BottomBar({ activeId }) {
  return (
    <Box
      component="nav"
      aria-label="Main"
      sx={{
        position: "fixed",
        insetInline: 0,
        bottom: 0,
        height: BAR_HEIGHT,
        display: "grid",
        // Phones show at most five destinations (M3 navigation bar); Settings lives in the account menu.
        gridTemplateColumns: `repeat(${DESTINATIONS.length - 1}, 1fr)`,
        alignItems: "center",
        px: 0.5,
        pb: "env(safe-area-inset-bottom)",
        bgcolor: "background.paper",
        borderTop: (t) => `1px solid ${t.m3.border}`,
        zIndex: (t) => t.zIndex.appBar,
      }}
    >
      {DESTINATIONS.slice(0, -1).map((d) => (
        <Destination key={d.id} destination={d} active={d.id === activeId} />
      ))}
    </Box>
  );
}

export function AppShell({ children }) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("sm"));
  const { pathname } = useLocation();
  const active = findDestination(pathname);
  const c = theme.m3;
  // Expanded by default on desktop; the choice is remembered.
  const [expanded, setExpanded] = useState(() => {
    try {
      return localStorage.getItem(RAIL_KEY) !== "collapsed";
    } catch {
      return true;
    }
  });
  const toggle = () =>
    setExpanded((e) => {
      try {
        localStorage.setItem(RAIL_KEY, e ? "collapsed" : "expanded");
      } catch {
        // not remembered
      }
      return !e;
    });

  useEffect(() => {
    // Record pages set their own title.
    if (isRecordPage(pathname)) return;
    const tab = findTab(active, pathname);
    document.title = [tab?.label, active?.label, "Savvy Admin"].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(" · ");
  }, [active, pathname]);

  if (compact) {
    return (
      <Box sx={{ minHeight: "100dvh", bgcolor: c.surface, pb: `${BAR_HEIGHT}px` }}>
        <Box
          component="header"
          sx={{ display: "flex", alignItems: "center", gap: 1.5, height: 64, px: 2, position: "sticky", top: 0, zIndex: 2, bgcolor: c.surface }}
        >
          <Box component="img" src={LOGO_URL} alt="" sx={{ width: 32, height: 32 }} />
          <Typography variant="titleLarge" sx={{ flex: 1 }}>
            Savvy
          </Typography>
          <AccountMenu />
        </Box>
        <Box component="main">{children}</Box>
        <BottomBar activeId={active?.id} />
      </Box>
    );
  }

  return (
    <RailContext.Provider value={{ expanded, toggle }}>
    <Box sx={{ display: "flex", gap: `${GAP}px`, p: `${GAP}px`, height: "100dvh", boxSizing: "border-box", bgcolor: c.background, overflow: "hidden" }}>
      <NavRail pathname={pathname} expanded={expanded} onToggle={toggle} />
      <Box
        component="main"
        id="main-scroll"
        // The scrollbar keeps its room even on short pages, so content never shifts sideways when
        // a page grows past the window (or data lands).
        sx={{ flex: 1, minWidth: 0, bgcolor: c.surface, borderRadius: radius("lg"), overflowY: "auto", overflowX: "hidden", scrollbarGutter: "stable" }}
      >
        {children}
      </Box>
    </Box>
    </RailContext.Provider>
  );
}
