// Seed data for the mock backend.
// Config/catalog data (how-to-play, share config, rewards, packs, swag, seasons, polls, this week's
// streams) was captured read-only from the live dev dashboard on 2026-10-19.
// Anything containing personal data (users, phone numbers, cashouts, shipping addresses) is SYNTHETIC.
import { HOST_PICTURE_URL, LOGO_URL, MODE_LOGOS, WENDYS_LOGO_URL } from "../assets";

// Item images (power-ups, packs, swag, seasons) ship with the app in src/assets/items, by id; an
// id without one gets sample art picked from the id.
const ITEM_IMAGES = import.meta.glob("../assets/items/*.png", { eager: true, query: "?url", import: "default" });
const ART_TONES = ["blue", "purple", "green", "orange", "pink"];
const img = (name) => ITEM_IMAGES[`../assets/items/${name}.png`] ?? expressiveHero(ART_TONES[[...String(name)].reduce((a, ch) => a + ch.charCodeAt(0), 0) % ART_TONES.length], 512, 512);

// ---------------------------------------------------------------- helpers
let seedState = 42;
const rand = () => {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(rand() * 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
const firebaseId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 28 }, () => chars[Math.floor(rand() * chars.length)]).join("");
};

const notificationDefaults = {
  lobbyOpenTitle: "Lobby is Open",
  lobbyOpenBody: "10 minutes until showtime!",
  goingLiveTitle: "We're Live!",
  goingLiveBody: "Join now",
  round1StartsTitle: "Round 1 is about to start!",
  round1StartsBody: "Last chance to join!",
};

// ---------------------------------------------------------------- hosts / users (synthetic)
// Synthetic 256×256 host pictures: a gradient tile with the host's initial.
const hostPicture = (name, from, to) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
      `<rect width="256" height="256" fill="url(#g)"/>` +
      `<text x="128" y="128" dy=".35em" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="120" font-weight="700" fill="#fff" fill-opacity=".92">${name[0]}</text>` +
      `</svg>`,
  );

const HOSTS = [
  { id: "hostLena0000000000000000000001", name: "Lena", imageUrl: hostPicture("Lena", "#ff8a65", "#d81b60") },
  { id: "hostJosh0000000000000000000002", name: "Josh", imageUrl: hostPicture("Josh", "#4fc3f7", "#3949ab") },
  { id: "hostMaya0000000000000000000003", name: "Maya", imageUrl: hostPicture("Maya", "#aed581", "#00897b") },
  { id: "hostRomi0000000000000000000004", name: "Romio", imageUrl: hostPicture("Romio", "#ffd54f", "#f4511e") },
];

const WORDS = ["apple", "orange", "lemon", "peach", "grape", "mango", "berry", "melon", "plum", "kiwi", "savvy", "words"];

function makeStream({ id, title, host, startDate, status, streamType = "Internal", gameMode = "TextChain", wordsMissing = false, extra = {} }) {
  const count = gameMode === "SubText" ? 5 : 1 + Math.floor(rand() * 4);
  const rounds = Array.from({ length: count }, (_, i) => ({
    roundIndex: i,
    word: wordsMissing && i > 0 ? "" : pick(WORDS),
    durationInSeconds: pick([15, 30, 60]),
    prizes: null,
    roundBusterReward: null,
  }));
  return {
    textSavvyRounds: { rounds },
    showdownConfiguration: null,
    totalPrizePool: 0,
    id: id ?? uuid(),
    hostId: host.id,
    title,
    startDate,
    status,
    defaultRewards: [{ rewardType: "BombPowerup", amount: 1 }],
    imageUrl: host.imageUrl ?? LOGO_URL,
    hostName: host.name,
    subtitle: null,
    hostDisplayName: null,
    heroImageUrl: null,
    heroCardHostImageUrl: null,
    gameLogoUrl: null,
    gameModeDisplayName: null,
    gameModeIconUrl: null,
    gameModeBackgroundColor: null,
    entranceFee: { type: "Free", amount: 0 },
    sponsorship: null,
    raffleSystemWinnersConfiguration: null,
    hostBusterReward: null,
    showdownPrize: null,
    streamType,
    isSuperSavvyShowdown: false,
    gameMode,
    roundScoring: null,
    hostStumperBonusXp: 0,
    headless: false,
    isSpotlighted: false,
    round1StartsAt: null,
    ...notificationDefaults,
    shareableCards: null,
    ...extra,
  };
}

// This week's streams exactly as shown on the live dashboard (Week starting 2026-10-18).
// Times are America/Los_Angeles (PDT, UTC-7).
const [LENA, JOSH, MAYA, ROMIO] = HOSTS;
const liveWeek = [
  ["a1252665-5acb-4e4c-ba71-81b6477241a6", "Lena's test", LENA, "2026-10-19T09:35:00Z", "Completed"],
  ["a91a28c1-00d4-4e13-9961-22ed24130933", "Lena's test", LENA, "2026-10-19T13:45:00Z", "Completed"],
  ["6b5eeb34-96aa-4353-b8fd-c117f8145107", "Lena's test", LENA, "2026-10-19T14:10:00Z", "Completed"],
  ["e22deade-2634-46cf-a1e6-ead1cf5106d1", "Team test", JOSH, "2026-10-19T14:30:00Z", "Completed"],
  ["5c195c8a-e433-4776-a3aa-8e712cca46e0", "Lena's test", LENA, "2026-10-19T16:35:00Z", "Completed"],
  ["d01ae2c5-5191-420e-a875-059788cfb1c1", "Lena's test", LENA, "2026-10-19T18:20:00Z", "Scheduled"],
].map(([id, title, host, startDate, status]) => makeStream({ id, title, host, startDate, status }));

// Extra (synthetic) streams so filtering, week grouping and polls have something to show.
const extraStreams = [
  makeStream({
    id: "420b11c3-a96f-40d4-b266-0bafaf2e46e2",
    title: "You vs {host}",
    host: MAYA,
    startDate: "2026-10-22T01:00:00Z",
    status: "Scheduled",
    streamType: "Public",
    extra: {
      sponsorship: {
        title: "Lacoste",
        description: "Hey sup!) You can have a good discount 10% check right now!",
        cta: "https://lacoste.com",
        imageUrl: "https://icons.iconarchive.com/icons/google/noto-emoji-animals-nature/128/22282-crocodile-icon.png",
      },
      hostBusterReward: { rewardType: "Sparks", amount: 5 },
    },
  }),
  makeStream({
    id: "a6fef6fe-fb4c-4649-a2c3-a4b3a07bf513",
    title: "Friday Night Words",
    host: ROMIO,
    startDate: "2026-10-24T02:30:00Z",
    status: "Scheduled",
    streamType: "Public",
    extra: { raffleSystemWinnersConfiguration: [{ rewardType: "Cash", amount: 25 }] },
  }),
  makeStream({
    id: "4f9e3f6d-bee4-4e03-8bba-438c5cd3fcf1",
    title: "You vs {host}",
    host: JOSH,
    startDate: "2026-10-25T19:00:00Z",
    status: "Scheduled",
    streamType: "SuperSavvy",
    gameMode: "SubText",
    extra: { showdownConfiguration: { word: "savvy", prize: { rewardType: "Cash", amount: 100 }, superSavvyOnly: true } },
  }),
  makeStream({
    title: "You vs {host}",
    host: MAYA,
    startDate: "2026-10-22T19:00:00Z",
    status: "InProgress",
    streamType: "Public",
  }),
  makeStream({
    id: "b0fd6fe4-0acc-4dae-9815-ff112bbc800a",
    title: "You vs {host}",
    host: LENA,
    startDate: "2026-10-27T16:00:00Z",
    status: "Scheduled",
  }),
  makeStream({ title: "You vs {host}", host: MAYA, startDate: "2026-10-29T15:00:00Z", status: "Scheduled", streamType: "Public", gameMode: "SubText" }),
  makeStream({
    title: "You vs {host}",
    host: ROMIO,
    startDate: "2026-11-01T02:00:00Z",
    status: "Scheduled",
    streamType: "Public",
    wordsMissing: true,
    extra: { isSpotlighted: true },
  }),
  makeStream({ title: "You vs {host}", host: LENA, startDate: "2026-10-12T17:00:00Z", status: "Completed" }),
  makeStream({ title: "You vs {host}", host: JOSH, startDate: "2026-10-14T17:00:00Z", status: "Canceled", streamType: "Public" }),
];

export const seedStreams = () => [...liveWeek, ...extraStreams];

// ---------------------------------------------------------------- users (synthetic)
const NAMES = ["Nova", "Pixel", "Wordy", "Lexi", "Quill", "Rune", "Echo", "Jinx", "Zed", "Milo", "Ivy", "Orbit", "Blitz", "Comet", "Sage"];
const REGIONS = [
  ["US", "+1 555-"],
  ["CA", "+1 555-"],
  ["NL", "+31 6 "],
  ["GB", "+44 7700 "],
  ["TR", "+90 555 "],
  ["DE", "+49 151 "],
];
export const seedUsers = () => {
  const users = [];
  for (let i = 0; i < 48; i++) {
    const [region, prefix] = pick(REGIONS);
    const statusRoll = rand();
    users.push({
      id: firebaseId(),
      username: `${pick(NAMES)}${100 + i}`,
      phoneNumber: `${prefix}${String(1000000 + Math.floor(rand() * 8999999)).slice(0, 7)}`,
      regionCode: region,
      userAccountStatus: statusRoll > 0.93 ? 3 : statusRoll > 0.88 ? 2 : 1,
      sparks: Math.floor(rand() * 5000),
      totalScore: Math.floor(rand() * 90000),
      powerups: [
        { powerupId: 2, count: Math.floor(rand() * 6) },
        { powerupId: 5, count: Math.floor(rand() * 6) },
        { powerupId: 7, count: Math.floor(rand() * 3) },
        { powerupId: 8, count: Math.floor(rand() * 3) },
      ],
    });
  }
  // Hosts are Savvy accounts too (their Host role is in the claims).
  seedHosts().forEach((h) => users.push(hostAccount(h)));
  for (let i = 0; i < 30; i++) {
    const id = `savvy-bot_${uuid()}`;
    users.push({
      id,
      username: id,
      phoneNumber: null,
      regionCode: null,
      userAccountStatus: 1,
      sparks: 0,
      totalScore: 0,
      powerups: [],
    });
  }
  return users;
};

// Extra "virtual" users reported in totals, so the pager reads like production (1–25 of 665,863).
export const VIRTUAL_USER_TOTAL = 665863;

// ---------------------------------------------------------------- cash wins (synthetic)
export const seedCashWins = (users) => {
  const humans = users.filter((u) => !u.id.startsWith("savvy-bot_"));
  const bots = users.filter((u) => u.id.startsWith("savvy-bot_"));
  const rows = [];
  let t = Date.parse("2025-11-27T08:43:00Z");
  for (let i = 0; i < 64; i++) {
    const u = i % 4 === 3 ? pick(bots) : pick(humans);
    const roll = rand();
    rows.push({
      id: uuid(),
      date: new Date(t).toISOString(),
      amount: pick([10, 15, 20, 25, 30, 50, 100]),
      status: roll > 0.8 ? "Approved" : roll > 0.72 ? "Declined" : roll > 0.66 ? "Expired" : "InProgress",
      userId: u.id,
    });
    t += Math.floor(rand() * 36e5 * 6);
  }
  return rows;
};

// ---------------------------------------------------------------- configs (live data)
export const seedHowToPlay = () => ({
  powerUps: [
    { title: "Letter Bomb", description: "Removes four letters from the board that are not part of the word", iconUrl: img("02d1bda4-eff8-43f9-89e0-e639620efc31") },
    { title: "Better Bomb", description: "Removes 8 irrelevant letters from keyboard", iconUrl: img("5502cb74-4380-43a1-a23b-9dccc61188ac") },
    { title: "Greenie", description: "Highlights one Green letter on game board", iconUrl: img("3c5a0401-91c7-49c6-a6fd-391add8701c2") },
    { title: "Magniflyer", description: "Highlights one letter that is in the word", iconUrl: img("a81b18a2-d500-4c21-a797-06d12b3bc252") },
  ],
});

// Game mode presets (prototype: not part of the production API yet). Each mode carries the
// defaults a new stream starts from, plus its own How to Play power-up list.
// {host} is filled with the stream's host (their display name) wherever a card is shown.
// Prototype password that reveals the words (Library › Game modes). The real backend
// checks its own; this one only exists in the mock.
export const WORDS_PASSWORD = "savvywords";

export const STREAM_CARD_DEFAULTS = {
  liveHome: { title: "You vs {host}", subtitle: "Jump in and play along" },
  upcomingHome: { title: "You vs {host}", subtitle: "Set a reminder so you don't miss it" },
  beatHost: { header: "Host buster!", title: "I beat {host}", subtitle: "Think you can too?" },
  didNotBeatHost: { header: "So close", title: "{host} got me this time", subtitle: "Can you beat them?" },
};
// Named share card and notification presets a stream picks from (Live Ops › Presets).
// App-wide share card presets: the app uses the one whose texts are in the share config.
export function seedAppCardPresets() {
  return [
    { id: "app-standard", name: "Standard", cards: { profileShare: { title: "Join me on Savvy", subtitle: "Live word games against real hosts" }, liveShowStats: { title: "Think you can top this?" } } },
    { id: "app-holiday", name: "Holiday", cards: { profileShare: { title: "Play Savvy with me this holiday", subtitle: "Word games, live, every night" }, liveShowStats: { title: "My holiday score. Beat it!" } } },
  ];
}
export function seedPuzzleCardPresets() {
  return [
    { id: "puzzle-standard", name: "Standard", cards: { dailyPuzzleSuccess: { title: "Got today's word in {tries}. Beat that!" }, dailyPuzzleFail: { title: "Today's word got me. Can you do it?" }, dailyPuzzleStats: { title: "<size=80%>Can you beat my stats?</size>" } } },
    { id: "puzzle-playful", name: "Playful", cards: { dailyPuzzleSuccess: { title: "{tries} tries. Your move." }, dailyPuzzleFail: { title: "The word won today. Can you win?" }, dailyPuzzleStats: { title: "My streak says hi" } } },
  ];
}

export function seedSharePresets() {
  return [
    { id: "share-standard", name: "Standard", isDefault: true, cards: STREAM_CARD_DEFAULTS },
    {
      id: "share-weekend",
      name: "Weekend special",
      cards: {
        liveHome: { title: "Weekend show is live!", subtitle: "Grab a coffee and play" },
        upcomingHome: { title: "Weekend show soon", subtitle: "Don't miss Sunday's words" },
        beatHost: { header: "Weekend win!", title: "I beat {host}", subtitle: "Your turn next weekend" },
        didNotBeatHost: { header: "Almost!", title: "{host} won this weekend", subtitle: "Rematch next week?" },
      },
    },
  ];
}
export function seedNotificationPresets() {
  return [
    { id: "notify-standard", name: "Standard", isDefault: true, lobbyOpenTitle: "Lobby is Open", lobbyOpenBody: "10 minutes until showtime!", goingLiveTitle: "We're Live!", goingLiveBody: "Join now", round1StartsTitle: "Round 1 is about to start!", round1StartsBody: "Last chance to join!" },
    { id: "notify-hype", name: "Big show", lobbyOpenTitle: "Doors are open 🎉", lobbyOpenBody: "The big show starts in 10 minutes", goingLiveTitle: "We're live!", goingLiveBody: "Tap in, the words are waiting", round1StartsTitle: "Round 1 starts now", round1StartsBody: "Last call to join the show" },
  ];
}

// "with Showdown" presets: the same game plus default showdown settings (the word is per stream).
export const MODE_SUMMARY = {
  TextChain: "Each word links to the one before and after it. Then a final showdown word.",
  SubText: "The words found in the first four rounds are connected by the fifth. Then a final showdown word.",
  TextChainShowdown: "Each word links to the one before and after it. Then a final showdown word.",
  SubTextShowdown: "The words found in the first four rounds are connected by the fifth. Then a final showdown word.",
};
export const withShowdown = (m) => ({
  ...m,
  id: `${m.id}Showdown`,
  name: `${m.name} with Showdown`,
  summary: MODE_SUMMARY[`${m.id}Showdown`] ?? m.summary,
  showdown: { prize: { rewardType: "Cash", amount: 100 }, superSavvyOnly: false },
});

// Bundles: what a new stream starts with, whatever game its word set plays. Points per round,
// the showdown (which kind, and its prize), the rewards and the messaging presets. Rounds always
// pay Sparks (the Round Pounder reward); a "cash game" pays cash in the showdown, a "sparks game"
// pays Sparks there too.
const BUNDLE_SCORING = {
  rounds1To2: { greenLetterXp: 500, yellowLetterXp: 250, solveBonusXp: 500, timeBonusXp: 100 },
  rounds3To4: { greenLetterXp: 1000, yellowLetterXp: 500, solveBonusXp: 1000, timeBonusXp: 100 },
  round5OrMore: { greenLetterXp: 0, yellowLetterXp: 0, solveBonusXp: 2000, timeBonusXp: 200 },
};
const bundle = (id, name, prize, superSavvyOnly) => ({
  id,
  name,
  roundScoring: structuredClone(BUNDLE_SCORING),
  hostStumperBonusXp: 500,
  defaultRewards: [{ rewardType: "BombPowerup", amount: 1 }],
  showdown: { prize, superSavvyOnly },
  defaultSharePresetId: null,
  defaultNotificationPresetId: null,
});
export const DEFAULT_BUNDLE_ID = "bundle-cash-savvy";
export const seedBundles = () => [
  bundle("bundle-cash-super-savvy", "Cash game · Super Savvy Showdown", { rewardType: "Cash", amount: 100 }, true),
  bundle("bundle-sparks-savvy", "Sparks game · Savvy Showdown", { rewardType: "Sparks", amount: 500 }, false),
  bundle(DEFAULT_BUNDLE_ID, "Cash game · Savvy Showdown", { rewardType: "Cash", amount: 100 }, false),
];

// Two game modes, Savvy TextChain and Savvy SubText: five rounds, then a Savvy Showdown.
export const SHOWDOWN_DEFAULTS = { prize: { rewardType: "Cash", amount: 100 }, superSavvyOnly: false };
export const seedGameModes = () => seedBaseModes().map((m) => ({ ...m, name: `Savvy ${m.name}`, summary: MODE_SUMMARY[m.id], roundCount: 5, showdown: SHOWDOWN_DEFAULTS }));
const seedBaseModes = () => [
  {
    id: "TextChain",
    name: "TextChain",
    summary: MODE_SUMMARY.TextChain,
    roundCount: 3,
    roundDurationInSeconds: 60,
    roundScoring: {
      rounds1To2: { greenLetterXp: 500, yellowLetterXp: 250, solveBonusXp: 500, timeBonusXp: 100 },
      rounds3To4: { greenLetterXp: 1000, yellowLetterXp: 500, solveBonusXp: 1000, timeBonusXp: 100 },
      round5OrMore: { greenLetterXp: 0, yellowLetterXp: 0, solveBonusXp: 2000, timeBonusXp: 200 },
    },
    hostStumperBonusXp: null,
    defaultRewards: [{ rewardType: "BombPowerup", amount: 1 }],
    gameModeDisplayName: null,
    gameModeBackgroundColor: null,
    gameModeIconUrl: null,
    gameLogoUrl: MODE_LOGOS.TextChain,
    howToPlay: seedHowToPlay(),
    showdown: null,
  },
  {
    id: "SubText",
    name: "SubText",
    summary: MODE_SUMMARY.SubText,
    roundCount: 5,
    roundDurationInSeconds: 60,
    roundScoring: {
      rounds1To2: { greenLetterXp: 500, yellowLetterXp: 0, solveBonusXp: 500, timeBonusXp: 100 },
      rounds3To4: { greenLetterXp: 1000, yellowLetterXp: 0, solveBonusXp: 1000, timeBonusXp: 100 },
      round5OrMore: { greenLetterXp: 0, yellowLetterXp: 0, solveBonusXp: 2000, timeBonusXp: 200 },
    },
    hostStumperBonusXp: 2000,
    defaultRewards: [{ rewardType: "BombPowerup", amount: 1 }],
    gameModeDisplayName: "SubText",
    gameModeBackgroundColor: "#7444E0",
    gameModeIconUrl: null,
    gameLogoUrl: MODE_LOGOS.SubText,
    howToPlay: seedHowToPlay(),
    showdown: null,
  },
];

// Host and sponsor libraries (prototype: not part of the production API yet).
// A host's id is the Savvy account id the stream is attached to (the stream's `hostId`).
// The one host: every stream and time slot is his. His picture is also the hero card picture.
export const SCOTT = { id: "hostScot0000000000000000000005", name: "Scott Rogowsky", displayName: "Puzzle Papi", imageUrl: HOST_PICTURE_URL, heroCardImageUrl: HOST_PICTURE_URL };

export const hostAccount = (h) => ({ id: h.id, username: h.name, phoneNumber: null, regionCode: "US", userAccountStatus: 1, sparks: 0, totalScore: 0, powerups: [] });


// ---- Sample art in the Material 3 Expressive shape language: soft-cornered tonal fields with
// "cookie" (scalloped), flower and pill shapes. SVG data URLs, so the prototype needs no files.
export const EXPRESSIVE = {
  blue: ["#D3E3FD", "#0B57D0", "#7CACF8", "#041E49"],
  purple: ["#EADDFF", "#6750A4", "#CFBCFF", "#21005D"],
  green: ["#C4EED0", "#146C2E", "#6DD58C", "#072711"],
  orange: ["#FFDCC1", "#8B5000", "#FFB77C", "#2D1600"],
  pink: ["#FFD8E4", "#984061", "#FFB0C8", "#3E001D"],
};
// Closed path of a "polar" shape: radius r·(1 + a·cos(n·θ)) around (cx, cy).
const polar = (cx, cy, r, n, a, rot = 0) => {
  const pts = Array.from({ length: 180 }, (_, i) => {
    const t = (i / 180) * Math.PI * 2;
    const rr = r * (1 + a * Math.cos(n * (t + rot)));
    return `${(cx + rr * Math.cos(t)).toFixed(1)},${(cy + rr * Math.sin(t)).toFixed(1)}`;
  });
  return `M${pts.join("L")}Z`;
};
const svgUrl = (w, h, body) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`)}`;

/** Square host picture: a scalloped "cookie" with the initial, on its tonal field. */
export function expressiveAvatar(name, tone = "blue", size = 512) {
  const [bg, main, accent, on] = EXPRESSIVE[tone];
  const c = size / 2;
  return svgUrl(size, size, `<rect width="${size}" height="${size}" fill="${bg}"/><path d="${polar(c * 1.45, c * 0.5, c * 0.32, 4, 0.18, 0.4)}" fill="${accent}"/><path d="${polar(c, c * 1.05, c * 0.62, 9, 0.07)}" fill="${main}"/><text x="${c}" y="${c * 1.05}" dy=".35em" text-anchor="middle" font-family="Google Sans, Roboto, Helvetica, Arial, sans-serif" font-size="${size * 0.36}" font-weight="700" fill="${bg}">${String(name)[0]}</text><circle cx="${c * 0.42}" cy="${c * 1.68}" r="${c * 0.14}" fill="${on}" opacity=".85"/>`);
}

/** 3:4 stream / hero art (900 × 1200): a big flower, a pill and a cookie on a tonal field. */
export function expressiveHero(tone = "blue", w = 900, h = 1200) {
  const [bg, main, accent, on] = EXPRESSIVE[tone];
  return svgUrl(w, h, `<rect width="${w}" height="${h}" fill="${bg}"/><path d="${polar(w * 0.62, h * 0.32, w * 0.36, 4, 0.2, 0.3)}" fill="${main}"/><rect x="${w * 0.08}" y="${h * 0.6}" width="${w * 0.62}" height="${h * 0.14}" rx="${h * 0.07}" fill="${accent}"/><path d="${polar(w * 0.76, h * 0.82, w * 0.17, 9, 0.08)}" fill="${on}"/><circle cx="${w * 0.2}" cy="${h * 0.2}" r="${w * 0.07}" fill="${accent}"/>`);
}

// More sample hosts (pictures are drawn on load): one with a display name the app shows instead.
export const MAYA_CHEN = { id: "hostMaya0000000000000000000006", name: "Maya Chen", displayName: "Word Witch" };
export const LEO = { id: "hostLeo00000000000000000000007", name: "Leo Park", displayName: null };
export const NIA = { id: "hostNia00000000000000000000008", name: "Nia Brooks", displayName: "Nia B" };
export const seedHosts = () => [{ ...SCOTT }, { ...MAYA_CHEN }, { ...LEO }, { ...NIA }];

// Weekly time slots Fill month makes streams from (times in the admin time zone, PT by default):
// when, who hosts and for whom. Title, rewards, share cards and notifications come from defaults.
// No hostId: the slot follows its game mode's default host.
// A time slot: when, on which days, who hosts and who can join. (The game argument is unused:
// a stream's format comes with its word set.)
// eslint-disable-next-line no-unused-vars
const slot = (id, time, gameMode, days) => ({ id, time, title: "You vs {host}", days, hostId: "", streamType: "Public" });

// Word sets: a word per round (3–4 letters → 60s, longer → 90s, the fifth 45s by default) and the
// showdown word; their rewards default to the game mode's.
// The fifth round starts at 45 seconds.
export const secondsFor = (word, i) => (i === 4 ? 45 : String(word ?? "").length >= 5 ? 90 : 60);
export const roundsOf = (words) => words.map((word, roundIndex) => ({ roundIndex, word, durationInSeconds: secondsFor(word, roundIndex) }));
const showdownOf = (word) => ({ word });
export const upgradeWordSet = (w) => {
  if (!w.words) return w;
  const { words, ...rest } = w;
  return w.type === "Showdown" ? { ...rest, showdown: showdownOf(words[0]) } : { ...rest, rounds: roundsOf(words) };
};
// A set's name, from its first word (sets made before sets had names get theirs this way too).
const SET_TITLES = { cloud: "Weather", bread: "Breakfast", river: "Water", tiger: "Animals", pizza: "Italian food", rocket: "Space", piano: "Instruments", chess: "Chess", wave: "Beach day", galaxy: "Galaxy", garden: "Garden", koala: "Koala" };
export const wordSetTitle = (first) => SET_TITLES[first] ?? (first ? first[0].toUpperCase() + first.slice(1) : "Untitled set");
// Four sample sets: each game mode with a showdown word and without one.
export const seedWordSets = () => {
  const at = (days) => new Date(Date.UTC(2026, 9, 1 + days, 16)).toISOString();
  return [
    ["TextChain", "Weather", ["cloud", "rain", "storm", "wind", "snow"], "thunder"],
    ["TextChain", "Breakfast", ["bread", "butter", "toast", "honey", "jam"], null],
    ["SubText", "Instruments", ["piano", "guitar", "drums", "violin", "flute"], "orchestra"],
    ["SubText", "Beach day", ["wave", "shore", "beach", "sand", "ocean"], null],
  ].map(([type, title, words, showdown], i) => ({ id: `ws-${String(i + 1).padStart(3, "0")}`, type, title, rounds: roundsOf(words), showdown: showdown ? showdownOf(showdown) : null, streamId: null, createdAt: at(i) }));
};

export const seedScheduleSlots = () => [
  slot("slot-lunch", "13:00", "TextChain", [1, 2, 3, 4, 5]),
  slot("slot-afternoon", "17:00", "SubText", [1, 2, 3, 4, 5]),
  slot("slot-evening", "18:00", "TextChain", [1, 2, 3, 4, 5, 6, 0]),
];

// The sample sponsor.
export const WENDYS = {
  id: "spn-wendys",
  name: "Wendy's",
  title: "Fresh, never frozen",
  description: "Free Frosty with any order. Use code SAVVY in the Wendy's app.",
  cta: "https://www.wendys.com",
  imageUrl: WENDYS_LOGO_URL,
};
// Made-up sample sponsors (logos are drawn on load).
export const MORE_SPONSORS = [
  { id: "spn-beanbros", name: "Bean Bros Coffee", title: "Your morning word fuel", description: "2-for-1 cold brew all week with code WORDS.", cta: "https://example.com/beanbros" },
  { id: "spn-nova", name: "Nova Mobile", title: "Unlimited data, unlimited games", description: "First month free for Savvy players.", cta: "https://example.com/nova" },
  { id: "spn-pixel", name: "Pixel Snacks", title: "Snack between rounds", description: "20% off any party box this weekend.", cta: "https://example.com/pixel" },
];
export const seedSponsors = () => [{ ...WENDYS }, ...MORE_SPONSORS.map((sp) => ({ ...sp }))];

export const seedShareConfig = () => ({
  dailyPuzzleFail: { shareText: null, title: "Today's word got me. Can you do it?" },
  dailyPuzzleStats: { title: "<size=80%>Can you beat my stats?</size>" },
  dailyPuzzleSuccess: { shareText: null, title: "Got today's word in {tries}. Beat that!" },
  liveShowStats: { title: "Think you can top this?" },
  palPuzzleCompare: { shareText: null, subtitle: null, title: null },
  palPuzzleFail: { shareText: null, subtitle: null, title: null },
  palPuzzleSuccess: { shareText: null, subtitle: null, title: null },
  profileShare: { subtitle: "Live word games against real hosts", title: "Join me on Savvy" },
  sparksPerReferral: 200,
});

export const seedRewardConfig = () => ({ dailyPuzzleReward: { amount: 10, rewardType: "Sparks" } });

// ---------------------------------------------------------------- shop (live data)
export const seedSparkPacks = () =>
  [
    ["savvy_sparks_tier1", 150, 2, "9356c0f7-2672-4a7a-84cc-33816a6ff665", "2026-10-16T15:10:07.9126538Z"],
    ["savvy_sparks_tier2", 400, 2, "44e64b5d-cbaa-483f-b69e-5b8542fc9004", "2026-08-13T09:37:27.2291588Z"],
    ["savvy_sparks_tier3", 800, 2, "369b5e01-80c7-443e-864a-448a2a11bec2", "2026-08-13T09:37:32.3367861Z"],
    ["savvy_sparks_tier4", 2100, 4, "d8f0ad25-1934-4f41-b354-a75216009c09", "2026-08-13T09:37:37.0900029Z"],
    ["savvy_sparks_tier5", 5500, 4, "4ad84c1a-7bba-43b9-9f35-c442a1851333", "2026-08-13T09:37:41.6003074Z"],
    ["savvy_sparks_tier6", 11000, 4, "f752d92f-858f-460f-aaf3-4be5c897b4f9", "2026-08-13T09:37:46.3162578Z"],
  ].map(([id, sparksGranted, sortOrder, icon, editedAt]) => ({
    id,
    sparksGranted,
    sortOrder,
    isEnabled: true,
    iconUrl: img(icon),
    editedAt,
  }));

export const seedPowerupPacks = () =>
  [
    ["7c7232a0-e35b-431c-a44a-a9f069009df3", "Letter Bomb", "Blows up 4 irrelevant letters from your keyboard! May be used once per round.", 125, true, 0, "2026-09-18T13:33:00.7499426Z", [["BombPowerup", 1, "aae8c5e5-3d08-4191-8589-87784610b425"]]],
    ["1567d52d-bcc5-4757-a156-25d742be273d", "Magniflyer", "Highlights one yellow letter on your keyboard! May be used once per round.", 50000, false, 1, "2026-10-05T09:45:47.0563707Z", [["HintPowerup", 1, "19e3845e-d2e9-4a1c-a902-e79e7861f3e5"]]],
    ["d95d66e0-a9b2-4fe4-bac9-3a122f90d066", "Duo Pack", null, 300, true, 2, "2026-06-17T10:17:01.4125377Z", [["BombPowerup", 1, "7498037b-64b3-4cd9-a494-ed7d70a799f6"], ["HintPowerup", 1, "a55e10f7-24f2-4a24-b683-03946cdb2fe6"]]],
    ["3881fecf-6e57-4eac-b31b-693a9abe485a", "Letter Bomb pack", null, 500, true, 3, "2026-06-17T10:19:36.7121439Z", [["BombPowerup", 5, "a2869054-4b32-49ed-972d-48c78d0ca754"]]],
    ["80e6097c-16f1-4b76-8faa-64fc3958a047", "Magniflyer pack", null, 1000, true, 4, "2026-06-17T10:18:37.5050226Z", [["HintPowerup", 5, "acce739e-c813-47b4-a1f5-2c6bb4b71438"]]],
    ["8e3ee59b-9e27-4d4b-bb2b-57fc23979883", "Greenie", null, 100, true, 5, "2026-08-07T04:50:56.4795154Z", [["GreeniePowerup", 5, "c9521a20-40e7-477c-8a2b-ce1e18b70fcf"]]],
    ["1950ea1d-e8d4-4e94-9b0d-16f5d3e3ae6c", "Better Bomb", null, 100, true, 6, "2026-08-13T11:26:04.9192477Z", [["BetterBombPowerup", 5, "cd38149d-2f0b-49f9-bb38-9a7526ab8fb4"]]],
  ].map(([id, title, description, sparksPrice, isEnabled, sortOrder, editedAt, contents]) => ({
    id,
    title,
    description,
    sparksPrice,
    isEnabled,
    sortOrder,
    editedAt,
    contents: contents.map(([powerupType, quantity, icon]) => ({ powerupType, quantity, iconUrl: img(icon) })),
  }));

const sizes = (spec) =>
  spec.map(([label, isAvailable, quantity]) => ({ label, isAvailable, quantity }));

export const seedSwag = () => [
  {
    id: "7857ff6f-d6f2-4206-bb71-34f735ee1e3a",
    title: "Savvy Hat",
    description: "WHATT!! SAVVY HAT?!!?!? OMG. THIS MUST BE THE BEST DAD HAT EVER!!!",
    sparksPrice: 10,
    sortOrder: 1,
    isEnabled: true,
    isSuperSavvyOnly: true,
    quantity: null,
    variantType: "None",
    variants: [],
    imageUrl: img("a73ff657-603b-49ba-9323-a077ceed0833"),
    imageUrls: [img("a73ff657-603b-49ba-9323-a077ceed0833"), img("e2fc1f6a-af66-4ddb-be0e-105e1fd9d03f")],
    editedAt: "2026-09-28T15:06:26.4521783Z",
  },
  {
    id: "cd722c50-1043-41f1-91d8-c1cd5d58b588",
    title: "Beta Baddie Tee",
    description:
      "Crafted from premium heavyweight cotton, this relaxed-fit tee offers a buttery-soft hand feel and structured drape. Enzyme-washed for a lived-in look from day one. Ribbed crew neck holds its shape.",
    sparksPrice: 25,
    sortOrder: 3,
    isEnabled: true,
    isSuperSavvyOnly: false,
    quantity: null,
    variantType: "Size",
    variants: sizes([["XS", false, null], ["S", false, null], ["M", true, null], ["L", true, null], ["XL", false, null], ["XXL", true, null]]),
    imageUrl: img("1d26df20-d4c6-4f4f-a239-379a8e65610b"),
    imageUrls: [img("1d26df20-d4c6-4f4f-a239-379a8e65610b"), img("3aee3721-9d66-4244-a0e1-f3eb2c2f33b2")],
    editedAt: "2026-09-28T14:58:40.940321Z",
  },
  {
    id: "19c38b59-6b78-4766-9a21-e96fc64c1cd9",
    title: "A new hat",
    description: "A new hat for display for all",
    sparksPrice: 20,
    sortOrder: 5,
    isEnabled: false,
    isSuperSavvyOnly: true,
    quantity: null,
    variantType: "None",
    variants: [],
    imageUrl: img("1a3bd4bd-ddfc-45c6-8413-231d66201490"),
    imageUrls: [img("1a3bd4bd-ddfc-45c6-8413-231d66201490")],
    editedAt: "2026-09-30T21:29:33.7423831Z",
  },
  {
    id: "9ba67cf4-170c-403b-a14a-db5abb8461cb",
    title: "Savvy Hoody!",
    description: "Now we have quanity!",
    sparksPrice: 99999,
    sortOrder: 6,
    isEnabled: true,
    isSuperSavvyOnly: false,
    quantity: null,
    variantType: "Size",
    variants: sizes([["XS", true, 3], ["S", true, 3], ["M", true, 3], ["L", true, 2], ["XL", true, 3]]),
    imageUrl: img("e54569d4-ca0e-41dc-a015-79751086e7ec"),
    imageUrls: [img("e54569d4-ca0e-41dc-a015-79751086e7ec")],
    editedAt: "2026-10-05T09:46:00.1438461Z",
  },
];

// ---------------------------------------------------------------- swag orders (synthetic people)
const RECIPIENTS = [
  ["Alex Rivera", "alex.rivera@example.com", "12 Market St", "Austin", "TX", "73301"],
  ["Sam Lee", "sam.lee@example.com", "48 Pine Ave", "Seattle", "WA", "98101"],
  ["Jordan Kim", "jordan.kim@example.com", "301 Oak Rd", "Denver", "CO", "80202"],
  ["Taylor Brooks", "taylor.b@example.com", "9 Elm Ct", "Boston", "MA", "02108"],
  ["Casey Morgan", "casey.m@example.com", "77 Lake Dr", "Chicago", "IL", "60601"],
];
export const seedSwagOrders = (users, swag) => {
  const humans = users.filter((u) => !u.id.startsWith("savvy-bot_"));
  const orders = [];
  let t = Date.parse("2026-10-14T21:27:00Z");
  for (let n = 24; n >= 1; n--) {
    const item = pick(swag);
    const u = pick(humans);
    const [recipientName, email, streetAddress, city, state, postcode] = pick(RECIPIENTS);
    const delivered = n === 24 || n < 8;
    orders.push({
      orderNumber: `SAW-2026-${String(n).padStart(6, "0")}`,
      userId: u.id,
      placedAt: new Date(t).toISOString(),
      itemTitle: item.title,
      itemImageUrl: item.imageUrls[0],
      variantLabel: item.variantType === "Size" ? pick(item.variants).label : null,
      sparksSpent: item.sparksPrice,
      deliveredAt: delivered ? new Date(t + 864e5).toISOString() : null,
      trackingNumber: delivered ? `9400${Math.floor(1e15 + rand() * 9e15)}` : null,
      shippingAddress: { recipientName, email, streetAddress, city, state, postcode },
    });
    t -= Math.floor(rand() * 864e5 * 2);
  }
  return orders;
};

// ---------------------------------------------------------------- seasons (live data)
// Past, active and upcoming seasons (one each, plus an older past one), so every list has rows.
export const seedSeasons = () => [
  { id: "season-4", title: "Season 4", iconUrl: expressiveAvatar("4", "green", 256), startsAt: "2026-11-05T06:16:00Z", endsAt: "2026-12-10T06:16:00Z", isActive: false, editedAt: "2026-10-20T09:00:00Z" },
  {
    id: "cd7759de-c7f5-42c2-9606-7453c5bdd39f",
    title: "Season 3",
    iconUrl: img("ed087d7c-eada-4db3-9572-de772c1a42b6"),
    startsAt: "2026-10-01T17:16:00Z",
    endsAt: "2026-11-05T06:16:00Z",
    isActive: true,
    editedAt: "2026-10-05T05:16:52.653314Z",
  },
  { id: "season-2", title: "Season 2", iconUrl: expressiveAvatar("2", "orange", 256), startsAt: "2026-07-03T10:19:00Z", endsAt: "2026-10-01T17:16:00Z", isActive: false, editedAt: "2026-07-01T12:00:00Z" },
  {
    id: "bb785a9b-a3d7-4130-b1ea-406fcf6fbfd5",
    title: "Season 1",
    iconUrl: img("d221eebf-9d5a-4010-970e-f0e76bfdf041"),
    startsAt: "2026-06-03T10:19:00Z",
    endsAt: "2026-07-03T10:19:00Z",
    isActive: false,
    editedAt: "2026-06-10T16:23:58.2178378Z",
  },
];

// ---------------------------------------------------------------- polls (live data)
const opts = (spec) => spec.map(([optionId, label]) => ({ optionId, label }));
export const seedPolls = () => [
  {
    id: "0c9de0bc-3d06-4e7d-aa66-c2f138c1ccb4", type: "Trivia", question: "Is this a question?", durationSeconds: 20, allowAnswerChange: true, sortOrder: 2,
    streamId: "a6fef6fe-fb4c-4649-a2c3-a4b3a07bf513", correctOptionId: "f38006a0-1fb1-4f24-9f8a-e3d4617fe9a1",
    options: opts([["4fccfeb0-6b03-45b6-836f-7e52a6b16939", "Yes"], ["971999b1-e0da-48c3-b39e-6fbd5fa34352", "No"], ["f38006a0-1fb1-4f24-9f8a-e3d4617fe9a1", "Burkay"]]),
    createdAt: "2026-09-15T13:50:25.9492459Z", editedAt: "2026-10-06T14:20:34.2674979Z",
  },
  {
    id: "3f6e0f9a-b008-4f99-9be2-2fa3725c2844", type: "Trivia", question: "How many islands Greece has?", durationSeconds: 20, allowAnswerChange: true, sortOrder: 3,
    streamId: "420b11c3-a96f-40d4-b266-0bafaf2e46e2", correctOptionId: "955d4cd4-2d87-4759-82ef-7acf6c0f3aca",
    options: opts([["44d025aa-7850-42fb-8e59-1062ae5573fe", "158"], ["44cd03f3-7b3a-4935-8e63-89b763b4b2db", "227"], ["955d4cd4-2d87-4759-82ef-7acf6c0f3aca", "1200"], ["e64c1e45-15bd-4642-9708-c5d63ac23e0f", "98"]]),
    createdAt: "2026-09-21T09:20:09.5431773Z", editedAt: "2026-10-12T14:26:14.6280509Z",
  },
  {
    id: "7fabe2a6-68ad-4046-954b-243681ec063e", type: "Poll", question: "Would you like more Savvy Showdowns??", durationSeconds: 20, allowAnswerChange: true, sortOrder: 4,
    streamId: "420b11c3-a96f-40d4-b266-0bafaf2e46e2", correctOptionId: null,
    options: opts([["1131ee8b-4dd1-4c67-9732-bee98b65a969", "Yes!"], ["389fe688-0459-46c1-b485-69e1fe2f8f33", "No!"], ["2d32f313-97e4-4ebc-a67f-dcfde1e2271c", "HELL YEAH BABY"]]),
    createdAt: "2026-09-21T09:20:30.1970114Z", editedAt: "2026-10-12T14:26:01.5297364Z",
  },
  {
    id: "8f7ac2f8-ee64-4ae7-aee4-6bdff479e96a", type: "Trivia", question: "Delay Savvy Oct. 1 Launch?", durationSeconds: 15, allowAnswerChange: true, sortOrder: 5,
    streamId: "4f9e3f6d-bee4-4e03-8bba-438c5cd3fcf1", correctOptionId: "afffde89-63ec-4f6d-b38d-e9eb83c2ca8c",
    options: opts([["a7718f54-1075-45f5-aa24-6ac160710f05", "Yes"], ["9e2e4888-0000-4000-8000-000000000001", "Over my dead body!"], ["afffde89-63ec-4f6d-b38d-e9eb83c2ca8c", "Too late"]]),
    createdAt: "2026-09-24T13:52:40.0336309Z", editedAt: "2026-10-07T14:24:19.4566586Z",
  },
  {
    id: "b8febd21-947a-4bc3-847a-daddc0719b75", type: "Poll", question: "Whodat??", durationSeconds: 15, allowAnswerChange: true, sortOrder: 6,
    streamId: "e22deade-2634-46cf-a1e6-ead1cf5106d1", correctOptionId: null,
    options: opts([["3d1653bf-0000-4000-8000-000000000001", "Not me,"], ["4fb6b6de-0000-4000-8000-000000000002", "Burkay!"], ["7fcb02d4-0000-4000-8000-000000000003", "Dunno"], ["27231d72-0000-4000-8000-000000000004", "Hellas"]]),
    createdAt: "2026-09-24T13:54:07.9004932Z", editedAt: "2026-10-19T15:12:29.4814277Z",
  },
  {
    id: "b68c27b1-1d81-436d-9546-3f52807383f5", type: "Poll", question: "Here is a question...", durationSeconds: 60, allowAnswerChange: true, sortOrder: 7,
    streamId: "b0fd6fe4-0acc-4dae-9815-ff112bbc800a", correctOptionId: null,
    options: opts([["b18c032d-0000-4000-8000-000000000001", "Answer 2"], ["1d0c537d-0000-4000-8000-000000000002", "ANswer 3"]]),
    createdAt: "2026-10-14T11:10:24.5955912Z", editedAt: "2026-10-14T11:11:28.72076Z",
  },
];

export const makeUuid = uuid;
