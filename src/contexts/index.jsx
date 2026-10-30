import { createContext, useContext, useEffect, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { DEFAULT_TIMEZONE, TIMEZONE_KEY } from "../config";

dayjs.extend(utc);
dayjs.extend(timezone);

// ---------------------------------------------------------------- timezone (z$e / Ac)
const TimezoneContext = createContext(undefined);

export function TimezoneProvider({ children }) {
  const [timezone, setTz] = useState(DEFAULT_TIMEZONE);
  useEffect(() => {
    const saved = localStorage.getItem(TIMEZONE_KEY);
    if (saved) setTz(saved);
  }, []);
  const setTimezone = (tz) => {
    localStorage.setItem(TIMEZONE_KEY, tz);
    setTz(tz);
  };
  return <TimezoneContext.Provider value={{ timezone, setTimezone }}>{children}</TimezoneContext.Provider>;
}

export function useTimezone() {
  const ctx = useContext(TimezoneContext);
  if (!ctx) throw new Error("useTimezone must be used inside TimezoneProvider");
  return ctx;
}

export function useTimezoneFormat() {
  const { timezone } = useTimezone();
  return {
    timezone,
    toTimezone: (d) => dayjs(d).tz(timezone),
    formatDate: (d, fmt = "DD/MM/YYYY HH:mm:ss A") => dayjs.utc(d).tz(timezone).format(fmt),
  };
}

export { dayjs };
