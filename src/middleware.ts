import { NextRequest, NextResponse } from "next/server";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  const isCoachPath = pathname.startsWith("/coach");
  const isPlayerPath = pathname.startsWith("/player");
  const isLogin = pathname === "/login";

  // Sin sesión: solo se permite el login.
  if (!session) {
    if (isCoachPath || isPlayerPath) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Con sesión iniciada: el login redirige al home correspondiente.
  const homeFor = session.role === "COACH" ? "/coach/home" : "/player/home";

  if (isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = homeFor;
    return NextResponse.redirect(url);
  }

  // Cada perfil solo accede a sus rutas.
  if (isCoachPath && session.role !== "COACH") {
    const url = req.nextUrl.clone();
    url.pathname = "/player/home";
    return NextResponse.redirect(url);
  }
  if (isPlayerPath && session.role !== "PLAYER") {
    const url = req.nextUrl.clone();
    url.pathname = "/coach/home";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/coach/:path*", "/player/:path*"],
};
