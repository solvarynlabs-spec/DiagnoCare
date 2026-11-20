import { SignJWT, jwtVerify } from "jose";

/** Edge-safe JWT helpers (used by middleware and server code). */
export const SESSION_COOKIE = "medsim_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SessionClaims {
  sub: string;
  role: string;
  name: string;
}

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set (min 32 chars)");
    return new TextEncoder().encode("dev-only-insecure-secret-change-me-please-0000");
  }
  return new TextEncoder().encode(s);
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role, name: claims.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.role !== "string") return null;
    return { sub: payload.sub, role: payload.role, name: String(payload.name ?? "") };
  } catch {
    return null;
  }
}
