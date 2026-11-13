// Library › Share cards — every share card as presets: stream cards, the app's cards (profile,
// live show stats) and the daily puzzle's. Engagement › Referrals — the referral reward. The app's
// live texts and the referral reward are the share config (one document).
import { useState } from "react";
import Box from "@mui/material/Box";
import { FormSection } from "../../ds/FormSection";
import { FORM_WIDTH } from "../../ds/Page";
import { SaveBar } from "../../ds/SaveBar";
import { useNotify } from "../../shell/notifications";
import { NumberInput } from "../streams/detail/fields";
import { useShareConfigForm } from "./shareConfig";
import { PresetList } from "./presets";
import { ContainerCard } from "../../ds/ContainerCard";
import { RowsSkeleton } from "../../ds/Skeletons";

/** Saves the share config form (validated first), with a toast either way. */
export function useShareSave(share, what = "Sharing settings") {
  const notify = useNotify();
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!(await share.trigger())) {
      notify("Some fields need attention", { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      if (share.formState.isDirty) await share.save();
      notify(`${what} saved`);
    } catch {
      notify(`Couldn't save the ${what.toLowerCase()}`, { variant: "error" });
    } finally {
      setSaving(false);
    }
  };
  return { save, saving };
}

function Loading() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: FORM_WIDTH }}>
      <ContainerCard>
        <RowsSkeleton count={2} lead={false} height={56} />
      </ContainerCard>
      <ContainerCard>
        <RowsSkeleton count={4} lead={false} height={56} />
      </ContainerCard>
    </Box>
  );
}

/**
 * Library › Share cards: every share card in one place, all as presets. Streams pick a stream
 * preset; the app uses one app preset and one daily puzzle preset ("In use"), set with "Use".
 */
export function ShareCardsPage() {
  const share = useShareConfigForm();
  if (!share.loaded) return <Loading />;
  return (
    // Three kinds of presets, each a titled group of cards (like Polls & trivia).
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <PresetList kind="share" />
      <PresetList kind="app" share={share} />
      <PresetList kind="puzzle" share={share} />
    </Box>
  );
}

/** Engagement › Referrals: the Sparks a player earns for each friend they bring in. */
export default function ReferralsPage() {
  const share = useShareConfigForm();
  const { save, saving } = useShareSave(share, "Referral reward");
  if (!share.loaded) return <Loading />;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: FORM_WIDTH }}>
      <FormSection id="referrals" title="Referral reward">
        <NumberInput
          control={share.control}
          name="sparksPerReferral"
          label="Sparks per referral"
          inputProps={{ min: 1, max: 999999, step: 1 }}
          rules={{ validate: (v) => (v == null || Number.isNaN(v) ? "Required" : !Number.isInteger(v) ? "Whole number" : v < 1 || v > 999999 ? "Use 1 to 999,999" : true) }}
          sx={{ maxWidth: 280 }}
        />
      </FormSection>
      <SaveBar dirty={share.formState.isDirty} saving={saving} onSave={save} onDiscard={() => share.reset()} />
    </Box>
  );
}
