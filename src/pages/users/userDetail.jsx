// Users › user — profile, inventory, role and cash wins of one account, in a side sheet over the user list.
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useCustom, useCustomMutation, useInvalidate, useList } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { EditTable, NumberCell } from "../../ds/EditTable";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { EmptyState } from "../../ds/EmptyState";
import { SideSheet } from "../../ds/SideSheet";
import { SheetSection } from "../shop/shared";
import { useNotify } from "../../shell/notifications";
import { DP } from "../../providers";
import { ChoiceInput, TextInput } from "../streams/detail/fields";
import { ACCOUNT_STATUS, ROLES, UserAvatar, flag, isBot, money, regionName } from "./shared";
import { CashoutRow, useCashoutActions } from "./cashouts";
import { ConfirmDialog } from "../../ds/ConfirmDialog";
import { radius } from "../../theme/tokens";
import { RowsSkeleton } from "../../ds/Skeletons";


const POWERUPS = [
  { id: 2, label: "Letter Bomb" },
  { id: 7, label: "Better Bomb" },
  { id: 8, label: "Greenie" },
  { id: 5, label: "Magniflyer" },
];

const RESTRICTED = ["admin", "root", "moderator", "host"];
const usernameRule = {
  validate: (v) => {
    if (!v) return "Enter a username";
    if (v.length < 3 || v.length > 16) return "Use 3–16 characters";
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(v)) return "Start with a letter; use letters, numbers and underscores";
    if (v.endsWith("_")) return "Can't end with an underscore";
    if (v.includes("__")) return "No double underscores";
    const word = RESTRICTED.find((w) => v.includes(w));
    return word ? `Can't contain “${word}”` : true;
  },
};

const mono = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", wordBreak: "break-all" };

function CopyButton({ label, value }) {
  const notify = useNotify();
  return (
    <Tooltip title="Copy">
      <IconButton
        size="small"
        aria-label={`Copy ${label}`}
        onClick={async () => {
          await navigator.clipboard?.writeText(value);
          notify(`${label} copied`);
        }}
      >
        <Icon name="content_copy" size={16} />
      </IconButton>
    </Tooltip>
  );
}

function Fact({ label, children }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="labelLarge" color="text.secondary" component="div">
        {label}
      </Typography>
      <Typography variant="bodyLarge" component="div">
        {children}
      </Typography>
    </Box>
  );
}

/** The account's role (its own endpoint): the saved value and a way to change it. */
function useUserRole(userId) {
  const { data, isLoading, refetch } = useCustom({ url: `/UserRole/${userId}/getUserClaims`, method: "get", dataProviderName: DP.userRoles });
  const { mutateAsync } = useCustomMutation();
  const invalidate = useInvalidate();
  const apply = async (next) => {
    const path = next ? `prmoteUserTo${next}` : "clearUserRole";
    await mutateAsync({ url: `/UserRole/${userId}/${path}`, method: "post", values: {}, dataProviderName: DP.userRoles, successNotification: false });
    await refetch();
    // The Hosts library is the accounts with the Host role.
    invalidate({ resource: "Host", dataProviderName: DP.hosts, invalidates: ["list", "detail"] });
  };
  return { role: data?.data?.role ?? "", isLoading, apply };
}

/** Role picker, a field of Access; like every other field it's applied with Save. */
function RoleField({ userId, value, isLoading, onChange }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="labelLarge" color="text.secondary" component="div">
        Role
      </Typography>
      {isLoading ? (
        <Skeleton variant="rounded" height={40} width={360} sx={{ borderRadius: radius("sm") }} />
      ) : (
        <Box>
          <ToggleButtonGroup
            exclusive
            value={value}
            onChange={(_, v) => v !== null && onChange(v)}
            aria-label="Role"
            sx={{ width: { xs: "100%", sm: "auto" }, "& .MuiToggleButton-root": { flex: { xs: 1, sm: "none" }, px: { xs: 1, sm: 2 } }, "& .material-symbols-rounded": { display: { xs: "none", sm: "inline-block" } } }}
          >
            {ROLES.map((r) => (
              <ToggleButton key={r.label} value={r.value}>
                <Icon name={r.icon} size={16} />
                {r.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}
      {value === "Host" && (
        <Box>
          <Button variant="text" component={Link} to={`/hosts?edit=${encodeURIComponent(userId)}`} endIcon={<Icon name="arrow_forward" />} sx={{ ml: -1.5 }}>
            Host profile
          </Button>
        </Box>
      )}
    </Box>
  );
}

/** A read-only fact: label and value on one line, plain text (nothing to click or type). */
function InfoRow({ label, children }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, minHeight: 36, "&:not(:last-of-type)": { borderBottom: 1, borderColor: "divider" } }}>
      <Typography variant="bodyMedium" color="text.secondary" sx={{ flex: "0 0 112px" }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>{children}</Box>
    </Box>
  );
}

function CashoutsSection({ user }) {
  const { m3: c } = useTheme();
  const actions = useCashoutActions();
  const { data, isLoading } = useList({
    resource: "AccountBalanceManagement",
    dataProviderName: DP.cashWins,
    pagination: { current: 1, pageSize: 100 },
    filters: [{ field: "SearchTerm", operator: "contains", value: user.id }],
  });
  const rows = [...(data?.data ?? [])].filter((r) => r.userId === user.id).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const sum = (status) => rows.filter((r) => r.status === status).reduce((s, r) => s + Number(r.amount || 0), 0);
  return (
    <SheetSection title="Cash wins">
      {isLoading ? (
        <RowsSkeleton count={2} lead={false} label="Loading cash wins" />
      ) : rows.length === 0 ? (
        <Typography variant="bodySmall" color="text.secondary">
          No cash wins yet.
        </Typography>
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Fact label="Paid out">{money(sum("Approved"))}</Fact>
            <Fact label="Pending">{money(sum("InProgress"))}</Fact>
          </Box>
          <Box sx={{ borderTop: `1px solid ${c.outlineVariant}` }}>
            {rows.map((r) => (
              <CashoutRow key={r.id} row={r} showUser={false} actions={actions} />
            ))}
          </Box>
        </>
      )}
      {actions.confirmDialog}
    </SheetSection>
  );
}

/**
 * One account in a side sheet over the user list (route /user-management/:id). `id` null closes
 * it; the last account stays in the sheet while it slides out.
 */
export function UserSheet({ id, onClose }) {
  const [shown, setShown] = useState(id);
  useEffect(() => {
    if (id) setShown(id);
  }, [id]);
  return shown ? <UserSheetBody key={shown} id={shown} open={!!id} onClose={onClose} /> : null;
}

function UserSheetBody({ id, open, onClose }) {
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const {
    refineCore: { query, onFinish },
    control,
    reset,
    handleSubmit,
    setError,
    trigger,
    formState: { isDirty },
  } = useForm({
    refineCoreProps: {
      resource: "UserManagement",
      dataProviderName: DP.userManagement,
      id,
      action: "edit",
      redirect: false,
      successNotification: () => ({ message: "User saved", type: "success" }),
      errorNotification: false,
      onMutationError: (err) => setError("username", { message: err?.response?.data?.detail ?? "Couldn't save" }),
    },
  });
  const user = query?.data?.data;
  const notify = useNotify();
  const roles = useUserRole(id);
  // Unsaved role (null: unchanged). Making someone an admin is confirmed on save.
  const [roleDraft, setRoleDraft] = useState(null);
  const [confirmAdmin, setConfirmAdmin] = useState(false);
  const roleChanged = roleDraft !== null && roleDraft !== roles.role;
  const dirty = isDirty || roleChanged;
  const discard = () => {
    reset();
    setRoleDraft(null);
  };

  useEffect(() => {
    if (!user) return;
    reset({ ...user, powerups: POWERUPS.map((p) => user.powerups?.find((x) => x.powerupId === p.id) ?? { powerupId: p.id, count: 0 }) });
    setLoaded(true);
  }, [user, reset]);
  useEffect(() => {
    if (user && open) document.title = `${isBot(user.id) ? "Bot" : user.username} · Users · Savvy Admin`;
  }, [user, open]);

  const save = async (confirmed = false) => {
    if (!(await trigger())) {
      notify("Some fields need attention", { variant: "error" });
      return;
    }
    if (roleChanged && roleDraft === "Admin" && !confirmed) {
      setConfirmAdmin(true);
      return;
    }
    setSaving(true);
    try {
      if (isDirty) await handleSubmit((v) => onFinish(v))();
      if (roleChanged) {
        await roles.apply(roleDraft);
        setRoleDraft(null);
        if (!isDirty) notify("User saved");
      }
    } catch {
      notify("Couldn't save the user", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const name = user ? (isBot(user.id) ? "Bot" : user.username) : "User";
  const failed = query?.isError;

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      dirty={dirty}
      title={
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1.5, maxWidth: "100%" }}>
          {user && <UserAvatar user={user} size={32} />}
          <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {name}
          </Box>
        </Box>
      }
      subtitle={user && ([user.phoneNumber, user.regionCode && `${flag(user.regionCode)} ${regionName(user.regionCode)}`].filter(Boolean).join(" · ") || user.id)}
      actions={
        <>
          {/* Like every sheet: Cancel closes without saving. */}
          <Button
            variant="text"
            onClick={() => {
              discard();
              onClose();
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={() => save()} disabled={!dirty || saving || !user}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      {failed ? (
        <EmptyState compact icon="person_off" title="Couldn't load this user" description={query.error?.response?.data?.detail ?? query.error?.message} />
      ) : !user || !loaded ? (
        <RowsSkeleton count={6} lead={false} trailing={false} label="Loading user" />
      ) : (
      <>
        {/* Who they are, what they may do, what they have, what they've won; then the read-only facts. */}
        <SheetSection title="Profile">
          <TextInput control={control} name="username" label="Username" rules={usernameRule} helperText="3–16 characters. Letters, numbers and underscores." />
        </SheetSection>

        <SheetSection title="Access">
          <ChoiceInput control={control} name="userAccountStatus" label="Account status" options={ACCOUNT_STATUS.map((s) => ({ value: s.value, label: s.label }))} helperText="Banned players can't sign in; chat-banned players can play but not chat." />
          <RoleField userId={user.id} value={roleDraft ?? roles.role} isLoading={roles.isLoading} onChange={setRoleDraft} />
        </SheetSection>

        <SheetSection title="Inventory">
          {/* Sparks and power-ups as one table, each count edited in its cell (like rewards). */}
          <EditTable
            label="Inventory"
            header={false}
            minWidth={300}
            columns={[
              { header: "Item", width: "1fr" },
              { header: "Amount", width: "160px", align: "right" },
            ]}
            rows={[{ key: "sparks", label: "Sparks", name: "sparks" }, ...POWERUPS.map((p, i) => ({ key: p.id, label: p.label, name: `powerups.${i}.count` }))].map((r) => ({
              key: r.key,
              cells: [
                <Typography key="l" variant="bodyMedium" sx={{ fontWeight: 500 }}>
                  {r.label}
                </Typography>,
                <NumberCell key="v" control={control} name={r.name} label={`${r.label} amount`} sx={{ width: 140 }} rules={{ validate: (v) => (v == null || v < 0 || !Number.isInteger(v) ? "Use a whole number, 0 or more" : true) }} />,
              ],
            }))}
          />
        </SheetSection>

        <CashoutsSection user={user} />

        <SheetSection title="Details">
          {/* Read-only facts as plain label / value lines, so they never read as fields or buttons. */}
          <Box>
            <InfoRow label="User ID">
              <Typography variant="bodySmall" noWrap sx={{ ...mono, wordBreak: "normal" }}>
                {user.id}
              </Typography>
              <CopyButton label="User ID" value={user.id} />
            </InfoRow>
            <InfoRow label="Total score">
              <Typography variant="bodyMedium" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {(user.totalScore ?? 0).toLocaleString()}
              </Typography>
            </InfoRow>
          </Box>
        </SheetSection>
      </>
      )}
      <ConfirmDialog
        open={confirmAdmin}
        title={`Make ${name} an admin?`}
        tone="error"
        confirmLabel="Make admin"
        onCancel={() => setConfirmAdmin(false)}
        onConfirm={() => {
          setConfirmAdmin(false);
          save(true);
        }}
      >
        Admins have full access to this dashboard, including other users and payouts.
      </ConfirmDialog>
    </SideSheet>
  );
}
