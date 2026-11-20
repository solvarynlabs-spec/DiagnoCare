import { NextResponse } from "next/server";
import { confirmSofizPayPayment } from "@/lib/billing/sofizpay";

/** Server-to-server payment notification from SofizPay (JSON or form body, signed `message`). */
export async function POST(req: Request) {
  const url = new URL(req.url);
  let body: Record<string, unknown> = {};
  try {
    const type = req.headers.get("content-type") ?? "";
    if (type.includes("application/json")) body = (await req.json()) as Record<string, unknown>;
    else body = Object.fromEntries((await req.formData()).entries()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const pid = url.searchParams.get("pid") ?? "";
  if (!pid) return NextResponse.json({ error: "Missing pid" }, { status: 400 });
  try {
    const outcome = await confirmSofizPayPayment(pid, { ...Object.fromEntries(url.searchParams), ...body }, "webhook");
    return NextResponse.json({ ok: true, outcome });
  } catch (e) {
    console.error("SofizPay webhook error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
