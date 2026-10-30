// Backend base URL, set per deployment (VITE_API_URL). This prototype runs on the mock backend.
export const REAL_API = import.meta.env.VITE_API_URL ?? "https://api.example.com/api/v1";

// When true (default), every request is answered by the in-browser mock backend
// (src/mock/*). Set VITE_USE_MOCK=false to hit the real backend instead.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

export const API = REAL_API;

export const TOKEN_KEY = "auth-token";
export const TIMEZONE_KEY = "admin-timezone";
export const DEFAULT_TIMEZONE = "America/Los_Angeles";


