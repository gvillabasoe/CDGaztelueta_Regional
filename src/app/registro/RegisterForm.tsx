"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { registerPlayerAccount } from "@/actions/register";

export function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await registerPlayerAccount({
      firstName,
      lastName,
      email,
      password,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(res.message);
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
          <Check size={26} />
        </div>
        <p className="text-sm text-negro">{done}</p>
        <button
          className="btn-primary mt-4 w-full"
          onClick={() => router.replace("/login")}
        >
          Ir a iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Nombre</label>
          <input
            className="field"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Apellidos</label>
          <input
            className="field"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label">Correo electrónico</label>
        <input
          className="field"
          type="email"
          autoCapitalize="none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Contraseña</label>
        <input
          className="field"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <p className="rounded-lg bg-amarillo/25 px-3 py-2 text-sm">{error}</p>
      )}
      <button className="btn-primary w-full" onClick={submit} disabled={busy}>
        {busy && <Loader2 size={16} className="animate-spin" />} Crear cuenta
      </button>
      <p className="text-center text-xs text-gris">
        Usa el mismo correo que le has dado al entrenador para vincularte
        automáticamente con tu ficha.
      </p>
      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-marino underline">
          Ya tengo cuenta
        </Link>
      </p>
    </div>
  );
}
