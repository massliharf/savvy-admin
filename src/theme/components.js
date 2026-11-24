import { createElement } from "react";
import { alpha } from "@mui/material/styles";
import { Icon } from "../ds/Icon";
import { INTER_FEATURES, motion, shape, typeScale } from "./tokens";

// Component overrides, Framer style: every MUI component used by the app follows the recipes of
// Framer's editor ("Fresco", ~/Desktop/MyClaudeProjects/framer/DESIGN_SYSTEM.md §3), so pages
// never need ad-hoc colour or radius tweaks.
// - Controls are 30 tall, 8px corners, 12px text (450; buttons 550).
// - Controls are 5% fills, never outlined; panels are split by 1px dividers, never shadows.
// - Hover is fill 5% → 7%; selected is #F3F3F3 + ink (neutral) or the soft accent (chosen).
// - The accent #0099FF only marks the primary action, selection and active states.
// - Disabled is the control at 40% opacity; focus is a 1.5px accent outline 1.5px out.
export function componentOverrides(theme) {
  const c = theme.m3;
  const { elevation, fx } = theme.tokens;
  const dark = theme.palette.mode === "dark";
  const focusRing = { outline: `1.5px solid ${c.focus}`, outlineOffset: 1.5 };
  const ui = typeScale.labelLarge; // 12/550: buttons
  const base = typeScale.labelMedium; // 12/450: controls, rows, menus

  // A button family: rest / hover / pressed fills and its text colour.
  const family = (rest, hover, pressed, fg, extra = {}) => ({
    backgroundColor: rest,
    color: fg,
    "&:hover": { backgroundColor: hover },
    "&:active": { backgroundColor: pressed },
    "&.Mui-disabled": { backgroundColor: rest, color: fg, opacity: 0.4 },
    ...extra,
  });
  // Primary: tint with its coloured depth (buttonWithDepthPrimaryShadow).
  const primary = family(c.primary, c.primaryHover, c.primaryActive, c.onPrimary, { boxShadow: fx.primary, "&.Mui-disabled": { backgroundColor: c.primary, color: c.onPrimary, opacity: 0.4, boxShadow: "none" } });
  // Secondary: the raised button — white with a #EEE hairline, no shadow — page actions like "+ New …".
  const secondary = family(c.secondary, c.secondaryHover, c.secondaryPressed, c.onSecondary, { boxShadow: `inset 0 0 0 1px ${c.cardBorder}`, "&.Mui-disabled": { backgroundColor: c.secondary, color: c.onSecondary, opacity: 0.4 } });
  // Fill: buttonBackground 5% → 7%, text #333.
  const control = family(c.ctrl, c.ctrlHover, c.ctrlPressed, c.textBody);
  const ghost = family("transparent", c.hover, c.pressed, c.textBody);
  // Destructive: buttonBackgroundDestructive with red text (Framer has no solid red button).
  const danger = family(c.errorContainer, alpha(c.error, dark ? 0.1 : 0.15), alpha(c.error, 0.2), c.error);
  const soft = (bg, fg) => family(bg, bg, bg, fg, { "&:hover": { backgroundColor: bg, filter: dark ? "brightness(1.15)" : "brightness(0.97)" } });

  // Filled = the strong family for the colour; tonal = the soft one.
  const filledByColor = { primary, secondary, info: primary, inherit: primary, error: danger, success: family(c.success.color, c.success.color, c.success.color, c.success.onColor), warning: family(c.warning.color, c.warning.color, c.warning.color, c.warning.onColor), tertiary: family(c.tertiary, c.tertiary, c.tertiary, c.onTertiary) };
  const tonalByColor = { primary: control, secondary: control, inherit: control, info: soft(c.primaryContainer, c.onPrimaryContainer), tertiary: soft(c.tertiaryContainer, c.onTertiaryContainer), error: danger, success: soft(c.success.container, c.success.onContainer), warning: soft(c.warning.container, c.warning.onContainer) };
  const variantsFor = (variant, map) => Object.entries(map).map(([color, style]) => ({ props: { variant, color }, style }));

  // Menus: menuBackground, 13px corners, 5px padding, a hairline edge (no shadow).
  const menuPaper = {
    backgroundColor: c.overlay,
    backgroundImage: "none",
    color: c.textBody,
    borderRadius: shape.menu,
    border: "none",
    // Framer §1.5: the float shadow; in dark a menu's edge is a solid #333 line.
    boxShadow: dark ? "0 3px 6px rgba(0,0,0,.08), 0 0 0 1px #333333" : elevation[3],
  };
  // Popovers: popoverBackground, 18px corners.
  const popoverPaper = { ...menuPaper, backgroundColor: dark ? c.modal : c.overlay, borderRadius: shape.dialog };
  // A menu row (GUU admin .menuItem): at least 30 tall, 4px / 10px padding so two-line rows and
  // avatars never touch the edge, 10px gap, 8px corners, 12/450 #333. Hover is #F2F2F2 with #222
  // text; the chosen row has no fill, only the #444 checkmark at the end. 16px #888 icons; a
  // second line is the muted 12px description.
  const menuRow = {
    ...base,
    minHeight: 30,
    [theme.breakpoints.up("sm")]: { minHeight: 30 },
    padding: "4px 10px",
    gap: 10,
    borderRadius: shape.sm,
    color: c.textBody,
    whiteSpace: "normal",
    "& .MuiListItemText-root": { margin: 0, minWidth: 0, flex: "1 1 auto" },
    "& .MuiListItemText-primary": { ...base, color: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    "& .MuiListItemText-secondary": { ...base, color: c.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    // Framer §3.11: menu icons #999.
    "& .MuiListItemIcon-root": { minWidth: 0, color: c.textPlaceholder },
    "& .material-symbols-rounded": { fontSize: 16, color: c.textPlaceholder, flexShrink: 0 },
    "& .MuiAvatar-root": { flexShrink: 0 },
    // The chosen row's checkmark (MenuCheck), at the end.
    "& .fr-check": { marginLeft: "auto", paddingLeft: 6, boxSizing: "content-box", color: c.menuCheck },
  };
  const menuRowStates = {
    "&:hover, &.Mui-focusVisible, &.Mui-focused": { backgroundColor: c.menuHover, color: c.textStrong },
    "&.Mui-selected, &[aria-selected='true']": {
      backgroundColor: "transparent",
      color: c.textStrong,
      "&:hover, &.Mui-focusVisible, &.Mui-focused": { backgroundColor: c.menuHover },
    },
    "&.Mui-disabled": { opacity: 1, color: c.textDisabled },
  };

  return {
    MuiCssBaseline: {
      styleOverrides: {
        html: { WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" },
        body: { backgroundColor: c.background, color: c.textBody, colorScheme: theme.palette.mode, fontFeatureSettings: INTER_FEATURES },
        // Form controls don't inherit font features by default.
        "input, textarea, select, button": { fontFeatureSettings: "inherit" },
        "::selection": { backgroundColor: c.selection, color: c.onSurface },
        "*::-webkit-scrollbar": { width: 8, height: 8 },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: c.scrollbar,
          borderRadius: 999,
          border: "2px solid transparent",
          backgroundClip: "content-box",
        },
        "*::-webkit-scrollbar-track": { background: "transparent" },
        ".material-symbols-rounded": { userSelect: "none", flexShrink: 0 },
        // Motion: new content fades in with a 4px shift, like Framer's menus and popovers.
        "@keyframes savvy-enter": { from: { opacity: 0, transform: "translateY(4px)" }, to: { opacity: 1, transform: "none" } },
        "@keyframes savvy-pop": { from: { opacity: 0, transform: "translateY(4px)" }, to: { opacity: 1, transform: "none" } },
        ".savvy-enter": { animation: `savvy-enter 160ms ${motion.emphasized} both` },
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": { animationDuration: "1ms !important", transitionDuration: "1ms !important" },
        },
      },
    },

    MuiButtonBase: { defaultProps: { disableRipple: true } },

    // ------------------------------------------------------------------ buttons
    // Framer: primary (tint) for the main action, secondary = raised (white with depth) for page
    // actions like "+ New …", tonal = fill, outlined = fill too (Framer draws no button outlines),
    // text = ghost.
    MuiButton: {
      defaultProps: { disableElevation: true, variant: "filled" },
      styleOverrides: {
        root: {
          ...ui,
          textTransform: "none",
          borderRadius: shape.sm,
          minWidth: 0,
          height: 30,
          padding: "0 10px",
          gap: 6,
          whiteSpace: "nowrap",
          transition: `background-color ${motion.effects}, color ${motion.effects}, box-shadow ${motion.effects}`,
          "&.Mui-focusVisible": focusRing,
          "&.Mui-disabled": { cursor: "default" },
        },
        sizeSmall: { height: 24, padding: "0 8px", gap: 5, borderRadius: 6 },
        // inputHeightLarge: 40 tall, 13/550.
        sizeLarge: { ...typeScale.titleMedium, height: 40, padding: "0 15px" },
        startIcon: { margin: 0, "& > *:nth-of-type(1)": { fontSize: 16, width: 16, height: 16 } },
        endIcon: { margin: 0, "& > *:nth-of-type(1)": { fontSize: 16, width: 16, height: 16 } },
      },
      variants: [
        ...variantsFor("filled", filledByColor),
        ...variantsFor("contained", filledByColor),
        ...variantsFor("tonal", tonalByColor),
        // The brand action is the primary one (Framer has a single accent).
        { props: { variant: "brand" }, style: primary },
        { props: { variant: "elevated" }, style: secondary },
        ...Object.keys(filledByColor).map((color) => ({
          props: { variant: "outlined", color },
          style: { ...(color === "error" ? danger : control), border: "none", "&:hover": { ...(color === "error" ? danger : control)["&:hover"], border: "none" } },
        })),
        // Ghost: #333 text, a fill on hover. Error stays red.
        ...Object.keys(filledByColor).map((color) => ({
          props: { variant: "text", color },
          style: { ...ghost, ...(color === "error" && { color: c.error, "&:hover": { backgroundColor: c.errorContainer } }) },
        })),
      ],
    },

    // Ghost icon: 30 square, 8px corners, icon #888 (hover: fill, darker icon).
    MuiIconButton: {
      styleOverrides: {
        root: {
          width: 30,
          height: 30,
          padding: 6,
          color: c.outline,
          borderRadius: shape.sm,
          transition: `background-color ${motion.effects}, color ${motion.effects}`,
          "&:hover": { backgroundColor: c.hover, color: c.textBody },
          "&:active": { backgroundColor: c.pressed },
          "&.Mui-focusVisible": focusRing,
          "&.Mui-disabled": { color: c.outline, opacity: 0.4 },
          "& .material-symbols-rounded": { fontSize: 16 },
        },
        sizeSmall: { width: 24, height: 24, padding: 4, borderRadius: 6, "& .material-symbols-rounded": { fontSize: 14 } },
        sizeLarge: { width: 40, height: 40, padding: 8, "& .material-symbols-rounded": { fontSize: 18 } },
        colorPrimary: { color: c.primary },
        colorError: { color: c.error, "&:hover": { backgroundColor: c.errorContainer, color: c.error } },
        edgeStart: { marginLeft: -6 },
        edgeEnd: { marginRight: -6 },
      },
    },

    MuiFab: {
      defaultProps: { color: "primary" },
      styleOverrides: {
        root: { ...ui, textTransform: "none", borderRadius: shape.sm, boxShadow: fx.primary, "&:hover": { boxShadow: fx.primary }, "&:active": { boxShadow: fx.primary } },
        primary: primary,
        secondary: secondary,
        extended: { height: 40, padding: "0 15px", gap: 6, borderRadius: shape.sm },
      },
    },

    // Segmented control: a 30-tall fill track (padding 1, 8px corners); options are 28-tall,
    // 6px corners, #999 text; the chosen one is the white sliding pill with tint text.
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: { display: "inline-flex", gap: 0, padding: 1, borderRadius: shape.sm, backgroundColor: c.ctrl, maxWidth: "100%" },
        grouped: { border: "none !important", margin: "0 !important", borderRadius: `${shape.segment}px !important` },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          ...base,
          textTransform: "none",
          height: 28,
          padding: "0 10px",
          gap: 6,
          whiteSpace: "nowrap",
          border: "none",
          borderRadius: shape.segment,
          backgroundColor: "transparent",
          color: c.segmentIdle,
          transition: `background-color ${motion.effects}, color ${motion.effects}`,
          "&:hover": { backgroundColor: "transparent", color: c.onSurfaceVariant },
          "&.Mui-selected, &.Mui-selected:hover": { backgroundColor: c.segment, color: c.segmentText, boxShadow: fx.segment },
          "&.Mui-focusVisible": focusRing,
          "&.Mui-disabled": { opacity: 0.4 },
          "& .material-symbols-rounded": { fontSize: 16 },
        },
        sizeSmall: { height: 22, padding: "0 8px" },
        sizeLarge: { height: 28, padding: "0 12px" },
      },
    },

    // ------------------------------------------------------------------ surfaces
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: "none" } } },
    // Card (Framer card logic): white, 15px corners, a 1px #EEE hairline, no shadow; a card that
    // opens something turns #FAFAFA on hover.
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: shape.card,
          backgroundColor: c.surfaceCard,
          boxShadow: `inset 0 0 0 1px ${c.cardBorder}`,
          overflow: "hidden",
          transition: `background-color ${motion.effects}`,
          // Hover (GUU tile): #FAFAFA and a slightly darker hairline, so it reads on white.
          "&:has(.MuiCardActionArea-root:hover)": { backgroundColor: c.surfaceCardHover, boxShadow: `inset 0 0 0 1px ${c.cardBorderHover}` },
          // A card inside a card, sheet or dialog is a settings entry (5% fill), and inside a
          // row it's white again.
          ".MuiCard-root &, .MuiDrawer-paper &, .MuiDialog-paper &": { backgroundColor: c.surfaceContainerHigh, borderRadius: shape.md, boxShadow: "none" },
          ".MuiCard-root &:has(.MuiCardActionArea-root:hover), .MuiDrawer-paper &:has(.MuiCardActionArea-root:hover), .MuiDialog-paper &:has(.MuiCardActionArea-root:hover)": { boxShadow: "none", backgroundColor: c.surfaceContainerHighest },
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
        root: { "&:hover .MuiCardActionArea-focusHighlight": { opacity: 0 } },
        focusHighlight: { backgroundColor: c.onSurface },
      },
    },
    MuiCardContent: { styleOverrides: { root: { padding: 15, "&:last-child": { paddingBottom: 15 } } } },

    // Dialog: modalBackground, 18px corners, a hairline edge (no shadow); a 16/550 title, 12px body,
    // actions at the foot under a modalSeparator line.
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: c.dialog,
          borderRadius: shape.dialog,
          boxShadow: elevation[4],
          minWidth: 260,
          animation: `savvy-pop 160ms ${motion.emphasized} both`,
        },
        paperFullScreen: { borderRadius: 0, border: "none", boxShadow: "none" },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { ...typeScale.headlineSmall, color: c.onSurface, padding: "15px 20px 10px" } },
    },
    MuiDialogContent: { styleOverrides: { root: { ...typeScale.bodyMedium, padding: "0 20px 20px", color: c.textBody, ".MuiDialogTitle-root + &": { paddingTop: 6 } } } },
    MuiDialogContentText: { styleOverrides: { root: { ...typeScale.bodyMedium, color: c.onSurfaceVariant } } },
    MuiDialogActions: {
      styleOverrides: { root: { padding: "10px 20px", gap: 10, borderTop: `1px solid ${c.border}`, ".MuiDialogContent-dividers + &": { borderTop: "none" }, "& > :not(style) ~ :not(style)": { marginLeft: 0 } } },
    },
    // modalBackdrop: 40% black (70% in dark), no blur.
    MuiBackdrop: {
      styleOverrides: {
        root: { backgroundColor: c.backdrop, "&.MuiBackdrop-invisible": { backgroundColor: "transparent" } },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: c.dialog, border: "none", boxShadow: elevation[4] },
        paperAnchorBottom: { borderTopLeftRadius: shape.dialog, borderTopRightRadius: shape.dialog },
      },
    },

    MuiPopover: { defaultProps: { transitionDuration: { enter: 120, exit: 100 } }, styleOverrides: { paper: popoverPaper } },
    // Menus open under their button, left-aligned, 5px below it, 240 wide, padding 5.
    MuiMenu: {
      defaultProps: {
        elevation: 0,
        transitionDuration: { enter: 120, exit: 100 },
        anchorOrigin: { vertical: "bottom", horizontal: "left" },
        transformOrigin: { vertical: "top", horizontal: "left" },
      },
      styleOverrides: {
        paper: { ...menuPaper, minWidth: 200, marginTop: 5 },
        list: {
          padding: 5,
          display: "flex",
          flexDirection: "column",
          gap: 0,
          "& > .MuiDivider-root": { margin: "5px 0", borderColor: c.menuSeparator },
          // A heading inside a menu (GUU .menuHeading): 6 / 10 / 4 padding, muted 12px.
          "& > .MuiListSubheader-root": { ...base, color: c.textMuted, lineHeight: "16px", padding: "6px 10px 4px", backgroundColor: "transparent", position: "static" },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          ...menuRow,
          transition: `background-color ${motion.effectsFast}`,
          ...menuRowStates,
        },
      },
    },
    MuiAutocomplete: {
      defaultProps: { popupIcon: createElement(Icon, { name: "keyboard_arrow_down", size: 16 }) },
      styleOverrides: {
        popupIndicator: { color: c.textMuted, "& .material-symbols-rounded": { fontSize: 16 } },
        // Opens 5px from its field, like every menu.
        paper: { ...menuPaper, margin: "5px 0" },
        inputRoot: {
          "&.MuiFilledInput-root": { padding: "0 6px 0 2px" },
          "& .MuiFilledInput-input.MuiAutocomplete-input": { padding: "7px 6px" },
        },
        endAdornment: { right: "6px !important", "& .MuiSvgIcon-root": { fontSize: 16 } },
        listbox: {
          padding: 5,
          "& .MuiAutocomplete-option": {
            ...menuRow,
            ...menuRowStates,
            '&[aria-selected="true"].Mui-focused': { backgroundColor: c.menuHover },
            // The chosen option's checkmark (the same as MenuCheck), drawn with the icon font.
            '&[aria-selected="true"]::after': { content: '"check"', fontFamily: '"Material Symbols Rounded"', fontSize: 16, lineHeight: 1, marginLeft: "auto", paddingLeft: 6, color: c.menuCheck, fontFeatureSettings: '"liga"' },
          },
          "& .MuiListSubheader-root": { ...base, color: c.textMuted, lineHeight: "16px", padding: "6px 10px 4px", backgroundColor: c.overlay },
        },
        noOptions: { ...typeScale.bodySmall, color: c.textMuted },
        tag: { margin: 2 },
      },
    },

    // Date / time pickers (MUI X): calendarPrimary tint for the chosen day.
    MuiPickersPopper: { styleOverrides: { paper: popoverPaper } },
    MuiPickersLayout: { styleOverrides: { root: { backgroundColor: "transparent" } } },
    MuiPickersDay: {
      styleOverrides: {
        root: {
          ...base,
          borderRadius: shape.sm,
          "&:hover": { backgroundColor: c.hover },
          "&.Mui-selected": { backgroundColor: c.primary, color: c.onPrimary, "&:hover, &:focus": { backgroundColor: c.primaryHover } },
          "&.MuiPickersDay-today:not(.Mui-selected)": { border: "none", color: c.primary },
        },
      },
    },
    MuiPickersCalendarHeader: { styleOverrides: { label: typeScale.titleSmall } },
    MuiDayCalendar: { styleOverrides: { weekDayLabel: { ...typeScale.labelMedium, color: c.textMuted } } },
    MuiMultiSectionDigitalClockSection: {
      styleOverrides: {
        item: { ...base, borderRadius: shape.sm, "&.Mui-selected": { backgroundColor: c.primary, color: c.onPrimary, "&:hover, &:focus": { backgroundColor: c.primaryHover } } },
      },
    },

    // Tooltip: tooltipBackground (white / #242424), #222 text, 10px corners, 30 tall, hairline edge.
    MuiTooltip: {
      defaultProps: { enterDelay: 400, disableInteractive: true },
      styleOverrides: {
        tooltip: { ...base, backgroundColor: c.tooltip, color: c.onSurface, borderRadius: shape.tooltip, padding: "7px 10px", minHeight: 30, boxSizing: "border-box", maxWidth: 260,
          boxShadow: elevation[3],
          // Framer §3.14: 10px from what it describes.
          ".MuiTooltip-popper[data-popper-placement*='bottom'] &": { marginTop: "10px" },
          ".MuiTooltip-popper[data-popper-placement*='top'] &": { marginBottom: "10px" },
          ".MuiTooltip-popper[data-popper-placement*='right'] &": { marginLeft: "10px" },
          ".MuiTooltip-popper[data-popper-placement*='left'] &": { marginRight: "10px" },
        },
        arrow: { color: c.tooltip },
      },
    },

    MuiDivider: { styleOverrides: { root: { borderColor: c.border } } },

    // ------------------------------------------------------------------ inputs
    // Framer's input: 30 tall, 8px corners, a 5% fill with no line (7% on hover), #222 text, 8px
    // sides, #999 placeholder. Focused: a 1px tint edge; wrong: #F55B5B. Label above in #666.
    MuiTextField: { defaultProps: { variant: "filled", fullWidth: true } },
    MuiFormControl: { defaultProps: { variant: "filled" } },
    MuiFilledInput: {
      defaultProps: { disableUnderline: true },
      styleOverrides: {
        root: {
          ...base,
          color: c.onSurface,
          backgroundColor: c.field,
          borderRadius: shape.sm,
          boxShadow: "none",
          transition: `box-shadow ${motion.effects}, background-color ${motion.effects}`,
          "&:hover": { backgroundColor: c.fieldHover },
          "&.Mui-focused": { backgroundColor: c.field, boxShadow: `inset 0 0 0 1px ${c.fieldActive}` },
          "&.Mui-error": { boxShadow: `inset 0 0 0 1px ${c.fieldError}`, color: c.fieldError },
          "&.Mui-disabled": { color: c.textDisabled, backgroundColor: c.field },
          "& .MuiInputAdornment-root": { color: c.outline, marginTop: "0 !important" },
          "& .MuiInputAdornment-root .material-symbols-rounded": { fontSize: 16 },
        },
        input: { height: 16, padding: "7px 8px", "&::placeholder": { color: c.textPlaceholder, opacity: 1 }, "&.Mui-disabled": { WebkitTextFillColor: c.textDisabled } },
        inputSizeSmall: { padding: "4px 8px" },
        inputHiddenLabel: { padding: "7px 8px" },
        sizeSmall: { "& .MuiFilledInput-inputHiddenLabel": { padding: "4px 8px" } },
        multiline: { padding: "7px 8px", lineHeight: 1.6 },
        inputMultiline: { padding: 0, height: "auto", lineHeight: 1.6 },
        adornedStart: { paddingLeft: 8, gap: 0, "& .MuiInputAdornment-positionStart": { marginRight: 6 }, "& .MuiFilledInput-input": { paddingLeft: 0 } },
        adornedEnd: { paddingRight: 8 },
      },
    },
    MuiInputLabel: {
      defaultProps: { shrink: true },
      styleOverrides: {
        root: { ...base, color: c.onSurfaceVariant, "&.Mui-focused": { color: c.onSurfaceVariant }, "&.Mui-error": { color: c.fieldError }, "&.Mui-disabled": { color: c.textDisabled } },
        filled: {
          position: "static",
          transform: "none",
          marginBottom: 6,
          maxWidth: "100%",
          "&.MuiInputLabel-shrink, &.MuiInputLabel-sizeSmall, &.MuiInputLabel-sizeSmall.MuiInputLabel-shrink": { transform: "none" },
        },
      },
    },
    MuiFormLabel: { styleOverrides: { root: { ...base, color: c.onSurfaceVariant, "&.Mui-focused": { color: c.onSurfaceVariant } } } },
    MuiFormHelperText: {
      styleOverrides: { root: { ...typeScale.bodySmall, margin: "6px 0 0", color: c.textMuted, "&.Mui-error": { color: c.fieldError } } },
    },
    MuiSelect: {
      defaultProps: { variant: "filled", disableUnderline: true, MenuProps: { elevation: 0 }, IconComponent: (props) => createElement(Icon, { ...props, name: "keyboard_arrow_down", size: 16 }) },
      styleOverrides: { select: { paddingRight: "30px !important" }, icon: { color: c.textMuted, right: 8, top: "calc(50% - 8px)" }, iconOpen: { color: c.textBody } },
    },
    MuiInputAdornment: { styleOverrides: { root: { color: c.outline } } },

    MuiFormControlLabel: {
      styleOverrides: {
        root: { marginLeft: 0, gap: 6, "&.Mui-disabled .MuiFormControlLabel-label": { color: c.textDisabled } },
        label: { ...typeScale.bodyMedium, color: c.textBody },
        labelPlacementStart: { marginRight: 0 },
      },
    },

    // Toggle: 30×20 track (#EEE off, tint on), a 16px white tack with a hairline (no shadow).
    MuiSwitch: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: { width: 30, height: 20, padding: 0, overflow: "visible" },
        switchBase: {
          padding: 2,
          top: 0,
          left: 0,
          transition: `transform ${motion.spatialFast}`,
          "&:hover": { backgroundColor: "transparent" },
          "&.Mui-focusVisible + .MuiSwitch-track": focusRing,
          "&.Mui-checked": {
            transform: "translateX(10px)",
            "& .MuiSwitch-input": { left: -10 },
            "&:hover": { backgroundColor: "transparent" },
            "& + .MuiSwitch-track": { backgroundColor: c.primary, opacity: 1 },
          },
          "&.Mui-disabled": { "& + .MuiSwitch-track": { opacity: 0.4 }, "&.Mui-checked + .MuiSwitch-track": { opacity: 0.4 } },
        },
        thumb: {
          width: 16,
          height: 16,
          boxSizing: "border-box",
          backgroundColor: "#FFFFFF",
          backgroundImage: dark ? "none" : "linear-gradient(0deg, #FAFAFA 0%, #FFFFFF 100%)",
          border: dark ? "none" : "1px solid rgba(0,0,0,.08)",
          boxShadow: fx.tack,
        },
        track: { boxSizing: "border-box", borderRadius: 10, backgroundColor: c.track, opacity: 1, transition: `background-color ${motion.spatialFast}` },
        input: { left: 0, width: 30 },
      },
    },
    // Checkbox: 14×14, 4px corners, #F5F5F5 with a 10% inset ring; checked = tint with a white tick.
    MuiCheckbox: {
      defaultProps: {
        icon: createElement("span", { className: "fr-box" }),
        checkedIcon: createElement("span", { className: "fr-box fr-on" }, createElement(Icon, { name: "check", size: 12 })),
        indeterminateIcon: createElement("span", { className: "fr-box fr-on" }, createElement(Icon, { name: "remove", size: 12 })),
      },
      styleOverrides: {
        root: {
          padding: 8,
          borderRadius: shape.sm,
          "&:hover": { backgroundColor: "transparent" },
          "& .fr-box": { width: 14, height: 14, borderRadius: shape.checkbox, boxSizing: "border-box", display: "grid", placeItems: "center", backgroundColor: c.surfaceCard, boxShadow: fx.ring, color: "#FFFFFF", transition: `background-color ${motion.effects}` },
          "& .fr-box .material-symbols-rounded": { fontSize: 12, fontVariationSettings: '"wght" 700' },
          "& .fr-on": { backgroundColor: c.primary, boxShadow: "none" },
          "&.Mui-focusVisible .fr-box": focusRing,
          "&.Mui-disabled": { opacity: 0.4 },
        },
      },
    },
    // Radio: 14px, #F5F5F5 with an inset ring; chosen = tint with a white centre.
    MuiRadio: {
      defaultProps: {
        icon: createElement("span", { className: "fr-radio" }),
        checkedIcon: createElement("span", { className: "fr-radio fr-on" }),
      },
      styleOverrides: {
        root: {
          padding: 8,
          "&:hover": { backgroundColor: "transparent" },
          // Unchecked boxes and radios are the card colour with the ring, so they also read on the
          // #F5F5F5 rows they often sit in (Framer's #F5F5F5 fill vanishes there).
          "& .fr-radio": { width: 14, height: 14, borderRadius: "50%", boxSizing: "border-box", display: "block", backgroundColor: c.surfaceCard, boxShadow: fx.ring },
          "& .fr-radio.fr-on": { backgroundColor: "#FFFFFF", boxShadow: `inset 0 0 0 4px ${c.primary}` },
          "&.Mui-focusVisible .fr-radio": focusRing,
          "&.Mui-disabled": { opacity: 0.4 },
        },
      },
    },
    // Slider: a 3px track (tint over #DDD) and a 12px white knob with a hairline.
    MuiSlider: {
      styleOverrides: {
        root: { color: c.primary, height: 3, padding: "13px 0" },
        rail: { backgroundColor: c.sliderRest, opacity: 1, borderRadius: 2 },
        track: { border: "none", borderRadius: 2, backgroundColor: dark ? "rgba(255,255,255,.4)" : c.primary },
        thumb: { width: 12, height: 12, backgroundColor: "#FFFFFF", border: "none", boxShadow: fx.knob, "&:hover, &.Mui-focusVisible, &.Mui-active": { boxShadow: fx.knob }, "&.Mui-focusVisible": focusRing, "&::before": { boxShadow: "none" } },
        valueLabel: { ...base, backgroundColor: c.tooltip, color: c.onSurface, borderRadius: shape.sm, boxShadow: elevation[3] },
      },
    },

    // ------------------------------------------------------------------ chips & badges
    // Property chip: 30 tall, 8px corners, the 5% fill (7% on hover). Chosen = the soft accent
    // (tint text on 10% tint). Small = Framer's pill: 5% fill, #777 text, 5px corners.
    MuiChip: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          ...base,
          height: 30,
          borderRadius: shape.sm,
          color: c.textBody,
          transition: `background-color ${motion.effects}, color ${motion.effects}`,
          "& .MuiChip-icon": { color: "inherit", marginLeft: 8, marginRight: -4, fontSize: 16, width: 16, height: 16 },
          "& .MuiChip-deleteIcon": { color: c.textMuted, fontSize: 14, width: 14, height: 14, marginRight: 8, marginLeft: -4, "&:hover": { color: c.textBody } },
          "& .MuiChip-avatar": { width: 20, height: 20, marginLeft: 5, marginRight: -4 },
          "&.Mui-focusVisible": focusRing,
        },
        label: { padding: "0 10px" },
        outlined: { border: "none", backgroundColor: c.ctrl, "&.MuiChip-clickable:hover": { backgroundColor: c.ctrlHover }, "&.MuiChip-clickable:active": { backgroundColor: c.ctrlPressed } },
        // Keyboard focus (e.g. after its menu closes) keeps the chosen fill; MUI would turn it grey.
        filled: { backgroundColor: c.chosen, color: c.chosenText, "&.MuiChip-clickable:hover, &.Mui-focusVisible": { backgroundColor: c.chosen } },
        sizeSmall: {
          ...typeScale.labelSmall,
          height: 18,
          borderRadius: shape.xs,
          "&.MuiChip-outlined": { border: "none", backgroundColor: c.ctrl, color: c.pillText },
          "& .MuiChip-label": { padding: "0 5px" },
          "& .MuiChip-icon": { marginLeft: 4, marginRight: -2, fontSize: 12, width: 12, height: 12 },
        },
      },
    },
    // Counters: the tint (an error count is red).
    MuiBadge: {
      styleOverrides: {
        badge: { fontFamily: ui.fontFamily, fontSize: 9, fontWeight: 550, lineHeight: 1, minWidth: 14, height: 14, padding: "0 4px", borderRadius: 7 },
        colorPrimary: { backgroundColor: c.primary, color: c.onPrimary },
        colorError: { backgroundColor: c.error, color: c.onError },
        dot: { minWidth: 6, width: 6, height: 6, padding: 0 },
      },
    },
    MuiAvatar: { styleOverrides: { root: typeScale.titleSmall, colorDefault: { backgroundColor: c.surface2, color: c.onSurfaceVariant } } },

    // ------------------------------------------------------------------ navigation
    // Tabs: 30 tall, 10px sides, 8px corners; the chosen tab sits on #F3F3F3 in #222, the rest
    // #666. No underline.
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 30, width: "fit-content", maxWidth: "100%" },
        scroller: { padding: 0 },
        indicator: { top: 0, bottom: "auto", height: 30, borderRadius: shape.sm, backgroundColor: c.secondaryContainer, zIndex: 0, transition: `all ${motion.spatial}` },
        flexContainer: { gap: 0, position: "relative", zIndex: 1 },
        scrollButtons: { width: 24, flexShrink: 0, borderRadius: shape.sm, color: c.outline, "&.Mui-disabled": { width: 0, opacity: 0 }, "& svg": { fontSize: 16 } },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          ...base,
          textTransform: "none",
          minHeight: 30,
          height: 30,
          minWidth: 0,
          padding: "0 10px",
          borderRadius: shape.sm,
          color: c.onSurfaceVariant,
          transition: `color ${motion.effects}`,
          "&:hover": { color: c.onSurface },
          "&.Mui-selected": { color: c.onSurface },
          "&.Mui-focusVisible": focusRing,
        },
      },
    },
    MuiLink: { defaultProps: { underline: "hover" }, styleOverrides: { root: { color: c.primaryText, textDecorationColor: alpha(c.primary, 0.4) } } },
    MuiBreadcrumbs: { styleOverrides: { root: { ...base, color: c.outline } } },
    // List rows: hover fill, #F3F3F3 when it's where you are.
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: shape.sm,
          "&:hover": { backgroundColor: c.hover },
          "&.Mui-selected": { backgroundColor: c.secondaryContainer, color: c.onSecondaryContainer, "&:hover": { backgroundColor: c.secondaryContainer } },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: { primary: { ...typeScale.bodyMedium, color: c.onSurface }, secondary: { ...typeScale.bodySmall, color: c.textMuted } },
    },
    MuiListSubheader: { styleOverrides: { root: { ...typeScale.overline, color: c.textMuted, backgroundColor: "transparent", lineHeight: "30px" } } },

    // ------------------------------------------------------------------ feedback
    // Banner: 8px corners, 12px text; neutral info, tinted status.
    MuiAlert: {
      defaultProps: { variant: "standard" },
      styleOverrides: {
        root: { ...typeScale.bodyMedium, borderRadius: shape.sm, padding: "5px 10px", alignItems: "center", gap: 8 },
        icon: { marginRight: 0, padding: 0, opacity: 1, color: "inherit", "& .material-symbols-rounded": { fontSize: 16 } },
        message: { padding: "5px 0" },
        action: { padding: 0, marginRight: -4 },
        standardInfo: { backgroundColor: c.surfaceContainerHigh, color: c.textBody, "& .MuiAlert-icon": { color: c.outline } },
        standardSuccess: { backgroundColor: c.success.container, color: c.success.onContainer },
        standardWarning: { backgroundColor: c.warning.container, color: c.warning.onContainer },
        standardError: { backgroundColor: c.errorContainer, color: c.onErrorContainer },
      },
    },
    MuiAlertTitle: { styleOverrides: { root: { ...typeScale.titleSmall, marginBottom: 2 } } },
    // Toast: a dark chip in both themes (no shadow).
    MuiSnackbarContent: {
      styleOverrides: {
        root: { ...typeScale.bodyMedium, backgroundColor: c.toast, color: c.onToast, border: "none", borderRadius: shape.tooltip, boxShadow: fx.toast },
      },
    },
    // Loading bar: #222 on a 10% track.
    MuiLinearProgress: {
      styleOverrides: { root: { height: 3, borderRadius: 2, backgroundColor: c.borderStrong }, bar: { borderRadius: 2, backgroundColor: c.onSurface } },
    },
    MuiCircularProgress: { defaultProps: { thickness: 4 }, styleOverrides: { root: { color: c.outline } } },
    MuiSkeleton: {
      defaultProps: { animation: "pulse" },
      styleOverrides: { root: { backgroundColor: c.loader }, rounded: { borderRadius: shape.sm } },
    },

    // ------------------------------------------------------------------ data display
    // Table (CMS): #999 header text, 1px dividers, #222 rows.
    MuiTableCell: {
      styleOverrides: { root: { ...typeScale.bodyMedium, borderBottom: `1px solid ${c.border}`, color: c.onSurface }, head: { ...typeScale.labelMedium, color: c.textMuted } },
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
