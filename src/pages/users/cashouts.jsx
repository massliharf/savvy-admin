// Users › Cashouts — cash win payout requests, worked as a queue (pending first).
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useList, useMany, useUpdate } from "@refinedev/core";
import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { StatCard } from "../../ds/StatCard";
import { ScopeToggle } from "../../ds/ScopeToggle";
import { PageToolbar } from "../../ds/Page";
import { SearchField, useDebounced } from "../../ds/SearchField";
import { EmptyState } from "../../ds/EmptyState";
import { useTimezoneFormat } from "../../contexts";
import { useNotify } from "../../shell/notifications";
import { DP } from "../../providers";
import { CASH_STATUS, CashStatusPill, Pager, UserAvatar, cashStatus, isBot, money } from "./shared";
import { ConfirmDialog } from "../../ds/ConfirmDialog";
import { ActionMenu } from "../../ds/ActionMenu";
import { ContainerCard } from "../../ds/ContainerCard";
import { RowsSkeleton } from "../../ds/Skeletons";

/** Status changes for one cashout, with snackbars and a confirm step for declines. */
export function useCashoutActions() {
  const notify = useNotify();
  const { mutateAsync, isPending } = useUpdate();
  const [declining, setDeclining] = useState(null);
  const setStatus = async (row, status) => {
    const previous = row.status;
    await mutateAsync({
      resource: "AccountBalanceManagement",
      dataProviderName: DP.cashWins,
      id: row.id,
      values: { status, userId: row.userId },
      successNotification: false,
    });
    notify(`${money(row.amount)} cashout ${cashStatus(status).label.toLowerCase()}`, {
      actionLabel: "Undo",
      onAction: () => mutateAsync({ resource: "AccountBalanceManagement", dataProviderName: DP.cashWins, id: row.id, values: { status: previous, userId: row.userId }, successNotification: false }),
    });
  };
  const confirmDialog = (
    <ConfirmDialog
      open={!!declining}
      title={`Decline ${declining ? money(declining.amount) : ""} cashout?`}
      tone="error"
      confirmLabel="Decline"
      onCancel={() => setDeclining(null)}
      onConfirm={() => {
        const row = declining;
        setDeclining(null);
        setStatus(row, "Declined");
      }}
    >
      The player won't be paid for this cash win.
    </ConfirmDialog>
  );
  return { setStatus, askDecline: setDeclining, busy: isPending, confirmDialog };
}

function MoreMenu({ row, onStatus }) {
  const icons = { InProgress: "hourglass_empty", Approved: "check_circle", Declined: "block" };
  return (
    <ActionMenu
      items={CASH_STATUS.filter((s) => s.name !== row.status && s.name !== "Expired").map((s) => ({ label: `Mark as ${s.label.toLowerCase()}`, icon: icons[s.name], onClick: () => onStatus(s.name) }))}
    />
  );
}

/** One cashout. `user` adds the player column (omitted on the user's own page). */
export function CashoutRow({ row, user, showUser = true, actions }) {
  const { m3: c } = useTheme();
  const { formatDate } = useTimezoneFormat();
  const pending = row.status === "InProgress";
  return (
    <Box
      sx={{
        display: "grid",
        // Fixed action column, so the status lines up whether or not a row has Decline / Approve.
        gridTemplateColumns: showUser ? { xs: "1fr", md: "88px minmax(0,1.6fr) minmax(0,1fr) 96px 196px" } : { xs: "1fr", md: "88px minmax(0,1fr) 96px 196px" },
        alignItems: "center",
        columnGap: 2,
        rowGap: 1,
        px: 2,
        py: 1.5,
        "&:not(:last-of-type)": { borderBottom: `1px solid ${c.border}` },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Typography variant="titleMedium" sx={{ fontVariantNumeric: "tabular-nums" }}>
          {money(row.amount)}
        </Typography>
        <Box sx={{ display: { md: "none" } }}>
          <CashStatusPill value={row.status} />
        </Box>
      </Box>
      {showUser && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, order: { xs: 3, md: 0 } }}>
          <UserAvatar user={user ?? { id: row.userId }} size={32} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="titleSmall" noWrap component={Link} to={`/user-management/${row.userId}`} sx={{ display: "block", color: "inherit", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
              {isBot(row.userId) ? "Bot" : user?.username ?? "Loading…"}
            </Typography>
            <Typography variant="bodySmall" color="text.secondary" noWrap component="div">
              {user?.phoneNumber ?? row.userId}
            </Typography>
          </Box>
        </Box>
      )}
      {/* Date over time, like the user column's name over phone, so rows keep one height. */}
      <Box sx={{ order: { xs: 4, md: 0 }, minWidth: 0 }}>
        <Typography variant="bodyMedium" component="div" noWrap>
          {formatDate(row.date, "MMM D, YYYY")}
        </Typography>
        <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
          {formatDate(row.date, "h:mm A")}
        </Typography>
      </Box>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <CashStatusPill value={row.status} />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "flex-end", order: { xs: 5, md: 0 }, mr: { xs: -1, md: 0 } }}>
        {pending && (
          <>
            <Button variant="outlined" size="small" disabled={actions.busy} onClick={() => actions.askDecline(row)}>
              Decline
            </Button>
            <Button size="small" disabled={actions.busy} onClick={() => actions.setStatus(row, "Approved")}>
              Approve
            </Button>
          </>
        )}
        <MoreMenu row={row} onStatus={(s) => (s === "Declined" ? actions.askDecline(row) : actions.setStatus(row, s))} />
      </Box>
    </Box>
  );
}

export default function CashoutsPage() {
  const { m3: c } = useTheme();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("InProgress");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const actions = useCashoutActions();

  const term = useDebounced(search.trim());

  useEffect(() => setPage(1), [term, status, pageSize]);

  const filters = useMemo(
    () => [{ field: "SearchTerm", operator: "contains", value: term }, ...(status ? [{ field: "AccountbalanceHistoryStatus", operator: "eq", value: cashStatus(status).index }] : [])],
    [term, status],
  );
  const { data, isLoading, isFetching, isPreviousData } = useList({ resource: "AccountBalanceManagement", dataProviderName: DP.cashWins, pagination: { current: page, pageSize }, filters });
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  // Pending totals for the summary (one wide request; the backend has no aggregate endpoint).
  const { data: pendingAll, isLoading: pendingLoading } = useList({
    resource: "AccountBalanceManagement",
    dataProviderName: DP.cashWins,
    pagination: { current: 1, pageSize: 1000 },
    filters: [{ field: "AccountbalanceHistoryStatus", operator: "eq", value: 0 }],
  });
  const pendingCount = pendingAll?.total ?? 0;
  const pendingSum = (pendingAll?.data ?? []).reduce((s, r) => s + Number(r.amount || 0), 0);

  const ids = [...new Set(rows.map((r) => r.userId).filter(Boolean))];
  const { data: users } = useMany({ resource: "UserManagement/users", dataProviderName: DP.userProfiles, ids, queryOptions: { enabled: ids.length > 0 } });
  const userById = Object.fromEntries((users?.data ?? []).map((u) => [u.id, u]));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(2, minmax(0, 240px))" }, gap: 2 }}>
        {/* While the totals load, a placeholder instead of a misleading 0. */}
        <StatCard label="Waiting for review" value={pendingLoading ? <Skeleton width={40} /> : pendingCount} emphasized />
        <StatCard label="Pending amount" value={pendingLoading ? <Skeleton width={72} /> : money(pendingSum)} />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <PageToolbar search={<SearchField value={search} onChange={setSearch} placeholder="User ID or cashout ID" />}>
          <ScopeToggle label="Cashout status" value={status} options={CASH_STATUS.map((s) => ({ value: s.name, label: s.label }))} onChange={setStatus} />
        </PageToolbar>
      </Box>

      <ContainerCard sx={{ position: "relative" }}>
        {/* Only while a new page or filter loads (the old rows stay up), not on background refreshes. */}
        {isFetching && isPreviousData && <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: 0 }} />}
        {isLoading ? (
          <RowsSkeleton count={7} lead="circle" height={64} label="Loading cashouts" />
        ) : rows.length === 0 ? (
          <EmptyState icon={status === "InProgress" && !term ? "task_alt" : "payments"} title={status === "InProgress" && !term ? "All caught up" : "No cashouts here"} />
        ) : (
          rows.map((r) => <CashoutRow key={r.id} row={r} user={userById[r.userId]} actions={actions} />)
        )}
        <Box sx={{ borderTop: `1px solid ${c.outlineVariant}` }}>
          <Pager page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={setPageSize} />
        </Box>
      </ContainerCard>
      {actions.confirmDialog}
    </Box>
  );
}
