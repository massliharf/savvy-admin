import { LOGO_URL } from "../../assets";
// Stream enums + small helpers (originals: Cr, Ml, GM, KM, iY, aY, S1, zl, un, Fo, hje, np, dg).

// Reward type string enum (Cr)
export const RewardType = {
  Sparks: "Sparks",
  BombPowerup: "BombPowerup",
  HintPowerup: "HintPowerup",
  Cash: "Cash",
  BetterBombPowerup: "BetterBombPowerup",
  GreeniePowerup: "GreeniePowerup",
};

// Powerup types (GM)
// In the order players know them: Letter Bomb, Better Bomb, Greenie, Magniflyer.
export const POWERUP_TYPES = ["BombPowerup", "BetterBombPowerup", "GreeniePowerup", "HintPowerup"];

// KM
export const isPowerup = (t) => POWERUP_TYPES.includes(t ?? "");

// aY — react-hook-form register rules for an amount
export function amountRules({ isPowerup: powerup, required = true }) {
  const optional = !required;
  return {
    valueAsNumber: true,
    required: required ? "Amount is required" : undefined,
    min: { value: 1, message: "Must be greater than zero" },
    validate: (v) => {
      const n = Number(v);
      return (optional && Number.isNaN(n)) || !powerup || Number.isInteger(n)
        ? true
        : "Power-up amount must be a whole number";
    },
  };
}

// S1 — non-cash rewards
export const NON_CASH_REWARDS = [
  RewardType.Sparks,
  RewardType.BombPowerup,
  RewardType.BetterBombPowerup,
  RewardType.GreeniePowerup,
  RewardType.HintPowerup,
];
export const RAFFLE_REWARD_OPTIONS = [RewardType.Cash, ...NON_CASH_REWARDS]; // CNe

// zl
export const GameMode = { TextChain: "TextChain", SubText: "SubText" };
/** A round's time comes from its word: 3–4 letters get 60s, 5 letters or more 90s. */
/** The fifth round starts at 45 seconds (it can be changed like any round's time). */
export const FIFTH_ROUND_SECONDS = 45;
export const durationFor = (word, index) => (index === 4 ? FIFTH_ROUND_SECONDS : String(word ?? "").trim().length >= 5 ? 90 : 60);
/** Round Pounder reward grows with the round: 5, 10, 15, 20, 25 … Sparks. */
export const busterFor = (index) => ({ rewardType: "Sparks", amount: 5 * (index + 1) });
/** Every game has at least five rounds (new ones start with five). */
export const ROUND_COUNT = 5;
export const DEFAULT_ROUND_DURATION = 60; // ENe / dje
export const SUBTEXT_ROUNDS = 5; // Dm

// un
export const StreamType = {
  None: "None",
  Public: "Public",
  Internal: "Internal",
  SuperSavvy: "SuperSavvy",
};

// hje
export const EntranceFeeType = { Free: "Free" };

// PNe / kNe / np — rich text length
const RICH_TEXT_TAGS = new RegExp(
  [
    String.raw`<\/?b>`,
    String.raw`<\/?i>`,
    String.raw`<color=#[0-9a-fA-F]{3,8}>`,
    String.raw`<\/color>`,
    String.raw`<size=\d+(\.\d+)?%?>`,
    String.raw`<\/size>`,
    String.raw`<font-weight=\d+>`,
    String.raw`<\/font-weight>`,
  ].join("|"),
  "gi",
);
export const stripRichText = (s) => s.replace(RICH_TEXT_TAGS, "");
export const richLen = (s) => stripRichText(s).length;

// dg / gY — default scoring
export const DEFAULT_ROUND_SCORING = {
  rounds1To2: { greenLetterXp: 500, yellowLetterXp: 250, solveBonusXp: 500, timeBonusXp: 100 },
  rounds3To4: { greenLetterXp: 1e3, yellowLetterXp: 500, solveBonusXp: 1e3, timeBonusXp: 100 },
  round5OrMore: { greenLetterXp: 0, yellowLetterXp: 0, solveBonusXp: 2e3, timeBonusXp: 200 },
};
export const DEFAULT_HOST_STUMPER_BONUS_XP = 2e3;

// yY — default stream image (development logo; env var never substituted in production)
export const DEFAULT_STREAM_IMAGE = LOGO_URL;
