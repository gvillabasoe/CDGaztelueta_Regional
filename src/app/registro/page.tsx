import { Crest } from "@/components/Crest";
import { RegisterForm } from "./RegisterForm";

export const dynamic = "force-dynamic";

export default function RegistroPage() {
  return (
    <div className="flex min-h-screen flex-col bg-marino px-6 py-10 text-beige">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-2xl bg-blanco p-2 shadow-card">
            <Crest size={72} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-wide">
            Crear cuenta de jugador
          </h1>
          <p className="mt-1 font-display text-sm italic text-beige/90">
            Como en casa, en ningún lado
          </p>
        </div>
        <div className="card mt-6 p-5 text-negro">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
