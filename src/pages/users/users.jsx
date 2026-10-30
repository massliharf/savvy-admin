// Users › All users — searchable, filterable account list with bulk status changes.
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { UserSheet } from "./userDetail";
import { useList, useUpdateMany } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { PageToolbar } from "../../ds/Page";
import { ScopeToggle } from "../../ds/ScopeToggle";
import { MenuFilterChip } from "../../ds/MenuFilterChip";
import { EmptyState } from "../../ds/EmptyState";
import { SearchField, useDebounced } from "../../ds/SearchField";
import { useNotify } from "../../shell/notifications";
import { DP } from "../../providers";
import { ACCOUNT_STATUS, AccountStatusPill, Pager, REGIONS, UserAvatar, flag, isBot } from "./shared";
import { ConfirmDialog } from "../../ds/ConfirmDialog";
import { ContainerCard } from "../../ds/ContainerCard";
import { RowsSkeleton } from "../../ds/Skeletons";

const COLUMNS = { xs: "40px minmax(0,1fr) 24px", md: "40px minmax(0,2fr) minmax(0,1.2fr) minmax(0,1fr) 90px 120px 24px" };

function UserRow({ user, selected, onToggle, onOpen }) {
  const { m3: c } = useTheme();
  return (
    <ButtonBase
      component="div"
      role="row"
      onClick={onOpen}
      sx={{
        display: "grid",
        gridTemplateColumns: COLUMNS,
        alignItems: "center",
        columnGap: 2,
        width: "100%",
        px: 2,
        minHeight: 64,
        textAlign: "left",
        bgcolor: selected ? c.secondaryContainer : "transparent",
        "&:hover": { bgcolor: selected ? c.secondaryContainer : "action.hover" },
        "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: -2 },
        "&:not(:last-of-type)": { borderBottom: `1px solid ${c.outlineVariant}` },
      }}
    >
      <Checkbox
        checked={selected}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={onToggle}
        inputProps={{ "aria-label": `Select ${user.username}` }}
        sx={{ ml: -1 }}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <UserAvatar user={user} />
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="titleSmall" noWrap>
              {isBot(user.id) ? "Bot" : user.username}
            </Typography>
            <Box sx={{ display: { md: "none" } }}>
              <AccountStatusPill value={user.userAccountStatus} />
            </Box>
          </Box>
          <Typography variant="bodySmall" color="text.secondary" noWrap component="div" sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            {user.id}
          </Typography>
        </Box>
      </Box>
      <Typography variant="bodyMedium" noWrap sx={{ display: { xs: "none", md: "block" } }} color={user.phoneNumber ? "text.primary" : "text.secondary"}>
        {user.phoneNumber ?? "—"}
      </Typography>
      <Typography variant="bodyMedium" noWrap sx={{ display: { xs: "none", md: "block" } }} color={user.regionCode ? "text.primary" : "text.secondary"}>
        {user.regionCode ? `${flag(user.regionCode)} ${user.regionCode}` : "—"}
      </Typography>
      <Typography variant="bodyMedium" sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5 }}>
        <Icon name="auto_awesome" size={16} style={{ color: c.tertiary }} />
        {(user.sparks ?? 0).toLocaleString()}
      </Typography>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <AccountStatusPill value={user.userAccountStatus} />
      </Box>
      <Icon name="chevron_right" style={{ color: c.onSurfaceVariant }} />
    </ButtonBase>
  );
}

export default function UsersPage() {
  const navigate = useNavigate();
  // /user-management/:id opens that user in a sheet; the list, search and filters stay put.
  const { id: openId } = useParams();
  const notify = useNotify();
  const { m3: c } = useTheme();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);
  const [region, setRegion] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState([]);
  const [confirmBan, setConfirmBan] = useState(false);
  const term = useDebounced(search.trim());

  useEffect(() => {
    setPage(1);
    setSelected([]);
  }, [term, status, region, pageSize]);

  const filters = useMemo(
    () => [
      ...(term ? [{ field: "SearchTerm", operator: "contains", value: term }] : []),
      ...(status ? [{ field: "UserAccountStatus", operator: "eq", value: status }] : []),
      ...(region ? [{ field: "RegionCode", operator: "eq", value: region.code }] : []),
    ],
    [term, status, region],
  );
  const { data, isLoading, isFetching, isPreviousData } = useList({
    resource: "UserManagement",
    dataProviderName: DP.userManagement,
    pagination: { current: page, pageSize },
    filters,
  });
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  const { mutate: updateMany, isPending } = useUpdateMany();
  const bulk = (name) => {
    const count = selected.length;
    updateMany(
      { resource: "UserManagement", dataProviderName: DP.userManagement, ids: selected, values: { UserAccountStatus: name }, successNotification: false },
      {
        onSuccess: () => {
          setSelected([]);
          const label = ACCOUNT_STATUS.find((s) => s.name === name).label.toLowerCase();
          notify(`${count} ${count === 1 ? "user" : "users"} ${label}`);
        },
        onError: () => notify(`Couldn't update ${count === 1 ? "the user" : "the users"}`, { variant: "error" }),
      },
    );
  };

  const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const toggleAll = () => setSelected(allOnPage ? [] : rows.map((r) => r.id));
  const filtered = !!(term || status || region);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <PageToolbar search={<SearchField value={search} onChange={setSearch} placeholder="Username, phone or user ID" />}>
          <ScopeToggle label="Account status" value={status} options={ACCOUNT_STATUS.map((s) => ({ value: s.value, label: s.label }))} onChange={setStatus} />
          <MenuFilterChip
            label="Region"
            single
            searchable
            options={REGIONS.map((r) => ({ id: r.code, label: `${flag(r.code)} ${r.name}` }))}
            selected={region ? [region.code] : []}
            onToggle={(code) => setRegion(region?.code === code ? null : REGIONS.find((r) => r.code === code))}
            onClear={() => setRegion(null)}
          />
        </PageToolbar>
      </Box>

      <ContainerCard sx={{ position: "relative" }}>
        {/* Only while a new page or filter loads (the old rows stay up), not on background refreshes. */}
        {isFetching && isPreviousData && <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: 0 }} />}
        {selected.length > 0 ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, minHeight: 44, bgcolor: c.secondaryContainer, color: c.onSecondaryContainer, flexWrap: "wrap" }}>
            <Tooltip title="Clear selection">
              <IconButton aria-label="Clear selection" onClick={() => setSelected([])} sx={{ color: "inherit", ml: -1 }}>
                <Icon name="close" />
              </IconButton>
            </Tooltip>
            <Typography variant="titleSmall" sx={{ flex: 1 }}>
              {selected.length} selected
            </Typography>
            <Button variant="tonal" size="small" disabled={isPending} onClick={() => bulk("Active")} startIcon={<Icon name="check_circle" />}>
              Activate
            </Button>
            <Button variant="tonal" size="small" disabled={isPending} onClick={() => bulk("Reserved")} startIcon={<Icon name="pause_circle" />}>
              Deactivate
            </Button>
            <Button variant="tonal" size="small" color="error" disabled={isPending} onClick={() => setConfirmBan(true)} startIcon={<Icon name="block" />}>
              Ban
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: COLUMNS, alignItems: "center", columnGap: 2, px: 2, minHeight: 48, borderBottom: `1px solid ${c.outlineVariant}`, typography: "labelLarge", color: "text.secondary" }}>
            <Checkbox checked={allOnPage} indeterminate={!allOnPage && rows.some((r) => selected.includes(r.id))} onChange={toggleAll} inputProps={{ "aria-label": "Select all on this page" }} sx={{ ml: -1 }} />
            <span>User</span>
            <span>Phone</span>
            <span>Region</span>
            <span>Sparks</span>
            <span>Status</span>
            <span />
          </Box>
        )}
        {isLoading ? (
          <RowsSkeleton count={8} lead="circle" height={64} label="Loading users" />
        ) : rows.length === 0 ? (
          <EmptyState icon="person_search" title="No users match" />
        ) : (
          <Box role="rowgroup">
            {rows.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                selected={selected.includes(u.id)}
                onToggle={() => setSelected((s) => (s.includes(u.id) ? s.filter((x) => x !== u.id) : [...s, u.id]))}
                onOpen={() => navigate(`/user-management/${u.id}`)}
              />
            ))}
          </Box>
        )}
        <Box sx={{ borderTop: `1px solid ${c.outlineVariant}` }}>
          <Pager page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={setPageSize} />
        </Box>
      </ContainerCard>

      <ConfirmDialog
        open={confirmBan}
        title={`Ban ${selected.length} ${selected.length === 1 ? "user" : "users"}?`}
        tone="error"
        confirmLabel="Ban"
        onCancel={() => setConfirmBan(false)}
        onConfirm={() => {
          setConfirmBan(false);
          bulk("Banned");
        }}
      >
        Banned users can't sign in or play. You can activate them again later.
      </ConfirmDialog>
      <UserSheet id={openId ?? null} onClose={() => navigate("/user-management")} />
    </Box>
  );
}
