// Engagement › Daily puzzle — the solve reward. Its share cards are with the others in Library › Share cards.
import { useEffect, useState } from "react";
import { useForm } from "@refinedev/react-hook-form";
import { useWatch } from "react-hook-form";
import { useNotify } from "../../shell/notifications";
import { DP } from "../../providers";
import { NON_CASH_REWARDS } from "../streams/enums";
import { RewardCell } from "../streams/detail/fields";
import Typography from "@mui/material/Typography";
import { EditTable } from "../../ds/EditTable";
import Switch from "@mui/material/Switch";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import Box from "@mui/material/Box";
import { FormSection } from "../../ds/FormSection";
import { FORM_WIDTH } from "../../ds/Page";
import { ContainerCard } from "../../ds/ContainerCard";
import { RowsSkeleton } from "../../ds/Skeletons";

function useRewardForm() {
  const form = useForm({
    defaultValues: { enabled: false, reward: { rewardType: "Sparks", amount: 10 } },
    refineCoreProps: { resource: "DailyPuzzleRewardConfig", id: "default", action: "edit", dataProviderName: DP.rewards, redirect: false, successNotification: false },
  });
  const data = form.refineCore.query?.data?.data;
  const { reset } = form;
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!data) return;
    const r = data.dailyPuzzleReward;
    reset({ enabled: !!r, reward: r ? { rewardType: r.rewardType, amount: r.amount } : { rewardType: "Sparks", amount: 10 } });
    setLoaded(true);
  }, [data, reset]);
  const save = () =>
    form.handleSubmit((v) =>
      form.refineCore.onFinish({ dailyPuzzleReward: v.enabled ? { rewardType: v.reward.rewardType, amount: Number(v.reward.amount) } : null }),
    )();
  return { ...form, loaded, save };
}

/**
 * The daily puzzle's solve reward as a one-row table, like a stream's rewards: the switch turns
 * it on or off and the amount and type are edited in the row. Changes save on their own.
 */
export function DailyPuzzleReward() {
  const notify = useNotify();
  const reward = useRewardForm();
  const { m3: c } = useTheme();
  const [enabled, value] = useWatch({ control: reward.control, name: ["enabled", "reward"] });
  const { isDirty } = reward.formState;
  const persist = async () => {
    if (!(await reward.trigger())) return;
    try {
      await reward.save();
      reward.reset(reward.getValues());
      notify("Daily puzzle reward saved");
    } catch {
      notify("Couldn't save the daily puzzle reward", { variant: "error" });
    }
  };
  // Save a moment after the last change, so typing an amount saves once.
  useEffect(() => {
    if (!isDirty) return undefined;
    const t = setTimeout(persist, 700);
    return () => clearTimeout(t);
    // `persist` reads the latest form values itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, enabled, value?.amount, value?.rewardType]);
  if (!reward.loaded)
    return (
      <ContainerCard>
        <RowsSkeleton count={1} lead={false} label="Loading reward" />
      </ContainerCard>
    );
  return (
    <EditTable
      label="Solve reward"
      minWidth={420}
      columns={[
        { header: "", width: "16px" },
        { header: "Reward", width: "minmax(120px, 1fr)" },
        { header: "Amount", width: "200px" },
        { header: "On", width: "48px", align: "right" },
      ]}
      rows={[
        {
          key: "reward",
          cells: [
            <Icon key="i" name="extension" size={20} style={{ color: c.onSurfaceVariant }} />,
            <Typography key="t" variant="bodyLarge" sx={{ px: 1 }}>
              Daily puzzle reward
            </Typography>,
            enabled ? (
              <RewardCell key="v" control={reward.control} name="reward" allowed={NON_CASH_REWARDS} label="Daily puzzle reward" />
            ) : (
              <Typography key="v" variant="bodyLarge" color="text.secondary" sx={{ px: 1 }}>
                Off
              </Typography>
            ),
            <Switch key="s" checked={!!enabled} onChange={(e) => reward.setValue("enabled", e.target.checked, { shouldDirty: true })} slotProps={{ input: { "aria-label": "Daily puzzle reward" } }} />,
          ],
        },
      ]}
    />
  );
}

export default function DailyPuzzlePage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: FORM_WIDTH }}>
      <FormSection id="reward" title="Solve reward">
        <DailyPuzzleReward />
      </FormSection>
    </Box>
  );
}
