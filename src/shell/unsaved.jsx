// Unsaved changes: a page or side sheet with edits says so (useUnsavedGuard), and leaving it for
// another page asks first. Reloading or closing the tab gets the browser's own prompt. (The
// router here isn't a data router, so there's no useBlocker: the navigator's push / go are held
// back while something is dirty.)
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { UNSAFE_NavigationContext as NavigationContext, useLocation } from "react-router";
import { ConfirmDialog } from "../ds/ConfirmDialog";

const UnsavedContext = createContext(null);

export function UnsavedProvider({ children }) {
  const { navigator } = useContext(NavigationContext);
  const { pathname } = useLocation();
  const here = useRef(pathname);
  here.current = pathname;
  // Who has unsaved edits right now (by hook id).
  const [dirtyIds, setDirtyIds] = useState(() => new Set());
  const dirty = dirtyIds.size > 0;
  // The navigation that is waiting for an answer.
  const [pending, setPending] = useState(null);
  // One navigation let through without asking (after a delete, say).
  const skip = useRef(false);

  const setDirty = useCallback((id, on) => {
    setDirtyIds((ids) => {
      if (ids.has(id) === on) return ids;
      const next = new Set(ids);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const skipNext = useCallback(() => {
    skip.current = true;
    // Only the navigation made right now; anything later asks again.
    setTimeout(() => (skip.current = false), 0);
  }, []);

  useEffect(() => {
    if (!dirty) return undefined;
    const { push, go } = navigator;
    const ask = (run) => {
      if (skip.current) {
        skip.current = false;
        run();
      } else setPending(() => run);
    };
    navigator.push = (to, ...rest) => {
      const target = typeof to === "string" ? to.split(/[?#]/)[0] : to?.pathname;
      // The same page with other query or hash (filters, an open sheet) isn't leaving.
      if (!target || target === here.current) push(to, ...rest);
      else ask(() => push(to, ...rest));
    };
    navigator.go = (delta) => ask(() => go(delta));
    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      navigator.push = push;
      navigator.go = go;
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [dirty, navigator]);

  const value = useMemo(() => ({ setDirty, skipNext }), [setDirty, skipNext]);
  return (
    <UnsavedContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={!!pending}
        title="Leave without saving?"
        tone="error"
        confirmLabel="Leave"
        cancelLabel="Keep editing"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const run = pending;
          setPending(null);
          run();
        }}
      >
        Your changes haven't been saved and will be lost.
      </ConfirmDialog>
    </UnsavedContext.Provider>
  );
}

/**
 * Marks this page or sheet as having unsaved edits while `dirty` is true. Returns `skipNext`: call
 * it right before a navigation that shouldn't ask (the record was just deleted).
 */
export function useUnsavedGuard(dirty) {
  const ctx = useContext(UnsavedContext);
  const id = useId();
  const setDirty = ctx?.setDirty;
  useEffect(() => {
    if (!setDirty) return undefined;
    setDirty(id, !!dirty);
    return () => setDirty(id, false);
  }, [setDirty, id, dirty]);
  return ctx?.skipNext ?? (() => {});
}
