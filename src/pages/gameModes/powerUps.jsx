// Library › Gameplay › Power-ups — the power-ups a stream's How to play can show: icon, name and what it
// does. Each game set picks its own (Library › Gameplay › Game sets), and a stream can change its
// own. Same cards and sheet as Sponsors.
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useList } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import { Icon } from "../../ds/Icon";
import { EmptyState } from "../../ds/EmptyState";
import { ImageField } from "../../ds/ImageField";
import { SideSheet } from "../../ds/SideSheet";
import { IconTile } from "../../ds/IconTile";
import { ListGroup, ListItem } from "../../ds/ListGroup";
import { CardsSkeleton } from "../../ds/Skeletons";
import { DP } from "../../providers";
import { TextInput } from "../streams/detail/fields";
import { CardGrid, ShopCard } from "../shop/shared";
import { ConfirmDelete, LibraryToolbar, useLibraryMutations, useSheet } from "../library/shared";

const EMPTY = { title: "", description: "", iconUrl: null, iconFile: null };

/** Power-ups, in their saved order. */
export function usePowerUps() {
  const { data, isLoading } = useList({ resource: "PowerUp", dataProviderName: DP.powerUps, pagination: { mode: "off" } });
  return { powerUps: data?.data ?? [], isLoading };
}

/**
 * The power-ups as rows with a checkbox, bound to `powerUpIds` (a game set's or a stream's): the
 * checked ones show in How to play.
 */
export function PowerUpPicker({ control, setValue }) {
  const { powerUps } = usePowerUps();
  const picked = useWatch({ control, name: "powerUpIds" }) ?? [];
  const toggle = (id, on) =>
    setValue(
      "powerUpIds",
      // Kept in the order of Library › Gameplay › Power-ups.
      powerUps.map((p) => p.id).filter((x) => (x === id ? on : picked.includes(x))),
      { shouldDirty: true },
    );
  if (powerUps.length === 0) return <EmptyState compact icon="bolt" title="No power-ups yet" description="Add them in Library › Gameplay › Power-ups." />;
  return (
    <ListGroup label="Power-ups">
      {powerUps.map((p) => (
        <ListItem
          key={p.id}
          onClick={() => toggle(p.id, !picked.includes(p.id))}
          leadingControl={<Checkbox checked={picked.includes(p.id)} onChange={(e) => toggle(p.id, e.target.checked)} onClick={(e) => e.stopPropagation()} slotProps={{ input: { "aria-label": `Show ${p.title}` } }} />}
          leading={<IconTile src={p.iconUrl} icon="bolt" />}
          title={p.title}
          supporting={p.description}
        />
      ))}
    </ListGroup>
  );
}

function PowerUpSheet({ sheet }) {
  const isNew = sheet.open && !sheet.record?.id;
  const { save, destroy, saving } = useLibraryMutations({ resource: "PowerUp", dataProviderName: DP.powerUps, noun: "Power-up" });
  const [confirm, setConfirm] = useState(false);
  const { control, reset, handleSubmit, setValue, setError, formState } = useForm({ defaultValues: EMPTY });
  const iconUrl = useWatch({ control, name: "iconUrl" });

  useEffect(() => {
    if (sheet.open) reset({ ...EMPTY, ...sheet.record, iconFile: null });
  }, [sheet.open, sheet.record, reset]);

  const submit = handleSubmit(async (v) => {
    const payload = { title: v.title, description: v.description, iconUrl: v.iconUrl || null, iconFile: v.iconFile || null };
    if (await save(isNew ? null : sheet.record.id, payload, setError)) sheet.close();
  });

  return (
    <SideSheet
      open={sheet.open}
      onClose={sheet.close}
      dirty={formState.isDirty}
      title={isNew ? "New power-up" : sheet.record?.title}
      subtitle={isNew ? undefined : "Power-up"}
      footerStart={
        !isNew && (
          <Button variant="text" color="error" onClick={() => setConfirm(true)}>
            Delete
          </Button>
        )
      }
      actions={
        <>
          <Button variant="text" onClick={sheet.close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || (!isNew && !formState.isDirty)}>
            {isNew ? "Add power-up" : "Save"}
          </Button>
        </>
      }
    >
      <ImageField
        label="Icon"
        value={iconUrl}
        width={128}
        height={128}
        fit="contain"
        onChange={(f) => setValue("iconFile", f, { shouldDirty: true })}
        onRemove={() => {
          setValue("iconFile", null, { shouldDirty: true });
          setValue("iconUrl", null, { shouldDirty: true });
        }}
      />
      <TextInput control={control} name="title" label="Name" rules={{ validate: (v) => (v?.trim() ? true : "Enter a name") }} />
      <TextInput control={control} name="description" label="What it does" multiline minRows={2} rules={{ validate: (v) => (v?.trim() ? true : "Describe what it does") }} />
      <ConfirmDelete
        open={confirm}
        title={`Delete ${sheet.record?.title}?`}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          await destroy(sheet.record.id, sheet.record.title);
          sheet.close();
        }}
      >
        Game modes that show it lose it from their How to play. This can't be undone.
      </ConfirmDelete>
    </SideSheet>
  );
}

export default function PowerUpsPage() {
  const [query, setQuery] = useState("");
  const sheet = useSheet();
  const { powerUps, isLoading } = usePowerUps();
  const q = query.trim().toLowerCase();
  const rows = powerUps.filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(q));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <LibraryToolbar query={query} onQuery={setQuery} placeholder="Search power-ups" actionLabel="New power-up" onAction={sheet.openNew} />
      {isLoading ? (
        <CardsSkeleton count={4} label="Loading power-ups" />
      ) : rows.length === 0 ? (
        <EmptyState icon={q ? "search_off" : "auto_fix_high"} title={q ? "No power-ups match" : "No power-ups yet"}>
          {!q && (
            <Button color="secondary" startIcon={<Icon name="add" />} onClick={sheet.openNew}>
              New power-up
            </Button>
          )}
        </EmptyState>
      ) : (
        <CardGrid>
          {rows.map((p) => (
            <ShopCard
              key={p.id}
              media={p.iconUrl && <Box component="img" src={p.iconUrl} alt="" sx={{ width: "100%", height: "100%", objectFit: "contain", p: 1, display: "block" }} />}
              icon="auto_fix_high"
              title={p.title}
              meta={
                <Typography variant="bodySmall" color="text.secondary" component="div" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {p.description}
                </Typography>
              }
              onOpen={() => sheet.openEdit(p)}
            />
          ))}
        </CardGrid>
      )}
      <PowerUpSheet sheet={sheet} />
    </Box>
  );
}
