import "server-only";
import { createHash, createVerify } from "node:crypto";
import { prisma } from "@/lib/db";
import { audit, notify } from "@/lib/audit";
import { planByKey } from "./plans";

/**
 * SofizPay (https://sofizpay.com) — Algerian CIB / Edahabia card payments through SATIM.
 *
 * Flow: the student is sent to SofizPay's hosted `make-cib-transaction` page, pays with their
 * card, and the money is credited to the merchant SofizPay account below. SofizPay then calls
 * our webhook and redirects the student to our return URL; both carry a `message` signed by
 * SofizPay (RSA / SHA-256). A subscription is only activated after that signature checks out.
 */

/** Merchant SofizPay account (public receiving address — not a secret). Override with SOFIZPAY_ACCOUNT. */
export const SOFIZPAY_ACCOUNT = process.env.SOFIZPAY_ACCOUNT || "GCBOEMS52WXFD2IC2YUJVQI74TTP3RBETE74TM6ZHGQL3R4B43RMMMKI";

const CIB_URL = "https://www.sofizpay.com/make-cib-transaction/";

/**
 * SofizPay signing keys. The first is the one the official JS SDK (sofizpay-sdk-js) verifies
 * webhook signatures with; the second is the one SofizPay's MCP server documents for webhooks.
 */
const SOFIZPAY_PUBLIC_KEYS = [
  `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1N+bDPxpqeB9QB0affr/
02aeRXAAnqHuLrgiUlVNdXtF7t+2w8pnEg+m9RRlc+4YEY6UyKTUjVe6k7v2p8Jj
UItk/fMNOEg/zY222EbqsKZ2mF4hzqgyJ3QHPXjZEEqABkbcYVv4ZyV2Wq0x0ykI
+Hy/5YWKeah4RP2uEML1FlXGpuacnMXpW6n36dne3fUN+OzILGefeRpmpnSGO5+i
JmpF2mRdKL3hs9WgaLSg6uQyrQuJA9xqcCpUmpNbIGYXN9QZxjdyRGnxivTE8awx
THV3WRcKrP2krz3ruRGF6yP6PVHEuPc0YDLsYjV5uhfs7JtIksNKhRRAQ16bAsj/
9wIDAQAB
-----END PUBLIC KEY-----`,
  `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv9toBr7vZ4XIkVzlzdGR
vNVaKw7A9Z3/Vnq3bK8fLaaUTmoweL3CEKSbz1lxYUjzuRzY/nmDuCpPS/7t0i5c
kWRifPaPgIoiUFr1fGLzjN+cttxtvbPQof2Zuxllbq5ox+XyZpc1eo8PjwhRobCB
djDZ1iSV1VkhOWanrnNXeXFzUnRYHQUZmQ8FWOFQ8D9vUZanmq/ZJ6nJ4SZoj2lV
dKrLBbh/MWtn9MmyrPrywoJYCnc7c+ylJIWnAhNv4jTafB5bqDTd6oSElV9lQqPf
diO93j+Q/uBoAZQZ2EqWY0E4Ooz4Dd9dHl7EiNiAh19G9VTcBFN/QfXOdyCGajwC
WwIDAQAB
-----END PUBLIC KEY-----`,
];

export function isValidSofizPayAccount(a: string) {
  return /^G[A-Z2-7]{55}$/.test(a);
}

/** Algerian mobile number → 0XXXXXXXXX, or null. */
export function normalizeDzPhone(raw: string): string | null {
  const d = raw.replace(/[\s.\-()]/g, "").replace(/^(\+|00)213/, "0");
  return /^0[5-7]\d{8}$/.test(d) ? d : null;
}

export function buildCibCheckoutUrl(input: { amountDA: number; fullName: string; phone: string; email: string; memo: string; returnUrl: string; webhookUrl?: string }) {
  const p = new URLSearchParams({
    account: SOFIZPAY_ACCOUNT,
    amount: String(input.amountDA),
    full_name: input.fullName,
    phone: input.phone,
    email: input.email,
    memo: input.memo,
    return_url: input.returnUrl,
    redirect: "yes",
    keep_return_url: "True",
    language: "fr",
  });
  if (input.webhookUrl) p.set("webhook_url", input.webhookUrl);
  return `${CIB_URL}?${p.toString()}`;
}

/** Verify a SofizPay signature (base64 or base64url, RSA PKCS#1 v1.5 + SHA-256). */
export function verifySofizPaySignature(message: string, signature: string): boolean {
  if (!message || !signature) return false;
  let b64 = signature.trim().replace(/ /g, "+").replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const sig = Buffer.from(b64, "base64");
  return SOFIZPAY_PUBLIC_KEYS.some((key) => {
    try {
      return createVerify("RSA-SHA256").update(message, "utf8").verify(key, sig);
    } catch {
      return false;
    }
  });
}

export type ConfirmOutcome = "succeeded" | "failed" | "pending";

/** Fields SofizPay sends on the return URL and the webhook (names vary slightly between the two). */
export function pickCallbackFields(src: Record<string, unknown>) {
  const s = (k: string) => (typeof src[k] === "string" || typeof src[k] === "number" ? String(src[k]) : "");
  return {
    message: s("message"),
    signature: s("signature") || s("signature_url_safe"),
    orderNumber: s("order_number") || s("orderNumber") || s("cib_transaction_id"),
    status: (s("payment_status") || s("status")).toLowerCase(),
  };
}

/**
 * Settle a pending SofizPay payment from a callback. Activation requires, all together:
 *  1. a valid SofizPay signature over `message`;
 *  2. the signed message reporting success and carrying this payment's amount
 *     (so a genuine message from another, cheaper SofizPay payment cannot be replayed);
 *  3. that signed message never having settled another payment before.
 * Anything short of that leaves the payment PENDING and is written to the audit log for review.
 */
export async function confirmSofizPayPayment(paymentId: string, raw: Record<string, unknown>, via: "return" | "webhook"): Promise<ConfirmOutcome> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.provider !== "sofizpay") return "pending";
  if (payment.status === "SUCCEEDED") return "succeeded";
  if (payment.status === "FAILED") return "failed";

  const f = pickCallbackFields(raw);
  const signed = verifySofizPaySignature(f.message, f.signature);
  const msg = f.message.toLowerCase();
  const amounts = (f.message.match(/\d+/g) ?? []).map(Number);
  const amountDA = payment.amountCents / 100;
  const amountOk = amounts.includes(payment.amountCents) || amounts.includes(amountDA);
  const reportsSuccess = /success|approved|accepted/.test(msg) && !/fail|declin|cancel|reject/.test(msg);
  const reportsFailure = /fail|declin|cancel|reject/.test(msg);

  if (!signed) {
    await audit("billing.sofizpay.unverified", { userId: payment.userId, entity: "Payment", entityId: payment.id, meta: { via, reason: "bad_signature", ...f, signature: f.signature ? "[present]" : "" } });
    return "pending";
  }

  if (reportsFailure) {
    await prisma.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "FAILED" } });
    await audit("billing.sofizpay.failed", { userId: payment.userId, entity: "Payment", entityId: payment.id, meta: { via, orderNumber: f.orderNumber } });
    return "failed";
  }

  if (!reportsSuccess || !amountOk) {
    await audit("billing.sofizpay.unverified", { userId: payment.userId, entity: "Payment", entityId: payment.id, meta: { via, reason: !reportsSuccess ? "status_unclear" : "amount_mismatch", message: f.message, orderNumber: f.orderNumber, expectedDA: amountDA } });
    return "pending";
  }

  const ref = `sofizpay:${f.orderNumber || createHash("sha256").update(f.signature).digest("hex").slice(0, 32)}`;
  const reused = await prisma.payment.findFirst({ where: { providerRef: ref, NOT: { id: payment.id } } });
  if (reused) {
    await audit("billing.sofizpay.replay", { userId: payment.userId, entity: "Payment", entityId: payment.id, meta: { via, ref, otherPayment: reused.id } });
    return "pending";
  }

  // Only the first callback (return or webhook) to get here activates the plan.
  const won = await prisma.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "SUCCEEDED", providerRef: ref } });
  if (won.count === 0) return "succeeded";

  const plan = planByKey(payment.plan);
  const interval: "MONTH" | "YEAR" = amountDA === plan.priceYearly && plan.priceYearly !== plan.priceMonthly ? "YEAR" : "MONTH";
  const current = await prisma.subscription.findUnique({ where: { userId: payment.userId } });
  const from = current?.plan === plan.key && current.currentPeriodEnd && current.currentPeriodEnd > new Date() ? current.currentPeriodEnd : new Date();
  const periodEnd = new Date(from.getTime() + (interval === "YEAR" ? 365 : 30) * 864e5);
  await prisma.subscription.upsert({
    where: { userId: payment.userId },
    create: { userId: payment.userId, plan: plan.key, status: "ACTIVE", interval, provider: "sofizpay", providerRef: ref, currentPeriodEnd: periodEnd },
    update: { plan: plan.key, status: "ACTIVE", interval, provider: "sofizpay", providerRef: ref, currentPeriodEnd: periodEnd },
  });
  await notify(payment.userId, `Paiement reçu — formule ${plan.name} activée`, "Merci ! Vos nouvelles fonctionnalités sont disponibles.", "/app/billing");
  await audit("billing.upgrade", { userId: payment.userId, entity: "Payment", entityId: payment.id, meta: { plan: plan.key, interval, provider: "sofizpay", via, ref } });
  return "succeeded";
}
