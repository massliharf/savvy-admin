// Settings › Developer tools › Design system — the colour roles, type and shape scales and every
// shared component, rendered live with the current theme.
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { CATEGORY } from "../../theme/scheme";
import { Icon } from "../../ds/Icon";
import { IconTile, cornerFor } from "../../ds/IconTile";
import { ActionMenu } from "../../ds/ActionMenu";
import { ConfirmDialog } from "../../ds/ConfirmDialog";
import { Disclosure } from "../../ds/Disclosure";
import { EmptyState } from "../../ds/EmptyState";
import { FilterChips } from "../../ds/FilterChips";
import { AddTile, FieldGroup, FormSection } from "../../ds/FormSection";
import { ImageField } from "../../ds/ImageField";
import { FORM_WIDTH, PageToolbar } from "../../ds/Page";
import { Pill } from "../../ds/Pill";
import { SaveBar } from "../../ds/SaveBar";
import { SearchField } from "../../ds/SearchField";
import { SelectList } from "../../ds/SelectList";
import { SideSheet } from "../../ds/SideSheet";
import { StreamItem } from "../streams/parts";
import { StreamLegend } from "../streams/calendar";
import { AudienceField, HostPicker, ModeChoice } from "../streams/pickers";
import { RewardsEditor, RoundsEditor } from "../streams/detail/sections";
import { WordSetSummary } from "../streams/words";
import { LOGO_URL } from "../../assets";
import { FieldHelper } from "../../ds/FieldHelper";
import { Banner } from "../../ds/Banner";
import { ChoiceGroup, SelectButton } from "../../ds/SelectButton";
import { ListAdd, ListGroup, ListItem, ListSwitch } from "../../ds/ListGroup";
import { EditTable, ImageCell, SelectCell, TextCell } from "../../ds/EditTable";
import { RewardCell } from "../streams/detail/fields";

function Section({ title, description, children }) {
  return (
    <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="titleLarge" component="h2">
          {title}
        </Typography>
        {description && (
          <Typography variant="bodyMedium" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
      {children}
    </Box>
  );
}

const Row = ({ children, gap = 1.5 }) => <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap }}>{children}</Box>;

const COLOR_GROUPS = [
  ["primary", "onPrimary", "primaryContainer", "onPrimaryContainer"],
  ["secondary", "onSecondary", "secondaryContainer", "onSecondaryContainer"],
  ["tertiary", "onTertiary", "tertiaryContainer", "onTertiaryContainer"],
  ["error", "onError", "errorContainer", "onErrorContainer"],
];
// The surface ladder by what each step is for, from the back of the app to the front.
const SURFACES = [
  ["App ground", "background", "Behind the floating rail and workspace"],
  ["Workspace", "surface", "The main area every page sits on"],
  ["Card", "surfaceContainerLowest", "Cards, the rail, menus, dialogs, sheets"],
  ["Card tint", "surfaceContainerLow", "Hover on a card, a card's header row"],
  ["Quiet fill", "surfaceContainer", "Calendar headers, inset panels"],
  ["Block", "surfaceContainerHigh", "List and table rows inside a card"],
  ["Track", "surfaceContainerHighest", "Segmented tracks, blocks inside blocks"],
];
const TYPE = ["displaySmall", "headlineLarge", "headlineSmall", "titleLarge", "titleMedium", "titleSmall", "bodyLarge", "bodyMedium", "bodySmall", "labelLarge", "labelMedium", "labelSmall", "overline"];

function ColorTile({ name, bg, fg }) {
  return (
    <Box sx={{ bgcolor: bg, color: fg, px: 1.5, py: 1, minHeight: 56, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <Typography variant="labelMedium">{name}</Typography>
      <Typography variant="labelSmall" sx={{ opacity: 0.8 }}>
        {bg}
      </Typography>
    </Box>
  );
}

// Sample data for the stream components (links are disabled on this page).
const HOSTS = [
  { id: "h1", name: "Scott", imageUrl: null },
  { id: "h2", name: "Lena", imageUrl: null },
];
const at = (days, hour) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const round = (word) => ({ word, durationInSeconds: 60 });
const STREAMS = [
  { id: "ds-1", title: "You vs {host}", hostName: "Scott Rogowsky", hostDisplayName: "Puzzle Papi", imageUrl: LOGO_URL, startDate: at(1, 13), status: "Scheduled", gameMode: "TextChain", streamType: "Public", textSavvyRounds: { rounds: [round("cloud"), round("rain"), round("storm")] } },
  { id: "ds-2", title: "You vs {host}", hostName: "Scott Rogowsky", hostDisplayName: "Puzzle Papi", imageUrl: LOGO_URL, startDate: at(1, 17), status: "Scheduled", gameMode: "SubText", streamType: "SuperSavvy", textSavvyRounds: { rounds: [round(""), round(""), round(""), round(""), round("")] } },
  { id: "ds-3", title: "You vs {host}", hostName: "Scott Rogowsky", hostDisplayName: "Puzzle Papi", imageUrl: LOGO_URL, startDate: at(0, 18), status: "InProgress", gameMode: "TextChain", streamType: "Public", textSavvyRounds: { rounds: [round("river"), round("ocean")] } },
  { id: "ds-4", title: "You vs {host}", hostName: "Scott Rogowsky", hostDisplayName: "Puzzle Papi", imageUrl: LOGO_URL, startDate: at(-3, 10), status: "Completed", gameMode: "TextChain", streamType: "Internal", textSavvyRounds: { rounds: [round("plum")] } },
];
const WORD_SETS = [
  { id: "w1", type: "TextChain", title: "Weather", rounds: ["cloud", "rain", "storm", "wind", "snow"].map((w, i) => ({ ...round(w), roundIndex: i })), showdown: { word: "thunder" } },
  { id: "w2", type: "SubText", title: "Space", rounds: ["rocket", "planet", "comet", "orbit", "moon"].map((w, i) => ({ ...round(w), roundIndex: i })), showdown: { word: "galaxy" } },
];

function FormDemos() {
  const { control, setValue, getValues, trigger } = useForm({
    defaultValues: {
      rounds: [round("cloud"), round("rain")].map((r, i) => ({ ...r, roundIndex: i, roundBusterReward: null })),
      defaultRewards: [{ rewardType: "BombPowerup", amount: 1 }],
      hostBusterReward: null,
      raffleSystemWinnersConfiguration: null,
      showdownConfiguration: null,
      demo: { text: "cloud", size: "M", reward: { rewardType: "Sparks", amount: 5 } },
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "rounds" });
  return (
    <>
      <FormSection id="ds-rounds" title="Rounds editor" description="A stream's words and every word set.">
        <RoundsEditor form={{ control, setValue, getValues, trigger }} name="rounds" fields={fields} append={append} remove={remove} validateWord={() => true} />
      </FormSection>
      <FormSection id="ds-rewards" title="Rewards editor" description="A stream's Rewards section and a game mode's defaults.">
        <RewardsEditor form={{ control, setValue, getValues, trigger }} />
      </FormSection>
      <FormSection id="ds-table" title="Edit table" description="Every short list (rounds, winners, answers, sizes, inventory, power-ups): segmented rows, values edited right in their cells, no dialogs.">
        <EditTable
          label="Cells"
          reserveRemove
          columns={[
            { header: "Icon", width: "56px" },
            { header: "Text", width: "minmax(120px, 1fr)" },
            { header: "Choice", width: "120px" },
            { header: "Reward", width: "200px" },
          ]}
          rows={[
            {
              key: "a",
              onRemove: () => {},
              cells: [
                <ImageCell key="i" src={null} label="Icon" onPick={() => {}} />,
                <TextCell key="t" control={control} name="demo.text" label="Text" placeholder="Add a word" />,
                <SelectCell key="s" control={control} name="demo.size" label="Size" options={["S", "M", "L"].map((x) => ({ value: x, label: x }))} />,
                <RewardCell key="r" control={control} name="demo.reward" allowed={["Sparks", "BombPowerup", "HintPowerup"]} label="Reward" />,
              ],
            },
          ]}
          addLabel="Add row"
          onAdd={() => {}}
        />
      </FormSection>
    </>
  );
}

export default function DesignSystemPage() {
  const theme = useTheme();
  const c = theme.m3;
  const { shape } = theme.tokens;
  const [dialog, setDialog] = useState(false);
  const [tab, setTab] = useState(0);
  const [view, setView] = useState("cards");
  const [filters, setFilters] = useState(["TextChain"]);
  const [search, setSearch] = useState("");
  const [sheet, setSheet] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [image, setImage] = useState(null);
  const [host, setHost] = useState(HOSTS[0]);
  const [audience, setAudience] = useState("Public");
  const [mode, setMode] = useState("TextChain");
  const [picked, setPicked] = useState("w1");
  const [toggle, setToggle] = useState(true);
  const pair = (role) => (role.startsWith("on") ? c[role[2].toLowerCase() + role.slice(3)] : c[`on${role[0].toUpperCase()}${role.slice(1)}`]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: FORM_WIDTH + 160 }}>
      <Section title="Colour roles" description="Savvy Admin's own colours, measured from its app in light and dark: #F5F5F5 / #0F0F0F ground, #FAFAFA / #161616 workspace, white / #1A1A1A cards and menus, #EDEDED / #2B2B2B tracks, faint grey control fills and ink hairlines. Savvy Admin blue (#506BF2) is the action and switch colour; a chosen segment or tab is the white pill, a chosen chip the ink pill, where you are the grey active wash, focus an ink edge. Pink is brand only, violet is Sparks, and each game mode has a Savvy Admin category colour.">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5 }}>
          {COLOR_GROUPS.map((group) => (
            <Box key={group[0]} sx={{ borderRadius: `${shape.md}px`, overflow: "hidden" }}>
              {group.map((role) => (
                <ColorTile key={role} name={role} bg={c[role]} fg={pair(role)} />
              ))}
            </Box>
          ))}
        </Box>
        <Card sx={{ p: 1 }}>
          {SURFACES.map(([name, role, use]) => (
            <Box key={role} sx={{ display: "grid", gridTemplateColumns: "56px minmax(0, 160px) minmax(0, 1fr) 80px", alignItems: "center", columnGap: 2, px: 1, py: 0.75 }}>
              <Box sx={{ height: 32, borderRadius: `${shape.sm}px`, bgcolor: c[role], boxShadow: `inset 0 0 0 1px ${c.border}` }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="titleSmall" component="div">
                  {name}
                </Typography>
                <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
                  {role}
                </Typography>
              </Box>
              <Typography variant="bodySmall" color="text.secondary">
                {use}
              </Typography>
              <Typography variant="labelMedium" color="text.secondary" sx={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {c[role].toUpperCase()}
              </Typography>
            </Box>
          ))}
        </Card>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, borderRadius: `${shape.md}px`, overflow: "hidden", border: `1px solid ${c.border}` }}>
          <ColorTile name="brand" bg={c.brand} fg={c.onBrand} />
          <ColorTile name="focus" bg={c.focus} fg={c.onPrimary} />
          <ColorTile name="disabledFill" bg={c.disabledFill} fg={c.onSurfaceVariant} />
          <ColorTile name="track" bg={c.track} fg={c.onSurface} />
          <ColorTile name="trackSelected" bg={c.trackSelected} fg={c.onSurface} />
        </Box>
        <Row gap={2}>
          {Object.entries(CATEGORY).map(([name]) => (
            <Box key={name} sx={{ textAlign: "center" }}>
              <IconTile icon="sports_esports" tone={name} size={48} />
              <Typography variant="labelSmall" color="text.secondary" component="div">
                {name}
              </Typography>
            </Box>
          ))}
        </Row>
      </Section>

      <Section title="Typography">
        <Card sx={{ p: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {TYPE.map((v) => (
            <Box key={v} sx={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <Typography variant="labelMedium" color="text.secondary" sx={{ width: 120, flexShrink: 0 }}>
                {v}
              </Typography>
              <Typography variant={v} component="span" noWrap>
                Tonight's stream starts at 7 PM
              </Typography>
            </Box>
          ))}
        </Card>
      </Section>

      <Section title="Shape" description="Savvy Admin corners: 4 (meta chips), 8 (controls), 12 (blocks), 16 (cards, menus, shell). Tiles, avatars and images take their radius from their size (cornerFor).">
        <Row gap={2}>
          {Object.entries(shape)
            .filter(([k]) => ["xs", "sm", "md", "lg"].includes(k))
            .map(([k, v]) => (
              <Box key={k} sx={{ textAlign: "center" }}>
                <Box sx={{ width: 64, height: 64, borderRadius: `${v}px`, bgcolor: c.secondaryContainer }} />
                <Typography variant="labelSmall" color="text.secondary">
                  {k} · {v}
                </Typography>
              </Box>
            ))}
        </Row>
        <Row gap={2}>
          {[20, 32, 40, 48, 56, 72].map((size) => (
            <Box key={size} sx={{ textAlign: "center" }}>
              <IconTile icon="live_tv" size={size} />
              <Typography variant="labelSmall" color="text.secondary" component="div">
                {size} · {cornerFor(size)}
              </Typography>
            </Box>
          ))}
        </Row>
      </Section>

      <Section title="Buttons">
        <Row>
          <Button>Filled</Button>
          <Button variant="tonal">Tonal</Button>
          <Button variant="outlined">Outlined</Button>
          <Button variant="elevated">Elevated</Button>
          <Button variant="text">Text</Button>
          <Button disabled>Disabled</Button>
        </Row>
        <Row>
          <Button startIcon={<Icon name="add" />}>New stream</Button>
          <Button variant="tonal" startIcon={<Icon name="auto_awesome" />}>
            Fill month
          </Button>
          <Button variant="outlined" startIcon={<Icon name="schedule" />}>
            Time slots
          </Button>
          <Button color="error">Delete</Button>
          <Button variant="text" endIcon={<Icon name="arrow_forward" />}>
            View all
          </Button>
        </Row>
        <Row>
          <Button size="small">Small</Button>
          <Button>Medium</Button>
          <Button size="large">Large</Button>
        </Row>
      </Section>

      <Section title="Icon buttons, menus, segmented buttons">
        <Row gap={2}>
          <Tooltip title="Edit">
            <IconButton aria-label="Edit">
              <Icon name="edit" />
            </IconButton>
          </Tooltip>
          <ActionMenu
            items={[
              { label: "Edit", icon: "edit", onClick: () => {} },
              { label: "Duplicate", icon: "content_copy", onClick: () => {} },
              { label: "Delete", icon: "delete", tone: "error", divider: true, onClick: () => setDialog(true) },
            ]}
          />
          <ToggleButtonGroup exclusive value={view} onChange={(_, v) => v && setView(v)} aria-label="View">
            {[
              ["cards", "grid_view"],
              ["list", "view_agenda"],
              ["calendar", "calendar_month"],
            ].map(([v, icon]) => (
              <ToggleButton key={v} value={v} aria-label={v} sx={{ px: 1.5 }}>
                <Icon name={icon} size={20} fill={view === v} />
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <ToggleButtonGroup exclusive value="all" aria-label="Time range">
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="upcoming">Upcoming</ToggleButton>
            <ToggleButton value="past">Past</ToggleButton>
          </ToggleButtonGroup>
        </Row>
      </Section>

      <Section title="Filter chips, pills, tiles">
        <FilterChips
          options={[
            { id: "TextChain", label: "TextChain", group: "mode" },
            { id: "SubText", label: "SubText", group: "mode" },
            { id: "needs-words", label: "Needs words", group: "state" },
            { id: "setup", label: "Needs setup", group: "state" },
          ]}
          selected={filters}
          onToggle={(id) => setFilters((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))}
          onClear={() => setFilters([])}
        />
        <Row gap={1}>
          <Pill tone="live">Live</Pill>
          <Pill>Needs words</Pill>
          <Pill tone="primary">Assigned</Pill>
          <Pill tone="success">Available</Pill>
          <Pill tone="warning">Pending</Pill>
          <Pill tone="error">Canceled</Pill>
        </Row>
        <Row gap={1.5}>
          {["primary", "secondary", "tertiary", "error", "success", "surface"].map((tone) => (
            <IconTile key={tone} icon="spellcheck" tone={tone} />
          ))}
        </Row>
      </Section>

      <Section title="Fields">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          <TextField label="Title" defaultValue="Friday Night TextChain" helperText={<FieldHelper text="Shown on the stream card." counter="22 / 100" />} />
          <HostPicker hosts={HOSTS} value={host} onChange={setHost} />
          <TextField label="Word" defaultValue="Hello" error helperText="Lowercase letters a–z only" />
          <TextField label="Host ID" disabled defaultValue="host-0192" />
        </Box>
        <PageToolbar actionLabel="New word set" onAction={() => setSheet(true)}>
          <SearchField value={search} onChange={setSearch} placeholder="Search words" />
        </PageToolbar>
        <ModeChoice value={mode} onChange={setMode} />
        <AudienceField value={audience} onChange={setAudience} />
        <ChoiceGroup label="Choice (2–6 options)" value={mode} options={[{ value: "TextChain", label: "TextChain" }, { value: "SubText", label: "SubText" }]} onChange={setMode} />
        <SelectButton label="Choice (7 or more)" value="Saturday" options={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => ({ value: d, label: d }))} onChange={() => {}} />
        <ListGroup label="List group">
          <ListSwitch icon="smart_toy" title="Run headless" supporting="Switches sit at the end of their row." checked={toggle} onChange={setToggle} />
          <ListItem leading={<Icon name="notifications" />} title="Row" supporting="Opens what it names right here" trailing={<Icon name="chevron_right" />} onClick={() => {}} />
          <ListAdd label="Add item" onClick={() => {}} />
        </ListGroup>
        <Disclosure label="Notification texts">
          <Typography variant="bodyMedium" color="text.secondary" sx={{ pt: 1 }}>
            Optional fields open underneath.
          </Typography>
        </Disclosure>
      </Section>

      <Section title="Forms" description="Form sections group fields on detail pages; optional blocks are added with a tile.">
        <FormSection id="ds-form" title="Form section" description="Groups related fields on detail and settings pages.">
          <TextField label="Title" defaultValue="Friday Night TextChain" onChange={() => setDirty(true)} />
          <FieldGroup title="Field group" description="A nested block that can be removed." onRemove={() => {}}>
            <TextField label="Sponsor name" defaultValue="Acme" onChange={() => setDirty(true)} />
          </FieldGroup>
          <AddTile icon="handshake" title="Add sponsorship" description="Optional blocks are added with a tile." onClick={() => setDirty(true)} />
          <ImageField label="Cover image" value={image} width={1200} height={630} hint="1200 × 630 PNG or JPG" onChange={(file) => setImage(URL.createObjectURL(file))} onRemove={() => setImage(null)} />
        </FormSection>
        <FormDemos />
        <Row>
          <Button variant="tonal" onClick={() => setDirty(true)}>
            Show save bar
          </Button>
          <Button variant="outlined" onClick={() => setSheet(true)}>
            Open side sheet
          </Button>
          <Button variant="outlined" onClick={() => setDialog(true)}>
            Open confirm dialog
          </Button>
        </Row>
      </Section>

      <Section title="Streams" description="One StreamItem in every view; only the layout changes. In the calendar: scheduled = the accent's container, needs words = outlined, live = error container, ended = neutral; the game mode shows as its icon.">
        <StreamLegend />
        <Box onClickCapture={(e) => e.preventDefault()} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: 2 }}>
            {STREAMS.map((s) => (
              <StreamItem key={s.id} stream={s} variant="card" onAction={() => {}} />
            ))}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {STREAMS.map((s) => (
              <StreamItem key={s.id} stream={s} variant="row" onAction={() => {}} />
            ))}
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 120px))", gap: 0.5 }}>
            {STREAMS.map((s) => (
              <StreamItem key={s.id} stream={s} variant="compact" />
            ))}
          </Box>
        </Box>
      </Section>

      <Section title="Word sets and selection lists">
        <Card>
          <SelectList label="Word sets" items={WORD_SETS} value={picked} onChange={setPicked} renderItem={(w) => <WordSetSummary set={w} />} />
        </Card>
      </Section>

      <Section title="Empty states">
        <Card variant="outlined">
          <EmptyState icon="live_tv" title="Nothing scheduled" description="Full size, used when a whole page is empty.">
            <Button startIcon={<Icon name="add" />}>New stream</Button>
          </EmptyState>
        </Card>
        <Card>
          <EmptyState compact icon="spellcheck" title="No TextChain sets available" description="Compact, used inside a section, card or dialog." />
        </Card>
      </Section>

      <Section title="Tabs and feedback">
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Schedule" />
          <Tab label="Words" />
          <Tab label="Game modes" />
        </Tabs>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Banner>Prices come from RevenueCat; here you set the Sparks each pack grants.</Banner>
          <Banner tone="warning">3 upcoming streams need a word set, 1 available.</Banner>
          <Banner tone="error">This item is out of stock.</Banner>
        </Box>
        <Row gap={3}>
          <Box sx={{ width: 240 }}>
            <LinearProgress variant="determinate" value={64} />
          </Box>
          <CircularProgress size={32} />
        </Row>
      </Section>

      <SideSheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Side sheet"
        subtitle="Creates and edits small records"
        footerStart={
          <Button variant="text" color="error" onClick={() => setSheet(false)}>
            Delete
          </Button>
        }
        actions={
          <>
            <Button variant="text" onClick={() => setSheet(false)}>
              Cancel
            </Button>
            <Button onClick={() => setSheet(false)}>Save</Button>
          </>
        }
      >
        <TextField label="Name" defaultValue="Scott" />
        <TextField label="Bio" multiline minRows={3} />
      </SideSheet>

      <SaveBar dirty={dirty} saving={false} onSave={() => setDirty(false)} onDiscard={() => setDirty(false)} />

      <ConfirmDialog open={dialog} title="Delete stream?" tone="error" confirmLabel="Delete" onCancel={() => setDialog(false)} onConfirm={() => setDialog(false)}>
        “Friday Night TextChain” and its rounds will be removed. This can't be undone.
      </ConfirmDialog>
    </Box>
  );
}
