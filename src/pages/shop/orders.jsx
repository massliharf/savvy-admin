// Shop › Orders — swag redemptions to ship; outstanding first.
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useDataProvider, useList, useMany, useUpdate } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { DateRangeChip } from "../../ds/DateRangeChip";
import { Icon } from "../../ds/Icon";
import { PageToolbar } from "../../ds/Page";
import { ScopeToggle } from "../../ds/ScopeToggle";
import { EmptyState } from "../../ds/EmptyState";
import { SearchField, useDebounced } from "../../ds/SearchField";
import { useTimezoneFormat } from "../../contexts";
import { useNotify } from "../../shell/notifications";
import { DP, downloadBlob } from "../../providers";
import { Pager } from "../users/shared";
import { Pill } from "../../ds/Pill";
import { InfoRow, SheetSection, Sparks, Thumb } from "./shared";
import { SideSheet } from "../../ds/SideSheet";
import { flag, regionName } from "../users/shared";
import { ConfirmDialog } from "../../ds/ConfirmDialog";
import { ActionMenu } from "../../ds/ActionMenu";
import { ContainerCard } from "../../ds/ContainerCard";
import { RowsSkeleton } from "../../ds/Skeletons";

const TRACKING_MAX = 40;
function trackingError(raw) {
  const v = raw.trim();
  if (!v) return "Enter the USPS tracking number";
  if (!/^[A-Za-z0-9 -]+$/.test(v)) return "Only letters, digits, spaces and hyphens";
  if (v.length > TRACKING_MAX) return `At most ${TRACKING_MAX} characters`;
  return null;
}

// Order status for the toolbar's status toggle (All shows every order).
const STATUS = [
  { id: "false", label: "Outstanding" },
  { id: "true", label: "Delivered" },
];
const mono = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" };

function OrderRow({ order, user, onOpen, onDeliver, onReopen }) {
  const { m3: c } = useTheme();
  const { formatDate } = useTimezoneFormat();
  const notify = useNotify();
  const a = order.shippingAddress;
  const delivered = !!order.deliveredAt;
  return (
    <ButtonBase
      component="div"
      onClick={() => onOpen(order)}
      aria-label={`Open ${order.orderNumber}`}
      sx={{
        display: "grid",
        width: "100%",
        textAlign: "left",
        "&:hover": { bgcolor: "action.hover" },
        "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: -2 },
        // Phones: stacked next to the thumbnail. Medium: item | buyer over address | action.
        // Wide: one column each.
        gridTemplateColumns: { xs: "56px minmax(0,1fr)", md: "56px minmax(0,1fr) minmax(0,1.2fr) 150px", lg: "56px minmax(0,1.3fr) minmax(0,1fr) minmax(0,1.4fr) 160px" },
        columnGap: 2,
        rowGap: 1.5,
        alignItems: "start",
        px: 2,
        py: 1.5,
        "&:not(:last-of-type)": { borderBottom: `1px solid ${c.outlineVariant}` },
      }}
    >
      <Thumb src={order.itemImageUrl} size={56} icon="checkroom" />
      <Box sx={{ minWidth: 0, gridColumn: { md: "2", lg: "auto" }, gridRow: { md: "1 / span 2", lg: "auto" } }}>
        <Typography variant="titleMedium" noWrap>
          {order.itemTitle}
        </Typography>
        <Typography variant="bodySmall" color="text.secondary" component="div">
          {order.variantLabel || "One size"}
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          <Sparks value={order.sparksSpent} variant="labelMedium" iconSize={14} />
        </Box>
      </Box>
      <Box sx={{ minWidth: 0, gridColumn: { xs: "2", md: "3", lg: "auto" }, gridRow: { md: "1", lg: "auto" } }}>
        <Typography variant="labelLarge" noWrap component={Link} to={`/user-management/${order.userId}`} onClick={stop} onMouseDown={stop} sx={{ display: "block", color: "inherit", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
          {user?.username ?? "Player"}
        </Typography>
        <Typography variant="bodySmall" color="text.secondary" component="div">
          {formatDate(order.placedAt, "MMM D, YYYY · h:mm A")}
        </Typography>
        <Typography variant="bodySmall" color="text.secondary" component="div" sx={mono}>
          {order.orderNumber}
        </Typography>
      </Box>
      <Box sx={{ minWidth: 0, gridColumn: { xs: "2", md: "3", lg: "auto" }, gridRow: { md: "2", lg: "auto" }, typography: "bodySmall", color: "text.secondary" }}>
        {a ? (
          <>
            <Typography variant="bodyMedium" color="text.primary" component="div">
              {a.recipientName}
            </Typography>
            <div>
              {a.streetAddress}, {a.city}, {a.state} {a.postcode}
            </div>
            <div>{a.email}</div>
          </>
        ) : (
          "No address"
        )}
      </Box>
      <Box onClick={stop} onMouseDown={stop} sx={{ gridColumn: { xs: "2", md: "4", lg: "auto" }, gridRow: { md: "1 / span 2", lg: "auto" }, display: "flex", flexDirection: "column", alignItems: { xs: "flex-start", md: "flex-end" }, gap: 0.5 }}>
        {delivered ? (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Pill tone="success">Delivered</Pill>
              <ActionMenu label={`More for ${order.orderNumber}`} items={[{ label: "Reopen order", icon: "undo", onClick: () => onReopen(order) }]} />
            </Box>
            <Typography variant="bodySmall" color="text.secondary">
              {formatDate(order.deliveredAt, "MMM D, YYYY")}
            </Typography>
            {order.trackingNumber && (
              <Tooltip title="Copy tracking number">
                <Box
                  component="button"
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard?.writeText(order.trackingNumber);
                    notify("Tracking number copied");
                  }}
                  sx={{ all: "unset", cursor: "pointer", typography: "bodySmall", ...mono, color: (t) => t.m3.primaryText, maxWidth: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", "&:hover": { textDecoration: "underline" }, "&:focus-visible": { outline: `2px solid ${c.focus}` } }}
                >
                  {order.trackingNumber}
                </Box>
              </Tooltip>
            )}
          </>
        ) : (
          <Button size="small" startIcon={<Icon name="local_shipping" />} onClick={() => onDeliver(order)}>
            Mark delivered
          </Button>
        )}
      </Box>
    </ButtonBase>
  );
}


const stop = (e) => e.stopPropagation();
const addressText = (a) => [a.recipientName, a.streetAddress, `${a.city}, ${a.state} ${a.postcode}`, a.email].filter(Boolean).join("\n");

/** Everything about one order: item, player, address, shipping, with its actions. */
function OrderSheet({ order, user, onClose, onDeliver, onReopen }) {
  const { formatDate } = useTimezoneFormat();
  const notify = useNotify();
  const a = order?.shippingAddress;
  const delivered = !!order?.deliveredAt;
  const copy = async (text, what) => {
    await navigator.clipboard?.writeText(text);
    notify(`${what} copied`);
  };
  return (
    <SideSheet
      open={!!order}
      onClose={onClose}
      title={order?.orderNumber}
      subtitle={order ? `Placed ${formatDate(order.placedAt, "MMM D, YYYY · h:mm A")}` : undefined}
      footerStart={delivered && <Button variant="text" startIcon={<Icon name="undo" />} onClick={() => onReopen(order)}>Reopen order</Button>}
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            Close
          </Button>
          {order && !delivered && (
            <Button startIcon={<Icon name="local_shipping" />} onClick={() => onDeliver(order)}>
              Mark delivered
            </Button>
          )}
        </>
      }
    >
      {order && (
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Thumb src={order.itemImageUrl} size={72} icon="checkroom" />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="titleMedium">{order.itemTitle}</Typography>
              <Typography variant="bodyMedium" color="text.secondary">
                {order.variantLabel ? `Size ${order.variantLabel}` : "One size"}
              </Typography>
              <Sparks value={order.sparksSpent} variant="labelLarge" />
            </Box>
            <Pill tone={delivered ? "success" : "warning"}>{delivered ? "Delivered" : "Outstanding"}</Pill>
          </Box>

          <SheetSection title="Shipping">
            <InfoRow label="Placed">{formatDate(order.placedAt, "MMM D, YYYY · h:mm A")}</InfoRow>
            <InfoRow label="Delivered">{delivered ? formatDate(order.deliveredAt, "MMM D, YYYY · h:mm A") : "Not shipped yet"}</InfoRow>
            <InfoRow label="USPS tracking" mono={!!order.trackingNumber}>
              {order.trackingNumber ? (
                <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                  {order.trackingNumber}
                  <Tooltip title="Copy tracking number">
                    <IconButton size="small" aria-label="Copy tracking number" onClick={() => copy(order.trackingNumber, "Tracking number")}>
                      <Icon name="content_copy" size={18} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                "—"
              )}
            </InfoRow>
          </SheetSection>

          <SheetSection
            title="Ship to"
            action={
              a && (
                <Button variant="tonal" size="small" startIcon={<Icon name="content_copy" />} onClick={() => copy(addressText(a), "Address")}>
                  Copy
                </Button>
              )
            }
          >
            {a ? (
              <>
                <InfoRow label="Recipient">{a.recipientName}</InfoRow>
                <InfoRow label="Address">
                  {a.streetAddress}
                  <br />
                  {a.city}, {a.state} {a.postcode}
                </InfoRow>
                <InfoRow label="Email">{a.email}</InfoRow>
              </>
            ) : (
              <Typography variant="bodyMedium" color="text.secondary">
                No address on this order.
              </Typography>
            )}
          </SheetSection>

          <SheetSection
            title="Player"
            action={
              <Button variant="tonal" size="small" component={Link} to={`/user-management/${order.userId}`} endIcon={<Icon name="arrow_forward" />}>
                Open user
              </Button>
            }
          >
            <InfoRow label="Username">{user?.username ?? "Player"}</InfoRow>
            <InfoRow label="Region">{user?.regionCode ? `${flag(user.regionCode)} ${regionName(user.regionCode)}` : null}</InfoRow>
            <InfoRow label="Phone">{user?.phoneNumber}</InfoRow>
            <InfoRow label="User ID" mono>
              {order.userId}
            </InfoRow>
          </SheetSection>
        </>
      )}
    </SideSheet>
  );
}

export default function OrdersPage() {
  const { m3: c } = useTheme();
  const notify = useNotify();
  const { timezone } = useTimezoneFormat();
  const provider = useDataProvider()(DP.swagOrders);
  // `?q=` and `?status=all` come from an item's "All orders" link.
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState(params.get("status") === "all" ? "" : "false");
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [delivering, setDelivering] = useState(null);
  const [tracking, setTracking] = useState("");
  const [touched, setTouched] = useState(false);
  const [reopening, setReopening] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [openId, setOpenId] = useState(null);
  const term = useDebounced(search.trim());
  const { mutateAsync: update, isPending } = useUpdate();

  useEffect(() => setPage(1), [term, status, from, to, pageSize]);

  const filters = useMemo(
    () => [
      { field: "searchTerm", operator: "contains", value: term },
      { field: "fromDate", operator: "gte", value: from?.isValid() ? from.format("YYYY-MM-DD") : "" },
      { field: "toDate", operator: "lte", value: to?.isValid() ? to.format("YYYY-MM-DD") : "" },
      { field: "isDelivered", operator: "eq", value: status },
    ],
    [term, from, to, status],
  );
  const { data, isLoading, isFetching, isPreviousData } = useList({ resource: "SwagOrder", dataProviderName: DP.swagOrders, pagination: { current: page, pageSize }, filters });
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const ids = [...new Set(rows.map((r) => r.userId).filter(Boolean))];
  const { data: users } = useMany({ resource: "UserManagement/users", dataProviderName: DP.userProfiles, ids, queryOptions: { enabled: ids.length > 0 } });
  const userById = Object.fromEntries((users?.data ?? []).map((u) => [u.id, u]));
  const filtered = !!(term || from || to || status);
  // Kept by order number so the sheet follows the row after it's delivered or reopened.
  const opened = rows.find((r) => r.orderNumber === openId) ?? null;

  const exportCsv = async () => {
    const qs = filters
      .filter((f) => f.value || f.field === "searchTerm")
      .map((f) => `${f.field}=${encodeURIComponent(f.field === "toDate" ? `${f.value}T23:59:59.999Z` : f.value)}`)
      .join("&");
    setExporting(true);
    try {
      const res = await provider.custom({ url: `/admin/swag-orders/export?${qs}`, method: "get", meta: { responseType: "blob" } });
      downloadBlob(res.data.blob, res.data.filename);
      notify(`${res.data.filename} downloaded`);
    } catch {
      notify("Couldn't export orders", { variant: "error" });
    } finally {
      setExporting(false);
    }
  };

  const deliver = async () => {
    const order = delivering;
    setDelivering(null);
    try {
      await update({ resource: "SwagOrder", dataProviderName: DP.swagOrders, id: order.orderNumber, values: { userId: order.userId, isDelivered: true, trackingNumber: tracking.trim() }, successNotification: false, errorNotification: false });
      notify(`${order.orderNumber} marked delivered`);
    } catch {
      notify("Couldn't mark the order delivered", { variant: "error" });
    }
  };
  const reopen = async () => {
    const order = reopening;
    setReopening(null);
    try {
      await update({ resource: "SwagOrder", dataProviderName: DP.swagOrders, id: order.orderNumber, values: { userId: order.userId, isDelivered: false }, successNotification: false, errorNotification: false });
      notify(`${order.orderNumber} reopened`);
    } catch {
      notify("Couldn't reopen the order", { variant: "error" });
    }
  };

  const error = trackingError(tracking);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Like Users and Cashouts: the search, then the status and date as chips underneath. */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <PageToolbar
          search={<SearchField value={search} onChange={setSearch} placeholder="Order number, recipient or item" />}
          secondary={[{ label: exporting ? "Exporting…" : "Export CSV", icon: "download", onClick: exportCsv, disabled: exporting }]}
        >
          <ScopeToggle label="Order status" value={status || null} options={STATUS.map((o) => ({ value: o.id, label: o.label }))} onChange={(v) => setStatus(v ?? "")} />
          <DateRangeChip
            label="Order date"
            from={from}
            to={to}
            timezone={timezone}
            onChange={(r) => {
              setFrom(r.from);
              setTo(r.to);
            }}
          />
        </PageToolbar>
      </Box>

      <ContainerCard sx={{ position: "relative" }}>
        {/* Only while a new page or filter loads (the old rows stay up), not on background refreshes. */}
        {isFetching && isPreviousData && <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: 0 }} />}
        {isLoading ? (
          <RowsSkeleton count={6} lead="square" height={88} label="Loading orders" />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={status === "false" && !term && !from && !to ? "task_alt" : "inventory_2"}
            title={status === "false" && !term && !from && !to ? "Nothing to ship" : "No orders match"}
          />
        ) : (
          rows.map((o) => <OrderRow key={o.orderNumber} order={o} user={userById[o.userId]} onOpen={(ord) => setOpenId(ord.orderNumber)} onDeliver={(ord) => { setDelivering(ord); setTracking(""); setTouched(false); }} onReopen={setReopening} />)
        )}
        <Box sx={{ borderTop: `1px solid ${c.outlineVariant}` }}>
          <Pager page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={setPageSize} />
        </Box>
      </ContainerCard>

      <OrderSheet
        order={opened}
        user={opened ? userById[opened.userId] : null}
        onClose={() => setOpenId(null)}
        onDeliver={(ord) => {
          setDelivering(ord);
          setTracking("");
          setTouched(false);
        }}
        onReopen={setReopening}
      />

      <Dialog open={!!delivering} onClose={() => setDelivering(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Mark {delivering?.orderNumber} delivered</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <DialogContentText component="div">
            {delivering?.itemTitle}
            {delivering?.variantLabel ? ` · Size ${delivering.variantLabel}` : ""}
            <br />
            To {delivering?.shippingAddress ? `${delivering.shippingAddress.recipientName}, ${delivering.shippingAddress.city}` : "the player"}
          </DialogContentText>
          <TextField
            label="USPS tracking number"
            required
            placeholder="9400 1118 9922 3197 4284 90"
            autoFocus
            value={tracking}
            onChange={(e) => {
              setTracking(e.target.value);
              setTouched(true);
            }}
            error={touched && !!error}
            helperText={touched && error ? error : "Required to mark it delivered. Letters, digits, spaces and hyphens."}
            slotProps={{ htmlInput: { style: mono, spellCheck: false } }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setDelivering(null)}>
            Cancel
          </Button>
          <Button onClick={deliver} disabled={!!error || isPending}>
            Mark delivered
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!reopening} title={`Reopen ${reopening?.orderNumber}?`} confirmLabel="Reopen" onCancel={() => setReopening(null)} onConfirm={reopen}>
        It goes back to Outstanding as if it never shipped, and its tracking number is cleared.
      </ConfirmDialog>
    </Box>
  );
}
