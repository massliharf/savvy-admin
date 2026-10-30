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
/** Every game mode (one colour each in the calendar). */
export const BASE_MODES = Object.values(GAME_MODES);
/** Id of the game mode a stream (or slot) plays. The showdown no longer makes a mode of its own. */
// eslint-disable-next-line no-unused-vars
export const modeId = (gameMode, showdown) => gameMode ?? GameMode.TextChain;
export const modeOf = (s) => GAME_MODES[modeId(s.gameMode)] ?? GAME_MODES.TextChain;

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

/** Rounds / duration / scoring a new stream gets, from the editable preset or the built-in fallback. */
export function modeDefaults(gameMode, preset) {
  const mode = GAME_MODES[gameMode];
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
export function streamFromPreset({ title, host, startDate, gameMode, streamType }, preset) {
  const mode = modeDefaults(gameMode, preset);
  const meta = GAME_MODES[gameMode];
  return {
    title,
    hostId: host.id,
    hostName: host.name,
    imageUrl: host.imageUrl ?? null,
    heroImageUrl: host.streamImageUrl ?? null,
    heroCardImageUrl: host.heroCardImageUrl ?? null,
    startDate,
    streamType,
    gameMode: meta.base,
    showdownConfiguration: meta.showdown ? newShowdown(preset, streamType) : null,
    headless: false,
    isSpotlighted: false,
    textSavvyRounds: {
      // Each round's time follows its word (the fifth is always 45 s); Round Pounder 5, 10, 15 … Sparks.
      rounds: Array.from({ length: mode.rounds }, (_, i) => ({ roundIndex: i, word: "", durationInSeconds: durationFor("", i), roundBusterReward: busterFor(i) })),
    },
    roundScoring: mode.scoring,
    hostStumperBonusXp: mode.hostStumperBonusXp ?? undefined,
    defaultRewards: mode.defaultRewards,
    entranceFee: { type: EntranceFeeType.Free, amount: 0 },
    ...NOTIFICATION_DEFAULTS,
  };
}

/**
 * The one way a new stream is put together (New stream and Fill month alike): the game mode's
 * defaults (rounds, scoring, rewards, showdown, host's pictures, default sponsor), then the
 * Default share card and notification presets. Words come later, from a word set.
 */
export function useStreamBuilder() {
  const { presets } = useGameModePresets();
  const { data: sponsors } = useList({ resource: "Sponsor", dataProviderName: DP.sponsors, pagination: { mode: "off" } });
  const { data: share } = useList({ resource: "SharePreset", dataProviderName: DP.sharePresets, pagination: { mode: "off" } });
  const { data: notify } = useList({ resource: "NotificationPreset", dataProviderName: DP.notificationPresets, pagination: { mode: "off" } });
  return (base) => {
    const preset = presets[base.gameMode];
    const values = streamFromPreset(base, preset);
    const sharePreset = share?.data?.find((p) => p.isDefault) ?? share?.data?.[0];
    const notifyPreset = notify?.data?.find((p) => p.isDefault) ?? notify?.data?.[0];
    if (sharePreset) values.shareableCards = structuredClone(sharePreset.cards);
    if (notifyPreset) Object.keys(NOTIFICATION_DEFAULTS).forEach((k) => (values[k] = notifyPreset[k] ?? values[k]));
    const sponsor = sponsors?.data?.find((sp) => sp.id === preset?.defaultSponsorId);
    values.sponsorship = sponsor ? { title: sponsor.title, description: sponsor.description, cta: sponsor.cta, imageUrl: sponsor.imageUrl ?? null } : null;
    return values;
  };
}

/** Things a stream still needs before it can go live. */
export function setupIssues(stream) {
  const issues = [];
  const rounds = stream.textSavvyRounds?.rounds ?? [];
  const missing = rounds.filter((r) => !r.word).length;
  if (rounds.length === 0) issues.push("No rounds");
  else if (missing) issues.push(missing === 1 ? "1 word missing" : `${missing} words missing`);
  if (stream.showdownConfiguration && !stream.showdownConfiguration.word) issues.push("Showdown word missing");
  return issues;
}
