import Box from "@mui/material/Box";

/**
 * Supporting-text line of a text field: the helper or error text at the start and the character
 * counter at the end, both shown at once. Pass it as `helperText`.
 */
export function FieldHelper({ text, counter, over }) {
  if (!counter) return text ?? null;
  return (
    <Box component="span" sx={{ display: "flex", gap: 2 }}>
      <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
        {text}
      </Box>
      {/* Past the limit the count turns red before the field is even validated. */}
      <Box component="span" sx={{ flexShrink: 0, fontVariantNumeric: "tabular-nums", ...(over && { color: "error.main" }) }}>
        {counter}
      </Box>
    </Box>
  );
}
