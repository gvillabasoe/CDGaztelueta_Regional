"use server";

import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import type { RegisterInput } from "@/lib/types";

// Autorregistro de jugador por correo (§6). Vincula con una ficha existente que
// tenga el mismo correo (normalizado). Si no existe, crea una ficha PROVISIONAL
// pendiente de revisión del entrenador.
//
// NOTA: la app no dispone de proveedor de correo, por lo que no hay verificación
// por email; la vinculación se hace con el correo normalizado en el momento del
// registro. Si más adelante se añade un proveedor, aquí se exigiría verificación.
export async function registerPlayerAccount(input: RegisterInput) {
  const email = normalizeEmail(input.email);
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  if (!firstName || !lastName)
    return { ok: false as const, error: "Indica tu nombre y apellidos." };
  if (!email || !email.includes("@"))
    return { ok: false as const, error: "Introduce un correo válido." };
  if (!input.password || input.password.length < 4)
    return {
      ok: false as const,
      error: "La contraseña debe tener al menos 4 caracteres.",
    };

  // El correo se usa también como nombre de usuario para iniciar sesión.
  const existingUser = await prisma.user.findUnique({
    where: { username: email },
  });
  if (existingUser)
    return {
      ok: false as const,
      error: "Ya existe una cuenta con ese correo. Inicia sesión.",
    };

  const existing = await prisma.player.findFirst({ where: { email } });
  if (existing && existing.userId)
    return {
      ok: false as const,
      error: "Ese correo ya está vinculado a otra cuenta.",
    };

  const hash = await bcrypt.hash(input.password, 10);

  let provisional = false;
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { username: email, password: hash, role: "PLAYER" },
    });
    if (existing) {
      // Vincular la cuenta a la ficha existente (mantiene su estado).
      await tx.player.update({
        where: { id: existing.id },
        data: { userId: user.id, email },
      });
    } else {
      // Sin ficha previa: crear ficha PROVISIONAL pendiente de revisión.
      provisional = true;
      await tx.player.create({
        data: {
          firstName,
          lastName,
          email,
          status: "PENDING",
          userId: user.id,
        },
      });
    }
  });

  revalidatePath("/equipo/gestionar");
  revalidatePath("/equipo");
  return {
    ok: true as const,
    provisional,
    message: provisional
      ? "Cuenta creada. Tu ficha queda pendiente de que el entrenador la revise."
      : "Cuenta creada y vinculada a tu ficha. Ya puedes iniciar sesión.",
  };
}
