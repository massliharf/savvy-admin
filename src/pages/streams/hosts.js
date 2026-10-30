import { useMemo } from "react";
import { useCustomMutation, useInvalidate, useList } from "@refinedev/core";
import { DP } from "../../providers";
import { useNotify } from "../../shell/notifications";

/**
 * A host as the app names them: the display name, else the name. Used everywhere a host is shown
 * (pills, pickers, rows, titles); the plain name only shows as a second line where it helps.
 */
export const hostLabel = (host) => host?.displayName || host?.name || "";
/** `{host}` in a text, filled with the host's name as the app shows it. */
export const fillHost = (text, host) => String(text ?? "").replace(/\{host\}/gi, host || "the host");
/** A stream's title as shown: its {host} filled with the stream's host. */
export const showTitle = (stream) => fillHost(stream?.title, stream?.hostDisplayName || stream?.hostName);
/** Every stream's title starts as this and always keeps {host}, so it names whoever hosts it. */
export const DEFAULT_TITLE = "You vs {host}";
export const hasHostTag = (text) => /\{host\}/i.test(String(text ?? ""));
/** Validation for a title field: it must keep {host}. */
export const titleRule = (v) => {
  const t = String(v ?? "").trim();
  if (!hasHostTag(t)) return "Keep {host} in the title";
  if (t.length > 100) return "Use 100 characters or fewer";
  return true;
};

/** Hosts from the Hosts library, sorted by the name the app shows. */
export function useHosts() {
  const { data } = useList({ resource: "Host", dataProviderName: DP.hosts, pagination: { mode: "off" } });
  return useMemo(() => [...(data?.data ?? [])].sort((a, b) => hostLabel(a).localeCompare(hostLabel(b))), [data]);
}

/** Moves upcoming streams to another host; resolves to the updated streams (or null). */
export function useChangeHost() {
  const notify = useNotify();
  const invalidate = useInvalidate();
  const { mutateAsync, isPending } = useCustomMutation();
  const changeHost = async (streamIds, host, message) => {
    try {
      const res = await mutateAsync({ url: "/TextSavvyStream/host", method: "post", values: { streamIds, hostId: host.id }, successNotification: false, errorNotification: false });
      invalidate({ resource: "TextSavvyStream", invalidates: ["list", "detail"] });
      notify(message ?? `Host changed to ${hostLabel(host)}`);
      return res.data;
    } catch {
      notify("Couldn't change the host", { variant: "error" });
      return null;
    }
  };
  return { changeHost, changingHost: isPending };
}
