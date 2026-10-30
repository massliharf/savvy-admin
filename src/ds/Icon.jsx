import { forwardRef } from "react";
import { styled } from "@mui/material/styles";

const Glyph = styled("span", { shouldForwardProp: (p) => !["fill", "size", "weight"].includes(p) })(
  ({ theme, fill, size, weight }) => ({
    fontSize: size,
    width: size,
    height: size,
    // A box of exactly its size, centred on the line, so a glyph never sits above or below the
    // text beside it.
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    lineHeight: 1,
    verticalAlign: "middle",
    overflow: "hidden",
    color: "inherit",
    fontVariationSettings: `"FILL" ${fill ? 1 : 0}, "wght" ${weight}, "GRAD" 0, "opsz" ${Math.min(Math.max(size, 20), 48)}`,
    transition: `font-variation-settings ${theme.tokens.motion.effects}`,
  }),
);

/** Material Symbols Rounded glyph at weight 400 (line icons a touch heavier than Savvy Admin's 300, to match the text). `name` is the symbol's ligature, e.g. "live_tv". */
export const Icon = forwardRef(function Icon({ name, fill = false, size = 20, weight = 400, className = "", ...rest }, ref) {
  return (
    <Glyph
      ref={ref}
      aria-hidden="true"
      className={`material-symbols-rounded ${className}`.trim()}
      fill={fill}
      size={size}
      weight={weight}
      {...rest}
    >
      {name}
    </Glyph>
  );
});
