import { useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "./index";
import { ThemeSettingsContext, useThemeSettings } from "./settingsContext";

export { useThemeSettings };

const STORAGE_KEY = "savvy-theme";
// One light and one dark theme; the admin picks light, dark, or follows the system.
const DEFAULTS = { mode: "system" };

function readStored() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return { mode: ["light", "dark", "system"].includes(raw.mode) ? raw.mode : DEFAULTS.mode };
  } catch {
    return DEFAULTS;
  }
}

function useSystemDark() {
  const query = "(prefers-color-scheme: dark)";
  const [dark, setDark] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const onChange = (e) => setDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return dark;
}

export function ThemeSettingsProvider({ children }) {
  const [settings, setSettings] = useState(readStored);
  const systemDark = useSystemDark();
  const dark = settings.mode === "system" ? systemDark : settings.mode === "dark";

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage unavailable (private mode): the choice simply isn't remembered.
    }
  }, [settings]);

  const theme = useMemo(() => createAppTheme({ dark }), [dark]);

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.m3.surfaceContainer);
  }, [theme]);

  const value = useMemo(
    () => ({ ...settings, dark, update: (patch) => setSettings((s) => ({ ...s, ...patch })) }),
    [settings, dark],
  );

  return (
    <ThemeSettingsContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeSettingsContext.Provider>
  );
}
