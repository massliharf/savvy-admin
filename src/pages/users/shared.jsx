// Shared bits for the Users section: status vocabularies, badges, region helpers, pager.
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { SelectButton } from "../../ds/SelectButton";
import { Icon } from "../../ds/Icon";
import { Pill } from "../../ds/Pill";

countries.registerLocale(en);

// Account status: numeric on read, names for bulk writes.
export const ACCOUNT_STATUS = [
  { value: 1, name: "Active", label: "Active", tone: "success" },
  { value: 2, name: "Reserved", label: "Deactivated", tone: "neutral" },
  { value: 3, name: "Banned", label: "Banned", tone: "error" },
  { value: 4, name: "ChatBanned", label: "Chat banned", tone: "warning" },
];
export const accountStatus = (v) => ACCOUNT_STATUS.find((s) => s.value === Number(v) || s.name === v) ?? { label: String(v ?? "Unknown"), tone: "neutral" };

// Cashout status: string on rows, index for the list filter.
export const CASH_STATUS = [
  { name: "InProgress", index: 0, label: "Pending", tone: "warning" },
  { name: "Approved", index: 1, label: "Approved", tone: "success" },
  { name: "Declined", index: 2, label: "Declined", tone: "error" },
  { name: "Expired", index: 3, label: "Expired", tone: "neutral" },
];
export const cashStatus = (name) => CASH_STATUS.find((s) => s.name === name) ?? { label: name, tone: "neutral" };

export const ROLES = [
  { value: "", label: "Player", icon: "person", hint: "No special access." },
  { value: "Host", label: "Host", icon: "mic", hint: "Can present streams. Listed in Library › Hosts." },
  { value: "Internal", label: "Internal", icon: "badge", hint: "Sees internal streams." },
  { value: "Admin", label: "Admin", icon: "shield_person", hint: "Full access to this dashboard." },
];

export const REGIONS = Object.entries(countries.getNames("en", { select: "official" }))
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));
export const regionName = (code) => (code ? countries.getName(code, "en") ?? code : null);
export const flag = (code) => (code && /^[A-Z]{2}$/i.test(code) ? String.fromCodePoint(...[...code.toUpperCase()].map((ch) => 0x1f1a5 + ch.charCodeAt(0))) : "");

export const isBot = (id) => String(id ?? "").startsWith("savvy-bot_");

export const AccountStatusPill = ({ value }) => {
  const s = accountStatus(value);
  return <Pill tone={s.tone}>{s.label}</Pill>;
};
export const CashStatusPill = ({ value }) => {
  const s = cashStatus(value);
  return <Pill tone={s.tone}>{s.label}</Pill>;
};

// A neutral circle (the blue tint means "selected"); bots show a robot instead of an initial.
export function UserAvatar({ user, size = 40 }) {
  const { m3: c } = useTheme();
  const bot = isBot(user?.id);
  return (
    <Box sx={{ width: size, height: size, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, bgcolor: c.surfaceContainerHighest, color: bot ? c.onSurfaceVariant : c.onSurface, typography: "titleMedium" }}>
      {bot ? <Icon name="smart_toy" size={size * 0.5} /> : (user?.username?.[0] ?? "?").toUpperCase()}
    </Box>
  );
}

export const money = (n) => `$${Number(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/** "1–25 of 665,863" with rows-per-page and previous/next. `page` is 1-based. */
export function Pager({ page, pageSize, total, onPage, onPageSize, sizes = [25, 50, 100] }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const last = Math.max(1, Math.ceil(total / pageSize));
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, px: 2, py: 1, flexWrap: "wrap" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="bodySmall" color="text.secondary">
          Rows
        </Typography>
        <SelectButton size="small" aria-label="Rows per page" value={pageSize} options={sizes.map((s) => ({ value: s, label: String(s) }))} onChange={onPageSize} />
      </Box>
      <Typography variant="bodySmall" color="text.secondary">
        {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
      </Typography>
      <Box>
        <Tooltip title="Previous page">
          <span>
            <IconButton aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}>
              <Icon name="chevron_left" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Next page">
          <span>
            <IconButton aria-label="Next page" disabled={page >= last} onClick={() => onPage(page + 1)}>
              <Icon name="chevron_right" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}
