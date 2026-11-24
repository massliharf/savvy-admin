import { Link, Outlet, useLocation } from "react-router";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import { findDestination, findTab } from "./nav";
import { useRail } from "./railContext";

/**
 * Page header above the active tab's page. With the rail collapsed: the destination's title and
 * its pages as tabs. With it expanded the rail lists every page, so the header is that page's name.
 */
export function SectionLayout() {
  const { pathname } = useLocation();
  const { expanded } = useRail();
  const destination = findDestination(pathname);
  const tab = findTab(destination, pathname);
  const visibleTabs = destination?.tabs.filter((t) => !t.hidden) ?? [];
  const showTabs = !expanded && visibleTabs.length > 1;
  const title = expanded && visibleTabs.length > 1 ? tab?.label ?? destination.label : destination?.label;

  return (
    <>
      {destination && (
        <Box component="header" sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 } }}>
          {/* Framer style: the page title is the Fresco heading, 16/550. */}
          <Typography variant="titleLarge" component="h1" color="text.primary" sx={{ mb: showTabs ? 1.5 : 0 }}>
            {title}
          </Typography>
          {showTabs && (
            <Tabs
              value={tab?.parent ?? tab?.path ?? false}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label={`${destination.label} sections`}
            >
              {visibleTabs.map((t) => (
                <Tab key={t.path} value={t.path} label={t.label} component={Link} to={t.path} />
              ))}
            </Tabs>
          )}
        </Box>
      )}
      {/* --page-lift: 1 when the page title is the header's last line (no tabs under it), so a
          header-like PageToolbar (description and/or "+ New", no search) can join the title like
          the GUU PageHeader: the description 4px under the title, the action on the title row. */}
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, "--page-lift": destination && !showTabs ? 1 : 0 }}>
        <Outlet />
      </Box>
    </>
  );
}
