import { SignJWT, jwtVerify } from "jose";

export type Role = "COACH" | "PLAYER";

export type SessionPayload = {
  userId: string;
  username: string;
  role: Role;
};

export const SESSION_COOKIE = "gaztelueta_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET || "dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: String(payload.userId),
      username: String(payload.username),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}
