import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Icon } from "../../ds/Icon";
import { FORM_WIDTH } from "../../ds/Page";
import { useThemeSettings } from "../../theme/ThemeSettings";
import { useTimezone } from "../../contexts";
import { ContainerCard } from "../../ds/ContainerCard";

const TIMEZONES = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["America/Los_Angeles", "UTC"];

function SettingsCard({ title, description, children }) {
  return (
    <ContainerCard sx={{ p: { xs: 2.5, sm: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box>
        <Typography variant="titleMedium" component="h2">
          {title}
        </Typography>
        {description && (
          <Typography variant="bodyMedium" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {children}
    </ContainerCard>
  );
}

export default function AppearancePage() {
  const settings = useThemeSettings();
  const { timezone, setTimezone } = useTimezone();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: FORM_WIDTH }}>
      <SettingsCard title="Theme">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="labelLarge" color="text.secondary">
            Mode
          </Typography>
          <ToggleButtonGroup exclusive value={settings.mode} onChange={(_, mode) => mode && settings.update({ mode })} aria-label="Colour mode" sx={{ alignSelf: "flex-start" }}>
            <ToggleButton value="light">
              <Icon name="light_mode" size={16} />
              Light
            </ToggleButton>
            <ToggleButton value="dark">
              <Icon name="dark_mode" size={16} />
              Dark
            </ToggleButton>
            <ToggleButton value="system">
              <Icon name="contrast" size={16} />
              System
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </SettingsCard>

      <SettingsCard title="Time zone">
        <Autocomplete
          value={timezone}
          options={TIMEZONES}
          disableClearable
          onChange={(_, tz) => tz && setTimezone(tz)}
          renderInput={(params) => <TextField {...params} label="Time zone" />}
          sx={{ maxWidth: 400 }}
        />
      </SettingsCard>
    </Box>
  );
}
