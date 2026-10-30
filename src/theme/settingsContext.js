import { createContext, useContext } from "react";

// Kept in its own module so hot-reloading the theme files doesn't replace the context object.
export const ThemeSettingsContext = createContext(null);

export function useThemeSettings() {
  const ctx = useContext(ThemeSettingsContext);
  if (!ctx) throw new Error("useThemeSettings must be used inside ThemeSettingsProvider");
  return ctx;
}
