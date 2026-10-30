import { useRef, useState } from "react";
import { Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "./Icon";

// Short lists (rounds, raffle winners, answers, sizes) as a data table, like Points per round:
// column headers, and every editable value as a field right in its cell, no dialogs. Labels that
// can't be edited stay plain text, so what's editable is plain to see.

/** Look shared by every editable cell: a field box with a hairline; firmer on hover, blue while editing. */
export function cellSx(c, tokens, error) {
  return {
    width: "100%",
    // Every editable cell is exactly a 32px control, whatever it holds (text, number, choice).
    height: 32,
    boxSizing: "border-box",
    typography: "bodyMedium",
    px: 1,
    borderRadius: `${tokens.shape.sm}px`,
    // Cells sit in grey rows, so they take the card surface (white in light, dark in dark) to stand
    // out by tone; the ink edge only while focused, red when wrong.
    bgcolor: c.surfaceCard,
    boxShadow: error ? `inset 0 0 0 1px ${c.fieldError}` : "none",
    transition: `background-color ${tokens.motion.effects}, box-shadow ${tokens.motion.effects}`,
    "&.Mui-focused, &[aria-expanded='true']": { bgcolor: c.surfaceCard, boxShadow: `inset 0 0 0 1px ${error ? c.fieldError : c.fieldActive}` },
    // A value that doesn't apply (e.g. no yellow letters in SubText) is plain text, not a field.
    "&.Mui-disabled": { bgcolor: "transparent", boxShadow: "none" },
    "& input": { py: 0, height: "100%" },
    "& input::placeholder": { color: c.onSurfaceVariant, opacity: 1 },
    "& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
  };
}

function ErrorTip({ error, children }) {
  return (
    <Tooltip title={error ?? ""} open={!!error} placement="top" arrow>
      {children}
    </Tooltip>
  );
}

/** A text value edited in its cell. */
export function TextCell({ control, name, label, rules, placeholder, inputProps, multiline, sx }) {
  const { m3: c, tokens } = useTheme();
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <ErrorTip error={fieldState.error?.message}>
          <InputBase
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            placeholder={placeholder}
            multiline={multiline}
            inputProps={{ "aria-label": label, ...inputProps }}
            sx={{ ...cellSx(c, tokens, !!fieldState.error), ...(multiline && { height: "auto", minHeight: 32, py: 0.75 }), ...sx }}
          />
        </ErrorTip>
      )}
    />
  );
}

/**
 * A number edited in its cell; `suffix` (e.g. "XP") sits after it. Right-aligned in number
 * columns; `align="left"` where the number starts a value ("5 Sparks").
 */
export function NumberCell({ control, name, label, rules, min = 0, step = 1, suffix, placeholder, align = "right", sx }) {
  const { m3: c, tokens } = useTheme();
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <ErrorTip error={fieldState.error?.message}>
          <InputBase
            type="number"
            placeholder={placeholder}
            value={field.value ?? ""}
            onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
            onBlur={field.onBlur}
            inputRef={field.ref}
            endAdornment={suffix && <Typography variant="bodySmall" color="text.secondary" sx={{ ml: 0.5 }}>{suffix}</Typography>}
            inputProps={{ "aria-label": label, min, step, style: { textAlign: align } }}
            sx={{
              ...cellSx(c, tokens, !!fieldState.error),
              fontVariantNumeric: "tabular-nums",
              ...sx,
            }}
          />
        </ErrorTip>
      )}
    />
  );
}

/**
 * A choice that fills its cell (so a column's choices line up): the value as text with ▾; a menu of `options` ({ value, label }), then
 * any `extra` actions ({ label, onClick }) below a divider.
 */
export function SelectCell({ control, name, label, options, extra = [], sx }) {
  const { m3: c, tokens } = useTheme();
  const [anchor, setAnchor] = useState(null);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <>
          <ButtonBase
            onClick={(e) => setAnchor(e.currentTarget)}
            aria-haspopup="listbox"
            aria-expanded={!!anchor}
            aria-label={`${label}: ${options.find((o) => o.value === field.value)?.label ?? "none"}`}
            sx={{ ...cellSx(c, tokens, false), width: "100%", minWidth: 0, justifyContent: "flex-start", gap: 0.5, pr: 0.75, whiteSpace: "nowrap", ...sx }}
          >
            <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", textAlign: "left" }}>
              {options.find((o) => o.value === field.value)?.label ?? "Choose"}
            </Box>
            <Icon name="keyboard_arrow_down" size={16} style={{ color: c.onSurfaceVariant, flexShrink: 0 }} />
          </ButtonBase>
          <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} slotProps={{ list: { role: "listbox", "aria-label": label } }}>
            {options.map((o) => (
              <MenuItem
                key={o.value}
                role="option"
                selected={o.value === field.value}
                aria-selected={o.value === field.value}
                onClick={() => {
                  setAnchor(null);
                  field.onChange(o.value);
                }}
              >
                {o.label}
              </MenuItem>
            ))}
            {extra.length > 0 && <Divider />}
            {extra.map((x) => (
              <MenuItem
                key={x.label}
                onClick={() => {
                  setAnchor(null);
                  x.onClick();
                }}
              >
                {x.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    />
  );
}

/**
 * A picture in its cell: a 40px thumbnail that picks a new image when clicked. `onPick(file)`
 * gets the chosen file; `error` rings it (e.g. a required icon that's missing).
 */
export function ImageCell({ src, label, onPick, error }) {
  const { m3: c, tokens } = useTheme();
  const input = useRef(null);
  return (
    <Tooltip title={src ? `Change ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}>
      <ButtonBase
        onClick={() => input.current?.click()}
        aria-label={src ? `Change ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
        sx={{ width: 32, height: 32, ml: 1, borderRadius: `${tokens.shape.sm}px`, overflow: "hidden", bgcolor: c.surfaceContainerHighest, color: error ? c.error : c.onSurfaceVariant, outline: error ? `2px solid ${c.error}` : "none", "&:hover": { opacity: 0.85 } }}
      >
        {src ? <Box component="img" src={src} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon name="add_photo_alternate" size={16} />}
        <Box component="input" ref={input} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
      </ButtonBase>
    </Tooltip>
  );
}

/**
 * The table. `columns` are { header, width (a grid track), align? }; `rows` are
 * { key, cells: [node per column], onRemove?, removeLabel?, canRemove? }. A last column holds the
 * remove buttons; `onAdd` adds a "+ addLabel" row at the bottom.
 */
export function EditTable({ label, columns, rows, onAdd, addLabel, addDisabled, minWidth = 360, reserveRemove, header = true }) {
  const { m3: c, tokens } = useTheme();
  // `reserveRemove` keeps the remove column even when no row can be removed, so tables stacked
  // in a section keep the same columns.
  const removable = reserveRemove || rows.some((r) => r.onRemove);
  const cols = [...columns.map((col) => col.width ?? "1fr"), ...(removable ? ["32px"] : [])].join(" ");
  // Rows are segments like ListGroup's: 2px apart, outer corners 12px, corners between 4px.
  const { xs, md: lg } = tokens.shape;
  const segment = (first, last) => ({
    bgcolor: c.surfaceContainerHigh,
    // Inside a block (another list's item, a card), the panel colour again.
    "[role='listitem'] &": { bgcolor: c.nested },
    borderRadius: `${first ? lg : xs}px ${first ? lg : xs}px ${last ? lg : xs}px ${last ? lg : xs}px`,
  });
  const line = { display: "grid", gridTemplateColumns: cols, alignItems: "center", columnGap: 1, px: 1.5, minHeight: 44 };
  return (
    <Box role="table" aria-label={label} sx={{ overflowX: "auto" }}>
      <Box sx={{ minWidth, display: "flex", flexDirection: "column", gap: "2px" }}>
        {/* Headers only once there are rows to head (and not where the section label already says it). */}
        {header && rows.length > 0 && (
        <Box role="row" sx={{ ...line, minHeight: 28 }}>
          {columns.map((col, i) => (
            <Typography key={i} role="columnheader" variant="overline" color="text.secondary" sx={{ px: parseInt(col.width) <= 16 ? 0 : 1, textAlign: col.align ?? "left" }} noWrap>
              {col.header}
            </Typography>
          ))}
          {removable && <span role="columnheader" aria-label="Remove" />}
        </Box>
        )}
        {rows.map((r, i) => (
          <Box key={r.key} role="row" sx={{ ...line, ...segment(i === 0, i === rows.length - 1 && !onAdd) }}>
            {r.cells.map((cell, i) => (
              <Box key={i} role="cell" sx={{ minWidth: 0, display: "flex", alignItems: "center", justifyContent: { right: "flex-end", center: "center" }[columns[i].align] ?? "flex-start" }}>
                {cell}
              </Box>
            ))}
            {removable && (
              <Box role="cell" sx={{ display: "flex", justifyContent: "flex-end" }}>
                {r.onRemove && (
                  <Tooltip title={r.removeLabel ?? "Remove"}>
                    <span>
                      <IconButton aria-label={r.removeLabel ?? "Remove"} disabled={r.canRemove === false} onClick={r.onRemove}>
                        <Icon name="close" size={16} />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>
        ))}
        {onAdd && (
          <ButtonBase
            onClick={onAdd}
            disabled={addDisabled}
            sx={{ ...segment(rows.length === 0, true), width: "100%", justifyContent: "flex-start", gap: 1, px: 1.5, minHeight: 44, color: addDisabled ? "text.disabled" : c.onSurface, typography: "labelLarge", "&:hover": { bgcolor: c.surfaceContainerHighest }, "&.Mui-focusVisible": { outline: `2px solid ${c.focus}`, outlineOffset: -2 } }}
          >
            <Icon name="add" size={16} />
            {addLabel}
          </ButtonBase>
        )}
      </Box>
    </Box>
  );
}
