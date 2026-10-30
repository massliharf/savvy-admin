// The app-wide share cards (profile, live show stats) and the daily puzzle's, and their fields.
// Their texts live in the share config; presets of them are kept in Library › Share cards.
import { TextInput } from "../streams/detail/fields";
import { EditRows } from "../../ds/ItemDialog";
import { placeholderRule } from "./shareConfig";
import { ShareCardPreview } from "../streams/detail/sections";

export const APP_CARDS = [
  { key: "profileShare", title: "Profile share", fields: ["title", "subtitle"] },
  { key: "liveShowStats", title: "Live show stats", fields: ["title"] },
  { key: "dailyPuzzleSuccess", title: "Solved", fields: ["title"], tries: true, puzzle: true },
  { key: "dailyPuzzleFail", title: "Not solved", fields: ["title"], puzzle: true },
  { key: "dailyPuzzleStats", title: "Stats", fields: ["title"], puzzle: true },
];
export const cardsOf = (puzzle) => APP_CARDS.filter((card) => !!card.puzzle === puzzle);

/** The cards' fields in place, under `prefix` in `form`. `puzzle` picks the daily puzzle's cards. */
export function AppCardRows({ form, puzzle = false, prefix = "", label }) {
  return (
    <EditRows
      label={label}
      items={cardsOf(puzzle).map((card) => ({
        key: card.key,
        title: card.title,
        path: `${prefix}${card.key}`,
        // The same preview as the stream share cards.
        preview: (path) => <ShareCardPreview control={form.control} path={path} />,
        fields: () =>
          card.fields.map((f) => (
            <TextInput
              key={f}
              control={form.control}
              name={`${prefix}${card.key}.${f}`}
              label={f === "title" ? "Title" : "Subtitle"}
              helperText={f === "title" && card.tries ? "Use {tries} for the number of guesses." : undefined}
              multiline={f === "subtitle"}
              minRows={f === "subtitle" ? 2 : undefined}
              rules={placeholderRule(!!card.tries && f === "title")}
            />
          )),
      }))}
    />
  );
}
