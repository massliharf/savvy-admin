// Top-level destinations (navigation rail / bar) and the tabs inside each one.
// A destination is active when the current path starts with one of its tab paths.
// `hidden` tabs are routed sub-pages: not shown as a tab, `parent` stays selected. Each page has
// its own icon for the expanded rail.
export const DESTINATIONS = [
  {
    // Running the show, in the order it happens: game modes (word sets, time slots, Fill month;
    // settings under Advanced) make the streams the schedule shows.
    id: "streams",
    label: "Streams",
    icon: "live_tv",
    tabs: [
      { icon: "calendar_month", label: "Schedule", path: "/streams" },
      { icon: "sports_esports", label: "Game modes", path: "/game-modes" },
    ],
  },
  {
    // The pieces streams reuse, in the order a stream uses them:
    // who hosts → who sponsors → polls & trivia during it → share cards and notifications around it.
    id: "library",
    label: "Library",
    icon: "library_books",
    tabs: [
      { icon: "mic", label: "Hosts", path: "/hosts" },
      { icon: "handshake", label: "Sponsors", path: "/sponsors" },
      { icon: "ballot", label: "Polls & trivia", path: "/polling" },
      { icon: "ios_share", label: "Share cards", path: "/share-cards" },
      { icon: "notifications", label: "Notifications", path: "/notifications" },
    ],
  },
  {
    // What brings players back between streams: seasons, the daily puzzle, referrals.
    id: "engagement",
    label: "Engagement",
    icon: "rocket_launch",
    tabs: [
      { icon: "emoji_events", label: "Seasons", path: "/seasons" },
      { icon: "extension", label: "Daily puzzle", path: "/daily-puzzle" },
      { icon: "group_add", label: "Referrals", path: "/referrals" },
    ],
  },
  {
    id: "users",
    label: "Users",
    icon: "group",
    tabs: [
      { icon: "group", label: "All users", path: "/user-management" },
      { icon: "payments", label: "Cashouts", path: "/account-balance" },
    ],
  },
  {
    id: "shop",
    label: "Shop",
    icon: "storefront",
    tabs: [
      { icon: "auto_awesome", label: "Spark packs", path: "/spark-packs" },
      { icon: "bolt", label: "Power-up packs", path: "/powerup-packs" },
      { icon: "checkroom", label: "Swag", path: "/savvy-swag" },
      { icon: "local_shipping", label: "Orders", path: "/swag-orders" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: "settings",
    tabs: [
      { icon: "palette", label: "Appearance", path: "/settings" },
      { icon: "code", label: "Developer tools", path: "/developer" },
      // Reached from Developer tools; highlights that tab instead of showing its own.
      { label: "Design system", path: "/design-system", hidden: true, parent: "/developer" },
    ],
  },
];

const matches = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`);

export function findDestination(pathname) {
  return DESTINATIONS.find((d) => d.tabs.some((t) => matches(pathname, t.path))) ?? null;
}

/** Single-record pages (own header, no section tabs, no "New stream" FAB). */
export const isRecordPage = (pathname) => [/^\/streams\/edit\/[^/]+$/, /^\/game-modes\/[^/]+$/].some((re) => re.test(pathname));

export function findTab(destination, pathname) {
  return destination?.tabs.find((t) => matches(pathname, t.path)) ?? null;
}
