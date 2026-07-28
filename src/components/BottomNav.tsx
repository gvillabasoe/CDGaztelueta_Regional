"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Trophy,
  ClipboardList,
  Users,
  User,
  type LucideIcon,
} from "lucide-react";

type Item = { href: string; label: string; icon: LucideIcon };

const COACH: Item[] = [
  { href: "/coach/home", label: "Home", icon: Home },
  { href: "/coach/liga", label: "Liga", icon: Trophy },
  { href: "/coach/registro", label: "Registro", icon: ClipboardList },
  { href: "/coach/equipo", label: "Mi Equipo", icon: Users },
];

const PLAYER: Item[] = [
  { href: "/player/home", label: "Home", icon: Home },
  { href: "/player/liga", label: "Liga", icon: Trophy },
  { href: "/player/perfil", label: "Mi Perfil", icon: User },
];

export function BottomNav({ role }: { role: "coach" | "player" }) {
  const pathname = usePathname();
  const items = role === "coach" ? COACH : PLAYER;

  return (
    <nav className="sticky bottom-0 z-20 border-t border-marino/10 bg-blanco">
      <ul
        className="mx-auto grid max-w-[480px]"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className={
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition " +
                  (active ? "text-marino" : "text-gris hover:text-marino")
                }
              >
                <span
                  className={
                    "flex h-8 w-8 items-center justify-center rounded-full transition " +
                    (active ? "bg-dorado/20" : "")
                  }
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
