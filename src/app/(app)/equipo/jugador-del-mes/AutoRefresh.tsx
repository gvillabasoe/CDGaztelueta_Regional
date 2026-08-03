"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

// Refresco automático periódico: la clasificación se actualiza para todos los
// usuarios mientras la votación está abierta, sin recargar manualmente.
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  React.useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
