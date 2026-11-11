// Shop › Spark packs — in-app purchases that grant sparks, in Shop order.
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useList, useUpdate } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormHelperText from "@mui/material/FormHelperText";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { EmptyState } from "../../ds/EmptyState";
import { PageToolbar } from "../../ds/Page";
import { SearchField } from "../../ds/SearchField";
import { ImageField } from "../../ds/ImageField";
import { SideSheet } from "../../ds/SideSheet";
import { useNotify } from "../../shell/notifications";
import { DP } from "../../providers";
import { useTimezoneFormat } from "../../contexts";
import { NumberInput, SwitchListInput, TextInput } from "../streams/detail/fields";
import { ListGroup } from "../../ds/ListGroup";
import { ConfirmDelete, useLibraryMutations, useSheet } from "../library/shared";
import { CardGrid, ListRow, ShopCard, Sparks, Thumb, ViewToggle, VisibilitySwitch, useDragSort, useReorder } from "./shared";
import { ContainerCard } from "../../ds/ContainerCard";
import { useEnterOnChange } from "../../ds/useEnterOnChange";
import { CardsSkeleton, RowsSkeleton } from "../../ds/Skeletons";

const mono = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" };
const COLUMNS = { xs: "40px 48px minmax(0,1fr) auto", sm: "40px 48px minmax(0,1fr) 140px 52px 24px" };
const EMPTY = { sparksGranted: null, rcProductId: "", isEnabled: true, iconUrl: null, iconFile: null };

function PackSheet({ sheet }) {
  const isNew = sheet.open && !sheet.record?.id;
  const { save, destroy, saving } = useLibraryMutations({ resource: "SparkPack", dataProviderName: DP.shop, noun: "Spark pack" });
  const [confirm, setConfirm] = useState(false);
  const { control, reset, handleSubmit, setValue, setError, formState } = useForm({ defaultValues: EMPTY });
  const iconUrl = useWatch({ control, name: "iconUrl" });
  const iconFile = useWatch({ control, name: "iconFile" });

  useEffect(() => {
    if (sheet.open) reset({ ...EMPTY, ...sheet.record, rcProductId: sheet.record?.id ?? "", iconFile: null });
  }, [sheet.open, sheet.record, reset]);

  // Spark pack validation errors come back as ValidationErrors with capitalised keys; Id is the product id.
  const setServerError = (field, err) => setError(field === "Id" ? "rcProductId" : field[0].toLowerCase() + field.slice(1), err);

  const submit = handleSubmit(async (v) => {
    if (isNew && !v.iconFile) return;
    const values = isNew
      ? { sparksGranted: v.sparksGranted, rcProductId: v.rcProductId.trim(), isEnabled: v.isEnabled, sortOrder: 1, iconFile: v.iconFile }
      : { sparksGranted: v.sparksGranted, isEnabled: v.isEnabled, ...(v.iconFile ? { iconFile: v.iconFile } : {}) };
    if (await save(isNew ? null : sheet.record.id, values, setServerError)) sheet.close();
  });

  return (
    <SideSheet
      open={sheet.open}
      onClose={sheet.close}
      dirty={formState.isDirty}
      title={isNew ? "New spark pack" : `${Number(sheet.record?.sparksGranted ?? 0).toLocaleString()} Sparks`}
      subtitle={isNew ? undefined : "Spark pack"}
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
            {isNew ? "Add spark pack" : "Save"}
          </Button>
        </>
      }
    >
      <Box>
        <ImageField label="Icon" value={iconUrl} width={256} height={256} onChange={(f) => setValue("iconFile", f, { shouldDirty: true })} />
        {formState.isSubmitted && isNew && !iconFile && <FormHelperText error>Add an icon</FormHelperText>}
      </Box>
      <NumberInput control={control} name="sparksGranted" label="Sparks granted" suffix="sparks" inputProps={{ min: 1, step: 1 }} rules={{ validate: (v) => (v == null ? "Required" : !Number.isInteger(v) || v < 1 ? "Use a whole number, 1 or more" : true) }} sx={{ maxWidth: 240 }} />
      {isNew ? (
        <TextInput control={control} name="rcProductId" label="RevenueCat product ID" rules={{ required: "Enter the product ID" }} helperText="Must match the product in RevenueCat. Can't be changed later." slotProps={{ htmlInput: { spellCheck: false, style: mono } }} />
      ) : (
        <Box>
          <Typography variant="labelLarge" color="text.secondary" component="div">
            RevenueCat product ID
          </Typography>
          <Typography variant="bodyMedium" sx={mono}>
            {sheet.record?.id}
          </Typography>
        </Box>
      )}
      <ListGroup label="Options">
        <SwitchListInput control={control} name="isEnabled" icon="storefront" title="Show in the Shop" />
      </ListGroup>
      <ConfirmDelete
        open={confirm}
        title={`Delete ${Number(sheet.record?.sparksGranted ?? 0).toLocaleString()} Sparks?`}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          await destroy(sheet.record.id, `${Number(sheet.record.sparksGranted).toLocaleString()} Sparks`);
          sheet.close();
        }}
      >
        It disappears from the Shop. Purchases already made aren't affected. This can't be undone.
      </ConfirmDelete>
    </SideSheet>
  );
}

export default function SparkPacksPage() {
  const { m3: c } = useTheme();
  const { formatDate } = useTimezoneFormat();
  const notify = useNotify();
  const sheet = useSheet();
  const { data, isLoading } = useList({ resource: "SparkPack", dataProviderName: DP.shop, pagination: { current: 1, pageSize: 100 } });
  const [query, setQuery] = useState("");
  const rows = data?.data ?? [];
  const term = query.trim().toLowerCase();
  // Packs have no title: match the Sparks amount or the product ID. Dragging is off while searching.
  const shown = term ? rows.filter((r) => `${r.sparksGranted} ${r.id}`.toLowerCase().includes(term)) : rows;
  const { moving, moveTo } = useReorder({ resource: "SparkPack", dataProviderName: DP.shop, rows, toValues: (_, sortOrder) => ({ sortOrder }) });
  const drag = useDragSort({ count: rows.length, onMove: moveTo, busy: !!moving });
  const [view, setView] = useState("cards");
  // Switching cards / list animates in; opening the page doesn't.
  const enter = useEnterOnChange(view);
  const { mutate: update } = useUpdate();

  const toggle = (row, isEnabled) =>
    update(
      { resource: "SparkPack", dataProviderName: DP.shop, id: row.id, values: { isEnabled }, successNotification: false },
      {
        onSuccess: () => notify(`${Number(row.sparksGranted).toLocaleString()} Sparks ${isEnabled ? "shown in" : "hidden from"} the Shop`),
        onError: () => notify(`Couldn't update ${Number(row.sparksGranted).toLocaleString()} Sparks`, { variant: "error" }),
      },
    );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageToolbar search={<SearchField value={query} onChange={setQuery} placeholder="Search spark packs" />} actionLabel="New spark pack" onAction={sheet.openNew}>
        <ViewToggle value={view} onChange={setView} />
      </PageToolbar>
      {isLoading ? (
        view === "cards" ? <CardsSkeleton label="Loading spark packs" /> : <ContainerCard><RowsSkeleton lead="square" label="Loading spark packs" /></ContainerCard>
      ) : shown.length === 0 ? (
        <EmptyState icon={term ? "search_off" : "auto_awesome"} title={term ? "No spark packs match" : "No spark packs yet"}>
          {!term && (
            <Button color="secondary" startIcon={<Icon name="add" />} onClick={sheet.openNew}>
              New spark pack
            </Button>
          )}
        </EmptyState>
      ) : view === "cards" ? (
        <CardGrid className={enter}>
          {shown.map((r, i) => (
            <ShopCard
              key={r.id}
              sortable={term ? undefined : drag.item(i)}
              image={r.iconUrl}
              icon="auto_awesome"
              title={<Sparks value={r.sparksGranted} variant="titleSmall" iconSize={16} />}
              meta={
                <Typography variant="bodySmall" color="text.secondary" noWrap component="div" sx={mono}>
                  {r.id}
                </Typography>
              }
              reorder={term ? null : drag.handle(i, `${r.sparksGranted} sparks pack`)}
              end={<VisibilitySwitch checked={!!r.isEnabled} onChange={(v) => toggle(r, v)} label={`${r.sparksGranted} sparks pack`} />}
              onOpen={() => sheet.openEdit(r)}
            />
          ))}
        </CardGrid>
      ) : (
        <ContainerCard className={enter}>
          {shown.map((r, i) => (
            <ListRow key={r.id} columns={COLUMNS} sortable={term ? undefined : drag.item(i)} onClick={() => sheet.openEdit(r)}>
              {term ? <span /> : drag.handle(i, `${r.sparksGranted} sparks pack`)}
              <Thumb src={r.iconUrl} icon="auto_awesome" />
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Sparks value={r.sparksGranted} variant="titleMedium" iconSize={18} />
                </Box>
                <Typography variant="bodySmall" color="text.secondary" noWrap component="div" sx={mono}>
                  {r.id}
                </Typography>
              </Box>
              <Typography variant="bodySmall" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
                {r.editedAt ? `Updated ${formatDate(r.editedAt, "MMM D, YYYY")}` : ""}
              </Typography>
              <VisibilitySwitch checked={!!r.isEnabled} onChange={(v) => toggle(r, v)} label={`${r.sparksGranted} sparks pack`} />
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
