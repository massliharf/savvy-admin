// Shared layout for record detail pages: sticky header, section menu with scroll-spy, content column.
import { Fragment, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "./Icon";
import { radius } from "../theme/tokens";

const scrollRoot = () => {
  const main = document.getElementById("main-scroll");
  return main && main.scrollHeight > main.clientHeight ? main : null;
};

/** Tracks which section is in view. `sections` = [{ id }]. */
export function useActiveSection(sections, ready) {
  const [active, setActive] = useState(sections[0].id);
  useEffect(() => {
    if (!ready) return undefined;
    const root = scrollRoot();
    // The last sections may be too short to reach the top; at the bottom, select the last one.
    const atBottom = () => {
      const el = root ?? document.documentElement;
      return el.scrollHeight - el.scrollTop - el.clientHeight < 4;
    };
    // The active section is the last one whose top has scrolled up to just under the sticky
    // header (section tops land at 96px when picked from the menu). Worked out from every
    // section's position on each scroll frame, so it can't lag behind.
    const LINE = 140;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (atBottom()) return setActive(sections.at(-1).id);
      const top = root ? root.getBoundingClientRect().top : 0;
      let current = sections[0].id;
      sections.forEach((s) => {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top - top <= LINE) current = s.id;
      });
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const target = root ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener("scroll", onScroll);
    };
    // Sections are static per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  const goTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return [active, goTo];
}

/** Section menu: vertical on large screens, a horizontal scrolling strip below that. */
export function SectionNav({ sections, active, onSelect, errorIds = [], warningIds = [], doneIds = [], label = "Sections" }) {
  const { m3: c, tokens, palette } = useTheme();
  return (
    <Box component="nav" aria-label={label} sx={{ display: "flex", flexDirection: { xs: "row", lg: "column" }, gap: "2px", overflowX: { xs: "auto", lg: "visible" }, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
      {sections.map((s, i) => {
        const on = active === s.id;
        // Sections with a `group` sit under its name (wide screens); a group of one is just set apart.
        const starts = s.group && s.group !== sections[i - 1]?.group;
        const many = starts && sections.filter((x) => x.group === s.group).length > 1;
        const error = errorIds.includes(s.id);
        const warning = !error && warningIds.includes(s.id);
        const done = !error && !warning && doneIds.includes(s.id);
        return (
          <Fragment key={s.id}>
          {starts && i > 0 && <Box aria-hidden sx={{ display: { xs: "none", lg: "block" }, height: many ? 0 : 8 }} />}
          {many && (
            <Typography variant="overline" color="text.secondary" component="div" sx={{ display: { xs: "none", lg: "block" }, px: 1.5, pt: i > 0 ? 1.5 : 0, pb: 0.25 }}>
              {s.group}
            </Typography>
          )}
          <ButtonBase
            onClick={() => onSelect(s.id)}
            aria-current={on ? "true" : undefined}
            sx={{
              justifyContent: "flex-start",
              gap: 1,
              height: 32,
              px: 1.5,
              flexShrink: 0,
              borderRadius: radius("sm"),
              typography: "labelLarge",
              fontWeight: on ? 600 : 500,
              color: on ? c.onSecondaryContainer : c.onSurfaceVariant,
              bgcolor: on ? c.secondaryContainer : "transparent",
              transition: `background-color ${tokens.motion.effects}`,
              "&:hover": { bgcolor: on ? c.secondaryContainer : "action.hover", color: on ? c.onSecondaryContainer : c.onSurface },
              "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: -2 },
            }}
          >
            <Icon name={s.icon} size={16} />
            <Box component="span" sx={{ flex: 1, textAlign: "left", whiteSpace: "nowrap" }}>
              {s.label}
            </Box>
            {(error || warning) && (
              <Box component="span" aria-label={error ? "Has errors" : "Needs attention"} sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: error ? c.error : "warning.main" }} />
            )}
            {/* Done: a green check (the side nav is where a section's state lives). */}
            {done && <Icon name="check_circle" size={16} fill aria-label="Done" style={{ color: palette.success.main }} />}
          </ButtonBase>
          </Fragment>
        );
      })}
    </Box>
  );
}

/** Sticky page header with a back button, optional media, title line, subtitle and actions. */
export function DetailHeader({ onBack, backLabel, media, title, badge, subtitle, actions }) {
  const { m3: c } = useTheme();
  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: { xs: 64, sm: 0 },
        zIndex: 3,
        bgcolor: c.surface,
        px: { xs: 2, sm: 3.5 },
        pt: { xs: 1, sm: 2.5 },
        pb: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        borderBottom: `1px solid ${c.border}`,
      }}
    >
      <Tooltip title={backLabel}>
        <IconButton aria-label={backLabel} onClick={onBack} edge="start">
          <Icon name="arrow_back" size={20} />
        </IconButton>
      </Tooltip>
      {media && <Box sx={{ display: { xs: "none", sm: "block" } }}>{media}</Box>}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="titleLarge" component="h1" noWrap sx={{ fontSize: 18, lineHeight: "27px", fontWeight: 500, letterSpacing: 0 }}>
            {title}
          </Typography>
          {badge}
        </Box>
        {subtitle && <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", color: "text.secondary", typography: "bodySmall" }}>{subtitle}</Box>}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>{actions}</Box>
    </Box>
  );
}

/** Two-column body: section menu + content. */
export function DetailBody({ nav, children }) {
  // Without `nav` (a page short enough to need no section menu) it's the content alone.
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: nav ? "200px minmax(0, 880px)" : "minmax(0, 880px)" }, gap: { xs: 2, lg: 3.5 }, px: { xs: 2, sm: 3.5 }, py: 3 }}>
      {nav && <Box sx={{ position: { lg: "sticky" }, top: { lg: 112 }, alignSelf: "start", mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 } }}>{nav}</Box>}
      <Box component="form" autoComplete="off" onSubmit={(e) => e.preventDefault()} sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, pb: 8 }}>
        {children}
      </Box>
    </Box>
  );
}

export function DetailSkeleton() {
  return (
    <Box sx={{ px: { xs: 2, sm: 4 }, py: 4, display: "flex", flexDirection: "column", gap: 2 }}>
      <Skeleton variant="rounded" width={320} height={40} />
      <Skeleton variant="rounded" width={220} height={20} />
      <Skeleton variant="rounded" height={320} sx={{ mt: 3, borderRadius: radius("lg") }} />
    </Box>
  );
}

/**
 * Group of FormSection cards the section nav points at. A group of several cards gets a heading;
 * a single card already carries the group's name.
 */
export function SectionGroup({ id, title, children }) {
  return (
    <Box id={id} sx={{ display: "flex", flexDirection: "column", gap: 2, scrollMarginTop: 96, "&:not(:first-of-type)": { mt: 3 } }}>
      {title && (
        <Typography variant="overline" component="h2" color="text.secondary" sx={{ px: 0.5 }}>
          {title}
        </Typography>
      )}
      {children}
    </Box>
  );
}
