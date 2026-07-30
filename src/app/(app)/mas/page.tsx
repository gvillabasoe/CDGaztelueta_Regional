import Link from "next/link";
import { MessageSquare, User, Settings, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const items = [
  {
    href: "/mas/propuestas",
    label: "Propuestas",
    desc: "Ideas y sugerencias del equipo",
    icon: MessageSquare,
  },
  {
    href: "/mas/perfil",
    label: "Perfil personal",
    desc: "Tu información y valoraciones",
    icon: User,
  },
  {
    href: "/mas/config",
    label: "Configuración",
    desc: "Datos del equipo",
    icon: Settings,
  },
];

export default function MasPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-negro">Más</h1>
      <div className="space-y-2">
        {items.map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="card flex items-center gap-3 p-4 transition hover:bg-beige/60"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-marino/10 text-marino">
              <Icon size={20} />
            </span>
            <div className="flex-1">
              <p className="font-medium text-negro">{label}</p>
              <p className="text-xs text-gris">{desc}</p>
            </div>
            <ChevronRight size={18} className="text-gris" />
          </Link>
        ))}
      </div>
    </div>
  );
}
