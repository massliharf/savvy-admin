// Settings › Team — the people who can sign in to this dashboard and their role (Admin, Internal,
// Host: a Savvy account's roles, minus Player). Admins invite people, change roles and remove
// people; everyone else sees the list. Only admins see words without the words password.
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { Pill } from "../../ds/Pill";
import { Banner } from "../../ds/Banner";
import { EmptyState } from "../../ds/EmptyState";
import { ContainerCard } from "../../ds/ContainerCard";
import { FORM_WIDTH, PageToolbar } from "../../ds/Page";
import { SearchField } from "../../ds/SearchField";
import { SideSheet } from "../../ds/SideSheet";
import { RowsSkeleton } from "../../ds/Skeletons";
import { ListAdd, ListGroup, ListItem } from "../../ds/ListGroup";
import { DP } from "../../providers";
import { useTimezoneFormat } from "../../contexts";
import { useNotify } from "../../shell/notifications";
import { useCurrentMember, useTeam } from "../../auth/currentMember";
import { ChoiceInput, TextInput } from "../streams/detail/fields";
import { TEAM_ROLES, UserAvatar, teamRole } from "../users/shared";
import { ConfirmDelete, useLibraryMutations, useSheet } from "../library/shared";

const EMPTY = { name: "", email: "", role: "Internal" };
const ROLE_ORDER = Object.fromEntries(TEAM_ROLES.map((r, i) => [r.value, i]));
const roleOptions = TEAM_ROLES.map((r) => ({ value: r.value, label: r.label, icon: r.icon }));

/** Invite someone (name, email, role) or change a member's name and role; remove them. */
function MemberSheet({ sheet, me }) {
  const { formatDate } = useTimezoneFormat();
  const isNew = sheet.open && !sheet.record?.id;
  const isMe = !isNew && sheet.record?.id === me?.id;
  const { save, destroy, saving } = useLibraryMutations({ resource: "TeamMember", dataProviderName: DP.team, noun: "Member" });
  const notify = useNotify();
  const [confirm, setConfirm] = useState(false);
  const { control, reset, handleSubmit, setError, watch, formState } = useForm({ defaultValues: EMPTY });
  const role = watch("role");

  useEffect(() => {
    if (sheet.open) reset({ ...EMPTY, ...(sheet.record?.id ? { name: sheet.record.name, email: sheet.record.email, role: sheet.record.role } : {}) });
  }, [sheet.open, sheet.record, reset]);

  const submit = handleSubmit(async (v) => {
    const values = isNew ? { name: v.name.trim(), email: v.email.trim(), role: v.role } : { name: v.name.trim(), role: v.role };
    if (await save(isNew ? null : sheet.record.id, values, setError)) sheet.close();
  });
  const record = sheet.record ?? {};
  const status = record.status === "Invited" ? `Invited ${formatDate(record.addedAt, "MMM D")}` : record.lastSignInAt ? `Last signed in ${formatDate(record.lastSignInAt, "MMM D")}` : "Active";

  return (
    <SideSheet
      open={sheet.open}
      onClose={sheet.close}
      dirty={formState.isDirty}
      title={isNew ? "Invite member" : record.name}
      subtitle={isNew ? undefined : `${record.email} · ${status}`}
      footerStart={
        !isNew &&
        !isMe && (
          <Button variant="text" color="error" onClick={() => setConfirm(true)}>
            Remove from team
          </Button>
        )
      }
      actions={
        <>
          <Button variant="text" onClick={sheet.close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || (!isNew && !formState.isDirty)}>
            {isNew ? "Send invite" : "Save"}
          </Button>
        </>
      }
    >
      <TextInput control={control} name="name" label="Name" rules={{ validate: (v) => (v.trim() ? true : "Enter a name"), maxLength: { value: 40, message: "Use 40 characters or fewer" } }} />
      {isNew && (
        <TextInput
          control={control}
          name="email"
          label="Email"
          type="email"
          helperText="They sign in to the dashboard with this email."
          rules={{ required: "Enter an email", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } }}
        />
      )}
      <ChoiceInput
        control={control}
        name="role"
        label="Role"
        options={roleOptions}
        disabled={isMe}
        helperText={isMe ? "You can't change your own role." : teamRole(role).hint}
      />
      <ConfirmDelete
        open={confirm}
        title={`Remove ${record.name} from the team?`}
        confirmLabel="Remove"
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          try {
            await destroy(record.id, record.name, `${record.name} removed from the team`);
            sheet.close();
          } catch (e) {
            notify(e?.response?.data?.errors?.id?.[0] ?? e?.response?.data?.detail ?? "Couldn't remove them", { variant: "error" });
          }
        }}
      >
        {`They can't sign in to the dashboard anymore. You can invite them again later.`}
      </ConfirmDelete>
    </SideSheet>
  );
}

export default function TeamPage() {
  const { m3: c } = useTheme();
  const { team, isLoading } = useTeam();
  const { member: me, isAdmin } = useCurrentMember();
  const [query, setQuery] = useState("");
  const sheet = useSheet();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return team
      .filter((m) => `${m.name} ${m.email}`.toLowerCase().includes(q))
      .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || a.name.localeCompare(b.name));
  }, [team, query]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: FORM_WIDTH }}>
      <PageToolbar search={<SearchField value={query} onChange={setQuery} placeholder="Search names or emails" />} actionLabel={isAdmin ? "Invite member" : undefined} onAction={sheet.openNew} />
      <Banner icon={isAdmin ? "info" : "lock"}>{isAdmin ? "Admins see words without the words password. Everyone else enters it to see words." : "Only admins can invite people or change roles."}</Banner>
      {isLoading ? (
        <ContainerCard>
          <RowsSkeleton count={4} height={56} label="Loading team" />
        </ContainerCard>
      ) : rows.length === 0 ? (
        <ContainerCard>
          <EmptyState compact icon="search_off" title="No members match" />
        </ContainerCard>
      ) : (
        <ListGroup label="Team">
          {rows.map((m) => {
            const r = teamRole(m.role);
            return (
              <ListItem
                key={m.id}
                onClick={isAdmin ? () => sheet.openEdit(m) : undefined}
                leading={<UserAvatar user={{ username: m.name }} size={30} />}
                title={m.id === me?.id ? `${m.name} (you)` : m.name}
                supporting={m.email}
                trailing={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {m.status === "Invited" && <Pill tone="warning">Invited</Pill>}
                    <Pill icon={r.icon}>{r.label}</Pill>
                    {isAdmin && <Icon name="chevron_right" style={{ color: c.chevron ?? c.onSurfaceVariant }} />}
                  </Box>
                }
              />
            );
          })}
          {isAdmin && !query && <ListAdd label="Invite member" onClick={sheet.openNew} />}
        </ListGroup>
      )}
      {isAdmin && <MemberSheet sheet={sheet} me={me} />}
    </Box>
  );
}
