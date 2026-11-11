// Shop › Swag — physical merch redeemed for sparks: photos, sizes and stock.
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useList, useUpdate } from "@refinedev/core";
import { useNotify } from "../../shell/notifications";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormHelperText from "@mui/material/FormHelperText";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { EmptyState } from "../../ds/EmptyState";
import { PageToolbar } from "../../ds/Page";
import { SearchField } from "../../ds/SearchField";
import { ImageField } from "../../ds/ImageField";
import { SideSheet } from "../../ds/SideSheet";
import { DP } from "../../providers";
import { NumberInput, SwitchListInput, TextInput } from "../streams/detail/fields";
import { ChoiceGroup } from "../../ds/SelectButton";
import { EditTable, NumberCell, SelectCell } from "../../ds/EditTable";
import { ConfirmDelete, useLibraryMutations, useSheet } from "../library/shared";
import { Pill } from "../../ds/Pill";
import { CardGrid, ListRow, ShopCard, Sparks, Thumb, ViewToggle, VisibilitySwitch, useDragSort, useReorder } from "./shared";
import { ContainerCard } from "../../ds/ContainerCard";
import { ListAdd, ListGroup, ListItem, ListSwitch } from "../../ds/ListGroup";
import { ActionMenu } from "../../ds/ActionMenu";
import { useEnterOnChange } from "../../ds/useEnterOnChange";
import { CardsSkeleton, RowsSkeleton } from "../../ds/Skeletons";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const MAX_PHOTOS = 8;
const QTY_MAX = 100000;

const isSoldOut = (q) => q != null && Number.isFinite(Number(q)) && Number(q) <= 0;
const finiteOrNull = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const qtyRule = { validate: (v) => (v == null ? true : !Number.isInteger(v) ? "Whole number" : v < 0 ? "Can't be negative" : v > QTY_MAX ? `Max ${QTY_MAX.toLocaleString()}` : true) };

// ---------------------------------------------------------------- payloads (same rules as the API expects)
const imagesPayload = (images) => (images ?? []).filter((i) => i.file instanceof File || !!i.url).map((i) => (i.file instanceof File ? { file: i.file } : { url: i.url }));
const variantsPayload = (variants) => (variants ?? []).map((v) => ({ label: v.label, quantity: finiteOrNull(v.quantity), isAvailable: v.isAvailable }));
const createPayload = (v) => ({
  title: v.title.trim(),
  description: v.description ?? "",
  sparksPrice: v.sparksPrice,
  isEnabled: v.isEnabled,
  isSuperSavvyOnly: v.isSuperSavvyOnly,
  variantType: v.variantType,
  quantity: v.variantType === "Size" ? null : finiteOrNull(v.quantity),
  variants: v.variantType === "Size" ? variantsPayload(v.variants) : [],
  images: imagesPayload(v.images),
});
const anyDirty = (d) => (Array.isArray(d) ? d.some((x) => Object.values(x ?? {}).some(Boolean)) : !!d);
// Edits send only what changed (PATCH).
function editPayload(v, dirty) {
  const r = {};
  if (dirty.title) r.title = v.title.trim();
  if (dirty.description) r.description = v.description ?? "";
  if (dirty.sparksPrice) r.sparksPrice = v.sparksPrice;
  if (dirty.isEnabled) r.isEnabled = v.isEnabled;
  if (dirty.isSuperSavvyOnly) r.isSuperSavvyOnly = v.isSuperSavvyOnly;
  if (dirty.variantType) r.variantType = v.variantType;
  if (v.variantType === "None" && (dirty.quantity || dirty.variantType)) r.quantity = finiteOrNull(v.quantity);
  if (v.variantType === "Size" && (dirty.variantType || anyDirty(dirty.variants))) r.variants = variantsPayload(v.variants);
  if (anyDirty(dirty.images) || (v.images ?? []).some((i) => i.file instanceof File)) r.images = imagesPayload(v.images);
  return r;
}

const EMPTY = { title: "", description: "", sparksPrice: null, isEnabled: true, isSuperSavvyOnly: false, variantType: "None", quantity: null, variants: [], images: [{ url: "", file: null }] };
const toForm = (r) => ({
  title: r.title,
  description: r.description ?? "",
  sparksPrice: r.sparksPrice,
  isEnabled: r.isEnabled,
  isSuperSavvyOnly: r.isSuperSavvyOnly,
  variantType: r.variantType ?? "None",
  quantity: r.quantity ?? null,
  variants: (r.variants ?? []).map((v) => ({ label: v.label, quantity: v.quantity ?? null, isAvailable: v.isAvailable })),
  images: (r.imageUrls ?? []).map((url) => ({ url, file: null })),
});

// ---------------------------------------------------------------- stock
const LOW_STOCK = 5;
/** Whether stock is counted: one size has a quantity, or any size does. */
const tracksStock = (item) => (item.variantType === "Size" ? (item.variants ?? []).some((v) => v.quantity != null) : item.quantity != null);
/** The one thing to flag on a card: sold out, or running low (only when stock is counted). */
function stockFlag(item) {
  if (item.variantType === "Size") {
    const open = (item.variants ?? []).filter((v) => v.isAvailable && !isSoldOut(v.quantity));
    if (!item.variants?.length || open.length === 0) return { tone: "error", label: "Sold out" };
    const low = open.filter((v) => v.quantity != null && v.quantity <= LOW_STOCK);
    return low.length ? { tone: "warning", label: `Low: ${low.map((v) => v.label).join(", ")}` } : null;
  }
  if (isSoldOut(item.quantity)) return { tone: "error", label: "Sold out" };
  if (item.quantity != null && item.quantity <= LOW_STOCK) return { tone: "warning", label: `${item.quantity} left` };
  return null;
}

// ---------------------------------------------------------------- card
function StockLine({ item }) {
  if (item.variantType === "Size") {
    if (!item.variants?.length) return <span>No sizes</span>;
    return (
      <Box component="span" sx={{ display: "inline-flex", gap: 0.75 }}>
        {item.variants.map((v) => {
          const ok = v.isAvailable && !isSoldOut(v.quantity);
          return (
            <Tooltip key={v.label} title={!v.isAvailable ? "Off" : isSoldOut(v.quantity) ? "Sold out" : v.quantity == null ? "Stock not counted" : `${v.quantity} left`}>
              <Box component="span" sx={{ textDecoration: ok ? "none" : "line-through", color: ok ? "text.primary" : "text.secondary", typography: "labelMedium" }}>
                {v.label}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    );
  }
  return <span>One size{item.quantity != null && !isSoldOut(item.quantity) ? ` · ${item.quantity} left` : ""}</span>;
}

/** A swag item as a Shop card: its main photo, price, sizes and what to watch (stock, hidden). */
function SwagCard({ item, sortable, handle, onOpen, onToggle }) {
  const flag = stockFlag(item);
  return (
    <ShopCard
      sortable={sortable}
      image={item.imageUrls?.[0] ?? item.imageUrl}
      icon="checkroom"
      title={item.title}
      // Price and sizes on one line, so every card keeps the same height.
      meta={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, color: "text.secondary", typography: "bodySmall" }}>
          <Box sx={{ color: "text.primary", flexShrink: 0 }}>
            <Sparks value={item.sparksPrice} variant="labelLarge" />
          </Box>
          <span aria-hidden>·</span>
          <Box sx={{ minWidth: 0, overflow: "hidden", whiteSpace: "nowrap" }}>
            <StockLine item={item} />
          </Box>
        </Box>
      }
      end={<VisibilitySwitch checked={!!item.isEnabled} onChange={onToggle} label={item.title} />}
      pills={
        (flag || item.isSuperSavvyOnly) && (
          <>
            {flag && <Pill tone={flag.tone}>{flag.label}</Pill>}
            {item.isSuperSavvyOnly && <Pill tone="primary">Super Savvy only</Pill>}
          </>
        )
      }
      reorder={handle}
      onOpen={onOpen}
    />
  );
}

const LIST_COLUMNS = { xs: "40px 48px minmax(0,1fr) auto", sm: "40px 48px minmax(0,1.4fr) minmax(0,1fr) 90px 24px" };

/** A swag item as a list row: photo, title and pills, sizes and stock, price. */
function SwagRow({ item, sortable, handle, onOpen }) {
  const { m3: c } = useTheme();
  const flag = stockFlag(item);
  return (
    <ListRow columns={LIST_COLUMNS} sortable={sortable} onClick={onOpen}>
      {handle}
      <Thumb src={item.imageUrls?.[0] ?? item.imageUrl} icon="checkroom" />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="titleMedium" noWrap>
          {item.title}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.25 }}>
          {flag && <Pill tone={flag.tone}>{flag.label}</Pill>}
          {!item.isEnabled && <Pill>Hidden</Pill>}
          {item.isSuperSavvyOnly && <Pill tone="primary">Super Savvy only</Pill>}
        </Box>
      </Box>
      <Typography variant="bodySmall" color="text.secondary" component="div" sx={{ display: { xs: "none", sm: "block" } }}>
        <StockLine item={item} />
      </Typography>
      <Sparks value={item.sparksPrice} variant="titleSmall" />
      <Box sx={{ display: { xs: "none", sm: "block" }, color: c.onSurfaceVariant }}>
        <Icon name="chevron_right" />
      </Box>
    </ListRow>
  );
}

// ---------------------------------------------------------------- orders of an item
/** The item's orders as one row (count, still to ship), opening them in Orders. */
function ItemOrders({ item }) {
  const navigate = useNavigate();
  const { m3: c } = useTheme();
  // Orders only carry the item's title, so match on it.
  const { data, isLoading } = useList({ resource: "SwagOrder", dataProviderName: DP.swagOrders, pagination: { current: 1, pageSize: 1000 }, filters: [{ field: "searchTerm", operator: "contains", value: item.title }] });
  const orders = (data?.data ?? []).filter((o) => o.itemTitle === item.title);
  const toShip = orders.filter((o) => !o.deliveredAt).length;
  return (
    <ListGroup label="Orders">
      <ListItem
        onClick={() => navigate(`/swag-orders?status=all&q=${encodeURIComponent(item.title)}`)}
        leading={<Icon name="local_shipping" style={{ color: c.onSurfaceVariant }} />}
        title={isLoading ? "Orders" : `${orders.length} ${orders.length === 1 ? "order" : "orders"}`}
        supporting={isLoading ? null : toShip ? `${toShip} still to ship` : "All shipped"}
        trailing={<Icon name="chevron_right" style={{ color: c.onSurfaceVariant }} />}
      />
    </ListGroup>
  );
}

// ---------------------------------------------------------------- editor
const stockRule = (tracking) => ({ validate: (v) => (!tracking ? true : v == null ? "Enter the stock" : qtyRule.validate(v)) });

/**
 * One sheet for a swag item, laid out like every other editor: photos first, then title,
 * description and price, the shop options, stock, and (for an existing item) its orders.
 */
function SwagSheet({ sheet }) {
  const isNew = sheet.open && !sheet.record?.id;
  const { save, destroy, saving } = useLibraryMutations({ resource: "SwagItem", dataProviderName: DP.savvySwag, noun: "Swag item" });
  const [confirm, setConfirm] = useState(false);
  const [tracking, setTracking] = useState(false);
  const { control, reset, handleSubmit, setValue, getValues, trigger, setError, formState } = useForm({ defaultValues: EMPTY });
  const photos = useFieldArray({ control, name: "images" });
  const photoDrag = useDragSort({ count: photos.fields.length, onMove: (from, to) => photos.move(from, to) });
  const sizes = useFieldArray({ control, name: "variants" });
  const images = useWatch({ control, name: "images" }) ?? [];
  const variants = useWatch({ control, name: "variants" }) ?? [];
  const variantType = useWatch({ control, name: "variantType" });
  // Once a saved item counts stock, the API can't stop counting it: the switch locks on.
  const locked = !isNew && !!sheet.record && tracksStock(sheet.record);

  useEffect(() => {
    if (!sheet.open) return;
    reset(sheet.record?.id ? toForm(sheet.record) : EMPTY);
    setTracking(!!sheet.record?.id && tracksStock(sheet.record));
  }, [sheet.open, sheet.record, reset]);

  const emptyPhoto = (i) => !(images[i]?.file instanceof File) && !images[i]?.url;
  const labels = variants.map((v) => v?.label);
  const dupSize = (i) => labels.filter((l) => l === labels[i]).length > 1;
  const noSizes = variantType === "Size" && variants.length === 0;
  const blocked = images.length === 0 || images.some((_, i) => emptyPhoto(i)) || labels.some((_, i) => dupSize(i)) || noSizes;

  const blankSize = () => ({ label: SIZES.find((s) => !labels.includes(s)) ?? "XS", quantity: tracking ? 0 : null, isAvailable: true });
  const newSize = () => {
    sizes.append(blankSize(), { shouldFocus: false });
  };
  const setTrack = (on) => {
    setTracking(on);
    // Off: nothing is counted (null). On: counting starts from 0 until a number is entered.
    if (variantType === "Size") variants.forEach((v, i) => setValue(`variants.${i}.quantity`, on ? (v.quantity ?? 0) : null, { shouldDirty: true }));
    else setValue("quantity", on ? (getValues("quantity") ?? 0) : null, { shouldDirty: true });
  };

  const submit = handleSubmit(async (v) => {
    if (blocked) return;
    const values = isNew ? createPayload(v) : editPayload(v, formState.dirtyFields);
    if (await save(isNew ? null : sheet.record.id, values, (k, e) => setError(k[0].toLowerCase() + k.slice(1), e))) sheet.close();
  });

  return (
    <SideSheet
      open={sheet.open}
      onClose={sheet.close}
      dirty={formState.isDirty}
      title={isNew ? "New swag item" : sheet.record?.title}
      subtitle={isNew ? undefined : "Swag"}
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
            {isNew ? "Add swag item" : "Save"}
          </Button>
        </>
      }
    >
      <Box>
        <Typography variant="labelLarge" color="text.secondary" component="div" sx={{ mb: 1 }}>
          Photos · up to {MAX_PHOTOS}, the first is shown in the Shop
        </Typography>
        <ListGroup label="Photos">
          {photos.fields.map((f, i) => (
            <ListItem
              key={f.id}
              sortable={photoDrag.item(i)}
              leadingControl={photoDrag.handle(i, `photo ${i + 1}`)}
              leading={<ImageField compact={56} label={`Photo ${i + 1}`} value={images[i]?.url} width={1024} height={1024} onChange={(file) => setValue(`images.${i}.file`, file, { shouldDirty: true })} />}
              title={i === 0 ? "Main photo" : `Photo ${i + 1}`}
              supporting={emptyPhoto(i) ? "Tap the tile to add a photo" : "1024 × 1024 px"}
              error={emptyPhoto(i) && formState.isSubmitted ? "Add a photo or remove this one" : null}
              trailing={
                <ActionMenu
                  label={`Actions for photo ${i + 1}`}
                  items={[
                    { label: "Remove", icon: "delete", tone: "error", onClick: () => photos.remove(i), hidden: photos.fields.length <= 1 },
                  ]}
                />
              }
            />
          ))}
          {photos.fields.length < MAX_PHOTOS && <ListAdd label="Add photo" onClick={() => photos.append({ url: "", file: null })} />}
        </ListGroup>
      </Box>

      <TextInput control={control} name="title" label="Title" rules={{ validate: (v) => (v?.trim() ? true : "Enter a title") }} />
      <TextInput control={control} name="description" label="Description" multiline minRows={2} max={500} rules={{ maxLength: { value: 500, message: "Use 500 characters or fewer" } }} />
      <NumberInput control={control} name="sparksPrice" label="Price" suffix="sparks" inputProps={{ min: 1, step: 1 }} rules={{ validate: (v) => (v == null ? "Required" : !Number.isInteger(v) || v < 1 ? "Use a whole number, 1 or more" : true) }} sx={{ maxWidth: 240 }} />

      <ListGroup label="Options">
        <SwitchListInput control={control} name="isEnabled" icon="storefront" title="Show in the Shop" />
        <SwitchListInput control={control} name="isSuperSavvyOnly" icon="workspace_premium" title="Super Savvy only" />
      </ListGroup>

      <Controller
        name="variantType"
        control={control}
        render={({ field }) => (
          <ChoiceGroup
            label="Stock"
            value={field.value}
            options={[
              { value: "None", label: "One size" },
              { value: "Size", label: "Sizes" },
            ]}
            onChange={(v) => {
              field.onChange(v);
              if (v === "Size") {
                setValue("quantity", null);
                if (variants.length === 0) sizes.append(blankSize());
              }
            }}
          />
        )}
      />
      <ListGroup label="Stock">
        <ListSwitch
          icon="inventory_2"
          title="Count stock"
          supporting={locked ? "On for good: once stock is counted, it can't be switched off" : tracking ? "Goes down by 1 with each order; at 0 it's sold out" : "Off: never sells out"}
          checked={tracking}
          disabled={locked}
          onChange={setTrack}
        />
        {variantType !== "Size" && tracking && (
          <ListItem>
            <NumberInput control={control} name="quantity" label="In stock" inputProps={{ min: 0, max: QTY_MAX, step: 1 }} rules={stockRule(true)} sx={{ maxWidth: 240 }} />
          </ListItem>
        )}
      </ListGroup>
      {variantType === "Size" && (
        <EditTable
          label="Sizes"
          columns={[
            { header: "Size", width: "minmax(96px, 1fr)" },
            { header: "In stock", width: "minmax(120px, 1fr)", align: "right" },
            { header: "On sale", width: "80px", align: "center" },
          ]}
          minWidth={340}
          rows={sizes.fields.map((f, i) => {
            const v = variants[i] ?? {};
            const soldOut = isSoldOut(v.quantity);
            return {
              key: f.id,
              onRemove: () => sizes.remove(i),
              canRemove: sizes.fields.length > 1,
              removeLabel: `Remove size ${v.label}`,
              cells: [
                <SelectCell key="s" control={control} name={`variants.${i}.label`} label={dupSize(i) ? `Size ${v.label} (duplicate)` : "Size"} options={SIZES.filter((x) => x === v.label || !labels.includes(x)).map((x) => ({ value: x, label: x }))} />,
                tracking ? (
                  <NumberCell key="q" control={control} name={`variants.${i}.quantity`} label={`Size ${v.label} in stock`} rules={stockRule(true)} sx={{ width: 96 }} />
                ) : (
                  <Typography key="q" variant="bodyLarge" color="text.secondary" sx={{ px: 1 }}>
                    Not counted
                  </Typography>
                ),
                <Controller
                  key="a"
                  name={`variants.${i}.isAvailable`}
                  control={control}
                  render={({ field }) => (
                    <Tooltip title={soldOut ? "Sold out" : field.value ? "On sale" : "Off"}>
                      <span>
                        <Switch checked={!soldOut && !!field.value} disabled={soldOut} onChange={(e) => field.onChange(e.target.checked)} inputProps={{ "aria-label": `Size ${v.label} on sale` }} />
                      </span>
                    </Tooltip>
                  )}
                />,
              ],
            };
          })}
          addLabel="Add size"
          addDisabled={sizes.fields.length >= SIZES.length}
          onAdd={newSize}
        />
      )}
      {noSizes && <FormHelperText error>Add at least one size, or switch to One size.</FormHelperText>}

      {!isNew && sheet.record && <ItemOrders item={sheet.record} />}

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
        It disappears from the Shop. Existing orders aren't affected. This can't be undone.
      </ConfirmDelete>
    </SideSheet>
  );
}

// ---------------------------------------------------------------- page
export default function SwagPage() {
  const sheet = useSheet();
  const [view, setView] = useState("cards");
  // Switching cards / list animates in; opening the page doesn't.
  const enter = useEnterOnChange(view);
  const { data, isLoading } = useList({ resource: "SwagItem", dataProviderName: DP.savvySwag, pagination: { mode: "off" } });
  const [query, setQuery] = useState("");
  const rows = data?.data ?? [];
  const term = query.trim().toLowerCase();
  // Reordering only makes sense on the full list, so dragging is off while searching.
  const shown = term ? rows.filter((r) => r.title.toLowerCase().includes(term)) : rows;
  const { moving, moveTo } = useReorder({ resource: "SwagItem", dataProviderName: DP.savvySwag, rows, toValues: (_, sortOrder) => ({ sortOrder }) });
  const drag = useDragSort({ count: rows.length, onMove: moveTo, busy: !!moving });
  const notify = useNotify();
  const { mutate: update } = useUpdate();
  // The card's switch, like the packs': shows or hides the item in the Shop (PATCH isEnabled).
  const toggle = (row, isEnabled) =>
    update(
      { resource: "SwagItem", dataProviderName: DP.savvySwag, id: row.id, values: { isEnabled }, successNotification: false },
      { onSuccess: () => notify(`${row.title} ${isEnabled ? "shown in" : "hidden from"} the Shop`), onError: () => notify(`Couldn't update ${row.title}`, { variant: "error" }) },
    );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageToolbar search={<SearchField value={query} onChange={setQuery} placeholder="Search swag" />} actionLabel="New swag item" onAction={sheet.openNew}>
        <ViewToggle value={view} onChange={setView} />
      </PageToolbar>
      {isLoading ? (
        view === "cards" ? <CardsSkeleton label="Loading swag" /> : <ContainerCard><RowsSkeleton lead="square" label="Loading swag" /></ContainerCard>
      ) : shown.length === 0 ? (
        <EmptyState icon={term ? "search_off" : "checkroom"} title={term ? "No swag matches" : "No swag yet"}>
          {!term && (
            <Button color="secondary" startIcon={<Icon name="add" />} onClick={sheet.openNew}>
              New swag item
            </Button>
          )}
        </EmptyState>
      ) : view === "cards" ? (
        <CardGrid className={enter}>
          {shown.map((r, i) => (
            <SwagCard key={r.id} item={r} sortable={term ? undefined : drag.item(i)} handle={term ? null : drag.handle(i, r.title)} onOpen={() => sheet.openEdit(r)} onToggle={(v) => toggle(r, v)} />
          ))}
        </CardGrid>
      ) : (
        <ContainerCard className={enter}>
          {shown.map((r, i) => (
            <SwagRow key={r.id} item={r} sortable={term ? undefined : drag.item(i)} handle={term ? <span /> : drag.handle(i, r.title)} onOpen={() => sheet.openEdit(r)} />
          ))}
        </ContainerCard>
      )}
      <SwagSheet sheet={sheet} />
    </Box>
  );
}
