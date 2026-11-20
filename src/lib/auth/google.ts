import "server-only";
import { createHash, randomBytes } from "crypto";
import { SignJWT, createRemoteJWKSet, jwtVerify } from "jose";

/**
 * « Continuer avec Google » — OAuth 2.0 Authorization Code + PKCE, OpenID Connect.
 * The id_token is verified against Google's published keys (issuer, audience, nonce,
 * expiry, email_verified). No Google SDK and no token storage: we only need identity.
 */

export const GOOGLE_COOKIE = "medsim_google_oauth";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export const googleEnabled = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const b64url = (buf: Buffer) => buf.toString("base64url");
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me-please-0000");

export function redirectUri(origin: string) {
  return `${(process.env.APP_URL || origin).replace(/\/$/, "")}/api/auth/google/callback`;
}

export interface OAuthState {
  state: string;
  verifier: string;
  nonce: string;
  role: "STUDENT" | "TEACHER";
  next?: string;
}

export async function beginGoogle(origin: string, opts: { role: "STUDENT" | "TEACHER"; next?: string }) {
  const st: OAuthState = { state: b64url(randomBytes(24)), verifier: b64url(randomBytes(48)), nonce: b64url(randomBytes(24)), role: opts.role, next: opts.next };
  const challenge = b64url(createHash("sha256").update(st.verifier).digest());
  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state: st.state,
    nonce: st.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  const cookie = await new SignJWT({ ...st }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("10m").sign(secret());
  return { url: url.toString(), cookie };
}

export async function readState(cookie: string | undefined): Promise<OAuthState | null> {
  if (!cookie) return null;
  try {
    const { payload } = await jwtVerify(cookie, secret(), { algorithms: ["HS256"] });
    return payload as unknown as OAuthState;
  } catch {
    return null;
  }
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export async function finishGoogle(origin: string, code: string, st: OAuthState): Promise<GoogleIdentity> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
      code_verifier: st.verifier,
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed (${res.status})`);
  const tokens = (await res.json()) as { id_token?: string };
  if (!tokens.id_token) throw new Error("Google did not return an id_token");
  const { payload } = await jwtVerify(tokens.id_token, JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: process.env.GOOGLE_CLIENT_ID!,
  });
  if (payload.nonce !== st.nonce) throw new Error("Invalid nonce");
  if (!payload.email || payload.email_verified !== true) throw new Error("Google e-mail not verified");
  return { sub: String(payload.sub), email: String(payload.email).toLowerCase(), name: String(payload.name ?? payload.email), picture: payload.picture as string | undefined };
}
