// App-wide share card config (one document, saved whole). Library › Share cards and Engagement › Referrals edit it.
import { useEffect, useState } from "react";
import { useForm } from "@refinedev/react-hook-form";
import { DP } from "../../providers";

const EMPTY = {
  sparksPerReferral: "",
  dailyPuzzleSuccess: { title: "" },
  dailyPuzzleFail: { title: "" },
  dailyPuzzleStats: { title: "" },
  profileShare: { title: "", subtitle: "" },
  liveShowStats: { title: "" },
};

const toForm = (d) => ({
  sparksPerReferral: d.sparksPerReferral ?? 0,
  dailyPuzzleSuccess: { title: d.dailyPuzzleSuccess?.title ?? "" },
  dailyPuzzleFail: { title: d.dailyPuzzleFail?.title ?? "" },
  dailyPuzzleStats: { title: d.dailyPuzzleStats?.title ?? "" },
  profileShare: { title: d.profileShare?.title ?? "", subtitle: d.profileShare?.subtitle ?? "" },
  liveShowStats: { title: d.liveShowStats?.title ?? "" },
});

const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const toBody = (v) => ({
  sparksPerReferral: Number(v.sparksPerReferral) || 0,
  dailyPuzzleSuccess: { title: clean(v.dailyPuzzleSuccess.title) },
  dailyPuzzleFail: { title: clean(v.dailyPuzzleFail.title) },
  profileShare: { title: clean(v.profileShare.title), subtitle: clean(v.profileShare.subtitle) },
  dailyPuzzleStats: { title: clean(v.dailyPuzzleStats.title) },
  liveShowStats: { title: clean(v.liveShowStats.title) },
});

/** Placeholder rule: `{tries}` is allowed only where `allowTries` is set. */
export const placeholderRule = (allowTries) => ({
  validate: (v) => {
    const bad = [...String(v ?? "").matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((p) => !(allowTries && p === "tries"));
    if (!bad.length) return true;
    return allowTries ? "Only the {tries} placeholder is allowed" : "Placeholders aren't supported here";
  },
});

export function useShareConfigForm() {
  const form = useForm({
    defaultValues: EMPTY,
    refineCoreProps: {
      resource: "ShareableCardConfig",
      id: "default",
      action: "edit",
      dataProviderName: DP.shareableCardConfig,
      redirect: false,
      successNotification: false,
    },
  });
  const data = form.refineCore.query?.data?.data;
  const { reset } = form;
  // `loaded` turns true only after the values are in, so fields don't render empty first.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!data) return;
    reset(toForm(data));
    setLoaded(true);
  }, [data, reset]);
  const save = () => form.handleSubmit((v) => form.refineCore.onFinish(toBody(v)))();
  return { ...form, loaded, save };
}
