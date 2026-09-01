"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Trophy,
  CalendarDays,
  Users,
  Wallet,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

type Item = { href: string; label: string; icon: LucideIcon };

// Mismo menú para entrenador y jugador (los permisos se aplican dentro).
const ITEMS: Item[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/liga", label: "Liga", icon: Trophy },
  { href: "/planificacion", label: "Planif.", icon: CalendarDays },
  { href: "/equipo", label: "Equipo", icon: Users },
  { href: "/multas", label: "Multas", icon: Wallet },
  { href: "/mas", label: "Más", icon: MoreHorizontal },
];

export function BottomNav({ fineDebt = false }: { fineDebt?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-20 border-t border-marino/10 bg-blanco">
      <ul className="grid grid-cols-6">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className={
                  "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition " +
                  (active ? "text-marino" : "text-gris hover:text-marino")
                }
              >
                <span
                  className={
                    "relative flex h-8 w-8 items-center justify-center rounded-full transition " +
                    (active ? "bg-dorado/20" : "")
                  }
                >
                  <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                  {/* Aviso personal: solo si el propio usuario tiene deuda. */}
                  {href === "/multas" && fineDebt && (
                    <span
                      role="status"
                      aria-label="Tienes multas pendientes"
                      title="Tienes multas pendientes"
                      className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-blanco"
                    />
                  )}
                </span>
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
