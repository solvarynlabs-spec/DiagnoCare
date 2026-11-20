import { NextResponse } from "next/server";
import { confirmSofizPayPayment } from "@/lib/billing/sofizpay";

/** SofizPay sends the student back here after checkout (query string carries the signed result). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const pid = url.searchParams.get("pid") ?? "";
  const origin = process.env.APP_URL || url.origin;
  let outcome: "succeeded" | "failed" | "pending" = "pending";
  try {
    if (pid) outcome = await confirmSofizPayPayment(pid, Object.fromEntries(url.searchParams), "return");
  } catch (e) {
    console.error("SofizPay return error", e);
  }
  return NextResponse.redirect(`${origin.replace(/\/$/, "")}/app/billing?payment=${outcome}`, 303);
}
