import { SignJWT, jwtVerify } from "jose";
import { createHash } from "node:crypto";

/**
 * Stateless password-reset tokens. The token embeds a fingerprint of the current password
 * hash, so it stops working as soon as the password changes (single use) and after 30 min.
 */
function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set (min 32 chars)");
    return new TextEncoder().encode("dev-only-insecure-secret-change-me-please-0000:reset");
  }
  return new TextEncoder().encode(`${s}:reset`);
}
const fp = (hash: string) => createHash("sha256").update(hash).digest("base64url").slice(0, 16);

export async function signResetToken(userId: string, passwordHash: string) {
  return new SignJWT({ fp: fp(passwordHash), purpose: "reset" }).setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt().setExpirationTime("30m").sign(secret());
}

export async function readResetToken(token: string): Promise<{ userId: string; fp: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.purpose !== "reset" || !payload.sub || typeof payload.fp !== "string") return null;
    return { userId: payload.sub, fp: payload.fp };
  } catch {
    return null;
  }
}
export const matchesFingerprint = (hash: string, f: string) => fp(hash) === f;

/** Sends the e-mail through Resend when RESEND_API_KEY is set; otherwise demo mode (logged). */
export async function sendResetEmail(to: string, name: string, link: string, lang: "fr" | "en" = "fr"): Promise<"sent" | "demo"> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[demo e-mail] Réinitialisation pour ${to} : ${link}`);
    return "demo";
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "DiagnoCare <no-reply@medsim.app>",
      to,
      subject: lang === "en" ? "Reset your DiagnoCare password" : "Réinitialiser votre mot de passe DiagnoCare",
      text:
        lang === "en"
          ? `Hello ${name},\n\nTo choose a new password, open this link (valid for 30 minutes):\n${link}\n\nIf you didn't request this, ignore this message.\n\nThe DiagnoCare team`
          : `Bonjour ${name},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable 30 minutes) :\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\nL'équipe DiagnoCare`,
    }),
  });
  if (!r.ok) throw new Error("Envoi de l'e-mail impossible pour le moment");
  return "sent";
}
