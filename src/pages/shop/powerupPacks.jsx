// Shop › Power-up packs — bundles of power-ups bought with sparks, in Shop order.
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useList, useUpdate } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { EmptyState } from "../../ds/EmptyState";
import { PageToolbar } from "../../ds/Page";
import { SearchField } from "../../ds/SearchField";
import { SideSheet } from "../../ds/SideSheet";
import { useNotify } from "../../shell/notifications";
import { DP } from "../../providers";
import { POWERUP_TYPES } from "../streams/enums";
import { NumberInput, REWARD_LABELS, SwitchListInput, TextInput } from "../streams/detail/fields";
import { ConfirmDelete, useLibraryMutations, useSheet } from "../library/shared";
import { CardGrid, ListRow, ShopCard, Sparks, Thumb, ViewToggle, VisibilitySwitch, useDragSort, useReorder } from "./shared";
import { ContainerCard } from "../../ds/ContainerCard";
import { ListGroup } from "../../ds/ListGroup";
import { ImageField } from "../../ds/ImageField";
import { EditTable, ImageCell, NumberCell, SelectCell } from "../../ds/EditTable";
import { useEnterOnChange } from "../../ds/useEnterOnChange";
import { CardsSkeleton, RowsSkeleton } from "../../ds/Skeletons";

const COLUMNS = { xs: "40px minmax(0,1fr) auto", sm: "40px minmax(0,1.3fr) minmax(0,1.2fr) 90px 52px 24px" };
const NEW_ROW = { powerupType: "BombPowerup", quantity: 1, iconUrl: "" };
const EMPTY = { title: "", description: "", sparksPrice: null, isEnabled: true, imageUrl: null, imageFile: null, contents: [NEW_ROW], contentIconFiles: [null] };
/** The pack's own picture; packs without one show their first power-up's icon. */
const packImage = (r) => r.imageUrl || r.contents?.[0]?.iconUrl;

// Full body for a PUT (the endpoint replaces the pack), e.g. when reordering or toggling.
const fullValues = (r, patch = {}) => ({ title: r.title, description: r.description ?? "", sparksPrice: r.sparksPrice, sortOrder: r.sortOrder, isEnabled: r.isEnabled, contents: r.contents, ...patch });

function Contents({ contents, size = 28 }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {contents.map((c, i) => (
        <Tooltip key={i} title={REWARD_LABELS[c.powerupType] ?? c.powerupType}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, typography: "labelLarge" }}>
            <Thumb src={c.iconUrl} size={size} icon="bolt" radius="8px" />×{c.quantity}
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
}

function PackSheet({ sheet }) {
  const { m3: c } = useTheme();
  const isNew = sheet.open && !sheet.record?.id;
  const { save, destroy, saving } = useLibraryMutations({ resource: "PowerupPack", dataProviderName: DP.powerupPacks, noun: "Power-up pack" });
  const [confirm, setConfirm] = useState(false);
  const { control, reset, handleSubmit, setValue, getValues, trigger, setError, formState } = useForm({ defaultValues: EMPTY });
  const { fields, append, remove } = useFieldArray({ control, name: "contents" });
  const contents = useWatch({ control, name: "contents" }) ?? [];
  const files = useWatch({ control, name: "contentIconFiles" }) ?? [];
  const imageUrl = useWatch({ control, name: "imageUrl" });

  useEffect(() => {
    if (!sheet.open) return;
    const r = sheet.record;
    reset(r?.id ? { ...r, description: r.description ?? "", imageUrl: r.imageUrl ?? null, imageFile: null, contentIconFiles: r.contents.map(() => null) } : EMPTY);
  }, [sheet.open, sheet.record, reset]);

  const types = contents.map((x) => x?.powerupType);
  const duplicate = (i) => types.filter((t) => t === types[i]).length > 1;
  const missingIcon = (i) => !(files[i] instanceof File) && !contents[i]?.iconUrl;
  const problems = contents.some((_, i) => duplicate(i) || missingIcon(i));
  // What's wrong with the contents, said once under the table.
  const problemText = [
    ...new Set(contents.filter((_, i) => duplicate(i)).map((x) => `${REWARD_LABELS[x.powerupType]} is in the pack twice`)),
    formState.isSubmitted && contents.some((_, i) => missingIcon(i)) ? "Add an icon for every power-up" : null,
  ]
    .filter(Boolean)
    .join(". ");

  const submit = handleSubmit(async (v) => {
    if (problems) return;
    const values = { title: v.title.trim(), description: v.description ?? "", sparksPrice: v.sparksPrice, isEnabled: v.isEnabled, sortOrder: v.sortOrder ?? 1, imageFile: v.imageFile, contents: v.contents, contentIconFiles: v.contentIconFiles };
    if (await save(isNew ? null : sheet.record.id, values, setError)) sheet.close();
  });

  const setIcon = (i, f) => {
    const next = [...(getValues("contentIconFiles") ?? [])];
    next[i] = f;
    setValue("contentIconFiles", next, { shouldDirty: true });
  };
  const previews = useMemo(() => files.map((f) => (f instanceof File ? URL.createObjectURL(f) : null)), [files]);
  useEffect(() => () => previews.forEach((u) => u && URL.revokeObjectURL(u)), [previews]);
  const iconOf = (i) => previews[i] ?? contents[i]?.iconUrl;
  const removeRow = (i) => {
    remove(i);
    const next = [...(getValues("contentIconFiles") ?? [])];
    next.splice(i, 1);
    setValue("contentIconFiles", next, { shouldDirty: true });
  };

  return (
    <SideSheet
      open={sheet.open}
      onClose={sheet.close}
      title={isNew ? "New power-up pack" : sheet.record?.title}
      subtitle={isNew ? undefined : "Power-up pack"}
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
            {isNew ? "Add power-up pack" : "Save"}
          </Button>
        </>
      }
    >
      {/* The pack's picture in the Shop, like a spark pack's icon. */}
      <ImageField label="Pack image" value={imageUrl} width={512} height={512} onChange={(f) => setValue("imageFile", f, { shouldDirty: true })} />
      <TextInput control={control} name="title" label="Title" rules={{ validate: (v) => (v?.trim() ? true : "Enter a title") }} />
      <TextInput control={control} name="description" label="Description" multiline minRows={2} max={500} rules={{ maxLength: { value: 500, message: "Use 500 characters or fewer" } }} />
      <NumberInput control={control} name="sparksPrice" label="Price" suffix="sparks" inputProps={{ min: 1, step: 1 }} rules={{ validate: (v) => (v == null ? "Required" : !Number.isInteger(v) || v < 1 ? "Use a whole number, 1 or more" : true) }} sx={{ maxWidth: 240 }} />
      <ListGroup label="Options">
        <SwitchListInput control={control} name="isEnabled" icon="storefront" title="Show in the Shop" />
      </ListGroup>
      <Box>
        <Typography variant="titleSmall" component="div" sx={{ mb: 1.5 }}>
          Contents
        </Typography>
        {/* Each power-up edited in its row: icon (click to change), type and quantity. */}
        <EditTable
          label="Contents"
          minWidth={340}
          reserveRemove
          columns={[
            { header: "Icon", width: "56px" },
            { header: "Power-up", width: "minmax(140px, 1fr)" },
            { header: "Quantity", width: "96px", align: "right" },
          ]}
          rows={fields.map((f, i) => ({
            key: f.id,
            onRemove: () => removeRow(i),
            canRemove: fields.length > 1,
            removeLabel: `Remove ${REWARD_LABELS[contents[i]?.powerupType] ?? "power-up"}`,
            cells: [
              <ImageCell key="i" src={iconOf(i)} label={`${REWARD_LABELS[contents[i]?.powerupType] ?? "Power-up"} icon`} onPick={(file) => setIcon(i, file)} error={missingIcon(i) && formState.isSubmitted} />,
              <SelectCell key="t" control={control} name={`contents.${i}.powerupType`} label="Power-up" options={POWERUP_TYPES.map((t) => ({ value: t, label: REWARD_LABELS[t] }))} />,
              <NumberCell key="q" control={control} name={`contents.${i}.quantity`} label={`${REWARD_LABELS[contents[i]?.powerupType] ?? "Power-up"} quantity`} sx={{ width: 80 }} rules={{ validate: (v) => (v == null || !Number.isInteger(v) || v < 1 ? "1 or more" : true) }} />,
            ],
          }))}
          addLabel="Add power-up"
          addDisabled={fields.length >= POWERUP_TYPES.length}
          onAdd={() => {
            append({ ...NEW_ROW, powerupType: POWERUP_TYPES.find((t) => !types.includes(t)) ?? "BombPowerup" }, { shouldFocus: false });
            setValue("contentIconFiles", [...(getValues("contentIconFiles") ?? []), null], { shouldDirty: true });
          }}
        />
        {problemText && (
          <Typography variant="bodySmall" color="error" component="div" sx={{ mt: 1 }}>
            {problemText}
          </Typography>
        )}
      </Box>
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
        It disappears from the Shop. This can't be undone.
      </ConfirmDelete>
    </SideSheet>
  );
}

export default function PowerupPacksPage() {
  const { m3: c } = useTheme();
  const notify = useNotify();
  const sheet = useSheet();
  const { data, isLoading } = useList({ resource: "PowerupPack", dataProviderName: DP.powerupPacks, pagination: { mode: "off" } });
  const [query, setQuery] = useState("");
  const rows = data?.data ?? [];
  const term = query.trim().toLowerCase();
  // Reordering only makes sense on the full list, so dragging is off while searching.
  const shown = term ? rows.filter((r) => r.title.toLowerCase().includes(term)) : rows;
  const { moving, moveTo } = useReorder({ resource: "PowerupPack", dataProviderName: DP.powerupPacks, rows, toValues: (r, sortOrder) => fullValues(r, { sortOrder }) });
  const drag = useDragSort({ count: rows.length, onMove: moveTo, busy: !!moving });
  const [view, setView] = useState("cards");
  // Switching cards / list animates in; opening the page doesn't.
  const enter = useEnterOnChange(view);
  const { mutate: update } = useUpdate();

  const toggle = (row, isEnabled) =>
    update(
      { resource: "PowerupPack", dataProviderName: DP.powerupPacks, id: row.id, values: fullValues(row, { isEnabled }), successNotification: false },
      { onSuccess: () => notify(`${row.title} ${isEnabled ? "shown in" : "hidden from"} the Shop`), onError: () => notify(`Couldn't update ${row.title}`, { variant: "error" }) },
    );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageToolbar search={<SearchField value={query} onChange={setQuery} placeholder="Search power-up packs" />} actionLabel="New power-up pack" onAction={sheet.openNew}>
        <ViewToggle value={view} onChange={setView} />
      </PageToolbar>
      {isLoading ? (
        view === "cards" ? <CardsSkeleton label="Loading power-up packs" /> : <ContainerCard><RowsSkeleton lead="square" label="Loading power-up packs" /></ContainerCard>
      ) : shown.length === 0 ? (
        <EmptyState icon={term ? "search_off" : "bolt"} title={term ? "No power-up packs match" : "No power-up packs yet"}>
          {!term && (
            <Button color="secondary" startIcon={<Icon name="add" />} onClick={sheet.openNew}>
              New power-up pack
            </Button>
          )}
        </EmptyState>
      ) : view === "cards" ? (
        <CardGrid className={enter}>
          {shown.map((r, i) => (
            <ShopCard
              key={r.id}
              sortable={term ? undefined : drag.item(i)}
              image={packImage(r)}
              icon="bolt"
              title={r.title}
              meta={
                <>
                  <Sparks value={r.sparksPrice} variant="labelLarge" />
                  <Contents contents={r.contents} size={24} />
                </>
              }
              reorder={term ? null : drag.handle(i, r.title)}
              end={<VisibilitySwitch checked={!!r.isEnabled} onChange={(v) => toggle(r, v)} label={r.title} />}
              onOpen={() => sheet.openEdit(r)}
            />
          ))}
        </CardGrid>
      ) : (
        <ContainerCard className={enter}>
          {shown.map((r, i) => (
            <ListRow key={r.id} columns={COLUMNS} sortable={term ? undefined : drag.item(i)} onClick={() => sheet.openEdit(r)}>
              {term ? <span /> : drag.handle(i, r.title)}
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                  <Typography variant="titleMedium" noWrap>
                    {r.title}
                  </Typography>
                </Box>
                <Typography variant="bodySmall" color="text.secondary" noWrap component="div">
                  {r.description || "No description"}
                </Typography>
                <Box sx={{ display: { sm: "none" }, mt: 1 }}>
                  <Contents contents={r.contents} size={24} />
                </Box>
              </Box>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Contents contents={r.contents} />
              </Box>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Sparks value={r.sparksPrice} variant="titleSmall" />
              </Box>
              <VisibilitySwitch checked={!!r.isEnabled} onChange={(v) => toggle(r, v)} label={r.title} />
              <Box sx={{ display: { xs: "none", sm: "block" }, color: c.onSurfaceVariant }}>
                <Icon name="chevron_right" />
              </Box>
            </ListRow>
          ))}
        </ContainerCard>
      )}
      <PackSheet sheet={sheet} />
    </Box>
  );
}
