// Prototype only: use the dashboard as someone else on the team (Settings › Team), with their
// role, to check what each role can do (e.g. that only admins see words without the password).
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { Pill } from "../ds/Pill";
import { SelectList } from "../ds/SelectList";
import { useNotify } from "./notifications";
import { useCurrentMember, useSwitchMember, useTeam } from "../auth/currentMember";
import { TEAM_ROLES, teamRole } from "../pages/users/shared";

const ROLE_ORDER = Object.fromEntries(TEAM_ROLES.map((r, i) => [r.value, i]));

export function SwitchMemberDialog({ open, onClose }) {
  const { team } = useTeam();
  const { member: me } = useCurrentMember();
  const switchTo = useSwitchMember();
  const notify = useNotify();
  const [picked, setPicked] = useState(null);
  useEffect(() => {
    if (open) setPicked(me?.id ?? null);
  }, [open, me?.id]);
  const members = [...team].sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || a.name.localeCompare(b.name));
  const target = members.find((m) => m.id === picked);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth scroll="paper">
      <DialogTitle>Switch member</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Typography variant="bodyMedium" color="text.secondary" component="div" sx={{ px: 2.5, pt: 2, pb: 1 }}>
          Prototype only: use the dashboard as someone on the team, with their role.
        </Typography>
        <SelectList
          label="Team members"
          items={members}
          value={picked}
          onChange={setPicked}
          renderItem={(m) => (
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="bodyMedium" component="div" noWrap sx={{ fontWeight: 550 }}>
                  {m.id === me?.id ? `${m.name} (you)` : m.name}
                </Typography>
                <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
                  {m.email}
                </Typography>
              </Box>
              <Pill icon={teamRole(m.role).icon}>{teamRole(m.role).label}</Pill>
            </Box>
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!target || target.id === me?.id}
          onClick={async () => {
            onClose();
            await switchTo(target);
            notify(`Signed in as ${target.name} (${teamRole(target.role).label})`);
          }}
        >
          Switch
        </Button>
      </DialogActions>
    </Dialog>
  );
}
