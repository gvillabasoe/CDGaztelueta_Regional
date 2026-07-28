import { prisma } from "@/lib/prisma";
import { RegistroClient } from "./RegistroClient";
import type { PlayerLite } from "@/lib/types";
import { toDateInputValue } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RegistroPage() {
  const players = await prisma.player.findMany({
    orderBy: [{ number: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      nickname: true,
      number: true,
      positions: true,
    },
  });

  const today = toDateInputValue(new Date());

  return <RegistroClient players={players as PlayerLite[]} today={today} />;
}
