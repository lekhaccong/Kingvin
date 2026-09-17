import { createFileRoute } from "@tanstack/react-router";
import { ClubShell } from "@/components/club/shell";
import { XocDiaTable } from "@/components/games/xocdia-table";

export const Route = createFileRoute("/play/xocdia")({
  component: () => (
    <ClubShell>
      <XocDiaTable />
    </ClubShell>
  ),
});
