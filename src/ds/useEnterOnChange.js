import { useRef } from "react";

/**
 * "savvy-enter" once `value` (a view or range) has changed since the page opened, so switching
 * views animates in but opening the page doesn't.
 */
export function useEnterOnChange(value) {
  const initial = useRef(value);
  const changed = useRef(false);
  if (value !== initial.current) changed.current = true;
  return changed.current ? "savvy-enter" : undefined;
}
