// Settings › Developer tools — send a test analytics (Amplitude) event; link to the design system.
import { useState } from "react";
import { Link } from "react-router";
import { useCreate } from "@refinedev/core";
import { useFieldArray, useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { IconTile } from "../../ds/IconTile";
import { FormSection } from "../../ds/FormSection";
import { FORM_WIDTH } from "../../ds/Page";
import { useNotify } from "../../shell/notifications";
import { DP } from "../../providers";
import { useTimezoneFormat } from "../../contexts";
import { TextInput } from "../streams/detail/fields";
import { ContainerCard } from "../../ds/ContainerCard";
import { EditTable, TextCell } from "../../ds/EditTable";

const mono = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" };
const toObject = (rows) => Object.fromEntries(rows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]));

function PropertyRows({ form, name, label }) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <Box>
      <Typography variant="titleSmall" component="h3" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <EditTable
        label={label}
        columns={[
          { header: "Name", width: "minmax(120px, 1fr)" },
          { header: "Value", width: "minmax(160px, 1.5fr)" },
        ]}
        rows={fields.map((f, i) => ({
          key: f.id,
          onRemove: () => remove(i),
          removeLabel: `Remove ${label.toLowerCase()} ${i + 1}`,
          cells: [
            <TextCell key="k" control={control} name={`${name}.${i}.key`} label={`${label} ${i + 1} name`} placeholder="Name" sx={{ "& input": { ...mono, py: 1 } }} inputProps={{ spellCheck: false }} rules={{ validate: (v) => (v?.trim() ? true : "Enter a name") }} />,
            <TextCell key="v" control={control} name={`${name}.${i}.value`} label={`${label} ${i + 1} value`} placeholder="Value" sx={{ "& input": { ...mono, py: 1 } }} inputProps={{ spellCheck: false }} />,
          ],
        }))}
        addLabel="Add property"
        onAdd={() => append({ key: "", value: "" })}
      />
    </Box>
  );
}

export default function DeveloperPage() {
  const { m3: c } = useTheme();
  const { formatDate } = useTimezoneFormat();
  const notify = useNotify();
  const [sent, setSent] = useState([]);
  const { mutateAsync, isPending } = useCreate();
  const { control, handleSubmit, setValue, getValues, trigger } = useForm({ defaultValues: { userId: "", name: "", properties: [], userProperties: [] } });

  const send = handleSubmit(async (v) => {
    const event = { userId: v.userId.trim(), name: v.name.trim(), properties: toObject(v.properties), userProperties: toObject(v.userProperties) };
    try {
      await mutateAsync({ resource: "Events", dataProviderName: DP.amplitudeEvent, values: event, successNotification: false, errorNotification: false });
      setSent((s) => [{ ...event, at: new Date() }, ...s].slice(0, 10));
      setValue("name", "");
      notify(`“${event.name}” sent`);
    } catch {
      notify("Couldn't send the event", { variant: "error" });
    }
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: FORM_WIDTH }}>
      <FormSection id="event" title="Send a test event">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
          <TextInput control={control} name="userId" label="User ID" rules={{ validate: (v) => (v?.trim() ? true : "Enter a user ID") }} slotProps={{ htmlInput: { spellCheck: false } }} />
          <TextInput control={control} name="name" label="Event name" placeholder="e.g. stream_joined" rules={{ validate: (v) => (v?.trim() ? true : "Enter an event name") }} slotProps={{ htmlInput: { spellCheck: false } }} />
        </Box>
        <PropertyRows form={{ control, setValue, getValues, trigger }} name="properties" label="Event properties" />
        <PropertyRows form={{ control, setValue, getValues, trigger }} name="userProperties" label="User properties" />
        <Box>
          <Button onClick={send} disabled={isPending} startIcon={<Icon name="send" />}>
            {isPending ? "Sending…" : "Send event"}
          </Button>
        </Box>
      </FormSection>

      {sent.length > 0 && (
        <ContainerCard sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="titleMedium" component="h2" sx={{ mb: 1.5 }}>
            Sent this session
          </Typography>
          {sent.map((e, i) => (
            <Box key={i} sx={{ py: 1.25, "&:not(:last-of-type)": { borderBottom: `1px solid ${c.outlineVariant}` } }}>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
                <Typography variant="titleSmall" sx={mono}>
                  {e.name}
                </Typography>
                <Typography variant="bodySmall" color="text.secondary">
                  {formatDate(e.at.toISOString(), "h:mm:ss A")} · {e.userId}
                </Typography>
              </Box>
              {(Object.keys(e.properties).length > 0 || Object.keys(e.userProperties).length > 0) && (
                <Typography variant="bodySmall" color="text.secondary" component="div" sx={{ ...mono, wordBreak: "break-all" }}>
                  {JSON.stringify({ ...(Object.keys(e.properties).length ? { properties: e.properties } : {}), ...(Object.keys(e.userProperties).length ? { userProperties: e.userProperties } : {}) })}
                </Typography>
              )}
            </Box>
          ))}
        </ContainerCard>
      )}

      <Card>
        <CardActionArea component={Link} to="/design-system" sx={{ p: { xs: 2, sm: 3 }, display: "flex", alignItems: "center", gap: 2 }}>
          <IconTile icon="palette" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="titleMedium" component="h2">
              Design system
            </Typography>
          </Box>
          <Icon name="chevron_right" style={{ color: c.onSurfaceVariant }} />
        </CardActionArea>
      </Card>
    </Box>
  );
}
