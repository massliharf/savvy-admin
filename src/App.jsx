import { Refine, Authenticated } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { SnackbarHost, useNotificationProvider } from "./shell/notifications";
import routerBindings, {
  CatchAllNavigate,
  NavigateToResource,
} from "@refinedev/react-router";
import { BrowserRouter, HashRouter, Link, Navigate, Outlet, Route, Routes, useParams } from "react-router";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import { EmptyState } from "./ds/EmptyState";


import { http } from "./api/axios";
import { buildDataProviders, DP } from "./providers";
import { authProvider } from "./auth/authProvider";
import { TimezoneProvider } from "./contexts";
import { ThemeSettingsProvider } from "./theme/ThemeSettings";
import { AppShell } from "./shell/AppShell";
import { UnsavedProvider } from "./shell/unsaved";
import { SectionLayout } from "./shell/SectionLayout";
import AppearancePage from "./pages/settings/appearance";
import DesignSystemPage from "./pages/settings/designSystem";
import GameModeDetail from "./pages/gameModes/detail";
import GameModesPage from "./pages/gameModes/howToPlay";
import PowerUpsPage from "./pages/gameModes/powerUps";
import HostsPage from "./pages/library/hosts";
import GameSetsPage from "./pages/streams/games";
import WordSetsPage from "./pages/streams/wordSetsPage";
import SponsorsPage from "./pages/library/sponsors";

import StreamList from "./pages/streams/list";
import StreamDetail from "./pages/streams/detail";
import LoginPage from "./pages/login";
import UsersPage from "./pages/users/users";
import CashoutsPage from "./pages/users/cashouts";
import DeveloperPage from "./pages/settings/developer";
import SparkPacksPage from "./pages/shop/sparkPacks";
import PowerupPacksPage from "./pages/shop/powerupPacks";
import SwagPage from "./pages/shop/swag";
import OrdersPage from "./pages/shop/orders";
import SeasonsPage from "./pages/liveops/seasons";
import PollsPage from "./pages/liveops/polls";
import NotificationsPage, { ScoringPage } from "./pages/liveops/presets";
import ReferralsPage, { ShareCardsPage } from "./pages/liveops/sharing";
import DailyPuzzlePage from "./pages/liveops/dailyPuzzle";

const dataProvider = buildDataProviders(http);

function NotFound() {
  return (
    <EmptyState icon="explore_off" title="Page not found" description="This address doesn't exist in the dashboard.">
      <Button variant="tonal" component={Link} to="/streams">
        Go to streams
      </Button>
    </EmptyState>
  );
}

// Old edit links (/user-management/edit/:id) open the new user page.
function LegacyUserRedirect() {
  const { id } = useParams();
  return <Navigate to={`/user-management/${id}`} replace />;
}

// The single-file HTML preview runs from file:// or an artifact host, so it uses hash routing.
// Hash routing where the app is served from a file or a sub-path (single file, GitHub Pages).
const Router = import.meta.env.MODE === "single" || import.meta.env.MODE === "pages" ? HashRouter : BrowserRouter;

// Refine resources: route patterns and the data provider each one uses.
const resources = [
  { name: "TextSavvyStream", list: "/streams", create: "/streams/create", edit: "/streams/edit/:id", meta: { label: "Streams" } },
  { name: "Bundle", list: "/game-sets", edit: "/game-sets/:id", meta: { label: "Game sets", dataProviderName: DP.bundles } },
  { name: "WordSet", list: "/word-sets", meta: { dataProviderName: DP.wordSets } },
  { name: "ScoringPreset", list: "/scoring", meta: { dataProviderName: DP.scoringPresets } },
  { name: "GameMode", list: "/game-modes", meta: { dataProviderName: DP.gameModes } },
  { name: "PowerUp", list: "/power-ups", meta: { dataProviderName: DP.powerUps } },
  { name: "Host", list: "/hosts", meta: { dataProviderName: DP.hosts } },
  { name: "Sponsor", list: "/sponsors", meta: { dataProviderName: DP.sponsors } },
  { name: "Season", list: "/seasons", meta: { dataProviderName: DP.season } },
  { name: "DailyPuzzleRewardConfig", list: "/daily-puzzle", meta: { dataProviderName: DP.rewards } },
  { name: "Poll", list: "/polling", meta: { dataProviderName: DP.polls } },
  { name: "ShareableCardConfig", list: "/share-cards", meta: { dataProviderName: DP.shareableCardConfig } },
  { name: "SharePreset", list: "/share-cards", meta: { dataProviderName: DP.sharePresets } },
  { name: "AppCardPreset", list: "/share-cards", meta: { dataProviderName: DP.appCardPresets } },
  { name: "PuzzleCardPreset", list: "/share-cards", meta: { dataProviderName: DP.puzzleCardPresets } },
  { name: "NotificationPreset", list: "/notifications", meta: { dataProviderName: DP.notificationPresets } },
  { name: "UserManagement", list: "/user-management", edit: "/user-management/:id", meta: { dataProviderName: DP.userManagement } },
  { name: "AccountBalanceManagement", list: "/account-balance", meta: { dataProviderName: DP.cashWins } },
  { name: "SparkPack", list: "/spark-packs", meta: { dataProviderName: DP.shop } },
  { name: "PowerupPack", list: "/powerup-packs", meta: { dataProviderName: DP.powerupPacks } },
  { name: "SwagItem", list: "/savvy-swag", meta: { dataProviderName: DP.savvySwag } },
  { name: "SwagOrder", list: "/swag-orders", meta: { dataProviderName: DP.swagOrders } },
  { name: "Events", list: "/developer", meta: { dataProviderName: DP.amplitudeEvent } },
];

export default function App() {
  return (
    <Router>
        <RefineKbarProvider>
          <ThemeSettingsProvider>
            <CssBaseline />
            <SnackbarHost>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimezoneProvider>
                <Refine
                  dataProvider={dataProvider}
                  notificationProvider={useNotificationProvider}
                  routerProvider={routerBindings}
                  authProvider={authProvider}
                  resources={resources}
                  options={{
                    syncWithLocation: true,
                    // Unsaved changes are guarded by UnsavedProvider (shell/unsaved.jsx).
                    warnWhenUnsavedChanges: false,
                    useNewQueryKeys: true,
                    projectId: "foqooB-QJBW4o-Tx2gzQ",
                    disableTelemetry: true,
                  }}
                >
                  <Routes>
                    <Route
                      element={
                        <Authenticated key="authenticated-inner" fallback={<CatchAllNavigate to="/login" />}>
                          <UnsavedProvider>
                            <AppShell>
                              <Outlet />
                            </AppShell>
                          </UnsavedProvider>
                        </Authenticated>
                      }
                    >
                      <Route index element={<NavigateToResource resource="TextSavvyStream" />} />
                      <Route path="/streams/edit/:id" element={<StreamDetail />} />
                      <Route path="/game-sets/:id" element={<GameModeDetail />} />
                      {/* The old addresses of Game sets (Bundles). */}
                      <Route path="/bundles/*" element={<Navigate to="/game-sets" replace />} />
                      <Route path="/user-management/edit/:id" element={<LegacyUserRedirect />} />
                      <Route element={<SectionLayout />}>
                      {/* One route for the list and a user's sheet over it, so the list (search, filters, page) stays mounted. */}
                      <Route path="/user-management/:id?" element={<UsersPage />} />
                      <Route path="/streams">
                        <Route index element={<StreamList />} />
                        <Route path="create" element={<StreamList />} />
                      </Route>
                      <Route path="/user-roles" element={<Navigate to="/user-management" replace />} />
                      <Route path="/account-balance" element={<CashoutsPage />} />
                      <Route path="/events/create" element={<Navigate to="/developer" replace />} />
                      <Route path="/developer" element={<DeveloperPage />} />
                      <Route path="/settings" element={<AppearancePage />} />
                      <Route path="/design-system" element={<DesignSystemPage />} />
                      <Route path="/game-sets" element={<GameSetsPage />} />
                      <Route path="/word-sets" element={<WordSetsPage />} />
                      <Route path="/scoring" element={<ScoringPage />} />
                      <Route path="/game-modes" element={<GameModesPage />} />
                      <Route path="/power-ups" element={<PowerUpsPage />} />
                      <Route path="/games" element={<Navigate to="/game-sets" replace />} />
                      <Route path="/words" element={<Navigate to="/word-sets" replace />} />
                      <Route path="/hosts" element={<HostsPage />} />
                      <Route path="/sponsors" element={<SponsorsPage />} />
                      <Route path="/how-to-play/*" element={<Navigate to="/game-modes" replace />} />
                      <Route path="/share-config" element={<Navigate to="/share-cards" replace />} />
                      <Route path="/rewards" element={<Navigate to="/daily-puzzle" replace />} />
                      <Route path="/daily-puzzle" element={<DailyPuzzlePage />} />
                      <Route path="/referrals" element={<ReferralsPage />} />
                      <Route path="/sharing" element={<Navigate to="/share-cards" replace />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/share-cards" element={<ShareCardsPage />} />
                      <Route path="/presets" element={<Navigate to="/notifications" replace />} />
                      <Route path="/polling" element={<PollsPage />} />
                      <Route path="/polling/export" element={<Navigate to="/polling" replace />} />
                      <Route path="/spark-packs" element={<SparkPacksPage />} />
                      <Route path="/spark-packs/*" element={<Navigate to="/spark-packs" replace />} />
                      <Route path="/powerup-packs" element={<PowerupPacksPage />} />
                      <Route path="/powerup-packs/*" element={<Navigate to="/powerup-packs" replace />} />
                      <Route path="/savvy-swag" element={<SwagPage />} />
                      <Route path="/savvy-swag/*" element={<Navigate to="/savvy-swag" replace />} />
                      <Route path="/swag-orders" element={<OrdersPage />} />
                      <Route path="/seasons" element={<SeasonsPage />} />
                      <Route path="/seasons/*" element={<Navigate to="/seasons" replace />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Route>
                    <Route
                      element={
                        <Authenticated key="authenticated-outer" fallback={<Outlet />}>
                          <NavigateToResource />
                        </Authenticated>
                      }
                    >
                      <Route path="/login" element={<LoginPage />} />
                    </Route>
                  </Routes>
                  <RefineKbar />
                </Refine>
              </TimezoneProvider>
            </LocalizationProvider>
            </SnackbarHost>
          </ThemeSettingsProvider>
        </RefineKbarProvider>
    </Router>
  );
}
