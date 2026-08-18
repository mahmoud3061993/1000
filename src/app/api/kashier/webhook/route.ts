import { NextRequest, NextResponse } from "next/server";
import { KASHIER } from "@/lib/config";
import { getOrder, updateOrder } from "@/lib/db";
import { fulfillPaidOrder } from "@/lib/fulfillment";
import { isKashierSuccess, validateKashierWebhookSignature } from "@/lib/kashier";
import { notifyOrder } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature =
    req.headers.get("x-kashier-signature") ||
    req.headers.get("kashier-signature") ||
    "";

  const valid = validateKashierWebhookSignature(raw, signature, KASHIER.apiKey);
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(raw || "{}");
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const data = (payload.data as Record<string, unknown>) || payload;
  const merchantOrderId = String(
    data.merchantOrderId || data.orderId || payload.merchantOrderId || ""
  );
  const paymentStatus = String(
    data.paymentStatus || data.status || payload.paymentStatus || ""
  );
  const transactionId = String(data.transactionId || payload.transactionId || "");

  if (!merchantOrderId) {
    return NextResponse.json({ ok: false, error: "missing order" }, { status: 400 });
  }

  const order = await getOrder(merchantOrderId);
  if (!order) {
    return NextResponse.json({ ok: false, error: "order not found" }, { status: 404 });
  }

  if (signature && !valid) {
    console.error("Kashier webhook invalid signature");
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  if (isKashierSuccess(paymentStatus)) {
    await fulfillPaidOrder(order, {
      kashier_transaction_id: transactionId || order.kashier_transaction_id,
    });
    return NextResponse.json({ ok: true });
  }

  if (order.status !== "paid") {
    const failed = (await updateOrder(order.id, { status: "failed" }))!;
    await notifyOrder("failed", failed);
  }
  return NextResponse.json({ ok: true });
}
