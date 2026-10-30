import { createElement } from "react";
import { alpha } from "@mui/material/styles";
import { Icon } from "../ds/Icon";
import { elevation, motion, shape, typeScale } from "./tokens";

// Component overrides: every MUI component used by the app follows Savvy Admin's own recipes,
// measured from its app (see /design-system.md), so pages never need ad-hoc colour or radius
// tweaks.
// - Controls are 32 tall, 8px corners, 12/500 text.
// - Surfaces are told apart by tone; a line only appears where Savvy Admin draws one (§5).
// - Every family uses the same ladder: -0 at rest, -1 on hover, -2 pressed / selected.
// - Disabled is the control at 50% opacity; focus is a 1px alpha-2 outline 4px out.
export function componentOverrides(theme) {
  const c = theme.m3;
  const dark = theme.palette.mode === "dark";
  const disabledText = alpha(c.onSurface, 0.5);
  const focusRing = { outline: `1px solid ${c.focus}`, outlineOffset: 4 };
  const ui = typeScale.labelLarge;
  const press = { transform: "scale(0.98)" };

  // A button family: rest / hover / pressed fills and its text colour.
  const family = (rest, hover, pressed, fg, extra = {}) => ({
    backgroundColor: rest,
    color: fg,
    "&:hover": { backgroundColor: hover },
    "&:active": { backgroundColor: pressed },
    "&.Mui-disabled": { backgroundColor: rest, color: fg, opacity: 0.5 },
    ...extra,
  });
  // Savvy Admin's families (design-system.md §2.3 and §7).
  const primary = family(c.primary, c.primaryHover, c.primaryHover, c.onPrimary);
  const secondary = family(c.secondary, c.secondaryHover, c.secondaryPressed, c.onSecondary);
  // The one control look (v2): opaque box + visible line, the same on every surface.
  const line = (color) => `inset 0 0 0 1px ${color}`;
  const control = family(c.ctrl, c.ctrlHover, c.ctrlPressed, c.onSurface, {
    boxShadow: line(c.ctrlBorder),
    "&:hover": { backgroundColor: c.ctrlHover, boxShadow: line(c.ctrlBorderHover) },
    "&.Mui-disabled": { backgroundColor: c.ctrl, color: c.onSurface, opacity: 0.5, boxShadow: line(c.ctrlBorder) },
  });
  const ghost = family("transparent", c.hover, c.pressed, c.onSurface);
  const outline = family("transparent", c.outlineHover, c.outlineHover, c.onSurface, {
    border: `1px solid ${c.outlineBorder}`,
    "&:hover": { backgroundColor: c.outlineHover, borderColor: c.outlineBorderHover },
    "&.Mui-disabled": { backgroundColor: "transparent", color: c.onSurface, borderColor: c.outlineBorder, opacity: 0.5 },
  });
  const danger = family(c.error, c.error, c.error, c.onError, { "&:hover": { backgroundColor: c.error, filter: "brightness(1.08)" } });
  const dangerSoft = family(c.errorContainer, c.errorContainer, c.errorContainer, c.onErrorContainer, { "&:hover": { backgroundColor: c.errorContainer, filter: "brightness(0.97)" } });

  // Filled = the strong family for the colour; tonal = the soft one.
  const filledByColor = { primary, secondary, info: primary, inherit: primary, error: danger, success: family(c.success.color, c.success.color, c.success.color, c.success.onColor), warning: family(c.warning.color, c.warning.color, c.warning.color, c.warning.onColor), tertiary: family(c.tertiary, c.tertiary, c.tertiary, c.onTertiary) };
  const tonalByColor = { primary: control, secondary: control, inherit: control, info: family(c.primaryContainer, c.primaryContainer, c.primaryContainer, c.onPrimaryContainer), tertiary: family(c.tertiaryContainer, c.tertiaryContainer, c.tertiaryContainer, c.onTertiaryContainer), error: dangerSoft, success: family(c.success.container, c.success.container, c.success.container, c.success.onContainer), warning: family(c.warning.container, c.warning.container, c.warning.container, c.warning.onContainer) };
  const variantsFor = (variant, map) => Object.entries(map).map(([color, style]) => ({ props: { variant, color }, style }));

  // Menus and popovers (Create menu): panel-4, alpha-1 hairline, 16px corners, shadow-lg.
  const menuPaper = {
    backgroundColor: c.overlay,
    backgroundImage: "none",
    color: c.onSurface,
    borderRadius: shape.lg,
    border: `1px solid ${c.border}`,
    boxShadow: elevation[3],
  };
  // A menu row: 32 tall, 8px corners, 12/400, 16px icon; hover / highlighted ghost-1.
  const menuRow = {
    ...ui,
    fontWeight: 450,
    minHeight: 32,
    [theme.breakpoints.up("sm")]: { minHeight: 32 },
    padding: "6px 8px",
    gap: 10,
    borderRadius: shape.sm,
    color: c.onSurface,
  };

  return {
    MuiCssBaseline: {
      styleOverrides: {
        html: { WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" },
        body: { backgroundColor: c.background, color: c.onSurface, colorScheme: theme.palette.mode },
        "::selection": { backgroundColor: c.primaryContainer, color: c.onSurface },
        "*::-webkit-scrollbar": { width: 10, height: 10 },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: alpha(c.onSurfaceVariant, 0.28),
          borderRadius: 999,
          border: "3px solid transparent",
          backgroundClip: "content-box",
        },
        "*::-webkit-scrollbar-track": { background: "transparent" },
        ".material-symbols-rounded": { userSelect: "none", flexShrink: 0 },
        // Motion: new content rises in; overlays slide down and fade like Savvy Admin's menus.
        "@keyframes savvy-enter": { from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "none" } },
        "@keyframes savvy-pop": { from: { opacity: 0, transform: "scale(0.98)" }, to: { opacity: 1, transform: "none" } },
        ".savvy-enter": { animation: `savvy-enter 260ms ${motion.emphasized} both` },
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": { animationDuration: "1ms !important", transitionDuration: "1ms !important" },
        },
      },
    },

    MuiButtonBase: { defaultProps: { disableRipple: true } },

    // ------------------------------------------------------------------ buttons
    // Savvy Admin: primary (blue) for the main action, secondary (inverted) for page actions like
    // "+ New …", tonal = default (grey fill), outlined = outline, text = ghost (ink, not blue).
    MuiButton: {
      defaultProps: { disableElevation: true, variant: "filled" },
      styleOverrides: {
        root: {
          ...ui,
          textTransform: "none",
          borderRadius: shape.sm,
          minWidth: 0,
          height: 32,
          padding: "0 16px",
          gap: 8,
          whiteSpace: "nowrap",
          transition: `background-color 150ms ease-in-out, color 150ms ease-in-out, border-color 150ms ease-in-out, transform 120ms ${motion.emphasized}`,
          "&:active:not(.Mui-disabled)": press,
          "&.Mui-focusVisible": focusRing,
          "&.Mui-disabled": { cursor: "default" },
        },
        sizeSmall: { height: 32, padding: "0 12px", gap: 6 },
        // Generate: 40 tall, 14/500.
        sizeLarge: { ...typeScale.bodyLarge, fontWeight: 550, height: 40, padding: "0 16px" },
        startIcon: { margin: 0, "& > *:nth-of-type(1)": { fontSize: 16, width: 16, height: 16 } },
        endIcon: { margin: 0, "& > *:nth-of-type(1)": { fontSize: 16, width: 16, height: 16 } },
      },
      variants: [
        ...variantsFor("filled", filledByColor),
        ...variantsFor("contained", filledByColor),
        ...variantsFor("tonal", tonalByColor),
        // Savvy Admin's pink "+ Create": the brand action, ink icon.
        { props: { variant: "brand" }, style: family(c.brand, c.brand, c.brand, c.onBrand, { "&:hover": { backgroundColor: c.brand, filter: "brightness(1.06)" } }) },
        { props: { variant: "elevated" }, style: outline },
        ...Object.keys(filledByColor).map((color) => ({
          props: { variant: "outlined", color },
          style: color === "error" ? { ...outline, color: c.error, border: `1px solid ${alpha(c.error, 0.4)}`, "&:hover": { backgroundColor: alpha(c.error, 0.08), borderColor: c.error } } : outline,
        })),
        // Ghost: ink text, ghost-1 on hover. Error stays red.
        ...Object.keys(filledByColor).map((color) => ({
          props: { variant: "text", color },
          style: { ...ghost, ...(color === "error" && { color: c.error }), ...(color === "primary" && { color: c.onSurface }) },
        })),
      ],
    },

    // Icon button: ghost, 32 square, 8px corners.
    MuiIconButton: {
      styleOverrides: {
        root: {
          width: 32,
          height: 32,
          padding: 6,
          color: c.onSurface,
          borderRadius: shape.sm,
          transition: "background-color 150ms ease-in-out",
          "&:hover": { backgroundColor: c.hover },
          "&:active": { backgroundColor: c.pressed },
          "&.Mui-focusVisible": focusRing,
          "&.Mui-disabled": { color: c.onSurface, opacity: 0.5 },
          "& .material-symbols-rounded": { fontSize: 18 },
        },
        sizeSmall: { width: 28, height: 28, padding: 5, borderRadius: 6, "& .material-symbols-rounded": { fontSize: 16 } },
        sizeLarge: { width: 40, height: 40, padding: 8 },
        colorPrimary: { color: c.primary },
        colorError: { color: c.error, "&:hover": { backgroundColor: alpha(c.error, 0.1) } },
        edgeStart: { marginLeft: -6 },
        edgeEnd: { marginRight: -6 },
      },
    },

    MuiFab: {
      defaultProps: { color: "primary" },
      styleOverrides: {
        root: { ...ui, textTransform: "none", borderRadius: shape.sm, boxShadow: elevation[1], "&:hover": { boxShadow: elevation[1] }, "&:active": { boxShadow: elevation[1] } },
        primary: primary,
        secondary: secondary,
        extended: { height: 40, padding: "0 16px", gap: 8, borderRadius: shape.sm },
      },
    },

    // Segmented control = Savvy Admin's filter pills ("My spaces / Shared / Templates"): no track,
    // 32-tall round pills; the chosen one is surface-3 in ink, the others fg-3.
    MuiToggleButtonGroup: {
      styleOverrides: {
        // A segmented control: the options sit in a lined track, so every option reads as a button
        // and the chosen one as the raised pill.
        root: { display: "inline-flex", gap: 2, padding: 2, borderRadius: 999, backgroundColor: c.track, maxWidth: "100%" },
        grouped: { border: "none !important", margin: "0 !important", borderRadius: "999px !important" },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          ...ui,
          textTransform: "none",
          height: 28,
          padding: "0 14px",
          gap: 6,
          whiteSpace: "nowrap",
          border: "none",
          borderRadius: 999,
          backgroundColor: "transparent",
          color: c.onSurfaceVariant,
          transition: "background-color 150ms ease-in-out, color 150ms ease-in-out",
          "&:hover": { backgroundColor: c.hover, color: c.onSurface },
          "&.Mui-selected, &.Mui-selected:hover": { backgroundColor: c.segment, color: c.onSurface, boxShadow: elevation[1] },
          // On a grey block the block is the track: the chosen item is the white pill (Savvy Admin's segmented).
          "&.Mui-focusVisible": focusRing,
          "& .material-symbols-rounded": { fontSize: 16 },
        },
        sizeSmall: { height: 24, padding: "0 10px" },
        sizeLarge: { height: 28, padding: "0 14px" },
      },
    },

    // ------------------------------------------------------------------ surfaces
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: "none" } } },
    // Card: a panel-4 (white) on the panel-2 workspace, 16px corners, no line or shadow (Savvy Admin).
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: shape.lg,
          backgroundColor: c.surfaceCard,
          boxShadow: "none",
          overflow: "hidden",
          transition: `box-shadow 150ms ease-in-out`,
          // A card that opens something lifts on hover (a static card never changes), so what's
          // clickable reads at a glance; the tone change below does it in dark, where shadows vanish.
          "&:has(.MuiCardActionArea-root:hover)": { boxShadow: elevation[2] },
          // Cards are white on the grey workspace; a card inside a card, sheet or dialog is a grey
          // block, and inside a grey row it's white again.
          ".MuiCard-root &, .MuiDrawer-paper &, .MuiDialog-paper &": { backgroundColor: c.surfaceContainerHigh, borderRadius: shape.md, boxShadow: "none" },
          "[role='listitem'] &": { backgroundColor: c.nested, borderRadius: shape.md, boxShadow: "none" },
        },
      },
      variants: [
        { props: { variant: "outlined" }, style: { backgroundColor: c.surfaceCard } },
        { props: { variant: "filled" }, style: { backgroundColor: c.surfaceCard } },
        { props: { variant: "container" }, style: { backgroundColor: c.surfaceCard } },
        { props: { variant: "elevated" }, style: { backgroundColor: c.surfaceCard } },
      ],
    },
    MuiCardActionArea: {
      styleOverrides: {
        // Hover: the same tone step as every clickable row (palette action.hover).
        root: { "&:hover .MuiCardActionArea-focusHighlight": { opacity: dark ? 0.07 : 0.05 } },
        focusHighlight: { backgroundColor: c.onSurface },
      },
    },
    MuiCardContent: { styleOverrides: { root: { padding: 16, "&:last-child": { paddingBottom: 16 } } } },

    // Dialog: surface-1, alpha-0 line, 16px corners, shadow-xl; a 14/600 title row with an alpha-1
    // line under it, 14px fg-2 body, actions at the foot.
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: c.dialog,
          borderRadius: shape.lg,
          boxShadow: elevation[4],
          minWidth: 280,
          animation: `savvy-pop 220ms ${motion.emphasized} both`,
        },
        paperFullScreen: { borderRadius: 0, border: "none", boxShadow: "none" },
      },
    },
    MuiDialogTitle: {
      // The same header as a side sheet: 20/600, no rule under it.
      styleOverrides: { root: { ...typeScale.headlineSmall, color: c.onSurface, padding: "16px 20px 12px" } },
    },
    // Body like a side sheet's: 20px sides, fields 16px apart, 8px under the title (room for labels).
    MuiDialogContent: { styleOverrides: { root: { ...typeScale.bodyLarge, padding: "0 20px 20px", color: c.textBody, ".MuiDialogTitle-root + &": { paddingTop: 8 } } } },
    MuiDialogContentText: { styleOverrides: { root: { ...typeScale.bodyLarge, color: c.textBody } } },
    MuiDialogActions: {
      // The same footer as a side sheet: a rule above, 12px/20px around the buttons.
      styleOverrides: { root: { padding: "12px 20px", gap: 8, borderTop: `1px solid ${c.border}`, ".MuiDialogContent-dividers + &": { borderTop: "none" }, "& > :not(style) ~ :not(style)": { marginLeft: 0 } } },
    },
    // Behind dialogs and sheets: neutral-900 at 80% with a blur.
    MuiBackdrop: {
      styleOverrides: {
        root: { backgroundColor: c.backdrop, backdropFilter: "blur(4px)", "&.MuiBackdrop-invisible": { backgroundColor: "transparent", backdropFilter: "none" } },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: c.dialog, border: "none", boxShadow: elevation[4] },
        // No edge line: the backdrop and shadow set a sheet apart (Savvy Admin uses tone, not lines).
        paperAnchorBottom: { borderTopLeftRadius: shape.lg, borderTopRightRadius: shape.lg },
      },
    },

    MuiPopover: { defaultProps: { transitionDuration: { enter: 180, exit: 120 } }, styleOverrides: { paper: menuPaper } },
    // Menus open under their button, left-aligned, 6px below it, 224 wide, py 8.
    MuiMenu: {
      defaultProps: {
        elevation: 0,
        transitionDuration: { enter: 180, exit: 120 },
        anchorOrigin: { vertical: "bottom", horizontal: "left" },
        transformOrigin: { vertical: "top", horizontal: "left" },
      },
      styleOverrides: {
        paper: { ...menuPaper, minWidth: 224, marginTop: 6 },
        list: { padding: 6, display: "flex", flexDirection: "column", gap: 2, "& > .MuiDivider-root": { margin: "4px -6px" } },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          ...menuRow,
          transition: "background-color 150ms",
          "&:hover": { backgroundColor: c.hover },
          "&.Mui-focusVisible": { backgroundColor: c.hover, outline: `2px solid ${c.border}`, outlineOffset: 2 },
          "&.Mui-selected": {
            backgroundColor: c.pressed,
            color: c.onSurface,
            "&:hover": { backgroundColor: c.pressed },
            "&.Mui-focusVisible": { backgroundColor: c.pressed },
          },
          "&.Mui-disabled": { opacity: 0.5 },
          "& .MuiListItemIcon-root": { minWidth: 0, color: "inherit" },
          "& .material-symbols-rounded": { fontSize: 16 },
        },
      },
    },
    MuiAutocomplete: {
      defaultProps: { popupIcon: createElement(Icon, { name: "keyboard_arrow_down", size: 16 }) },
      styleOverrides: {
        popupIndicator: { "& .material-symbols-rounded": { fontSize: 16 } },
        paper: menuPaper,
        inputRoot: {
          "&.MuiFilledInput-root": { padding: "0 6px 0 4px" },
          "& .MuiFilledInput-input.MuiAutocomplete-input": { padding: "7px 8px" },
        },
        endAdornment: { right: "6px !important", "& .MuiSvgIcon-root": { fontSize: 18 } },
        listbox: { padding: 8, "& .MuiAutocomplete-option": { ...menuRow, "&.Mui-focused": { backgroundColor: c.hover }, '&[aria-selected="true"]': { backgroundColor: c.pressed } } },
        noOptions: { ...typeScale.bodySmall, color: c.onSurfaceVariant },
        tag: { margin: 2 },
      },
    },

    // Date / time pickers (MUI X): a chosen day is the primary blue.
    MuiPickersPopper: { styleOverrides: { paper: menuPaper } },
    MuiPickersLayout: { styleOverrides: { root: { backgroundColor: "transparent" } } },
    MuiPickersDay: {
      styleOverrides: {
        root: {
          ...ui,
          borderRadius: shape.sm,
          "&:hover": { backgroundColor: c.hover },
          "&.Mui-selected": { backgroundColor: c.primary, color: c.onPrimary, "&:hover, &:focus": { backgroundColor: c.primaryHover } },
          "&.MuiPickersDay-today:not(.Mui-selected)": { border: `1px solid ${c.outlineBorder}`, color: c.onSurface },
        },
      },
    },
    MuiPickersCalendarHeader: { styleOverrides: { label: typeScale.titleSmall } },
    MuiDayCalendar: { styleOverrides: { weekDayLabel: { ...typeScale.overline, color: c.onSurfaceVariant } } },
    MuiMultiSectionDigitalClockSection: {
      styleOverrides: {
        item: { ...ui, borderRadius: shape.sm, "&.Mui-selected": { backgroundColor: c.primary, color: c.onPrimary, "&:hover, &:focus": { backgroundColor: c.primaryHover } } },
      },
    },

    // Tooltip: surface-2, fg-2 text, 4px corners, 8×16 padding, shadow-lg.
    MuiTooltip: {
      defaultProps: { enterDelay: 400, disableInteractive: true },
      styleOverrides: {
        tooltip: { ...ui, fontWeight: 450, backgroundColor: c.surface2, color: c.textBody, borderRadius: shape.xs, padding: "8px 16px", maxWidth: 250, boxShadow: elevation[3] },
        arrow: { color: c.surface2 },
      },
    },

    MuiDivider: { styleOverrides: { root: { borderColor: c.border } } },

    // ------------------------------------------------------------------ inputs
    // Savvy Admin's form field: form-0 fill with a form-border-0 line; the line turns ink
    // (form-border-active) when focused, form-border-error when wrong. Label above in fg-3.
    MuiTextField: { defaultProps: { variant: "filled", fullWidth: true } },
    MuiFormControl: { defaultProps: { variant: "filled" } },
    MuiFilledInput: {
      defaultProps: { disableUnderline: true },
      styleOverrides: {
        root: {
          ...typeScale.bodyMedium,
          color: c.onSurface,
          backgroundColor: c.field,
          borderRadius: shape.sm,
          // Savvy Admin: tone, not a line — a grey fill at rest, a shade darker on hover; the ink
          // edge only while focused (red when wrong).
          boxShadow: "none",
          transition: "box-shadow 150ms ease-in-out, background-color 150ms ease-in-out",
          "&:hover": { backgroundColor: c.fieldHover },
          "&.Mui-focused": { backgroundColor: c.field, boxShadow: `inset 0 0 0 1px ${c.fieldActive}` },
          "&.Mui-error": { boxShadow: `inset 0 0 0 1px ${c.fieldError}` },
          "&.Mui-disabled": { color: c.onSurface, backgroundColor: c.field, opacity: 0.5 },
          "& .MuiInputAdornment-root": { color: c.onSurfaceVariant, marginTop: "0 !important" },
          "& .MuiInputAdornment-root .material-symbols-rounded": { fontSize: 16 },
        },
        input: { height: 18, padding: "7px 12px", "&::placeholder": { color: c.textMuted, opacity: 1 } },
        inputSizeSmall: { padding: "5px 10px" },
        inputHiddenLabel: { padding: "7px 12px" },
        sizeSmall: { "& .MuiFilledInput-inputHiddenLabel": { padding: "5px 10px" } },
        multiline: { padding: "7px 12px" },
        inputMultiline: { padding: 0, height: "auto" },
        adornedStart: { paddingLeft: 10, "& .MuiFilledInput-input": { paddingLeft: 0 } },
        adornedEnd: { paddingRight: 10 },
      },
    },
    MuiInputLabel: {
      defaultProps: { shrink: true },
      styleOverrides: {
        root: { ...ui, color: c.onSurfaceVariant, "&.Mui-focused": { color: c.onSurfaceVariant }, "&.Mui-error": { color: c.error }, "&.Mui-disabled": { color: disabledText } },
        filled: {
          position: "static",
          transform: "none",
          marginBottom: 6,
          maxWidth: "100%",
          "&.MuiInputLabel-shrink, &.MuiInputLabel-sizeSmall, &.MuiInputLabel-sizeSmall.MuiInputLabel-shrink": { transform: "none" },
        },
      },
    },
    MuiFormLabel: { styleOverrides: { root: { ...ui, color: c.onSurfaceVariant, "&.Mui-focused": { color: c.onSurfaceVariant } } } },
    MuiFormHelperText: {
      styleOverrides: { root: { ...typeScale.bodySmall, margin: "6px 0 0", color: c.onSurfaceVariant, "&.Mui-error": { color: c.error } } },
    },
    MuiSelect: {
      defaultProps: { variant: "filled", disableUnderline: true, MenuProps: { elevation: 0 }, IconComponent: (props) => createElement(Icon, { ...props, name: "keyboard_arrow_down", size: 16 }) },
      styleOverrides: { select: { paddingRight: "32px !important" }, icon: { color: c.onSurfaceVariant, right: 10, top: "calc(50% - 8px)" }, iconOpen: { color: c.onSurface } },
    },
    MuiInputAdornment: { styleOverrides: { root: { color: c.onSurfaceVariant } } },

    MuiFormControlLabel: {
      styleOverrides: {
        root: { marginLeft: 0, gap: 8, "&.Mui-disabled .MuiFormControlLabel-label": { color: disabledText } },
        label: { ...typeScale.bodyMedium, color: c.onSurface },
        labelPlacementStart: { marginRight: 0 },
      },
    },

    // Switch: a 32×16 track (surface-4 off, primary-0 on) with a 16px white knob ringed 2px in the
    // track's colour.
    MuiSwitch: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: { width: 32, height: 16, padding: 0, overflow: "visible" },
        switchBase: {
          padding: 0,
          top: 0,
          left: 0,
          color: "#FFFFFF",
          transition: "transform 300ms",
          "&:hover": { backgroundColor: "transparent" },
          "& .MuiSwitch-thumb": { border: `2px solid ${c.surface4}` },
          "&.Mui-focusVisible + .MuiSwitch-track": focusRing,
          "&.Mui-checked": {
            transform: "translateX(16px)",
            color: "#FFFFFF",
            "& .MuiSwitch-input": { left: -16 },
            "& .MuiSwitch-thumb": { borderColor: c.primary },
            "&:hover": { backgroundColor: "transparent" },
            "& + .MuiSwitch-track": { backgroundColor: c.primary, opacity: 1 },
          },
          "&.Mui-disabled": { color: "#FFFFFF", "& + .MuiSwitch-track": { opacity: 0.5 }, "&.Mui-checked + .MuiSwitch-track": { opacity: 0.5 } },
        },
        thumb: { width: 16, height: 16, boxShadow: "none", boxSizing: "border-box", transition: "border-color 300ms" },
        track: { boxSizing: "border-box", borderRadius: 8, backgroundColor: c.surface4, opacity: 1, transition: "background-color 300ms" },
        input: { left: 0, width: 32 },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: c.textMuted,
          padding: 7,
          borderRadius: shape.sm,
          "& .MuiSvgIcon-root": { fontSize: 18 },
          "&:hover": { backgroundColor: c.hover },
          "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: c.primary },
          "&.Mui-disabled": { opacity: 0.5 },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: { color: c.textMuted, padding: 7, "& .MuiSvgIcon-root": { fontSize: 18 }, "&:hover": { backgroundColor: c.hover }, "&.Mui-checked": { color: c.primary } },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: c.primary, height: 4 },
        rail: { backgroundColor: c.pressed, opacity: 1 },
        track: { border: "none" },
        thumb: { width: 16, height: 16, backgroundColor: "#FFFFFF", border: `2px solid ${c.primary}`, boxShadow: "none", "&:hover, &.Mui-focusVisible": { boxShadow: `0 0 0 4px ${alpha(c.primary, 0.16)}` } },
      },
    },

    // ------------------------------------------------------------------ chips & badges
    // Filter chip: the default-0 fill (no line), default-1 on hover; chosen = surface-3 with ink
    // is the ink pill. Small = the meta chip: surface-2, 4px corners, no line.
    MuiChip: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          ...ui,
          height: 32,
          borderRadius: shape.sm,
          color: c.onSurface,
          transition: "background-color 150ms ease-in-out",
          "& .MuiChip-icon": { color: "inherit", marginLeft: 10, marginRight: -6, fontSize: 16, width: 16, height: 16 },
          "& .MuiChip-deleteIcon": { color: c.onSurfaceVariant, fontSize: 16, width: 16, height: 16, marginRight: 8, marginLeft: -6, "&:hover": { color: c.onSurface } },
          "& .MuiChip-avatar": { width: 20, height: 20, marginLeft: 6, marginRight: -6 },
          "&.Mui-focusVisible": focusRing,
        },
        label: { padding: "0 12px" },
        outlined: { border: "none", backgroundColor: c.ctrl, boxShadow: line(c.ctrlBorder), "&.MuiChip-clickable:hover": { backgroundColor: c.ctrlHover, boxShadow: line(c.ctrlBorderHover) }, "&.MuiChip-clickable:active": { backgroundColor: c.ctrlPressed } },
        // Chosen: surface-3, like Savvy Admin's chosen filter.
        filled: { backgroundColor: c.chosen, color: c.onSurface, "&.MuiChip-clickable:hover": { backgroundColor: c.chosen } },
        sizeSmall: {
          ...typeScale.labelSmall,
          height: 18,
          borderRadius: shape.xs,
          "&.MuiChip-outlined": { border: "none", backgroundColor: c.surface2 },
          "& .MuiChip-label": { padding: "0 4px" },
          "& .MuiChip-icon": { marginLeft: 4, marginRight: -2, fontSize: 12, width: 12, height: 12 },
        },
      },
    },
    // Counters: Savvy Admin's pink dot (an error count is red).
    MuiBadge: {
      styleOverrides: {
        badge: { fontFamily: ui.fontFamily, fontSize: 8, fontWeight: 700, lineHeight: 1, minWidth: 14, height: 14, padding: "0 3px", borderRadius: 7 },
        colorPrimary: { backgroundColor: c.brand, color: "#FFFFFF" },
        colorError: { backgroundColor: c.error, color: c.onError },
        dot: { minWidth: 6, width: 6, height: 6, padding: 0 },
      },
    },
    MuiAvatar: { styleOverrides: { root: typeScale.titleSmall, colorDefault: { backgroundColor: c.surface2, color: c.onSurface } } },

    // ------------------------------------------------------------------ navigation
    // Pill tabs: no track; the chosen tab sits on a sliding default-0 pill; text fg-3, chosen fg-0.
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 30, width: "fit-content", maxWidth: "100%" },
        scroller: { padding: 0 },
        indicator: { top: 0, bottom: "auto", height: 30, borderRadius: 999, backgroundColor: c.ctrl, boxShadow: line(c.ctrlBorder), zIndex: 0, transition: "all 300ms ease-out" },
        flexContainer: { gap: 0, position: "relative", zIndex: 1 },
        scrollButtons: { width: 28, flexShrink: 0, borderRadius: 999, color: c.onSurfaceVariant, "&.Mui-disabled": { width: 0, opacity: 0 }, "& svg": { fontSize: 18 } },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          ...ui,
          textTransform: "none",
          minHeight: 30,
          height: 30,
          minWidth: 0,
          padding: "6px 16px",
          borderRadius: 999,
          color: c.onSurfaceVariant,
          transition: "color 200ms",
          "&:hover": { color: c.onSurface },
          "&.Mui-selected": { color: c.onSurface },
          "&.Mui-focusVisible": focusRing,
        },
      },
    },
    MuiLink: { defaultProps: { underline: "hover" }, styleOverrides: { root: { color: c.onSurface, textDecorationColor: c.borderStrong } } },
    MuiBreadcrumbs: { styleOverrides: { root: { ...ui, color: c.onSurfaceVariant } } },
    // List rows: ghost — ghost-1 on hover, ghost-2 when it's where you are.
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: shape.sm,
          "&:hover": { backgroundColor: c.hover },
          "&.Mui-selected": { backgroundColor: c.pressed, color: c.onSurface, "&:hover": { backgroundColor: c.pressed } },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: { primary: { ...typeScale.bodyMedium, fontWeight: 550, color: c.onSurface }, secondary: { ...typeScale.bodySmall, color: c.onSurfaceVariant } },
    },
    MuiListSubheader: { styleOverrides: { root: { ...typeScale.overline, color: c.textMuted, backgroundColor: "transparent", lineHeight: "32px" } } },

    // ------------------------------------------------------------------ feedback
    MuiAlert: {
      defaultProps: { variant: "standard" },
      styleOverrides: {
        root: { ...typeScale.bodyMedium, borderRadius: shape.md, padding: "8px 12px", alignItems: "center", gap: 10 },
        icon: { marginRight: 0, padding: 0, opacity: 1, color: "inherit", "& .material-symbols-rounded": { fontSize: 18 } },
        message: { padding: "4px 0" },
        action: { padding: 0, marginRight: -4 },
        standardInfo: { backgroundColor: c.surfaceContainerHigh, color: c.onSurface, "& .MuiAlert-icon": { color: c.onSurfaceVariant } },
        standardSuccess: { backgroundColor: c.success.container, color: c.success.onContainer },
        standardWarning: { backgroundColor: c.warning.container, color: c.warning.onContainer },
        standardError: { backgroundColor: c.errorContainer, color: c.onErrorContainer },
      },
    },
    MuiAlertTitle: { styleOverrides: { root: { ...typeScale.titleSmall, marginBottom: 2 } } },
    // Snackbar: surface-modal with the alpha-0 line and shadow-lg, like the account menu.
    MuiSnackbarContent: {
      styleOverrides: {
        root: { ...typeScale.bodyMedium, backgroundColor: c.modal, color: c.onSurface, border: `1px solid ${c.borderSubtle}`, borderRadius: shape.md, boxShadow: elevation[3] },
      },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { height: 4, borderRadius: 8, backgroundColor: c.pressed }, bar: { borderRadius: 8, backgroundColor: c.primary } },
    },
    MuiCircularProgress: { defaultProps: { thickness: 4 }, styleOverrides: { root: { color: c.primary } } },
    MuiSkeleton: {
      defaultProps: { animation: "wave" },
      styleOverrides: { root: { backgroundColor: c.control }, rounded: { borderRadius: shape.sm } },
    },

    // ------------------------------------------------------------------ data display
    MuiTableCell: {
      styleOverrides: { root: { ...typeScale.bodyMedium, borderBottom: `1px solid ${c.border}`, color: c.onSurface }, head: { ...typeScale.overline, color: c.onSurfaceVariant } },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          displayLarge: "h1",
          displayMedium: "h1",
          displaySmall: "h1",
          headlineLarge: "h2",
          headlineMedium: "h2",
          headlineSmall: "h3",
          titleLarge: "h3",
          titleMedium: "h4",
          titleSmall: "h5",
          bodyLarge: "p",
          bodyMedium: "p",
          bodySmall: "p",
          labelLarge: "span",
          labelMedium: "span",
          labelSmall: "span",
          overline: "span",
        },
      },
    },
  };
}
