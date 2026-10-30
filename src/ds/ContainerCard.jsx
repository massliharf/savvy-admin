import Card from "@mui/material/Card";

/**
 * Content card that groups content: a form section, a list or table, an empty state. White on the
 * workspace, 16px corners, no shadow (Savvy Admin); cards and lists inside it are grey blocks.
 */
export function ContainerCard(props) {
  return <Card variant="container" {...props} />;
}
