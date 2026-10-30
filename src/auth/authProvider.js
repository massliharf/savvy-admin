// Auth provider — same contract as production (m5e). Production signs in with Firebase
// email/password and stores the Firebase ID token in localStorage["auth-token"]; access is
// granted only when the token's custom `role` claim is "admin".
// The clone mints an unsigned token with the same claims so check()/getIdentity() run the
// original decoding logic unchanged. Any email + password logs in as admin.
import { jwtDecode } from "jwt-decode";
import { TOKEN_KEY } from "../config";

const b64url = (obj) =>
  btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

function mintToken(email) {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    role: "Admin",
    user_id: "mock-admin-" + btoa(email).replace(/[^a-zA-Z0-9]/g, "").slice(0, 12),
    email,
    iat: nowSec,
    exp: nowSec + 60 * 60 * 24 * 7,
  };
  return `${b64url({ alg: "none", typ: "JWT" })}.${b64url(payload)}.`;
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
      localStorage.setItem(TOKEN_KEY, mintToken(email));
      return { success: true, redirectTo: "/streams" };
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
    return String(payload.role).toLowerCase() === "admin" ? { authenticated: true } : failure;
  },
  getPermissions: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? [String(jwtDecode(token).role).toLowerCase()] : null;
  },
  getIdentity: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const { user_id, email } = jwtDecode(token);
    return { id: user_id, email };
  },
};
