// The signed-in team member and their role, as the rest of the dashboard asks for it.
import { useGetIdentity, useInvalidate, useInvalidateAuthStore, useList } from "@refinedev/core";
import { DP } from "../providers";
import { signInAs } from "./authProvider";

export const useTeam = () => {
  const { data, isLoading } = useList({ resource: "TeamMember", dataProviderName: DP.team, pagination: { mode: "off" } });
  return { team: data?.data ?? [], isLoading };
};

/**
 * `member` (from the team list, so a role changed on the Team page applies right away), its
 * `role`, and `isAdmin`. `role` is null until it's known (and for someone no longer on the team).
 */
export function useCurrentMember() {
  const { data: identity, isLoading: identityLoading } = useGetIdentity();
  const { team, isLoading } = useTeam();
  const member = (identity && team.find((m) => m.id === identity.id)) ?? identity ?? null;
  const role = member?.role ?? null;
  return { member, role, isAdmin: role === "Admin", isLoading: identityLoading || (isLoading && !identity) };
}

/** Prototype only: sign in as someone else on the team, without signing out. */
export function useSwitchMember() {
  const invalidateAuth = useInvalidateAuthStore();
  const invalidate = useInvalidate();
  return async (member) => {
    signInAs(member);
    await invalidateAuth();
    invalidate({ resource: "TeamMember", dataProviderName: DP.team, invalidates: ["list"] });
  };
}
