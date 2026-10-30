import { createContext, useContext } from "react";

// Whether the navigation rail is expanded (labels and every page listed) or collapsed (icons).
// Kept in its own module so hot-reloading the shell doesn't replace the context object.
export const RailContext = createContext({ expanded: false, toggle: () => {} });
export const useRail = () => useContext(RailContext);
