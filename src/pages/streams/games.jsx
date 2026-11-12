// Streams › Game sets — what a new stream starts with: who can join, the showdown and its prize,
// rewards and messaging. A card opens that game set's settings.
import { useState } from "react";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import { PageToolbar } from "../../ds/Page";
import { useNotify } from "../../shell/notifications";
import { BundleCards } from "./BundleCards";
import { NewModeDialog } from "../gameModes/NewModeDialog";

export default function GameSetsPage() {
  const notify = useNotify();
  const navigate = useNavigate();
  const [newMode, setNewMode] = useState(false);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageToolbar description="What a new stream starts with: who can join, the showdown and its prize, rewards and messaging." actionLabel="New game set" onAction={() => setNewMode(true)} />
      <BundleCards onOpen={(id) => navigate(`/game-sets/${id}`)} />
      <NewModeDialog
        open={newMode}
        onClose={() => setNewMode(false)}
        onCreated={(m) => {
          setNewMode(false);
          notify(`“${m.name}” created`);
          // Opens on its settings: who can join, showdown, rewards and messaging come next.
          navigate(`/game-sets/${m.id}`);
        }}
      />
    </Box>
  );
}
