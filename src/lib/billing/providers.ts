import "server-only";
import { prisma } from "@/lib/db";
import type { PlanDef } from "./plans";
import { SOFIZPAY_ACCOUNT, buildCibCheckoutUrl, isValidSofizPayAccount } from "./sofizpay";

export interface CheckoutResult {
  status: "succeeded" | "redirect";
  providerRef: string;
  redirectUrl?: string;
}

/**
 * Payment provider abstraction. The demo provider records simulated payments so the
 * whole subscription flow is exercisable without credentials. A real provider (e.g.
 * Stripe Checkout + webhooks) implements the same interface; webhooks then call
 * `activateSubscription` on `checkout.session.completed` / `invoice.paid`.
 */
export interface PaymentProvider {
  id: string;
  label: string;
  live: boolean;
  checkout(input: { userId: string; email: string; name: string; phone?: string; origin: string; plan: PlanDef; interval: "MONTH" | "YEAR" }): Promise<CheckoutResult>;
  /** Needs the payer's mobile number before redirecting. */
  needsPhone?: boolean;
  cancel(providerRef: string | null): Promise<void>;
}

const demoProvider: PaymentProvider = {
  id: "demo",
  label: "Paiements de démonstration (aucun débit)",
  live: false,
  async checkout({ userId, plan, interval }) {
    return { status: "succeeded", providerRef: `demo_${plan.key.toLowerCase()}_${interval.toLowerCase()}_${userId.slice(-6)}_${Date.now()}` };
  },
  async cancel() {},
};

const stripeProvider: PaymentProvider = {
  id: "stripe",
  label: "Stripe",
  live: true,
  async checkout() {
    // Integration point: create a Stripe Checkout Session with the plan's price id and
    // return { status: "redirect", redirectUrl: session.url }. Requires STRIPE_SECRET_KEY,
    // price ids per plan and a webhook endpoint at /api/billing/webhook.
    throw new Error("Stripe is not configured. Set PAYMENT_PROVIDER=demo or complete the Stripe integration.");
  },
  async cancel() {
    throw new Error("Stripe is not configured.");
  },
};

/**
 * SofizPay: CIB / Edahabia cards via SATIM, credited to the merchant SofizPay account.
 * Creates a PENDING payment, then redirects to SofizPay's hosted checkout. The plan is
 * activated by /api/billing/sofizpay/{webhook,return} once SofizPay's signature is verified.
 */
const sofizpayProvider: PaymentProvider = {
  id: "sofizpay",
  label: "SofizPay (CIB / Edahabia)",
  live: true,
  needsPhone: true,
  async checkout({ userId, email, name, phone, origin, plan, interval }) {
    if (!phone) throw new Error("Numéro de téléphone requis pour le paiement SofizPay.");
    const amountDA = interval === "YEAR" ? plan.priceYearly : plan.priceMonthly;
    const payment = await prisma.payment.create({
      data: { userId, amountCents: amountDA * 100, currency: "DZD", plan: plan.key, status: "PENDING", provider: "sofizpay", description: `${plan.name} — ${interval === "YEAR" ? "annuel" : "mensuel"} (SofizPay)` },
    });
    const base = origin.replace(/\/$/, "");
    const redirectUrl = buildCibCheckoutUrl({
      amountDA,
      fullName: name,
      phone,
      email,
      memo: `DiagnoCare ${plan.name} ${payment.id}`,
      returnUrl: `${base}/api/billing/sofizpay/return?pid=${payment.id}`,
      // SofizPay must be able to reach the webhook, so only send it from a public HTTPS origin.
      webhookUrl: base.startsWith("https://") ? `${base}/api/billing/sofizpay/webhook?pid=${payment.id}` : undefined,
    });
    return { status: "redirect", providerRef: payment.id, redirectUrl };
  },
  async cancel() {
    // One-off payments: nothing recurring to cancel at SofizPay.
  },
};

export function paymentProvider(): PaymentProvider {
  const choice = process.env.PAYMENT_PROVIDER;
  if (choice === "demo") return demoProvider;
  if (choice === "stripe" && process.env.STRIPE_SECRET_KEY) return stripeProvider;
  if (isValidSofizPayAccount(SOFIZPAY_ACCOUNT)) return sofizpayProvider;
  return demoProvider;
}
