// A game set in a side sheet, opened from a stream's page ("Edit in Game sets") the way a host
// opens there: its name and stream image backgrounds. Who can join, scoring, the game and
// messaging stay on the game set's own page (Open game set).
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link } from "react-router";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Icon } from "../../ds/Icon";
import { ImageGallery } from "../../ds/ImageGallery";
import { SideSheet } from "../../ds/SideSheet";
import { DP } from "../../providers";
import { TextInput } from "../streams/detail/fields";
import { bundleLine } from "../streams/gameModes";
import { useLibraryMutations } from "../library/shared";

const EMPTY = { name: "", streamImageUrls: [], streamImageUrl: null };
const nameRule = { validate: (v) => (v?.trim() ? (v.trim().length <= 40 ? true : "Use 40 characters or fewer") : "Enter a name") };

/** `sheet` from useSheet() with the game set as its record; `onSaved(before, after)` after a save. */
export function GameSetSheet({ sheet, onSaved }) {
  const set = sheet.record;
  const { save, saving } = useLibraryMutations({ resource: "Bundle", dataProviderName: DP.bundles, noun: "Game set" });
  const { control, reset, handleSubmit, setValue, setError, formState } = useForm({ defaultValues: EMPTY });
  const [urls, picked] = useWatch({ control, name: ["streamImageUrls", "streamImageUrl"] });

  useEffect(() => {
    if (sheet.open) reset({ name: set?.name ?? "", streamImageUrls: set?.streamImageUrls ?? (set?.streamImageUrl ? [set.streamImageUrl] : []), streamImageUrl: set?.streamImageUrl ?? null });
  }, [sheet.open, set, reset]);

  const submit = handleSubmit(async (v) => {
    // The server replaces the whole game set: send the rest of it unchanged.
    const saved = await save(set.id, { ...set, name: v.name.trim(), streamImageUrls: v.streamImageUrls, streamImageUrl: v.streamImageUrl || null }, setError);
    if (!saved) return;
    onSaved?.(set, saved);
    sheet.close();
  });

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
      <TextInput control={control} name="name" label="Name" rules={nameRule} />
      <ImageGallery
        label="Stream image background"
        hint="Behind the stream's screen · 900 × 1200"
        width={900}
        height={1200}
        urls={urls ?? []}
        selected={picked}
        onChange={(next, sel) => {
          setValue("streamImageUrls", next, { shouldDirty: true });
          setValue("streamImageUrl", sel, { shouldDirty: true });
        }}
      />
    </SideSheet>
  );
}
