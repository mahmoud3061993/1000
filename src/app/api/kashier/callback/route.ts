import { NextRequest, NextResponse } from "next/server";
import { KASHIER } from "@/lib/config";
import { getOrder, updateOrder } from "@/lib/db";
import { fulfillPaidOrder } from "@/lib/fulfillment";
import {
  isKashierSuccess,
  readCallbackFields,
  validateKashierCallbackSignature,
} from "@/lib/kashier";
import { notifyOrder } from "@/lib/telegram";

export const runtime = "nodejs";

function redirectTo(path: string, req: NextRequest) {
  const url = new URL(path, req.nextUrl.origin);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams;
  const fields = readCallbackFields(search);
  const orderId = fields.merchantOrderId || fields.orderId;
  const valid = validateKashierCallbackSignature(search, KASHIER.apiKey);

  if (!orderId) {
    return redirectTo("/thank-you?error=missing_order", req);
  }

  const order = getOrder(orderId);
  if (!order) {
    return redirectTo("/thank-you?error=order_not_found", req);
  }

  if (!valid) {
    console.error("Kashier callback invalid signature", fields);
    return redirectTo(`/thank-you?order=${order.id}&error=signature`, req);
  }

  if (isKashierSuccess(fields.paymentStatus)) {
    const paid = await fulfillPaidOrder(order, {
      kashier_order_id: fields.orderId || order.kashier_order_id,
      kashier_transaction_id: fields.transactionId,
    });
    return redirectTo(`/thank-you?order=${paid?.id || order.id}`, req);
  }

  const failed = updateOrder(order.id, { status: "failed" })!;
  await notifyOrder("failed", failed);
  return redirectTo(`/thank-you?order=${order.id}&error=failed`, req);
}
