// Library › Gameplay › Game sets — what a new stream starts with: its stream image background, who
// can join, the showdown and its prize, rewards and messaging. The same cards as every library page
// (CardGrid + ShopCard); a card opens that game set's settings.
import { useState } from "react";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { PageToolbar } from "../../ds/Page";
import { CardsSkeleton } from "../../ds/Skeletons";
import { useNotify } from "../../shell/notifications";
import { CardGrid, ShopCard } from "../shop/shared";
import { bundleLine, useBundles } from "./gameModes";
import { StreamType } from "./enums";
import { NewModeDialog } from "../gameModes/NewModeDialog";

const AUDIENCE = { [StreamType.Public]: "Public", [StreamType.SuperSavvy]: "Super Savvy only", [StreamType.Internal]: "Internal" };

export default function GameSetsPage() {
  const notify = useNotify();
  const navigate = useNavigate();
  const [newMode, setNewMode] = useState(false);
  const { bundles, isLoading } = useBundles();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageToolbar description="What a new stream starts with: who can join, the showdown and its prize, rewards and messaging." actionLabel="New game set" onAction={() => setNewMode(true)} />
      {isLoading ? (
        <CardsSkeleton count={3} media={66} label="Loading game sets" />
      ) : (
        <CardGrid>
          {bundles.map((b) => (
            <ShopCard
              key={b.id}
              // Its selected stream image background (900 × 1200).
              image={b.streamImageUrl}
              aspect="3 / 4"
              icon={b.showdown?.superSavvyOnly ? "diamond" : "trophy"}
              title={b.name}
              meta={
                <>
                  <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
                    {bundleLine(b)}
                  </Typography>
                  <Typography variant="bodySmall" color="text.secondary" component="div" noWrap>
                    {AUDIENCE[b.streamType] ?? "Public"}
                  </Typography>
                </>
              }
              onOpen={() => navigate(`/game-sets/${b.id}`)}
            />
          ))}
        </CardGrid>
      )}
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
