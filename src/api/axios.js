import axios, { AxiosError } from "axios";
import { API, TOKEN_KEY, USE_MOCK } from "../config";
import { handleMockRequest } from "../mock/server";

// Shared axios instance (the original `Ko`). Same Bearer-token interceptor as production.
export const http = axios.create();

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

if (USE_MOCK) {
  http.defaults.adapter = async (config) => {
    const url = new URL(config.url, window.location.origin);
    const path = url.href.startsWith(API) ? url.href.slice(API.length).split("?")[0] : url.pathname;
    const query = url.searchParams;
    const res = await handleMockRequest({
      method: (config.method || "get").toLowerCase(),
      path,
      query,
      body: config.data,
    });
    // small latency so loading states are visible, like the real backend
    await new Promise((r) => setTimeout(r, 120));
    const headers = { "content-type": "application/json", ...(res.headers || {}) };
    // Copy like a real network round trip, so callers never share objects with the mock DB.
    let data = res.body != null && typeof res.body === "object" ? structuredClone(res.body) : res.body;
    if (config.responseType === "arraybuffer" && typeof data === "string") {
      data = new TextEncoder().encode(data).buffer;
    }
    const response = { data, status: res.status ?? 200, statusText: "", headers, config, request: {} };
    if (response.status >= 200 && response.status < 300) return response;
    throw new AxiosError(
      `Request failed with status code ${response.status}`,
      response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      {},
      response,
    );
  };
}
