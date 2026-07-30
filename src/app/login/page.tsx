import { Crest } from "@/components/Crest";
import { TeamPhoto } from "@/components/TeamPhoto";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-marino px-6 py-10 text-beige">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-2xl bg-blanco p-2 shadow-card">
            <Crest size={84} />
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-wide">
            CD Gaztelueta
          </h1>
          <p className="mt-1 font-display text-base italic text-beige/90">
            Como en casa, en ningún lado
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-dorado">
            Área privada del equipo
          </p>
        </div>

        <div className="mt-7">
          <TeamPhoto />
        </div>

        <div className="card mt-6 p-5 text-negro">
          <p className="eyebrow mb-3">Iniciar sesión</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
