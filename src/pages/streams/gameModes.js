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
/**
 * A fresh showdown from the game set (its kind) and its reward set (the prize); Super Savvy only
 * streams get a Super Savvy Showdown.
 */
export const newShowdown = (set, streamType, rewards) => ({
  word: "",
  prize: { ...(rewards?.showdownPrize ?? DEFAULT_SHOWDOWN_PRIZE) },
  superSavvyOnly: streamType === StreamType.SuperSavvy || !!set?.showdown?.superSavvyOnly,
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

/**
 * Reward sets (Library › Gameplay › Reward sets): everything a stream pays (Round Pounders, the
 * showdown prize, participation, host buster and stumper, raffle). `of(set)` is the one a game set
 * picked, else the Default one.
 */
export function useRewardSets() {
  const { data, isLoading } = useList({ resource: "RewardSet", dataProviderName: DP.rewardSets, pagination: { mode: "off" } });
  const rewardSets = data?.data ?? [];
  const byId = Object.fromEntries(rewardSets.map((r) => [r.id, r]));
  const fallback = rewardSets.find((r) => r.isDefault) ?? rewardSets[0] ?? null;
  return { rewardSets, byId, fallback, of: (set) => byId[set?.rewardSetId] ?? fallback, isLoading };
}

/** Bundles (what a new stream starts with), in order and by id; `rewardsOf(set)` is its reward set. */
export function useBundles() {
  const { data, isLoading } = useList({ resource: "Bundle", dataProviderName: DP.bundles, pagination: { mode: "off" } });
  const rewards = useRewardSets();
  const bundles = data?.data ?? [];
  return { bundles, byId: Object.fromEntries(bundles.map((b) => [b.id, b])), rewardsOf: rewards.of, isLoading };
}
/** A game set in a line: its showdown and (with its reward set) the prize ("Savvy Showdown · $100"). */
export const bundleLine = (b, rewards) => (b?.showdown ? [b.showdown.superSavvyOnly ? "Super Savvy Showdown" : "Savvy Showdown", prizeText(rewards?.showdownPrize)].filter(Boolean).join(" · ") : "");
export const prizeText = (r) => (!r?.rewardType ? "" : r.rewardType === "Cash" ? `$${r.amount ?? 0}` : `${r.amount ?? 0} ${{ Sparks: "Sparks", BombPowerup: "Letter Bomb", HintPowerup: "Magniflyer" }[r.rewardType] ?? r.rewardType}`);

/** Round Pounders 5, 10, 15 … Sparks for `n` rounds (a new reward set's). */
export const roundRewardsFor = (n = ROUND_COUNT) => Array.from({ length: n }, (_, i) => busterFor(i));
/** A round's Round Pounder from a reward set; rounds past its list follow on (5, 10, 15 … Sparks). */
export const roundRewardOf = (rewards, i) => {
  const r = rewards?.roundRewards?.[i];
  return r === undefined ? busterFor(i) : r ? { ...r } : null;
};
/** What a reward set puts on a stream (field → value), for `rounds` rounds and the stream's showdown. */
export function streamRewards(rewards, rounds, showdown) {
  return {
    roundRewards: Array.from({ length: rounds }, (_, i) => roundRewardOf(rewards, i)),
    showdownPrize: showdown ? { ...(rewards?.showdownPrize ?? DEFAULT_SHOWDOWN_PRIZE) } : null,
    defaultRewards: structuredClone(rewards?.defaultRewards ?? []),
    hostBusterReward: rewards?.hostBusterReward ? { ...rewards.hostBusterReward } : null,
    hostStumperBonusXp: rewards?.hostStumperBonusXp ?? null,
    raffleSystemWinnersConfiguration: rewards?.raffleSystemWinnersConfiguration?.length ? structuredClone(rewards.raffleSystemWinnersConfiguration) : null,
  };
}

/** Rounds / duration / scoring a new stream gets, from the game set or the built-in fallback. */
export function modeDefaults(gameMode, preset) {
  const mode = GAME_MODES[gameMode] ?? GAME_MODES.TextChain;
  return {
    rounds: ROUND_COUNT,
    roundDuration: preset?.roundDurationInSeconds ?? mode.roundDuration,
    scoring: preset?.roundScoring ?? mode.scoring,
  };
}

/**
 * Full stream payload for the create endpoint, filled from the game set (`preset`) and its reward
 * set (`rewards`). Host and mode presentation (display name, logo, pill) comes from the libraries
 * on the server.
 */
export function streamFromPreset({ title, host, startDate, gameMode = null, streamType: given, bundleId }, preset, rewards) {
  const mode = modeDefaults(gameMode, preset);
  // Who can join comes from the game set (a duplicate keeps its source's).
  const streamType = given ?? preset?.streamType ?? StreamType.Public;
  const showdown = newShowdown(preset, streamType, rewards);
  const pays = streamRewards(rewards, mode.rounds, showdown);
  return {
    title,
    hostId: host.id,
    hostName: host.name,
    // The live game host avatar: the host's image on the game set's background (heroImageUrl, 900 × 1200).
    imageUrl: host.imageUrl ?? null,
    heroImageUrl: preset?.avatarBackgroundUrl ?? null,
    // The hero card: the host's hero card image on the game set's hero card background.
    heroCardImageUrl: host.heroCardImageUrl ?? null,
    heroCardBackgroundUrl: preset?.heroCardBackgroundUrl ?? null,
    // The power-ups the stream's How to play shows (from its game set).
    powerUpIds: [...(preset?.powerUpIds ?? [])],
    startDate,
    streamType,
    // Its format (How to play & format) is picked on the stream. None yet.
    gameMode: GAME_MODES[gameMode]?.id ?? null,
    bundleId: preset?.id ?? bundleId ?? null,
    showdownConfiguration: showdown,
    headless: false,
    isSpotlighted: false,
    textSavvyRounds: {
      // Each round's time follows its word (the fifth is always 45 s); its Round Pounder from the reward set.
      rounds: Array.from({ length: mode.rounds }, (_, i) => ({ roundIndex: i, word: "", durationInSeconds: durationFor("", i), roundBusterReward: pays.roundRewards[i] })),
    },
    roundScoring: mode.scoring,
    hostStumperBonusXp: pays.hostStumperBonusXp ?? undefined,
    defaultRewards: pays.defaultRewards,
    hostBusterReward: pays.hostBusterReward,
    raffleSystemWinnersConfiguration: pays.raffleSystemWinnersConfiguration,
    entranceFee: { type: EntranceFeeType.Free, amount: 0 },
    ...NOTIFICATION_DEFAULTS,
  };
}

/**
 * The one way a new stream is put together (New stream and Create event alike): its game set's
 * defaults (rounds, scoring, reward set, showdown, power-ups, backgrounds, share card and
 * notification presets) and the host's pictures. Words come later, from a word set.
 */
export function useStreamBuilder() {
  const { bundles, byId, rewardsOf } = useBundles();
  const { data: share } = useList({ resource: "SharePreset", dataProviderName: DP.sharePresets, pagination: { mode: "off" } });
  const { data: notify } = useList({ resource: "NotificationPreset", dataProviderName: DP.notificationPresets, pagination: { mode: "off" } });
  const { data: scoring } = useList({ resource: "ScoringPreset", dataProviderName: DP.scoringPresets, pagination: { mode: "off" } });
  return (base) => {
    // The stream's game set (the first one when none is given); its game comes later, with its word set.
    const set = byId[base.bundleId] ?? bundles[0];
    // Points per round from the game set's scoring preset, else the Default one (Library › Gameplay › Scoring).
    const points = scoring?.data?.find((p) => p.id === set?.defaultScoringPresetId) ?? scoring?.data?.find((p) => p.isDefault) ?? scoring?.data?.[0];
    const preset = set && points ? { ...set, roundScoring: points.roundScoring } : set;
    const values = streamFromPreset(base, preset, rewardsOf(set));
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
