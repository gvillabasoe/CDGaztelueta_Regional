import "server-only";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SessionPayload,
  createToken,
  verifyToken,
} from "@/lib/auth";

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function startSession(payload: SessionPayload) {
  const token = await createToken(payload);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function endSession() {
  cookies().delete(SESSION_COOKIE);
}
