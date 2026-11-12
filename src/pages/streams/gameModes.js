import { useList } from "@refinedev/core";
import { DP } from "../../providers";
import { ROUND_COUNT, DEFAULT_HOST_STUMPER_BONUS_XP, DEFAULT_ROUND_DURATION, DEFAULT_ROUND_SCORING, EntranceFeeType, GameMode, RewardType, StreamType, busterFor, durationFor } from "./enums";

// The two game modes (label, icon, rules): Savvy TextChain and Savvy SubText, five rounds each,
// then a Savvy Showdown. The editable defaults a new stream starts from live in the Game modes
// section (API: /admin/game-modes); the values here are the fallback while those load. A stream
// stores its `gameMode` and a `showdownConfiguration`.
export const GAME_MODES = {
  [GameMode.TextChain]: {
    id: GameMode.TextChain,
    base: GameMode.TextChain,
    showdown: true,
    label: "Savvy TextChain",
    icon: "link",
    tone: "blue",
    summary: "Each word links to the one before and after it. Then a final showdown word.",
    rounds: ROUND_COUNT,
    fixedRounds: false,
    roundDuration: DEFAULT_ROUND_DURATION,
    scoring: DEFAULT_ROUND_SCORING,
    hostStumperBonusXp: DEFAULT_HOST_STUMPER_BONUS_XP,
  },
  [GameMode.SubText]: {
    id: GameMode.SubText,
    base: GameMode.SubText,
    showdown: true,
    label: "Savvy SubText",
    icon: "subtitles",
    tone: "violet",
    summary: "The words found in the first four rounds are connected by the fifth. Then a final showdown word.",
    rounds: ROUND_COUNT,
    fixedRounds: false,
    roundDuration: DEFAULT_ROUND_DURATION,
    scoring: DEFAULT_ROUND_SCORING,
    hostStumperBonusXp: DEFAULT_HOST_STUMPER_BONUS_XP,
  },
};
/** The game a stream plays (TextChain or SubText); null while it has no format yet. */
export const baseOf = (gameMode) => GAME_MODES[gameMode]?.id ?? null;

/** Every game mode (one colour each in the calendar). */
export const BASE_MODES = Object.values(GAME_MODES);
/** Id of the game mode a stream (or slot) plays. The showdown no longer makes a mode of its own. */
// eslint-disable-next-line no-unused-vars
export const modeId = (gameMode, showdown) => gameMode ?? null;
/** A stream without a format yet (no word set, none picked): no icon, no name. */
export const NO_MODE = { id: null, label: "", icon: null };
export const modeOf = (s) => GAME_MODES[s.gameMode] ?? NO_MODE;

const DEFAULT_SHOWDOWN_PRIZE = { rewardType: RewardType.Cash, amount: 100 };
/** A fresh Savvy Showdown from the mode preset; Super Savvy only streams get a Super Savvy Showdown. */
export const newShowdown = (preset, streamType) => ({
  word: "",
  prize: { ...(preset?.showdown?.prize ?? DEFAULT_SHOWDOWN_PRIZE) },
  superSavvyOnly: streamType === StreamType.SuperSavvy || !!preset?.showdown?.superSavvyOnly,
});

export const NOTIFICATION_DEFAULTS = {
  lobbyOpenTitle: "Lobby is Open",
  lobbyOpenBody: "10 minutes until showtime!",
  goingLiveTitle: "We're Live!",
  goingLiveBody: "Join now",
  round1StartsTitle: "Round 1 is about to start!",
  round1StartsBody: "Last chance to join!",
};

/** Editable game mode presets, keyed by id. */
export function useGameModePresets() {
  const { data, isLoading } = useList({ resource: "GameMode", dataProviderName: DP.gameModes, pagination: { mode: "off" } });
  const presets = Object.fromEntries((data?.data ?? []).map((m) => [m.id, m]));
  return { presets, isLoading };
}

/** Bundles (what a new stream starts with), in order and by id. */
export function useBundles() {
  const { data, isLoading } = useList({ resource: "Bundle", dataProviderName: DP.bundles, pagination: { mode: "off" } });
  const bundles = data?.data ?? [];
  return { bundles, byId: Object.fromEntries(bundles.map((b) => [b.id, b])), isLoading };
}
/** A bundle in a line: its showdown and prize ("Savvy Showdown · $100"). */
export const bundleLine = (b) => (b?.showdown ? [b.showdown.superSavvyOnly ? "Super Savvy Showdown" : "Savvy Showdown", prizeText(b.showdown.prize)].filter(Boolean).join(" · ") : "");
const prizeText = (r) => (!r?.rewardType ? "" : r.rewardType === "Cash" ? `$${r.amount ?? 0}` : `${r.amount ?? 0} ${{ Sparks: "Sparks", BombPowerup: "Letter Bomb", HintPowerup: "Magniflyer" }[r.rewardType] ?? r.rewardType}`);

/** Rounds / duration / scoring a new stream gets, from the editable preset or the built-in fallback. */
export function modeDefaults(gameMode, preset) {
  const mode = GAME_MODES[gameMode] ?? GAME_MODES.TextChain;
  return {
    rounds: ROUND_COUNT,
    roundDuration: preset?.roundDurationInSeconds ?? mode.roundDuration,
    scoring: preset?.roundScoring ?? mode.scoring,
    hostStumperBonusXp: preset ? preset.hostStumperBonusXp : mode.hostStumperBonusXp,
    defaultRewards: preset?.defaultRewards?.length ? preset.defaultRewards : [{ rewardType: RewardType.BombPowerup, amount: 1 }],
  };
}

/** Full stream payload for the create endpoint, filled from the game mode preset. Host and mode
 * presentation (display name, hero card image, logo, pill) comes from the libraries on the server. */
export function streamFromPreset({ title, host, startDate, gameMode = null, streamType: given, bundleId }, preset) {
  const mode = modeDefaults(gameMode, preset);
  // Who can join comes from the game set (a duplicate keeps its source's).
  const streamType = given ?? preset?.streamType ?? StreamType.Public;
  return {
    title,
    hostId: host.id,
    hostName: host.name,
    imageUrl: host.imageUrl ?? null,
    heroImageUrl: host.streamImageUrl ?? null,
    heroCardImageUrl: host.heroCardImageUrl ?? null,
    startDate,
    streamType,
    // Its format (How to play & format) is picked on the stream. None yet.
    gameMode: GAME_MODES[gameMode]?.id ?? null,
    bundleId: preset?.id ?? bundleId ?? null,
    showdownConfiguration: newShowdown(preset, streamType),
    headless: false,
    isSpotlighted: false,
    textSavvyRounds: {
      // Each round's time follows its word (the fifth is always 45 s); Round Pounder 5, 10, 15 … Sparks.
      rounds: Array.from({ length: mode.rounds }, (_, i) => ({ roundIndex: i, word: "", durationInSeconds: durationFor("", i), roundBusterReward: busterFor(i) })),
    },
    // SubText gives no points for yellow letters.
    roundScoring: gameMode === GameMode.SubText ? Object.fromEntries(Object.entries(mode.scoring ?? {}).map(([k, v]) => [k, { ...v, yellowLetterXp: 0 }])) : mode.scoring,
    hostStumperBonusXp: mode.hostStumperBonusXp ?? undefined,
    defaultRewards: mode.defaultRewards,
    entranceFee: { type: EntranceFeeType.Free, amount: 0 },
    ...NOTIFICATION_DEFAULTS,
  };
}

/**
 * The one way a new stream is put together (New stream and Create event alike): its bundle's
 * defaults (rounds, scoring, rewards, showdown, host's pictures, share card and
 * notification presets). Words come later, from a word set.
 */
export function useStreamBuilder() {
  const { bundles, byId } = useBundles();
  const { data: share } = useList({ resource: "SharePreset", dataProviderName: DP.sharePresets, pagination: { mode: "off" } });
  const { data: notify } = useList({ resource: "NotificationPreset", dataProviderName: DP.notificationPresets, pagination: { mode: "off" } });
  const { data: scoring } = useList({ resource: "ScoringPreset", dataProviderName: DP.scoringPresets, pagination: { mode: "off" } });
  return (base) => {
    // The stream's game set (the first one when none is given); its game comes later, with its word set.
    const set = byId[base.bundleId] ?? bundles[0];
    // Points per round from the game set's scoring preset, else the Default one (Streams › Scoring).
    const points = scoring?.data?.find((p) => p.id === set?.defaultScoringPresetId) ?? scoring?.data?.find((p) => p.isDefault) ?? scoring?.data?.[0];
    const preset = set && points ? { ...set, roundScoring: points.roundScoring } : set;
    const values = streamFromPreset(base, preset);
    // The game mode's presets, else the libraries' Default ones.
    const sharePreset = share?.data?.find((p) => p.id === preset?.defaultSharePresetId) ?? share?.data?.find((p) => p.isDefault) ?? share?.data?.[0];
    const notifyPreset = notify?.data?.find((p) => p.id === preset?.defaultNotificationPresetId) ?? notify?.data?.find((p) => p.isDefault) ?? notify?.data?.[0];
    if (sharePreset) values.shareableCards = structuredClone(sharePreset.cards);
    if (notifyPreset) Object.keys(NOTIFICATION_DEFAULTS).forEach((k) => (values[k] = notifyPreset[k] ?? values[k]));
    // No sponsor to start with: one is picked on the stream.
    values.sponsorship = null;
    return values;
  };
}

/** Things a stream still needs before it can go live. */
export function setupIssues(stream) {
  const issues = [];
  if (!stream.hostId) issues.push("No host");
  if (!GAME_MODES[stream.gameMode]) issues.push("Format not picked");
  const rounds = stream.textSavvyRounds?.rounds ?? [];
  const missing = rounds.filter((r) => !r.word).length;
  if (rounds.length === 0) issues.push("No rounds");
  else if (missing) issues.push(missing === 1 ? "1 word missing" : `${missing} words missing`);
  if (stream.showdownConfiguration && !stream.showdownConfiguration.word) issues.push("Showdown word missing");
  return issues;
}
