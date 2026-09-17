import { createFileRoute } from "@tanstack/react-router";
import { ClubShell } from "@/components/club/shell";
import { BauCuaTable } from "@/components/games/baucua-table";

export const Route = createFileRoute("/play/baucua")({
  component: () => (
    <ClubShell>
      <BauCuaTable />
    </ClubShell>
  ),
});
