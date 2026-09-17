import { createFileRoute } from "@tanstack/react-router";
import { ClubShell } from "@/components/club/shell";
import { TaiXiuTable } from "@/components/games/taixiu-table";

export const Route = createFileRoute("/play/taixiu")({
  component: () => (
    <ClubShell>
      <TaiXiuTable />
    </ClubShell>
  ),
});
