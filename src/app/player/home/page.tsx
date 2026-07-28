import { Home } from "lucide-react";

export default function PlayerHomePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-beige text-marino">
        <Home size={28} />
      </span>
      <p className="font-display text-xl font-semibold text-marino">Home</p>
      <p className="max-w-[240px] text-sm text-gris">
        Esta pantalla estará disponible próximamente.
      </p>
    </div>
  );
}
