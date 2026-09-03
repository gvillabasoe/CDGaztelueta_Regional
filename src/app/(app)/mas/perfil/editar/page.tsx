import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EditProfileForm } from "./EditProfileForm";

export const dynamic = "force-dynamic";

export default async function EditarPerfilPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let nickname = "";
  let photo: string | null = null;
  let realName = session.username;

  if (session.role === "PLAYER") {
    const me = await prisma.player.findFirst({
      where: { userId: session.userId },
      select: { firstName: true, lastName: true, nickname: true, photo: true },
    });
    if (me) {
      nickname = me.nickname ?? "";
      photo = me.photo;
      realName = `${me.firstName} ${me.lastName}`.trim() || session.username;
    }
  } else {
    const u = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { nickname: true, photo: true, displayName: true },
    });
    if (u) {
      nickname = u.nickname ?? "";
      photo = u.photo;
      realName = u.displayName?.trim() || session.username;
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href="/mas/perfil"
        className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
      >
        <ChevronLeft size={16} /> Mi perfil
      </Link>
      <h1 className="font-display text-2xl font-semibold text-negro">
        Editar perfil
      </h1>
      <EditProfileForm
        initialNickname={nickname}
        initialPhoto={photo}
        realName={realName}
      />
    </div>
  );
}
