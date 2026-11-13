// A game set in a side sheet, opened from a stream's page ("Edit in Game sets") the way a host
// opens there: all of it, the same parts as its own page (GameSetFields), as flat groups.
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Icon } from "../../ds/Icon";
import { SideSheet } from "../../ds/SideSheet";
import { DP } from "../../providers";
import { useNotify } from "../../shell/notifications";
import { bundleLine } from "../streams/gameModes";
import { useLibraryMutations } from "../library/shared";
import { GameSetFields, gameSetForm } from "./detail";

/** `sheet` from useSheet() with the game set as its record; `onSaved(before, after)` after a save. */
export function GameSetSheet({ sheet, onSaved }) {
  const set = sheet.record;
  const notify = useNotify();
  const { save, saving } = useLibraryMutations({ resource: "Bundle", dataProviderName: DP.bundles, noun: "Game set" });
  const { control, reset, handleSubmit, setValue, getValues, trigger, setError, formState } = useForm();
  // The fields show once the form holds this game set (as on its page), never an empty form.
  const [loaded, setLoaded] = useState(null);

  useEffect(() => {
    if (!sheet.open || !set) return setLoaded(null);
    reset(gameSetForm(set));
    setLoaded(set);
  }, [sheet.open, set, reset]);

  const submit = handleSubmit(
    async (values) => {
      const saved = await save(set.id, values, setError);
      if (!saved) return;
      onSaved?.(set, saved);
      sheet.close();
    },
    () => notify("Some fields need attention", { variant: "error" }),
  );

  return (
    <SideSheet
      open={sheet.open}
      onClose={sheet.close}
      dirty={formState.isDirty}
      title={set?.name}
      subtitle={["Game set", bundleLine(set)].filter(Boolean).join(" · ")}
      headerActions={
        set?.id && (
          <Tooltip title="Open game set">
            <IconButton aria-label="Open game set" component={Link} to={`/game-sets/${set.id}`}>
              <Icon name="inventory_2" />
            </IconButton>
          </Tooltip>
        )
      }
      actions={
        <>
          <Button variant="text" onClick={sheet.close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !formState.isDirty}>
            Save
          </Button>
        </>
      }
    >
      {loaded === set && set && <GameSetFields form={{ control, setValue, getValues, trigger }} inSheet />}
    </SideSheet>
  );
}
