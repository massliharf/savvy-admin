import Box from "@mui/material/Box";

/**
 * A card's corner controls (⋮ menu, drag grip, shop switch): always 8px in from the top-right
 * corner, 32px buttons 4px apart, so every card's actions sit in the same place. `centered` puts
 * them halfway down instead (one-line list rows).
 */
export function CardCorner({ centered = false, children }) {
  return (
    <Box
      sx={{
        position: "absolute",
        right: 8,
        top: centered ? "50%" : 8,
        transform: centered ? "translateY(-50%)" : "none",
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        minHeight: 32,
      }}
    >
      {children}
    </Box>
  );
}
