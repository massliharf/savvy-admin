import { DICTIONARY_URL } from "../../assets";
// Stream form hook shared by Create & Edit (original bY) + word list validator (wY).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "@refinedev/react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";
import { DEFAULT_HOST_STUMPER_BONUS_XP, DEFAULT_ROUND_DURATION, DEFAULT_ROUND_SCORING, DEFAULT_STREAM_IMAGE, GameMode, RewardType, SUBTEXT_ROUNDS, durationFor } from "./enums";
import { baseOf } from "./gameModes";

const DEFAULT_IMAGE_SIZE = 256; // Wb

// fje — default stream image file generated from the logo
const makeDefaultStreamImage = async () => {
  const blob = await (await fetch(DEFAULT_STREAM_IMAGE)).blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = DEFAULT_IMAGE_SIZE;
  canvas.height = DEFAULT_IMAGE_SIZE;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, DEFAULT_IMAGE_SIZE, DEFAULT_IMAGE_SIZE);
  bitmap.close();
  const out = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))), "image/png");
  });
  return new File([out], "default-stream-image.png", { type: "image/png" });
};

// As
const trimOrNull = (v) => {
  if (v == null) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
};

// pje
const normalizeShareableCards = (c) =>
  c
    ? {
        liveHome: { title: trimOrNull(c.liveHome?.title), subtitle: trimOrNull(c.liveHome?.subtitle) },
        upcomingHome: { title: trimOrNull(c.upcomingHome?.title), subtitle: trimOrNull(c.upcomingHome?.subtitle) },
        beatHost: {
          header: trimOrNull(c.beatHost?.header),
          title: trimOrNull(c.beatHost?.title),
          subtitle: trimOrNull(c.beatHost?.subtitle),
        },
        didNotBeatHost: {
          header: trimOrNull(c.didNotBeatHost?.header),
          title: trimOrNull(c.didNotBeatHost?.title),
          subtitle: trimOrNull(c.didNotBeatHost?.subtitle),
        },
      }
    : null;

export function useStreamForm({ streamId, action, defaultValues, redirect = "list", successNotification }) {
  const {
    saveButtonProps,
    refineCore: { formLoading, query, onFinish },
    register,
    control,
    setValue,
    setError,
    getValues,
    trigger,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    refineCoreProps: {
      id: streamId,
      action,
      redirect,
      successNotification,
      // A missing stream (404) won't appear by retrying: show "not found" right away.
      queryOptions: { retry: (count, error) => !(error?.response?.status === 404 || error?.statusCode === 404 || error?.status === 404 || /\b404\b/.test(error?.message ?? "")) && count < 2 },
      onMutationError(error) {
        const errs = error.response?.data?.errors;
        if (errs) for (const field in errs) setError(field, { message: errs[field].join(" ") });
      },
    },
    defaultValues: {
      lobbyOpenTitle: "Lobby is Open",
      lobbyOpenBody: "10 minutes until showtime!",
      goingLiveTitle: "We're Live!",
      goingLiveBody: "Join now",
      round1StartsTitle: "Round 1 is about to start!",
      round1StartsBody: "Last chance to join!",
      round1StartsAt: null,
      shareableCards: {
        liveHome: { title: null, subtitle: null },
        upcomingHome: { title: null, subtitle: null },
        beatHost: { header: null, title: null, subtitle: null },
        didNotBeatHost: { header: null, title: null, subtitle: null },
      },
      ...defaultValues,
    },
  });

  const sponsorship = useWatch({ control, name: "sponsorship" });
  const raffleSystemWinnersConfiguration = useWatch({ control, name: "raffleSystemWinnersConfiguration" });
  const hostBusterReward = useWatch({ control, name: "hostBusterReward" });
  const showdownConfiguration = useWatch({ control, name: "showdownConfiguration" });
  const streamType = useWatch({ control, name: "streamType" });
  const startDate = useWatch({ control, name: "startDate" });
  const {
    fields: roundFields,
    append: appendRound,
    remove: removeRound,
    update: updateRound,
    replace: replaceRounds,
  } = useFieldArray({ control, name: "textSavvyRounds.rounds" });
  const gameMode = useWatch({ control, name: "gameMode" });
  const prevGameMode = useRef(undefined);

  useEffect(() => {
    const prev = prevGameMode.current;
    prevGameMode.current = gameMode;
    if (baseOf(gameMode) === GameMode.SubText) {
      const rounds = getValues("textSavvyRounds.rounds") ?? [];
      if (rounds.length < SUBTEXT_ROUNDS) {
        appendRound(
          Array.from({ length: SUBTEXT_ROUNDS - rounds.length }, (_, i) => ({
            roundIndex: rounds.length + i,
            word: "",
            durationInSeconds: DEFAULT_ROUND_DURATION,
          })),
        );
      } else if (rounds.length > SUBTEXT_ROUNDS) {
        removeRound(Array.from({ length: rounds.length - SUBTEXT_ROUNDS }, (_, i) => SUBTEXT_ROUNDS + i));
      }
      const scoring = getValues("roundScoring");
      if (!scoring?.rounds1To2 || !scoring?.rounds3To4 || !scoring?.round5OrMore) {
        setValue(
          "roundScoring",
          {
            rounds1To2: scoring?.rounds1To2 ?? DEFAULT_ROUND_SCORING.rounds1To2,
            rounds3To4: scoring?.rounds3To4 ?? DEFAULT_ROUND_SCORING.rounds3To4,
            round5OrMore: scoring?.round5OrMore ?? DEFAULT_ROUND_SCORING.round5OrMore,
          },
          { shouldDirty: true },
        );
      }
      const bonus = getValues("hostStumperBonusXp");
      if (bonus == null) setValue("hostStumperBonusXp", DEFAULT_HOST_STUMPER_BONUS_XP, { shouldDirty: true });
      return;
    }
    if (prev && baseOf(prev) === GameMode.SubText) {
      const rounds = getValues("textSavvyRounds.rounds") ?? [];
      const empty = rounds
        .map((r, i) => (String(r.word ?? "").trim() === "" ? i : -1))
        .filter((i) => i >= 0);
      const toRemove = empty.length === rounds.length ? empty.slice(1) : empty;
      if (toRemove.length > 0) removeRound(toRemove);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode]);

  useEffect(() => {
    const current = getValues("round1StartsAt");
    if (startDate && !current) {
      const d = new Date(startDate);
      d.setMinutes(d.getMinutes() + 7);
      setValue("round1StartsAt", d.toISOString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate]);

  useEffect(() => {
    roundFields.forEach((f, i) => {
      if (f.roundIndex !== i) updateRound(i, { ...f, roundIndex: i });
    });
  }, [roundFields, updateRound]);

  const handleStreamImageChange = useCallback((f) => setValue("hostImageFile", f), [setValue]);
  const handleSponsorshipImageChange = useCallback((f) => setValue("sponsorship.sponsorshipImageFile", f), [setValue]);
  const handleHeroImageChange = useCallback((f) => setValue("heroImageFile", f), [setValue]);

  const makeRemove = useCallback(
    (fileField, urlField) => () => {
      setValue(fileField, null, { shouldDirty: true });
      setValue(urlField, null, { shouldDirty: true });
    },
    [setValue],
  );
  const handleStreamImageRemove = useMemo(() => makeRemove("hostImageFile", "imageUrl"), [makeRemove]);
  const handleSponsorshipImageRemove = useMemo(
    () => makeRemove("sponsorship.sponsorshipImageFile", "sponsorship.imageUrl"),
    [makeRemove],
  );
  const handleHeroImageRemove = useMemo(() => makeRemove("heroImageFile", "heroImageUrl"), [makeRemove]);

  const imageUrl = useWatch({ control, name: "imageUrl" });
  const hostImageFile = useWatch({ control, name: "hostImageFile" });
  const heroImageUrl = useWatch({ control, name: "heroImageUrl" });

  const addSponsorshipAction = useCallback(() => {
    setValue(
      "sponsorship",
      { title: "", description: "", sponsorshipImageFile: null, cta: "" },
      { shouldDirty: true, shouldTouch: true },
    );
  }, [setValue]);
  const removeSponsorshipAction = useCallback(() => setValue("sponsorship", null), [setValue]);
  const submit = handleSubmit(async (values) => {
    const hostImage =
      action === "create" && !values.hostImageFile && !values.imageUrl
        ? await makeDefaultStreamImage()
        : values.hostImageFile;
    const rounds = values.textSavvyRounds?.rounds?.map((raw, i) => {
      // The time set in the cell; without one, the default (see durationFor).
      const r = { ...raw, durationInSeconds: Number.isFinite(raw.durationInSeconds) ? raw.durationInSeconds : durationFor(raw.word, i) };
      const amount = Number(r.roundBusterReward?.amount);
      if (Number.isNaN(amount) || amount < 1) {
        // eslint-disable-next-line no-unused-vars
        const { roundBusterReward, ...rest } = r;
        return rest;
      }
      return {
        ...r,
        roundBusterReward: { rewardType: r.roundBusterReward?.rewardType ?? RewardType.Sparks, amount },
      };
    });
    const textSavvyRounds = rounds ? { ...values.textSavvyRounds, rounds } : values.textSavvyRounds;
    const count = rounds?.length ?? 0;
    const roundScoring = values.roundScoring
      ? {
          rounds1To2: values.roundScoring.rounds1To2,
          rounds3To4: count >= 3 ? values.roundScoring.rounds3To4 : undefined,
          round5OrMore: count >= 5 ? values.roundScoring.round5OrMore : undefined,
        }
      : values.roundScoring;
    const hasStumper = baseOf(values.gameMode) === GameMode.SubText || count >= 5;
    const bonus = values.hostStumperBonusXp;
    const hostStumperBonusXp = hasStumper && Number.isFinite(bonus) ? bonus : undefined;
    // eslint-disable-next-line no-unused-vars
    const { isDraft, hideGameModeLogo, ...rest } = values; // set by the server from the words
    return onFinish({
      ...rest,
      roundScoring,
      hostStumperBonusXp,
      textSavvyRounds,
      hostImageFile: hostImage,
      shareableCards: normalizeShareableCards(values.shareableCards),
    });
  });

  return {
    saveButtonProps: { ...saveButtonProps, onClick: submit },
    formLoading,
    query,
    register,
    control,
    trigger,
    setValue,
    getValues,
    errors,
    isDirty,
    reset,
    sponsorship,
    raffleSystemWinnersConfiguration,
    hostBusterReward,
    showdownConfiguration,
    streamType,
    gameMode,
    roundFields,
    appendRound,
    removeRound,
    replaceRounds,
    handleStreamImageChange,
    handleSponsorshipImageChange,
    handleHeroImageChange,
    handleStreamImageRemove,
    handleSponsorshipImageRemove,
    handleHeroImageRemove,
    imageUrl,
    hostImageFile,
    heroImageUrl,
    addSponsorshipAction,
    removeSponsorshipAction,
  };
}

// wY
// The word list is downloaded once per session and shared by every page that validates words.
let dictionary = null;
const loadDictionary = (url) => {
  dictionary ??= fetch(url)
    .then((r) => r.text())
    .then((text) => new Set(text.split("\n").map((l) => l.trim().toLowerCase()).filter(Boolean)))
    .catch((e) => {
      console.error("Error loading word list", e);
      dictionary = null;
      return new Set();
    });
  return dictionary;
};

export function useWordValidator(url = DICTIONARY_URL) {
  const [words, setWords] = useState(null);
  useEffect(() => {
    let alive = true;
    loadDictionary(url).then((set) => alive && setWords(set));
    return () => {
      alive = false;
    };
  }, [url]);
  // Until the list arrives words aren't checked against it.
  const validateWord = useCallback((w) => (!words?.size || words.has(String(w ?? "").trim().toLowerCase()) ? true : "Word is not in the word list"), [words]);
  return { ready: !!words?.size, validateWord };
}
