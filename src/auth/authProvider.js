// Auth provider — same contract as production (m5e). Production signs in with Firebase
// email/password and stores the Firebase ID token in localStorage["auth-token"]; the token's
// custom `role` claim says what the person may do.
// The clone mints an unsigned token with the same claims so check()/getIdentity() run the
// original decoding logic unchanged. Any email + password signs in: someone on the team
// (Settings › Team) gets their role there; any other email joins the team as an admin.
import { jwtDecode } from "jwt-decode";
import { API, TOKEN_KEY } from "../config";
import { http } from "../api/axios";

// The roles that can use this dashboard (a Savvy account's roles, minus Player).
const STAFF_ROLES = ["admin", "internal", "host"];

const b64url = (obj) =>
  btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

function mintToken(member) {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    role: member.role,
    member_id: member.id,
    user_id: member.id,
    email: member.email,
    name: member.name,
    iat: nowSec,
    exp: nowSec + 60 * 60 * 24 * 7,
  };
  return `${b64url({ alg: "none", typ: "JWT" })}.${b64url(payload)}.`;
}

/** Prototype only: sign in as another team member (to see the dashboard with their role). */
export function signInAs(member) {
  localStorage.setItem(TOKEN_KEY, mintToken(member));
}

const failure = {
  authenticated: false,
  redirectTo: "/login",
  logout: true,
  error: { message: "Not enought permissions", name: "Unauthorized" },
};

export const authProvider = {
  login: async ({ email, password }) => {
    if (email && password) {
      try {
        const { data: member } = await http.post(`${API}/admin/team/sign-in`, { email });
        signInAs(member);
        return { success: true, redirectTo: "/streams" };
      } catch (e) {
        return { success: false, error: { name: "LoginError", message: e?.response?.data?.detail ?? "Couldn't sign in" } };
      }
    }
    return { success: false, error: { name: "LoginError", message: "Invalid username or password" } };
  },
  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    return { success: true, redirectTo: "/login" };
  },
  onError: async (error) => {
    console.error(error);
    return { error };
  },
  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return failure;
    let payload;
    try {
      payload = jwtDecode(token);
    } catch {
      payload = null;
    }
    if (!payload) {
      console.error("There is no roles");
      return failure;
    }
    if (payload.exp !== undefined && payload.exp < Date.now() / 1000) {
      console.error("Token expired");
      return failure;
    }
    return STAFF_ROLES.includes(String(payload.role).toLowerCase()) ? { authenticated: true } : failure;
  },
  getPermissions: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? [String(jwtDecode(token).role).toLowerCase()] : null;
  },
  // The signed-in team member, with their current role (it can change on the Team page after the
  // token was minted, so it's read from the team, not the token).
  getIdentity: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const { user_id, member_id, email, name } = jwtDecode(token);
    try {
      const { data: member } = await http.get(`${API}/admin/team/me`);
      // A session from before the team existed: its token now names the member.
      if (!member_id) signInAs(member);
      return { id: member.id, email: member.email, name: member.name, role: member.role };
    } catch {
      return { id: member_id ?? user_id, email, name: name ?? email, role: null };
    }
  },
};
