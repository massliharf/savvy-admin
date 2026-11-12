// Data providers ported 1:1 from the production bundle. Every provider receives the
// shared axios instance (src/api/axios.js), which in mock mode is served by src/mock.
import queryString from "query-string";
import axios from "axios";
import { API } from "../config";
import { toFormData } from "../utils/formData";

export const DP = {
  userManagement: "userManagement",
  userRoles: "userRoles",
  cashWins: "cashWins",
  userProfiles: "userProfiles",
  amplitudeEvent: "amplitudeEvent",
  howToPlay: "howToPlay",
  shareableCardConfig: "shareableCardConfig",
  shop: "shop",
  powerupPacks: "powerupPacks",
  savvySwag: "savvySwag",
  swagOrders: "swagOrders",
  season: "season",
  rewards: "rewards",
  polls: "polls",
  gameModes: "gameModes",
  bundles: "bundles",
  powerUps: "powerUps",
  scoringPresets: "scoringPresets",
  hosts: "hosts",
  sponsors: "sponsors",
  scheduleSlots: "scheduleSlots",
  wordSets: "wordSets",
  sharePresets: "sharePresets",
  notificationPresets: "notificationPresets",
  appCardPresets: "appCardPresets",
  puzzleCardPresets: "puzzleCardPresets",
};

const ok = (res) => {
  if (res.status < 200 || res.status > 299) throw res;
  return res;
};
const notImpl = (msg = "Not implemented") => async () => {
  throw new Error(msg);
};

// ---------------------------------------------------------------- default (streams)
export const defaultProvider = (http) => ({
  getApiUrl: () => API,
  custom: async ({ url, method, headers, payload }) => ({
    data: (await http({ url: `${API}${url}`, method, headers, data: payload })).data,
  }),
  getList: async ({ pagination, filters, sorters, resource }) => {
    let search = "",
      status,
      startDate = "";
    filters?.forEach?.((f) => {
      if (f.field === "title" && f.value !== "" && f.value !== undefined) search = f.value;
      if (f.field === "status" && f.value !== undefined && f.value !== "") status = f.value;
      if (f.field === "startDate" && f.value) startDate = f.value;
    });
    const qs = [
      `pageNumber=${pagination?.current ?? 1}`,
      `pageSize=${pagination?.pageSize ?? 25}`,
      `isDescending=${sorters?.[0]?.order === "desc" ? "true" : "false"}`,
      search ? `searchTerm=${encodeURIComponent(search)}` : "",
      status !== undefined ? `status=${status}` : "",
      startDate ? `startDate=${encodeURIComponent(startDate)}` : "",
    ]
      .filter(Boolean)
      .join("&");
    const res = ok(await http.get(`${API}/${resource}?${qs}`));
    const p = res.data;
    return {
      data: Array.isArray(p) ? p : p.streams || p.data || p,
      total: p.total || p.totalRecords || (Array.isArray(p) ? p.length : 0),
    };
  },
  create: async ({ resource, variables }) => ({
    data: (await http.post(`${API}/${resource}`, toFormData(variables), { headers: {} })).data,
  }),
  update: async ({ resource, id, variables, meta }) => {
    const { method, json } = meta ?? {};
    const res = ok(
      await http[method ?? "put"](`${API}/${resource}/${id}`, json ? variables : toFormData(variables), {
        headers: {},
      }),
    );
    return { data: res.data };
  },
  deleteOne: async ({ resource, id, meta }) => {
    const { data } = await http.delete(`${API}/${resource}/${id}`, { headers: meta?.headers });
    return { data };
  },
  getOne: async ({ resource, id }) => {
    const res = ok(await http.get(`${API}/${resource}/${id}`));
    return { data: res.data };
  },
  getMany: async ({ resource, ids, meta }) => {
    const { headers, method } = meta ?? {};
    const base = `${API}/${resource}`;
    const url = Object.keys(ids).length ? `${base}?${queryString.stringify({ streamId: ids })}` : base;
    const { data } = await http[method ?? "get"](url, { headers });
    return { data };
  },
});

// ---------------------------------------------------------------- user management
export const userManagementProvider = (http) => ({
  getApiUrl: () => API,
  getList: async ({ resource, pagination, filters }) => {
    let term = "",
      status,
      region = "";
    filters?.forEach?.((f) => {
      if (f.field === "SearchTerm" && f.value !== "" && f.value !== undefined) term = f.value;
      if (f.field === "UserAccountStatus" && f.value !== undefined && f.value !== "") status = f.value;
      if (f.field === "RegionCode" && f.value) region = f.value;
    });
    const qs = [
      `pageSize=${pagination?.pageSize ?? 25}`,
      `pageNumber=${pagination?.current ?? 1}`,
      `SearchTerm=${encodeURIComponent(term)}`,
      status !== undefined ? `UserAccountStatus=${status}` : "",
      region ? `RegionCode=${region}` : "",
    ]
      .filter(Boolean)
      .join("&");
    const res = ok(await http.get(`${API}/${resource}?${qs}`));
    return { data: res.data.records, total: res.data.totalRecords };
  },
  getOne: async ({ resource, id, meta }) => {
    const { headers, method } = meta ?? {};
    const res = ok(await http[method ?? "get"](`${API}/${resource}/${id}`, { headers }));
    return { data: res.data };
  },
  create: notImpl(),
  update: async ({ resource, id, variables, meta }) => {
    const { headers, method } = meta ?? {};
    const res = ok(await http[method ?? "patch"](`${API}/${resource}/${id}`, variables, { headers }));
    return { data: res.data };
  },
  deleteOne: notImpl(),
  updateMany: async ({ ids, resource, variables }) => {
    const res = ok(await http.patch(`${API}/${resource}?`, { ids, ...variables }));
    const s = res.data;
    return { data: s.items ?? s, total: s.total ?? s.length ?? 0 };
  },
});

// ---------------------------------------------------------------- user roles
export const userRolesProvider = (http) => ({
  getApiUrl: () => API,
  custom: async ({ url, method, headers, payload }) => {
    try {
      const res = await http({ url: `${API}${url}`, method, headers, data: payload });
      if (res.status < 200 || res.status > 299) throw new Error(`HTTP error! status: ${res.status}`);
      return { data: res.data };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Custom request failed");
    }
  },
  getList: notImpl(),
  getOne: notImpl(),
  create: notImpl(),
  update: notImpl(),
  deleteOne: notImpl(),
});

// ---------------------------------------------------------------- cash wins
export const cashWinsProvider = (http) => ({
  getApiUrl: () => API,
  getList: async ({ resource, filters, pagination, meta }) => {
    let term = "",
      status;
    filters?.forEach?.((f) => {
      if (f.field === "SearchTerm" && f.value !== "" && f.value !== undefined) term = f.value;
      if (f.field === "AccountbalanceHistoryStatus" && f.value !== undefined && f.value !== "")
        status = f.value;
    });
    const qs = [
      `pageSize=${pagination?.pageSize ?? 25}`,
      `pageNumber=${pagination?.current ?? 1}`,
      `SearchTerm=${encodeURIComponent(term)}`,
      status !== undefined ? `AccountbalanceHistoryStatus=${status}` : "",
    ]
      .filter(Boolean)
      .join("&");
    const res = await http[meta?.method ?? "get"](`${API}/${resource}?${qs}`, { headers: meta?.headers });
    return { data: res.data.records, total: res.data.totalRecords };
  },
  update: async ({ resource, id, variables, meta }) => {
    const method = meta?.method ?? "patch";
    const url =
      variables && Object.keys(variables).length
        ? `${API}/${resource}/${id}?${queryString.stringify(variables)}`
        : `${API}/${resource}`;
    // Original quirk: the options object is passed as the request body.
    const res = await http[method](url, { headers: meta?.headers });
    return { data: res.data };
  },
  getOne: notImpl("Function not implemented."),
  create: notImpl("Function not implemented."),
  deleteOne: notImpl("Function not implemented."),
});

// ---------------------------------------------------------------- user profiles
export const userProfilesProvider = (http) => ({
  getApiUrl: () => API,
  getMany: async ({ resource, ids, meta }) => {
    const base = `${API}/${resource}`;
    const url = ids.length ? `${base}?${queryString.stringify({ userIds: ids })}` : base;
    const res = await http[meta?.method ?? "get"](url, { headers: meta?.headers });
    return { data: res.data };
  },
  getList: notImpl("Function not implemented."),
  getOne: notImpl("Function not implemented."),
  create: notImpl("Function not implemented."),
  update: notImpl("Function not implemented."),
  deleteOne: notImpl("Function not implemented."),
});

// ---------------------------------------------------------------- amplitude events
// The original calls @amplitude/analytics-browser (identify + track). The clone records
// events into the mock backend log instead so nothing leaves the browser.
export const amplitudeEventProvider = (http) => ({
  create: async ({ variables }) => {
    await http.post(`${API}/__amplitude/track`, variables);
    return { data: variables };
  },
  getApiUrl: () => {
    throw new Error("Function not implemented.");
  },
  getList: notImpl("Function not implemented."),
  getOne: notImpl("Function not implemented."),
  update: notImpl("Function not implemented."),
  deleteOne: notImpl("Function not implemented."),
});

// ---------------------------------------------------------------- singleton configs
const singleton = (http, path, fallback, { multipart }) => ({
  getApiUrl: () => API,
  getOne: async () => {
    try {
      const res = ok(await http.get(`${API}${path}`));
      return { data: { ...res.data, id: "default" } };
    } catch (e) {
      if (e?.response?.status === 404 || e?.status === 404) return { data: { ...fallback(), id: "default" } };
      throw e;
    }
  },
  update: async ({ variables }) => {
    const body = multipart ? toFormData(variables) : variables;
    const res = await http.put(`${API}${path}`, body, multipart ? { headers: {} } : undefined);
    return { data: res.data };
  },
  getList: notImpl(),
  create: notImpl(),
  deleteOne: notImpl(),
});

export const howToPlayProvider = (http) =>
  singleton(http, "/admin/howtoplay", () => ({ powerUps: [] }), { multipart: true });

export const shareableCardConfigProvider = (http) =>
  singleton(
    http,
    "/admin/share-config",
    () => ({
      sparksPerReferral: 0,
      dailyPuzzleSuccess: { title: null },
      dailyPuzzleFail: { title: null },
      profileShare: { title: null, subtitle: null },
      dailyPuzzleStats: { title: null },
      liveShowStats: { title: null },
    }),
    { multipart: false },
  );

export const rewardsProvider = (http) =>
  singleton(http, "/admin/reward-config", () => ({ dailyPuzzleReward: null }), { multipart: false });

// ---------------------------------------------------------------- shop: spark packs
const listShape = (d) => {
  const data = Array.isArray(d) ? d : d.items ?? d.data ?? d;
  return { data, total: d.total ?? d.totalRecords ?? (Array.isArray(d) ? d.length : 0) };
};

export const sparkPackProvider = (http) => {
  const base = `${API}/admin/spark-packs`;
  return {
    getApiUrl: () => API,
    getList: async ({ pagination }) => {
      const res = ok(
        await http.get(
          `${base}?pageNumber=${pagination?.current ?? 1}&pageSize=${pagination?.pageSize ?? 100}&isDescending=false`,
        ),
      );
      return listShape(res.data);
    },
    create: async ({ variables }) => ({ data: (await http.post(base, toFormData(variables), { headers: {} })).data }),
    getOne: async ({ id }) => ({ data: ok(await http.get(`${base}/${id}`)).data }),
    update: async ({ id, variables }) => ({
      data: ok(await http.patch(`${base}/${id}`, toFormData(variables), { headers: {} })).data,
    }),
    deleteOne: async ({ id }) => ({ data: (await http.delete(`${base}/${id}`)).data }),
    getMany: notImpl(),
  };
};

// ---------------------------------------------------------------- shop: powerup packs
export const powerupPackFormData = (values) => {
  const { contents, contentIconFiles, ...rest } = values;
  const fd = toFormData(rest);
  fd.append("contentsJson", JSON.stringify(contents ?? []));
  contentIconFiles?.forEach((f, i) => {
    if (f instanceof File) fd.append(`contentIcon[${i}]`, f);
  });
  return fd;
};

export const powerupPackProvider = (http) => {
  const base = `${API}/admin/powerup-packs`;
  return {
    getApiUrl: () => API,
    getList: async () => {
      const d = ok(await http.get(base)).data;
      const data = Array.isArray(d) ? d : d.items ?? d.data ?? d;
      return { data, total: data.length };
    },
    getOne: async ({ id }) => ({ data: ok(await http.get(`${base}/${id}`)).data }),
    create: async ({ variables }) => ({
      data: (await http.post(base, powerupPackFormData(variables), { headers: {} })).data,
    }),
    update: async ({ id, variables }) => ({
      data: ok(await http.put(`${base}/${id}`, powerupPackFormData(variables), { headers: {} })).data,
    }),
    deleteOne: async ({ id }) => ({ data: (await http.delete(`${base}/${id}`)).data }),
    getMany: notImpl(),
  };
};

// ---------------------------------------------------------------- shop: savvy swag
const normalizeSwag = (r) =>
  Array.isArray(r.imageUrls) && r.imageUrls.length ? r : { ...r, imageUrls: r.imageUrl ? [r.imageUrl] : [] };

export const savvySwagProvider = (http) => {
  const base = `${API}/admin/savvy-swag`;
  return {
    getApiUrl: () => API,
    getList: async () => {
      const d = ok(await http.get(base)).data;
      const arr = (Array.isArray(d) ? d : d.items ?? d.data ?? []).map(normalizeSwag);
      return { data: arr, total: arr.length };
    },
    getOne: async ({ id }) => ({ data: normalizeSwag(ok(await http.get(`${base}/${id}`)).data) }),
    create: async ({ variables }) => ({ data: (await http.post(base, toFormData(variables), { headers: {} })).data }),
    update: async ({ id, variables }) => ({
      data: ok(await http.patch(`${base}/${id}`, toFormData(variables), { headers: {} })).data,
    }),
    deleteOne: async ({ id }) => ({ data: (await http.delete(`${base}/${id}`)).data }),
    getMany: notImpl(),
  };
};

// ---------------------------------------------------------------- shop: swag orders
export const SWAG_ORDERS_EXPORT = "/admin/swag-orders/export";

export function parseFilename(disposition, fallback) {
  if (!disposition) return fallback;
  const star = /filename\*\s*=\s*[^']*'[^']*'([^;]+)/i.exec(disposition);
  if (star) {
    let decoded = null;
    try {
      decoded = decodeURIComponent(star[1].trim());
    } catch {
      decoded = null;
    }
    if (decoded) return decoded.replace(/^.*[\\/]/, "").trim() || fallback;
  }
  const plain = /filename\s*=\s*("([^"]*)"|[^;]+)/i.exec(disposition);
  if (plain) return (plain[2] ?? plain[1]).trim().replace(/^.*[\\/]/, "").trim() || fallback;
  return fallback;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  try {
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
  } finally {
    a.remove();
    URL.revokeObjectURL(url);
  }
}

const filterValue = (filters, field) => {
  const f = filters?.find((x) => "field" in x && x.field === field);
  const v = f && "value" in f ? f.value : undefined;
  return v == null ? "" : String(v);
};
const endOfDay = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T23:59:59.999Z` : s);
export const swagOrderQuery = (filters) => {
  const from = filterValue(filters, "fromDate");
  const to = filterValue(filters, "toDate");
  const delivered = filterValue(filters, "isDelivered");
  return [
    `searchTerm=${encodeURIComponent(filterValue(filters, "searchTerm"))}`,
    from ? `fromDate=${encodeURIComponent(from)}` : "",
    to ? `toDate=${encodeURIComponent(endOfDay(to))}` : "",
    delivered ? `isDelivered=${encodeURIComponent(delivered)}` : "",
  ]
    .filter(Boolean)
    .join("&");
};

const blobCustom = (http, fallbackName) => async ({ url, method, headers, payload, meta }) => {
  const isBlob = meta?.responseType === "blob";
  const res = await http.request({
    url: url.startsWith("http") ? url : `${API}${url}`,
    method,
    headers,
    data: payload,
    responseType: isBlob ? "arraybuffer" : undefined,
  });
  if (!isBlob) return { data: res.data };
  const type = res.headers["content-type"];
  return {
    data: {
      blob: new Blob([res.data], { type }),
      filename: parseFilename(res.headers["content-disposition"], fallbackName),
    },
  };
};

export const swagOrderProvider = (http) => ({
  getApiUrl: () => API,
  getList: async ({ pagination, filters }) => {
    const parts = [`pageNumber=${pagination?.current ?? 1}`, `pageSize=${pagination?.pageSize ?? 25}`, swagOrderQuery(filters)]
      .filter(Boolean)
      .join("&");
    const res = ok(await http.get(`${API}/admin/swag-orders?${parts}`));
    return { data: res.data?.records ?? [], total: res.data?.totalRecords ?? 0 };
  },
  custom: blobCustom(http, "swag-orders.csv"),
  update: async ({ id, variables: { userId, isDelivered, trackingNumber } }) => ({
    data: ok(
      await http.patch(`${API}/admin/swag-orders/${userId}/${id}/delivered`, { isDelivered, trackingNumber }),
    ).data,
  }),
  getOne: notImpl(),
  getMany: notImpl(),
  create: notImpl(),
  deleteOne: notImpl(),
});

// ---------------------------------------------------------------- seasons
export const seasonProvider = (http) => {
  const base = `${API}/admin/Season`;
  return {
    getApiUrl: () => API,
    getList: async ({ pagination, sorters }) => {
      const s = sorters?.[0];
      const qs = [
        `pageNumber=${pagination?.current ?? 1}`,
        `pageSize=${pagination?.pageSize ?? 100}`,
        `isDescending=${s?.order === "desc"}`,
        s?.field ? `sortBy=${s.field}` : "",
      ]
        .filter(Boolean)
        .join("&");
      return listShape(ok(await http.get(`${base}?${qs}`)).data);
    },
    getOne: async ({ id }) => ({ data: ok(await http.get(`${base}/${id}`)).data }),
    create: async ({ variables }) => ({ data: (await http.post(base, toFormData(variables), { headers: {} })).data }),
    update: async ({ id, variables }) => ({
      data: ok(await http.patch(`${base}/${id}`, toFormData(variables), { headers: {} })).data,
    }),
    deleteOne: async ({ id }) => ({ data: ok(await http.delete(`${base}/${id}`)).data }),
    custom: async ({ url, method, payload, headers }) => {
      const res = ok(
        await http.request({ url: url.startsWith("http") ? url : `${API}${url}`, method, data: payload, headers }),
      );
      return { data: res.data };
    },
    getMany: notImpl(),
  };
};

// ---------------------------------------------------------------- polls
function normalizePollError(e) {
  const res = axios.isAxiosError(e) ? e.response : undefined;
  const data = res?.data;
  const errors = data?.errors;
  return {
    message:
      data?.detail ??
      (errors ? Object.values(errors).flat().join(" ") : undefined) ??
      data?.title ??
      (e instanceof Error ? e.message : undefined) ??
      "Request failed.",
    statusCode: res?.status ?? 500,
    errors,
  };
}
const guard = async (fn) => {
  try {
    return await fn();
  } catch (e) {
    throw normalizePollError(e);
  }
};
export const POLLS_EXPORT = "/admin/poll-results/export";

export const pollsProvider = (http) => {
  const base = `${API}/admin/polls`;
  const custom = blobCustom(http, "poll-results.csv");
  return {
    getApiUrl: () => API,
    getList: async (p) =>
      guard(async () => {
        const f = p.filters?.find((x) => "field" in x && x.field === "type");
        const t = f && "value" in f ? f.value : undefined;
        const type = t === "Poll" || t === "Trivia" ? t : undefined;
        const res = await http.get(`${base}${type ? `?type=${type}` : ""}`);
        const items = res.data?.items ?? [];
        return { data: items, total: res.data?.total ?? items.length };
      }),
    getOne: async ({ id }) => guard(async () => ({ data: (await http.get(`${base}/${id}`)).data })),
    create: async ({ variables }) => guard(async () => ({ data: (await http.post(base, variables)).data })),
    update: async ({ id, variables }) => guard(async () => ({ data: (await http.put(`${base}/${id}`, variables)).data })),
    deleteOne: async ({ id }) => guard(async () => ({ data: (await http.delete(`${base}/${id}`)).data })),
    custom: async (args) => guard(() => custom(args)),
  };
};

// Game mode presets (prototype endpoints, see src/mock/server.js).
export const gameModesProvider = (http) => ({
  getApiUrl: () => API,
  getList: async () => {
    const res = ok(await http.get(`${API}/admin/game-modes`));
    return { data: res.data, total: res.data.length };
  },
  getOne: async ({ id }) => ({ data: ok(await http.get(`${API}/admin/game-modes/${id}`)).data }),
  update: async ({ id, variables }) => ({
    data: ok(await http.put(`${API}/admin/game-modes/${id}`, toFormData(variables), { headers: {} })).data,
  }),
  create: async ({ variables }) => ({ data: ok(await http.post(`${API}/admin/game-modes`, variables)).data }),
  deleteOne: async ({ id }) => ({ data: ok(await http.delete(`${API}/admin/game-modes/${id}`)).data }),
});

// Daily schedule slots (prototype endpoints); the list is saved as a whole (JSON).
export const scheduleSlotsProvider = (http) => ({
  getApiUrl: () => API,
  getList: async () => {
    const res = ok(await http.get(`${API}/admin/schedule-slots`));
    return { data: res.data, total: res.data.length };
  },
  update: async ({ variables }) => ({ data: ok(await http.put(`${API}/admin/schedule-slots`, variables)).data }),
  getOne: notImpl(),
  create: notImpl(),
  deleteOne: notImpl(),
});

// Word sets (prototype endpoints, JSON): presets of a stream's rounds or showdown.
export const wordSetsProvider = (http) => ({
  getApiUrl: () => API,
  getList: async () => {
    const res = ok(await http.get(`${API}/admin/word-sets`));
    return { data: res.data, total: res.data.length };
  },
  create: async ({ variables }) => ({ data: ok(await http.post(`${API}/admin/word-sets`, variables)).data }),
  update: async ({ id, variables }) => ({ data: ok(await http.put(`${API}/admin/word-sets/${id}`, variables)).data }),
  deleteOne: async ({ id }) => ({ data: ok(await http.delete(`${API}/admin/word-sets/${id}`)).data }),
  getOne: notImpl(),
  custom: async ({ url, method, payload }) => ({ data: ok(await http({ url: `${API}${url}`, method, data: payload })).data }),
});

// Simple collection under /admin/<path> (prototype libraries: hosts, sponsors). Writes are multipart.
export const libraryProvider = (http, path) => ({
  getApiUrl: () => API,
  getList: async () => {
    const res = ok(await http.get(`${API}/admin/${path}`));
    return { data: res.data, total: res.data.length };
  },
  getOne: async ({ id }) => ({ data: ok(await http.get(`${API}/admin/${path}/${id}`)).data }),
  create: async ({ variables }) => ({ data: ok(await http.post(`${API}/admin/${path}`, toFormData(variables), { headers: {} })).data }),
  update: async ({ id, variables }) => ({
    data: ok(await http.put(`${API}/admin/${path}/${id}`, toFormData(variables), { headers: {} })).data,
  }),
  deleteOne: async ({ id }) => ({ data: ok(await http.delete(`${API}/admin/${path}/${id}`)).data }),
});

// Simple JSON collection under /admin/<path> (share card, app card and notification presets).
export const jsonCollectionProvider = (http, path) => ({
  getApiUrl: () => API,
  getList: async () => {
    const res = ok(await http.get(`${API}/admin/${path}`));
    return { data: res.data, total: res.data.length };
  },
  getOne: async ({ id }) => ({ data: ok(await http.get(`${API}/admin/${path}/${id}`)).data }),
  create: async ({ variables }) => ({ data: ok(await http.post(`${API}/admin/${path}`, variables)).data }),
  update: async ({ id, variables }) => ({ data: ok(await http.put(`${API}/admin/${path}/${id}`, variables)).data }),
  deleteOne: async ({ id }) => ({ data: ok(await http.delete(`${API}/admin/${path}/${id}`)).data }),
});

export const buildDataProviders = (http) => ({
  default: defaultProvider(http),
  [DP.userManagement]: userManagementProvider(http),
  [DP.userRoles]: userRolesProvider(http),
  [DP.cashWins]: cashWinsProvider(http),
  [DP.userProfiles]: userProfilesProvider(http),
  [DP.amplitudeEvent]: amplitudeEventProvider(http),
  [DP.howToPlay]: howToPlayProvider(http),
  [DP.shareableCardConfig]: shareableCardConfigProvider(http),
  [DP.shop]: sparkPackProvider(http),
  [DP.powerupPacks]: powerupPackProvider(http),
  [DP.savvySwag]: savvySwagProvider(http),
  [DP.swagOrders]: swagOrderProvider(http),
  [DP.season]: seasonProvider(http),
  [DP.rewards]: rewardsProvider(http),
  [DP.polls]: pollsProvider(http),
  [DP.gameModes]: gameModesProvider(http),
  [DP.bundles]: jsonCollectionProvider(http, "bundles"),
  [DP.powerUps]: libraryProvider(http, "power-ups"),
  [DP.scoringPresets]: jsonCollectionProvider(http, "scoring-presets"),
  [DP.scheduleSlots]: scheduleSlotsProvider(http),
  [DP.wordSets]: wordSetsProvider(http),
  [DP.hosts]: libraryProvider(http, "hosts"),
  [DP.sponsors]: libraryProvider(http, "sponsors"),
  [DP.sharePresets]: jsonCollectionProvider(http, "share-presets"),
  [DP.notificationPresets]: jsonCollectionProvider(http, "notification-presets"),
  [DP.appCardPresets]: jsonCollectionProvider(http, "app-card-presets"),
  [DP.puzzleCardPresets]: jsonCollectionProvider(http, "puzzle-card-presets"),
});
