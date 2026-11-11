// In-browser mock of the Savvy admin REST API. Implements every endpoint the dashboard
// calls, with the same paths, query params and response shapes. State persists in
// localStorage ("savvy-mock-db"); call window.__resetMockDb() to restore the seed.
import * as seed from "./seed";
import { LOGO_URL } from "../assets";
import { HOST_PICTURE_URL, MODE_LOGOS, STREAM_HERO_URL } from "../assets";

// Version 2 keeps its own saved data: version 1 is published on the same site (same browser
// storage) and must not be touched by it.
const DB_KEY = "savvy-mock-db-2";
const DB_VERSION = 53;

// The demo data: one host (Scott), one sponsor (Wendy's) and one stream per state and edge case,
// spread over the month around today (see DEMO_STREAMS). Streams are built like new ones: from a
// bundle and the Default share card and notification presets. Word sets are words only: the ones
// on streams (Used once the stream ran, Scheduled while it's upcoming) plus Ready ones.
const SAMPLE_WORDS = (
  "cloud rain storm wind snow bread butter toast honey jam river lake ocean wave shore piano drums flute cello harp " +
  "tiger lion zebra panda koala apple peach plum grape lemon chess queen king rook pawn comet star moon orbit planet " +
  "maple cedar birch pine oak train track coach rail depot candle flame spark ember glow paint brush canvas easel frame " +
  "salsa tango waltz polka swing kite string tail wind sky stone brick wall tower gate bloom petal stem root seed " +
  "frost ice chill sleet hail opera stage lights curtain bow cocoa mocha latte foam bean pixel screen code byte chip"
).split(" ");
const SAMPLE_SHOWDOWNS = "thunder breakfast harbor orchestra safari orchard kingdom galaxy forest journey lantern gallery fiesta glider castle garden blizzard theater espresso circuit".split(" ");
const TONES = ["blue", "purple", "green", "orange", "pink"];
// Minutes the given UTC instant's America/Los_Angeles time is behind UTC (PDT 420, PST 480).
const ptOffset = (ms) => {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", timeZoneName: "shortOffset" }).formatToParts(new Date(ms)).find((x) => x.type === "timeZoneName")?.value ?? "GMT-8";
  return -Number(name.replace("GMT", "") || 0) * 60;
};
const ptTime = (dateKey, hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  const guess = Date.parse(`${dateKey}T00:00:00Z`) + (h * 60 + m) * 60000;
  return guess + ptOffset(guess + 8 * 3600000) * 60000;
};
// One stream per state and edge case. `off` is days from today (Pacific), `kind` the state:
// ended / canceled / live / upcoming. `mode` is the format (How to play & format; none when left
// out), `bundle` what it was made from, `words` how many of its five round words are in,
// `showdown` "word" (has its word), "empty" (still needs it) or "none" (no showdown).
const CASH = "bundle-cash-savvy";
const SPARKS = "bundle-sparks-savvy";
const SUPER = "bundle-cash-super-savvy";
const DEMO_STREAMS = [
  // ---- already over
  { off: -10, time: "13:00", kind: "ended", mode: "TextChain", bundle: CASH, words: 5, showdown: "word" },
  { off: -9, time: "17:00", kind: "ended", mode: "SubText", bundle: SPARKS, words: 5, showdown: "word" },
  { off: -8, time: "18:00", kind: "ended", mode: "TextChain", bundle: SUPER, words: 5, showdown: "word" },
  { off: -7, time: "13:00", kind: "ended", mode: "SubText", bundle: CASH, words: 5, showdown: "none" },
  { off: -6, time: "18:00", kind: "ended", mode: "TextChain", bundle: CASH, words: 5, showdown: "word", type: "SuperSavvy" },
  { off: -5, time: "11:00", kind: "ended", mode: "TextChain", bundle: CASH, words: 5, showdown: "word", type: "Internal" },
  { off: -4, time: "17:00", kind: "ended", mode: "SubText", bundle: CASH, words: 5, showdown: "word", sponsor: true, raffle: true, buster: true },
  { off: -3, time: "13:00", kind: "canceled", mode: "TextChain", bundle: CASH, words: 5, showdown: "word" },
  { off: -2, time: "18:00", kind: "canceled", bundle: CASH, words: 0, showdown: "empty" },
  { off: -1, time: "17:00", kind: "ended", mode: "SubText", bundle: SUPER, words: 5, showdown: "word", spotlight: true },
  // ---- on air
  { off: 0, time: "live", kind: "live", mode: "TextChain", bundle: CASH, words: 5, showdown: "word" },
  // ---- upcoming and ready
  { off: 1, time: "13:00", kind: "upcoming", mode: "TextChain", bundle: CASH, words: 5, showdown: "word" },
  { off: 2, time: "17:00", kind: "upcoming", mode: "SubText", bundle: SPARKS, words: 5, showdown: "word" },
  { off: 3, time: "18:00", kind: "upcoming", mode: "TextChain", bundle: SUPER, words: 5, showdown: "word" },
  { off: 4, time: "13:00", kind: "upcoming", mode: "SubText", bundle: CASH, words: 5, showdown: "word", type: "SuperSavvy" },
  { off: 5, time: "11:00", kind: "upcoming", mode: "TextChain", bundle: CASH, words: 5, showdown: "word", type: "Internal" },
  { off: 6, time: "18:00", kind: "upcoming", mode: "TextChain", bundle: CASH, words: 5, showdown: "word", spotlight: true },
  { off: 7, time: "17:00", kind: "upcoming", mode: "SubText", bundle: CASH, words: 5, showdown: "word", sponsor: true },
  { off: 8, time: "13:00", kind: "upcoming", mode: "TextChain", bundle: SPARKS, words: 5, showdown: "word", raffle: true, buster: true },
  { off: 9, time: "18:00", kind: "upcoming", mode: "TextChain", bundle: CASH, words: 5, showdown: "none" },
  { off: 10, time: "13:00", kind: "upcoming", mode: "TextChain", bundle: CASH, words: 5, showdown: "word", title: "Thanksgiving special with {host}", subtitle: "Double Sparks all night" },
  // Two on one day.
  { off: 11, time: "11:00", kind: "upcoming", mode: "TextChain", bundle: CASH, words: 5, showdown: "word" },
  { off: 11, time: "18:00", kind: "upcoming", mode: "SubText", bundle: SPARKS, words: 5, showdown: "word" },
  // ---- upcoming, still missing something
  { off: 12, time: "13:00", kind: "upcoming", mode: "TextChain", bundle: CASH, words: 3, showdown: "empty" },
  { off: 13, time: "17:00", kind: "upcoming", mode: "SubText", bundle: CASH, words: 5, showdown: "empty" },
  { off: 14, time: "18:00", kind: "upcoming", mode: "TextChain", bundle: CASH, words: 0, showdown: "empty" },
  { off: 15, time: "13:00", kind: "upcoming", bundle: CASH, words: 5, showdown: "word" },
  { off: 16, time: "18:00", kind: "upcoming", bundle: SUPER, words: 0, showdown: "empty" },
  { off: 17, time: "13:00", kind: "upcoming", mode: "TextChain", bundle: CASH, words: 5, showdown: "word", host: false },
  { off: 18, time: "17:00", kind: "upcoming", bundle: CASH, words: 0, showdown: "empty", type: "Internal" },
  { off: 19, time: "18:00", kind: "canceled", mode: "SubText", bundle: CASH, words: 0, showdown: "empty" },
];
// Ready word sets on top of the ones the streams hold.
const READY_SETS = 12;

function populate(d) {
  // One host and one sponsor: Scott and Wendy's; the others go, with what pointed at them.
  const gone = new Set(d.hosts.filter((h) => h.id !== seed.SCOTT.id).map((h) => h.id));
  d.hosts = d.hosts.some((h) => h.id === seed.SCOTT.id) ? d.hosts.filter((h) => h.id === seed.SCOTT.id) : [{ ...seed.SCOTT }];
  d.sponsors = (d.sponsors ?? []).some((sp) => sp.id === seed.WENDYS.id) ? d.sponsors.filter((sp) => sp.id === seed.WENDYS.id) : [{ ...seed.WENDYS }];
  d.users = (d.users ?? []).filter((u) => !gone.has(u.id));
  d.cashWins = (d.cashWins ?? []).filter((r) => !gone.has(r.userId));
  Object.keys(d.claims ?? {}).forEach((id) => gone.has(id) && delete d.claims[id]);
  // Every time slot has its own host (bundles carry none).
  (d.scheduleSlots ?? []).forEach((sl) => {
    if (!sl.hostId || gone.has(sl.hostId)) sl.hostId = seed.SCOTT.id;
  });
  // Pictures for hosts and sponsors without one; hosts are Savvy accounts with the Host role.
  d.claims ??= {};
  d.hosts.forEach((h, i) => {
    const tone = TONES[i % TONES.length];
    h.imageUrl ||= seed.expressiveAvatar(h.name, tone);
    h.heroCardImageUrl ||= seed.expressiveHero(tone);
    // Each host's own stream image (Scott's photo is the sample one), so streams match their host.
    h.streamImageUrl ||= h.id === seed.SCOTT.id ? STREAM_HERO_URL : seed.expressiveHero(tone);
    if (!d.users.some((u) => u.id === h.id)) d.users.push(seed.hostAccount(h));
    const u = d.users.find((x) => x.id === h.id);
    if (u) u.imageUrl = h.imageUrl;
    d.claims[h.id] = { ...d.claims[h.id], role: "Host" };
  });
  (d.sponsors ?? []).forEach((sp, i) => {
    if (!sp.imageUrl || sp.imageUrl.startsWith("data:")) sp.imageUrl = seed.expressiveAvatar(sp.name, TONES[(i + 2) % TONES.length]);
  });
  const share = (d.sharePresets?.find((p) => p.isDefault) ?? d.sharePresets?.[0])?.cards ?? null;
  const notify = d.notificationPresets?.find((p) => p.isDefault) ?? d.notificationPresets?.[0] ?? {};
  const now = Date.now();
  const todayKey = new Date(now - ptOffset(now) * 60000).toISOString().slice(0, 10);
  let w = 0;
  const nextWords = () => Array.from({ length: 5 }, () => SAMPLE_WORDS[w++ % SAMPLE_WORDS.length]);
  const day = (off) => new Date(Date.parse(`${todayKey}T12:00:00Z`) + off * 86400000).toISOString().slice(0, 10);
  d.bundles ??= seed.seedBundles();
  const rows = DEMO_STREAMS.map((p) => ({ ...p, at: p.time === "live" ? now - 10 * 60000 : ptTime(day(p.off), p.time) })).sort((a, b) => a.at - b.at);

  const sets = [];
  // Set names from their first word, numbered when a name repeats ("Train", "Train 2").
  const named = {};
  const setName = (word) => {
    const base = seed.wordSetTitle(word);
    named[base] = (named[base] ?? 0) + 1;
    return named[base] === 1 ? base : `${base} ${named[base]}`;
  };
  const scott = d.hosts[0];
  const wendys = d.sponsors[0];
  const streams = rows.map((p, i) => {
    const bundle = d.bundles.find((b) => b.id === p.bundle) ?? d.bundles[0];
    const host = p.host === false ? null : scott;
    const status = { ended: "Completed", canceled: "Canceled", live: "InProgress" }[p.kind] ?? "Scheduled";
    const streamType = p.type ?? "Public";
    const hasShowdown = p.showdown !== "none";
    const words = nextWords();
    const showdownWord = SAMPLE_SHOWDOWNS[i % SAMPLE_SHOWDOWNS.length];
    const complete = p.words === 5 && p.showdown !== "empty";
    const rounds = words.map((word, r) => ({ roundIndex: r, word: r < p.words ? word : "", durationInSeconds: seed.secondsFor(r < p.words ? word : "", r), prizes: null, roundBusterReward: { rewardType: "Sparks", amount: 5 * (r + 1) } }));
    const st = {
      id: uuid(),
      title: p.title ?? "You vs {host}",
      subtitle: p.subtitle ?? null,
      status,
      hideGameModeLogo: status === "Scheduled" && (!complete || !host),
      startDate: new Date(p.at).toISOString().replace(/\.\d{3}Z$/, "Z"),
      round1StartsAt: new Date(p.at + 7 * 60000).toISOString(),
      hostId: host?.id ?? null,
      hostName: host?.name ?? null,
      imageUrl: host?.imageUrl ?? null,
      heroImageUrl: host ? host.streamImageUrl || STREAM_HERO_URL : null,
      streamType,
      // The format (How to play & format) is picked on the stream; some have none yet.
      gameMode: p.mode ?? null,
      bundleId: bundle.id,
      textSavvyRounds: { rounds },
      showdownConfiguration: hasShowdown ? { word: p.showdown === "word" ? showdownWord : "", prize: { ...bundle.showdown.prize }, superSavvyOnly: streamType === "SuperSavvy" || !!bundle.showdown.superSavvyOnly } : null,
      roundScoring: structuredClone(bundle.roundScoring),
      hostStumperBonusXp: bundle.hostStumperBonusXp ?? null,
      defaultRewards: structuredClone(bundle.defaultRewards),
      hostBusterReward: p.buster ? { rewardType: "Sparks", amount: 25 } : null,
      raffleSystemWinnersConfiguration: p.raffle ? [{ rewardType: "Cash", amount: 10 }, { rewardType: "Cash", amount: 5 }] : null,
      sponsorship: p.sponsor ? { title: wendys.title, description: wendys.description, cta: wendys.cta, imageUrl: wendys.imageUrl ?? null } : null,
      shareableCards: share ? JSON.parse(JSON.stringify(share)) : null,
      lobbyOpenTitle: notify.lobbyOpenTitle ?? "Lobby is Open",
      lobbyOpenBody: notify.lobbyOpenBody ?? "10 minutes until showtime!",
      goingLiveTitle: notify.goingLiveTitle ?? "We're Live!",
      goingLiveBody: notify.goingLiveBody ?? "Join now",
      round1StartsTitle: notify.round1StartsTitle ?? "Round 1 is about to start!",
      round1StartsBody: notify.round1StartsBody ?? "Last chance to join!",
      entranceFee: { type: "Free", amount: 0 },
      totalPrizePool: status === "Completed" ? 100 + (i % 5) * 50 : 0,
      headless: false,
      isSpotlighted: !!p.spotlight,
    };
    // The word set a stream with all its words came from: Used once it ran, Scheduled while
    // upcoming (an Internal stream doesn't use up its set: it stays Ready).
    if (complete && status !== "Canceled") {
      sets.push({
        id: `ws-${String(sets.length + 1).padStart(3, "0")}`,
        title: setName(words[0]),
        rounds: seed.roundsOf(words),
        showdown: hasShowdown ? { word: showdownWord } : null,
        streamId: streamType === "Internal" ? null : st.id,
        createdAt: new Date(p.at - 10 * 86400000).toISOString(),
      });
    }
    applyLibrary(st, d);
    return st;
  });
  // Ready sets, most with a showdown word.
  for (let k = 0; k < READY_SETS; k += 1) {
    const words = nextWords();
    sets.push({
      id: `ws-${String(sets.length + 1).padStart(3, "0")}`,
      title: setName(words[0]),
      rounds: seed.roundsOf(words),
      showdown: k % 4 === 3 ? null : { word: SAMPLE_SHOWDOWNS[(k + 7) % SAMPLE_SHOWDOWNS.length] },
      streamId: null,
      createdAt: new Date(now - (30 - k) * 86400000).toISOString(),
    });
  }
  const ids = new Set(streams.map((x) => x.id));
  d.streams = streams;
  d.streamKeys = Object.fromEntries(streams.map((x) => [x.id, randomKey()]));
  d.wordSets = sets;
  (d.polls ?? []).forEach((poll) => {
    if (poll.streamId && !ids.has(poll.streamId)) poll.streamId = null;
  });
  return d;
}

function freshDb() {
  const users = seed.seedUsers();
  const swag = seed.seedSwag();
  const streams = seed.seedStreams();
  const libraries = { hosts: seed.seedHosts(), gameModes: seed.seedGameModes() };
  const packs = { sparkPacks: seed.seedSparkPacks(), powerupPacks: seed.seedPowerupPacks() };
  streams.forEach((s) => applyLibrary(s, libraries));
  return populate({
    version: DB_VERSION,
    streams,
    streamKeys: Object.fromEntries(streams.map((s) => [s.id, randomKey()])),
    users,
    claims: Object.fromEntries(libraries.hosts.map((h) => [h.id, { role: "Host" }])),
    cashWins: seed.seedCashWins(users),
    howToPlay: seed.seedHowToPlay(),
    ...libraries,
    bundles: seed.seedBundles(),
    scheduleSlots: seed.seedScheduleSlots(),
    wordSets: seed.seedWordSets(),
    sponsors: seed.seedSponsors(),
    shareConfig: seed.seedShareConfig(),
    sharePresets: seed.seedSharePresets(),
    appCardPresets: seed.seedAppCardPresets(),
    puzzleCardPresets: seed.seedPuzzleCardPresets(),
    notificationPresets: seed.seedNotificationPresets(),
    rewardConfig: seed.seedRewardConfig(),
    ...packs,
    swag,
    swagOrders: seed.seedSwagOrders(users, swag),
    seasons: seed.seedSeasons(),
    polls: seed.seedPolls(),
    pollVotes: {},
    amplitudeLog: [],
  });
}

function randomKey() {
  const c = "abcdefghijklmnopqrstuvwxyz0123456789";
  return "live_" + Array.from({ length: 24 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}
const uuid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : seed.makeUuid());
const now = () => new Date().toISOString();

let db = load();
// A word set is only its words: no format, no rewards (sample and older sets carried them).
(db.wordSets ?? []).forEach((w) => {
  delete w.type;
  (w.rounds ?? []).forEach((r) => delete r.roundBusterReward);
  if (w.showdown) delete w.showdown.prize;
});
// Pictures that ship with the app (host, stream, sponsor, logos, items) are saved as URLs, which
// change from build to build (dev paths, hashed names). Point every saved one at this build's file,
// so pictures saved by an older version still show.
{
  const files = import.meta.glob("../assets/**/*.{png,svg}", { eager: true, query: "?url", import: "default" });
  const current = Object.fromEntries(Object.entries(files).map(([path, url]) => [path.split("/").pop().replace(/\.(png|svg)$/, ""), url]));
  const stems = Object.keys(current).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).sort((x, y) => y.length - x.length);
  const re = new RegExp(`/(${stems.join("|")})(-[A-Za-z0-9_-]{8})?\\.(png|svg)(\\?[^"]*)?$`);
  const fix = (v) => {
    if (typeof v === "string") {
      if (v.startsWith("data:") || v.startsWith("blob:")) return v;
      const m = v.match(re);
      return m ? current[m[1]] : v;
    }
    if (Array.isArray(v)) return v.map(fix);
    if (v && typeof v === "object") {
      for (const k of Object.keys(v)) v[k] = fix(v[k]);
      return v;
    }
    return v;
  };
  fix(db);
}
// Share cards name the host with {host} (filled with the stream's host): move the old fixed texts over.
{
  const OLD_TO_TAG = {
    "We're live!": "You vs {host}",
    "Starting soon": "You vs {host}",
    "I beat the host": "I beat {host}",
    "The host got me this time": "{host} got me this time",
    "The host won this weekend": "{host} won this weekend",
  };
  const retag = (cards) => {
    if (!cards) return;
    for (const key of ["liveHome", "upcomingHome", "beatHost", "didNotBeatHost"]) {
      const card = cards[key];
      if (card?.title && OLD_TO_TAG[card.title] && (key !== "liveHome" || card.title === "We're live!") && (key !== "upcomingHome" || card.title === "Starting soon")) card.title = OLD_TO_TAG[card.title];
    }
  };
  (db.sharePresets ?? []).forEach((p) => retag(p.cards));
  (db.streams ?? []).forEach((s) => retag(s.shareableCards));
}
function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === 24) {
        // v25: word sets hold words only; prizes and rewards come from the game mode
        parsed.wordSets = (parsed.wordSets ?? []).map((w) => ({ ...w, rounds: seed.roundsOf((w.rounds ?? []).map((r) => r.word)), showdown: { word: w.showdown?.word ?? "" } }));
        parsed.version = 25;
      }
      if (parsed.version === 25) {
        // v26: databases seeded fresh before hosts had display names get the sample ones
        const fresh = Object.fromEntries(seed.seedHosts().map((h) => [h.name, h.displayName]));
        (parsed.hosts ?? []).forEach((h) => {
          if (!h.displayName && fresh[h.name]) h.displayName = fresh[h.name];
        });
        parsed.streams.forEach((st) => st.status === "Scheduled" && applyLibrary(st, parsed));
        parsed.version = 26;
      }
      if (parsed.version === 26) {
        // v27: the game modes' logos (replaces the old ones; scheduled streams pick them up)
        (parsed.gameModes ?? []).forEach((m) => {
          if (MODE_LOGOS[m.id]) m.gameLogoUrl = MODE_LOGOS[m.id];
        });
        parsed.streams.forEach((st) => st.status === "Scheduled" && applyLibrary(st, parsed));
        parsed.version = 27;
      }
      if (parsed.version === 27) {
        // v28: Scott Rogowsky ("Puzzle Papi") is the only host; every stream and time slot is
        // his, with his picture as the thumbnail and the default stream image as the hero.
        const host = { ...seed.SCOTT };
        const others = new Set((parsed.hosts ?? []).map((h) => h.id).filter((id) => id !== host.id));
        parsed.hosts = [host];
        others.forEach((id) => {
          if (parsed.claims?.[id]?.role === "Host") delete parsed.claims[id];
        });
        parsed.claims = { ...parsed.claims, [host.id]: { role: "Host" } };
        const u = parsed.users?.find((x) => x.id === host.id);
        if (u) u.imageUrl = host.imageUrl;
        parsed.streams.forEach((st) => {
          st.hostId = host.id;
          st.hostName = host.name;
          st.imageUrl = host.imageUrl;
          st.heroImageUrl = STREAM_HERO_URL;
          applyLibrary(st, parsed);
        });
        (parsed.scheduleSlots ?? []).forEach((sl) => (sl.hostId = host.id));
        parsed.version = 28;
      }
      if (parsed.version === 28) {
        // v29: Wendy's is the only sponsor; streams that had a sponsor show Wendy's instead.
        const sp = { ...seed.WENDYS };
        parsed.sponsors = [sp];
        parsed.streams.forEach((st) => {
          if (st.sponsorship) st.sponsorship = { title: sp.title, description: sp.description, cta: sp.cta, imageUrl: sp.imageUrl };
        });
        parsed.version = 29;
      }
      if (parsed.version === 29) {
        // v30: four sample sets, each game mode with and without a showdown.
        parsed.wordSets = seed.seedWordSets();
        parsed.version = 30;
      }
      if (parsed.version === 30) {
        // v31: presets for the app's and the daily puzzle's share cards
        parsed.appCardPresets = seed.seedAppCardPresets();
        parsed.puzzleCardPresets = seed.seedPuzzleCardPresets();
        parsed.version = 31;
      }
      if (parsed.version === 31) {
        // v32: stream presets have a default (the first one, as before)
        for (const key of ["sharePresets", "notificationPresets"]) if ((parsed[key] ?? []).length && !parsed[key].some((p) => p.isDefault)) parsed[key][0].isDefault = true;
        parsed.version = 32;
      }
      if (parsed.version === 32) {
        // v33: every sample stream and time slot is titled "You vs {host}" ({host} fills in the host)
        (parsed.streams ?? []).forEach((st) => (st.title = "You vs {host}"));
        (parsed.scheduleSlots ?? []).forEach((sl) => (sl.title = "You vs {host}"));
        parsed.version = 33;
      }
      if (parsed.version === 33) {
        // v34: time slots run on chosen weekdays (lunch and after work on weekdays)
        const DAYS = { "slot-lunch": [1, 2, 3, 4, 5], "slot-afternoon": [1, 2, 3, 4, 5] };
        (parsed.scheduleSlots ?? []).forEach((sl) => (sl.days ??= DAYS[sl.id] ?? [1, 2, 3, 4, 5, 6, 0]));
        parsed.version = 34;
      }
      if (parsed.version === 34) {
        // v35: an upcoming stream was hidden from the app (a draft) while words were missing
        (parsed.streams ?? []).forEach((st) => {
          if (st.status !== "Scheduled") return;
          const rounds = st.textSavvyRounds?.rounds ?? [];
          st.isDraft = !rounds.length || rounds.some((r) => !r.word) || (!!st.showdownConfiguration && !st.showdownConfiguration.word);
        });
        parsed.version = 35;
      }
      if (parsed.version === 35) {
        // v36: the fifth round always runs 45 seconds (streams and word sets)
        const fifth = (rounds) => rounds?.[4] && (rounds[4].durationInSeconds = 45);
        (parsed.streams ?? []).forEach((st) => fifth(st.textSavvyRounds?.rounds));
        (parsed.wordSets ?? []).forEach((w) => fifth(w.rounds));
        parsed.version = 36;
      }
      if (parsed.version === 36) {
        // v37: streams aren't hidden any more; the app hides the game mode logo while words are missing
        (parsed.streams ?? []).forEach((st) => {
          if (st.status !== "Scheduled") return;
          const rounds = st.textSavvyRounds?.rounds ?? [];
          st.isDraft = false;
          st.hideGameModeLogo = !rounds.length || rounds.some((r) => !r.word) || (!!st.showdownConfiguration && !st.showdownConfiguration.word);
        });
        parsed.version = 37;
      }
      if (parsed.version === 37) {
        // v38: no drafts any more (a stream missing words shows without its game mode logo);
        // time slots keep only when, who and for whom (title, texts and rewards come from defaults)
        (parsed.streams ?? []).forEach((st) => delete st.isDraft);
        (parsed.scheduleSlots ?? []).forEach((sl) => {
          sl.title = "You vs {host}";
          ["defaultRewards", "hostBusterReward", "raffleSystemWinnersConfiguration", "showdownConfiguration", "lobbyOpenTitle", "lobbyOpenBody", "goingLiveTitle", "goingLiveBody", "round1StartsTitle", "round1StartsBody"].forEach((k) => delete sl[k]);
        });
        (parsed.gameModes ?? []).forEach((m) => delete m.shareableCards);
        parsed.version = 38;
      }
      if (parsed.version === 38) {
        // v39: a busy sample schedule with every state, four hosts and four sponsors
        seed.seedHosts().forEach((h) => !parsed.hosts.some((x) => x.id === h.id) && parsed.hosts.push(h));
        seed.seedSponsors().forEach((sp) => !(parsed.sponsors ??= []).some((x) => x.id === sp.id) && parsed.sponsors.push(sp));
        populate(parsed);
        parsed.version = 39;
      }
      if (parsed.version === 39) {
        // v40: every host has their own stream image; rebuild the sample schedule with it
        populate(parsed);
        parsed.version = 40;
      }
      if (parsed.version === 40) {
        // v41: a time slot with its game mode's default host follows that default (empty hostId)
        (parsed.scheduleSlots ?? []).forEach((sl) => {
          const mode = (parsed.gameModes ?? []).find((m) => m.id === (sl.gameMode ?? "TextChain"));
          if (mode?.defaultHostId && sl.hostId === mode.defaultHostId) sl.hostId = "";
        });
        parsed.version = 41;
      }
      if (parsed.version === 41) {
        // v42: sample word sets get distinct names
        populate(parsed);
        parsed.version = 42;
      }
      if (parsed.version === 42) {
        // v43: sample streams follow their game mode's defaults, with a few changed on purpose
        populate(parsed);
        parsed.version = 43;
      }
      if (parsed.version === 43) {
        // v44: item pictures are the real ones again (bundled with the app), by item id
        const byId = (list) => Object.fromEntries((list ?? []).map((x) => [x.id, x]));
        const swag = byId(seed.seedSwag()), packs = byId(seed.seedPowerupPacks()), sparks = byId(seed.seedSparkPacks()), seasons = byId(seed.seedSeasons());
        (parsed.swag ?? []).forEach((x) => swag[x.id] && Object.assign(x, { imageUrl: swag[x.id].imageUrl, imageUrls: swag[x.id].imageUrls }));
        (parsed.powerupPacks ?? []).forEach((x) => packs[x.id] && (x.contents = packs[x.id].contents));
        (parsed.sparkPacks ?? []).forEach((x) => sparks[x.id] && (x.iconUrl = sparks[x.id].iconUrl));
        (parsed.seasons ?? []).forEach((x) => seasons[x.id] && (x.iconUrl = seasons[x.id].iconUrl));
        const how = seed.seedHowToPlay();
        parsed.howToPlay = how;
        (parsed.gameModes ?? []).forEach((m) => (m.howToPlay = seed.seedHowToPlay()));
        parsed.version = 44;
      }
      if (parsed.version === 44) {
        // v45: pictures that pointed at removed sample files point at the current sample art
        const swap = { "host-scott.png": HOST_PICTURE_URL, "stream-hero.png": STREAM_HERO_URL, "sponsor-wendys.svg": seed.WENDYS.imageUrl };
        const fix = (v) => {
          if (typeof v === "string") {
            const hit = Object.keys(swap).find((f) => v.endsWith(`/${f}`) || v.includes(`/${f}?`));
            return hit ? swap[hit] : v;
          }
          if (Array.isArray(v)) return v.map(fix);
          if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fix(x)]));
          return v;
        };
        Object.assign(parsed, fix(parsed));
        parsed.version = 45;
      }
      if (parsed.version === 45) {
        // v46: the provided host, stream and sponsor pictures are back in place of the sample art
        const swap = { "host-sample.svg": HOST_PICTURE_URL, "stream-hero-sample.svg": STREAM_HERO_URL, "sponsor-sample.svg": seed.WENDYS.imageUrl };
        const fix = (v) => {
          if (typeof v === "string") {
            const hit = Object.keys(swap).find((f) => v.endsWith(`/${f}`) || v.includes(`/${f}?`));
            return hit ? swap[hit] : v;
          }
          if (Array.isArray(v)) return v.map(fix);
          if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fix(x)]));
          return v;
        };
        Object.assign(parsed, fix(parsed));
        parsed.version = 46;
      }
      if (parsed.version === 46) {
        // v47: demo data with one host (Scott) and one sponsor (Wendy's): streams in every state
        // and 15 word sets per game mode; the other hosts, sponsors, streams and sets go.
        populate(parsed);
        parsed.version = 47;
      }
      if (parsed.version === 47) {
        // v48: cashouts of the removed hosts go too (their accounts are gone).
        const hostIds = ["hostMaya0000000000000000000006", "hostLeo00000000000000000000007", "hostNia00000000000000000000008"];
        parsed.cashWins = (parsed.cashWins ?? []).filter((r) => !hostIds.includes(r.userId));
        parsed.version = 48;
      }
      if (parsed.version === 48) {
        // v49: bundles no longer carry a default host or sponsor. A time slot that followed its
        // bundle's host keeps that host as its own.
        (parsed.scheduleSlots ?? []).forEach((sl) => {
          const mode = (parsed.gameModes ?? []).find((m) => m.id === (sl.gameMode ?? "TextChain"));
          if (!sl.hostId) sl.hostId = mode?.defaultHostId ?? parsed.hosts?.[0]?.id ?? "";
        });
        (parsed.gameModes ?? []).forEach((m) => {
          delete m.defaultHostId;
          delete m.defaultSponsorId;
        });
        parsed.version = 49;
      }
      if (parsed.version === 49) {
        // v50: bundles (points, showdown, rewards, messaging) are their own list, apart from the
        // games; a stream's game comes from its word set. Streams so far count as the cash bundle.
        parsed.bundles = seed.seedBundles();
        (parsed.streams ?? []).forEach((st) => (st.bundleId ??= seed.DEFAULT_BUNDLE_ID));
        parsed.version = 50;
      }
      if (parsed.version === 50) {
        // v51: word sets are words only (no Round Pounder rewards, no showdown prize). Game modes
        // made in the admin go (a new bundle does that job): what used them plays their base game.
        // An upcoming stream without any word has no format yet. Time slots carry no game.
        (parsed.wordSets ?? []).forEach((w) => {
          (w.rounds ?? []).forEach((r) => delete r.roundBusterReward);
          if (w.showdown) delete w.showdown.prize;
        });
        const baseOf = Object.fromEntries((parsed.gameModes ?? []).filter((m) => m.base).map((m) => [m.id, m.base]));
        parsed.gameModes = (parsed.gameModes ?? []).filter((m) => !m.base);
        (parsed.streams ?? []).forEach((st) => {
          if (baseOf[st.gameMode]) st.gameMode = baseOf[st.gameMode];
          const rounds = st.textSavvyRounds?.rounds ?? [];
          if (st.status === "Scheduled" && !rounds.some((r) => r.word) && !st.showdownConfiguration?.word) st.gameMode = null;
          if (st.status === "Scheduled") applyLibrary(st, parsed);
        });
        (parsed.wordSets ?? []).forEach((w) => baseOf[w.type] && (w.type = baseOf[w.type]));
        (parsed.scheduleSlots ?? []).forEach((sl) => delete sl.gameMode);
        parsed.version = 51;
      }
      if (parsed.version === 51 || parsed.version === 52) {
        // v52: the demo streams start over: one per state and edge case around today, with the
        // word sets they hold and a few ready ones.
        parsed.bundles ??= seed.seedBundles();
        populate(parsed);
        parsed.version = 53;
      }
      if (parsed.version === DB_VERSION) return parsed;
      // Older versions: add what's new and keep everything else.
      if (parsed.version === 4) {
        // v5: schedule slots and their default host
        if (!parsed.hosts.some((h) => h.id === seed.SCOTT.id)) parsed.hosts.push({ ...seed.SCOTT });
        parsed.scheduleSlots = seed.seedScheduleSlots();
        parsed.version = 5;
      }
      if (parsed.version === 5) {
        // v6: word sets
        parsed.wordSets = seed.seedWordSets();
        parsed.version = 6;
      }
      if (parsed.version === 6) {
        // v7: word sets hold whole rounds (or a showdown); slots carry default rewards
        parsed.wordSets = parsed.wordSets.map(seed.upgradeWordSet);
        parsed.scheduleSlots = parsed.scheduleSlots.map((sl) => ({ ...sl }));
        parsed.version = 7;
      }
      if (parsed.version === 7) {
        // v8: hosts carry their hero card image; upcoming streams take host and mode details from the libraries
        parsed.hosts = parsed.hosts.map((h) => ({ heroCardImageUrl: null, ...h }));
        parsed.streams.filter((s) => s.status === "Scheduled").forEach((s) => applyLibrary(s, parsed));
        parsed.version = 8;
      }
      if (parsed.version === 8) {
        // v9: "TextChain with Showdown" and "SubText with Showdown" presets, copied from their base modes
        parsed.gameModes = parsed.gameModes.flatMap((m) => [{ showdown: null, ...m }, seed.withShowdown(m)]);
        parsed.streams.filter((s) => s.status === "Scheduled").forEach((s) => applyLibrary(s, parsed));
        parsed.version = 9;
      }
      if (parsed.version === 9) {
        // v10: hosts are user accounts with the Host role
        parsed.hosts.forEach((h) => {
          if (!parsed.users.some((u) => u.id === h.id)) parsed.users.push(seed.hostAccount(h));
          parsed.claims[h.id] = { ...parsed.claims[h.id], role: "Host" };
        });
        parsed.version = 10;
      }
      if (parsed.version === 10) {
        // v11: new game mode descriptions (kept where an admin already changed them)
        const OLD = ["Chain of word rounds — add as many as you need.", "Fixed format of five rounds with a host stumper bonus.", "TextChain rounds, then a final showdown word.", "Five SubText rounds, then a final showdown word."];
        parsed.gameModes.forEach((m) => {
          if (OLD.includes(m.summary) && seed.MODE_SUMMARY[m.id]) m.summary = seed.MODE_SUMMARY[m.id];
        });
        parsed.version = 11;
      }
      if (parsed.version === 11) {
        // v12 added pack purchases; v13 removes them (purchases aren't tracked in the admin)
        parsed.version = 12;
      }
      if (parsed.version === 12) {
        delete parsed.shopPurchases;
        parsed.version = 13;
      }
      if (parsed.version === 13) {
        // v14: share card and notification presets
        parsed.sharePresets = seed.seedSharePresets();
        parsed.notificationPresets = seed.seedNotificationPresets();
        parsed.version = 14;
      }
      if (parsed.version === 14) {
        // v15: two game modes (Savvy TextChain, Savvy SubText), five rounds, each with a Savvy Showdown
        parsed.gameModes = parsed.gameModes
          .filter((m) => !m.id.endsWith("Showdown"))
          .map((m) => {
            const sd = parsed.gameModes.find((x) => x.id === `${m.id}Showdown`)?.showdown;
            return { ...m, name: m.name.startsWith("Savvy ") ? m.name : `Savvy ${m.name}`, summary: seed.MODE_SUMMARY[m.id], roundCount: 5, showdown: sd ?? seed.SHOWDOWN_DEFAULTS };
          });
        parsed.version = 15;
      }
      if (parsed.version === 15 || parsed.version === 16) {
        // v17: one complete stream per state (draft, scheduled, live, ended, canceled), the rest
        // removed; sample pictures for hosts, streams and sponsors
        populate(parsed);
        parsed.version = 17;
      }
      if (parsed.version === 17) {
        // v18: every game has five rounds, so every word set has five words
        parsed.wordSets = seed.seedWordSets();
        (parsed.gameModes ?? []).forEach((m) => (m.roundCount = 5));
        parsed.version = 18;
      }
      if (parsed.version === 18) {
        // v19: sample seasons — an upcoming one, the active one and two past ones
        parsed.seasons = seed.seedSeasons();
        parsed.version = 19;
      }
      if (parsed.version === 19) {
        // v20: unique sort slots (1, 2, 3…) in the shop lists, so reordering swaps cleanly
        for (const key of ["sparkPacks", "powerupPacks", "swag"]) {
          (parsed[key] ?? [])
            .map((x, i) => [x, i])
            .sort(([a, i], [b, j]) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || i - j)
            .forEach(([x], n) => (x.sortOrder = n + 1));
        }
        parsed.version = 20;
      }
      if (parsed.version === 20) {
        // v21: sample display names (one host keeps none, to show that case)
        const NAMES = { Lena: "Lena Park", Josh: "Josh Rivera", Maya: "Maya Chen", Scott: "Scott Lee" };
        parsed.hosts.forEach((h) => {
          if (!h.displayName && NAMES[h.name]) h.displayName = NAMES[h.name];
        });
        parsed.streams.forEach((st) => applyLibrary(st, parsed));
        parsed.version = 21;
      }
      if (parsed.version === 21) {
        // v22: one poll and one trivia question assigned to each upcoming stream, to show the state
        const upcoming = parsed.streams.filter((st) => st.status === "Scheduled").sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));
        ["Poll", "Trivia"].forEach((type) => {
          parsed.polls.filter((p) => p.type === type).slice(0, upcoming.length).forEach((p, i) => (p.streamId = upcoming[i].id));
        });
        parsed.version = 22;
      }
      if (parsed.version === 22) {
        // v23: word sets have a name
        (parsed.wordSets ?? []).forEach((w) => {
          if (!w.title) w.title = seed.wordSetTitle(w.type === "Showdown" ? w.showdown?.word : w.rounds?.[0]?.word);
        });
        parsed.version = 23;
      }
      if (parsed.version === 23) {
        // v24: a word set carries its showdown too. Round sets take the showdown sets' words in
        // turn (then a few spare words); the separate showdown sets go.
        const showdowns = (parsed.wordSets ?? []).filter((w) => w.type === "Showdown").map((w) => w.showdown);
        const spare = ["meadow", "harbor", "lantern", "comet", "forest", "canyon", "glacier", "island", "volcano"];
        parsed.wordSets = (parsed.wordSets ?? [])
          .filter((w) => w.type !== "Showdown")
          .map((w, i) => ({ ...w, showdown: w.showdown ?? showdowns[i] ?? { word: spare[i % spare.length], prize: { rewardType: "Cash", amount: 100 } } }));
        parsed.version = 24;
      }
      if (parsed.version === DB_VERSION) return parsed;
    }
  } catch {
    /* ignore */
  }
  return freshDb();
}
function save() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // Storage full (large pictures): the change lives in memory only, so say so instead of
    // letting it vanish on the next reload.
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("savvy-mock-save-failed"));
  }
}
if (typeof window !== "undefined") {
  window.__resetMockDb = () => {
    db = freshDb();
    save();
    window.location.reload();
  };
  window.__mockDb = () => db;
}

// ---------------------------------------------------------------- body parsing
const NUMERIC_KEYS = new Set([
  "amount", "sparksGranted", "sortOrder", "sparksPrice", "quantity", "durationInSeconds", "roundIndex",
  "greenLetterXp", "yellowLetterXp", "solveBonusXp", "timeBonusXp", "hostStumperBonusXp", "prizePool",
  "totalPrizePool", "durationSeconds", "sparks", "count", "totalScore", "powerupId",
  "roundCount", "roundDurationInSeconds",
]);

const fileToDataUrl = (file) =>
  new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => resolve(null);
    r.readAsDataURL(file);
  });

function setPath(obj, path, value) {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let cur = obj;
  parts.forEach((p, i) => {
    const last = i === parts.length - 1;
    const nextIsIndex = !last && /^\d+$/.test(parts[i + 1]);
    if (last) cur[p] = value;
    else {
      if (cur[p] == null) cur[p] = nextIsIndex ? [] : {};
      cur = cur[p];
    }
  });
}

async function parseBody(body) {
  if (body == null) return {};
  if (body instanceof FormData) {
    const out = {};
    for (const [key, value] of body.entries()) {
      let v = value;
      if (value instanceof File) v = { __file: await fileToDataUrl(value) };
      else {
        const leaf = key.split(/[.[\]]/).filter(Boolean).pop();
        if (value === "true") v = true;
        else if (value === "false") v = false;
        else if (NUMERIC_KEYS.has(leaf) && value !== "" && !isNaN(Number(value))) v = Number(value);
      }
      setPath(out, key, v);
    }
    return out;
  }
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

const fileUrl = (v) => (v && typeof v === "object" && v.__file ? v.__file : null);
const compactArr = (a) => (Array.isArray(a) ? a.filter((x) => x !== undefined) : a);

// ---------------------------------------------------------------- response helpers
const json = (body, status = 200) => ({ status, body });
const notFound = (msg = "Not Found") => json({ title: msg, detail: msg, status: 404 }, 404);
const badRequest = (errors) =>
  json({ title: "One or more validation errors occurred.", status: 400, errors }, 400);
const csv = (text, filename) => ({
  status: 200,
  body: text,
  headers: {
    "content-type": "text/csv; charset=utf-8",
    "content-disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  },
});
const csvCell = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
const paginate = (arr, q, defSize = 25) => {
  const page = Number(q.get("pageNumber") || 1);
  const size = Number(q.get("pageSize") || defSize);
  return arr.slice((page - 1) * size, page * size);
};

// ---------------------------------------------------------------- streams
// Host and game mode presentation (display name, hero card image, logo, pill) is edited in the
// Hosts and Game modes libraries; streams carry a copy so the app can show them.
const LIBRARY_STREAM_FIELDS = ["hostDisplayName", "heroCardHostImageUrl", "gameLogoUrl", "gameModeDisplayName", "gameModeIconUrl", "gameModeBackgroundColor"];
function applyLibrary(s, from = db) {
  const host = from.hosts.find((h) => h.id === s.hostId);
  if (host) {
    s.hostName = host.name;
    s.hostDisplayName = host.displayName ?? null;
    // The stream's pick of the host's hero card images, else the host's selected one.
    const cards = host.heroCardImageUrls ?? (host.heroCardImageUrl ? [host.heroCardImageUrl] : []);
    s.heroCardHostImageUrl = s.heroCardImageUrl && cards.includes(s.heroCardImageUrl) ? s.heroCardImageUrl : (host.heroCardImageUrl ?? null);
  }
  // The stream's format (How to play & format); without one it shows no logo or pill.
  const mode = from.gameModes.find((m) => m.id === s.gameMode);
  s.gameLogoUrl = mode?.gameLogoUrl ?? null;
  s.gameModeDisplayName = mode?.gameModeDisplayName ?? null;
  s.gameModeIconUrl = mode?.gameModeIconUrl ?? null;
  s.gameModeBackgroundColor = mode?.gameModeBackgroundColor ?? null;
  return s;
}
// Library edits reach streams that haven't started yet; past streams keep what they showed.
const refreshUpcoming = (match) => db.streams.filter((s) => s.status === "Scheduled" && match(s)).forEach((s) => applyLibrary(s));

const STREAM_FILE_FIELDS = {
  hostImageFile: "imageUrl",
  heroImageFile: "heroImageUrl",
};
const NULLABLE_STREAM_FIELDS = [
  "subtitle", "heroImageUrl", "sponsorship", "raffleSystemWinnersConfiguration",
  "hostBusterReward", "showdownConfiguration", "roundScoring", "round1StartsAt", "shareableCards",
];

function streamFromBody(b, existing) {
  const s = { ...(existing || {}) };
  // multipart: absent nullable keys mean "null" (serializer drops null values)
  NULLABLE_STREAM_FIELDS.forEach((k) => {
    s[k] = b[k] ?? null;
  });
  Object.entries(b).forEach(([k, v]) => {
    if (STREAM_FILE_FIELDS[k]) {
      const url = fileUrl(v);
      if (url) s[STREAM_FILE_FIELDS[k]] = url;
    } else s[k] = v;
  });
  if (!("imageUrl" in b) && !fileUrl(b.hostImageFile) && existing) s.imageUrl = existing.imageUrl ?? null;
  Object.keys(STREAM_FILE_FIELDS).forEach((k) => delete s[k]);
  LIBRARY_STREAM_FIELDS.forEach((k) => delete s[k]);
  applyLibrary(s);
  if (s.sponsorship) {
    const url = fileUrl(s.sponsorship.sponsorshipImageFile);
    if (url) s.sponsorship.imageUrl = url;
    delete s.sponsorship.sponsorshipImageFile;
    s.sponsorship.imageUrl = s.sponsorship.imageUrl ?? null;
  }
  ["defaultRewards", "raffleSystemWinnersConfiguration"].forEach((k) => {
    if (Array.isArray(s[k])) s[k] = compactArr(s[k]);
  });
  if (!Array.isArray(s.defaultRewards)) s.defaultRewards = [];
  if (s.textSavvyRounds?.rounds) {
    s.textSavvyRounds.rounds = compactArr(s.textSavvyRounds.rounds).map((r, i) => ({
      prizes: null,
      roundBusterReward: null,
      ...r,
      roundIndex: r.roundIndex ?? i,
    }));
  } else s.textSavvyRounds = { rounds: [] };
  s.headless = !!s.headless;
  s.isSpotlighted = !!s.isSpotlighted;
  s.entranceFee = s.entranceFee || { type: "Free", amount: 0 };
  return s;
}

function validateStream(s) {
  const errors = {};
  if (!s.title) errors.title = ["The Title field is required."];
  // Every stream names its host: the title keeps {host}.
  else if (!/\{host\}/i.test(s.title)) errors.title = ["Keep {host} in the title."];
  if (!s.hostId) errors.hostId = ["The HostId field is required."];
  if (!s.startDate) errors.startDate = ["The StartDate field is required."];
  return Object.keys(errors).length ? errors : null;
}

function listStreams(q) {
  let rows = [...db.streams];
  const term = (q.get("searchTerm") || "").toLowerCase();
  if (term)
    rows = rows.filter(
      (s) => s.title?.toLowerCase().includes(term) || s.hostName?.toLowerCase().includes(term),
    );
  const status = q.get("status");
  if (status) rows = rows.filter((s) => s.status === status);
  const start = q.get("startDate");
  if (start) rows = rows.filter((s) => Date.parse(s.startDate) >= Date.parse(start));
  const desc = q.get("isDescending") === "true";
  rows.sort((a, b) => (Date.parse(a.startDate) - Date.parse(b.startDate)) * (desc ? -1 : 1));
  return paginate(rows, q);
}

// ---------------------------------------------------------------- routing
const routes = [];
const on = (method, pattern, handler) => {
  const keys = [];
  const re = new RegExp(
    "^" + pattern.replace(/:([a-zA-Z]+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "/?$",
  );
  routes.push({ method, re, keys, handler });
};

export async function handleMockRequest({ method, path, query, body }) {
  // A real API's latency on reads, so loaders and skeletons show as they will in production.
  // Override with localStorage["savvy-mock-latency"] (ms; 0 turns it off).
  if (method === "get") {
    let ms = 450;
    try { const v = localStorage.getItem("savvy-mock-latency"); if (v != null) ms = Number(v) || 0; } catch {}
    if (ms) await new Promise((r) => setTimeout(r, ms));
  }
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = r.re.exec(path);
    if (!m) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    const parsed = await parseBody(body);
    try {
      const res = await r.handler({ params, query, body: parsed });
      save();
      return res;
    } catch (e) {
      console.error("[mock]", e);
      return json({ title: "Internal Server Error", detail: String(e?.message || e) }, 500);
    }
  }
  console.warn(`[mock] no handler for ${method.toUpperCase()} ${path}`);
  return notFound(`No mock handler for ${method.toUpperCase()} ${path}`);
}

// ---- Streams (default provider, resource TextSavvyStream)
on("get", "/TextSavvyStream", ({ query }) => json(listStreams(query)));
on("get", "/TextSavvyStream/list", ({ query }) => {
  const ids = query.getAll("streamId");
  if (ids.length) return json(db.streams.filter((s) => ids.includes(s.id)));
  return json(listStreams(query));
});
on("get", "/TextSavvyStream/stream-key/:id", ({ params }) => {
  if (!db.streamKeys[params.id]) db.streamKeys[params.id] = randomKey();
  return json(db.streamKeys[params.id]);
});
on("patch", "/TextSavvyStream/stream-key/:id", ({ params, body }) => {
  db.streamKeys[params.id] = body.streamKey ?? "";
  return json(db.streamKeys[params.id]);
});
on("post", "/TextSavvyStream/stream-key/:id/regenerate", ({ params }) => {
  db.streamKeys[params.id] = randomKey();
  return json(db.streamKeys[params.id]);
});
on("get", "/TextSavvyStream/:id", ({ params }) => {
  const s = db.streams.find((x) => x.id === params.id);
  return s ? json(s) : notFound();
});
// ---- Word sets ↔ streams. A set is a stream's words: one per round (TextChain / SubText) and its
// Savvy Showdown word. Rewards and the showdown prize stay the stream's (from its game mode). Public streams (Super Savvy only included) use a
// set once; Internal (test) streams may reuse sets, so they never hold one. A canceled stream gives
// its set back, and a set is released as soon as the stream's words no longer match it.
// A set's words and the stream's matching words: the rounds, plus the showdown word when the set has
// one (a set without a showdown leaves the stream's showdown alone).
const setWords = (w) => [...(w.rounds ?? []).map((r) => r.word), ...(w.showdown ? [w.showdown.word] : [])];
const streamWords = (s, w) => [...(s.textSavvyRounds?.rounds ?? []).map((r) => r.word ?? ""), ...(w.showdown ? [s.showdownConfiguration?.word ?? ""] : [])];
const holdsSets = (s) => s.streamType !== "Internal" && s.status !== "Canceled";
function applyWordSet(set, s) {
  const bundle = db.bundles.find((b) => b.id === s.bundleId);
  const prev = s.textSavvyRounds?.rounds ?? [];
  // A set is words (and their times) only: rewards and the showdown prize stay the stream's.
  s.textSavvyRounds = {
    ...s.textSavvyRounds,
    rounds: set.rounds.map((r, i) => ({
      prizes: null,
      roundBusterReward: { rewardType: "Sparks", amount: 5 * (i + 1) },
      ...prev[i],
      roundIndex: i,
      word: r.word,
      durationInSeconds: r.durationInSeconds || seed.secondsFor(r.word, i),
    })),
  };
  const superSavvyOnly = s.streamType === "SuperSavvy" || !!(s.showdownConfiguration ?? bundle?.showdown)?.superSavvyOnly;
  const prize = s.showdownConfiguration?.prize ?? bundle?.showdown?.prize ?? { rewardType: "Cash", amount: 100 };
  // The stream (from its bundle) decides whether there's a showdown; the set only brings its
  // word. A set without one leaves the showdown waiting for its word.
  if (set.showdown) s.showdownConfiguration = { word: set.showdown.word, prize: { ...prize }, superSavvyOnly };
  else if (s.showdownConfiguration) s.showdownConfiguration = { ...s.showdownConfiguration, word: "" };
}
function linkWordSet(setId, s) {
  if (!setId) return null;
  const set = db.wordSets.find((w) => w.id === setId);
  if (!set) return "That word set no longer exists.";
  if (holdsSets(s)) {
    if (set.streamId && set.streamId !== s.id) return "That word set is already used by another public stream.";
    db.wordSets.forEach((w) => {
      if (w.streamId === s.id && w !== set) w.streamId = null;
    });
    set.streamId = s.id;
  }
  return null;
}
function reconcileWordSets(s) {
  db.wordSets.forEach((w) => {
    if (w.streamId !== s.id) return;
    if (!holdsSets(s) || setWords(w).join(" ") !== streamWords(s, w).join(" ")) w.streamId = null;
  });
}
const takeSetIds = (b) => {
  const { wordSetId, showdownWordSetId, ...rest } = b;
  return [rest, [wordSetId, showdownWordSetId].filter(Boolean)];
};

on("post", "/TextSavvyStream", ({ body }) => {
  const [rest, setIds] = takeSetIds(body);
  const s = streamFromBody(rest, null);
  const errors = validateStream(s);
  if (errors) return badRequest(errors);
  s.id = uuid();
  s.status = "Scheduled";
  s.totalPrizePool = 0;
  if (!s.imageUrl) s.imageUrl = LOGO_URL;
  // The host's selected stream image, unless the stream has its own.
  if (!s.heroImageUrl) s.heroImageUrl = db.hosts.find((h) => h.id === s.hostId)?.streamImageUrl || STREAM_HERO_URL;
  for (const id of setIds) {
    const err = linkWordSet(id, s);
    if (err) return badRequest({ wordSetId: [err] });
    // A set picked when the stream is made brings its words and rewards, as anywhere else.
    applyWordSet(db.wordSets.find((w) => w.id === id), s);
  }
  showWhenReady(s);
  db.streams.push(s);
  db.streamKeys[s.id] = randomKey();
  reconcileWordSets(s);
  return json(s, 201);
});
// What a stream still misses before its words are complete (the app hides the game mode logo).
const missingWords = (s) => {
  const rounds = s.textSavvyRounds?.rounds ?? [];
  const issues = [];
  if (!s.hostId) issues.push("Choose a host");
  if (!db.gameModes.some((m) => m.id === s.gameMode)) issues.push("Pick a format");
  if (!rounds.length) issues.push("Add at least one round");
  else if (rounds.some((r) => !r.word)) issues.push("Every round needs a word");
  if (s.showdownConfiguration && !s.showdownConfiguration.word) issues.push("The showdown needs a word");
  return issues;
};
// The app shows every stream, but hides its game mode logo until the words are in; an upcoming
// stream that loses its words hides the logo again.
const showWhenReady = (s) => {
  if (s.status !== "Scheduled") return;
  delete s.isDraft;
  s.hideGameModeLogo = missingWords(s).length > 0;
};
// Creates a month of streams in one go (Fill month); `assignments` gives existing streams word sets.
// Nothing is saved when any set is no longer available.
on("post", "/TextSavvyStream/bulk", ({ body }) => {
  const items = Array.isArray(body?.streams) ? body.streams : [];
  const assignments = Array.isArray(body?.assignments) ? body.assignments : [];
  const wanted = [...items.flatMap((b) => [b.wordSetId, b.showdownWordSetId]), ...assignments.map((a) => a.wordSetId)].filter(Boolean);
  if (new Set(wanted).size !== wanted.length || wanted.some((id) => !db.wordSets.find((w) => w.id === id && !w.streamId)))
    return json({ title: "Word set taken", detail: "A word set is no longer available. Open Fill month again and retry.", status: 409 }, 409);
  const created = [];
  for (const b of items) {
    const [rest] = takeSetIds(b);
    const s = streamFromBody(rest, null);
    const errors = validateStream(s);
    if (errors) return badRequest(errors);
    created.push([{ ...s, id: uuid(), status: "Scheduled", totalPrizePool: 0, imageUrl: s.imageUrl || db.hosts.find((h) => h.id === s.hostId)?.imageUrl || LOGO_URL, heroImageUrl: s.heroImageUrl || db.hosts.find((h) => h.id === s.hostId)?.streamImageUrl || STREAM_HERO_URL }, b]);
  }
  created.forEach(([s, b]) => {
    db.streams.push(s);
    db.streamKeys[s.id] = randomKey();
    [b.wordSetId, b.showdownWordSetId].filter(Boolean).forEach((id) => {
      applyWordSet(db.wordSets.find((w) => w.id === id), s);
      linkWordSet(id, s);
    });
  });
  assignments.forEach(({ streamId, wordSetId }) => {
    const s = db.streams.find((x) => x.id === streamId);
    const set = db.wordSets.find((w) => w.id === wordSetId);
    if (!s || !set) return;
    applyWordSet(set, s);
    linkWordSet(set.id, s);
    showWhenReady(s);
  });
  created.forEach(([s]) => showWhenReady(s));
  return json(created.map(([s]) => s), 201);
});
// Change the host of upcoming streams (one from the calendar, or a hand-over from Hosts).
on("post", "/TextSavvyStream/host", ({ body }) => {
  const host = db.hosts.find((h) => h.id === body?.hostId);
  if (!host) return badRequest({ hostId: ["Choose a host."] });
  const ids = new Set(Array.isArray(body?.streamIds) ? body.streamIds : []);
  const updated = [];
  db.streams.forEach((s) => {
    if (!ids.has(s.id) || s.status !== "Scheduled") return;
    const prevHost = db.hosts.find((h) => h.id === s.hostId);
    // The stream image follows the host unless someone set a custom one.
    if (!s.imageUrl || s.imageUrl === LOGO_URL || s.imageUrl === prevHost?.imageUrl) s.imageUrl = host.imageUrl || LOGO_URL;
    if (host.streamImageUrl && (!s.heroImageUrl || s.heroImageUrl === STREAM_HERO_URL || s.heroImageUrl === prevHost?.streamImageUrl)) s.heroImageUrl = host.streamImageUrl;
    s.hostId = host.id;
    applyLibrary(s);
    updated.push(s);
  });
  return json(updated);
});
on("put", "/TextSavvyStream/:id", ({ params, body }) => {
  const i = db.streams.findIndex((x) => x.id === params.id);
  if (i < 0) return notFound();
  const [rest, setIds] = takeSetIds(body);
  const s = streamFromBody(rest, db.streams[i]);
  s.id = params.id;
  const errors = validateStream(s);
  if (errors) return badRequest(errors);
  for (const id of setIds) {
    const err = linkWordSet(id, s);
    if (err) return badRequest({ wordSetId: [err] });
  }
  showWhenReady(s);
  db.streams[i] = s;
  reconcileWordSets(s);
  return json(s);
});
on("delete", "/TextSavvyStream/:id", ({ params }) => {
  db.streams = db.streams.filter((x) => x.id !== params.id);
  db.wordSets.forEach((w) => {
    if (w.streamId === params.id) w.streamId = null;
  });
  return json({});
});

// ---- User roles (custom claims)
const claimsOf = (id) => db.claims[id] ?? {};
on("get", "/UserRole/:id/getUserClaims", ({ params }) => json(claimsOf(params.id)));
const promote = (role) => ({ params }) => {
  db.claims[params.id] = { ...claimsOf(params.id), role };
  if (role === "Host") hostProfile(params.id);
  return json({ success: true });
};
on("post", "/UserRole/:id/prmoteUserToHost", promote("Host"));
on("post", "/UserRole/:id/prmoteUserToInternal", promote("Internal"));
on("post", "/UserRole/:id/prmoteUserToAdmin", promote("Admin"));
on("post", "/UserRole/:id/clearUserRole", ({ params }) => {
  db.claims[params.id] = {};
  return json({ success: true });
});

// ---- User management
const STATUS_BY_NAME = { Active: 1, Reserved: 2, Banned: 3, ChatBanned: 4 };
on("get", "/UserManagement/users", ({ query }) => {
  const ids = query.getAll("userIds");
  return json(db.users.filter((u) => ids.includes(u.id)));
});
on("get", "/UserManagement", ({ query }) => {
  let rows = db.users;
  const term = (query.get("SearchTerm") || "").toLowerCase();
  const status = query.get("UserAccountStatus");
  const region = query.get("RegionCode");
  const filtered = !!(term || status || region);
  if (term)
    rows = rows.filter((u) =>
      [u.id, u.username, u.phoneNumber].some((v) => v && String(v).toLowerCase().includes(term)),
    );
  if (status) rows = rows.filter((u) => String(u.userAccountStatus) === String(status));
  if (region) rows = rows.filter((u) => u.regionCode === region);
  return json({
    records: paginate(rows, query),
    totalRecords: filtered ? rows.length : Math.max(rows.length, seed.VIRTUAL_USER_TOTAL),
  });
});
on("get", "/UserManagement/:id", ({ params }) => {
  const u = db.users.find((x) => x.id === params.id);
  return u ? json(u) : json({ detail: "User not found" }, 404);
});
on("patch", "/UserManagement", ({ body }) => {
  const value = STATUS_BY_NAME[body.UserAccountStatus] ?? body.UserAccountStatus;
  const updated = [];
  db.users.forEach((u) => {
    if (body.ids?.includes(u.id)) {
      u.userAccountStatus = value;
      updated.push(u);
    }
  });
  return json({ items: updated, total: updated.length });
});
on("patch", "/UserManagement/:id", ({ params, body }) => {
  const i = db.users.findIndex((x) => x.id === params.id);
  if (i < 0) return json({ detail: "User not found" }, 404);
  const taken = db.users.some((u) => u.id !== params.id && u.username === body.username);
  if (taken) return json({ detail: "Username is already taken." }, 400);
  db.users[i] = { ...db.users[i], ...body, id: params.id };
  return json(db.users[i]);
});

// ---- Cash wins
const CASH_STATUS = ["InProgress", "Approved", "Declined", "Expired"];
on("get", "/AccountBalanceManagement", ({ query }) => {
  let rows = [...db.cashWins].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const term = (query.get("SearchTerm") || "").toLowerCase();
  if (term) rows = rows.filter((r) => r.userId.toLowerCase().includes(term) || r.id.includes(term));
  const st = query.get("AccountbalanceHistoryStatus");
  if (st !== null && st !== "") {
    const name = /^\d+$/.test(st) ? CASH_STATUS[Number(st)] : st;
    rows = rows.filter((r) => r.status === name);
  }
  return json({ records: paginate(rows, query), totalRecords: rows.length });
});
on("patch", "/AccountBalanceManagement/:id", ({ params, query }) => {
  const row = db.cashWins.find((r) => r.id === params.id);
  if (!row) return notFound();
  row.status = query.get("status") ?? row.status;
  return json(row);
});

// ---- Amplitude (clone only)
on("post", "/__amplitude/track", ({ body }) => {
  db.amplitudeLog.push({ ...body, at: now() });
  console.info("[mock amplitude] identify + track", body);
  return json({ code: 200 });
});

// ---- Singleton configs
// Leaderboard resets: daily at a time, weekly on a weekday at the same time, in one time zone.
const RESET_DEFAULTS = { time: "03:00", weekday: 6, timezone: "America/New_York" };
on("get", "/admin/leaderboard-resets", () => json({ ...RESET_DEFAULTS, ...db.leaderboardResets }));
on("put", "/admin/leaderboard-resets", ({ body }) => {
  const next = { ...RESET_DEFAULTS, ...db.leaderboardResets, ...body };
  const errors = {};
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(next.time)) errors.time = ["Pick a time."];
  if (!(Number.isInteger(next.weekday) && next.weekday >= 0 && next.weekday <= 6)) errors.weekday = ["Pick a day."];
  if (Object.keys(errors).length) return badRequest(errors);
  db.leaderboardResets = { time: next.time, weekday: next.weekday, timezone: next.timezone };
  return json(db.leaderboardResets);
});
on("get", "/admin/howtoplay", () => json(db.howToPlay));
on("put", "/admin/howtoplay", ({ body }) => {
  const powerUps = compactArr(body.powerUps ?? []).map((p) => {
    const url = fileUrl(p.iconFile);
    const { iconFile, ...rest } = p;
    return { ...rest, iconUrl: url || rest.iconUrl || "" };
  });
  const errors = {};
  powerUps.forEach((p, i) => {
    if (!p.title) errors[`PowerUps[${i}].Title`] = ["Title is required."];
  });
  if (Object.keys(errors).length) return badRequest(errors);
  db.howToPlay = { powerUps };
  return json(db.howToPlay);
});
// ---- Game modes (prototype endpoints)
on("get", "/admin/game-modes", () => json(db.gameModes));
on("get", "/admin/game-modes/:id", ({ params }) => {
  const m = db.gameModes.find((x) => x.id === params.id);
  return m ? json(m) : notFound();
});
on("put", "/admin/game-modes/:id", ({ params, body }) => {
  const i = db.gameModes.findIndex((x) => x.id === params.id);
  if (i < 0) return notFound();
  const prev = db.gameModes[i];
  const errors = {};
  const count = Number(body.roundCount);
  if (prev.id === "SubText" && count !== 5) errors.roundCount = ["SubText always has 5 rounds."];
  if (!(count >= 1 && count <= 20)) errors.roundCount = ["Use 1 to 20 rounds."];
  if (!(Number(body.roundDurationInSeconds) >= 5)) errors.roundDurationInSeconds = ["At least 5 seconds."];
  const powerUps = compactArr(body.howToPlay?.powerUps ?? []).map((p) => {
    const { iconFile, ...rest } = p;
    return { title: rest.title ?? "", description: rest.description ?? "", iconUrl: fileUrl(iconFile) || rest.iconUrl || "" };
  });
  powerUps.forEach((p, j) => {
    if (!p.title) errors[`howToPlay.powerUps[${j}].title`] = ["Title is required."];
  });
  if (Object.keys(errors).length) return badRequest(errors);
  db.gameModes[i] = {
    ...prev,
    name: String(body.name ?? "").trim() || prev.name,
    summary: body.summary ?? prev.summary,
    roundCount: count,
    roundDurationInSeconds: Number(body.roundDurationInSeconds),
    roundScoring: body.roundScoring ?? prev.roundScoring,
    hostStumperBonusXp: body.hostStumperBonusXp ?? null,
    defaultRewards: compactArr(body.defaultRewards ?? []),
    gameModeDisplayName: body.gameModeDisplayName || null,
    gameModeBackgroundColor: body.gameModeBackgroundColor || null,
    gameModeIconUrl: fileUrl(body.gameModeIconFile) || body.gameModeIconUrl || null,
    gameLogoUrl: fileUrl(body.gameLogoFile) || body.gameLogoUrl || null,
    howToPlay: { powerUps },
    // The share card and notification presets new streams of this mode start from (none: the
    // libraries' Default preset).
    defaultSharePresetId: body.defaultSharePresetId || null,
    defaultNotificationPresetId: body.defaultNotificationPresetId || null,
    showdown: prev.showdown ? { prize: { rewardType: body.showdown?.prize?.rewardType ?? "Cash", amount: Number(body.showdown?.prize?.amount) || 1 }, superSavvyOnly: !!body.showdown?.superSavvyOnly } : null,
  };
  refreshUpcoming((s) => s.gameMode === db.gameModes[i].id);
  return json(db.gameModes[i]);
});

// ---- Bundles (prototype endpoints): what new streams start with. JSON bodies.
const bundleFrom = (body, prev) => ({
  ...prev,
  name: String(body.name ?? "").trim(),
  roundScoring: body.roundScoring ?? prev.roundScoring,
  hostStumperBonusXp: body.hostStumperBonusXp ?? null,
  defaultRewards: compactArr(body.defaultRewards ?? []),
  showdown: { prize: { rewardType: body.showdown?.prize?.rewardType ?? "Cash", amount: Number(body.showdown?.prize?.amount) || 1 }, superSavvyOnly: !!body.showdown?.superSavvyOnly },
  defaultSharePresetId: body.defaultSharePresetId || null,
  defaultNotificationPresetId: body.defaultNotificationPresetId || null,
});
const bundleNameError = (name, id) => (!name ? "Enter a name." : name.length > 40 ? "Use 40 characters or fewer." : db.bundles.some((b) => b.id !== id && b.name.toLowerCase() === name.toLowerCase()) ? "A bundle with this name exists." : null);
on("get", "/admin/bundles", () => json(db.bundles));
on("get", "/admin/bundles/:id", ({ params }) => {
  const b = db.bundles.find((x) => x.id === params.id);
  return b ? json(b) : notFound();
});
// A new bundle starts as a copy of the plain cash bundle (else the first one), under its own name.
on("post", "/admin/bundles", ({ body }) => {
  const name = String(body?.name ?? "").trim();
  const error = bundleNameError(name);
  if (error) return badRequest({ name: [error] });
  const b = { ...structuredClone(db.bundles.find((x) => x.id === seed.DEFAULT_BUNDLE_ID) ?? db.bundles[0] ?? seed.seedBundles()[0]), id: uuid(), name };
  db.bundles.push(b);
  return json(b, 201);
});
on("put", "/admin/bundles/:id", ({ params, body }) => {
  const i = db.bundles.findIndex((x) => x.id === params.id);
  if (i < 0) return notFound();
  const error = bundleNameError(String(body.name ?? "").trim(), params.id);
  if (error) return badRequest({ name: [error] });
  db.bundles[i] = bundleFrom(body, db.bundles[i]);
  return json(db.bundles[i]);
});
on("delete", "/admin/bundles/:id", ({ params }) => {
  if (!db.bundles.some((x) => x.id === params.id)) return notFound();
  if (db.bundles.length === 1) return badRequest({ id: ["Keep at least one bundle."] });
  db.bundles = db.bundles.filter((x) => x.id !== params.id);
  return json({ id: params.id });
});

// ---- Schedule slots (prototype endpoints): the whole list is read and replaced at once.
on("get", "/admin/schedule-slots", () => json(db.scheduleSlots));
on("put", "/admin/schedule-slots", ({ body }) => {
  const slots = Array.isArray(body?.slots) ? body.slots : [];
  const errors = {};
  const seen = new Set();
  slots.forEach((sl, i) => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(sl.time ?? "")) errors[`slots[${i}].time`] = ["Pick a time."];
    else if (seen.has(sl.time)) errors[`slots[${i}].time`] = ["Another slot already uses this time."];
    seen.add(sl.time);
    if (!db.hosts.some((h) => h.id === sl.hostId)) errors[`slots[${i}].hostId`] = ["Choose a host."];
  });
  if (Object.keys(errors).length) return badRequest(errors);
  db.scheduleSlots = slots
    .map((sl) => ({ ...sl, id: sl.id || uuid(), title: "You vs {host}" }))
    .sort((a, b) => a.time.localeCompare(b.time));
  return json(db.scheduleSlots);
});

// ---- Word sets (prototype endpoints)
function wordSetFromBody(b, prev) {
  const word = (v) => String(v ?? "").trim().toLowerCase();
  const title = String(b.title ?? prev?.title ?? "").trim();
  // Time comes with the round; without one, from the word's length.
  const rounds = compactArr(Array.isArray(b.rounds) ? b.rounds : []).map((r, i) => {
    const w = word(r.word);
    return { roundIndex: i, word: w, durationInSeconds: Number(r.durationInSeconds) || seed.secondsFor(w, i) };
  });
  // The showdown is optional: null (or left out on a new set) means a set without one.
  const sd = "showdown" in b ? b.showdown : prev?.showdown;
  // Words only: rewards and the showdown prize belong to the stream (from its bundle).
  const showdown = sd ? { word: word(sd.word) } : null;
  return { title, rounds, showdown };
}
function wordSetErrors(w) {
  const errors = {};
  const okWord = (v) => /^[a-z]+$/.test(v);
  if (!w.title) errors.title = ["Enter a name."];
  const n = w.rounds.length;
  if (n < 5 || n > 20) errors.rounds = ["Use 5 to 20 rounds."];
  w.rounds.forEach((r, i) => {
    if (!okWord(r.word)) errors[`rounds[${i}].word`] = ["Lowercase letters a–z only."];
    if (!(Number.isInteger(r.durationInSeconds) && r.durationInSeconds >= 10 && r.durationInSeconds <= 300)) errors[`rounds[${i}].durationInSeconds`] = ["10–300 s"];
  });
  if (w.showdown && !okWord(w.showdown.word)) errors["showdown.word"] = ["Lowercase letters a–z only."];
  return errors;
}
// Words are hidden in the admin until someone enters the words password.
on("post", "/admin/word-sets/unlock", ({ body }) =>
  body?.password === seed.WORDS_PASSWORD ? json({ ok: true }) : json({ title: "Wrong password", detail: "That password isn't right.", status: 403 }, 403),
);
on("get", "/admin/word-sets", () => json(db.wordSets));
on("post", "/admin/word-sets", ({ body }) => {
  const w = { id: uuid(), ...wordSetFromBody(body ?? {}), streamId: null, createdAt: now() };
  const errors = wordSetErrors(w);
  if (Object.keys(errors).length) return badRequest(errors);
  db.wordSets.push(w);
  return json(w, 201);
});
on("put", "/admin/word-sets/:id", ({ params, body }) => {
  const i = db.wordSets.findIndex((x) => x.id === params.id);
  if (i < 0) return notFound();
  const prev = db.wordSets[i];
  const next = { ...prev, ...wordSetFromBody(body ?? {}, prev) };
  const errors = wordSetErrors(next);
  if (Object.keys(errors).length) return badRequest(errors);
  db.wordSets[i] = next;
  // A stream keeps the words it was given; if they no longer match, the set is released.
  const s = db.streams.find((x) => x.id === next.streamId);
  if (s) reconcileWordSets(s);
  return json(db.wordSets[i]);
});
on("delete", "/admin/word-sets/:id", ({ params }) => {
  const w = db.wordSets.find((x) => x.id === params.id);
  if (!w) return notFound();
  if (w.streamId) return json({ title: "In use", detail: "Release the set from its stream first.", status: 400 }, 400);
  db.wordSets = db.wordSets.filter((x) => x.id !== params.id);
  return json({});
});
// Copies the set into the stream (rounds or showdown) and links it when the stream is public.
on("post", "/admin/word-sets/:id/assign", ({ params, body }) => {
  const set = db.wordSets.find((x) => x.id === params.id);
  const s = db.streams.find((x) => x.id === body?.streamId);
  if (!set || !s) return notFound();
  if (s.status !== "Scheduled") return json({ title: "Can't assign", detail: "Only upcoming streams can get new words.", status: 400 }, 400);
  const err = linkWordSet(set.id, s);
  if (err) return json({ title: "Can't assign", detail: err, status: 400 }, 400);
  applyWordSet(set, s);
  showWhenReady(s);
  return json({ set, stream: s });
});
// Gives the set back and clears those words from the stream, so they can't be played twice.
on("post", "/admin/word-sets/:id/release", ({ params }) => {
  const set = db.wordSets.find((x) => x.id === params.id);
  if (!set) return notFound();
  const s = db.streams.find((x) => x.id === set.streamId);
  if (s && s.status !== "Scheduled") return json({ title: "Already played", detail: "The stream has started, so the set stays used.", status: 400 }, 400);
  if (s) {
    s.textSavvyRounds.rounds.forEach((r) => (r.word = ""));
    if (s.showdownConfiguration) s.showdownConfiguration.word = "";
    showWhenReady(s);
  }
  set.streamId = null;
  return json({ set, stream: s ?? null });
});

// ---- Host & sponsor libraries (prototype endpoints)
const textLen = (v) => String(v ?? "").trim().length;
// Each host picture kind keeps up to five images; the selected one is what new streams use.
const HOST_GALLERIES = [
  ["pictureUrls", "imageUrl"],
  ["streamImageUrls", "streamImageUrl"],
  ["heroCardImageUrls", "heroCardImageUrl"],
];
function hostFromBody(b, prev) {
  const h = {
    id: prev?.id ?? String(b.id ?? "").trim(),
    name: String(b.name ?? "").trim(),
    displayName: b.displayName ? String(b.displayName).trim() : null,
  };
  HOST_GALLERIES.forEach(([list, pick]) => {
    const urls = (Array.isArray(b[list]) ? compactArr(b[list]) : prev?.[list] ?? []).filter(Boolean).slice(0, 5);
    const chosen = pick in b ? b[pick] || null : prev?.[pick] ?? null;
    h[list] = urls;
    h[pick] = urls.includes(chosen) ? chosen : (urls[0] ?? null);
  });
  return h;
}
/** A host with its galleries (older profiles only have the selected picture). */
const withGalleries = (h) => ({
  ...h,
  ...Object.fromEntries(HOST_GALLERIES.map(([list, pick]) => [list, h[list] ?? (h[pick] ? [h[pick]] : [])])),
  streamImageUrl: h.streamImageUrl ?? null,
});
function validateHost(h, isNew) {
  const errors = {};
  if (isNew && !h.id) errors.id = ["Choose the host's Savvy account."];
  else if (isNew && !db.users.some((u) => u.id === h.id)) errors.id = ["No Savvy account has this ID."];
  else if (isNew && isHost(h.id)) errors.id = ["This account is already a host."];
  if (!h.name) errors.name = ["Enter a name."];
  return Object.keys(errors).length ? errors : null;
}
// The Hosts library lists the accounts with the Host role; `db.hosts` keeps their host profile
// (name in the dashboard, display name and pictures in the app), also after the role is removed.
const isHost = (id) => claimsOf(id).role === "Host";
function hostProfile(id) {
  let h = db.hosts.find((x) => x.id === id);
  if (!h) {
    const u = db.users.find((x) => x.id === id);
    h = { id, name: u?.username ?? id, displayName: null, imageUrl: null, heroCardImageUrl: null };
    db.hosts.push(h);
  }
  return h;
}
const withAccount = (h) => ({ ...withGalleries(h), username: db.users.find((u) => u.id === h.id)?.username ?? null });
on("get", "/admin/hosts", () => json(db.users.filter((u) => isHost(u.id)).map((u) => withAccount(hostProfile(u.id)))));
on("get", "/admin/hosts/:id", ({ params }) => (isHost(params.id) ? json(withAccount(hostProfile(params.id))) : notFound()));
// Adding a host gives the account the Host role.
on("post", "/admin/hosts", ({ body }) => {
  const h = hostFromBody(body, null);
  const errors = validateHost(h, true);
  if (errors) return badRequest(errors);
  db.hosts = [...db.hosts.filter((x) => x.id !== h.id), h];
  db.claims[h.id] = { ...claimsOf(h.id), role: "Host" };
  return json(withAccount(h), 201);
});
on("put", "/admin/hosts/:id", ({ params, body }) => {
  const i = db.hosts.findIndex((x) => x.id === params.id);
  if (i < 0) return notFound();
  const prev = withGalleries(db.hosts[i]);
  const h = hostFromBody(body, prev);
  const errors = validateHost(h, false);
  if (errors) return badRequest(errors);
  db.hosts[i] = h;
  // Upcoming streams showing the host's previously selected pictures switch to the new ones;
  // a stream with its own uploaded picture keeps it.
  db.streams.forEach((s) => {
    if (s.status !== "Scheduled" || s.hostId !== h.id) return;
    if (h.imageUrl && s.imageUrl === prev.imageUrl) s.imageUrl = h.imageUrl;
    if (h.streamImageUrl && (s.heroImageUrl === prev.streamImageUrl || s.heroImageUrl === STREAM_HERO_URL)) s.heroImageUrl = h.streamImageUrl;
  });
  refreshUpcoming((s) => s.hostId === h.id);
  return json(withAccount(h));
});
// Removing a host takes away the Host role; the account and its host profile stay.
on("delete", "/admin/hosts/:id", ({ params }) => {
  if (isHost(params.id)) db.claims[params.id] = {};
  return json({ id: params.id });
});

function sponsorFromBody(b, prev) {
  return {
    id: prev?.id ?? uuid(),
    name: String(b.name ?? "").trim(),
    title: String(b.title ?? "").trim(),
    description: String(b.description ?? "").trim(),
    cta: String(b.cta ?? "").trim(),
    imageUrl: fileUrl(b.imageFile) || b.imageUrl || null,
  };
}
function validateSponsor(s) {
  const errors = {};
  if (!s.name) errors.name = ["Enter a name."];
  if (textLen(s.title) < 1 || textLen(s.title) > 30) errors.title = ["Use 1–30 characters."];
  if (textLen(s.description) < 1 || textLen(s.description) > 60) errors.description = ["Use 1–60 characters."];
  if (!s.cta) errors.cta = ["Add the link players open."];
  return Object.keys(errors).length ? errors : null;
}
on("get", "/admin/sponsors", () => json(db.sponsors));
on("get", "/admin/sponsors/:id", ({ params }) => {
  const s = db.sponsors.find((x) => x.id === params.id);
  return s ? json(s) : notFound();
});
on("post", "/admin/sponsors", ({ body }) => {
  const s = sponsorFromBody(body, null);
  const errors = validateSponsor(s);
  if (errors) return badRequest(errors);
  db.sponsors.push(s);
  return json(s, 201);
});
on("put", "/admin/sponsors/:id", ({ params, body }) => {
  const i = db.sponsors.findIndex((x) => x.id === params.id);
  if (i < 0) return notFound();
  const s = sponsorFromBody(body, db.sponsors[i]);
  const errors = validateSponsor(s);
  if (errors) return badRequest(errors);
  db.sponsors[i] = s;
  return json(s);
});
on("delete", "/admin/sponsors/:id", ({ params }) => {
  db.sponsors = db.sponsors.filter((x) => x.id !== params.id);
  return json({ id: params.id });
});

// ---- Share card and notification presets (named, picked per stream). JSON bodies.
for (const [path, key] of [["share-presets", "sharePresets"], ["notification-presets", "notificationPresets"], ["app-card-presets", "appCardPresets"], ["puzzle-card-presets", "puzzleCardPresets"]]) {
  on("get", `/admin/${path}`, () => json(db[key]));
  on("get", `/admin/${path}/:id`, ({ params }) => {
    const p = db[key].find((x) => x.id === params.id);
    return p ? json(p) : notFound();
  });
  on("post", `/admin/${path}`, ({ body }) => {
    if (!String(body.name ?? "").trim()) return badRequest({ name: ["Enter a name."] });
    const p = { ...body, id: uuid(), name: body.name.trim() };
    db[key].push(p);
    return json(p, 201);
  });
  on("put", `/admin/${path}/:id`, ({ params, body }) => {
    const i = db[key].findIndex((x) => x.id === params.id);
    if (i < 0) return notFound();
    if (!String(body.name ?? "").trim()) return badRequest({ name: ["Enter a name."] });
    db[key][i] = { ...body, id: params.id, name: body.name.trim() };
    // One default per kind (the preset new streams start from).
    if (body.isDefault) db[key].forEach((x, j) => j !== i && (x.isDefault = false));
    return json(db[key][i]);
  });
  on("delete", `/admin/${path}/:id`, ({ params }) => {
    db[key] = db[key].filter((x) => x.id !== params.id);
    return json({ id: params.id });
  });
}

on("get", "/admin/share-config", () => json(db.shareConfig));
on("put", "/admin/share-config", ({ body }) => {
  const { id, ...rest } = body;
  db.shareConfig = { ...db.shareConfig, ...rest };
  return json(db.shareConfig);
});
on("get", "/admin/reward-config", () => json(db.rewardConfig));
on("put", "/admin/reward-config", ({ body }) => {
  db.rewardConfig = { dailyPuzzleReward: body.dailyPuzzleReward ?? null };
  return json(db.rewardConfig);
});

// ---- Spark packs
const bySort = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
on("get", "/admin/spark-packs", () => json([...db.sparkPacks].sort(bySort)));
on("get", "/admin/spark-packs/:id", ({ params }) => {
  const p = db.sparkPacks.find((x) => x.id === params.id);
  return p ? json(p) : notFound();
});
on("post", "/admin/spark-packs", ({ body }) => {
  const errors = {};
  if (!body.rcProductId) errors.Id = ["RevenueCat product id is required."];
  else if (db.sparkPacks.some((p) => p.id === body.rcProductId)) errors.Id = ["A spark pack with this product id already exists."];
  if (!(body.sparksGranted > 0)) errors.SparksGranted = ["Sparks granted must be greater than 0."];
  if (!fileUrl(body.iconFile)) errors.IconFile = ["Icon is required."];
  if (Object.keys(errors).length) return json({ title: "Validation failed", ValidationErrors: errors }, 400);
  const p = {
    id: body.rcProductId,
    sparksGranted: body.sparksGranted,
    sortOrder: Math.max(0, ...db.sparkPacks.map((x) => x.sortOrder ?? 0)) + 1,
    isEnabled: body.isEnabled ?? true,
    iconUrl: fileUrl(body.iconFile),
    editedAt: now(),
  };
  db.sparkPacks.push(p);
  return json(p, 201);
});
on("patch", "/admin/spark-packs/:id", ({ params, body }) => {
  const p = db.sparkPacks.find((x) => x.id === params.id);
  if (!p) return notFound();
  const { iconFile, id, rcProductId, editedAt, ...rest } = body;
  if (typeof rest.sortOrder === "number" && rest.sortOrder !== p.sortOrder) {
    // reorder: swap with the pack currently holding the target slot
    const other = db.sparkPacks.find((x) => x !== p && x.sortOrder === rest.sortOrder);
    if (other) other.sortOrder = p.sortOrder;
  }
  Object.assign(p, rest, { editedAt: now() });
  const url = fileUrl(iconFile);
  if (url) p.iconUrl = url;
  return json(p);
});
on("delete", "/admin/spark-packs/:id", ({ params }) => {
  db.sparkPacks = db.sparkPacks.filter((x) => x.id !== params.id);
  return json({});
});

// ---- Powerup packs
function packFromBody(body, existing) {
  const contents = JSON.parse(body.contentsJson || "[]").map((c, i) => {
    const url = fileUrl(body.contentIcon?.[i]);
    return { powerupType: c.powerupType, quantity: Number(c.quantity), iconUrl: url || c.iconUrl || "" };
  });
  const { contentsJson, contentIcon, contentIconFiles, imageFile, id, editedAt, ...rest } = body;
  const pack = { ...(existing || {}), ...rest, description: rest.description || null, contents, editedAt: now() };
  // The pack's own picture (optional; the Shop falls back to the first power-up's icon).
  const image = fileUrl(imageFile);
  if (image) pack.imageUrl = image;
  return pack;
}
on("get", "/admin/powerup-packs", () => json([...db.powerupPacks].sort(bySort)));
on("get", "/admin/powerup-packs/:id", ({ params }) => {
  const p = db.powerupPacks.find((x) => x.id === params.id);
  return p ? json(p) : notFound();
});
on("post", "/admin/powerup-packs", ({ body }) => {
  const p = packFromBody(body, null);
  if (!p.title) return badRequest({ title: ["Title is required."] });
  p.id = uuid();
  p.sortOrder = Math.max(-1, ...db.powerupPacks.map((x) => x.sortOrder ?? 0)) + 1;
  db.powerupPacks.push(p);
  return json(p, 201);
});
on("put", "/admin/powerup-packs/:id", ({ params, body }) => {
  const i = db.powerupPacks.findIndex((x) => x.id === params.id);
  if (i < 0) return notFound();
  if (typeof body.sortOrder === "number" && body.sortOrder !== db.powerupPacks[i].sortOrder) {
    // reorder: swap with the pack currently holding the target slot
    const other = db.powerupPacks.find((x, j) => j !== i && x.sortOrder === body.sortOrder);
    if (other) other.sortOrder = db.powerupPacks[i].sortOrder;
  }
  db.powerupPacks[i] = { ...packFromBody(body, db.powerupPacks[i]), id: params.id };
  return json(db.powerupPacks[i]);
});
on("delete", "/admin/powerup-packs/:id", ({ params }) => {
  db.powerupPacks = db.powerupPacks.filter((x) => x.id !== params.id);
  return json({});
});

// ---- Savvy swag
function swagFromBody(body, existing) {
  const out = { ...(existing || {}) };
  const { images, variants, id, editedAt, imageUrls, imageUrl, ...rest } = body;
  Object.assign(out, rest);
  if (images !== undefined || !existing) {
    out.imageUrls = compactArr(images ?? []).map((im) => fileUrl(im.file) || im.url).filter(Boolean);
    out.imageUrl = out.imageUrls[0] ?? null;
  }
  if (variants !== undefined || "variantType" in body) {
    out.variants =
      out.variantType === "Size"
        ? compactArr(variants ?? []).map((v) => ({ label: v.label, isAvailable: !!v.isAvailable, quantity: v.quantity ?? null }))
        : [];
  }
  if ("variantType" in body) out.quantity = out.variantType === "Size" ? null : body.quantity ?? null;
  out.editedAt = now();
  return out;
}
on("get", "/admin/savvy-swag", () => json([...db.swag].sort(bySort)));
on("get", "/admin/savvy-swag/:id", ({ params }) => {
  const s = db.swag.find((x) => x.id === params.id);
  return s ? json(s) : notFound();
});
on("post", "/admin/savvy-swag", ({ body }) => {
  const s = swagFromBody(body, null);
  if (!s.title) return badRequest({ title: ["Title is required."] });
  s.id = uuid();
  s.sortOrder = Math.max(0, ...db.swag.map((x) => x.sortOrder ?? 0)) + 1;
  s.isEnabled = s.isEnabled ?? true;
  s.isSuperSavvyOnly = s.isSuperSavvyOnly ?? false;
  db.swag.push(s);
  return json(s, 201);
});
on("patch", "/admin/savvy-swag/:id", ({ params, body }) => {
  const i = db.swag.findIndex((x) => x.id === params.id);
  if (i < 0) return notFound();
  if (typeof body.sortOrder === "number" && body.sortOrder !== db.swag[i].sortOrder) {
    // reorder: backend re-sequences the neighbour that held the target slot
    const other = db.swag.find((x, j) => j !== i && x.sortOrder === body.sortOrder);
    if (other) other.sortOrder = db.swag[i].sortOrder;
  }
  db.swag[i] = { ...swagFromBody(body, db.swag[i]), id: params.id };
  return json(db.swag[i]);
});
on("delete", "/admin/savvy-swag/:id", ({ params }) => {
  db.swag = db.swag.filter((x) => x.id !== params.id);
  return json({});
});

// ---- Swag orders
function filterOrders(query) {
  let rows = [...db.swagOrders].sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt));
  const term = (query.get("searchTerm") || "").toLowerCase();
  if (term)
    rows = rows.filter((o) => {
      const user = db.users.find((u) => u.id === o.userId);
      return [o.orderNumber, o.itemTitle, o.userId, user?.username, o.shippingAddress?.recipientName, o.shippingAddress?.email]
        .some((v) => v && String(v).toLowerCase().includes(term));
    });
  const from = query.get("fromDate");
  const to = query.get("toDate");
  if (from) rows = rows.filter((o) => Date.parse(o.placedAt) >= Date.parse(from));
  if (to) rows = rows.filter((o) => Date.parse(o.placedAt) <= Date.parse(to));
  const delivered = query.get("isDelivered");
  if (delivered === "true") rows = rows.filter((o) => !!o.deliveredAt);
  if (delivered === "false") rows = rows.filter((o) => !o.deliveredAt);
  return rows;
}
on("get", "/admin/swag-orders", ({ query }) => {
  const rows = filterOrders(query);
  return json({ records: paginate(rows, query), totalRecords: rows.length });
});
on("get", "/admin/swag-orders/export", ({ query }) => {
  const rows = filterOrders(query);
  const header = ["Order Number", "Placed At (UTC)", "User ID", "Username", "Item", "Size", "Sparks Spent", "Delivered At (UTC)", "Tracking Number", "Recipient", "Email", "Street Address", "City", "State", "Postcode"];
  const body = rows.map((o) => [
    o.orderNumber, o.placedAt, o.userId, db.users.find((u) => u.id === o.userId)?.username ?? "", o.itemTitle,
    o.variantLabel ?? "", o.sparksSpent, o.deliveredAt ?? "", o.trackingNumber ?? "",
    o.shippingAddress?.recipientName, o.shippingAddress?.email, o.shippingAddress?.streetAddress,
    o.shippingAddress?.city, o.shippingAddress?.state, o.shippingAddress?.postcode,
  ]);
  return csv(toCsv([header, ...body]), `swag-orders-${new Date().toISOString().slice(0, 10)}.csv`);
});
on("patch", "/admin/swag-orders/:userId/:orderNumber/delivered", ({ params, body }) => {
  const o = db.swagOrders.find((x) => x.orderNumber === params.orderNumber && x.userId === params.userId);
  if (!o) return notFound("Order not found.");
  if (body.isDelivered) {
    o.deliveredAt = now();
    o.trackingNumber = body.trackingNumber ?? null;
  } else {
    o.deliveredAt = null;
    o.trackingNumber = null;
  }
  return json(o);
});

// ---- Seasons
on("get", "/admin/Season", ({ query }) => {
  const field = query.get("sortBy") || "startsAt";
  const desc = query.get("isDescending") === "true";
  const rows = [...db.seasons].sort((a, b) => {
    const av = a[field], bv = b[field];
    const cmp = typeof av === "string" ? String(av).localeCompare(String(bv)) : (av ?? 0) - (bv ?? 0);
    return desc ? -cmp : cmp;
  });
  return json({ items: paginate(rows, query, 100), total: rows.length });
});
on("get", "/admin/Season/:id", ({ params }) => {
  const s = db.seasons.find((x) => x.id === params.id);
  return s ? json(s) : notFound();
});
const refreshActiveSeasons = () => {
  const t = Date.now();
  db.seasons.forEach((s) => {
    s.isActive = Date.parse(s.startsAt) <= t && t < Date.parse(s.endsAt);
  });
};
on("post", "/admin/Season/reset", () => {
  const active = db.seasons.find((s) => s.isActive);
  if (!active) return json({ detail: "There is no active season to reset." }, 400);
  return json({ seasonId: active.id, resetAt: now() });
});
on("post", "/admin/Season", ({ body }) => {
  if (!body.title) return badRequest({ Title: ["Title is required."] });
  if (Date.parse(body.endsAt) <= Date.parse(body.startsAt)) return badRequest({ EndsAt: ["End must be after start."] });
  const s = {
    id: uuid(),
    title: body.title,
    startsAt: body.startsAt,
    endsAt: body.endsAt,
    iconUrl: fileUrl(body.iconFile),
    isActive: false,
    editedAt: now(),
  };
  db.seasons.push(s);
  refreshActiveSeasons();
  return json(s, 201);
});
on("patch", "/admin/Season/:id", ({ params, body }) => {
  const s = db.seasons.find((x) => x.id === params.id);
  if (!s) return notFound();
  const { iconFile, id, isActive, editedAt, ...rest } = body;
  Object.assign(s, rest, { editedAt: now() });
  const url = fileUrl(iconFile);
  if (url) s.iconUrl = url;
  refreshActiveSeasons();
  return json(s);
});
on("delete", "/admin/Season/:id", ({ params }) => {
  db.seasons = db.seasons.filter((x) => x.id !== params.id);
  return json({});
});

// ---- Polls & trivia
function pollFromBody(body, existing) {
  const options = (body.options ?? []).map((o, i) => ({
    optionId: existing?.options?.[i]?.optionId ?? uuid(),
    label: o.label,
  }));
  const idx = body.correctOptionIndex;
  return {
    ...(existing || {}),
    type: body.type,
    question: body.question,
    options,
    correctOptionId: body.type === "Trivia" && idx != null ? options[idx]?.optionId ?? null : null,
    durationSeconds: Number(body.durationSeconds),
    allowAnswerChange: existing?.allowAnswerChange ?? true,
    streamId: body.streamId ?? null,
    sortOrder: body.sortOrder ?? existing?.sortOrder ?? Math.max(0, ...db.polls.map((p) => p.sortOrder ?? 0)) + 1,
    editedAt: now(),
  };
}
function validatePoll(p) {
  const errors = {};
  if (!p.question) errors.Question = ["Question is required."];
  if (p.options.length < 2 || p.options.length > 4) errors.Options = ["A question needs 2–4 answers."];
  if (p.durationSeconds < 5 || p.durationSeconds > 300) errors.DurationSeconds = ["Duration must be between 5 and 300 seconds."];
  return Object.keys(errors).length ? errors : null;
}
on("get", "/admin/polls", ({ query }) => {
  const type = query.get("type");
  const rows = [...db.polls].filter((p) => !type || p.type === type).sort(bySort);
  return json({ items: rows, total: rows.length });
});
on("get", "/admin/polls/:id", ({ params }) => {
  const p = db.polls.find((x) => x.id === params.id);
  return p ? json(p) : notFound();
});
on("post", "/admin/polls", ({ body }) => {
  const p = { ...pollFromBody(body, null), id: uuid(), createdAt: now() };
  const errors = validatePoll(p);
  if (errors) return badRequest(errors);
  db.polls.push(p);
  return json(p, 201);
});
on("put", "/admin/polls/:id", ({ params, body }) => {
  const i = db.polls.findIndex((x) => x.id === params.id);
  if (i < 0) return notFound();
  const p = { ...pollFromBody(body, db.polls[i]), id: params.id };
  const errors = validatePoll(p);
  if (errors) return badRequest(errors);
  db.polls[i] = p;
  return json(p);
});
on("delete", "/admin/polls/:id", ({ params }) => {
  db.polls = db.polls.filter((x) => x.id !== params.id);
  return json({});
});
on("get", "/admin/poll-results/export", ({ query }) => {
  const streamId = query.get("streamId");
  const stream = db.streams.find((s) => s.id === streamId);
  const header = ["StreamId", "StreamTitle", "PollId", "Type", "Question", "Option", "IsCorrect", "Votes"];
  const rows = [];
  db.polls
    .filter((p) => p.streamId === streamId)
    .forEach((p) => {
      p.options.forEach((o) => {
        const key = `${p.id}:${o.optionId}`;
        if (db.pollVotes[key] == null) db.pollVotes[key] = Math.floor(Math.random() * 120);
        rows.push([streamId, stream?.title ?? "", p.id, p.type, p.question, o.label, p.correctOptionId === o.optionId ? "true" : "false", db.pollVotes[key]]);
      });
    });
  const slug = (stream?.title ?? "stream").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return csv(toCsv([header, ...rows]), `poll-results_${slug}.csv`);
});
