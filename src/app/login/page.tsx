import { Crest } from "@/components/Crest";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-marino px-6 py-10 text-beige">
      <div className="mb-8 flex flex-col items-center text-center">
        <Crest size={76} />
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-wide">
          CD Gaztelueta
        </h1>
        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-dorado">
          Seguimiento del equipo
        </p>
      </div>

      <div className="card p-5 text-negro">
        <LoginForm />
      </div>
    </div>
  );
}
