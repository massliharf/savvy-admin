// Sponsors — reusable sponsorships. Picking one on a stream copies its card onto the stream.
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useList } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../../ds/Icon";
import { cornerFor } from "../../ds/IconTile";
import { EmptyState } from "../../ds/EmptyState";
import { ImageField } from "../../ds/ImageField";
import { SideSheet } from "../../ds/SideSheet";
import { DP } from "../../providers";
import { richLen } from "../streams/enums";
import { TextInput } from "../streams/detail/fields";
import { CardGrid, ShopCard } from "../shop/shared";
import { ConfirmDelete, LibraryToolbar, useLibraryMutations, useSheet } from "./shared";
import { radius } from "../../theme/tokens";
import { CardsSkeleton } from "../../ds/Skeletons";

const EMPTY = { name: "", title: "", description: "", cta: "", imageUrl: null, imageFile: null };

const lengthRule = (label, max) => ({
  validate: (v) => {
    const n = richLen((v ?? "").trim());
    if (n < 1) return `${label} is required`;
    return n <= max || `Use ${max} characters or fewer`;
  },
});

/** The sponsor card roughly as players see it in the app. */
export function SponsorPreview({ title, description, cta, imageUrl }) {
  const { m3: c } = useTheme();
  let host = "";
  try {
    host = cta ? new URL(cta).hostname.replace(/^www\./, "") : "";
  } catch {
    host = cta;
  }
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", p: 1.5, borderRadius: radius("lg"), bgcolor: c.surfaceContainerHigh, "[role='listitem'] &": { bgcolor: c.nested } }}>
      <Box sx={{ width: 48, height: 48, borderRadius: `${cornerFor(48)}px`, bgcolor: c.surfaceContainerLow, flexShrink: 0, overflow: "hidden", display: "grid", placeItems: "center", color: c.onSurfaceVariant }}>
        {imageUrl ? <Box component="img" src={imageUrl} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon name="handshake" />}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="titleSmall" noWrap component="div">
          {title || "Title"}
        </Typography>
        <Typography variant="bodySmall" color="text.secondary" component="div" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {description || "Description"}
        </Typography>
        {host && (
          <Typography variant="labelSmall" noWrap component="div" sx={{ color: (t) => t.m3.primaryText }}>
            {host}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/** A sponsor as a large card, like hosts and the Shop: picture, name, the card text players see and its link. */
function SponsorCard({ sponsor, onOpen }) {
  const { m3: c } = useTheme();
  let host = sponsor.cta;
  try {
    host = new URL(sponsor.cta).hostname.replace(/^www\./, "");
  } catch {
    // not a full URL: show it as is
  }
  return (
    <ShopCard
      image={sponsor.imageUrl}
      icon="handshake"
      title={sponsor.name}
      meta={
        <>
          {/* The description is in the sheet; the card keeps to what fits its height. */}
          <Typography variant="bodySmall" color="text.secondary" noWrap component="div">
            {sponsor.title}
          </Typography>
        </>
      }
      pills={
        host && (
          <Typography variant="labelMedium" noWrap component="div" sx={{ color: c.primaryText }}>
            {host}
          </Typography>
        )
      }
      onOpen={onOpen}
    />
  );
}

function SponsorSheet({ sheet }) {
  const isNew = sheet.open && !sheet.record?.id;
  const { save, destroy, saving } = useLibraryMutations({ resource: "Sponsor", dataProviderName: DP.sponsors, noun: "Sponsor" });
  const [confirm, setConfirm] = useState(false);
  const [preview, setPreview] = useState(null);
  const { control, reset, handleSubmit, setValue, setError, formState } = useForm({ defaultValues: EMPTY });
  const values = useWatch({ control });

  useEffect(() => {
    if (sheet.open) {
      reset({ ...EMPTY, ...sheet.record, imageFile: null });
      setPreview(null);
    }
  }, [sheet.open, sheet.record, reset]);

  const submit = handleSubmit(async (v) => {
    const payload = { name: v.name, title: v.title, description: v.description, cta: v.cta, imageUrl: v.imageUrl || null, imageFile: v.imageFile || null };
    if (await save(isNew ? null : sheet.record.id, payload, setError)) sheet.close();
  });

  return (
    <SideSheet
      open={sheet.open}
      onClose={sheet.close}
      dirty={formState.isDirty}
      title={isNew ? "New sponsor" : sheet.record?.name}
      subtitle={isNew ? undefined : "Sponsor"}
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
            {isNew ? "Add sponsor" : "Save"}
          </Button>
        </>
      }
    >
      <ImageField
        label="Image"
        value={values.imageUrl}
        width={256}
        height={256}
        onChange={(f) => {
          setValue("imageFile", f, { shouldDirty: true });
          setPreview(URL.createObjectURL(f));
        }}
        onRemove={() => {
          setValue("imageFile", null, { shouldDirty: true });
          setValue("imageUrl", null, { shouldDirty: true });
          setPreview(null);
        }}
      />
      <TextInput control={control} name="name" label="Sponsor name" helperText="For admins only." rules={{ required: "Enter a name" }} />
      <TextInput control={control} name="title" label="Title" max={30} rules={lengthRule("Title", 30)} />
      <TextInput control={control} name="description" label="Description" multiline minRows={2} max={60} rules={lengthRule("Description", 60)} />
      <TextInput control={control} name="cta" label="Link" placeholder="https://" rules={{ required: "Add the link players open", pattern: { value: /^https?:\/\/\S+$/i, message: "Use a full link starting with https://" } }} />
      <Box>
        <Typography variant="labelLarge" color="text.secondary" component="div" sx={{ mb: 1 }}>
          Preview
        </Typography>
        <SponsorPreview title={values.title} description={values.description} cta={values.cta} imageUrl={preview ?? values.imageUrl} />
      </Box>
      <ConfirmDelete
        open={confirm}
        title={`Delete ${sheet.record?.name}?`}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          await destroy(sheet.record.id, sheet.record.name);
          sheet.close();
        }}
      >
        It won't be offered for new streams. Streams that already use this sponsorship keep it. This can't be undone.
      </ConfirmDelete>
    </SideSheet>
  );
}

export default function SponsorsPage() {
  const [query, setQuery] = useState("");
  const sheet = useSheet();
  const { data, isLoading } = useList({ resource: "Sponsor", dataProviderName: DP.sponsors, pagination: { mode: "off" } });
  const q = query.trim().toLowerCase();
  const sponsors = (data?.data ?? []).filter((s) => `${s.name} ${s.title}`.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <LibraryToolbar query={query} onQuery={setQuery} placeholder="Search sponsors" actionLabel="New sponsor" onAction={sheet.openNew} />
      {isLoading ? (
        <CardsSkeleton count={2} label="Loading sponsors" />
      ) : sponsors.length === 0 ? (
        <EmptyState icon={q ? "search_off" : "handshake"} title={q ? "No sponsors match" : "No sponsors yet"}>
          {!q && (
            <Button color="secondary" startIcon={<Icon name="add" />} onClick={sheet.openNew}>
              New sponsor
            </Button>
          )}
        </EmptyState>
      ) : (
        <CardGrid>
          {sponsors.map((s) => (
            <SponsorCard key={s.id} sponsor={s} onOpen={() => sheet.openEdit(s)} />
          ))}
        </CardGrid>
      )}
      <SponsorSheet sheet={sheet} />
    </Box>
  );
}
