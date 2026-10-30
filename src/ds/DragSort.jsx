import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { Icon } from "./Icon";

const stop = (e) => e.stopPropagation();

/**
 * Drag to reorder: `item(i)` goes on each row or card (it shows where a drop lands), `handle(i)` on
 * its ⠿ grip. Rows move by dragging the grip, or with the grip focused and ↑ / ↓.
 */
export function useDragSort({ count, onMove, busy }) {
  const [drag, setDrag] = useState(null); // { from, over }
  const { m3: c } = useTheme();
  const item = (i) => ({
    "data-sortable": "",
    onDragOver: (e) => {
      if (!drag) return;
      e.preventDefault();
      if (drag.over !== i) setDrag({ ...drag, over: i });
    },
    onDrop: (e) => {
      e.preventDefault();
      if (drag && drag.from !== i) onMove(drag.from, i);
      setDrag(null);
    },
    sx: {
      opacity: drag?.from === i ? 0.4 : 1,
      outline: drag && drag.over === i && drag.from !== i ? `2px solid ${c.focus}` : "none",
      outlineOffset: 2,
      transition: "opacity 120ms",
    },
  });
  const handle = (i, label) => (
    <Tooltip title="Drag to reorder">
      <IconButton
        aria-label={`Reorder ${label}. Use the arrow keys to move it.`}
        disabled={busy}
        draggable={!busy}
        onClick={stop}
        onMouseDown={stop}
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.effectAllowed = "move";
          const card = e.currentTarget.closest("[data-sortable]");
          if (card) e.dataTransfer.setDragImage(card, 24, 24);
          setDrag({ from: i, over: i });
        }}
        onDragEnd={() => setDrag(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" && i > 0) {
            e.preventDefault();
            onMove(i, i - 1);
          }
          if (e.key === "ArrowDown" && i < count - 1) {
            e.preventDefault();
            onMove(i, i + 1);
          }
        }}
        sx={{ cursor: busy ? "default" : "grab", "&:active": { cursor: "grabbing" } }}
      >
        <Icon name="drag_indicator" />
      </IconButton>
    </Tooltip>
  );
  return { item, handle };
}
